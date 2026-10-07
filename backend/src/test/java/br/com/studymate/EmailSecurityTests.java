package br.com.studymate;
import br.com.studymate.dto.*;
import br.com.studymate.model.*;
import br.com.studymate.repository.*;
import br.com.studymate.service.*;
import br.com.studymate.exception.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.mockito.ArgumentCaptor;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.sql.Timestamp;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:email_security_tests;MODE=Oracle;DB_CLOSE_DELAY=-1",
 "app.auth-rate-limit.login.account-limit=2","app.auth-rate-limit.login.origin-limit=3"})
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class EmailSecurityTests {
 @Autowired WebApplicationContext context;
 @Autowired JdbcTemplate jdbc;
 @Autowired UsuarioRepository users;
 @Autowired UsuarioService userService;
 @Autowired VerificationMailService mail;
 @Autowired EmailVerificationRepository codes;
 @Autowired AuthService auth;
 @Autowired PasswordEncoder passwords;
 MockMvc mvc;
 @BeforeEach void setup(){
  mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  for(String table:new String[]{"email_verification","tarefa","avaliacao","falta","disciplina","periodo_letivo","progresso_estudante","usuario"})jdbc.update("DELETE FROM "+table);
  jdbc.update("DELETE FROM auth_rate_limit_bucket WHERE bucket_key NOT LIKE '%:GLOBAL'");
  jdbc.update("UPDATE auth_rate_limit_bucket SET attempts=0,window_end=TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00+00:00'");
  reset(mail);
 }
 @AfterEach void cleanup(){jdbc.update("DELETE FROM email_verification");}
 private UsuarioResponse provision(String email){
  var req=new RegisterRequest();req.setNome("Teste");req.setEmail(email);req.setSenha("segredo123");return userService.criar(req);
 }
 private String requestCode(String email)throws Exception{
  mvc.perform(post("/api/auth/register").contentType("application/json")
   .content("{\"nome\":\"Teste\",\"email\":\""+email+"\",\"senha\":\"segredo123\"}"))
   .andExpect(status().isAccepted()).andExpect(jsonPath("$.token").doesNotExist()).andExpect(jsonPath("$.idUsuario").doesNotExist());
  var cap=ArgumentCaptor.forClass(String.class);verify(mail,atLeastOnce()).enqueue(eq(email),cap.capture());return cap.getValue();
 }
 private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder confirmation(String code,String password){
  return post("/api/auth/verify-email").contentType("application/json").content("{\"codigo\":\""+code+"\",\"senha\":\""+password+"\"}");
 }
 @Test void existingAndNewRegistrationHaveIdenticalResponsesAndDoNotOverwriteExistingAccount()throws Exception{
  UsuarioResponse old=provision("known@example.com");String before=users.findById(old.getIdUsuario()).orElseThrow().getSenha();
  String common="{\"nome\":\"Teste\",\"email\":\"%s\",\"senha\":\"segredo123\"}";
  String one=mvc.perform(post("/api/auth/register").contentType("application/json").content(common.formatted("known@example.com")))
   .andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString();
  String two=mvc.perform(post("/api/auth/register").contentType("application/json").content(common.formatted("new@example.com")))
   .andExpect(status().isAccepted()).andReturn().getResponse().getContentAsString();
  assertEquals(one,two);assertEquals(1,users.count());
  var cap=ArgumentCaptor.forClass(String.class);verify(mail).enqueue(eq("known@example.com"),cap.capture());
  mvc.perform(confirmation(cap.getValue(),"segredo123")).andExpect(status().isOk());
  assertEquals(before,users.findById(old.getIdUsuario()).orElseThrow().getSenha());assertEquals(1,users.count());
 }
 @Test void codesAreHashedOneUseAndRequireOriginalPassword()throws Exception{
  String code=requestCode("new@example.com");assertTrue(code.matches("[0-9a-f]{64}"));
  EmailVerification saved=codes.findAll().get(0);
  assertNotEquals(code,saved.getTokenHash());assertFalse(codes.existsById(code));
  assertTrue(passwords.matches("segredo123",saved.getSenhaHash()));assertNotEquals("segredo123",saved.getSenhaHash());
  mvc.perform(confirmation(code,"wrong123")).andExpect(status().isBadRequest());assertEquals(0,users.count());
  mvc.perform(confirmation(code.toUpperCase(Locale.ROOT),"segredo123")).andExpect(status().isOk());assertEquals(1,users.count());
  mvc.perform(confirmation(code,"segredo123")).andExpect(status().isBadRequest());assertEquals(1,users.count());
 }
 @Test void expiredAndUnknownCodesCannotCreateAccounts()throws Exception{
  String code=requestCode("expired@example.com");
  jdbc.update("UPDATE email_verification SET expires_at=?",Timestamp.from(Instant.now().minusSeconds(1)));
  mvc.perform(confirmation(code,"segredo123")).andExpect(status().isBadRequest());
  mvc.perform(confirmation("0".repeat(64),"segredo123")).andExpect(status().isBadRequest());assertEquals(0,users.count());
 }
 @Test void sameCodeCannotBeConsumedByConcurrentCalls()throws Exception{
  String code=requestCode("race@example.com");var req=new EmailVerificationRequest(code,"segredo123");
  ExecutorService pool=Executors.newFixedThreadPool(2);CountDownLatch start=new CountDownLatch(1);
  try{
   List<Future<Boolean>> jobs=new ArrayList<>();
   for(int i=0;i<2;i++)jobs.add(pool.submit(()->{start.await();try{auth.confirmar(req,null);return true;}catch(IllegalArgumentException rejected){return false;}}));
   start.countDown();int admitted=0;for(var job:jobs)if(job.get(15,TimeUnit.SECONDS))admitted++;
   assertEquals(1,admitted);assertEquals(1,users.count());
  }finally{pool.shutdownNow();}
 }
 @Test void emailChangeRequiresJwtOwnerMailboxCodeAndCurrentPassword()throws Exception{
  var ana=provision("ana@example.com");var bia=provision("bia@example.com");
  mvc.perform(put("/api/usuarios/"+ana.getIdUsuario()).with(jwt().jwt(j->j.subject(ana.getIdUsuario().toString())))
   .contentType("application/json").content("{\"nome\":\"Ana\",\"email\":\"new@example.com\"}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("ana@example.com")).andExpect(jsonPath("$.emailAlteracaoPendente").value(true));
  var cap=ArgumentCaptor.forClass(String.class);verify(mail).enqueue(eq("new@example.com"),cap.capture());String code=cap.getValue();
  mvc.perform(confirmation(code,"segredo123")).andExpect(status().isForbidden());
  mvc.perform(confirmation(code,"segredo123").with(jwt().jwt(j->j.subject(bia.getIdUsuario().toString())))).andExpect(status().isForbidden());
  mvc.perform(confirmation(code,"wrong123").with(jwt().jwt(j->j.subject(ana.getIdUsuario().toString())))).andExpect(status().isBadRequest());
  assertEquals("ana@example.com",users.findById(ana.getIdUsuario()).orElseThrow().getEmail());
  mvc.perform(confirmation(code,"segredo123").with(jwt().jwt(j->j.subject(ana.getIdUsuario().toString())))).andExpect(status().isOk());
  assertEquals("new@example.com",users.findById(ana.getIdUsuario()).orElseThrow().getEmail());
 }
 @Test void loginAttemptsCommitAndUntrustedForwardedHeadersDoNotResetOriginBudget()throws Exception{
  provision("known@example.com");
  for(int i=0;i<2;i++)mvc.perform(post("/api/auth/login").contentType("application/json")
   .header("X-Forwarded-For","198.51.100."+i).content("{\"email\":\"known@example.com\",\"senha\":\"wrong123\"}")).andExpect(status().isUnauthorized());
  mvc.perform(post("/api/auth/login").contentType("application/json").header("X-Forwarded-For","198.51.100.99")
   .content("{\"email\":\"KNOWN@example.com\",\"senha\":\"segredo123\"}"))
   .andExpect(status().isTooManyRequests()).andExpect(header().exists("Retry-After")).andExpect(jsonPath("$.token").doesNotExist());
  mvc.perform(post("/api/auth/login").contentType("application/json").header("X-Forwarded-For","198.51.100.100")
   .content("{\"email\":\"other@example.com\",\"senha\":\"wrong123\"}"))
   .andExpect(status().isTooManyRequests());
 }
 @Test void absentAccountStillRunsPasswordCheckAfterBudget(){
  var repo=mock(UsuarioRepository.class);var encoder=mock(PasswordEncoder.class);var guard=mock(AuthAttemptGuard.class);
  when(repo.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());when(encoder.encode(anyString())).thenReturn("dummy-hash");
  var service=new AuthService(mock(UsuarioService.class),repo,encoder,mock(JwtService.class),guard,mock(EmailVerificationService.class));
  clearInvocations(encoder);
  var req=new LoginRequest();req.setEmail("missing@example.com");req.setSenha("wrong123");
  assertThrows(BadCredentialsException.class,()->service.login(req));
  var order=inOrder(guard,encoder);order.verify(guard).requireAllowed(AuthRateLimitService.Operation.LOGIN,"missing@example.com");
  order.verify(encoder).matches("wrong123","dummy-hash");
 }
 @Test void mailMisconfigurationFailsEquallyForKnownAndUnknownAddresses()throws Exception{
  provision("known@example.com");doThrow(new EmailVerificationUnavailableException()).when(mail).requireConfigured();
  for(String email:new String[]{"known@example.com","unknown@example.com"}){
   mvc.perform(post("/api/auth/register").contentType("application/json")
    .content("{\"nome\":\"Teste\",\"email\":\""+email+"\",\"senha\":\"segredo123\"}")).andExpect(status().isServiceUnavailable());
  }
  assertEquals(0,codes.count());assertEquals(1,users.count());
 }
}
