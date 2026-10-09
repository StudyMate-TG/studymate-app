package br.com.studymate;

import br.com.studymate.dto.DisciplinaRequest;
import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.SyncTarefaRequest;
import br.com.studymate.dto.SyncTarefaResponse;
import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.repository.TarefaRepository;
import br.com.studymate.service.DisciplinaService;
import br.com.studymate.service.SyncService;
import br.com.studymate.service.TarefaService;
import br.com.studymate.service.UsuarioService;
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

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@org.springframework.context.annotation.Import(SecurityTestMailConfig.class)
@ActiveProfiles("test")
class SyncSecurityTests {
    @Autowired SyncService sync;
    @Autowired TarefaService tarefas;
    @Autowired TarefaRepository repository;
    @Autowired UsuarioService usuarios;
    @Autowired DisciplinaService disciplinas;
    @Autowired JdbcTemplate jdbc;
    @Autowired WebApplicationContext context;
    @Autowired jakarta.persistence.EntityManagerFactory entityManagerFactory;
    MockMvc mvc;
    Integer usuario, outro, disciplina, disciplinaOutro;

    @BeforeEach
    void preparar() {
        for (String tabela : new String[]{"sync_request", "email_verification", "tarefa", "avaliacao", "falta",
                "disciplina", "periodo_letivo", "progresso_estudante", "usuario"}) {
            jdbc.update("DELETE FROM " + tabela);
        }
        usuario = usuario("sync-ana@example.com");
        outro = usuario("sync-bia@example.com");
        disciplina = disciplina(usuario);
        disciplinaOutro = disciplina(outro);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void tokenEhObrigatorioEIdsRecebidosNaoTrocamProprietario() throws Exception {
        String tx = UUID.randomUUID().toString();
        String body = json(tx, disciplina, "texto");
        mvc.perform(get("/api/sync/tarefas").param("idUsuario", usuario.toString()))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/sync/tarefas").contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/sync/tarefas").with(jwt().jwt(j -> j.subject(usuario.toString())))
                        .contentType("application/json").content(body))
                .andExpect(status().isOk()).andExpect(jsonPath("$.alreadyProcessed").value(false));
        assertEquals(usuario, jdbc.queryForObject("SELECT id_usuario FROM sync_request WHERE client_tx_id = ?",
                Integer.class, tx));
        assertEquals(1, repository.contarPorUsuario(usuario));
        assertEquals(0, repository.contarPorUsuario(outro));
        mvc.perform(get("/api/sync/tarefas").param("idUsuario", outro.toString())
                        .with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tarefas.length()").value(1));
        mvc.perform(get("/api/sync/tarefas").param("idUsuario", usuario.toString())
                        .with(jwt().jwt(j -> j.subject(outro.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tarefas.length()").value(0));
    }

    @Test
    void disciplinaDeTerceiroFalhaSemGravacaoParcialEServiceExigeIdentidade() throws Exception {
        String tx = UUID.randomUUID().toString();
        mvc.perform(post("/api/sync/tarefas").with(jwt().jwt(j -> j.subject(usuario.toString())))
                        .contentType("application/json").content(json(tx, disciplinaOutro, "invasao")))
                .andExpect(status().isBadRequest());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM sync_request", Integer.class));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM tarefa", Integer.class));
        RuntimeException erro = assertThrows(RuntimeException.class,
                () -> sync.buscarAlteracoesTarefas(usuario, null));
        Throwable causa = erro;
        while (causa.getCause() != null) causa = causa.getCause();
        assertInstanceOf(org.springframework.security.authentication.AuthenticationCredentialsNotFoundException.class, causa);
        assertThrows(AccessDeniedException.class,
                () -> TestIdentity.callAs(outro, () -> sync.buscarAlteracoesTarefas(usuario, null)));
    }

    @Test
    void reenviosConcorrentesAplicamUmaUnicaCriacao() throws Exception {
        String tx = UUID.randomUUID().toString();
        var executor = Executors.newFixedThreadPool(2);
        var inicio = new CountDownLatch(1);
        try {
            List<Future<SyncTarefaResponse>> futuros = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                futuros.add(executor.submit(() -> {
                    inicio.await();
                    return TestIdentity.callAs(usuario, () -> sync.sincronizarTarefa(criar(tx)));
                }));
            }
            inicio.countDown();
            var primeiro = futuros.get(0).get(15, TimeUnit.SECONDS);
            var segundo = futuros.get(1).get(15, TimeUnit.SECONDS);
            assertEquals(primeiro.getIdTarefa(), segundo.getIdTarefa());
            assertNotEquals(primeiro.isAlreadyProcessed(), segundo.isAlreadyProcessed());
            assertEquals(1, repository.contarPorUsuario(usuario));
            assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM sync_request", Integer.class));
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void alteracaoConclusaoEExclusaoAtualizamVersaoEPreservamTombstone() {
        var criada = TestIdentity.callAs(usuario, () -> tarefas.cadastrar(tarefa(disciplina, "original")));
        assertNotNull(criada.getUpdatedAt());
        assertNotNull(criada.getVersion());
        var alterada = TestIdentity.callAs(usuario,
                () -> tarefas.alterar(criada.getIdTarefa(), usuario, tarefa(disciplina, "editada")));
        assertEquals(criada.getVersion() + 1, alterada.getVersion());
        var concluida = TestIdentity.callAs(usuario, () -> tarefas.concluir(criada.getIdTarefa(), usuario));
        assertEquals(alterada.getVersion() + 1, concluida.getVersion());
        TestIdentity.runAs(usuario, () -> tarefas.excluir(criada.getIdTarefa(), usuario));
        assertEquals(0, repository.contarPorUsuario(usuario));
        assertTrue(TestIdentity.callAs(usuario, () -> tarefas.listar(usuario)).isEmpty());
        assertThrows(IllegalArgumentException.class,
                () -> TestIdentity.callAs(usuario, () -> tarefas.consultarPorId(criada.getIdTarefa(), usuario)));
        var delta = TestIdentity.callAs(usuario, () -> sync.buscarAlteracoesTarefas(usuario, null));
        assertEquals(1, delta.getTarefas().size());
        var removida = delta.getTarefas().get(0);
        assertEquals(criada.getIdTarefa(), removida.getIdTarefa());
        assertNotNull(removida.getDeletedAt());
        assertNotNull(removida.getUpdatedAt());
        assertNull(removida.getDescricao());
        assertEquals(concluida.getVersion() + 1, removida.getVersion());
    }

    @Test
    void pullPaginaSemPularEmpatesIncluiRemocoesEDeltaSeguinte() {
        var ids = semear(disciplina, 121);
        semear(disciplinaOutro, 55);
        jdbc.update("UPDATE tarefa SET deleted_at = updated_at, descricao = NULL WHERE id_tarefa = ?", ids.get(120));
        List<Integer> recebidos = new ArrayList<>();
        String cursor = null;
        boolean mais;
        int paginas = 0;
        do {
            String atual = cursor;
            var resposta = TestIdentity.callAs(usuario, () -> sync.buscarAlteracoesTarefas(usuario, atual));
            assertTrue(resposta.getTarefas().size() <= 50);
            recebidos.addAll(resposta.getTarefas().stream().map(t -> t.getIdTarefa()).toList());
            cursor = resposta.getCursor();
            mais = resposta.isHasMore();
            paginas++;
            assertTrue(paginas <= 3, "O cursor deve avançar sem repetir a página.");
        } while (mais);
        assertEquals(3, paginas);
        assertEquals(ids, recebidos);
        String finalCursor = cursor;
        assertTrue(TestIdentity.callAs(usuario,
                () -> sync.buscarAlteracoesTarefas(usuario, finalCursor)).getTarefas().isEmpty());
        TestIdentity.callAs(usuario, () -> tarefas.alterar(ids.get(0), usuario, tarefa(disciplina, "nova versao")));
        var delta = TestIdentity.callAs(usuario, () -> sync.buscarAlteracoesTarefas(usuario, finalCursor));
        assertEquals(List.of(ids.get(0)), delta.getTarefas().stream().map(t -> t.getIdTarefa()).toList());
        assertEquals(1L, delta.getTarefas().get(0).getVersion());
        assertEquals(120, repository.contarPorUsuario(usuario));
    }

    @Test
    void cursorInvalidoEDescricaoExcessivaSaoRejeitadosSemRegistrarOperacao() throws Exception {
        mvc.perform(get("/api/sync/tarefas").param("cursor", "nao-e-uma-data")
                        .with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/sync/tarefas").with(jwt().jwt(j -> j.subject(usuario.toString())))
                        .contentType("application/json").content(json(UUID.randomUUID().toString(), disciplina,
                                "x".repeat(4097))))
                .andExpect(status().isBadRequest());
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM sync_request", Integer.class));
        assertEquals(0, repository.contarPorUsuario(usuario));
    }

    @Test
    void pullNaoMaterializaClobLegadoEExclusaoPermiteSincronizarTombstone() throws Exception {
        int id = semear(disciplina, 1).get(0);
        jdbc.update("UPDATE tarefa SET descricao = ? WHERE id_tarefa = ?", "x".repeat(100000), id);
        var statistics = entityManagerFactory.unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        statistics.clear();
        mvc.perform(get("/api/sync/tarefas").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isBadRequest());
        assertEquals(0, statistics.getEntityStatistics(br.com.studymate.model.Tarefa.class.getName()).getLoadCount());
        TestIdentity.runAs(usuario, () -> tarefas.excluir(id, usuario));
        mvc.perform(get("/api/sync/tarefas").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.tarefas[0].idTarefa").value(id))
                .andExpect(jsonPath("$.tarefas[0].deletedAt").exists())
                .andExpect(jsonPath("$.tarefas[0].descricao").doesNotExist());
    }

    @Test
    void reusoDeIdDeOperacaoComOutroComandoRetornaConflitoSemExcluir() throws Exception {
        String tx = UUID.randomUUID().toString();
        var criada = TestIdentity.callAs(usuario, () -> sync.sincronizarTarefa(criar(tx)));
        mvc.perform(post("/api/sync/tarefas").with(jwt().jwt(j -> j.subject(usuario.toString())))
                        .contentType("application/json").content("{\"clientTxId\":\"" + tx
                                + "\",\"operation\":\"DELETE\",\"idTarefa\":" + criada.getIdTarefa() + "}"))
                .andExpect(status().isConflict());
        assertEquals(1, repository.contarPorUsuario(usuario));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM sync_request", Integer.class));
    }
    @Test
    void mesmoUuidDeOutroUsuarioNaoSobrescreveOperacaoOriginal() throws Exception {
        String tx = UUID.randomUUID().toString();
        var criada = TestIdentity.callAs(usuario, () -> sync.sincronizarTarefa(criar(tx)));
        mvc.perform(post("/api/sync/tarefas").with(jwt().jwt(j -> j.subject(outro.toString())))
                        .contentType("application/json").content(json(tx, disciplinaOutro, "outra conta")))
                .andExpect(status().isConflict());
        assertEquals(usuario, jdbc.queryForObject("SELECT id_usuario FROM sync_request WHERE client_tx_id = ?",
                Integer.class, tx));
        assertEquals(criada.getIdTarefa(), jdbc.queryForObject(
                "SELECT response_resource_id FROM sync_request WHERE client_tx_id = ?", Integer.class, tx));
        assertEquals(1, repository.contarPorUsuario(usuario));
        assertEquals(0, repository.contarPorUsuario(outro));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM sync_request", Integer.class));
    }
    private SyncTarefaRequest criar(String tx) {
        var r = new SyncTarefaRequest();
        r.setClientTxId(tx); r.setIdUsuario(usuario); r.setOperation("CREATE");
        r.setTarefa(tarefa(disciplina, "texto"));
        return r;
    }

    private TarefaRequest tarefa(Integer idDisciplina, String descricao) {
        var r = new TarefaRequest();
        r.setIdUsuario(usuario); r.setIdDisciplina(idDisciplina); r.setTitulo("Tarefa");
        r.setTipo("TRABALHO"); r.setDescricao(descricao);
        r.setDataEntrega(LocalDateTime.of(2026, 10, 12, 12, 0)); r.setPrioridade("ALTA");
        return r;
    }

    private String json(String tx, Integer idDisciplina, String descricao) {
        return "{\"clientTxId\":\"" + tx + "\",\"operation\":\"CREATE\",\"idUsuario\":" + outro
                + ",\"tarefa\":{\"idUsuario\":" + outro + ",\"idDisciplina\":" + idDisciplina
                + ",\"titulo\":\"Tarefa\",\"tipo\":\"TRABALHO\",\"descricao\":\"" + descricao
                + "\",\"dataEntrega\":\"2026-10-12T12:00:00\",\"prioridade\":\"ALTA\"}}";
    }

    private List<Integer> semear(Integer idDisciplina, int quantidade) {
        List<Integer> ids = new ArrayList<>();
        List<Object[]> linhas = new ArrayList<>();
        for (int i = 0; i < quantidade; i++) {
            int id = jdbc.queryForObject("SELECT seq_tarefa.NEXTVAL FROM dual", Integer.class);
            ids.add(id);
            linhas.add(new Object[]{id, idDisciplina, "Tarefa " + id,
                    OffsetDateTime.parse("2026-10-01T12:00:00Z")});
        }
        jdbc.batchUpdate("""
                INSERT INTO tarefa (id_tarefa, id_disciplina, titulo, tipo, descricao, data_entrega,
                    status, prioridade, xp_gerado, version, updated_at)
                VALUES (?, ?, ?, 'TRABALHO', 'texto', TIMESTAMP '2026-10-12 12:00:00',
                    'PENDENTE', 'ALTA', 0, 0, ?)
                """, linhas);
        return ids;
    }

    private Integer usuario(String email) {
        var r = new RegisterRequest();
        r.setNome("Teste"); r.setEmail(email); r.setSenha("segredo123");
        return usuarios.criar(r).getIdUsuario();
    }

    private Integer disciplina(Integer idUsuario) {
        var r = new DisciplinaRequest();
        r.setIdUsuario(idUsuario); r.setNome("Matematica"); r.setProfessor("Professor");
        r.setMediaAprovacao(6.0); r.setLimiteFaltas(10);
        return TestIdentity.callAs(idUsuario, () -> disciplinas.cadastrar(r)).getIdDisciplina();
    }
}