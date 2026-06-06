package br.com.studymate.model;

public class Disciplina {
    private Integer idDisciplina;
    private Integer idPeriodo;
    private String nome;
    private String professor;
    private Double mediaAprovacao;
    private Integer limiteFaltas;

    public Disciplina (){
    }

    public Disciplina (Integer idPeriodo, String nome, String professor){
        this.idPeriodo = idPeriodo;
        this.nome = nome;
        this.professor = professor;
    }

    public void setIdDisciplina (Integer idDisciplina){
        this.idDisciplina = idDisciplina;
    }

    public void setMediaAprovacao (Double mediaAprovacao){
        this.mediaAprovacao = mediaAprovacao;
    }

    public void setLimiteFaltas (Integer limiteFaltas){
        this.limiteFaltas = limiteFaltas;
    }

    public Integer getIdDisciplina() {
        return idDisciplina;
    }

    public Integer getIdPeriodo (){
        return idPeriodo;
    }

    public String getNome () {
        return nome;
    }

    public String getProfessor (){
        return professor;
    }

    public Double getMediaAprovacao (){
        return mediaAprovacao;
    }

    public Integer getLimiteFaltas (){
        return limiteFaltas;
    }
}