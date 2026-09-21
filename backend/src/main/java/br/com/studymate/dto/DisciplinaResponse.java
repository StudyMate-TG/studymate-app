package br.com.studymate.dto;

import br.com.studymate.model.Disciplina;

public class DisciplinaResponse {
    private Integer idDisciplina;
    private Integer idPeriodo;
    private String nomePeriodo;
    private String nome;
    private String professor;
    private Double mediaAprovacao;
    private Integer limiteFaltas;

    public DisciplinaResponse(Disciplina disciplina) {
        this(disciplina, disciplina.getNomePeriodo());
    }

    public DisciplinaResponse(Disciplina disciplina, String nomePeriodo) {
        this.idDisciplina = disciplina.getIdDisciplina();
        this.idPeriodo = disciplina.getIdPeriodo();
        this.nomePeriodo = nomePeriodo;
        this.nome = disciplina.getNome();
        this.professor = disciplina.getProfessor();
        this.mediaAprovacao = disciplina.getMediaAprovacao();
        this.limiteFaltas = disciplina.getLimiteFaltas();
    }

    public Integer getIdDisciplina() {
        return idDisciplina;
    }

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public String getNomePeriodo() {
        return nomePeriodo;
    }
    
    public String getNome() {
        return nome;
    }

    public String getProfessor() {
        return professor;
    }

    public Double getMediaAprovacao() {
        return mediaAprovacao;
    }

    public Integer getLimiteFaltas() {
        return limiteFaltas;
    }
}
