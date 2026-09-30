package br.com.studymate.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TarefaRequest {

    @NotNull
    @Positive
    private Integer idUsuario;

    @NotNull
    @Positive
    private Integer idDisciplina;

    @NotBlank
    @Size(max = 100)
    private String titulo;

    @NotBlank
    @Size(max = 20)
    private String tipo;

    private String descricao;

    private LocalDateTime dataHoraInicio;

    @NotNull
    private LocalDateTime dataEntrega;

    @NotBlank
    @Size(max = 20)
    private String prioridade;
}