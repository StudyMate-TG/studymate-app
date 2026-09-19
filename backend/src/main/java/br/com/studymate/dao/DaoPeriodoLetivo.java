package br.com.studymate.dao;

import br.com.studymate.model.PeriodoLetivo;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Repository
public class DaoPeriodoLetivo {

    private final JdbcTemplate jdbcTemplate;

    public DaoPeriodoLetivo(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<PeriodoLetivo> listarPorUsuario(Integer idUsuario) {
        String sql = """
                SELECT
                    id_periodo,
                    id_usuario,
                    nome,
                    data_inicio,
                    data_fim,
                    status
                FROM periodo_letivo
                WHERE id_usuario = ?
                ORDER BY data_inicio DESC, id_periodo DESC
                """;

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearPeriodoLetivo(rs),
                idUsuario
        );
    }

    public PeriodoLetivo consultarPorIdEUsuario(Integer idPeriodo, Integer idUsuario) {
        String sql = """
                SELECT
                    id_periodo,
                    id_usuario,
                    nome,
                    data_inicio,
                    data_fim,
                    status
                FROM periodo_letivo
                WHERE id_periodo = ?
                  AND id_usuario = ?
                """;

        List<PeriodoLetivo> periodos = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearPeriodoLetivo(rs),
                idPeriodo,
                idUsuario
        );

        return periodos.isEmpty() ? null : periodos.get(0);
    }

    public PeriodoLetivo consultarAtivoPorUsuario(Integer idUsuario) {
        String sql = """
                SELECT
                    id_periodo,
                    id_usuario,
                    nome,
                    data_inicio,
                    data_fim,
                    status
                FROM periodo_letivo
                WHERE id_usuario = ?
                  AND status = 'ATIVO'
                ORDER BY id_periodo DESC
                """;

        List<PeriodoLetivo> periodos = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearPeriodoLetivo(rs),
                idUsuario
        );

        return periodos.isEmpty() ? null : periodos.get(0);
    }

    public PeriodoLetivo inserir(PeriodoLetivo periodoLetivo) {
        Integer proximoId = jdbcTemplate.queryForObject(
                "SELECT NVL(MAX(id_periodo), 0) + 1 FROM periodo_letivo",
                Integer.class
        );

        String sql = """
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
                    ?,
                    ?,
                    ?
                )
                """;

        jdbcTemplate.update(
                sql,
                proximoId,
                periodoLetivo.getIdUsuario(),
                periodoLetivo.getNome(),
                Date.valueOf(periodoLetivo.getDataInicio()),
                Date.valueOf(periodoLetivo.getDataFim()),
                periodoLetivo.getStatus()
        );

        return consultarPorIdEUsuario(proximoId, periodoLetivo.getIdUsuario());
    }

    public PeriodoLetivo alterar(Integer idPeriodo, PeriodoLetivo periodoLetivo) {
        String sql = """
                UPDATE periodo_letivo
                SET nome = ?,
                    data_inicio = ?,
                    data_fim = ?,
                    status = ?
                WHERE id_periodo = ?
                  AND id_usuario = ?
                """;

        jdbcTemplate.update(
                sql,
                periodoLetivo.getNome(),
                Date.valueOf(periodoLetivo.getDataInicio()),
                Date.valueOf(periodoLetivo.getDataFim()),
                periodoLetivo.getStatus(),
                idPeriodo,
                periodoLetivo.getIdUsuario()
        );

        return consultarPorIdEUsuario(idPeriodo, periodoLetivo.getIdUsuario());
    }

    public void inativarOutrosPeriodos(Integer idUsuario, Integer idPeriodoIgnorado) {
        String sql = """
                UPDATE periodo_letivo
                SET status = 'INATIVO'
                WHERE id_usuario = ?
                  AND status = 'ATIVO'
                  AND id_periodo <> ?
                """;

        jdbcTemplate.update(sql, idUsuario, idPeriodoIgnorado);
    }

    public void inativarTodosPeriodosDoUsuario(Integer idUsuario) {
        String sql = """
                UPDATE periodo_letivo
                SET status = 'INATIVO'
                WHERE id_usuario = ?
                  AND status = 'ATIVO'
                """;

        jdbcTemplate.update(sql, idUsuario);
    }

    public PeriodoLetivo ativar(Integer idPeriodo, Integer idUsuario) {
        inativarOutrosPeriodos(idUsuario, idPeriodo);

        String sql = """
                UPDATE periodo_letivo
                SET status = 'ATIVO'
                WHERE id_periodo = ?
                  AND id_usuario = ?
                """;

        jdbcTemplate.update(sql, idPeriodo, idUsuario);

        return consultarPorIdEUsuario(idPeriodo, idUsuario);
    }

    public boolean excluir(Integer idPeriodo, Integer idUsuario) {
        String sql = """
                DELETE FROM periodo_letivo
                WHERE id_periodo = ?
                  AND id_usuario = ?
                """;

        int linhasAfetadas = jdbcTemplate.update(sql, idPeriodo, idUsuario);

        return linhasAfetadas > 0;
    }

    public Integer contarDisciplinasDoPeriodo(Integer idPeriodo) {
        String sql = """
                SELECT COUNT(*)
                FROM disciplina
                WHERE id_periodo = ?
                """;

        return jdbcTemplate.queryForObject(sql, Integer.class, idPeriodo);
    }

    public boolean usuarioExiste(Integer idUsuario) {
        String sql = """
                SELECT COUNT(*)
                FROM usuario
                WHERE id_usuario = ?
                """;

        Integer total = jdbcTemplate.queryForObject(sql, Integer.class, idUsuario);

        return total != null && total > 0;
    }

    private PeriodoLetivo mapearPeriodoLetivo(ResultSet rs) throws SQLException {
        PeriodoLetivo periodoLetivo = new PeriodoLetivo(
                rs.getInt("id_usuario"),
                rs.getString("nome"),
                rs.getDate("data_inicio").toLocalDate(),
                rs.getDate("data_fim").toLocalDate(),
                rs.getString("status")
        );

        periodoLetivo.setIdPeriodo(rs.getInt("id_periodo"));

        return periodoLetivo;
    }
}