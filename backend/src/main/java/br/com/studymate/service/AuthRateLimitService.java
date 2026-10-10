package br.com.studymate.service;

import br.com.studymate.exception.AuthProtectionUnavailableException;
import br.com.studymate.model.AuthRateLimitBucket;
import br.com.studymate.repository.AuthRateLimitRepository;
import jakarta.persistence.PersistenceException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionException;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
public class AuthRateLimitService {
    public enum Operation { LOGIN, REGISTER, VERIFY, EMAIL_CHANGE }

    public record Decision(boolean allowed, long retryAfterSeconds) {
    }

    public record Limits(int account, int origin, int global) {
        public Limits {
            if (account <= 0 || origin <= 0 || global <= 0) {
                throw new IllegalArgumentException("Authentication attempt limits must be positive.");
            }
        }
    }

    private final AuthRateLimitRepository repository;
    private final TransactionTemplate acquisition;
    private final Clock clock;
    private final Duration window;
    private final int maxBucketsPerOperation;
    private final Map<Operation, Limits> limits;

    @Autowired
    public AuthRateLimitService(AuthRateLimitRepository repository, PlatformTransactionManager transactionManager,
            Clock clock,
            @Value("${app.auth-rate-limit.window-seconds:60}") long windowSeconds,
            @Value("${app.auth-rate-limit.max-buckets-per-operation:10000}") int maxBucketsPerOperation,
            @Value("${app.auth-rate-limit.login.account-limit:5}") int loginAccount,
            @Value("${app.auth-rate-limit.login.origin-limit:20}") int loginOrigin,
            @Value("${app.auth-rate-limit.login.global-limit:200}") int loginGlobal,
            @Value("${app.auth-rate-limit.register.account-limit:3}") int registerAccount,
            @Value("${app.auth-rate-limit.register.origin-limit:5}") int registerOrigin,
            @Value("${app.auth-rate-limit.register.global-limit:40}") int registerGlobal,
            @Value("${app.auth-rate-limit.verify.account-limit:5}") int verifyAccount,
            @Value("${app.auth-rate-limit.verify.origin-limit:20}") int verifyOrigin,
            @Value("${app.auth-rate-limit.verify.global-limit:200}") int verifyGlobal,
            @Value("${app.auth-rate-limit.email-change.account-limit:3}") int emailChangeAccount,
            @Value("${app.auth-rate-limit.email-change.origin-limit:5}") int emailChangeOrigin,
            @Value("${app.auth-rate-limit.email-change.global-limit:40}") int emailChangeGlobal) {
        this(repository, transactionManager, clock, Duration.ofSeconds(windowSeconds), maxBucketsPerOperation,
                Map.of(Operation.LOGIN, new Limits(loginAccount, loginOrigin, loginGlobal),
                        Operation.REGISTER, new Limits(registerAccount, registerOrigin, registerGlobal),
                        Operation.VERIFY, new Limits(verifyAccount, verifyOrigin, verifyGlobal),
                        Operation.EMAIL_CHANGE, new Limits(emailChangeAccount, emailChangeOrigin, emailChangeGlobal)));
    }

    public AuthRateLimitService(AuthRateLimitRepository repository, PlatformTransactionManager transactionManager,
            Clock clock, Duration window, int maxBucketsPerOperation, Map<Operation, Limits> limits) {
        if (window.isNegative() || window.isZero() || window.getNano() != 0 || maxBucketsPerOperation < 2) {
            throw new IllegalArgumentException("Invalid authentication attempt window or bucket capacity.");
        }
        this.repository = Objects.requireNonNull(repository);
        this.clock = Objects.requireNonNull(clock);
        this.window = window;
        this.maxBucketsPerOperation = maxBucketsPerOperation;
        this.limits = Map.copyOf(limits);
        for (Operation operation : Operation.values()) {
            Objects.requireNonNull(this.limits.get(operation), "A limit is required for each authentication operation.");
        }
        this.acquisition = new TransactionTemplate(transactionManager);
        acquisition.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        acquisition.setTimeout(10);
    }

