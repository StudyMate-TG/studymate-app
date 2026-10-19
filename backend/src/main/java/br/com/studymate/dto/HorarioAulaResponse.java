package br.com.studymate.dto;

import br.com.studymate.model.HorarioAula;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Getter
@NoArgsConstructor
public class HorarioAulaResponse {

    private Integer idHorario;
    private Integer idDisciplina;
    private String nomeDisciplina;
    private String diaSemana;
    private String horaInicio;
    private String horaFim;
    private String local;

    private LocalDate dataInicioPeriodo;
    private LocalDate dataFimPeriodo;

    public HorarioAulaResponse(
            HorarioAula horario,
            String nomeDisciplina,
            LocalDate dataInicioPeriodo,
            LocalDate dataFimPeriodo
    ) {
        this.idHorario = horario.getIdHorario();
        this.idDisciplina = horario.getIdDisciplina();
        this.nomeDisciplina = nomeDisciplina;
        this.diaSemana = horario.getDiaSemana();
        this.horaInicio = horario.getHoraInicio();
        this.horaFim = horario.getHoraFim();
        this.local = horario.getLocal();
        this.dataInicioPeriodo = dataInicioPeriodo;
        this.dataFimPeriodo = dataFimPeriodo;
    }
}