package br.com.studymate.controller;

import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.service.TarefaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tarefas")
public class TarefaController {

    private final TarefaService tarefaService;

    public TarefaController(TarefaService tarefaService) {
        this.tarefaService = tarefaService;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(
                    tarefaService.listar(idUsuario)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao listar tarefas: " + erro.getMessage()
                    )
            );
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> consultarPorId(
            @PathVariable Integer id,
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(
                    tarefaService.consultarPorId(id, idUsuario)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao consultar tarefa: " + erro.getMessage()
                    )
            );
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(
            @RequestBody TarefaRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    tarefaService.cadastrar(request)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao cadastrar tarefa: " + erro.getMessage()
                    )
            );
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer id,
            @RequestParam Integer idUsuario,
            @RequestBody TarefaRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    tarefaService.alterar(
                            id,
                            idUsuario,
                            request
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao alterar tarefa: " + erro.getMessage()
                    )
            );
        }
    }

    @PatchMapping("/{id}/concluir")
    public ResponseEntity<?> concluir(
            @PathVariable Integer id,
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(
                    tarefaService.concluir(
                            id,
                            idUsuario
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao concluir tarefa: " + erro.getMessage()
                    )
            );
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer id,
            @RequestParam Integer idUsuario
    ) {
        try {
            tarefaService.excluir(
                    id,
                    idUsuario
            );

            return ResponseEntity.ok(
                    Map.of(
                            "mensagem",
                            "Tarefa excluída com sucesso."
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();
            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao excluir tarefa: " + erro.getMessage()
                    )
            );
        }
    }
}