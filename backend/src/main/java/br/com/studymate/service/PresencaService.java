package br.com.studymate.service;

import br.com.studymate.dto.PresencaRequest;
import br.com.studymate.dto.PresencaResponse;
import br.com.studymate.model.Disciplina;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.UsuarioRepository;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PresencaService {
    private final JdbcTemplate jdbc;
    private final DisciplinaRepository disciplinas;
    private final UsuarioRepository usuarios;
    private final GamificacaoService gamificacao;

    public PresencaService(JdbcTemplate jdbc, DisciplinaRepository disciplinas,
            UsuarioRepository usuarios, GamificacaoService gamificacao) {
        this.jdbc = jdbc;
        this.disciplinas = disciplinas;
        this.usuarios = usuarios;
        this.gamificacao = gamificacao;
    }

    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public List<PresencaResponse> listar(Integer idUsuario, Integer idDisciplina) {
        disciplinaDoUsuario(idUsuario, idDisciplina);
        return jdbc.query("""
                SELECT id_presenca,id_disciplina,nome_disciplina,data_presenca,xp_gerado
                FROM presenca_aula WHERE id_usuario=? AND id_disciplina=?
                ORDER BY data_presenca DESC,id_presenca DESC
                """, (rs, row) -> new PresencaResponse(rs.getInt(1), rs.getInt(2), rs.getString(3),
                rs.getDate(4).toLocalDate(), rs.getInt(5)), idUsuario, idDisciplina);
    }

    @Transactional
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public PresencaResponse cadastrar(Integer idUsuario, PresencaRequest request) {
        if (request == null || request.dataPresenca() == null) {
            throw new IllegalArgumentException("A data da presença é obrigatória.");
        }
        LocalDate dataPresenca = gamificacao.hoje();
        if (!request.dataPresenca().equals(dataPresenca)) {
            throw new IllegalArgumentException("A presença só pode ser registrada para hoje, no horário de São Paulo.");
        }
        usuarios.buscarParaAtualizacao(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        Disciplina disciplina = disciplinaDoUsuario(idUsuario, request.idDisciplina());
        Date dia = Date.valueOf(dataPresenca);
        int existentes = jdbc.queryForObject("SELECT COUNT(*) FROM presenca_aula WHERE id_usuario=? AND id_disciplina=? AND data_presenca=?",
                Integer.class, idUsuario, request.idDisciplina(), dia);
        if (existentes > 0) {
            throw new IllegalArgumentException("A presença nesta disciplina já foi registrada para este dia.");
        }
        Integer id = jdbc.queryForObject("SELECT seq_presenca_aula.nextval FROM dual", Integer.class);
        jdbc.update("""
                INSERT INTO presenca_aula (id_presenca,id_usuario,id_disciplina,nome_disciplina,data_presenca,xp_gerado)
                VALUES (?,?,?,?,?,?)
                """, id, idUsuario, request.idDisciplina(), disciplina.getNome(), dia, GamificacaoService.XP_PRESENCA);
        // The reward checks the server day again so crossing midnight rolls back the whole registration.
        gamificacao.premiarPresenca(idUsuario, id, disciplina.getNome(), dataPresenca);
        return new PresencaResponse(id, request.idDisciplina(), disciplina.getNome(),
                dataPresenca, GamificacaoService.XP_PRESENCA);
    }

    private Disciplina disciplinaDoUsuario(Integer usuario, Integer disciplina) {
        if (usuario == null || usuario <= 0 || disciplina == null || disciplina <= 0) {
            throw new IllegalArgumentException("A disciplina informada é inválida.");
        }
        return disciplinas.buscarPorIdEUsuario(disciplina, usuario)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina não encontrada."));
    }
}
