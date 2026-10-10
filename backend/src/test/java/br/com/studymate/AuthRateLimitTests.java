package br.com.studymate;

import br.com.studymate.exception.AuthProtectionUnavailableException;
import br.com.studymate.exception.TooManyAuthAttemptsException;
import br.com.studymate.repository.AuthRateLimitRepository;
import br.com.studymate.service.AuthRateLimitService;
import br.com.studymate.service.AuthRateLimitService.Decision;
import br.com.studymate.service.AuthRateLimitService.Limits;
import br.com.studymate.service.AuthRateLimitService.Operation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:auth_rate_limit_tests;MODE=Oracle;DB_CLOSE_DELAY=-1",
        "app.auth-rate-limit.window-seconds=60",
        "app.auth-rate-limit.max-buckets-per-operation=10000",
        "app.auth-rate-limit.login.account-limit=5",
        "app.auth-rate-limit.login.origin-limit=20",
        "app.auth-rate-limit.login.global-limit=200",
        "app.auth-rate-limit.register.account-limit=3",
        "app.auth-rate-limit.register.origin-limit=5",
        "app.auth-rate-limit.register.global-limit=40",
        "app.auth-rate-limit.verify.account-limit=5",
        "app.auth-rate-limit.verify.origin-limit=20",
        "app.auth-rate-limit.verify.global-limit=200",
        "app.auth-rate-limit.email-change.account-limit=3",
        "app.auth-rate-limit.email-change.origin-limit=5",
        "app.auth-rate-limit.email-change.global-limit=40"
})
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class AuthRateLimitTests {
    @Autowired AuthRateLimitService service;
    @Autowired AuthRateLimitRepository repository;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired JdbcTemplate jdbc;
    @Autowired MutableClock clock;

    @TestConfiguration
    static class TimeConfiguration {
        @Bean
        @Primary
        MutableClock authAttemptTestClock() {
            return new MutableClock();
        }
    }

    static class MutableClock extends Clock {
        private final AtomicReference<Instant> instant = new AtomicReference<>(Instant.parse("2026-10-05T12:00:00Z"));

        void set(Instant value) {
            instant.set(value);
        }

        void advance(Duration duration) {
            instant.updateAndGet(value -> value.plus(duration));
        }

        @Override public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override public Instant instant() {
            return instant.get();
        }
    }

    @BeforeEach
    void resetBudgets() {
        clock.set(Instant.parse("2026-10-05T12:00:00Z"));
        jdbc.update("DELETE FROM auth_rate_limit_bucket");
        for (Operation operation : Operation.values()) {
            jdbc.update("INSERT INTO auth_rate_limit_bucket(bucket_key, operation, attempts, window_end) VALUES (?, ?, 0, ?)",
                    operation.name() + ":GLOBAL", operation.name(),
                    OffsetDateTime.ofInstant(clock.instant().minusSeconds(1), ZoneOffset.UTC));
        }
    }

    @Test
    void normalizesAccountAndStoresOnlyOpaqueKeys() {
        for (int attempt = 0; attempt < 5; attempt++) {
            assertTrue(service.acquire(Operation.LOGIN, "192.0.2.10", " User@EXAMPLE.com ").allowed());
        }
        Decision rejected = service.acquire(Operation.LOGIN, "192.0.2.10", "user@example.COM");
        assertFalse(rejected.allowed());
        assertEquals(60, rejected.retryAfterSeconds());
        List<String> keys = jdbc.queryForList(
                "SELECT bucket_key FROM auth_rate_limit_bucket WHERE operation = 'LOGIN'", String.class);
        assertEquals(3, keys.size());
        for (String key : keys) {
            assertTrue(key.equals("LOGIN:GLOBAL") || key.matches("LOGIN:(ACCOUNT|ORIGIN):[0-9a-f]{64}"));
            assertFalse(key.contains("user@"));
            assertFalse(key.contains("192.0.2.10"));
        }
        assertEquals(5, attempts("LOGIN", "ACCOUNT"));
        assertEquals(6, attempts("LOGIN", "ORIGIN"));
        assertEquals(6, attempts("LOGIN", "GLOBAL"));
    }

    @Test
    void expiredBudgetsAreReclaimedAtBoundaryAndRetryAfterRoundsUp() {
        for (int i = 0; i < 3; i++) {
            assertTrue(service.acquire(Operation.REGISTER, "192.0.2.11", "new@example.com").allowed());
        }
        clock.advance(Duration.ofMillis(59_001));
        assertEquals(1, service.acquire(Operation.REGISTER, "192.0.2.11", "new@example.com").retryAfterSeconds());
        clock.advance(Duration.ofMillis(999));
        Decision allowed = service.acquire(Operation.REGISTER, "192.0.2.12", "other@example.com");
        assertTrue(allowed.allowed());
        assertEquals(0, allowed.retryAfterSeconds());
        assertEquals(3, operationRows("REGISTER"));
        assertEquals(1, attempts("REGISTER", "GLOBAL"));
    }

    @Test
    void allOperationsApplyTheirIndependentAccountBudgets() {
        for (Operation operation : Operation.values()) {
            int accountLimit = operation == Operation.REGISTER || operation == Operation.EMAIL_CHANGE ? 3 : 5;
            for (int i = 0; i < accountLimit; i++) {
                assertTrue(service.acquire(operation, "192.0.2.13", "same@example.com").allowed());
            }
            assertFalse(service.acquire(operation, "192.0.2.14", "same@example.com").allowed());
        }
    }

    @Test
    void originBudgetStopsSprayingDifferentAccounts() {
        for (int i = 0; i < 20; i++) {
            assertTrue(service.acquire(Operation.LOGIN, "192.0.2.15", "user" + i + "@example.com").allowed());
        }
        assertFalse(service.acquire(Operation.LOGIN, "192.0.2.15", "another@example.com").allowed());
        assertEquals(20, attempts("LOGIN", "ORIGIN"));
    }

    @Test
    void globalBudgetStopsDistributedTrafficAndAllocatesNoMoreKeys() {
        Map<Operation, Limits> smallGlobalLimits = Map.of(
                Operation.LOGIN, new Limits(5, 20, 4),
                Operation.REGISTER, new Limits(3, 5, 40),
                Operation.VERIFY, new Limits(5, 20, 200),
                Operation.EMAIL_CHANGE, new Limits(3, 5, 40));
        AuthRateLimitService smallGlobal = new AuthRateLimitService(
                repository, transactionManager, clock, Duration.ofSeconds(60), 10_000, smallGlobalLimits);
        for (int i = 0; i < 4; i++) {
            assertTrue(smallGlobal.acquire(Operation.LOGIN, "origin-" + i, "account-" + i).allowed());
        }
        for (int i = 4; i < 500; i++) {
            assertFalse(smallGlobal.acquire(Operation.LOGIN, "origin-" + i, "account-" + i).allowed());
        }
        assertEquals(9, operationRows("LOGIN"));
        assertEquals(4, attempts("LOGIN", "GLOBAL"));
    }

    @Test
    void storageCapacityRejectsNewKeysWithoutEvictingActiveAccountBudget() {
        AuthRateLimitService bounded = anotherService(6);
        for (int i = 0; i < 5; i++) {
            assertTrue(bounded.acquire(Operation.LOGIN, "shared-origin", "protected@example.com").allowed());
        }
        assertTrue(bounded.acquire(Operation.LOGIN, "origin-2", "account-2").allowed());
        assertTrue(bounded.acquire(Operation.LOGIN, "origin-3", "account-3").allowed());
        for (int i = 0; i < 500; i++) {
            assertFalse(bounded.acquire(Operation.LOGIN, "new-origin-" + i, "new-account-" + i).allowed());
        }
        assertEquals(7, operationRows("LOGIN"));
        assertEquals(5, jdbc.queryForObject(
                "SELECT MAX(attempts) FROM auth_rate_limit_bucket WHERE bucket_key LIKE 'LOGIN:ACCOUNT:%'", Integer.class));
        assertFalse(bounded.acquire(Operation.LOGIN, "shared-origin", "protected@example.com").allowed());
        clock.advance(Duration.ofSeconds(60));
        assertTrue(bounded.acquire(Operation.LOGIN, "reclaimed-origin", "reclaimed-account").allowed());
        assertEquals(3, operationRows("LOGIN"));
    }

    @Test
    void failedCredentialsAndRejectedDecisionsCommitDespiteOuterRollback() {
        TransactionTemplate caller = new TransactionTemplate(transactionManager);
        assertThrows(IllegalStateException.class, () -> caller.execute(status -> {
            assertTrue(service.acquire(Operation.LOGIN, "192.0.2.20", "failed@example.com").allowed());
            throw new IllegalStateException("Simulated failed credential processing.");
        }));
        assertEquals(1, attempts("LOGIN", "ACCOUNT"));
        for (int i = 0; i < 4; i++) {
            assertTrue(service.acquire(Operation.LOGIN, "192.0.2.20", "failed@example.com").allowed());
        }
        assertThrows(TooManyAuthAttemptsException.class, () -> caller.execute(status -> {
            Decision rejected = service.acquire(Operation.LOGIN, "192.0.2.20", "failed@example.com");
            assertFalse(rejected.allowed());
            throw new TooManyAuthAttemptsException(rejected.retryAfterSeconds());
        }));
        assertEquals(5, attempts("LOGIN", "ACCOUNT"));
        assertEquals(6, attempts("LOGIN", "GLOBAL"));
        assertEquals(6, attempts("LOGIN", "ORIGIN"));
    }

    @Test
    void twoInstancesShareExactlyFiveAdmissionsDuringConcurrentRequests() throws Exception {
        AuthRateLimitService secondInstance = anotherService(10_000);
        ExecutorService workers = Executors.newFixedThreadPool(8);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Decision>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < 40; i++) {
                AuthRateLimitService selected = i % 2 == 0 ? service : secondInstance;
                futures.add(workers.submit(() -> {
                    assertTrue(start.await(10, TimeUnit.SECONDS));
                    return selected.acquire(Operation.LOGIN, "192.0.2.21", "parallel@example.com");
                }));
            }
            start.countDown();
            int admitted = 0;
            for (Future<Decision> future : futures) {
                if (future.get(30, TimeUnit.SECONDS).allowed()) {
                    admitted++;
                }
            }
            assertEquals(5, admitted);
            assertEquals(3, operationRows("LOGIN"));
            assertEquals(40, attempts("LOGIN", "GLOBAL"));
            assertEquals(20, attempts("LOGIN", "ORIGIN"));
            assertEquals(5, attempts("LOGIN", "ACCOUNT"));
        } finally {
            workers.shutdownNow();
            assertTrue(workers.awaitTermination(10, TimeUnit.SECONDS));
        }
    }

    @Test
    void absentPermanentRowFailsClosed() {
        jdbc.update("DELETE FROM auth_rate_limit_bucket WHERE bucket_key = 'LOGIN:GLOBAL'");
        assertThrows(AuthProtectionUnavailableException.class,
                () -> service.acquire(Operation.LOGIN, "192.0.2.22", "unavailable@example.com"));
        assertEquals(0, operationRows("LOGIN"));
    }

    @Test
    void missingTableFailsClosedWithoutMemoryFallback() {
        jdbc.execute("ALTER TABLE auth_rate_limit_bucket RENAME TO auth_rate_limit_unavailable");
        try {
            assertThrows(AuthProtectionUnavailableException.class,
                    () -> service.acquire(Operation.LOGIN, "192.0.2.22", "unavailable@example.com"));
        } finally {
            jdbc.execute("ALTER TABLE auth_rate_limit_unavailable RENAME TO auth_rate_limit_bucket");
        }
    }

    private AuthRateLimitService anotherService(int capacity) {
        return new AuthRateLimitService(repository, transactionManager, clock, Duration.ofSeconds(60), capacity,
                Map.of(Operation.LOGIN, new Limits(5, 20, 200),
                        Operation.REGISTER, new Limits(3, 5, 40),
                        Operation.VERIFY, new Limits(5, 20, 200),
                        Operation.EMAIL_CHANGE, new Limits(3, 5, 40)));
    }

    private int attempts(String operation, String kind) {
        return jdbc.queryForObject("SELECT MAX(attempts) FROM auth_rate_limit_bucket WHERE bucket_key LIKE ?",
                Integer.class, operation + ":" + kind + "%");
    }

    private int operationRows(String operation) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM auth_rate_limit_bucket WHERE operation = ?",
                Integer.class, operation);
    }
}
