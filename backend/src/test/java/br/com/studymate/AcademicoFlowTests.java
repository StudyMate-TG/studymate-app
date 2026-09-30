package br.com.studymate;

import br.com.studymate.dto.*;
import br.com.studymate.repository.PeriodoLetivoRepository;
import br.com.studymate.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
class AcademicoFlowTests {
    @Autowired PeriodoLetivoService periodos;
    @Autowired DisciplinaService disciplinas;
    @Autowired UsuarioService usuarios;
    @Autowired PeriodoLetivoRepository periodoRepository;
    @Autowired JdbcTemplate jdbc;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired WebApplicationContext context;
    MockMvc mvc;
    Integer usuario;
    Integer outro;

    @BeforeEach
    void preparar() {
        jdbc.update("DELETE FROM avaliacao");
        jdbc.update("DELETE FROM falta");
        jdbc.update("DELETE FROM disciplina");
        jdbc.update("DELETE FROM periodo_letivo");
        jdbc.update("DELETE FROM progresso_estudante");
        jdbc.update("DELETE FROM usuario");
        usuario = criarUsuario("ana@example.com");
        outro = criarUsuario("bia@example.com");
        mvc = MockMvcBuilders.webAppContextSetup(context).build();
    }

    @Test
    void crudPeriodoMantemUmAtivoESeparaUsuarios() {
        var primeiro = periodos.cadastrar(periodo(usuario, "Primeiro", "ativo"));
        var segundo = periodos.cadastrar(periodo(usuario, "Segundo", null));
        assertEquals("INATIVO", periodos.consultarPorId(primeiro.getIdPeriodo(), usuario).getStatus());
        assertEquals(segundo.getIdPeriodo(), periodos.consultarAtivo(usuario).getIdPeriodo());
        periodos.ativar(primeiro.getIdPeriodo(), usuario);
        assertEquals("INATIVO", periodos.consultarPorId(segundo.getIdPeriodo(), usuario).getStatus());
        assertThrows(IllegalArgumentException.class, () -> periodos.ativar(primeiro.getIdPeriodo(), outro));
        assertThrows(IllegalArgumentException.class, () -> periodos.excluir(primeiro.getIdPeriodo(), outro));
        var edit = periodo(usuario, "Renomeado", "CONCLUIDO");
        assertEquals("Renomeado", periodos.alterar(primeiro.getIdPeriodo(), usuario, edit).getNome());
        assertTrue(periodos.listar(outro).isEmpty());
        periodos.excluir(segundo.getIdPeriodo(), usuario);
        assertEquals(1, periodos.listar(usuario).size());
        edit.setDataFim(edit.getDataInicio().minusDays(1));
        assertThrows(IllegalArgumentException.class, () -> periodos.cadastrar(edit));
    }

