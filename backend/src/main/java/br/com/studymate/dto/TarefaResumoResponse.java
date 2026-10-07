package br.com.studymate.dto;

import lombok.Getter;

import java.time.LocalDateTime;

/** Campos da listagem: a descricao CLOB so e consultada no detalhe. */
@Getter
public class TarefaResumoResponse {
    private final Integer idTarefa;
    private final Integer idDisciplina;
    private final String nomeDisciplina;
    private final String titulo;
    private final String tipo;
    private final LocalDateTime dataHoraInicio;
    private final LocalDateTime dataEntrega;
    private final LocalDateTime dataConclusao;
    private final String status;
    private final String prioridade;
    private final Integer xpGerado;

    public TarefaResumoResponse(Integer idTarefa, Integer idDisciplina, String nomeDisciplina,
                               String titulo, String tipo, LocalDateTime dataHoraInicio,
                               LocalDateTime dataEntrega, LocalDateTime dataConclusao,
                               String status, String prioridade, Integer xpGerado) {
        this.idTarefa = idTarefa;
        this.idDisciplina = idDisciplina;
        this.nomeDisciplina = nomeDisciplina;
        this.titulo = titulo;
        this.tipo = tipo;
        this.dataHoraInicio = dataHoraInicio;
        this.dataEntrega = dataEntrega;
        this.dataConclusao = dataConclusao;
        this.status = status;
        this.prioridade = prioridade;
        this.xpGerado = xpGerado;
    }
}
