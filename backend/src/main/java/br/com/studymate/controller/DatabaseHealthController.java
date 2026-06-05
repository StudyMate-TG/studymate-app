package br.com.studymate.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DatabaseHealthController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/api/db-health")
    public String databaseHealth() {
        Integer result = jdbcTemplate.queryForObject(
                "SELECT 1 FROM dual",
                Integer.class
        );

        return "Conexão com Oracle funcionando. Resultado: " + result;
    }
}