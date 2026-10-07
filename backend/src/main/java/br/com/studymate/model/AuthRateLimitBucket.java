package br.com.studymate.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.OffsetDateTime;

@Entity
@Table(name = "auth_rate_limit_bucket")
public class AuthRateLimitBucket {
    @Id
    @Column(name = "bucket_key", nullable = false, length = 100)
    private String bucketKey;

    @Column(name = "operation", nullable = false, length = 16)
    private String operation;

    @Column(name = "attempts", nullable = false, precision = 10)
    private int attempts;

    @Column(name = "window_end", nullable = false)
    private OffsetDateTime windowEnd;

    protected AuthRateLimitBucket() {
    }

    public AuthRateLimitBucket(String bucketKey, String operation, OffsetDateTime windowEnd) {
        this.bucketKey = bucketKey;
        this.operation = operation;
        this.windowEnd = windowEnd;
    }

    public String getBucketKey() {
        return bucketKey;
    }

    public String getOperation() {
        return operation;
    }

    public int getAttempts() {
        return attempts;
    }

    public OffsetDateTime getWindowEnd() {
        return windowEnd;
    }

    public void restart(OffsetDateTime end) {
        attempts = 0;
        windowEnd = end;
    }

    public void charge(int limit) {
        // Saturate rejected traffic too, avoiding numeric overflow or an ever-growing counter.
        if (attempts < limit) {
            attempts++;
        }
    }
}
