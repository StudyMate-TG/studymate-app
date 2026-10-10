package br.com.studymate.controller;

import br.com.studymate.dto.*;
import br.com.studymate.service.AvaliacaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoController {
    private final AvaliacaoService service;
    public AvaliacaoController(AvaliacaoService service) { this.service = service; }

    @GetMapping
    public List<AvaliacaoResponse> listar(@RequestParam Integer idDisciplina, @AuthenticationPrincipal Jwt principal) {
        return service.listar(idDisciplina, Integer.valueOf(principal.getSubject()));
    }
    @GetMapping("/media")
    public MediaDisciplinaResponse media(@RequestParam Integer idDisciplina, @AuthenticationPrincipal Jwt principal) {
        return service.calcularMedia(idDisciplina, Integer.valueOf(principal.getSubject()));
    }
    @GetMapping("/{idAvaliacao}")
    public AvaliacaoResponse consultar(@PathVariable Long idAvaliacao, @AuthenticationPrincipal Jwt principal) {
        return service.consultar(idAvaliacao, Integer.valueOf(principal.getSubject()));
    }
    @PostMapping
    public AvaliacaoResponse cadastrar(@AuthenticationPrincipal Jwt principal, @Valid @RequestBody AvaliacaoRequest request) {
        return service.cadastrar(Integer.valueOf(principal.getSubject()), request);
    }
    @PutMapping("/{idAvaliacao}")
    public AvaliacaoResponse alterar(@PathVariable Long idAvaliacao, @AuthenticationPrincipal Jwt principal,
                                      @Valid @RequestBody AvaliacaoRequest request) {
        return service.alterar(idAvaliacao, Integer.valueOf(principal.getSubject()), request);
    }
    @DeleteMapping("/{idAvaliacao}")
    public ResponseEntity<Map<String,String>> excluir(@PathVariable Long idAvaliacao, @AuthenticationPrincipal Jwt principal) {
        service.excluir(idAvaliacao, Integer.valueOf(principal.getSubject()));
        return ResponseEntity.ok(Map.of("mensagem", "Avaliação excluída com sucesso."));
    }
}
