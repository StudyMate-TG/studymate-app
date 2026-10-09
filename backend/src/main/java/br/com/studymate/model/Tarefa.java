package br.com.studymate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "tarefa")
public class Tarefa {

    @Id
    @GeneratedValue(
        strategy = GenerationType.SEQUENCE,
        generator = "tarefa_seq"
    )
    @SequenceGenerator(
        name = "tarefa_seq",
        sequenceName = "seq_tarefa",
        allocationSize = 1
    )
    @Column(name = "id_tarefa", nullable = false)
    private Integer idTarefa;

    @NotNull
    @Positive
    @Column(name = "id_disciplina", nullable = false)
    private Integer idDisciplina;

    @NotBlank(message = "O título da tarefa é obrigatório")
    @Size(max = 100)
    @Column(name = "titulo", nullable = false, length = 100)
    private String titulo;

    @NotBlank(message = "O tipo da tarefa é obrigatório")
    @Size(max = 20)
    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo;

    @Size(max = 4096)
    @Lob
    @Column(name = "descricao")
    private String descricao;

    @Column(name = "data_hora_inicio")
    private LocalDateTime dataHoraInicio;

    @NotNull(message = "A data de entrega é obrigatória")
    @Column(name = "data_entrega", nullable = false)
    private LocalDateTime dataEntrega;

    @Column(name = "data_conclusao")
    private LocalDateTime dataConclusao;

    @NotBlank(message = "O status da tarefa é obrigatório")
    @Size(max = 20)
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @NotBlank(message = "A prioridade da tarefa é obrigatória")
    @Size(max = 20)
    @Column(name = "prioridade", nullable = false, length = 20)
    private String prioridade;

    @NotNull
    @PositiveOrZero
    @Column(name = "xp_gerado", nullable = false)
    private Integer xpGerado;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;

    public Tarefa(
        Integer idDisciplina,
        String titulo,
        String tipo,
        LocalDateTime dataEntrega
    ) {
        this.idDisciplina = idDisciplina;
        this.titulo = titulo;
        this.tipo = tipo;
        this.dataEntrega = dataEntrega;
    }
}