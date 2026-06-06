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

    public List<Disciplina> listar(String termo) {
        if (termo == null || termo.isBlank()) {
            String sql = "SELECT id_disciplina, id_periodo, nome, professor, media_aprovacao, limite_faltas " +
                    "FROM disciplina " +
                    "ORDER BY nome";

            return jdbcTemplate.query(
                    sql,
                    (rs, rowNum) -> mapearDisciplina(rs)
            );
        }

        String sql = "SELECT id_disciplina, id_periodo, nome, professor, media_aprovacao, limite_faltas " +
                "FROM disciplina " +
                "WHERE LOWER(nome) LIKE LOWER(?) " +
                "OR LOWER(professor) LIKE LOWER(?) " +
                "ORDER BY nome";

        String termoBusca = "%" + termo + "%";

        return jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearDisciplina(rs),
                termoBusca,
                termoBusca
        );
    }

    public Disciplina consultarPorId(Integer idDisciplina) {
        String sql = "SELECT id_disciplina, id_periodo, nome, professor, media_aprovacao, limite_faltas " +
                "FROM disciplina " +
                "WHERE id_disciplina = ?";

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

    public Disciplina inserir(Disciplina disciplina) {
        String sqlProximoId = "SELECT NVL(MAX(id_disciplina), 0) + 1 FROM disciplina";

        Integer proximoId = jdbcTemplate.queryForObject(
                sqlProximoId,
                Integer.class
        );

        String sqlInsert = "INSERT INTO disciplina " +
                "(id_disciplina, id_periodo, nome, professor, media_aprovacao, limite_faltas) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

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

    public Disciplina alterar(Integer idDisciplina, Disciplina disciplina) {
        String sqlUpdate = "UPDATE disciplina " +
                "SET id_periodo = ?, " +
                "nome = ?, " +
                "professor = ?, " +
                "media_aprovacao = ?, " +
                "limite_faltas = ? " +
                "WHERE id_disciplina = ?";

        jdbcTemplate.update(
                sqlUpdate,
                disciplina.getIdPeriodo(),
                disciplina.getNome(),
                disciplina.getProfessor(),
                disciplina.getMediaAprovacao(),
                disciplina.getLimiteFaltas(),
                idDisciplina
        );

        return consultarPorId(idDisciplina);
    }

    public boolean excluir(Integer idDisciplina) {
        String sql = "DELETE FROM disciplina WHERE id_disciplina = ?";

        int linhasAfetadas = jdbcTemplate.update(sql, idDisciplina);

        return linhasAfetadas > 0;
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