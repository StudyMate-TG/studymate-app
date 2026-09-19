package br.com.studymate.model;

import java.time.LocalDate;

public class PeriodoLetivo {

    private Integer idPeriodo;

    private Integer idUsuario;

    private String nome;

    private LocalDate dataInicio;

    private LocalDate dataFim;

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

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public void setIdPeriodo(Integer idPeriodo) {
        this.idPeriodo = idPeriodo;
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