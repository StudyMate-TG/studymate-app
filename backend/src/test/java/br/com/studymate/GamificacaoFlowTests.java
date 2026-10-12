package br.com.studymate;

import br.com.studymate.dto.*;
import br.com.studymate.service.*;
import java.time.*;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.Supplier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.context.WebApplicationContext;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:gamificacao_tests;MODE=Oracle;DB_CLOSE_DELAY=-1")
@Import({SecurityTestMailConfig.class, GamificacaoFlowTests.ClockConfig.class})
@ActiveProfiles("test")
class GamificacaoFlowTests {
    @Autowired GamificacaoService gamificacao;
    @Autowired PresencaService presencas;
    @Autowired TarefaService tarefas;
    @Autowired DisciplinaService disciplinas;
    @Autowired UsuarioService usuarios;
    @Autowired SyncService sync;
    @Autowired JdbcTemplate jdbc;
    @Autowired WebApplicationContext context;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired MutableClock clock;
    Integer usuario, outro, disciplina, disciplinaOutro;
    MockMvc mvc;

    @TestConfiguration
    static class ClockConfig {
        @Bean @Primary MutableClock testGamificacaoClock() { return new MutableClock(); }
    }
    static class MutableClock extends Clock {
        private final AtomicReference<Instant> instant;
        private final AtomicReference<Instant> nextInstant;
        private final ZoneId zone;
        MutableClock() { this(new AtomicReference<>(Instant.parse("2026-10-10T15:00:00Z")), new AtomicReference<>(), ZoneOffset.UTC); }
        private MutableClock(AtomicReference<Instant> instant, AtomicReference<Instant> nextInstant, ZoneId zone) {
            this.instant = instant; this.nextInstant = nextInstant; this.zone = zone;
        }
        void set(String value) { instant.set(Instant.parse(value)); nextInstant.set(null); }
        void advanceAfterNextRead(String value) { nextInstant.set(Instant.parse(value)); }
        @Override public ZoneId getZone() { return zone; }
        @Override public Clock withZone(ZoneId zone) { return new MutableClock(instant, nextInstant, zone); }
        @Override public Instant instant() {
            Instant current = instant.get();
            Instant next = nextInstant.getAndSet(null);
            if (next != null) instant.set(next);
            return current;
        }
    }

