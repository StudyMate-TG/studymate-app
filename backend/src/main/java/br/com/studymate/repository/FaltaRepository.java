package br.com.studymate.repository;

import br.com.studymate.model.Falta;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FaltaRepository extends JpaRepository<Falta, Integer> {

    List<Falta> findByIdDisciplinaOrderByDataFaltaDescIdFaltaDesc(
            Integer idDisciplina
    );

    @Query("""
           select coalesce(sum(f.quantidadeAulas), 0)
           from Falta f
           where f.idDisciplina = :idDisciplina
           """)
    Long somarFaltasPorDisciplina(
            @Param("idDisciplina") Integer idDisciplina
    );
}