package br.com.studymate;

import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.model.Usuario;
import br.com.studymate.repository.UsuarioRepository;
import br.com.studymate.service.AuthService;
import br.com.studymate.service.UsuarioService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class UsuarioFlowTests {
    @Autowired WebApplicationContext context;
    @Autowired UsuarioRepository repository;
    @Autowired UsuarioService usuarioService;
    @Autowired AuthService authService;
    @Autowired PasswordEncoder encoder;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;
    MockMvc mvc;

    @BeforeEach
    void preparar() {
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
        jdbc.update("DELETE FROM avaliacao");
        jdbc.update("DELETE FROM falta");
        jdbc.update("DELETE FROM disciplina");
        jdbc.update("DELETE FROM periodo_letivo");
        jdbc.update("DELETE FROM progresso_estudante");
        repository.deleteAll();
    }

    @Test
    void cadastroGeraIdHashDataEProgressoEPermiteLogin() throws Exception {
        mvc.perform(post("/api/auth/register").contentType("application/json")
                .content("""
                        {"nome":" Ana ","email":"ANA@example.com","senha":"segredo123"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.idUsuario").isNumber())
                .andExpect(jsonPath("$.nome").value("Ana"))
                .andExpect(jsonPath("$.email").value("ana@example.com"))
                .andExpect(jsonPath("$.senha").doesNotExist());
        Usuario salvo = repository.findByEmailIgnoreCase("ana@example.com").orElseThrow();
        assertNotNull(salvo.getDataCriacao());
        assertNotEquals("segredo123", salvo.getSenha());
        assertTrue(encoder.matches("segredo123", salvo.getSenha()));
        assertEquals(1, jdbc.queryForObject(
                "SELECT nivel FROM progresso_estudante WHERE id_usuario = ?", Integer.class, salvo.getIdUsuario()));
        mvc.perform(post("/api/auth/login").contentType("application/json")
                .content("""
                        {"email":"ANA@example.com","senha":"segredo123"}
                        """)).andExpect(status().isOk()).andExpect(jsonPath("$.senha").doesNotExist());
        mvc.perform(post("/api/auth/login").contentType("application/json")
                .content("""
                        {"email":"ana@example.com","senha":"incorreta"}
                        """)).andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/register").contentType("application/json")
                .content("""
                        {"nome":"Outra","email":"ANA@example.com","senha":"segredo123"}
                        """)).andExpect(status().isConflict()).andExpect(jsonPath("$.mensagem").exists());
    }

    @Test
    void edicaoAtualizaEmailPreservaCredenciaisETrataErros() throws Exception {
        UsuarioResponse a = cadastrar("ana@example.com");
        cadastrar("outro@example.com");
        Usuario antes = repository.findById(a.getIdUsuario()).orElseThrow();
        mvc.perform(put("/api/usuarios/{id}", a.getIdUsuario()).contentType("application/json")
                .content("""
                        {"nome":" Ana Silva ","email":"NOVO@example.com","curso":" SI ",
                         "matricula":" ","instituicao":null}
                        """)).andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("novo@example.com"))
                .andExpect(jsonPath("$.curso").value("SI"));
        Usuario depois = repository.findById(a.getIdUsuario()).orElseThrow();
        assertEquals(antes.getSenha(), depois.getSenha());
        assertEquals(antes.getDataCriacao(), depois.getDataCriacao());
        assertNull(depois.getMatricula());
        mvc.perform(put("/api/usuarios/{id}", a.getIdUsuario()).contentType("application/json")
                .content("""
                        {"nome":"Ana","email":"NOVO@example.com"}
                        """)).andExpect(status().isOk());
        mvc.perform(put("/api/usuarios/{id}", a.getIdUsuario()).contentType("application/json")
                .content("""
                        {"nome":"Ana","email":"OUTRO@example.com"}
                        """)).andExpect(status().isConflict());
        mvc.perform(put("/api/usuarios/{id}", a.getIdUsuario()).contentType("application/json")
                .content("""
                        {"nome":" ","email":"novo@example.com"}
                        """)).andExpect(status().isBadRequest());
        mvc.perform(put("/api/usuarios/2147483647").contentType("application/json")
                .content("""
                        {"nome":"Ana","email":"novo@example.com"}
                        """)).andExpect(status().isNotFound());
        mvc.perform(put("/api/usuarios/0").contentType("application/json")
                .content("""
                        {"nome":"Ana","email":"novo@example.com"}
                        """)).andExpect(status().isBadRequest());
    }

    @Test
    void rollbackDesfazUsuarioEProgressoJuntos() {
        String email = UUID.randomUUID() + "@example.com";
        assertThrows(IllegalStateException.class, () ->
                new TransactionTemplate(transactionManager).execute(status -> {
                    UsuarioResponse criado = cadastrar(email);
                    assertEquals(1, jdbc.queryForObject(
                            "SELECT COUNT(*) FROM progresso_estudante WHERE id_usuario = ?",
                            Integer.class, criado.getIdUsuario()));
                    throw new IllegalStateException("Simula falha apos as duas gravacoes");
                }));
        assertFalse(repository.existsByEmailIgnoreCase(email));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM progresso_estudante", Integer.class));
    }

    @Test
    void rejeitaEntradaInvalidaESenhaUtf8MaiorQueLimiteDoBcrypt() throws Exception {
        mvc.perform(post("/api/auth/register").contentType("application/json")
                .content("""
                        {"nome":"Ana","email":"invalido","senha":"123"}
                        """)).andExpect(status().isBadRequest());
        RegisterRequest request = new RegisterRequest();
        request.setNome("Ana");
        request.setEmail("ana@example.com");
        request.setSenha("á".repeat(40));
        assertThrows(IllegalArgumentException.class, () -> usuarioService.criar(request));
        assertEquals(0, repository.count());
    }

    private UsuarioResponse cadastrar(String email) {
        RegisterRequest request = new RegisterRequest();
        request.setNome("Ana");
        request.setEmail(email);
        request.setSenha("segredo123");
        return authService.cadastrar(request);
    }
}
