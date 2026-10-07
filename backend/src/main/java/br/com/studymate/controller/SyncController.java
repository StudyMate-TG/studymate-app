package br.com.studymate.controller;

import br.com.studymate.dto.SyncTarefaRequest;
import br.com.studymate.dto.SyncTarefaResponse;
import br.com.studymate.service.SyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import br.com.studymate.dto.SyncTarefaPullResponse;

@RestController
@RequestMapping("/api/sync")
public class SyncController {

    private final SyncService syncService;

    public SyncController(
            SyncService syncService) {

        this.syncService = syncService;
    }

    @PostMapping("/tarefas")
    public ResponseEntity<SyncTarefaResponse> sincronizarTarefa(
            @RequestBody SyncTarefaRequest request) {

        return ResponseEntity.ok(
                syncService.sincronizarTarefa(request)
        );
    }

    @GetMapping("/tarefas")
    public ResponseEntity<SyncTarefaPullResponse> buscarAlteracoesTarefas(
            @RequestParam Integer idUsuario,
            @RequestParam(required = false) String cursor) {

        return ResponseEntity.ok(
                syncService.buscarAlteracoesTarefas(
                        idUsuario,
                        cursor
                )
        );
    }
}

