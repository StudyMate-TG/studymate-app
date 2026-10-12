package br.com.studymate.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;

/** Upgrades the old local H2 operation check without resetting an existing database. */
@Configuration
@Profile("local")
public class LocalGamificacaoMigration {
    @Bean
    ApplicationRunner localSyncOperationMigration(JdbcTemplate jdbc) {
        return args -> {
            migrarCheck(jdbc, "SYNC_REQUEST", "OPERATION", "CK_SYNC_REQUEST_OPERATION",
                    List.of("CREATE", "UPDATE", "DELETE", "COMPLETE", "REOPEN"));
            migrarCheck(jdbc, "ATIVIDADE_GAMIFICACAO", "TIPO", "CK_ATIVIDADE_TIPO", List.of("TAREFA", "PRESENCA"));
        };
    }

    private void migrarCheck(JdbcTemplate jdbc, String nomeTabela, String nomeColuna,
            String nomeConstraint, List<String> valores) {
        var tables = jdbc.query("""
                SELECT table_schema,table_name,column_name FROM information_schema.columns
                WHERE table_schema=CURRENT_SCHEMA AND UPPER(table_name)=? AND UPPER(column_name)=?
                """, (rs, row) -> new LocalTable(rs.getString(1), rs.getString(2), rs.getString(3)), nomeTabela, nomeColuna);
        if (tables.size() != 1) throw new IllegalStateException("Tabela local de gamificação não encontrada ou ambígua.");
        var table = tables.get(0);
        var checks = jdbc.query("""
                    SELECT tc.constraint_name,cc.check_clause FROM information_schema.table_constraints tc
                    JOIN information_schema.constraint_column_usage cu
                      ON cu.constraint_catalog=tc.constraint_catalog
                     AND cu.constraint_schema=tc.constraint_schema
                     AND cu.constraint_name=tc.constraint_name
                    JOIN information_schema.check_constraints cc
                      ON cc.constraint_catalog=tc.constraint_catalog
                     AND cc.constraint_schema=tc.constraint_schema
                     AND cc.constraint_name=tc.constraint_name
                    WHERE tc.table_schema=? AND tc.table_name=? AND tc.constraint_type='CHECK'
                      AND cu.column_name=?
                    """, (rs, row) -> new LocalCheck(rs.getString(1), rs.getString(2)), table.schema(), table.name(), table.column());
        // H2 2.4.240 optimizes CHECK IN into a set whose comparator retains the creating
        // session. Recycling that pool connection breaks later inserts (23514 / 90098).
        // Separate CASE comparisons evaluate against the current session instead.
        StringBuilder expression = new StringBuilder("CASE");
        for (String value : valores) {
            expression.append(" WHEN ").append(quote(table.column())).append("='").append(value).append("' THEN 1");
        }
        expression.append(" ELSE 0 END=1");
        if (checks.size() == 1 && checks.get(0).name().equals(nomeConstraint)
                && normalize(checks.get(0).clause()).equals(normalize(expression.toString()))) return;
        String qualifiedTable = quote(table.schema()) + "." + quote(table.name());
        for (LocalCheck check : checks) {
            jdbc.execute("ALTER TABLE " + qualifiedTable + " DROP CONSTRAINT " + quote(check.name()));
        }
        jdbc.execute("ALTER TABLE " + qualifiedTable + " ADD CONSTRAINT " + quote(nomeConstraint) + " CHECK (" + expression + ")");
    }

    private record LocalTable(String schema, String name, String column) {}
    private record LocalCheck(String name, String clause) {}

    private static String normalize(String expression) {
        return expression.replaceAll("\\s+", "").replace("(", "").replace(")", "");
    }

    private static String quote(String identifier) {
        return "\"" + identifier.replace("\"", "\"\"") + "\"";
    }
}
