package br.com.studymate.exception;

public class EmailEmUsoException extends RuntimeException {
    public EmailEmUsoException() {
        super("Já existe um usuário cadastrado com este e-mail.");
    }
}
