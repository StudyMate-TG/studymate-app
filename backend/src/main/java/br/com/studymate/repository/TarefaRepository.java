package br.com.studymate.repository;

import br.com.studymate.dto.TarefaResponse;
import br.com.studymate.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TarefaRepository extends JpaRepository<Tarefa, Integer> {

    List<Tarefa> findByIdDisciplinaOrderByDataEntregaAsc(Integer idDisciplina);

    boolean existsByIdDisciplina(Integer idDisciplina);

    @Query("""
            select new br.com.studymate.dto.TarefaResponse(t, d.nome)
            from Tarefa t
            join Disciplina d on d.idDisciplina = t.idDisciplina
            join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario
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
            """)
    Optional<Tarefa> buscarPorIdEUsuario(
            @Param("idTarefa") Integer idTarefa,
            @Param("idUsuario") Integer idUsuario
    );
}