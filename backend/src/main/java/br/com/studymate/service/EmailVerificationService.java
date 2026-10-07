package br.com.studymate.service;
import br.com.studymate.dto.*;
import br.com.studymate.model.EmailVerification;
import br.com.studymate.repository.*;
import br.com.studymate.exception.*;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.*;
import org.springframework.scheduling.annotation.Scheduled;
import java.time.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.*;
@Service
public class EmailVerificationService {
 public static final String MESSAGE="Se aplicável, enviaremos instruções para este endereço.";
 private final EmailVerificationRepository tokens;private final UsuarioRepository users;
 private final UsuarioCadastroService cadastro;private final AuthRateLimitRepository limits;
 private final VerificationMailService mail;private final PasswordEncoder encoder;
 private final Clock clock;private final Duration ttl;private final int maxPending;
 private final SecureRandom random=new SecureRandom();
 public EmailVerificationService(EmailVerificationRepository tokens,UsuarioRepository users,
  UsuarioCadastroService cadastro,AuthRateLimitRepository limits,VerificationMailService mail,
  PasswordEncoder encoder,Clock clock,@Value("${app.email-verification.ttl-seconds:900}")long ttl,
  @Value("${app.email-verification.max-pending:1000}")int maxPending){
  if(ttl<60||ttl>3600||maxPending<1||maxPending>5000)throw new IllegalArgumentException("Configuração de confirmação inválida.");
  this.tokens=tokens;this.users=users;this.cadastro=cadastro;this.limits=limits;this.mail=mail;
  this.encoder=encoder;this.clock=clock;this.ttl=Duration.ofSeconds(ttl);this.maxPending=maxPending;
 }
 @Transactional
 public void solicitarCadastro(RegisterRequest request){
  validarSenha(request.getSenha());mail.requireConfigured();
  var token=new EmailVerification();token.setPurpose("REGISTER");token.setEmail(normalizar(request.getEmail()));
  token.setNome(request.getNome().trim());token.setSenhaHash(encoder.encode(request.getSenha()));
  criar(token);
 }
 @Transactional
 public void solicitarAlteracao(Integer user,String email){
  mail.requireConfigured();
  var token=new EmailVerification();token.setPurpose("EMAIL_CHANGE");token.setIdUsuario(user);
  token.setEmail(normalizar(email));criar(token);
 }
 private void criar(EmailVerification token){
  limits.lockGlobal("VERIFY:GLOBAL").orElseThrow(AuthProtectionUnavailableException::new);
  if(tokens.countPending(clock.instant())>=maxPending)throw new EmailVerificationUnavailableException();
  byte[] bytes=new byte[32];random.nextBytes(bytes);
  String codigo=HexFormat.of().formatHex(bytes);
  token.setTokenHash(hash(codigo));token.setExpiresAt(clock.instant().plus(ttl));tokens.saveAndFlush(token);
  // Do not disclose account existence through SMTP response time or delivery errors.
  TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization(){
   @Override public void afterCommit(){mail.enqueue(token.getEmail(),codigo);}
  });
 }
 @Transactional
 public void confirmar(EmailVerificationRequest request,Integer authenticatedUser){
  validarSenha(request.senha());
  var token=tokens.lockToken(hash(request.codigo().toLowerCase(Locale.ROOT))).orElseThrow(this::invalido);
  validarToken(token);
  if("REGISTER".equals(token.getPurpose())){
   if(!encoder.matches(request.senha(),token.getSenhaHash()))throw invalido();
   limits.lockGlobal("REGISTER:GLOBAL").orElseThrow(AuthProtectionUnavailableException::new);
   validarToken(token);
   // A verified mailbox holder can learn about their own address; the anonymous response stays identical.
   if(!users.existsByEmailIgnoreCase(token.getEmail())){
    var signup=new RegisterRequest();signup.setNome(token.getNome());signup.setEmail(token.getEmail());signup.setSenha(request.senha());
    cadastro.criar(signup);
   }
  }else if("EMAIL_CHANGE".equals(token.getPurpose())){
   if(authenticatedUser==null||!authenticatedUser.equals(token.getIdUsuario()))throw new AccessDeniedException("Acesso não permitido.");
   var user=users.buscarParaAtualizacao(authenticatedUser).orElseThrow(this::invalido);
   if(!encoder.matches(request.senha(),user.getSenha()))throw invalido();
   validarToken(token);
   if(users.existsByEmailIgnoreCaseAndIdUsuarioNot(token.getEmail(),authenticatedUser)){
    throw new IllegalArgumentException("Não foi possível confirmar a alteração de e-mail.");
   }
   user.setEmail(token.getEmail());users.saveAndFlush(user);
  }else throw invalido();
  token.setUsedAt(clock.instant());tokens.saveAndFlush(token);
 }
 private void validarToken(EmailVerification token){
  if(token.getUsedAt()!=null||!token.getExpiresAt().isAfter(clock.instant()))throw invalido();
 }
 private IllegalArgumentException invalido(){return new IllegalArgumentException("Código inválido ou expirado.");}
 private void validarSenha(String senha){
  if(senha==null||senha.isBlank()||senha.length()<6||senha.getBytes(StandardCharsets.UTF_8).length>72)throw invalido();
 }
 private String normalizar(String value){return value.trim().toLowerCase(Locale.ROOT);}
 private String hash(String value){
  try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}
  catch(NoSuchAlgorithmException impossible){throw new IllegalStateException(impossible);}
 }
 @Scheduled(fixedDelayString="${app.email-verification.cleanup-ms:60000}")
 @Transactional
 public void limparExpirados(){tokens.deleteExpired(clock.instant());}
}
