package br.com.studymate.controller;

import br.com.studymate.dto.NotificacaoPageResponse;
import br.com.studymate.dto.NotificacaoResponse;
import br.com.studymate.service.NotificacaoService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notificacoes")
public class NotificacaoController {
    private final NotificacaoService service;
    public NotificacaoController(NotificacaoService service) { this.service = service; }
    @GetMapping
    public NotificacaoPageResponse listar(@AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) Boolean lida,
            @RequestParam(defaultValue = "0") @Min(0) @Max(10000) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(50) int size) {
        return service.listar(Integer.valueOf(jwt.getSubject()), lida, page, size);
    }
    @GetMapping("/nao-lidas/total")
    public Map<String, Long> total(@AuthenticationPrincipal Jwt jwt) {
        return Map.of("total", service.totalNaoLidas(Integer.valueOf(jwt.getSubject())));
    }
    @PatchMapping("/{id}/lida")
    public NotificacaoResponse marcarLida(@AuthenticationPrincipal Jwt jwt, @PathVariable @Positive Long id) {
        return service.marcarLida(id, Integer.valueOf(jwt.getSubject()));
    }
}
