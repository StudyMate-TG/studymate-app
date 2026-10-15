package br.com.studymate.controller;

import br.com.studymate.service.GamificacaoService;
import br.com.studymate.exception.RespostaErroInterno;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/gamificacao")
public class GamificacaoController {
    private final GamificacaoService service;
    public GamificacaoController(GamificacaoService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<?> consultar(@AuthenticationPrincipal Jwt principal) {
        try {
            return ResponseEntity.ok(service.consultar(Integer.valueOf(principal.getSubject())));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(Map.of("mensagem", erro.getMessage()));
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }
}
