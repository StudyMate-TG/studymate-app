package br.com.studymate.exception;
public class EmailVerificationUnavailableException extends RuntimeException {
 public EmailVerificationUnavailableException(){super("Confirmação de e-mail temporariamente indisponível.");}
}
