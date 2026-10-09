package br.com.studymate;

import br.com.studymate.dto.*;
import br.com.studymate.service.*;
import br.com.studymate.exception.AvaliacaoNaoEncontradaException;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import java.math.BigDecimal;
import java.time.LocalDate;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class AvaliacaoFlowTests {
    @Autowired AvaliacaoService service;
    @Autowired UsuarioService usuarios;
    @Autowired DisciplinaService disciplinas;
    @Autowired JdbcTemplate jdbc;
    @Autowired WebApplicationContext context;
    Integer usuario, outro, disciplina, disciplinaOutro;
    MockMvc mvc;
    @BeforeEach void preparar() {
        for (String tabela : new String[]{"sync_request","email_verification","tarefa","avaliacao","falta","disciplina","periodo_letivo","progresso_estudante","usuario"})
            jdbc.update("DELETE FROM " + tabela);
        usuario = usuario("ana@example.com"); outro = usuario("bia@example.com");
        disciplina = disciplina(usuario); disciplinaOutro = disciplina(outro);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).defaultRequest(get("/").with(jwt().jwt(j -> j.subject(usuario.toString())))).build();
    }
    @Test void crudEMediaPonderadaIgnoramNotasPendentes() {
        assertNull(TestIdentity.callAs(usuario, () -> service.calcularMedia(disciplina, usuario)).media());
        var a = TestIdentity.callAs(usuario, () -> service.cadastrar(usuario, request(disciplina,"8.00","2.00")));
        var b = TestIdentity.callAs(usuario, () -> service.cadastrar(usuario, request(disciplina,"5.00","1.00")));
        TestIdentity.callAs(usuario, () -> service.cadastrar(usuario, request(disciplina,null,"10.00")));
        var media = TestIdentity.callAs(usuario, () -> service.calcularMedia(disciplina,usuario));
        assertEquals(new BigDecimal("7.00"), media.media());
        assertEquals(2,media.avaliacoesComNota()); assertEquals(1,media.avaliacoesPendentes());
        TestIdentity.callAs(usuario, () -> service.alterar(b.idAvaliacao(),usuario,request(disciplina,"2.00","1.00")));
        assertEquals(new BigDecimal("6.00"),TestIdentity.callAs(usuario, () -> service.calcularMedia(disciplina,usuario)).media());
        TestIdentity.runAs(usuario, () -> service.excluir(a.idAvaliacao(),usuario));
        assertEquals(new BigDecimal("2.00"),TestIdentity.callAs(usuario, () -> service.calcularMedia(disciplina,usuario)).media());
        assertEquals(2, TestIdentity.callAs(usuario, () -> service.listar(disciplina,usuario)).size());
        assertThrows(AvaliacaoNaoEncontradaException.class, () -> TestIdentity.callAs(usuario, () -> service.consultar(a.idAvaliacao(),usuario)));
    }
    @Test void usuarioNaoManipulaAvaliacaoOuDisciplinaDeOutraConta() {
        var a = TestIdentity.callAs(usuario, () -> service.cadastrar(usuario,request(disciplina,"8","1")));
        assertThrows(AvaliacaoNaoEncontradaException.class, () -> TestIdentity.callAs(outro, () -> service.consultar(a.idAvaliacao(),outro)));
        assertThrows(AvaliacaoNaoEncontradaException.class, () -> TestIdentity.runAs(outro, () -> service.excluir(a.idAvaliacao(),outro)));
        assertThrows(AvaliacaoNaoEncontradaException.class, () -> TestIdentity.callAs(outro, () -> service.alterar(a.idAvaliacao(),outro,request(disciplinaOutro,"2","1"))));
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(usuario, () -> service.alterar(a.idAvaliacao(),usuario,request(disciplinaOutro,"2","1"))));
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(outro, () -> service.cadastrar(outro,request(disciplina,"2","1"))));
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(outro, () -> service.calcularMedia(disciplina,outro)));
        assertEquals(0,new BigDecimal("8.00").compareTo(TestIdentity.callAs(usuario, () -> service.consultar(a.idAvaliacao(),usuario)).nota()));
    }
    @Test void validacoesERespostasHttp() throws Exception {
        assertThrows(ConstraintViolationException.class, () -> TestIdentity.callAs(usuario, () -> service.cadastrar(usuario,request(disciplina,"11","1"))));
        assertThrows(ConstraintViolationException.class, () -> TestIdentity.callAs(usuario, () -> service.cadastrar(usuario,request(disciplina,"8","0"))));
        assertThrows(ConstraintViolationException.class, () -> TestIdentity.callAs(usuario, () -> service.cadastrar(usuario,request(disciplina,"8.001","1"))));
        assertTrue(TestIdentity.callAs(usuario, () -> service.listar(disciplina,usuario)).isEmpty());
        String json = "{\"idDisciplina\":"+disciplina+",\"nome\":\"Prova\",\"tipo\":\"PROVA\",\"nota\":8,\"peso\":2,\"dataAvaliacao\":\"2026-10-01\"}";
        mvc.perform(post("/api/avaliacoes").param("idUsuario",usuario.toString()).contentType("application/json").content(json))
            .andExpect(status().isOk()).andExpect(jsonPath("$.idAvaliacao").isNumber());
        mvc.perform(get("/api/avaliacoes/media").param("idUsuario",usuario.toString()).param("idDisciplina",disciplina.toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.media").value(8.0));
        mvc.perform(post("/api/avaliacoes").param("idUsuario",usuario.toString()).contentType("application/json").content(json.replace("\"nota\":8","\"nota\":11")))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").exists());
        mvc.perform(get("/api/avaliacoes/999999").param("idUsuario",usuario.toString())).andExpect(status().isNotFound());
        mvc.perform(get("/api/avaliacoes")).andExpect(status().isBadRequest());
    }
    private AvaliacaoRequest request(Integer id,String nota,String peso) {
        return new AvaliacaoRequest(id,"Prova","PROVA",nota == null ? null : new BigDecimal(nota),new BigDecimal(peso),LocalDate.of(2026,10,1));
    }
    private Integer usuario(String email) {
        RegisterRequest r=new RegisterRequest(); r.setNome("Teste");r.setEmail(email);r.setSenha("segredo123");
        return usuarios.criar(r).getIdUsuario();
    }
    private Integer disciplina(Integer usuario) {
        DisciplinaRequest r=new DisciplinaRequest();r.setIdUsuario(usuario);r.setNome("Matematica");r.setProfessor("Professor");r.setMediaAprovacao(6.0);r.setLimiteFaltas(10);
        return TestIdentity.callAs(usuario, () -> disciplinas.cadastrar(r)).getIdDisciplina();
    }
}
