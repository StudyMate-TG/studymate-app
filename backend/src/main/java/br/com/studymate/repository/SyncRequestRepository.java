package br.com.studymate.repository;

import br.com.studymate.model.SyncRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SyncRequestRepository
        extends JpaRepository<SyncRequest, String> {

    Optional<SyncRequest> findByClientTxIdAndIdUsuario(
        String clientTxId,
        Integer idUsuario
    );
}