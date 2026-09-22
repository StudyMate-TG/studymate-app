package br.com.studymate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "periodo_letivo")
public class PeriodoLetivo {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "periodo_seq")
    @SequenceGenerator(name = "periodo_seq", sequenceName = "seq_periodo_letivo", allocationSize = 1)
    @Column(name = "id_periodo", nullable = false)
    private Integer idPeriodo;

    @NotNull
    @Positive
    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario;

    @NotBlank(message = "O nome do período é obrigatório")
    @Size(max = 50)
    @Column(nullable = false, length = 50)
    private String nome;

    @NotNull
    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @NotNull
    @Column(name = "data_fim", nullable = false)
    private LocalDate dataFim;

    @NotBlank(message = "O status é obrigatório")
    @Size(max = 20)
    @Column(nullable = false, length = 20)
    private String status;

    public PeriodoLetivo(
            Integer idUsuario,
            String nome,
            LocalDate dataInicio,
            LocalDate dataFim,
            String status
    ) {
        this.idUsuario = idUsuario;
        this.nome = nome;
        this.dataInicio = dataInicio;
        this.dataFim = dataFim;
        this.status = status;
    }

    @AssertTrue(message = "A data final deve ser igual ou posterior à data inicial")
    public boolean isIntervaloDatasValido() {
        return dataInicio == null || dataFim == null || !dataFim.isBefore(dataInicio);
    }
}
