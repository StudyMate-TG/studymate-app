package br.com.studymate.repository;

import br.com.studymate.dto.TarefaResumoResponse;
import br.com.studymate.dto.TarefaResponse;
import br.com.studymate.model.Tarefa;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

public interface TarefaRepository extends JpaRepository<Tarefa, Integer> {

    // Inclui tombstones para preservar a integridade da FK.
    boolean existsByIdDisciplina(Integer idDisciplina);

    boolean existsByIdDisciplinaAndDeletedAtIsNull(Integer idDisciplina);


    @Query("""
            select new br.com.studymate.dto.TarefaResumoResponse(
                t.idTarefa, t.idDisciplina, d.nome, t.titulo, t.tipo,
                t.dataHoraInicio, t.dataEntrega, t.dataConclusao, t.status,
                t.prioridade, t.xpGerado)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario and t.deletedAt is null
            order by t.dataEntrega asc, t.idTarefa asc
            """)
    List<TarefaResumoResponse> listarPorUsuario(
            @Param("idUsuario") Integer idUsuario, Pageable pagina);

    @Query("""
            select coalesce(cast(length(t.descricao) as long), 0L)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where t.idTarefa = :idTarefa and p.idUsuario = :idUsuario and t.deletedAt is null
            """)
    Optional<Long> tamanhoDescricaoPorIdEUsuario(
            @Param("idTarefa") Integer idTarefa, @Param("idUsuario") Integer idUsuario);

    @Query("""
            select count(t)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario and t.deletedAt is null
            """)
    long contarPorUsuario(@Param("idUsuario") Integer idUsuario);

    @Query("""
            select coalesce(sum(cast(length(t.descricao) as long)), 0)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario and t.deletedAt is null
            """)
    long totalCaracteresPorUsuario(@Param("idUsuario") Integer idUsuario);

    @Query("""
            select t
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where t.idTarefa = :idTarefa
              and p.idUsuario = :idUsuario and t.deletedAt is null
            """)
    Optional<Tarefa> buscarPorIdEUsuario(
            @Param("idTarefa") Integer idTarefa,
            @Param("idUsuario") Integer idUsuario);

    // O predicado de propriedade e avaliado sobre a disciplina original da tarefa.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Tarefa t set t.idDisciplina = :idDisciplina,
                t.titulo = :titulo, t.tipo = :tipo, t.descricao = :descricao,
                t.dataHoraInicio = :dataHoraInicio, t.dataEntrega = :dataEntrega,
                t.prioridade = :prioridade, t.updatedAt = :updatedAt,
                t.version = t.version + 1
            where t.idTarefa = :idTarefa and t.deletedAt is null
                and exists (select d.idDisciplina from Disciplina d
                    join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
                    where d.idDisciplina = t.idDisciplina and p.idUsuario = :idUsuario)
            """)
    int atualizarPorIdEUsuario(
            @Param("idTarefa") Integer idTarefa, @Param("idUsuario") Integer idUsuario,
            @Param("idDisciplina") Integer idDisciplina, @Param("titulo") String titulo,
            @Param("tipo") String tipo, @Param("descricao") String descricao,
            @Param("dataHoraInicio") LocalDateTime dataHoraInicio,
            @Param("dataEntrega") LocalDateTime dataEntrega,
            @Param("prioridade") String prioridade,
            @Param("updatedAt") OffsetDateTime updatedAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            update Tarefa t set t.deletedAt = :deletedAt, t.updatedAt = :deletedAt,
                t.version = t.version + 1, t.descricao = null
            where t.idTarefa = :idTarefa and t.deletedAt is null
                and exists (select d.idDisciplina from Disciplina d
                    join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
                    where d.idDisciplina = t.idDisciplina and p.idUsuario = :idUsuario)
            """)
    int excluirPorIdEUsuario(
            @Param("idTarefa") Integer idTarefa, @Param("idUsuario") Integer idUsuario,
            @Param("deletedAt") OffsetDateTime deletedAt);

    // Consulta escalar antes do pull: nao materializa descricoes CLOB legadas.
    @Query("""
            select coalesce(max(cast(length(t.descricao) as long)), 0L)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario
            """)
    long maiorDescricaoPorUsuario(@Param("idUsuario") Integer idUsuario);

    // Inclui tombstones; limite e keyset sao aplicados no banco.
    @Query("""
            select new br.com.studymate.dto.TarefaResponse(t, d.nome)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario
              and (:since is null or t.updatedAt > :since)
              and t.updatedAt <= :until
              and (:afterAt is null or t.updatedAt > :afterAt
                    or (t.updatedAt = :afterAt and t.idTarefa > :afterId))
            order by t.updatedAt asc, t.idTarefa asc
            """)
    List<TarefaResponse> listarAlteracoesPaginadas(
            @Param("idUsuario") Integer idUsuario,
            @Param("since") OffsetDateTime since,
            @Param("until") OffsetDateTime until,
            @Param("afterAt") OffsetDateTime afterAt,
            @Param("afterId") Integer afterId, Pageable pagina);
}
