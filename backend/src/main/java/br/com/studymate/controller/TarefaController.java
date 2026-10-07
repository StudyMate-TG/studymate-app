package br.com.studymate.controller;

import br.com.studymate.exception.RespostaErroInterno;

import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.service.TarefaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

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
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "50") Integer size
    ) {
        try {
            var tarefas = tarefaService.listar(Integer.valueOf(principal.getSubject()), page, size);
            var resposta = ResponseEntity.ok();
            if (tarefas.size() == size && page < 10000) {
                resposta.header("X-Next-Page", Integer.toString(page + 1));
            }
            return resposta.body(tarefas);
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> consultarPorId(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            return ResponseEntity.ok(
                    tarefaService.consultarPorId(id, Integer.valueOf(principal.getSubject()))
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(
            @AuthenticationPrincipal Jwt principal, @RequestBody TarefaRequest request
    ) {
        request.setIdUsuario(Integer.valueOf(principal.getSubject()));
        try {
            return ResponseEntity.ok(
                    tarefaService.cadastrar(request)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal,
            @RequestBody TarefaRequest request
    ) {
        request.setIdUsuario(Integer.valueOf(principal.getSubject()));
        try {
            return ResponseEntity.ok(
                    tarefaService.alterar(
                            id,
                            Integer.valueOf(principal.getSubject()),
                            request
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PatchMapping("/{id}/concluir")
    public ResponseEntity<?> concluir(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            return ResponseEntity.ok(
                    tarefaService.concluir(
                            id,
                            Integer.valueOf(principal.getSubject())
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            tarefaService.excluir(
                    id,
                    Integer.valueOf(principal.getSubject())
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
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }
}