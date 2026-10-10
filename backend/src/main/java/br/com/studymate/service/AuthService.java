package br.com.studymate.service;
import br.com.studymate.dto.*;
import br.com.studymate.model.Usuario;
import br.com.studymate.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;
@Service @Validated
public class AuthService {
 private final UsuarioService usuarioService;private final UsuarioRepository repository;
 private final PasswordEncoder encoder;private final JwtService jwt;
 private final AuthAttemptGuard attempts;private final EmailVerificationService verification;
 private final String dummyHash;
 public AuthService(UsuarioService usuarioService,UsuarioRepository repository,PasswordEncoder encoder,
  JwtService jwt,AuthAttemptGuard attempts,EmailVerificationService verification){
  this.usuarioService=usuarioService;this.repository=repository;this.encoder=encoder;this.jwt=jwt;
  this.attempts=attempts;this.verification=verification;this.dummyHash=encoder.encode(UUID.randomUUID().toString());
 }
 /** Internal provisioning used by migrations/verified test fixtures, not an HTTP registration route. */
 public UsuarioResponse cadastrar(@NotNull @Valid RegisterRequest request){return usuarioService.criar(request);}
 public void solicitarCadastro(@NotNull @Valid RegisterRequest request){
  attempts.requireAllowed(AuthRateLimitService.Operation.REGISTER,normalizar(request.getEmail()));
  verification.solicitarCadastro(request);
 }
 public void confirmar(@NotNull @Valid EmailVerificationRequest request,Integer authenticatedUser){
  attempts.requireAllowed(AuthRateLimitService.Operation.VERIFY,request.codigo());
  verification.confirmar(request,authenticatedUser);
 }
 public LoginResponse login(@NotNull @Valid LoginRequest request){
  String email=normalizar(request.getEmail());
  attempts.requireAllowed(AuthRateLimitService.Operation.LOGIN,email);
  if(request.getSenha().getBytes(StandardCharsets.UTF_8).length>72)throw invalido();
  Usuario user=repository.findByEmailIgnoreCase(email).orElse(null);
  boolean correct=encoder.matches(request.getSenha(),user==null?dummyHash:user.getSenha());
  if(user==null||!correct)throw invalido();
  return new LoginResponse(new UsuarioResponse(user),jwt.emitir(user.getIdUsuario()),jwt.getExpiresIn());
 }
 private String normalizar(String value){return value.trim().toLowerCase(Locale.ROOT);}
 private BadCredentialsException invalido(){return new BadCredentialsException("E-mail ou senha inválidos.");}
}
