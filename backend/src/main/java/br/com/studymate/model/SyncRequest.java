package br.com.studymate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "sync_request")
public class SyncRequest {

    @Id
    @Column(
        name = "client_tx_id",
        nullable = false,
        length = 36
    )
    private String clientTxId;

    @NotNull
    @Positive
    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario;

    @NotBlank
    @Size(max = 30)
    @Column(
        name = "entity_type",
        nullable = false,
        length = 30
    )
    private String entityType;

    @NotBlank
    @Size(max = 10)
    @Column(
        name = "operation",
        nullable = false,
        length = 10
    )
    private String operation;

    @Column(name = "response_resource_id")
    private Integer responseResourceId;

    @CreationTimestamp
    @Column(
        name = "processed_at",
        nullable = false,
        updatable = false
    )
    private OffsetDateTime processedAt;

    public SyncRequest(
            String clientTxId,
            Integer idUsuario,
            String entityType,
            String operation,
            Integer responseResourceId) {

        this.clientTxId = clientTxId;
        this.idUsuario = idUsuario;
        this.entityType = entityType;
        this.operation = operation;
        this.responseResourceId = responseResourceId;
    }
}