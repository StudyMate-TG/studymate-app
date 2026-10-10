package br.com.studymate.controller;

import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.dto.UsuarioUpdateRequest;
import br.com.studymate.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.access.AccessDeniedException;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PutMapping("/{idUsuario}")
    public ResponseEntity<UsuarioResponse> atualizar(
            @PathVariable Integer idUsuario, @AuthenticationPrincipal Jwt principal,
            @Valid @RequestBody UsuarioUpdateRequest request) {
        if (!idUsuario.toString().equals(principal.getSubject())) throw new AccessDeniedException("Acesso não permitido.");
        return ResponseEntity.ok(usuarioService.atualizar(Integer.valueOf(principal.getSubject()), request));
    }
}
