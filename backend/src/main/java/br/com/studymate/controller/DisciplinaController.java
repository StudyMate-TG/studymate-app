package br.com.studymate.controller;

import br.com.studymate.dto.DisciplinaRequest;
import br.com.studymate.service.DisciplinaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/disciplinas")
public class DisciplinaController {
    private final DisciplinaService disciplinaService;

    public DisciplinaController(DisciplinaService disciplinaService) {
        this.disciplinaService = disciplinaService;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam(required = false) String termo) {
        return ResponseEntity.ok(disciplinaService.listar(termo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> consultarPorId(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(disciplinaService.consultarPorId(id));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody DisciplinaRequest request) {
        try {
            return ResponseEntity.ok(disciplinaService.cadastrar(request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao cadastrar disciplina: " + erro.getMessage())
            );
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer id,
            @RequestBody DisciplinaRequest request
    ) {
        try {
            return ResponseEntity.ok(disciplinaService.alterar(id, request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(@PathVariable Integer id) {
        try {
            disciplinaService.excluir(id);

            return ResponseEntity.ok(
                    Map.of("mensagem", "Disciplina excluída com sucesso.")
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao excluir disciplina: " + erro.getMessage())
            );
        }
    }
}