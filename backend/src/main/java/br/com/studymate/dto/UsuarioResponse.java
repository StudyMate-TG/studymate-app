package br.com.studymate.dto;
import br.com.studymate.model.Usuario;
public class UsuarioResponse {
 private final Integer idUsuario;private final String nome,email,curso,matricula,instituicao;
 private final boolean emailAlteracaoPendente;
 public UsuarioResponse(Usuario user){this(user,false);}
 public UsuarioResponse(Usuario user,boolean pending){
  idUsuario=user.getIdUsuario();nome=user.getNome();email=user.getEmail();curso=user.getCurso();
  matricula=user.getMatricula();instituicao=user.getInstituicao();emailAlteracaoPendente=pending;
 }
 public Integer getIdUsuario(){return idUsuario;}public String getNome(){return nome;}
 public String getEmail(){return email;}public String getCurso(){return curso;}
 public String getMatricula(){return matricula;}public String getInstituicao(){return instituicao;}
 public boolean isEmailAlteracaoPendente(){return emailAlteracaoPendente;}
}
