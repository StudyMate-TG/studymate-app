package br.com.studymate;

import br.com.studymate.dto.*;
import br.com.studymate.model.Usuario;
import br.com.studymate.repository.UsuarioRepository;
import br.com.studymate.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;
import org.mockito.ArgumentCaptor;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class UsuarioFlowTests {
 @Autowired WebApplicationContext context;
 @Autowired UsuarioRepository repository;
 @Autowired UsuarioService usuarioService;
 @Autowired AuthService authService;
 @Autowired PasswordEncoder encoder;
 @Autowired JdbcTemplate jdbc;
 @Autowired PlatformTransactionManager transactionManager;
 @Autowired VerificationMailService mail;
 MockMvc mvc;
 @BeforeEach void preparar(){
  mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  for(String table:new String[]{"email_verification","tarefa","avaliacao","falta","disciplina","periodo_letivo","progresso_estudante","usuario"})jdbc.update("DELETE FROM "+table);
  reset(mail);
 }
 @Test void cadastroSoCriaContaDepoisDeConfirmarEmailEMantemHashEProgresso()throws Exception{
  String body="{\"nome\":\" Ana \",\"email\":\"ANA@example.com\",\"senha\":\"segredo123\"}";
  mvc.perform(post("/api/auth/register").contentType("application/json").content(body))
   .andExpect(status().isAccepted()).andExpect(jsonPath("$.idUsuario").doesNotExist()).andExpect(jsonPath("$.mensagem").exists());
  assertFalse(repository.existsByEmailIgnoreCase("ana@example.com"));
  var code=ArgumentCaptor.forClass(String.class);verify(mail).enqueue(eq("ana@example.com"),code.capture());
  mvc.perform(post("/api/auth/verify-email").contentType("application/json")
   .content("{\"codigo\":\""+code.getValue()+"\",\"senha\":\"segredo123\"}")).andExpect(status().isOk());
  Usuario saved=repository.findByEmailIgnoreCase("ana@example.com").orElseThrow();
  assertEquals("Ana",saved.getNome());assertNotNull(saved.getDataCriacao());assertNotEquals("segredo123",saved.getSenha());
  assertTrue(encoder.matches("segredo123",saved.getSenha()));
  assertEquals(1,jdbc.queryForObject("SELECT nivel FROM progresso_estudante WHERE id_usuario=?",Integer.class,saved.getIdUsuario()));
  mvc.perform(post("/api/auth/login").contentType("application/json")
   .content("{\"email\":\"ANA@example.com\",\"senha\":\"segredo123\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.senha").doesNotExist());
  mvc.perform(post("/api/auth/login").contentType("application/json")
   .content("{\"email\":\"ana@example.com\",\"senha\":\"incorreta\"}")).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/auth/register").contentType("application/json").content(body))
   .andExpect(status().isAccepted()).andExpect(jsonPath("$.idUsuario").doesNotExist());
 }
 @Test void edicaoPreservaEmailAteConfirmacaoESegredosEIsolamento()throws Exception{
  UsuarioResponse a=cadastrar("ana@example.com");cadastrar("outro@example.com");
  Usuario before=repository.findById(a.getIdUsuario()).orElseThrow();
  mvc.perform(put("/api/usuarios/"+a.getIdUsuario()).with(jwt().jwt(j->j.subject(a.getIdUsuario().toString())))
   .contentType("application/json").content("{\"nome\":\" Ana Silva \",\"email\":\"NOVO@example.com\",\"curso\":\" SI \",\"matricula\":\" \",\"instituicao\":null}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("ana@example.com"))
   .andExpect(jsonPath("$.emailAlteracaoPendente").value(true)).andExpect(jsonPath("$.curso").value("SI"));
  var code=ArgumentCaptor.forClass(String.class);verify(mail).enqueue(eq("novo@example.com"),code.capture());
  mvc.perform(post("/api/auth/verify-email").with(jwt().jwt(j->j.subject(a.getIdUsuario().toString())))
   .contentType("application/json").content("{\"codigo\":\""+code.getValue()+"\",\"senha\":\"segredo123\"}")).andExpect(status().isOk());
  Usuario after=repository.findById(a.getIdUsuario()).orElseThrow();
  assertEquals("novo@example.com",after.getEmail());assertEquals(before.getSenha(),after.getSenha());
  assertEquals(before.getDataCriacao(),after.getDataCriacao());assertNull(after.getMatricula());
  mvc.perform(put("/api/usuarios/"+a.getIdUsuario()).with(jwt().jwt(j->j.subject(a.getIdUsuario().toString())))
   .contentType("application/json").content("{\"nome\":\"Ana\",\"email\":\"OUTRO@example.com\"}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("novo@example.com")).andExpect(jsonPath("$.emailAlteracaoPendente").value(true));
  mvc.perform(put("/api/usuarios/"+a.getIdUsuario()).with(jwt().jwt(j->j.subject(a.getIdUsuario().toString())))
   .contentType("application/json").content("{\"nome\":\" \",\"email\":\"novo@example.com\"}")).andExpect(status().isBadRequest());
  for(int id:new int[]{0,2147483647})mvc.perform(put("/api/usuarios/"+id).with(jwt().jwt(j->j.subject(a.getIdUsuario().toString())))
   .contentType("application/json").content("{\"nome\":\"Ana\",\"email\":\"novo@example.com\"}")).andExpect(status().isForbidden());
 }
 @Test void rollbackDesfazUsuarioEProgressoJuntos(){
  String email=UUID.randomUUID()+"@example.com";
  assertThrows(IllegalStateException.class,()->new TransactionTemplate(transactionManager).execute(status->{
   UsuarioResponse user=cadastrar(email);
   assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM progresso_estudante WHERE id_usuario=?",Integer.class,user.getIdUsuario()));
   throw new IllegalStateException("Falha simulada");
  }));
  assertFalse(repository.existsByEmailIgnoreCase(email));assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM progresso_estudante",Integer.class));
 }
 @Test void rejeitaDadosInvalidosESenhaUtf8Longa()throws Exception{
  mvc.perform(post("/api/auth/register").contentType("application/json")
   .content("{\"nome\":\"Ana\",\"email\":\"invalido\",\"senha\":\"123\"}")).andExpect(status().isBadRequest());
  var req=new RegisterRequest();req.setNome("Ana");req.setEmail("ana@example.com");req.setSenha("á".repeat(40));
  assertThrows(IllegalArgumentException.class,()->usuarioService.criar(req));assertEquals(0,repository.count());
 }
 private UsuarioResponse cadastrar(String email){
  var req=new RegisterRequest();req.setNome("Ana");req.setEmail(email);req.setSenha("segredo123");
  return authService.cadastrar(req);
 }
}
