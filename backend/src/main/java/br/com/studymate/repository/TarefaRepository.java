package br.com.studymate.repository;

import br.com.studymate.dto.TarefaResponse;
import br.com.studymate.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.OffsetDateTime;

public interface TarefaRepository extends JpaRepository<Tarefa, Integer> {

    List<Tarefa> findByIdDisciplinaAndDeletedAtIsNullOrderByDataEntregaAsc(
        Integer idDisciplina
    );

    /*
     * Mantém esta consulta considerando inclusive tarefas excluídas logicamente.
     * É útil para verificações de integridade/referência no banco.
     */
    boolean existsByIdDisciplina(Integer idDisciplina);

    /*
     * Use esta quando quiser saber somente se existem tarefas ativas.
     */
    boolean existsByIdDisciplinaAndDeletedAtIsNull(Integer idDisciplina);

    @Query("""
            select new br.com.studymate.dto.TarefaResponse(t, d.nome)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario
              and t.deletedAt is null
            order by t.dataEntrega asc
            """)
    List<TarefaResponse> listarPorUsuario(
        @Param("idUsuario") Integer idUsuario
    );

    @Query("""
            select t
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where t.idTarefa = :idTarefa
              and p.idUsuario = :idUsuario
              and t.deletedAt is null
            """)
    Optional<Tarefa> buscarPorIdEUsuario(
        @Param("idTarefa") Integer idTarefa,
        @Param("idUsuario") Integer idUsuario
    );
    
        @Query("""
                select new br.com.studymate.dto.TarefaResponse(t, d.nome)
                from Tarefa t
                join Disciplina d on d.idDisciplina = t.idDisciplina
                join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
                where p.idUsuario = :idUsuario
                and t.updatedAt <= :until
                order by t.updatedAt asc, t.idTarefa asc
                """)
        List<TarefaResponse> listarAlteracoesAte(
                @Param("idUsuario") Integer idUsuario,
                @Param("until") OffsetDateTime until
        );

        @Query("""
                select new br.com.studymate.dto.TarefaResponse(t, d.nome)
                from Tarefa t
                join Disciplina d on d.idDisciplina = t.idDisciplina
                join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
                where p.idUsuario = :idUsuario
                and t.updatedAt > :since
                and t.updatedAt <= :until
                order by t.updatedAt asc, t.idTarefa asc
                """)
        List<TarefaResponse> listarAlteracoesEntre(
                @Param("idUsuario") Integer idUsuario,
                @Param("since") OffsetDateTime since,
                @Param("until") OffsetDateTime until
        );
}