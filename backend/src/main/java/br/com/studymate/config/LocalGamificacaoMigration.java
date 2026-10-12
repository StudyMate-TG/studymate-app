package br.com.studymate.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;

/** Upgrades the old local H2 operation check without resetting an existing database. */
@Configuration
@Profile("local")
public class LocalGamificacaoMigration {
    @Bean
    ApplicationRunner localSyncOperationMigration(JdbcTemplate jdbc) {
        return args -> {
            var checks = jdbc.queryForList("""
                    SELECT tc.constraint_name FROM information_schema.table_constraints tc
                    JOIN information_schema.check_constraints cc
                      ON cc.constraint_catalog=tc.constraint_catalog
                     AND cc.constraint_schema=tc.constraint_schema
                     AND cc.constraint_name=tc.constraint_name
                    WHERE tc.table_name='SYNC_REQUEST' AND tc.constraint_type='CHECK'
                      AND cc.check_clause LIKE '%OPERATION%'
                    """, String.class);
            for (String check : checks) {
                if (!check.matches("[A-Z0-9_]+")) throw new IllegalStateException("Nome de constraint local inválido.");
                jdbc.execute("ALTER TABLE sync_request DROP CONSTRAINT " + check);
            }
            jdbc.execute("ALTER TABLE sync_request ADD CONSTRAINT ck_sync_request_operation CHECK (operation IN ('CREATE','UPDATE','DELETE','COMPLETE','REOPEN'))");
        };
    }
}
