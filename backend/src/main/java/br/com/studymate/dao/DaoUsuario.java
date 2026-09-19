package br.com.studymate.dao;

import br.com.studymate.model.Usuario;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class DaoUsuario {

    private final JdbcTemplate jdbcTemplate;

    public DaoUsuario(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean existePorEmail(String email) {
        Integer quantidade = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM usuario WHERE LOWER(email) = LOWER(?)",
                Integer.class,
                email
        );

        return quantidade != null && quantidade > 0;
    }

    public boolean existePorEmailEmOutroUsuario(String email, Integer idUsuario) {
        Integer quantidade = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*)
                FROM usuario
                WHERE LOWER(email) = LOWER(?)
                  AND id_usuario <> ?
                """,
                Integer.class,
                email,
                idUsuario
        );

        return quantidade != null && quantidade > 0;
    }

    public Usuario inserir(Usuario usuario) {
        Integer proximoId = jdbcTemplate.queryForObject(
                "SELECT NVL(MAX(id_usuario), 0) + 1 FROM usuario",
                Integer.class
        );

        String sqlInsert = """
                INSERT INTO usuario (
                    id_usuario,
                    nome,
                    email,
                    senha_hash,
                    data_criacao,
                    curso,
                    matricula,
                    instituicao
                ) VALUES (
                    ?,
                    ?,
                    ?,
                    ?,
                    SYSDATE,
                    ?,
                    ?,
                    ?
                )
                """;

        jdbcTemplate.update(
                sqlInsert,
                proximoId,
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getSenha(),
                usuario.getCurso(),
                usuario.getMatricula(),
                usuario.getInstituicao()
        );

        criarProgressoInicial(proximoId);

        return consultarPorId(proximoId);
    }

    public Usuario consultarPorId(Integer idUsuario) {
        String sql = """
                SELECT
                    id_usuario,
                    nome,
                    email,
                    senha_hash,
                    data_criacao,
                    curso,
                    matricula,
                    instituicao
                FROM usuario
                WHERE id_usuario = ?
                """;

        List<Usuario> usuarios = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearUsuario(rs),
                idUsuario
        );

        return usuarios.isEmpty() ? null : usuarios.get(0);
    }

    public Usuario consultaPorEmailESenha(String email, String senha) {
        String sql = """
                SELECT
                    id_usuario,
                    nome,
                    email,
                    senha_hash,
                    data_criacao,
                    curso,
                    matricula,
                    instituicao
                FROM usuario
                WHERE LOWER(email) = LOWER(?)
                  AND senha_hash = ?
                """;

        List<Usuario> usuarios = jdbcTemplate.query(
                sql,
                (rs, rowNum) -> mapearUsuario(rs),
                email,
                senha
        );

        return usuarios.isEmpty() ? null : usuarios.get(0);
    }

    public Usuario atualizar(
            Integer idUsuario,
            String nome,
            String email,
            String curso,
            String matricula,
            String instituicao
    ) {
        String sqlUpdate = """
                UPDATE usuario
                SET nome = ?,
                    email = ?,
                    curso = ?,
                    matricula = ?,
                    instituicao = ?
                WHERE id_usuario = ?
                """;

        jdbcTemplate.update(
                sqlUpdate,
                nome,
                email,
                curso,
                matricula,
                instituicao,
                idUsuario
        );

        return consultarPorId(idUsuario);
    }

    private void criarProgressoInicial(Integer idUsuario) {
        String sql = """
                INSERT INTO progresso_estudante (
                    id_usuario,
                    xp_total,
                    nivel,
                    sequencia_atual,
                    maior_sequencia,
                    data_ultimo_dia_sequencia
                ) VALUES (
                    ?,
                    0,
                    1,
                    0,
                    0,
                    NULL
                )
                """;

        jdbcTemplate.update(sql, idUsuario);
    }

    private Usuario mapearUsuario(ResultSet rs) throws SQLException {
        Usuario usuario = new Usuario(
                rs.getString("nome"),
                rs.getString("email"),
                rs.getString("senha_hash")
        );

        usuario.setIdUsuario(rs.getInt("id_usuario"));

        Timestamp dataCriacao = rs.getTimestamp("data_criacao");

        if (dataCriacao != null) {
            usuario.setDataCriacao(dataCriacao.toLocalDateTime());
        }

        usuario.setCurso(rs.getString("curso"));
        usuario.setMatricula(rs.getString("matricula"));
        usuario.setInstituicao(rs.getString("instituicao"));

        return usuario;
    }
}