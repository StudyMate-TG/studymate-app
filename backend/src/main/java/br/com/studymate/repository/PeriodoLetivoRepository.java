package br.com.studymate.repository;

import br.com.studymate.model.PeriodoLetivo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PeriodoLetivoRepository
        extends JpaRepository<PeriodoLetivo, Integer> {

    List<PeriodoLetivo> findByIdUsuarioAndStatus(Integer idUsuario, String status);

    List<PeriodoLetivo> findByIdUsuarioOrderByDataInicioDescIdPeriodoDesc(
            Integer idUsuario
    );

    Optional<PeriodoLetivo> findByIdPeriodoAndIdUsuario(
            Integer idPeriodo,
            Integer idUsuario
    );

    Optional<PeriodoLetivo> findFirstByIdUsuarioAndStatusOrderByIdPeriodoDesc(
            Integer idUsuario,
            String status
    );
}
