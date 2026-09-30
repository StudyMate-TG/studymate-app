package br.com.studymate.repository;

import br.com.studymate.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {
    List<Avaliacao> findByIdDisciplinaOrderByDataAvaliacaoDescIdAvaliacaoDesc(Integer idDisciplina);

    @Query("""
        select a from Avaliacao a
        join Disciplina d on d.idDisciplina = a.idDisciplina
        join PeriodoLetivo p on p.idPeriodo = d.idPeriodo
        where a.idAvaliacao = :id and p.idUsuario = :usuario
        """)
    Optional<Avaliacao> buscarDoUsuario(@Param("id") Long id, @Param("usuario") Integer usuario);
}
