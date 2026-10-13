package br.com.studymate.config;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import static org.junit.jupiter.api.Assertions.*;

class LocalGamificacaoMigrationTests {
    @TempDir Path directory;
    private final List<Connection> keepers = new ArrayList<>();
    private final AtomicInteger origins = new AtomicInteger();

    @AfterEach
    void fecharConexoes() throws SQLException {
        for (Connection keeper : keepers) keeper.close();
    }

    @Test
    void schemaNovoEMigracaoAceitamConclusaoEReaberturaAposReabrirArquivo() throws Exception {
        verificarArquivoPersistido("fresh", null);
    }

    @Test
    void migracaoAtualizaCheckLegadoNomeadoEPreservaOperacoesEConta() throws Exception {
        verificarArquivoPersistido("legacy", "ck_sync_request_operation");
    }

    @Test
    void migracaoRespeitaNomeDeConstraintComCaseEIdentificadorQuoted() throws Exception {
        verificarArquivoPersistido("quoted", "\"Legacy operation check\"");
    }

    @Test
    void migracaoAtualizaChecksLegadosAnonimos() throws Exception {
        verificarArquivoPersistido("anonymous", "");
    }

    private void verificarArquivoPersistido(String name, String legacyConstraint) throws Exception {
        String schema = new ClassPathResource("schema-local.sql").getContentAsString(StandardCharsets.UTF_8);
        if (legacyConstraint != null) {
            String constraintPrefix = legacyConstraint.isEmpty() ? "" : "CONSTRAINT " + legacyConstraint + " ";
            schema = schema.replaceAll("CONSTRAINT ck_sync_request_operation CHECK \\([^\\r\\n]*\\)",
                    Matcher.quoteReplacement(constraintPrefix + "CHECK (operation IN ('CREATE','UPDATE','DELETE'))"));
            schema = schema.replaceAll("CONSTRAINT ck_atividade_tipo CHECK \\([^\\r\\n]*\\)",
                    "CHECK (tipo IN ('TAREFA','PRESENCA'))");
        }
        String url = "jdbc:h2:file:" + directory.resolve(name).toString().replace('\\', '/') + ";MODE=Oracle;DB_CLOSE_ON_EXIT=FALSE";
        var jdbc = abrir(url);
        popular(jdbc, schema);
        // Legacy fixtures must load their old IN checks from disk before seeding; fresh
        // schemas exercise DML immediately after the creating connection has closed.
        if (legacyConstraint != null) {
            jdbc.execute("SHUTDOWN");
            jdbc = abrir(url);
        }
        jdbc.update("INSERT INTO usuario (id_usuario,nome,email,senha_hash,data_criacao) VALUES (1,'Teste de migração','migration@example.com','hash-local',CURRENT_TIMESTAMP)");
        jdbc.update("INSERT INTO progresso_estudante (id_usuario,xp_total,nivel,sequencia_atual,maior_sequencia) VALUES (1,120,2,1,3)");
        inserirOperacao(jdbc, "CREATE");
        inserirAtividade(jdbc, "TAREFA");
        jdbc.execute("SHUTDOWN");

        for (int startup = 0; startup < 3; startup++) {
            jdbc = abrir(url);
            popular(jdbc, new ClassPathResource("schema-local.sql").getContentAsString(StandardCharsets.UTF_8));
            new LocalGamificacaoMigration().localSyncOperationMigration(jdbc).run(null);
            new LocalGamificacaoMigration().localSyncOperationMigration(jdbc).run(null);
            assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM usuario", Integer.class));
            assertEquals(120, jdbc.queryForObject("SELECT xp_total FROM progresso_estudante WHERE id_usuario=1", Integer.class));
            assertEquals(1 + startup * 2, jdbc.queryForObject("SELECT COUNT(*) FROM sync_request", Integer.class));
            assertEquals(1 + startup * 2, jdbc.queryForObject("SELECT COUNT(*) FROM atividade_gamificacao", Integer.class));
            inserirOperacao(jdbc, "COMPLETE");
            inserirOperacao(jdbc, "REOPEN");
            inserirAtividade(jdbc, "TAREFA");
            inserirAtividade(jdbc, "PRESENCA");
            final var atual = jdbc;
            assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> inserirOperacao(atual, "INVALID"));
            assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> inserirAtividade(atual, "INVALID"));
            assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> inserirOperacao(atual, null));
            assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> inserirAtividade(atual, null));
            jdbc.execute("SHUTDOWN");
        }
        jdbc = abrir(url);
        assertEquals(7, jdbc.queryForObject("SELECT COUNT(*) FROM sync_request", Integer.class));
        assertEquals(7, jdbc.queryForObject("SELECT COUNT(*) FROM atividade_gamificacao", Integer.class));
        assertEquals(120, jdbc.queryForObject("SELECT xp_total FROM progresso_estudante WHERE id_usuario=1", Integer.class));
        // Verify the persisted constraint before running another migration, not just in-memory DDL.
        inserirOperacao(jdbc, "COMPLETE");
        inserirOperacao(jdbc, "REOPEN");
        inserirAtividade(jdbc, "TAREFA");
        inserirAtividade(jdbc, "PRESENCA");
        jdbc.execute("SHUTDOWN");
    }

    private JdbcTemplate abrir(String url) throws SQLException {
        var datasource = new DriverManagerDataSource(url, "sa", "");
        // Match the live connection pool: keep the database open across metadata and DML calls.
        keepers.add(datasource.getConnection());
        return new JdbcTemplate(datasource);
    }

    private void popular(JdbcTemplate jdbc, String schema) {
        new ResourceDatabasePopulator(new ByteArrayResource(schema.getBytes(StandardCharsets.UTF_8)))
                .execute(jdbc.getDataSource());
    }

    private void inserirOperacao(JdbcTemplate jdbc, String operation) {
        jdbc.update("INSERT INTO sync_request (client_tx_id,id_usuario,entity_type,operation,response_resource_id) VALUES (?,1,'TAREFA',?,10)",
                UUID.randomUUID().toString(), operation);
    }

    private void inserirAtividade(JdbcTemplate jdbc, String type) {
        jdbc.update("INSERT INTO atividade_gamificacao (id_atividade,id_usuario,tipo,origem_id,descricao,xp,data_atividade,registrada_em) VALUES (?,1,?,?,'Atividade de teste',20,CURRENT_DATE,CURRENT_TIMESTAMP)",
                UUID.randomUUID().toString(), type, origins.incrementAndGet());
    }
}
