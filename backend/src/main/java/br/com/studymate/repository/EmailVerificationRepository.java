package br.com.studymate.repository;
import br.com.studymate.model.EmailVerification;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import java.time.Instant;
import java.util.Optional;
public interface EmailVerificationRepository extends JpaRepository<EmailVerification,String>{
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @QueryHints(@QueryHint(name="jakarta.persistence.lock.timeout",value="5000"))
 @Query("select v from EmailVerification v where v.tokenHash=:hash")
 Optional<EmailVerification> lockToken(@Param("hash")String hash);
 @Query("select count(v) from EmailVerification v where v.usedAt is null and v.expiresAt>:now")
 long countPending(@Param("now")Instant now);
 @Modifying @Query("delete from EmailVerification v where v.expiresAt<=:now or v.usedAt is not null")
 int deleteExpired(@Param("now")Instant now);
}
