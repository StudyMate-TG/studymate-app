package br.com.studymate.model;

import java.time.LocalDateTime;

public class Usuario{
    private Integer idUsuario;
    private String nome;
    private String email;
    private String senha;
    private LocalDateTime dataCriacao;
    private String curso;
    private String semestre;
    private String matricula;
    private String instituicao;


    public Usuario(String nome, String email, String senha){
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    public void setIdUsuario(Integer idUsuario){
        this.idUsuario = idUsuario;
    }

    public void setDataCriacao(LocalDateTime dataCriacao){
        this.dataCriacao = dataCriacao;
    }

    public void setCurso (String curso){
        this.curso = curso;
    }

    public void setSemestre(String semestre){
        this.semestre = semestre;
    }

    public void setMatricula(String matricula){
        this.matricula = matricula;
    }

    public void setInstituicao(String instituicao){
        this.instituicao = instituicao;
    }

    public Integer getIdUsuario(){
        return idUsuario;
    }

    public String getNome(){
        return nome;
    }

    public String getEmail(){
        return email;
    }

    public String getSenha(){
        return senha;
    }

    public LocalDateTime getDataCriacao(){
        return dataCriacao;
    }

    public String getCurso(){
        return curso;
    }
    
    public String getSemestre(){
        return semestre;
    }

    public String getMatricula(){
        return matricula;
    }

    public String getInstituicao(){
        return instituicao;
    }
}