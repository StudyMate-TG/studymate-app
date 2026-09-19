package br.com.studymate.dao;

import br.com.studymate.model.Disciplina;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class DaoDisciplina {

    private final JdbcTemplate jdbcTemplate;

    public DaoDisciplina(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Disciplina> listarPorUsuario(Integer idUsuario, String termo) {
        if (termo == null || termo.isBlank()) {
            String sql = """
                    SELECT d.id_disciplina,
                           d.id_periodo,
                           d.nome,
                           d.professor,
                           d.media_aprovacao,
                           d.limite_faltas
                    FROM disciplina d
                    JOIN periodo_letivo p
                        ON p.id_periodo = d.id_periodo
                    WHERE p.id_usuario = ?
                    ORDER BY d.nome
                    """;

            return jdbcTemplate.query(
                    sql,
                    (rs, rowNum) -> mapearDisciplina(rs),
                    idUsuario
            );
        }

        String sql = """
                SELECT d.id_disciplina,
                       d.id_periodo,
                       d.nome,
                       d.professor,
                       d.media_aprovacao,
                       d.limite_faltas
                FROM disciplina d
                JOIN periodo_letivo p
                    ON p.id_periodo = d.id_periodo
                WHERE p.id_usuario = ?
                  AND (
                        LOWER(d.nome) LIKE LOWER(?)
                        OR LOWER(d.professor) LIKE LOWER(?)
                  )
                ORDER BY d.nome
                """;

        String termoBusca = "%" + termo.trim() + "%";

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearDisciplina(rs),
                idUsuario,
                termoBusca,
                termoBusca
        );
    }

    public Disciplina consultarPorIdEUsuario(Integer idDisciplina, Integer idUsuario) {
        String sql = """
                SELECT d.id_disciplina,
                       d.id_periodo,
                       d.nome,
                       d.professor,
                       d.media_aprovacao,
                       d.limite_faltas
                FROM disciplina d
                JOIN periodo_letivo p
                    ON p.id_periodo = d.id_periodo
                WHERE d.id_disciplina = ?
                  AND p.id_usuario = ?
                """;

        List<Disciplina> disciplinas = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearDisciplina(rs),
                idDisciplina,
                idUsuario
        );

        if (disciplinas.isEmpty()) {
            return null;
        }

        return disciplinas.get(0);
    }

    public Integer obterOuCriarPeriodoPadrao(Integer idUsuario) {
        validarUsuarioExiste(idUsuario);

        String sqlBuscarPeriodo = """
                SELECT id_periodo
                FROM periodo_letivo
                WHERE id_usuario = ?
                  AND status = 'ATIVO'
                ORDER BY id_periodo
                """;

        List<Integer> periodos = jdbcTemplate.query(
                sqlBuscarPeriodo,
                (rs, rowNum) -> rs.getInt("id_periodo"),
                idUsuario
        );

        if (!periodos.isEmpty()) {
            return periodos.get(0);
        }

        Integer proximoId = jdbcTemplate.queryForObject(
                "SELECT NVL(MAX(id_periodo), 0) + 1 FROM periodo_letivo",
                Integer.class
        );

        String sqlInserirPeriodo = """
                INSERT INTO periodo_letivo (
                    id_periodo,
                    id_usuario,
                    nome,
                    data_inicio,
                    data_fim,
                    status
                ) VALUES (
                    ?,
                    ?,
                    ?,
                    TRUNC(SYSDATE),
                    ADD_MONTHS(TRUNC(SYSDATE), 6),
                    'ATIVO'
                )
                """;

        jdbcTemplate.update(
                sqlInserirPeriodo,
                proximoId,
                idUsuario,
                "Período atual"
        );

        return proximoId;
    }

    public Disciplina inserir(Disciplina disciplina) {
        Integer proximoId = jdbcTemplate.queryForObject(
                "SELECT NVL(MAX(id_disciplina), 0) + 1 FROM disciplina",
                Integer.class
        );

        String sqlInsert = """
                INSERT INTO disciplina (
                    id_disciplina,
                    id_periodo,
                    nome,
                    professor,
                    media_aprovacao,
                    limite_faltas
                ) VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    ?,
                    ?
                )
                """;

        jdbcTemplate.update(
                sqlInsert,
                proximoId,
                disciplina.getIdPeriodo(),
                disciplina.getNome(),
                disciplina.getProfessor(),
                disciplina.getMediaAprovacao(),
                disciplina.getLimiteFaltas()
        );

        return consultarPorId(proximoId);
    }

    public Disciplina alterar(
            Integer idDisciplina,
            Integer idUsuario,
            Disciplina disciplina
    ) {
        String sqlUpdate = """
                UPDATE disciplina
                SET nome = ?,
                    professor = ?,
                    media_aprovacao = ?,
                    limite_faltas = ?
                WHERE id_disciplina = ?
                  AND id_periodo IN (
                      SELECT id_periodo
                      FROM periodo_letivo
                      WHERE id_usuario = ?
                  )
                """;

        jdbcTemplate.update(
                sqlUpdate,
                disciplina.getNome(),
                disciplina.getProfessor(),
                disciplina.getMediaAprovacao(),
                disciplina.getLimiteFaltas(),
                idDisciplina,
                idUsuario
        );

        return consultarPorIdEUsuario(idDisciplina, idUsuario);
    }

    public boolean excluir(Integer idDisciplina, Integer idUsuario) {
        String sql = """
                DELETE FROM disciplina
                WHERE id_disciplina = ?
                  AND id_periodo IN (
                      SELECT id_periodo
                      FROM periodo_letivo
                      WHERE id_usuario = ?
                  )
                """;

        int linhasAfetadas = jdbcTemplate.update(
                sql,
                idDisciplina,
                idUsuario
        );

        return linhasAfetadas > 0;
    }

    private Disciplina consultarPorId(Integer idDisciplina) {
        String sql = """
                SELECT id_disciplina,
                       id_periodo,
                       nome,
                       professor,
                       media_aprovacao,
                       limite_faltas
                FROM disciplina
                WHERE id_disciplina = ?
                """;

        List<Disciplina> disciplinas = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearDisciplina(rs),
                idDisciplina
        );

        if (disciplinas.isEmpty()) {
            return null;
        }

        return disciplinas.get(0);
    }

    private void validarUsuarioExiste(Integer idUsuario) {
        String sql = """
                SELECT COUNT(*)
                FROM usuario
                WHERE id_usuario = ?
                """;

        Integer total = jdbcTemplate.queryForObject(
                sql,
                Integer.class,
                idUsuario
        );

        if (total == null || total == 0) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }
    }

    private Disciplina mapearDisciplina(ResultSet rs) throws SQLException {
        Disciplina disciplina = new Disciplina(
                rs.getInt("id_periodo"),
                rs.getString("nome"),
                rs.getString("professor")
        );

        disciplina.setIdDisciplina(rs.getInt("id_disciplina"));
        disciplina.setMediaAprovacao(rs.getDouble("media_aprovacao"));
        disciplina.setLimiteFaltas(rs.getInt("limite_faltas"));

        return disciplina;
    }
}