package br.com.studymate.repository;

import br.com.studymate.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


public interface UsuarioRepository
        extends JpaRepository<Usuario, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from Usuario u where u.idUsuario = :id")
    Optional<Usuario> buscarParaAtualizacao(@Param("id") Integer id);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdUsuarioNot(String email, Integer idUsuario);
}
