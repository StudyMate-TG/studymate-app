package br.com.studymate.exception;

public class AuthProtectionUnavailableException extends RuntimeException {
    public AuthProtectionUnavailableException() {
        super("A proteção de autenticação está temporariamente indisponível.");
    }

    public AuthProtectionUnavailableException(Throwable cause) {
        super("A proteção de autenticação está temporariamente indisponível.", cause);
    }
}
