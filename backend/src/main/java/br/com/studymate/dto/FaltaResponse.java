package br.com.studymate.dto;

import br.com.studymate.model.Falta;

import java.time.LocalDate;

public class FaltaResponse {

    private Integer idFalta;
    private Integer idDisciplina;
    private LocalDate dataFalta;
    private Integer quantidadeAulas;

    public FaltaResponse(Falta falta) {
        this.idFalta = falta.getIdFalta();
        this.idDisciplina = falta.getIdDisciplina();
        this.dataFalta = falta.getDataFalta();
        this.quantidadeAulas = falta.getQuantidadeAulas();
    }

    public Integer getIdFalta() {
        return idFalta;
    }

    public Integer getIdDisciplina() {
        return idDisciplina;
    }

    public LocalDate getDataFalta() {
        return dataFalta;
    }

    public Integer getQuantidadeAulas() {
        return quantidadeAulas;
    }
}