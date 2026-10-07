package br.com.studymate.exception;

public class TooManyAuthAttemptsException extends RuntimeException {
    private final long retryAfterSeconds;

    public TooManyAuthAttemptsException(long retryAfterSeconds) {
        super("Muitas tentativas de autenticação. Tente novamente mais tarde.");
        this.retryAfterSeconds = Math.max(1, retryAfterSeconds);
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
