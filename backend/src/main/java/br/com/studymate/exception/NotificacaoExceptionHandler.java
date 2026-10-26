package br.com.studymate.exception;

import br.com.studymate.controller.NotificacaoController;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

/** Reuses the academic API's validation, authorization and integrity error format. */
@RestControllerAdvice(assignableTypes = NotificacaoController.class)
public class NotificacaoExceptionHandler extends AvaliacaoExceptionHandler {
    @ExceptionHandler(NotificacaoNaoEncontradaException.class)
    public ResponseEntity<Map<String, String>> notificacaoAusente(NotificacaoNaoEncontradaException erro) {
        return ResponseEntity.status(404).body(Map.of("mensagem", erro.getMessage()));
    }
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<Map<String, String>> parametrosInvalidos(HandlerMethodValidationException erro) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", "Parâmetros de consulta inválidos."));
    }
}
