package br.com.studymate.controller;

import br.com.studymate.dto.SyncTarefaPullResponse;
import br.com.studymate.dto.SyncTarefaRequest;
import br.com.studymate.dto.SyncTarefaResponse;
import br.com.studymate.exception.RespostaErroInterno;
import br.com.studymate.service.SyncService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sync")
public class SyncController {
    private final SyncService syncService;

    public SyncController(SyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/tarefas")
    public ResponseEntity<SyncTarefaResponse> sincronizarTarefa(
            @AuthenticationPrincipal Jwt principal,
            @RequestBody SyncTarefaRequest request) {
        Integer idUsuario = Integer.valueOf(principal.getSubject());
        request.setIdUsuario(idUsuario);
        if (request.getTarefa() != null) {
            request.getTarefa().setIdUsuario(idUsuario);
        }
        return ResponseEntity.ok(syncService.sincronizarTarefa(request));
    }

    @GetMapping("/tarefas")
    public ResponseEntity<SyncTarefaPullResponse> buscarAlteracoesTarefas(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(required = false) String cursor) {
        return ResponseEntity.ok(syncService.buscarAlteracoesTarefas(
                Integer.valueOf(principal.getSubject()), cursor));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> invalido(IllegalArgumentException erro) {
        return ResponseEntity.badRequest().body(Map.of("mensagem", erro.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> acessoNegado() {
        return ResponseEntity.status(403).body(Map.of("mensagem", "Acesso não permitido."));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> conflito() {
        return ResponseEntity.status(409).body(Map.of(
                "mensagem", "O identificador da operação já foi utilizado."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> interno(Exception erro) {
        return RespostaErroInterno.responder(erro);
    }
}
