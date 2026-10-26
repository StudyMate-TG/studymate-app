package br.com.studymate.exception;

public class NotificacaoNaoEncontradaException extends RuntimeException {
    public NotificacaoNaoEncontradaException() { super("Notificação não encontrada."); }
}
