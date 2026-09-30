package br.com.studymate.exception;

public class AvaliacaoNaoEncontradaException extends RuntimeException {
    public AvaliacaoNaoEncontradaException() {
        super("Avaliação não encontrada para o usuário informado.");
    }
}
