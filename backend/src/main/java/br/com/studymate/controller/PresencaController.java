package br.com.studymate.controller;

import br.com.studymate.dto.PresencaRequest;
import br.com.studymate.exception.RespostaErroInterno;
import br.com.studymate.service.PresencaService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/presencas")
public class PresencaController {
    private final PresencaService service;
    public PresencaController(PresencaService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<?> listar(@AuthenticationPrincipal Jwt principal, @RequestParam Integer idDisciplina) {
        try {
            return ResponseEntity.ok(service.listar(Integer.valueOf(principal.getSubject()), idDisciplina));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", erro.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@AuthenticationPrincipal Jwt principal, @RequestBody PresencaRequest request) {
        try {
            return ResponseEntity.ok(service.cadastrar(Integer.valueOf(principal.getSubject()), request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", erro.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }
}
