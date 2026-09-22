package br.com.studymate.controller;

import br.com.studymate.dto.LoginRequest;
import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponse> cadastrar(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.cadastrar(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
