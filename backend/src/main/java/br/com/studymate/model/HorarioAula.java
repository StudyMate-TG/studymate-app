package br.com.studymate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "horario_aula")
public class HorarioAula {

    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "horario_aula_seq"
    )
    @SequenceGenerator(
            name = "horario_aula_seq",
            sequenceName = "seq_horario_aula",
            allocationSize = 1
    )
    @Column(name = "id_horario", nullable = false)
    private Integer idHorario;

    @NotNull
    @Positive
    @Column(name = "id_disciplina", nullable = false)
    private Integer idDisciplina;

    @NotBlank(message = "O dia da semana é obrigatório")
    @Size(max = 20)
    @Column(name = "dia_semana", nullable = false, length = 20)
    private String diaSemana;

    @NotBlank(message = "O horário de início é obrigatório")
    @Size(max = 5)
    @Column(name = "hora_inicio", nullable = false, length = 5)
    private String horaInicio;

    @NotBlank(message = "O horário de fim é obrigatório")
    @Size(max = 5)
    @Column(name = "hora_fim", nullable = false, length = 5)
    private String horaFim;

    @Size(max = 100)
    @Column(length = 100)
    private String local;

    public HorarioAula(
            Integer idDisciplina,
            String diaSemana,
            String horaInicio,
            String horaFim
    ) {
        this.idDisciplina = idDisciplina;
        this.diaSemana = diaSemana;
        this.horaInicio = horaInicio;
        this.horaFim = horaFim;
    }
}