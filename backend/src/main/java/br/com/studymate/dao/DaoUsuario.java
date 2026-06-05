package br.com.studymate.dao;

import br.com.studymate.model.Usuario;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class DaoUsuario{
    private final JdbcTemplate jdbcTemplate;

    public DaoUsuario(JdbcTemplate jdbcTemplate){
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean existePorEmail(String email){
        Integer quantidade = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM usuario WHERE LOWER(email) = LOWER(?)", Integer.class, email
        );

        return quantidade != null && quantidade > 0;
    }

    public Usuario inserir(Usuario usuario){
        Integer proximoId = jdbcTemplate.queryForObject(
            "SELECT NVL(MAX(id_usuario), 0) + 1 FROM usuario", Integer.class
        );

        jdbcTemplate.update(
            """
            INSERT INTO usuario (
                id_usuario,
                nome,
                email,
                senha,
                data_criacao,
                curso,
                semestre,
                matricula,
                instituicao)
                VALUES (?, ?, ?, ?, SYSDATE, ?, ?, ?, ?)
                """,
                proximoId,
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getSenha(),
                usuario.getCurso(),
                usuario.getSemestre(),
                usuario.getMatricula(),
                usuario.getInstituicao()
        );

        return consultarPorId(proximoId);
    }

    public Usuario consultarPorId(Integer idUsuario){
        List<Usuario> usuarios = jdbcTemplate.query(
            """
            SELECT
                id_usuario,
                nome,
                email,
                senha,
                data_criacao,
                curso,
                semestre,
                matricula,
                instituicao
                FROM usuario
                WHERE id_usuario = ?
                """,
                (rs, rowNum) -> mapearUsuario(rs),
                idUsuario
        );

        return usuarios.isEmpty() ? null : usuarios.get(0);
    }

    public Usuario consultaPorEmailESenha(String email, String senha){
        List<Usuario> usuarios = jdbcTemplate.query(
            """
            SELECT 
            id_usuario,
            nome,
            email,
            senha,
            data_criacao,
            curso,
            semestre,
            matricula,
            instituicao
            FROM usuario
            WHERE LOWER(email) = LOWER(?)
            AND senha = ?
            """,
            (rs, rowNum) -> mapearUsuario(rs),
            email,
            senha
        );

        return usuarios.isEmpty() ? null : usuarios.get(0);
    }

    private Usuario mapearUsuario(ResultSet rs) throws SQLException{
        Usuario usuario = new Usuario(rs.getString("nome"), rs.getString("email"), rs.getString("senha"));
        usuario.setIdUsuario(rs.getInt("id_usuario"));

        Timestamp dataCriacao = rs.getTimestamp("data_criacao");

        if (dataCriacao != null){
            usuario.setDataCriacao(dataCriacao.toLocalDateTime());
        }

        usuario.setCurso(rs.getString("curso"));
        usuario.setSemestre(rs.getString("semestre"));
        usuario.setMatricula(rs.getString("matricula"));
        usuario.setInstituicao(rs.getString("instituicao"));

        return usuario;
    }
}