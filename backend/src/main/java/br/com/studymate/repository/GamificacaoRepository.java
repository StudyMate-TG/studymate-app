package br.com.studymate.repository;

import br.com.studymate.dto.GamificacaoResponse.Atividade;
import java.sql.Date;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class GamificacaoRepository {
    private final JdbcTemplate jdbc;

    public GamificacaoRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public record Progresso(int xpTotal, int melhorOfensiva) {}
    public record Contagem(int tarefas, int presencas) {}

    public Progresso progresso(Integer usuario) {
        return jdbc.query("SELECT xp_total,maior_sequencia FROM progresso_estudante WHERE id_usuario=?",
                (rs, row) -> new Progresso(rs.getInt(1), rs.getInt(2)), usuario)
                .stream().findFirst().orElse(new Progresso(0, 0));
    }

    public boolean possuiPremioTarefa(Integer usuario, Integer tarefa) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM atividade_gamificacao WHERE id_usuario=? AND tipo='TAREFA' AND origem_id=?",
                Integer.class, usuario, tarefa) > 0;
    }

    public void registrar(Integer usuario, String tipo, Integer origem,
            String descricao, int xp, LocalDate dia, OffsetDateTime instante) {
        jdbc.update("""
                INSERT INTO atividade_gamificacao
                    (id_atividade,id_usuario,tipo,origem_id,descricao,xp,data_atividade,registrada_em)
                VALUES (?,?,?,?,?,?,?,?)
                """, UUID.randomUUID().toString(), usuario, tipo, origem, descricao,
                xp, Date.valueOf(dia), instante);
    }

    public Map<LocalDate, Integer> dias(Integer usuario) {
        Map<LocalDate, Integer> dias = new LinkedHashMap<>();
        jdbc.query("SELECT data_atividade,SUM(xp) AS xp FROM atividade_gamificacao WHERE id_usuario=? GROUP BY data_atividade ORDER BY data_atividade",
                (org.springframework.jdbc.core.RowCallbackHandler) rs ->
                        dias.put(rs.getDate(1).toLocalDate(), rs.getInt(2)), usuario);
        return dias;
    }

    public Contagem contagem(Integer usuario) {
        return jdbc.queryForObject("""
                SELECT COALESCE(SUM(CASE WHEN tipo='TAREFA' THEN 1 ELSE 0 END),0),
                       COALESCE(SUM(CASE WHEN tipo='PRESENCA' THEN 1 ELSE 0 END),0)
                FROM atividade_gamificacao WHERE id_usuario=?
                """, (rs, row) -> new Contagem(rs.getInt(1), rs.getInt(2)), usuario);
    }

    public List<Atividade> recentes(Integer usuario) {
        return jdbc.query("""
                SELECT id_atividade,tipo,descricao,xp,registrada_em,data_atividade
                FROM atividade_gamificacao WHERE id_usuario=?
                ORDER BY registrada_em DESC,id_atividade DESC FETCH FIRST 10 ROWS ONLY
                """, (rs, row) -> new Atividade(rs.getString(1), rs.getString(2),
                rs.getString(3), rs.getInt(4), rs.getObject(5, OffsetDateTime.class),
                rs.getDate(6).toLocalDate()), usuario);
    }

    public Map<String, OffsetDateTime> medalhas(Integer usuario) {
        Map<String, OffsetDateTime> result = new LinkedHashMap<>();
        jdbc.query("SELECT codigo,desbloqueada_em FROM medalha_estudante WHERE id_usuario=?",
                (org.springframework.jdbc.core.RowCallbackHandler) rs ->
                        result.put(rs.getString(1), rs.getObject(2, OffsetDateTime.class)), usuario);
        return result;
    }

    public void desbloquear(Integer usuario, String codigo, OffsetDateTime instante) {
        jdbc.update("INSERT INTO medalha_estudante (id_usuario,codigo,desbloqueada_em) VALUES (?,?,?)",
                usuario, codigo, instante);
    }

    public void atualizar(Integer usuario, int xp, int sequencia, int melhor, LocalDate ultimo) {
        int alteradas = jdbc.update("""
                UPDATE progresso_estudante SET xp_total=?,nivel=?,sequencia_atual=?,
                    maior_sequencia=?,data_ultimo_dia_sequencia=? WHERE id_usuario=?
                """, xp, xp / 100 + 1, sequencia, melhor,
                ultimo == null ? null : Date.valueOf(ultimo), usuario);
        if (alteradas == 0) {
            jdbc.update("""
                    INSERT INTO progresso_estudante
                    (id_usuario,xp_total,nivel,sequencia_atual,maior_sequencia,data_ultimo_dia_sequencia)
                    VALUES (?,?,?,?,?,?)
                    """, usuario, xp, xp / 100 + 1, sequencia, melhor,
                    ultimo == null ? null : Date.valueOf(ultimo));
        }
    }
}
