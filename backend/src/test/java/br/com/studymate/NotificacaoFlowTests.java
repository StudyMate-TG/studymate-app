package br.com.studymate;

import br.com.studymate.dto.*;
import br.com.studymate.service.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
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

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:notificacao_tests;MODE=Oracle;DB_CLOSE_DELAY=-1")
@Import({SecurityTestMailConfig.class, NotificacaoFlowTests.ClockConfig.class})
@ActiveProfiles("test")
class NotificacaoFlowTests {
    @Autowired NotificacaoService notificacoes;
    @Autowired TarefaService tarefas;
    @Autowired AvaliacaoService avaliacoes;
    @Autowired FaltaService faltas;
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
        @Bean @Primary MutableClock notificationTestClock() { return new MutableClock(); }
    }
    static class MutableClock extends Clock {
        final AtomicReference<Instant> current = new AtomicReference<>(Instant.parse("2026-10-10T15:00:00Z"));
        void set(String value) { current.set(Instant.parse(value)); }
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) {
            return new Clock() {
                public ZoneId getZone() { return zone; }
                public Clock withZone(ZoneId next) { return MutableClock.this.withZone(next); }
                public Instant instant() { return current.get(); }
            };
        }
        @Override public Instant instant() { return current.get(); }
    }

    @BeforeEach void preparar() {
        clock.set("2026-10-10T15:00:00Z");
        for (String table : List.of("notificacao", "sync_request", "email_verification", "atividade_gamificacao",
                "medalha_estudante", "presenca_aula", "tarefa", "avaliacao", "falta", "disciplina",
                "periodo_letivo", "progresso_estudante", "usuario")) jdbc.update("DELETE FROM " + table);
        usuario = usuario("notificacao-ana@example.com");
        outro = usuario("notificacao-bia@example.com");
        disciplina = disciplina(usuario); disciplinaOutro = disciplina(outro);
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test void endpointsExigemJwtERejeitamTokenInvalido() throws Exception {
        mvc.perform(get("/api/notificacoes")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/notificacoes/nao-lidas/total")).andExpect(status().isUnauthorized());
        mvc.perform(patch("/api/notificacoes/1/lida")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/notificacoes").header("Authorization", "Bearer invalido")).andExpect(status().isUnauthorized());
    }

    @Test void pendenteNaoApareceEHoraExataDe24hPublicaUmaVez() throws Exception {
        tarefa("2026-10-12T12:00:00");
        assertEquals(1, total()); assertEquals(0, publicadas());
        mvc.perform(get("/api/notificacoes/nao-lidas/total").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        clock.set("2026-10-11T14:59:59Z"); notificacoes.processarUsuario(usuario);
        assertEquals(0, publicadas());
        clock.set("2026-10-11T15:00:00Z"); notificacoes.processarUsuario(usuario);
        notificacoes.processarUsuario(usuario); notificacoes.processarPendentes();
        assertEquals(1, total()); assertEquals(1, publicadas());
        assertEquals(OffsetDateTime.parse("2026-10-11T15:00:00Z"),
                jdbc.queryForObject("SELECT previsto_para FROM notificacao", OffsetDateTime.class));
    }

    @Test void isolamentoJwtLeituraIdempotenteEBooleanoSN() throws Exception {
        tarefa("2026-10-11T10:00:00");
        TestIdentity.callAs(outro, () -> tarefas.cadastrar(tarefaRequest(outro, disciplinaOutro,"2026-10-11T10:00:00")));
        Long id = jdbc.queryForObject("SELECT id_notificacao FROM notificacao WHERE id_usuario=?", Long.class, usuario);
        mvc.perform(get("/api/notificacoes").param("idUsuario", outro.toString()).with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].idNotificacao").value(id))
                .andExpect(jsonPath("$.content[0].lida").value(false));
        mvc.perform(patch("/api/notificacoes/"+id+"/lida").with(jwt().jwt(j -> j.subject(outro.toString()))))
                .andExpect(status().isNotFound());
        for (int i=0;i<2;i++) mvc.perform(patch("/api/notificacoes/"+id+"/lida").param("idUsuario",outro.toString())
                .with(jwt().jwt(j -> j.subject(usuario.toString())))).andExpect(status().isOk()).andExpect(jsonPath("$.lida").value(true));
        assertEquals("S", jdbc.queryForObject("SELECT lida FROM notificacao WHERE id_notificacao=?", String.class,id));
        mvc.perform(get("/api/notificacoes/nao-lidas/total").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(0));
        mvc.perform(get("/api/notificacoes/nao-lidas/total").with(jwt().jwt(j -> j.subject(outro.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1));
        mvc.perform(get("/api/notificacoes").param("lida","false").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/notificacoes").param("lida","true").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test void paginacaoOrdenaPorPublicacaoEIdEValidaLimites() throws Exception {
        tarefa("2026-10-11T10:00:00"); clock.set("2026-10-10T15:01:00Z");
        tarefa("2026-10-11T10:00:00"); tarefa("2026-10-11T11:00:00");
        Long recente=jdbc.queryForObject("SELECT MAX(id_notificacao) FROM notificacao",Long.class);
        mvc.perform(get("/api/notificacoes").param("size","1").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(3)).andExpect(jsonPath("$.content[0].idNotificacao").value(recente));
        mvc.perform(get("/api/notificacoes").param("page","2").param("size","1").with(jwt().jwt(j -> j.subject(usuario.toString()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.content.length()").value(1));
        for (String[] params: List.of(new String[]{"size","0"},new String[]{"size","51"},new String[]{"page","-1"},new String[]{"page","10001"},new String[]{"lida","talvez"})) {
            mvc.perform(get("/api/notificacoes").param(params[0],params[1]).with(jwt().jwt(j -> j.subject(usuario.toString()))))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.mensagem").exists());
        }
    }

    @Test void alteracaoDePrazoCancelaAntigoConclusaoEReaberturaAjustamPendente() {
        var t=tarefa("2026-10-12T12:00:00");
        TestIdentity.callAs(usuario, () -> tarefas.alterar(t.getIdTarefa(),usuario,tarefaRequest(usuario,disciplina,"2026-10-13T12:00:00")));
        assertEquals(2,total()); assertEquals(1,canceladas());
        TestIdentity.callAs(usuario, () -> tarefas.concluir(t.getIdTarefa(),usuario));
        assertEquals(2,canceladas());
        TestIdentity.callAs(usuario, () -> tarefas.reabrir(t.getIdTarefa(),usuario));
        assertEquals(2,total()); assertEquals(1,canceladas());
        notificacoes.processarUsuario(usuario); assertEquals(2,total());
        TestIdentity.runAs(usuario, () -> tarefas.excluir(t.getIdTarefa(),usuario));
        assertEquals(2,canceladas());
        clock.set("2026-10-13T14:00:00Z"); notificacoes.processarUsuario(usuario); assertEquals(0,publicadas());
    }

    @Test void avisoPublicadoPermaneceNoHistoricoAposConclusaoOuExclusao() {
        var t=tarefa("2026-10-11T10:00:00");
        TestIdentity.callAs(usuario, () -> tarefas.concluir(t.getIdTarefa(),usuario));
        TestIdentity.callAs(usuario, () -> tarefas.reabrir(t.getIdTarefa(),usuario));
        notificacoes.processarUsuario(usuario);
        TestIdentity.runAs(usuario, () -> tarefas.excluir(t.getIdTarefa(),usuario));
        assertEquals(1,total()); assertEquals(1,publicadas()); assertEquals(0,canceladas());
    }

    @Test void avaliacoesUsam18hDaVesperaE8hDoDiaEmSaoPaulo() {
        avaliacao(disciplina,null,LocalDate.of(2026,10,12));
        assertEquals(2,total()); assertEquals(0,publicadas());
        clock.set("2026-10-11T20:59:59Z"); notificacoes.processarUsuario(usuario); assertEquals(0,publicadas());
        clock.set("2026-10-11T21:00:00Z"); notificacoes.processarUsuario(usuario); assertEquals(1,publicadas());
        clock.set("2026-10-12T10:59:59Z"); notificacoes.processarUsuario(usuario); assertEquals(1,publicadas());
        clock.set("2026-10-12T11:00:00Z"); notificacoes.processarUsuario(usuario); assertEquals(2,publicadas());
        notificacoes.processarUsuario(usuario); assertEquals(2,total());
    }

    @Test void editarExcluirAvaliacaoEDisciplinaPreservaHistoricoEOrigem() {
        var a=avaliacao(disciplina,null,LocalDate.of(2026,10,12));
        TestIdentity.callAs(usuario, () -> avaliacoes.alterar(a.idAvaliacao(),usuario,avaliacaoRequest(disciplina,null,LocalDate.of(2026,10,13))));
        assertEquals(4,total()); assertEquals(2,canceladas());
        clock.set("2026-10-12T21:00:00Z"); notificacoes.processarUsuario(usuario); assertEquals(1,publicadas());
        TestIdentity.runAs(usuario, () -> avaliacoes.excluir(a.idAvaliacao(),usuario));
        TestIdentity.runAs(usuario, () -> disciplinas.excluir(disciplina,usuario));
        assertEquals(4,total()); assertEquals(1,publicadas()); assertEquals(3,canceladas());
        assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE id_avaliacao IS NOT NULL OR id_disciplina IS NOT NULL",Integer.class));
        assertEquals(a.idAvaliacao(),jdbc.queryForObject("SELECT origem_id FROM notificacao WHERE processado_em IS NOT NULL",Long.class));
    }

    @Test void notaCorrigidaCancelaAgendamentosEMediaReutilizaPesosSemDeclararReprovacao() {
        var a=avaliacao(disciplina,null,LocalDate.of(2026,10,12));
        assertEquals(0,tipo("MEDIA_BAIXA"));
        TestIdentity.callAs(usuario, () -> avaliacoes.alterar(a.idAvaliacao(),usuario,avaliacaoRequest(disciplina,"4",LocalDate.of(2026,10,12))));
        assertEquals(2,canceladas()); assertEquals(1,tipo("MEDIA_BAIXA"));
        String msg=jdbc.queryForObject("SELECT mensagem FROM notificacao WHERE tipo='MEDIA_BAIXA'",String.class);
        assertTrue(msg.contains("parcial")); assertTrue(msg.contains("não determina reprovação"));
        notificacoes.processarUsuario(usuario); assertEquals(1,tipo("MEDIA_BAIXA"));
        TestIdentity.callAs(usuario, () -> avaliacoes.cadastrar(usuario,new AvaliacaoRequest(disciplina,"Final","PROVA",new BigDecimal("10"),new BigDecimal("2"),LocalDate.of(2026,10,14))));
        assertEquals(new BigDecimal("8.00"), TestIdentity.callAs(usuario, () -> avaliacoes.calcularMedia(disciplina,usuario)).media());
        assertEquals(1,tipo("MEDIA_BAIXA"));
    }

    @Test void faltasAlertamEm75E100SemDuplicarEReagemAoLimite() {
        falta(7); assertEquals(0,total());
        falta(1); assertEquals(1,tipo("FALTAS_75"));
        notificacoes.processarUsuario(usuario); assertEquals(1,total());
        falta(2); assertEquals(1,tipo("FALTAS_100")); assertEquals(2,total());
        var request=disciplinaRequest(usuario); request.setLimiteFaltas(20);
        TestIdentity.callAs(usuario, () -> disciplinas.alterar(disciplina,usuario,request));
        assertEquals(2,total());
        request.setLimiteFaltas(8);
        TestIdentity.callAs(usuario, () -> disciplinas.alterar(disciplina,usuario,request));
        assertEquals(2,tipo("FALTAS_100"));
    }

    @Test void limiteZeroNaoDividePorZeroENaoAlertaSemFaltas() {
        var r=disciplinaRequest(usuario); r.setLimiteFaltas(0);
        TestIdentity.callAs(usuario, () -> disciplinas.alterar(disciplina,usuario,r));
        notificacoes.processarUsuario(usuario); assertEquals(0,total());
        falta(1); assertEquals(1,tipo("FALTAS_100")); assertEquals(0,tipo("FALTAS_75"));
    }

    @Test void datasPassadasNaoGeramAvisosEAgendadorNaoPublicaTarefaVencida() {
        tarefa("2026-10-09T12:00:00"); avaliacao(disciplina,null,LocalDate.of(2026,10,9));
        notificacoes.processarUsuario(usuario); assertEquals(0,total());
        tarefa("2026-10-12T12:00:00"); clock.set("2026-10-13T15:00:00Z");
        notificacoes.processarUsuario(usuario); assertEquals(0,publicadas()); assertEquals(1,canceladas());
    }

    @Test void sincronizacaoRepetidaNaoDuplicaAvisosECancelamentoTambemESincronizado() {
        var r=new SyncTarefaRequest(); r.setClientTxId(UUID.randomUUID().toString()); r.setIdUsuario(usuario);
        r.setOperation("CREATE"); r.setTarefa(tarefaRequest(usuario,disciplina,"2026-10-12T12:00:00"));
        var a=TestIdentity.callAs(usuario, () -> sync.sincronizarTarefa(r));
        assertTrue(TestIdentity.callAs(usuario, () -> sync.sincronizarTarefa(r)).isAlreadyProcessed());
        notificacoes.processarUsuario(usuario); assertEquals(1,total());
        var d=new SyncTarefaRequest(); d.setClientTxId(UUID.randomUUID().toString()); d.setIdUsuario(usuario); d.setOperation("DELETE"); d.setIdTarefa(a.getIdTarefa());
        TestIdentity.callAs(usuario, () -> sync.sincronizarTarefa(d));
        TestIdentity.callAs(usuario, () -> sync.sincronizarTarefa(d));
        assertEquals(1,total()); assertEquals(1,canceladas());
    }

    @Test void falhaTransacionalReverteAlteracaoAcademicaEAvisoJuntos() {
        var transaction=new TransactionTemplate(transactionManager);
        assertThrows(IllegalStateException.class, () -> TestIdentity.runAs(usuario, () -> transaction.executeWithoutResult(status -> {
            tarefas.cadastrar(tarefaRequest(usuario,disciplina,"2026-10-11T10:00:00"));
            throw new IllegalStateException("simular falha após notificação");
        })));
        assertEquals(0,total()); assertEquals(0,jdbc.queryForObject("SELECT COUNT(*) FROM tarefa",Integer.class));
    }

    @Test void duasExecucoesConcorrentesMantemUmAvisoPorOrigem() throws Exception {
        tarefa("2026-10-12T12:00:00"); clock.set("2026-10-11T15:00:00Z");
        var pool=Executors.newFixedThreadPool(2);
        try {
            var start=new CountDownLatch(1);
            Callable<Void> process=() -> { start.await(); notificacoes.processarUsuario(usuario); return null; };
            var a=pool.submit(process); var b=pool.submit(process); start.countDown();
            a.get(20,TimeUnit.SECONDS); b.get(20,TimeUnit.SECONDS);
        } finally { pool.shutdownNow(); }
        assertEquals(1,total()); assertEquals(1,publicadas());
    }

    @Test void constraintNoBancoImpedeChaveDuplicadaMesmoForaDoJava() {
        tarefa("2026-10-12T12:00:00");
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
                INSERT INTO notificacao (id_notificacao,id_usuario,titulo,mensagem,tipo,data_envio,lida,
                  criado_em,previsto_para,origem_tipo,origem_id,chave_deduplicacao)
                SELECT seq_notificacao.nextval,id_usuario,titulo,mensagem,tipo,data_envio,lida,
                  criado_em,previsto_para,origem_tipo,origem_id,chave_deduplicacao FROM notificacao
                """));
        assertEquals(1,total());
    }

    @Test void agendadorReconciliaLegadoSemMaterializarDescricaoExcessiva() {
        Integer id=jdbc.queryForObject("SELECT seq_tarefa.nextval FROM dual",Integer.class);
        jdbc.update("""
                INSERT INTO tarefa (id_tarefa,id_disciplina,titulo,tipo,descricao,data_entrega,status,prioridade,xp_gerado)
                VALUES (?,?,'Legado','TRABALHO',?,TIMESTAMP '2026-10-11 10:00:00','PENDENTE','MEDIA',0)
                """, id,disciplina,"x".repeat(100000));
        notificacoes.processarPendentes(); notificacoes.processarPendentes();
        assertEquals(1,total()); assertEquals(1,publicadas());
    }

    long total() { return jdbc.queryForObject("SELECT COUNT(*) FROM notificacao",Long.class); }
    long publicadas() { return jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE processado_em IS NOT NULL",Long.class); }
    long canceladas() { return jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE cancelado_em IS NOT NULL",Long.class); }
    long tipo(String tipo) { return jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE tipo=? AND processado_em IS NOT NULL",Long.class,tipo); }
    TarefaResponse tarefa(String prazo) { return TestIdentity.callAs(usuario, () -> tarefas.cadastrar(tarefaRequest(usuario,disciplina,prazo))); }
    TarefaRequest tarefaRequest(Integer user,Integer subject,String deadline) {
        var r=new TarefaRequest(); r.setIdUsuario(user); r.setIdDisciplina(subject); r.setTitulo("Entrega"); r.setTipo("TRABALHO");
        r.setDataEntrega(LocalDateTime.parse(deadline)); r.setPrioridade("MEDIA"); return r;
    }
    AvaliacaoRequest avaliacaoRequest(Integer subject,String nota,LocalDate date) {
        return new AvaliacaoRequest(subject,"Prova","PROVA",nota==null?null:new BigDecimal(nota),BigDecimal.ONE,date);
    }
    AvaliacaoResponse avaliacao(Integer subject,String nota,LocalDate date) {
        return TestIdentity.callAs(usuario, () -> avaliacoes.cadastrar(usuario,avaliacaoRequest(subject,nota,date)));
    }
    void falta(int amount) {
        var r=new FaltaRequest(); r.setIdDisciplina(disciplina); r.setQuantidadeAulas(amount); r.setDataFalta(LocalDate.of(2026,10,10));
        TestIdentity.callAs(usuario, () -> faltas.cadastrar(usuario,r));
    }
    Integer usuario(String email) {
        var r=new RegisterRequest(); r.setNome("Teste notificações"); r.setEmail(email); r.setSenha("segredo123");
        return usuarios.criar(r).getIdUsuario();
    }
    DisciplinaRequest disciplinaRequest(Integer user) {
        var r=new DisciplinaRequest();r.setIdUsuario(user);r.setNome("Matemática");r.setProfessor("Professor");r.setMediaAprovacao(6.0);r.setLimiteFaltas(10);return r;
    }
    Integer disciplina(Integer user) { return TestIdentity.callAs(user, () -> disciplinas.cadastrar(disciplinaRequest(user))).getIdDisciplina(); }
}