    @Test
    void disciplinasPreservamPeriodoBuscaENomePeriodo() throws Exception {
        var d = disciplinas.cadastrar(disciplina(usuario, null, "Matematica", "Maria!"));
        var ativo = periodos.consultarAtivo(usuario);
        assertEquals(ativo.getIdPeriodo(), d.getIdPeriodo());
        assertEquals("Período atual", d.getNomePeriodo());
        var outra = disciplinas.cadastrar(disciplina(usuario, null, "Fisica", "Jose"));
        assertEquals(d.getIdPeriodo(), outra.getIdPeriodo());
        assertEquals(1, disciplinas.listar(usuario, " mArIa ").size());
        assertEquals(1, disciplinas.listar(usuario, "MATEM").size());
        assertEquals(1, disciplinas.listar(usuario, "Maria!").size());
        assertTrue(disciplinas.listar(outro, null).isEmpty());
        assertThrows(IllegalArgumentException.class,
                () -> disciplinas.consultarPorId(d.getIdDisciplina(), outro));
        assertThrows(IllegalArgumentException.class,
                () -> disciplinas.cadastrar(disciplina(outro, ativo.getIdPeriodo(), "X", "Y")));
        assertThrows(IllegalArgumentException.class,
                () -> disciplinas.alterar(d.getIdDisciplina(), outro, disciplina(outro, null, "X", "Y")));
        assertThrows(IllegalArgumentException.class,
                () -> disciplinas.excluir(d.getIdDisciplina(), outro));
        var edit = disciplina(usuario, null, "Algebra", "Maria");
        assertEquals("Algebra", disciplinas.alterar(d.getIdDisciplina(), usuario, edit).getNome());
        mvc.perform(get("/api/disciplinas").param("idUsuario", usuario.toString()).param("termo", "Algebra"))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].nomePeriodo").value("Período atual"));
        mvc.perform(get("/api/disciplinas/{id}", d.getIdDisciplina()).param("idUsuario", outro.toString()))
                .andExpect(status().isBadRequest());
        assertThrows(IllegalArgumentException.class, () -> periodos.excluir(ativo.getIdPeriodo(), usuario));
        disciplinas.excluir(d.getIdDisciplina(), usuario);
        disciplinas.excluir(outra.getIdDisciplina(), usuario);
        periodos.excluir(ativo.getIdPeriodo(), usuario);
    }

    @Test
    void rollbackRestauraPeriodoAtivoEDesfazPeriodoPadrao() {
        var original = periodos.cadastrar(periodo(usuario, "Original", "ATIVO"));
        assertThrows(IllegalStateException.class, () ->
                new TransactionTemplate(transactionManager).execute(status -> {
                    periodos.cadastrar(periodo(usuario, "Novo", "ATIVO"));
                    throw new IllegalStateException("Falha simulada");
                }));
        assertEquals(original.getIdPeriodo(), periodos.consultarAtivo(usuario).getIdPeriodo());
        assertEquals(1, periodos.listar(usuario).size());
        assertThrows(IllegalStateException.class, () ->
                new TransactionTemplate(transactionManager).execute(status -> {
                    disciplinas.cadastrar(disciplina(outro, null, "Teste", "Professor"));
                    throw new IllegalStateException("Falha simulada");
                }));
        assertTrue(periodos.listar(outro).isEmpty());
        assertTrue(disciplinas.listar(outro, null).isEmpty());
    }

    @Test
    void concorrenciaNaoCriaDoisPeriodosPadrao() throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch inicio = new CountDownLatch(1);
        try {
            Future<DisciplinaResponse> a = executor.submit(() -> {
                inicio.await();
                return disciplinas.cadastrar(disciplina(usuario, null, "A", "Professor"));
            });
            Future<DisciplinaResponse> b = executor.submit(() -> {
                inicio.await();
                return disciplinas.cadastrar(disciplina(usuario, null, "B", "Professor"));
            });
            inicio.countDown();
            assertEquals(a.get(15, TimeUnit.SECONDS).getIdPeriodo(), b.get(15, TimeUnit.SECONDS).getIdPeriodo());
            assertEquals(1, periodoRepository.findByIdUsuarioAndStatus(usuario, "ATIVO").size());
            assertEquals(2, disciplinas.listar(usuario, null).size());
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void exclusaoComVinculoEValidacaoNaoDeixamGravacoesParciais() {
        var request = disciplina(usuario, null, "Teste", "Professor");
        request.setMediaAprovacao(Double.NaN);
        assertThrows(IllegalArgumentException.class, () -> disciplinas.cadastrar(request));
        assertTrue(periodos.listar(usuario).isEmpty());
        var d = disciplinas.cadastrar(disciplina(usuario, null, "Teste", "Professor"));
        jdbc.update("INSERT INTO falta VALUES (1, ?, CURRENT_DATE, 1)", d.getIdDisciplina());
        assertThrows(IllegalArgumentException.class, () -> disciplinas.excluir(d.getIdDisciplina(), usuario));
        assertEquals(d.getIdDisciplina(), disciplinas.consultarPorId(d.getIdDisciplina(), usuario).getIdDisciplina());
    }

    private Integer criarUsuario(String email) {
        var r = new RegisterRequest();
        r.setNome("Teste"); r.setEmail(email); r.setSenha("segredo123");
        return usuarios.criar(r).getIdUsuario();
    }

    private PeriodoLetivoRequest periodo(Integer id, String nome, String status) {
        var r = new PeriodoLetivoRequest();
        r.setIdUsuario(id); r.setNome(nome); r.setStatus(status);
        r.setDataInicio(LocalDate.of(2026, 1, 1)); r.setDataFim(LocalDate.of(2026, 6, 30));
        return r;
    }

    private DisciplinaRequest disciplina(Integer id, Integer periodo, String nome, String professor) {
        var r = new DisciplinaRequest();
        r.setIdUsuario(id); r.setIdPeriodo(periodo); r.setNome(nome); r.setProfessor(professor);
        r.setMediaAprovacao(6.0); r.setLimiteFaltas(10);
        return r;
    }
}
