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
    public ResponseEntity<?> listar(
            @RequestParam Integer idUsuario,
            @RequestParam(required = false) String termo
    ) {
        try {
            return ResponseEntity.ok(disciplinaService.listar(idUsuario, termo));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao listar disciplinas: " + erro.getMessage())
            );
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> consultarPorId(
            @PathVariable Integer id,
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(disciplinaService.consultarPorId(id, idUsuario));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao consultar disciplina: " + erro.getMessage())
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
            @RequestParam Integer idUsuario,
            @RequestBody DisciplinaRequest request
    ) {
        try {
            return ResponseEntity.ok(disciplinaService.alterar(id, idUsuario, request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao alterar disciplina: " + erro.getMessage())
            );
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer id,
            @RequestParam Integer idUsuario
    ) {
        try {
            disciplinaService.excluir(id, idUsuario);

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