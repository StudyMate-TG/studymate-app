package br.com.studymate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "disciplina")
public class Disciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "disciplina_seq")
    @SequenceGenerator(name = "disciplina_seq", sequenceName = "seq_disciplina", allocationSize = 1)
    @Column(name = "id_disciplina", nullable = false)
    private Integer idDisciplina;

    @NotNull
    @Positive
    @Column(name = "id_periodo", nullable = false)
    private Integer idPeriodo;

    @NotBlank(message = "O nome da disciplina é obrigatório")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nome;

    @NotBlank(message = "O professor é obrigatório")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String professor;

    @NotNull
    @DecimalMin("0.0")
    @DecimalMax("10.0")
    @Column(name = "media_aprovacao", nullable = false)
    private Double mediaAprovacao;

    @NotNull
    @PositiveOrZero
    @Column(name = "limite_faltas", nullable = false)
    private Integer limiteFaltas;

    // Campo auxiliar de apresentacao, nao pertence a tabela disciplina.
    @Transient
    private String nomePeriodo;

    public Disciplina(Integer idPeriodo, String nome, String professor) {
        this.idPeriodo = idPeriodo;
        this.nome = nome;
        this.professor = professor;
    }
}
