package br.com.studymate.repository;

import br.com.studymate.dto.HorarioAulaResponse;
import br.com.studymate.model.HorarioAula;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface HorarioAulaRepository
        extends JpaRepository<HorarioAula, Integer> {

    @Query("""
            select new br.com.studymate.dto.HorarioAulaResponse(
                h,
                d.nome,
                p.dataInicio,
                p.dataFim
            )
            from HorarioAula h
            join Disciplina d
              on d.idDisciplina = h.idDisciplina
            join PeriodoLetivo p
              on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario
              and (
                    :idDisciplina is null
                    or h.idDisciplina = :idDisciplina
                  )
            order by h.diaSemana, h.horaInicio
            """)
    List<HorarioAulaResponse> listarPorUsuario(
            @Param("idUsuario") Integer idUsuario,
            @Param("idDisciplina") Integer idDisciplina
    );

    @Query("""
            select h
            from HorarioAula h
            join Disciplina d
              on d.idDisciplina = h.idDisciplina
            join PeriodoLetivo p
              on p.idPeriodo = d.idPeriodo
            where h.idHorario = :idHorario
              and p.idUsuario = :idUsuario
            """)
    Optional<HorarioAula> buscarPorIdEUsuario(
            @Param("idHorario") Integer idHorario,
            @Param("idUsuario") Integer idUsuario
    );
}