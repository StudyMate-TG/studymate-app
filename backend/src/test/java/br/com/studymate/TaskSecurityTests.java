package br.com.studymate;

import br.com.studymate.dto.DisciplinaRequest;
import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.model.Tarefa;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.TarefaRepository;
import br.com.studymate.repository.UsuarioRepository;
import br.com.studymate.service.DisciplinaService;
import br.com.studymate.service.TarefaService;
import br.com.studymate.service.UsuarioService;
import jakarta.persistence.EntityManagerFactory;
import jakarta.validation.Validator;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class TaskSecurityTests {
    private static final int MAX_DESCRIPTION = 4096;
    private static final int MAX_COUNT = 1000;
    private static final int MAX_STORED_CHARS = 4096000;
    private static final LocalDateTime DUE = LocalDateTime.of(2026, 10, 10, 12, 0);
    private static final String INSERT_TASK = """
            INSERT INTO tarefa (id_tarefa, id_disciplina, titulo, tipo, descricao,
                data_hora_inicio, data_entrega, data_conclusao, status, prioridade, xp_gerado)
            VALUES (?, ?, ?, 'TRABALHO', ?, NULL, ?, NULL, 'PENDENTE', 'ALTA', 0)
            """;

    @Autowired TarefaService tarefas;
    @Autowired TarefaRepository repository;
    @Autowired UsuarioService usuarios;
    @Autowired DisciplinaService disciplinas;
    @Autowired JdbcTemplate jdbc;
    @Autowired Validator validator;
    @Autowired EntityManagerFactory entityManagerFactory;
    @Autowired WebApplicationContext context;
    Integer usuario, outro, disciplina, disciplinaOutro;
    MockMvc mvc;

    @BeforeEach
    void preparar() {
        for (String tabela : new String[]{"email_verification", "tarefa", "avaliacao", "falta", "disciplina",
                "periodo_letivo", "progresso_estudante", "usuario"}) {
            jdbc.update("DELETE FROM " + tabela);
        }
        usuario = criarUsuario("task-ana@example.com");
        outro = criarUsuario("task-bia@example.com");
        disciplina = criarDisciplina(usuario);
        disciplinaOutro = criarDisciplina(outro);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity())
                .defaultRequest(get("/").with(jwt().jwt(j -> j.subject(usuario.toString())))).build();
        estatisticas().setStatisticsEnabled(true);
    }

    @AfterEach
    void limparTarefas() {
        // Os testes antigos limpam disciplina sem conhecer a nova FK de tarefa.
        jdbc.update("DELETE FROM tarefa");
    }

    @Test
    void crudMantemDescricaoLimitadaStatusEXpDoServidor() throws Exception {
        var criada = cadastrar(request(usuario, disciplina, "  texto  "));
        assertEquals("texto", criada.getDescricao());
        assertEquals("PENDENTE", criada.getStatus());
        assertEquals(0, criada.getXpGerado());
        var edit = request(usuario, disciplina, "x".repeat(MAX_DESCRIPTION));
        edit.setTitulo("Editada");
        var alterada = TestIdentity.callAs(usuario,
                () -> tarefas.alterar(criada.getIdTarefa(), usuario, edit));
        assertEquals(MAX_DESCRIPTION, alterada.getDescricao().length());
        assertEquals("Editada", alterada.getTitulo());
        var concluida = TestIdentity.callAs(usuario,
                () -> tarefas.concluir(criada.getIdTarefa(), usuario));
        assertEquals("CONCLUIDA", concluida.getStatus());
        assertNotNull(concluida.getDataConclusao());
        assertEquals(0, concluida.getXpGerado());
        var dataConclusaoPersistida = TestIdentity.callAs(usuario,
                () -> tarefas.consultarPorId(criada.getIdTarefa(), usuario)).getDataConclusao();
        var novamenteEditada = TestIdentity.callAs(usuario,
                () -> tarefas.alterar(criada.getIdTarefa(), usuario, request(usuario, disciplina, null)));
        assertNull(novamenteEditada.getDescricao());
        assertEquals("CONCLUIDA", novamenteEditada.getStatus());
        assertEquals(dataConclusaoPersistida, novamenteEditada.getDataConclusao());
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(usuario,
                () -> tarefas.concluir(criada.getIdTarefa(), usuario)));
        mvc.perform(get("/api/tarefas/{id}", criada.getIdTarefa()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.titulo").value("Tarefa"));
        TestIdentity.runAs(usuario, () -> tarefas.excluir(criada.getIdTarefa(), usuario));
        assertEquals(0, repository.contarPorUsuario(usuario));
    }

    @Test
    void validaDescricaoBrutaAntesDeTrimEmPostPutServicoEDto() throws Exception {
        for (String descricao : new String[]{"x".repeat(MAX_DESCRIPTION + 1),
                " ".repeat(MAX_DESCRIPTION + 1)}) {
            var r = request(usuario, disciplina, descricao);
            assertTrue(validator.validate(r).stream().anyMatch(v -> v.getPropertyPath().toString().equals("descricao")));
            var entity = new Tarefa();
            entity.setDescricao(descricao);
            assertTrue(validator.validate(entity).stream().anyMatch(v -> v.getPropertyPath().toString().equals("descricao")));
            assertThrows(IllegalArgumentException.class, () -> cadastrar(r));
            mvc.perform(post("/api/tarefas").contentType("application/json").content(json(descricao)))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").exists());
        }
        assertEquals(0, repository.contarPorUsuario(usuario));
        var criada = cadastrar(request(usuario, disciplina, "valida"));
        mvc.perform(put("/api/tarefas/{id}", criada.getIdTarefa())
                        .contentType("application/json").content(json(" ".repeat(MAX_DESCRIPTION + 1))))
                .andExpect(status().isBadRequest());
        assertEquals("valida", TestIdentity.callAs(usuario,
                () -> tarefas.consultarPorId(criada.getIdTarefa(), usuario)).getDescricao());
        assertEquals("", cadastrar(request(usuario, disciplina, " ".repeat(MAX_DESCRIPTION))).getDescricao());
    }

    @Test
    void propriedadeProtegeTodasAsOperacoesEDisciplinaDeDestino() throws Exception {
        var criada = cadastrar(request(usuario, disciplina, "privada"));
        int id = criada.getIdTarefa();
        assertTrue(TestIdentity.callAs(outro, () -> tarefas.listar(outro)).isEmpty());
        assertThrows(AccessDeniedException.class,
                () -> TestIdentity.callAs(outro, () -> tarefas.listar(usuario, 0, 50)));
        assertThrows(IllegalArgumentException.class,
                () -> TestIdentity.callAs(outro, () -> tarefas.consultarPorId(id, outro)));
        assertThrows(IllegalArgumentException.class,
                () -> TestIdentity.callAs(outro, () -> tarefas.concluir(id, outro)));
        assertThrows(IllegalArgumentException.class,
                () -> TestIdentity.runAs(outro, () -> tarefas.excluir(id, outro)));
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(outro,
                () -> tarefas.alterar(id, outro, request(outro, disciplinaOutro, "invasao"))));
        assertThrows(IllegalArgumentException.class,
                () -> cadastrar(request(usuario, disciplinaOutro, "invasao")));
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(usuario,
                () -> tarefas.alterar(id, usuario, request(usuario, disciplinaOutro, "invasao"))));
        mvc.perform(get("/api/tarefas/{id}", id).with(jwt().jwt(j -> j.subject(outro.toString()))))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/tarefas/{id}", id).with(jwt().jwt(j -> j.subject(outro.toString()))))
                .andExpect(status().isBadRequest());
        assertEquals("privada", TestIdentity.callAs(usuario,
                () -> tarefas.consultarPorId(id, usuario)).getDescricao());
    }

    @Test
    void paginacaoFiltraProprietarioAntesDoLimiteOrdenaIdsEEvitaClob() throws Exception {
        semear(disciplinaOutro, 60, null, DUE.minusDays(1));
        var ids = semear(disciplina, 60, "legada".repeat(10000), DUE);
        estatisticas().clear();
        var primeira = TestIdentity.callAs(usuario, () -> tarefas.listar(usuario));
        var segunda = TestIdentity.callAs(usuario, () -> tarefas.listar(usuario, 1, 50));
        assertEquals(ids.subList(0, 50), primeira.stream().map(t -> t.getIdTarefa()).toList());
        assertEquals(ids.subList(50, 60), segunda.stream().map(t -> t.getIdTarefa()).toList());
        assertEquals(0, cargasDeTarefa());
        mvc.perform(get("/api/tarefas"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(50))
                .andExpect(header().string("X-Next-Page", "1"))
                .andExpect(jsonPath("$[0].idTarefa").value(ids.get(0)))
                .andExpect(jsonPath("$[0].descricao").doesNotExist())
                .andExpect(jsonPath("$[0].titulo").exists())
                .andExpect(jsonPath("$[0].prioridade").value("ALTA"))
                .andExpect(jsonPath("$[0].dataEntrega").exists())
                .andExpect(jsonPath("$[0].nomeDisciplina").value("Matematica"));
        mvc.perform(get("/api/tarefas").param("page", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(10))
                .andExpect(header().doesNotExist("X-Next-Page"));
        mvc.perform(get("/api/tarefas").param("page", "10000"))
                .andExpect(status().isOk()).andExpect(content().json("[]"));
        assertEquals(0, cargasDeTarefa());
        for (String[] params : new String[][]{{"page", "-1"}, {"page", "10001"},
                {"page", "2147483647"}, {"page", "abc"}, {"size", "-1"}, {"size", "0"}, {"size", "51"}}) {
            mvc.perform(get("/api/tarefas").param(params[0], params[1])).andExpect(status().isBadRequest());
        }
        assertThrows(IllegalArgumentException.class,
                () -> TestIdentity.callAs(usuario, () -> tarefas.listar(usuario, -1, 50)));
        assertThrows(IllegalArgumentException.class,
                () -> TestIdentity.callAs(usuario, () -> tarefas.listar(usuario, 0, 51)));
    }

    @Test
    void contaNoLimiteRejeitaEscritaConcorrenteMasOutraContaTemCotaPropria() throws Exception {
        semear(disciplina, MAX_COUNT - 1, null, DUE);
        assertEquals(1, cadastrarConcorrentes("x"));
        assertEquals(MAX_COUNT, repository.contarPorUsuario(usuario));
        assertThrows(IllegalArgumentException.class, () -> cadastrar(request(usuario, disciplina, null)));
        assertNotNull(TestIdentity.callAs(outro,
                () -> tarefas.cadastrar(request(outro, disciplinaOutro, "outro"))).getIdTarefa());
        int primeiro = jdbc.queryForObject("SELECT MIN(id_tarefa) FROM tarefa WHERE id_disciplina = ?",
                Integer.class, disciplina);
        TestIdentity.runAs(usuario, () -> tarefas.excluir(primeiro, usuario));
        assertNotNull(cadastrar(request(usuario, disciplina, null)).getIdTarefa());
        assertEquals(MAX_COUNT, repository.contarPorUsuario(usuario));
    }

    @Test
    void cotaDeCaracteresSerializaEscritasConcorrentesEEdicoes() throws Exception {
        semear(disciplina, 1, "x".repeat(MAX_STORED_CHARS - 3), DUE);
        assertEquals(1, cadastrarConcorrentes("yy"));
        assertEquals(MAX_STORED_CHARS - 1L, repository.totalCaracteresPorUsuario(usuario));
        int pequena = jdbc.queryForObject("SELECT MAX(id_tarefa) FROM tarefa WHERE id_disciplina = ?",
                Integer.class, disciplina);
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(usuario,
                () -> tarefas.alterar(pequena, usuario, request(usuario, disciplina, "yyyy"))));
        assertEquals(MAX_STORED_CHARS - 1L, repository.totalCaracteresPorUsuario(usuario));
        TestIdentity.callAs(usuario,
                () -> tarefas.alterar(pequena, usuario, request(usuario, disciplina, "yyy")));
        assertEquals(MAX_STORED_CHARS, repository.totalCaracteresPorUsuario(usuario));
        assertThrows(IllegalArgumentException.class, () -> cadastrar(request(usuario, disciplina, "x")));
    }

    @Test
    void legadoGrandeNaoCarregaEmDetalheConclusaoOuExclusaoEModificaSemPerderStatus() throws Exception {
        int id = semear(disciplina, 1, "x".repeat(100000), DUE).get(0);
        jdbc.update("UPDATE tarefa SET xp_gerado = 7 WHERE id_tarefa = ?", id);
        estatisticas().clear();
        mvc.perform(get("/api/tarefas/{id}", id)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(
                        "A descrição desta tarefa excede o limite. Edite a tarefa antes de consultar ou concluir."));
        mvc.perform(patch("/api/tarefas/{id}/concluir", id)).andExpect(status().isBadRequest());
        assertEquals(0, cargasDeTarefa());
        assertEquals(100000, repository.tamanhoDescricaoPorIdEUsuario(id, usuario).orElseThrow());
        mvc.perform(put("/api/tarefas/{id}", id).contentType("application/json").content(json("corrigida")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.descricao").value("corrigida"))
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.xpGerado").value(7));
        mvc.perform(patch("/api/tarefas/{id}/concluir", id)).andExpect(status().isOk());
        int paraExcluir = semear(disciplina, 1, "x".repeat(100000), DUE).get(0);
        estatisticas().clear();
        TestIdentity.runAs(usuario, () -> tarefas.excluir(paraExcluir, usuario));
        assertEquals(0, cargasDeTarefa());
        assertTrue(repository.tamanhoDescricaoPorIdEUsuario(paraExcluir, usuario).isEmpty());
    }

    @Test
    void legadoAcimaDaCotaPermiteReparacaoProgressivaSemTruncamento() {
        var ids = semear(disciplina, 2, "x".repeat(MAX_STORED_CHARS + 1), DUE);
        int primeiro = ids.get(0), segundo = ids.get(1);
        assertThrows(IllegalArgumentException.class, () -> cadastrar(request(usuario, disciplina, null)));
        var reparada = TestIdentity.callAs(usuario,
                () -> tarefas.alterar(primeiro, usuario, request(usuario, disciplina, "reparada")));
        assertEquals("reparada", reparada.getDescricao());
        assertTrue(repository.totalCaracteresPorUsuario(usuario) > MAX_STORED_CHARS);
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.callAs(usuario,
                () -> tarefas.alterar(primeiro, usuario, request(usuario, disciplina, "reparada maior"))));
        assertEquals(MAX_STORED_CHARS + 1, repository.tamanhoDescricaoPorIdEUsuario(segundo, usuario).orElseThrow());
        TestIdentity.callAs(usuario,
                () -> tarefas.alterar(segundo, usuario, request(usuario, disciplina, "reparada")));
        assertEquals(16, repository.totalCaracteresPorUsuario(usuario));
        assertNotNull(cadastrar(request(usuario, disciplina, "nova")).getIdTarefa());
    }

    @Test
    void configuracaoPodeReduzirLimitesMasNaoAmpliarHardCaps() {
        var tr = mock(TarefaRepository.class);
        var dr = mock(DisciplinaRepository.class);
        var ur = mock(UsuarioRepository.class);
        assertDoesNotThrow(() -> new TarefaService(tr, dr, ur, 1, 1, 1));
        assertThrows(IllegalArgumentException.class, () -> new TarefaService(tr, dr, ur, 1001, 4096, 4096000));
        assertThrows(IllegalArgumentException.class, () -> new TarefaService(tr, dr, ur, 1000, 4097, 4096000));
        assertThrows(IllegalArgumentException.class, () -> new TarefaService(tr, dr, ur, 1000, 4096, 4096001));
        assertThrows(IllegalArgumentException.class, () -> new TarefaService(tr, dr, ur, 0, 4096, 4096000));
    }

    private int cadastrarConcorrentes(String descricao) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch inicio = new CountDownLatch(1);
        try {
            List<Future<Boolean>> resultados = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                resultados.add(executor.submit(() -> {
                    inicio.await();
                    try {
                        cadastrar(request(usuario, disciplina, descricao));
                        return true;
                    } catch (IllegalArgumentException expected) {
                        return false;
                    }
                }));
            }
            inicio.countDown();
            int aceitas = 0;
            for (Future<Boolean> resultado : resultados) {
                if (resultado.get(15, TimeUnit.SECONDS)) aceitas++;
            }
            return aceitas;
        } finally {
            executor.shutdownNow();
        }
    }

    private List<Integer> semear(Integer idDisciplina, int quantidade, String descricao, LocalDateTime entrega) {
        List<Integer> ids = new ArrayList<>();
        List<Object[]> linhas = new ArrayList<>();
        for (int i = 0; i < quantidade; i++) {
            Integer id = jdbc.queryForObject("SELECT seq_tarefa.NEXTVAL FROM dual", Integer.class);
            ids.add(id);
            linhas.add(new Object[]{id, idDisciplina, "Tarefa " + id, descricao, Timestamp.valueOf(entrega)});
        }
        jdbc.batchUpdate(INSERT_TASK, linhas);
        return ids;
    }

    private TarefaRequest request(Integer idUsuario, Integer idDisciplina, String descricao) {
        var r = new TarefaRequest();
        r.setIdUsuario(idUsuario); r.setIdDisciplina(idDisciplina); r.setTitulo("Tarefa");
        r.setTipo("TRABALHO"); r.setDescricao(descricao); r.setDataEntrega(DUE); r.setPrioridade("ALTA");
        return r;
    }

    private br.com.studymate.dto.TarefaResponse cadastrar(TarefaRequest request) {
        return TestIdentity.callAs(request.getIdUsuario(), () -> tarefas.cadastrar(request));
    }

    private String json(String descricao) {
        return "{\"idDisciplina\":" + disciplina + ",\"titulo\":\"Tarefa\",\"tipo\":\"TRABALHO\","
                + "\"descricao\":\"" + descricao + "\",\"dataEntrega\":\"2026-10-10T12:00:00\",\"prioridade\":\"ALTA\"}";
    }

    private Integer criarUsuario(String email) {
        var r = new RegisterRequest();
        r.setNome("Teste"); r.setEmail(email); r.setSenha("segredo123");
        return usuarios.criar(r).getIdUsuario();
    }

    private Integer criarDisciplina(Integer idUsuario) {
        var r = new DisciplinaRequest();
        r.setIdUsuario(idUsuario); r.setNome("Matematica"); r.setProfessor("Professor");
        r.setMediaAprovacao(6.0); r.setLimiteFaltas(10);
        return TestIdentity.callAs(idUsuario, () -> disciplinas.cadastrar(r)).getIdDisciplina();
    }

    private org.hibernate.stat.Statistics estatisticas() {
        return entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
    }

    private long cargasDeTarefa() {
        return estatisticas().getEntityStatistics(Tarefa.class.getName()).getLoadCount();
    }
}
