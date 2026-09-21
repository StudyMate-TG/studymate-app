package br.com.studymate.repository;

import br.com.studymate.dto.DisciplinaResponse;
import br.com.studymate.model.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DisciplinaRepository extends JpaRepository<Disciplina, Integer> {
    List<Disciplina> findByIdPeriodoOrderByNomeAsc(Integer idPeriodo);
    Optional<Disciplina> findByIdDisciplinaAndIdPeriodo(Integer idDisciplina, Integer idPeriodo);
    boolean existsByIdPeriodo(Integer idPeriodo);

    @Query("""
            select new br.com.studymate.dto.DisciplinaResponse(d, p.nome)
            from Disciplina d join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where p.idUsuario = :idUsuario
              and (lower(d.nome) like lower(:termo) escape '!' or lower(d.professor) like lower(:termo) escape '!')
            order by d.nome
            """)
    List<DisciplinaResponse> listarPorUsuario(
            @Param("idUsuario") Integer idUsuario, @Param("termo") String termo);

    @Query("""
            select d from Disciplina d join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
            where d.idDisciplina = :idDisciplina and p.idUsuario = :idUsuario
            """)
    Optional<Disciplina> buscarPorIdEUsuario(
            @Param("idDisciplina") Integer idDisciplina, @Param("idUsuario") Integer idUsuario);
}
