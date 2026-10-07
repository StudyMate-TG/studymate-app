package br.com.studymate.controller;
import br.com.studymate.dto.*;
import br.com.studymate.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import java.util.Map;
@RestController @RequestMapping("/api/auth")
public class AuthController {
 private final AuthService auth;
 public AuthController(AuthService auth){this.auth=auth;}
 @PostMapping("/register")
 public ResponseEntity<Map<String,String>> cadastrar(@Valid @RequestBody RegisterRequest request){
  auth.solicitarCadastro(request);
  return ResponseEntity.accepted().body(Map.of("mensagem",EmailVerificationService.MESSAGE));
 }
 @PostMapping("/verify-email")
 public ResponseEntity<Map<String,String>> confirmar(@Valid @RequestBody EmailVerificationRequest request,
  @AuthenticationPrincipal Jwt principal){
  auth.confirmar(request,principal==null?null:Integer.valueOf(principal.getSubject()));
  return ResponseEntity.ok(Map.of("mensagem","Confirmação processada. Acesse com seu e-mail e senha."));
 }
 @PostMapping("/login")
 public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
  return ResponseEntity.ok(auth.login(request));
 }
}