    @BeforeEach
    void preparar() {
        clock.set("2026-10-10T15:00:00Z");
        for (String tabela : List.of("sync_request", "email_verification", "tarefa", "avaliacao", "falta",
                "disciplina", "periodo_letivo", "progresso_estudante", "usuario")) {
            jdbc.update("DELETE FROM " + tabela);
        }
        usuario = usuario("gamificacao-ana@example.com");
        outro = usuario("gamificacao-bia@example.com");
        disciplina = disciplina(usuario);
        disciplinaOutro = disciplina(outro);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void novasContasComecamZeradasESomenteConsultamAPropriaIdentidade() throws Exception {
        mvc.perform(get("/api/gamificacao")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/presencas").param("idDisciplina", disciplina.toString())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/presencas").contentType("application/json")
                .content("{\"idDisciplina\":" + disciplina + ",\"dataPresenca\":\"2026-10-10\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/gamificacao").param("idUsuario", outro.toString())
                .with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.xpTotal").value(0))
                .andExpect(jsonPath("$.nivel").value(1)).andExpect(jsonPath("$.ofensivaAtual").value(0))
                .andExpect(jsonPath("$.ativoHoje").value(false)).andExpect(jsonPath("$.semana.length()").value(7))
                .andExpect(jsonPath("$.medalhas.length()").value(10));
        assertThrows(AccessDeniedException.class, () -> como(() -> gamificacao.consultar(outro)));
    }

    @Test
    void recompensaUmaVezMesmoAoReabrirReconcluirEExcluir() {
        int tarefa = tarefa();
        var concluida = como(() -> tarefas.concluir(tarefa, usuario));
        assertEquals(30, concluida.getXpGerado());
        var primeiro = progresso();
        assertEquals(30, primeiro.xpTotal());
        assertEquals(1, primeiro.tarefasConcluidas());
        assertEquals(1, primeiro.ofensivaAtual());
        assertTrue(medalha("PRIMEIRA_TAREFA").desbloqueada());
        var instanteMedalha = medalha("PRIMEIRA_TAREFA").desbloqueadaEm();
        assertThrows(IllegalArgumentException.class, () -> como(() -> tarefas.concluir(tarefa, usuario)));
        clock.set("2026-10-11T15:00:00Z");
        como(() -> tarefas.reabrir(tarefa, usuario));
        como(() -> tarefas.concluir(tarefa, usuario));
        TestIdentity.runAs(usuario, () -> tarefas.excluir(tarefa, usuario));
        var depois = progresso();
        assertEquals(30, depois.xpTotal());
        assertEquals(1, depois.tarefasConcluidas());
        assertEquals(0, depois.xpHoje());
        assertFalse(depois.ativoHoje());
        assertEquals(1, depois.ofensivaAtual());
        assertEquals(instanteMedalha, medalha("PRIMEIRA_TAREFA").desbloqueadaEm());
        assertEquals(1, depois.atividadesRecentes().size());
    }

    @Test
    void tarefaComXpLegadoPositivoNaoRecebeNovoCredito() {
        int tarefa = tarefa();
        jdbc.update("UPDATE tarefa SET xp_gerado=7 WHERE id_tarefa=?", tarefa);
        var concluida = como(() -> tarefas.concluir(tarefa, usuario));
        assertEquals(7, concluida.getXpGerado());
        assertEquals(0, progresso().xpTotal());
        assertEquals(0, progresso().tarefasConcluidas());
        assertFalse(progresso().ativoHoje());
        assertFalse(medalha("PRIMEIRA_TAREFA").desbloqueada());
    }

    @Test
    void sincronizacaoDeConclusaoEReplayNaoDuplicamXp() {
        int tarefa = tarefa();
        var concluir = operacao("COMPLETE", tarefa);
        assertFalse(como(() -> sync.sincronizarTarefa(concluir)).isAlreadyProcessed());
        assertTrue(como(() -> sync.sincronizarTarefa(concluir)).isAlreadyProcessed());
        como(() -> sync.sincronizarTarefa(operacao("REOPEN", tarefa)));
        como(() -> sync.sincronizarTarefa(operacao("COMPLETE", tarefa)));
        assertEquals(30, progresso().xpTotal());
        assertEquals(1, progresso().tarefasConcluidas());
    }

    @Test
    void presencasGeramXpValidamDiaDuplicadoPassadoFuturoEProprietario() throws Exception {
        var response = presenca("2026-10-10");
        assertEquals(20, response.xpGerado());
        assertEquals(20, progresso().xpHoje());
        assertTrue(medalha("PRIMEIRA_PRESENCA").desbloqueada());
        assertThrows(IllegalArgumentException.class, () -> presenca("2026-10-10"));
        assertThrows(IllegalArgumentException.class, () -> presenca("2026-10-09"));
        assertThrows(IllegalArgumentException.class, () -> presenca("2026-10-11"));
        assertThrows(IllegalArgumentException.class, () -> como(() -> presencas.cadastrar(usuario,
                new PresencaRequest(disciplinaOutro, LocalDate.of(2026, 10, 10)))));
        assertThrows(IllegalArgumentException.class, () -> como(() -> presencas.listar(usuario, disciplinaOutro)));
        assertThrows(AccessDeniedException.class, () -> como(() -> presencas.listar(outro, disciplinaOutro)));
        mvc.perform(post("/api/presencas").with(jwt().jwt(j -> j.subject(usuario.toString())))
                .contentType("application/json").content("{\"idDisciplina\":"+disciplina+",\"dataPresenca\":\"2026-10-10\",\"xpGerado\":9999}"))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").exists());
        mvc.perform(get("/api/presencas").param("idDisciplina", disciplina.toString())
                .with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].xpGerado").value(20));
        assertEquals(20, progresso().xpTotal());
        assertEquals(0, TestIdentity.callAs(outro, () -> gamificacao.consultar(outro)).xpTotal());
    }

    @Test
    void meiaNoiteSaoPauloMantemOntemEDistingueGapDaOfensivaAtual() {
        clock.set("2026-10-11T02:59:00Z"); // Still Oct 10 in Sao Paulo.
        assertThrows(IllegalArgumentException.class, () -> presenca("2026-10-11"));
        presenca("2026-10-10");
        int tarefa = tarefa();
        como(() -> tarefas.concluir(tarefa, usuario));
        assertEquals(LocalDate.of(2026, 10, 10), progresso().atividadesRecentes().get(0).dataAtividade());
        clock.set("2026-10-11T03:00:00Z");
        assertFalse(progresso().ativoHoje());
        assertEquals(1, progresso().ofensivaAtual());
        assertThrows(IllegalArgumentException.class, () -> presenca("2026-10-10"));
        assertEquals(50, progresso().xpTotal());
        assertEquals(0, progresso().xpHoje());
        presenca("2026-10-11");
        assertEquals(2, progresso().ofensivaAtual());
        clock.set("2026-10-12T15:00:00Z");
        assertEquals(2, progresso().ofensivaAtual());
        clock.set("2026-10-13T03:00:00Z");
        assertEquals(0, progresso().ofensivaAtual());
        assertEquals(2, progresso().melhorOfensiva());
        presenca("2026-10-13");
        assertEquals(1, progresso().ofensivaAtual());
        assertEquals(2, progresso().melhorOfensiva());
    }

    @Test
    void presencasPassadasEFuturasSaoRejeitadasSemXpOuDiasAtivos() throws Exception {
        for (String data : List.of("2026-10-07", "2026-10-09", "2026-10-11")) {
            assertThrows(IllegalArgumentException.class, () -> presenca(data));
            mvc.perform(post("/api/presencas").with(jwt().jwt(j -> j.subject(usuario.toString())))
                    .contentType("application/json").content("{\"idDisciplina\":"+disciplina+",\"dataPresenca\":\""+data+"\"}"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").exists());
        }
        var progresso = progresso();
        assertEquals(0, progresso.ofensivaAtual());
        assertEquals(0, progresso.melhorOfensiva());
        assertFalse(progresso.ativoHoje());
        assertEquals(0, progresso.xpHoje());
        assertEquals(0, progresso.xpTotal());
        assertEquals(0, progresso.diasAtivos());
        assertTrue(progresso.atividadesRecentes().isEmpty());
        assertFalse(medalha("PRIMEIRA_PRESENCA").desbloqueada());
        assertTrue(como(() -> presencas.listar(usuario, disciplina)).isEmpty());
        presenca("2026-10-10");
        assertEquals(1, progresso().ofensivaAtual());
        assertEquals(1, progresso().diasAtivos());
        assertEquals(LocalDate.of(2026, 10, 10), progresso().atividadesRecentes().get(0).dataAtividade());
    }

    @Test
    void pontoDePremiacaoTambemImpedePresencaRetroativaEFutura() {
        for (LocalDate data : List.of(LocalDate.of(2026, 10, 9), LocalDate.of(2026, 10, 11))) {
            assertThrows(IllegalArgumentException.class, () -> TestIdentity.runAs(usuario,
                    () -> gamificacao.premiarPresenca(usuario, 999, "Matemática", data)));
        }
        assertThrows(IllegalArgumentException.class, () -> TestIdentity.runAs(usuario,
                () -> gamificacao.premiarPresenca(usuario, 999, "Matemática", null)));
        assertEquals(0, progresso().xpTotal());
        assertEquals(0, progresso().presencasRegistradas());
        assertEquals(0, progresso().ofensivaAtual());
        assertTrue(progresso().atividadesRecentes().isEmpty());
        assertFalse(medalha("PRIMEIRA_PRESENCA").desbloqueada());
    }

    @Test
    void viradaDoDiaDuranteCadastroDesfazPresencaSemXpOuMedalha() {
        clock.set("2026-10-11T02:59:59.999Z");
        clock.advanceAfterNextRead("2026-10-11T03:00:00Z");
        assertThrows(IllegalArgumentException.class, () -> presenca("2026-10-10"));
        assertTrue(como(() -> presencas.listar(usuario, disciplina)).isEmpty());
        assertEquals(0, progresso().xpTotal());
        assertEquals(0, progresso().presencasRegistradas());
        assertEquals(0, progresso().ofensivaAtual());
        assertTrue(progresso().atividadesRecentes().isEmpty());
        assertFalse(medalha("PRIMEIRA_PRESENCA").desbloqueada());
        var response = presenca("2026-10-11");
        var atividade = progresso().atividadesRecentes().get(0);
        assertEquals(LocalDate.of(2026, 10, 11), response.dataPresenca());
        assertEquals(response.dataPresenca(), atividade.dataAtividade());
        assertEquals(atividade.data().toLocalDate(), atividade.dataAtividade());
        assertEquals(ZoneOffset.ofHours(-3), atividade.data().getOffset());
        assertEquals(20, progresso().xpTotal());
    }

    @Test
    void niveisEMedalhasPermanecemDepoisDeQuebrarOfensivaEExcluirDisciplina() {
        for (int dia = 1; dia <= 30; dia++) {
            String data = "2026-10-" + String.format("%02d", dia);
            clock.set(data + "T15:00:00Z");
            presenca(data);
        }
        clock.set("2026-10-31T15:00:00Z");
        var progresso = progresso();
        assertEquals(600, progresso.xpTotal());
        assertEquals(7, progresso.nivel());
        assertEquals(0, progresso.xpNoNivel());
        assertEquals(100, progresso.xpParaProximoNivel());
        assertEquals(30, progresso.ofensivaAtual());
        assertTrue(medalha("OFENSIVA_30").desbloqueada());
        assertTrue(medalha("PRESENCAS_10").desbloqueada());
        assertTrue(medalha("XP_500").desbloqueada());
        var dataMedalha = medalha("OFENSIVA_30").desbloqueadaEm();
        clock.set("2026-11-02T15:00:00Z");
        TestIdentity.runAs(usuario, () -> disciplinas.excluir(disciplina, usuario));
        assertEquals(0, progresso().ofensivaAtual());
        assertEquals(30, progresso().melhorOfensiva());
        assertEquals(600, progresso().xpTotal());
        assertEquals(dataMedalha, medalha("OFENSIVA_30").desbloqueadaEm());
        assertEquals(30, progresso().presencasRegistradas());
    }

    @Test
    void presencasConcorrentesCreditamSomenteUmaVez() throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        try {
            var inicio = new CountDownLatch(1);
            Callable<Boolean> action = () -> {
                inicio.await();
                try { presenca("2026-10-10"); return true; }
                catch (IllegalArgumentException expected) { return false; }
            };
            var primeiro = executor.submit(action);
            var segundo = executor.submit(action);
            inicio.countDown();
            assertNotEquals(primeiro.get(15, TimeUnit.SECONDS), segundo.get(15, TimeUnit.SECONDS));
        } finally {
            executor.shutdownNow();
        }
        assertEquals(20, progresso().xpTotal());
        assertEquals(1, progresso().presencasRegistradas());
    }

    @Test
    void consultaAguardaPremiacaoConcorrenteERetornaProjecoesCoerentes() throws Exception {
        var executor = Executors.newFixedThreadPool(2);
        var mutacaoPronta = new CountDownLatch(1);
        var liberarCommit = new CountDownLatch(1);
        var consultaIniciada = new CountDownLatch(1);
        try {
            var mutacao = executor.submit(() -> new TransactionTemplate(transactionManager).execute(status -> {
                presenca("2026-10-10");
                // Hold the real account row lock after all reward writes, before the commit.
                mutacaoPronta.countDown();
                try {
                    if (!liberarCommit.await(10, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("Tempo excedido aguardando liberação do commit.");
                    }
                } catch (InterruptedException erro) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(erro);
                }
                return null;
            }));
            assertTrue(mutacaoPronta.await(10, TimeUnit.SECONDS));
            var consulta = executor.submit(() -> {
                consultaIniciada.countDown();
                return mvc.perform(get("/api/gamificacao")
                        .with(jwt().jwt(j -> j.subject(usuario.toString())))).andReturn();
            });
            assertTrue(consultaIniciada.await(10, TimeUnit.SECONDS));
            assertThrows(TimeoutException.class, () -> consulta.get(250, TimeUnit.MILLISECONDS),
                    "A consulta deve aguardar a transação que mantém o bloqueio da conta.");
            liberarCommit.countDown();
            mutacao.get(10, TimeUnit.SECONDS);
            var resposta = consulta.get(10, TimeUnit.SECONDS);
            status().isOk().match(resposta);
            jsonPath("$.xpTotal").value(20).match(resposta);
            jsonPath("$.xpHoje").value(20).match(resposta);
            jsonPath("$.presencasRegistradas").value(1).match(resposta);
            jsonPath("$.diasAtivos").value(1).match(resposta);
            jsonPath("$.ofensivaAtual").value(1).match(resposta);
            jsonPath("$.ativoHoje").value(true).match(resposta);
            jsonPath("$.atividadesRecentes.length()").value(1).match(resposta);
            jsonPath("$.atividadesRecentes[0].xp").value(20).match(resposta);
            jsonPath("$.medalhas[?(@.codigo == 'PRIMEIRA_PRESENCA')].desbloqueada")
                    .value(org.hamcrest.Matchers.contains(true)).match(resposta);
        } finally {
            liberarCommit.countDown();
            executor.shutdownNow();
        }
    }

    @Test
    void rollbackDesfazPresencaXpEConquistasJuntos() {
        assertThrows(IllegalStateException.class, () -> new TransactionTemplate(transactionManager).execute(status -> {
            presenca("2026-10-10");
            assertEquals(20, progresso().xpTotal());
            throw new IllegalStateException("Falha simulada");
        }));
        assertEquals(0, progresso().xpTotal());
        assertEquals(0, progresso().presencasRegistradas());
        assertFalse(medalha("PRIMEIRA_PRESENCA").desbloqueada());
        assertTrue(como(() -> presencas.listar(usuario, disciplina)).isEmpty());
    }

    private <T> T como(Supplier<T> action) { return TestIdentity.callAs(usuario, action); }
    private GamificacaoResponse progresso() { return como(() -> gamificacao.consultar(usuario)); }
    private GamificacaoResponse.Medalha medalha(String codigo) {
        return progresso().medalhas().stream().filter(m -> m.codigo().equals(codigo)).findFirst().orElseThrow();
    }
    private PresencaResponse presenca(String data) {
        return como(() -> presencas.cadastrar(usuario, new PresencaRequest(disciplina, LocalDate.parse(data))));
    }
    private Integer usuario(String email) {
        var request = new RegisterRequest();
        request.setNome("Estudante"); request.setEmail(email); request.setSenha("segredo123");
        return usuarios.criar(request).getIdUsuario();
    }
    private Integer disciplina(Integer dono) {
        var request = new DisciplinaRequest();
        request.setIdUsuario(dono); request.setNome("Matemática"); request.setProfessor("Professor");
        request.setMediaAprovacao(6.0); request.setLimiteFaltas(10);
        return TestIdentity.callAs(dono, () -> disciplinas.cadastrar(request)).getIdDisciplina();
    }
    private Integer tarefa() {
        var request = new TarefaRequest();
        request.setIdUsuario(usuario); request.setIdDisciplina(disciplina); request.setTitulo("Exercícios");
        request.setTipo("TRABALHO"); request.setDataEntrega(LocalDateTime.of(2026, 12, 1, 12, 0));
        request.setPrioridade("ALTA");
        return como(() -> tarefas.cadastrar(request)).getIdTarefa();
    }
    private SyncTarefaRequest operacao(String tipo, Integer tarefa) {
        var request = new SyncTarefaRequest();
        request.setClientTxId(UUID.randomUUID().toString()); request.setIdUsuario(usuario);
        request.setOperation(tipo); request.setIdTarefa(tarefa);
        return request;
    }
}
