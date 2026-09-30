package br.com.studymate.dto;

import br.com.studymate.model.Tarefa;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class TarefaResponse {

    private final Integer idTarefa;
    private final Integer idDisciplina;
    private final String nomeDisciplina;
    private final String titulo;
    private final String tipo;
    private final String descricao;
    private final LocalDateTime dataHoraInicio;
    private final LocalDateTime dataEntrega;
    private final LocalDateTime dataConclusao;
    private final String status;
    private final String prioridade;
    private final Integer xpGerado;

    public TarefaResponse(Tarefa tarefa, String nomeDisciplina) {
        this.idTarefa = tarefa.getIdTarefa();
        this.idDisciplina = tarefa.getIdDisciplina();
        this.nomeDisciplina = nomeDisciplina;
        this.titulo = tarefa.getTitulo();
        this.tipo = tarefa.getTipo();
        this.descricao = tarefa.getDescricao();
        this.dataHoraInicio = tarefa.getDataHoraInicio();
        this.dataEntrega = tarefa.getDataEntrega();
        this.dataConclusao = tarefa.getDataConclusao();
        this.status = tarefa.getStatus();
        this.prioridade = tarefa.getPrioridade();
        this.xpGerado = tarefa.getXpGerado();
    }
}