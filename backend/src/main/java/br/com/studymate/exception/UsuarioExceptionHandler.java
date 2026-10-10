package br.com.studymate.exception;

import br.com.studymate.controller.AuthController;
import br.com.studymate.controller.UsuarioController;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Map;

@RestControllerAdvice(assignableTypes = {AuthController.class, UsuarioController.class})
public class UsuarioExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(UsuarioExceptionHandler.class);

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<Map<String,String>> acessoNegado(Exception erro) {
        return ResponseEntity.status(403).body(Map.of("mensagem", "Acesso não permitido."));
    }
    @ExceptionHandler(org.springframework.security.authentication.BadCredentialsException.class)
    public ResponseEntity<Map<String,String>> credenciaisInvalidas(Exception erro) {
        return ResponseEntity.status(401).body(Map.of("mensagem", "E-mail ou senha inválidos."));
    }
    @ExceptionHandler(UsuarioNotFoundException.class)
    public ResponseEntity<Map<String, String>> naoEncontrado(UsuarioNotFoundException erro) {
        return resposta(404, erro.getMessage());
    }

    @ExceptionHandler(EmailEmUsoException.class)
    public ResponseEntity<Map<String, String>> conflito(EmailEmUsoException erro) {
        return resposta(409, erro.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> validacao(MethodArgumentNotValidException erro) {
        String mensagem = erro.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .sorted().findFirst().orElse("Dados inválidos.");
        return resposta(400, mensagem);
    }

    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class})
    public ResponseEntity<Map<String, String>> entradaInvalida(Exception erro) {
        return resposta(400, erro.getMessage());
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<Map<String, String>> formatoInvalido(Exception erro) {
        return resposta(400, "Formato de requisição inválido.");
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> integridade(DataIntegrityViolationException erro) {
        return resposta(409, "Os dados conflitam com um registro existente ou com uma restrição do banco.");
    }

    @ExceptionHandler(TooManyAuthAttemptsException.class)
    public ResponseEntity<Map<String,String>> excesso(TooManyAuthAttemptsException erro) {
        return ResponseEntity.status(429).header("Retry-After",Long.toString(erro.getRetryAfterSeconds()))
                .body(Map.of("mensagem","Muitas tentativas. Aguarde antes de tentar novamente."));
    }
    @ExceptionHandler({AuthProtectionUnavailableException.class,EmailVerificationUnavailableException.class})
    public ResponseEntity<Map<String,String>> indisponivel(Exception erro) {
        return resposta(503,"Autenticação ou confirmação de e-mail temporariamente indisponível.");
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> interno(Exception erro) {
        log.error("Falha no fluxo de usuários", erro);
        return resposta(500, "Erro interno ao processar a solicitação.");
    }

    private ResponseEntity<Map<String, String>> resposta(int status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of("mensagem", mensagem));
    }
}
