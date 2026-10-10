package br.com.studymate.repository;

import br.com.studymate.model.AuthRateLimitBucket;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.Optional;

public interface AuthRateLimitRepository extends JpaRepository<AuthRateLimitBucket, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "5000"))
    @Query("select b from AuthRateLimitBucket b where b.bucketKey = :key")
    Optional<AuthRateLimitBucket> lockGlobal(@Param("key") String key);

    @Modifying
    @Query("delete from AuthRateLimitBucket b where b.operation = :operation " +
            "and b.bucketKey <> :globalKey and b.windowEnd <= :now")
    int deleteExpired(@Param("operation") String operation, @Param("globalKey") String globalKey,
                      @Param("now") OffsetDateTime now);

    @Query("select count(b) from AuthRateLimitBucket b where b.operation = :operation " +
            "and b.bucketKey <> :globalKey")
    long countActive(@Param("operation") String operation, @Param("globalKey") String globalKey);

    @Query("select max(b.windowEnd) from AuthRateLimitBucket b where b.operation = :operation " +
            "and b.bucketKey <> :globalKey")
    OffsetDateTime latestExpiry(@Param("operation") String operation, @Param("globalKey") String globalKey);
}
