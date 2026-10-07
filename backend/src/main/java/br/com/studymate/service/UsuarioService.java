package br.com.studymate.service;
import br.com.studymate.dto.*;
import br.com.studymate.model.Usuario;
import br.com.studymate.repository.UsuarioRepository;
import br.com.studymate.exception.UsuarioNotFoundException;
import jakarta.validation.*;
import jakarta.validation.constraints.*;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;
import org.springframework.transaction.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.Locale;
@Service @Validated
public class UsuarioService {
 private final UsuarioRepository users;private final UsuarioCadastroService cadastro;
 private final EmailVerificationService verification;private final AuthAttemptGuard attempts;
 private final TransactionTemplate profileTransaction;
 public UsuarioService(UsuarioRepository users,UsuarioCadastroService cadastro,
  EmailVerificationService verification,AuthAttemptGuard attempts,PlatformTransactionManager manager){
  this.users=users;this.cadastro=cadastro;this.verification=verification;this.attempts=attempts;
  profileTransaction=new TransactionTemplate(manager);
 }
 @Transactional(readOnly=true) @PreAuthorize("denyAll()")
 public List<UsuarioResponse> listarUsuarios(){return users.findAll().stream().map(UsuarioResponse::new).toList();}
 @Transactional(readOnly=true) @PreAuthorize("#id != null and #id.toString() == authentication.name")
 public UsuarioResponse listarPorId(@NotNull @Positive Integer id){return new UsuarioResponse(buscar(id));}
 public UsuarioResponse criar(@NotNull @Valid RegisterRequest request){return cadastro.criar(request);}
 @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
 public UsuarioResponse atualizar(@NotNull @Positive Integer idUsuario,@NotNull @Valid UsuarioUpdateRequest request){
  // The attempt transaction commits before opening the profile transaction, preventing pool starvation.
  attempts.requireAllowed(AuthRateLimitService.Operation.EMAIL_CHANGE,idUsuario.toString());
  return profileTransaction.execute(status->{
   Usuario user=users.buscarParaAtualizacao(idUsuario).orElseThrow(()->new UsuarioNotFoundException(idUsuario));
   String email=request.getEmail().trim().toLowerCase(Locale.ROOT);
   boolean pending=!email.equals(user.getEmail());
   if(pending)verification.solicitarAlteracao(idUsuario,email);
   user.setNome(request.getNome().trim());user.setCurso(opcional(request.getCurso()));
   user.setMatricula(opcional(request.getMatricula()));user.setInstituicao(opcional(request.getInstituicao()));
   return new UsuarioResponse(users.saveAndFlush(user),pending);
  });
 }
 private Usuario buscar(Integer id){return users.findById(id).orElseThrow(()->new UsuarioNotFoundException(id));}
 private String opcional(String value){return value==null||value.isBlank()?null:value.trim();}
}