    /**
     * The origin must come from the trusted connection, never an arbitrary forwarded header.
     * Returns only after the independent transaction commits, including rejected attempts.
     * Callers may throw TooManyAuthAttemptsException after receiving a denied decision.
     */
    public Decision acquire(Operation operation, String origin, String account) {
        Objects.requireNonNull(operation);
        String originKey = opaqueKey(operation, "ORIGIN", Objects.requireNonNull(origin).trim());
        String accountKey = opaqueKey(operation, "ACCOUNT",
                Objects.requireNonNull(account).trim().toLowerCase(Locale.ROOT));
        try {
            return Objects.requireNonNull(acquisition.execute(status ->
                    acquireWithinTransaction(operation, originKey, accountKey)));
        } catch (DataAccessException | TransactionException | PersistenceException failure) {
            // Database failures must never silently turn this protection into a node-local budget.
            throw new AuthProtectionUnavailableException(failure);
        }
    }

    private Decision acquireWithinTransaction(Operation operation, String originKey, String accountKey) {
        String globalKey = operation.name() + ":GLOBAL";
        // A permanent shared row serializes lookup, capacity checks and all charges for an operation.
        AuthRateLimitBucket global = repository.lockGlobal(globalKey)
                .orElseThrow(AuthProtectionUnavailableException::new);
        if (!operation.name().equals(global.getOperation())) {
            throw new AuthProtectionUnavailableException();
        }
        OffsetDateTime now = OffsetDateTime.ofInstant(clock.instant(), ZoneOffset.UTC);
        repository.deleteExpired(operation.name(), globalKey, now);
        if (!global.getWindowEnd().isAfter(now)) {
            global.restart(now.plus(window));
        }
        Limits operationLimits = limits.get(operation);
        // No new attacker-controlled keys are allocated after the shared global budget is exhausted.
        if (global.getAttempts() >= operationLimits.global()) {
            return denied(now, global.getWindowEnd());
        }

        AuthRateLimitBucket origin = repository.findById(originKey).orElse(null);
        AuthRateLimitBucket account = repository.findById(accountKey).orElse(null);
        int missing = (origin == null ? 1 : 0) + (account == null ? 1 : 0);
        if (repository.countActive(operation.name(), globalKey) + missing > maxBucketsPerOperation) {
            global.charge(operationLimits.global());
            if (origin != null) {
                origin.charge(operationLimits.origin());
            }
            if (account != null) {
                account.charge(operationLimits.account());
            }
            OffsetDateTime latestExpiry = repository.latestExpiry(operation.name(), globalKey);
            OffsetDateTime retryAt = latestExpiry == null ? global.getWindowEnd() : latestExpiry;
            if (global.getAttempts() >= operationLimits.global() && global.getWindowEnd().isAfter(retryAt)) {
                retryAt = global.getWindowEnd();
            }
            return denied(now, retryAt);
        }
        if (origin == null) {
            origin = repository.save(new AuthRateLimitBucket(originKey, operation.name(), now.plus(window)));
        }
        if (account == null) {
            account = repository.save(new AuthRateLimitBucket(accountKey, operation.name(), now.plus(window)));
        }

        boolean allowed = origin.getAttempts() < operationLimits.origin()
                && account.getAttempts() < operationLimits.account();
        // Failed credentials and rejected requests consume every available budget; counters saturate.
        global.charge(operationLimits.global());
        origin.charge(operationLimits.origin());
        account.charge(operationLimits.account());
        if (allowed) {
            return new Decision(true, 0);
        }
        OffsetDateTime blockingExpiry = now;
        if (global.getAttempts() >= operationLimits.global()) {
            blockingExpiry = global.getWindowEnd();
        }
        if (origin.getAttempts() >= operationLimits.origin() && origin.getWindowEnd().isAfter(blockingExpiry)) {
            blockingExpiry = origin.getWindowEnd();
        }
        if (account.getAttempts() >= operationLimits.account() && account.getWindowEnd().isAfter(blockingExpiry)) {
            blockingExpiry = account.getWindowEnd();
        }
        return denied(now, blockingExpiry);
    }

    private static Decision denied(OffsetDateTime now, OffsetDateTime until) {
        Duration remaining = Duration.between(now, until);
        long seconds = remaining.getSeconds() + (remaining.getNano() == 0 ? 0 : 1);
        return new Decision(false, Math.max(1, seconds));
    }

    private static String opaqueKey(Operation operation, String kind, String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return operation.name() + ":" + kind + ":" + HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException("SHA-256 is unavailable.", impossible);
        }
    }
}
