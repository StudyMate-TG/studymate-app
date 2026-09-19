package br.com.studymate.dto;

import br.com.studymate.model.PeriodoLetivo;

import java.time.LocalDate;

public class PeriodoLetivoResponse {

    private Integer idPeriodo;

    private Integer idUsuario;

    private String nome;

    private LocalDate dataInicio;

    private LocalDate dataFim;

    private String status;

    public PeriodoLetivoResponse(PeriodoLetivo periodoLetivo) {
        this.idPeriodo = periodoLetivo.getIdPeriodo();
        this.idUsuario = periodoLetivo.getIdUsuario();
        this.nome = periodoLetivo.getNome();
        this.dataInicio = periodoLetivo.getDataInicio();
        this.dataFim = periodoLetivo.getDataFim();
        this.status = periodoLetivo.getStatus();
    }

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public String getNome() {
        return nome;
    }

    public LocalDate getDataInicio() {
        return dataInicio;
    }

    public LocalDate getDataFim() {
        return dataFim;
    }

    public String getStatus() {
        return status;
    }
}