package br.com.studymate;

import br.com.studymate.service.JwtService;
import br.com.studymate.service.DisciplinaService;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.UsuarioRepository;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.access.AccessDeniedException;
import java.time.Instant;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

@SpringBootTest
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class JwtSecurityTests {
 @Autowired WebApplicationContext context;
 @Autowired JdbcTemplate jdbc;
 @Autowired UsuarioRepository usuarios;
 @Autowired DisciplinaRepository disciplinas;
 @Autowired DisciplinaService disciplinaService;
 @Autowired JwtService jwtService;
 @Autowired JwtEncoder encoder;
 @Autowired JwtDecoder decoder;
 @Autowired br.com.studymate.service.UsuarioService provisionamento;
 @Autowired javax.crypto.SecretKey chaveJwt;
 MockMvc mvc;
 Integer ana,bia;
 String tokenAna,tokenBia;
 @BeforeEach void preparar() throws Exception {
  for(String table:new String[]{"sync_request","email_verification","tarefa","avaliacao","falta","disciplina","periodo_letivo","progresso_estudante","usuario"}) jdbc.update("DELETE FROM "+table);
  mvc=MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
  registrar("ana@example.com"); registrar("bia@example.com");
  ana=usuarios.findByEmailIgnoreCase("ana@example.com").orElseThrow().getIdUsuario();
  bia=usuarios.findByEmailIgnoreCase("bia@example.com").orElseThrow().getIdUsuario();
  tokenAna=login("ana@example.com"); tokenBia=login("bia@example.com");
 }
 @Test void loginEmiteTokenEProtegeTodosOsModulos() throws Exception {
  Jwt jwt=decoder.decode(tokenAna);
  assertEquals(ana.toString(),jwt.getSubject());
  assertEquals("studymate-api",jwt.getClaimAsString("iss"));
  assertTrue(jwt.getAudience().contains("studymate-app"));
  assertEquals(3600,jwt.getExpiresAt().getEpochSecond()-jwt.getIssuedAt().getEpochSecond());
  for(String path:List.of("/api/disciplinas","/api/periodos","/api/faltas","/api/tarefas","/api/avaliacoes","/api/health","/api/db-health"))
   mvc.perform(get(path)).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.mensagem").exists());
  mvc.perform(get("/api/disciplinas").header("Authorization","Bearer "+tokenAna)).andExpect(status().isOk());
  mvc.perform(post("/api/auth/login").contentType("application/json").content("{\"email\":\"ana@example.com\",\"senha\":\"incorreta\"}"))
   .andExpect(status().isUnauthorized());
 }
 @Test void tokenExpiradoForjadoOuClaimsInvalidasSaoRecusados() throws Exception {
  Instant now=Instant.now();
  var claims=JwtClaimsSet.builder().subject(ana.toString()).issuer("studymate-api").audience(List.of("studymate-app"))
   .issuedAt(now.minusSeconds(7200)).expiresAt(now.minusSeconds(3600)).build();
  rejeitar(emitir(encoder,claims));
  byte[] different=new byte[32];java.util.Arrays.fill(different,(byte)1);
  JwtEncoder outroEncoder=new NimbusJwtEncoder(new ImmutableSecret<>(new SecretKeySpec(different,"HmacSHA256")));
  claims=JwtClaimsSet.builder().subject(ana.toString()).issuer("studymate-api").audience(List.of("studymate-app"))
   .issuedAt(now).expiresAt(now.plusSeconds(3600)).build();
  rejeitar(emitir(outroEncoder,claims));
  rejeitar(emitir(encoder,JwtClaimsSet.builder().subject(ana.toString()).issuer("outro-emissor").audience(List.of("studymate-app")).issuedAt(now).expiresAt(now.plusSeconds(3600)).build()));
  rejeitar(emitir(encoder,JwtClaimsSet.builder().subject(ana.toString()).issuer("studymate-api").audience(List.of("outra-api")).issuedAt(now).expiresAt(now.plusSeconds(3600)).build()));
  rejeitar(emitir(encoder,JwtClaimsSet.builder().subject("invalido").issuer("studymate-api").audience(List.of("studymate-app")).issuedAt(now).expiresAt(now.plusSeconds(3600)).build()));
  rejeitar(emitir(encoder,JwtClaimsSet.builder().subject(ana.toString()).issuer("studymate-api").audience(List.of("studymate-app")).issuedAt(now).build()));
  rejeitar("nao-e-um-jwt");
 }
 @Test void trocarIdUsuarioNaoMudaIdentidadeENaoPermiteAcessoAOutraConta() throws Exception {
  mvc.perform(post("/api/disciplinas").header("Authorization","Bearer "+tokenAna).contentType("application/json")
   .content("{\"idUsuario\":"+bia+",\"nome\":\"Java\",\"professor\":\"Maria\",\"mediaAprovacao\":6,\"limiteFaltas\":10}"))
   .andExpect(status().isOk());
  Integer id=disciplinas.listarPorUsuario(ana,"%").get(0).getIdDisciplina();
  assertTrue(disciplinas.listarPorUsuario(bia,"%").isEmpty());
  mvc.perform(get("/api/disciplinas").param("idUsuario",ana.toString()).header("Authorization","Bearer "+tokenBia))
   .andExpect(status().isOk()).andExpect(content().json("[]"));
  mvc.perform(delete("/api/disciplinas/"+id).param("idUsuario",ana.toString()).header("Authorization","Bearer "+tokenBia))
   .andExpect(status().isBadRequest());
  assertTrue(disciplinas.existsById(id));
  mvc.perform(put("/api/usuarios/"+ana).header("Authorization","Bearer "+tokenBia).contentType("application/json")
   .content("{\"nome\":\"Outro\",\"email\":\"outro@example.com\"}"))
   .andExpect(status().isForbidden());
  assertThrows(AccessDeniedException.class,()->TestIdentity.callAs(bia,()->disciplinaService.listar(ana,null)));
 }
 @Test void corsAceitaPreflightSemToken() throws Exception {
  mvc.perform(options("/api/avaliacoes").header("Origin","http://localhost:8080")
   .header("Access-Control-Request-Method","POST").header("Access-Control-Request-Headers","Authorization,Content-Type"))
   .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin","http://localhost:8080"));
 }
 @Test void erroRealDePersistenciaNaoExpoeSqlEReverteSomenteAFalha() throws Exception {
  mvc.perform(post("/api/disciplinas").header("Authorization","Bearer "+tokenAna).contentType("application/json")
   .content("{\"nome\":\"Java\",\"professor\":\"Maria\",\"mediaAprovacao\":6,\"limiteFaltas\":10}")).andExpect(status().isOk());
  int disciplina=disciplinas.listarPorUsuario(ana,"%").get(0).getIdDisciplina();
  jdbc.execute("ALTER TABLE falta ADD CONSTRAINT security_quantity_limit CHECK (quantidade_aulas <= 1)");
  try {
   String base="{\"idDisciplina\":"+disciplina+",\"dataFalta\":\"2026-09-30\",\"quantidadeAulas\":";
   mvc.perform(post("/api/faltas").header("Authorization","Bearer "+tokenAna).contentType("application/json").content(base+"1}"))
    .andExpect(status().isOk());
   mvc.perform(post("/api/faltas").header("Authorization","Bearer "+tokenAna).contentType("application/json").content(base+"2}"))
    .andExpect(status().isInternalServerError())
    .andExpect(content().json("{\"mensagem\":\"Erro interno ao processar a solicitação.\"}",true));
   assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM falta",Integer.class));
  } finally {
   jdbc.update("DELETE FROM falta");
   jdbc.execute("ALTER TABLE falta DROP CONSTRAINT security_quantity_limit");
  }
 }

 @org.junit.jupiter.params.ParameterizedTest
 @org.junit.jupiter.params.provider.ValueSource(strings={"0","-1","2147483648","01","+1","abc"})
 void rejeitaIdentidadeInvalidaOuNaoCanonica(String subject) throws Exception {
  Instant agora=Instant.now();
  rejeitar(emitir(encoder,JwtClaimsSet.builder().subject(subject).issuer("studymate-api")
   .audience(List.of("studymate-app")).issuedAt(agora).expiresAt(agora.plusSeconds(3600)).build()));
 }
 @org.junit.jupiter.params.ParameterizedTest
 @org.junit.jupiter.params.provider.ValueSource(strings={"iat-ausente","iat-futuro","exp-antes-iat","nbf-futuro","iss-ausente","aud-ausente","exp-ausente","sub-ausente"})
 void rejeitaDatasEClaimsObrigatoriasInvalidas(String cenario) throws Exception {
  Instant agora=Instant.now();
  java.util.Map<String,Object> claims=new java.util.HashMap<>(JwtClaimsSet.builder().subject(ana.toString())
   .issuer("studymate-api").audience(List.of("studymate-app")).issuedAt(agora)
   .expiresAt(agora.plusSeconds(3600)).build().getClaims());
  switch(cenario){
   case "iat-ausente" -> claims.remove("iat");
   case "iat-futuro" -> claims.put("iat",agora.plusSeconds(600));
   case "exp-antes-iat" -> {claims.put("iat",agora.plusSeconds(120));claims.put("exp",agora.plusSeconds(60));}
   case "nbf-futuro" -> claims.put("nbf",agora.plusSeconds(600));
   case "iss-ausente" -> claims.remove("iss");
   case "aud-ausente" -> claims.remove("aud");
   case "exp-ausente" -> claims.remove("exp");
   case "sub-ausente" -> claims.remove("sub");
   default -> throw new IllegalArgumentException(cenario);
  }
  String token;
  if(cenario.equals("exp-antes-iat")) {
   com.nimbusds.jwt.SignedJWT assinado=new com.nimbusds.jwt.SignedJWT(
    new com.nimbusds.jose.JWSHeader(com.nimbusds.jose.JWSAlgorithm.HS256),
    new com.nimbusds.jwt.JWTClaimsSet.Builder().subject(ana.toString()).issuer("studymate-api")
     .audience("studymate-app").issueTime(java.util.Date.from(agora.plusSeconds(120)))
     .expirationTime(java.util.Date.from(agora.plusSeconds(60))).build());
   assinado.sign(new com.nimbusds.jose.crypto.MACSigner(chaveJwt.getEncoded()));
   token=assinado.serialize();
  } else {
   token=emitir(encoder,JwtClaimsSet.builder().claims(m->m.putAll(claims)).build());
  }
  if(cenario.equals("iat-ausente")) assertNull(com.nimbusds.jwt.SignedJWT.parse(token).getJWTClaimsSet().getIssueTime());
  rejeitar(token);
 }
 @Test void loginGeraTokensDistintosSemSenhaNasClaims() throws Exception {
  Jwt primeiro=decoder.decode(tokenAna);
  Jwt segundo=decoder.decode(login("ana@example.com"));
  assertEquals("HS256",primeiro.getHeaders().get("alg"));
  assertNotNull(primeiro.getId());
  assertNotEquals(primeiro.getId(),segundo.getId());
  assertFalse(primeiro.getClaims().containsKey("senha"));
  assertFalse(primeiro.getClaims().containsKey("senha_hash"));
 }
 @Test void tokenNaQueryOuBasicNaoAutenticaEAssinaturaAlteradaEhRecusada() throws Exception {
  mvc.perform(get("/api/disciplinas").param("access_token",tokenAna)).andExpect(status().isUnauthorized());
  mvc.perform(get("/api/disciplinas").header("Authorization","Basic YTpi")).andExpect(status().isUnauthorized());
  String[] partes=tokenAna.split("\\.");
  partes[2]=(partes[2].charAt(0)=='A'?"B":"A")+partes[2].substring(1);
  rejeitar(String.join(".",partes));
  rejeitar("eyJhbGciOiJub25lIn0.eyJzdWIiOiIxIn0.");
 }

 @org.junit.jupiter.params.ParameterizedTest
 @org.junit.jupiter.params.provider.NullSource
 @org.junit.jupiter.params.provider.ValueSource(ints={0,-1})
 void emissaoRecusaUsuarioInvalido(Integer id) {
  assertThrows(IllegalArgumentException.class,()->jwtService.emitir(id));
 }
 private void registrar(String email) {
  var request=new br.com.studymate.dto.RegisterRequest();request.setNome("Teste");
  request.setEmail(email);request.setSenha("segredo123");provisionamento.criar(request);
 }
 private String login(String email) throws Exception {
  String body=mvc.perform(post("/api/auth/login").contentType("application/json")
   .content("{\"email\":\""+email+"\",\"senha\":\"segredo123\"}"))
   .andExpect(status().isOk()).andExpect(jsonPath("$.token").isString())
   .andExpect(jsonPath("$.tipo").value("Bearer")).andExpect(jsonPath("$.senha").doesNotExist()).andReturn().getResponse().getContentAsString();
  return body.split("\"token\":\"")[1].split("\"")[0];
 }
 private String emitir(JwtEncoder encoder,JwtClaimsSet claims){return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(),claims)).getTokenValue();}
 private void rejeitar(String token) throws Exception {mvc.perform(get("/api/disciplinas").header("Authorization","Bearer "+token)).andExpect(status().isUnauthorized());}
}
