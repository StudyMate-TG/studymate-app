package br.com.studymate.controller;

import br.com.studymate.dto.*;
import br.com.studymate.service.AvaliacaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/avaliacoes")
public class AvaliacaoController {
    private final AvaliacaoService service;
    public AvaliacaoController(AvaliacaoService service) { this.service = service; }

    @GetMapping
    public List<AvaliacaoResponse> listar(@RequestParam Integer idDisciplina, @RequestParam Integer idUsuario) {
        return service.listar(idDisciplina, idUsuario);
    }
    @GetMapping("/media")
    public MediaDisciplinaResponse media(@RequestParam Integer idDisciplina, @RequestParam Integer idUsuario) {
        return service.calcularMedia(idDisciplina, idUsuario);
    }
    @GetMapping("/{idAvaliacao}")
    public AvaliacaoResponse consultar(@PathVariable Long idAvaliacao, @RequestParam Integer idUsuario) {
        return service.consultar(idAvaliacao, idUsuario);
    }
    @PostMapping
    public AvaliacaoResponse cadastrar(@RequestParam Integer idUsuario, @Valid @RequestBody AvaliacaoRequest request) {
        return service.cadastrar(idUsuario, request);
    }
    @PutMapping("/{idAvaliacao}")
    public AvaliacaoResponse alterar(@PathVariable Long idAvaliacao, @RequestParam Integer idUsuario,
                                      @Valid @RequestBody AvaliacaoRequest request) {
        return service.alterar(idAvaliacao, idUsuario, request);
    }
    @DeleteMapping("/{idAvaliacao}")
    public ResponseEntity<Map<String,String>> excluir(@PathVariable Long idAvaliacao, @RequestParam Integer idUsuario) {
        service.excluir(idAvaliacao, idUsuario);
        return ResponseEntity.ok(Map.of("mensagem", "Avaliação excluída com sucesso."));
    }
}
