package br.com.studymate.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class HorarioAulaRequest {

    private Integer idUsuario;
    private Integer idDisciplina;
    private String diaSemana;
    private String horaInicio;
    private String horaFim;
    private String local;
}