package br.com.studymate.dto;

public class DisciplinaRequest {
    private Integer idPeriodo;
    private String nome;
    private String professor;
    private Double mediaAprovacao;
    private Integer limiteFaltas;

    public DisciplinaRequest() {
    }

    public Integer getIdPeriodo() {
        return idPeriodo;
    }

    public void setIdPeriodo(Integer idPeriodo) {
        this.idPeriodo = idPeriodo;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }
    
    public String getProfessor() {
        return professor;
    }

    public void setProfessor(String professor) {
        this.professor = professor;
    }

    public Double getMediaAprovacao() {
        return mediaAprovacao;
    }

    public void setMediaAprovacao(Double mediaAprovacao) {
        this.mediaAprovacao = mediaAprovacao;
    }

    public Integer getLimiteFaltas() {
        return limiteFaltas;
    }

    public void setLimiteFaltas(Integer limiteFaltas) {
        this.limiteFaltas = limiteFaltas;
    }
}