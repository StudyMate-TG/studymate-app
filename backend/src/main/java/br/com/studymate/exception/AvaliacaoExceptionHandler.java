package br.com.studymate.exception;

import br.com.studymate.controller.AvaliacaoController;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.Map;

@RestControllerAdvice(assignableTypes = AvaliacaoController.class)
public class AvaliacaoExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(AvaliacaoExceptionHandler.class);
    @ExceptionHandler(AvaliacaoNaoEncontradaException.class)
    public ResponseEntity<Map<String,String>> ausente(AvaliacaoNaoEncontradaException erro) {
        return ResponseEntity.status(404).body(Map.of("mensagem", erro.getMessage()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String,String>> validacao(MethodArgumentNotValidException erro) {
        var campo = erro.getBindingResult().getFieldErrors().stream().findFirst();
        return ResponseEntity.badRequest().body(Map.of("mensagem", campo
                .map(e -> e.getField() + ": " + e.getDefaultMessage()).orElse("Dados inválidos.")));
    }
    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class,
            HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class})
    public ResponseEntity<Map<String,String>> invalido(Exception erro) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", "Dados inválidos. Confira os campos e identificadores informados."));
    }
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String,String>> conflito(DataIntegrityViolationException erro) {
        return ResponseEntity.status(409).body(Map.of("mensagem", "A operação conflita com os dados cadastrados."));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,String>> interno(Exception erro) {
        log.error("Erro ao processar avaliação", erro);
        return ResponseEntity.internalServerError().body(Map.of("mensagem", "Erro interno ao processar avaliação."));
    }
}
