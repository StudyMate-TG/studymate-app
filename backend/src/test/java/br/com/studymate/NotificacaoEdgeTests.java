package br.com.studymate;

import br.com.studymate.config.NotificacaoPolicy;
import br.com.studymate.dto.*;
import br.com.studymate.repository.*;
import br.com.studymate.service.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {"spring.datasource.url=jdbc:h2:mem:notificacao_edges;MODE=Oracle;DB_CLOSE_DELAY=-1", "app.notifications.user-batch-size=1"})
@Import({SecurityTestMailConfig.class,NotificacaoFlowTests.ClockConfig.class})
@ActiveProfiles("test")
class NotificacaoEdgeTests {
    @Autowired NotificacaoService notificacoes;
    @Autowired TarefaService tarefas;
    @Autowired AvaliacaoService avaliacoes;
    @Autowired JdbcTemplate jdbc;
    @Autowired NotificacaoFlowTests.MutableClock clock;
    @Autowired PlatformTransactionManager transactionManager;
    @Autowired ApplicationContext context;
    @PersistenceContext EntityManager entityManager;

    @BeforeEach void preparar() {
        clock.set("2026-10-10T15:00:00Z");
        for (String table : List.of("notificacao","sync_request","email_verification","atividade_gamificacao","medalha_estudante",
                "presenca_aula","tarefa","avaliacao","falta","disciplina","periodo_letivo","progresso_estudante","usuario")) {
            jdbc.update("DELETE FROM " + table);
        }
        conta(1);
    }

    @Test void avaliacaoCriadaHojeDepoisDas8hPublicaSomenteAvisoDoDia() {
        TestIdentity.callAs(1, () -> avaliacoes.cadastrar(1,new AvaliacaoRequest(1,"Prova","PROVA",null,BigDecimal.ONE,LocalDate.of(2026,10,10))));
        notificacoes.processarUsuario(1);
        assertEquals(1,total());
        assertEquals("AVALIACAO_DIA",jdbc.queryForObject("SELECT tipo FROM notificacao",String.class));
        assertNotNull(jdbc.queryForObject("SELECT processado_em FROM notificacao",OffsetDateTime.class));
    }

    @Test void vEsperaPerdidaDuranteParadaECanceladaNoDiaDaAvaliacao() {
        TestIdentity.callAs(1, () -> avaliacoes.cadastrar(1,new AvaliacaoRequest(1,"Prova","PROVA",null,BigDecimal.ONE,LocalDate.of(2026,10,12))));
        clock.set("2026-10-12T11:00:00Z");
        notificacoes.processarUsuario(1);
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE tipo='AVALIACAO_VESPERA' AND cancelado_em IS NOT NULL AND processado_em IS NULL",Integer.class));
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE tipo='AVALIACAO_DIA' AND processado_em IS NOT NULL",Integer.class));
    }

    @Test void mediaNaoDuplicaAposLimparContextoERecarregarEscalaDecimalDoBanco() {
        var transaction = new TransactionTemplate(transactionManager);
        TestIdentity.runAs(1, () -> transaction.executeWithoutResult(status -> {
            avaliacoes.cadastrar(1,new AvaliacaoRequest(1,"Prova","PROVA",new BigDecimal("4.0"),new BigDecimal("1.0"),LocalDate.of(2026,10,9)));
            assertEquals(1,total());
            entityManager.clear();
            notificacoes.reavaliarDisciplina(1,1);
            entityManager.flush();
            assertEquals(1,total());
        }));
        notificacoes.processarUsuario(1);
        assertEquals(1,total());
    }

    @Test void precisaoEmSegundosDoOracleNaoCriaOutraChaveParaMesmaTarefa() {
        var r=tarefa(1,"2026-10-11T10:00:00.123456789");
        var t=TestIdentity.callAs(1, () -> tarefas.cadastrar(r));
        // Simulates Oracle DATE, whose precision is seconds (H2 test schema retains fractions).
        jdbc.update("UPDATE tarefa SET data_entrega=TIMESTAMP '2026-10-11 10:00:00' WHERE id_tarefa=?",t.getIdTarefa());
        notificacoes.processarUsuario(1);
        assertEquals(1,total());
    }

    @Test void novaInstanciaDoProcessadorMantemDeduplicacaoPersistida() {
        TestIdentity.callAs(1, () -> tarefas.cadastrar(tarefa(1,"2026-10-12T12:00:00")));
        var restarted = new NotificacaoService(context.getBean(NotificacaoRepository.class),context.getBean(UsuarioRepository.class),
                context.getBean(DisciplinaRepository.class),context.getBean(TarefaRepository.class),context.getBean(AvaliacaoRepository.class),
                context.getBean(FaltaRepository.class),jdbc,clock,context.getBean(NotificacaoPolicy.class),transactionManager);
        restarted.processarPendentes();
        clock.set("2026-10-11T15:00:00Z");
        restarted.processarPendentes(); notificacoes.processarPendentes();
        assertEquals(1,total());
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE processado_em IS NOT NULL",Integer.class));
    }

    @Test void avisosDevidosTemPrioridadeSobreCursorDeContasDaReconciliacao() {
        notificacoes.processarPendentes(); // Only user1 exists: the round-robin cursor is now1.
        conta(2); conta(3);
        TestIdentity.callAs(3, () -> tarefas.cadastrar(tarefa(3,"2026-10-12T12:00:00")));
        clock.set("2026-10-11T15:00:00Z");
        notificacoes.processarPendentes(); // Round-robin alone selects user2; due queue must also select user3.
        assertEquals(1,jdbc.queryForObject("SELECT COUNT(*) FROM notificacao WHERE id_usuario=3 AND processado_em IS NOT NULL",Integer.class));
    }

    private long total() { return jdbc.queryForObject("SELECT COUNT(*) FROM notificacao",Long.class); }
    private void conta(int id) {
        jdbc.update("INSERT INTO usuario (id_usuario,nome,email,senha_hash,data_criacao) VALUES (?, 'Teste', ?, 'hash-nao-utilizado', CURRENT_TIMESTAMP)",id,"edge"+id+"@example.com");
        jdbc.update("INSERT INTO periodo_letivo (id_periodo,id_usuario,nome,data_inicio,data_fim,status) VALUES (?,?,'Período',DATE '2026-01-01',DATE '2026-12-31','ATIVO')",id,id);
        jdbc.update("INSERT INTO disciplina (id_disciplina,id_periodo,nome,professor,media_aprovacao,limite_faltas) VALUES (?,?,'Matemática','Professor',6,10)",id,id);
    }
    private TarefaRequest tarefa(int usuario,String prazo) {
        var r=new TarefaRequest(); r.setIdUsuario(usuario);r.setIdDisciplina(usuario);r.setTitulo("Entrega");r.setTipo("TRABALHO");
        r.setPrioridade("MEDIA");r.setDataEntrega(LocalDateTime.parse(prazo));return r;
    }
}
