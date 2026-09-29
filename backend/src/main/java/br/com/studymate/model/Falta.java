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
@Table(name = "falta")
public class Falta {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "falta_seq")
    @SequenceGenerator(
            name = "falta_seq",
            sequenceName = "seq_falta",
            allocationSize = 1
    )
    @Column(name = "id_falta", nullable = false)
    private Integer idFalta;

    @NotNull
    @Positive
    @Column(name = "id_disciplina", nullable = false)
    private Integer idDisciplina;

    @NotNull
    @Column(name = "data_falta", nullable = false)
    private LocalDate dataFalta;

    @NotNull
    @Positive
    @Column(name = "quantidade_aulas", nullable = false)
    private Integer quantidadeAulas;

    public Falta(
            Integer idDisciplina,
            LocalDate dataFalta,
            Integer quantidadeAulas
    ) {
        this.idDisciplina = idDisciplina;
        this.dataFalta = dataFalta;
        this.quantidadeAulas = quantidadeAulas;
    }
}