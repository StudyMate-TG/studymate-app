package br.com.studymate.repository;

import br.com.studymate.model.Notificacao;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {
    @Query("""
        select n from Notificacao n where n.idUsuario = :usuario and n.processadoEm is not null
        and (:lida is null or n.lida = :lida) order by n.processadoEm desc, n.idNotificacao desc
        """)
    Page<Notificacao> listar(@Param("usuario") Integer usuario, @Param("lida") Boolean lida, Pageable pageable);
    long countByIdUsuarioAndLidaFalseAndProcessadoEmIsNotNull(Integer usuario);
    Optional<Notificacao> findByIdNotificacaoAndIdUsuarioAndProcessadoEmIsNotNull(Long id, Integer usuario);
    Optional<Notificacao> findByChaveDeduplicacao(String chave);
    List<Notificacao> findByIdUsuarioAndOrigemTipoAndOrigemIdAndProcessadoEmIsNull(Integer usuario, String origem, Long id);
    List<Notificacao> findByIdUsuarioAndIdDisciplina(Integer usuario, Integer disciplina);
    List<Notificacao> findByIdUsuarioAndIdAvaliacao(Integer usuario, Long avaliacao);
    @Query("""
        select n from Notificacao n where n.idUsuario = :usuario and n.processadoEm is null
        and n.canceladoEm is null and n.previstoPara <= :agora order by n.previstoPara, n.idNotificacao
        """)
    List<Notificacao> pendentes(@Param("usuario") Integer usuario, @Param("agora") OffsetDateTime agora, Pageable pageable);
}
