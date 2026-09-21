package br.com.studymate.controller;

import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.dto.UsuarioUpdateRequest;
import br.com.studymate.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PutMapping("/{idUsuario}")
    public ResponseEntity<UsuarioResponse> atualizar(
            @PathVariable Integer idUsuario,
            @Valid @RequestBody UsuarioUpdateRequest request) {
        return ResponseEntity.ok(usuarioService.atualizar(idUsuario, request));
    }
}
