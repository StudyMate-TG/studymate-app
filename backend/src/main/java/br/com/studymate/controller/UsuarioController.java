package br.com.studymate.controller;

import br.com.studymate.dto.UsuarioUpdateRequest;
import br.com.studymate.service.UsuarioService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PutMapping("/{idUsuario}")
    public ResponseEntity<?> atualizar(
            @PathVariable Integer idUsuario,
            @RequestBody UsuarioUpdateRequest request
    ) {
        try {
            return ResponseEntity.ok(usuarioService.atualizar(idUsuario, request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao atualizar usuário: " + erro.getMessage())
            );
        }
    }
}