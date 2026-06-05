package br.com.studymate.controller;

import br.com.studymate.dto.LoginRequest;
import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController{
    private final AuthService authService;

    public AuthController(AuthService authService){
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> cadastrar(@RequestBody RegisterRequest request){
        try{
            return ResponseEntity.ok(authService.cadastrar(request));
        } catch (IllegalArgumentException erro){
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", erro.getMessage())
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity <?> login(@RequestBody LoginRequest request){
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (IllegalArgumentException erro){
            return ResponseEntity.badRequest().body(
                Map.of("mensagem", erro.getMessage())
            );
        }
    }
}