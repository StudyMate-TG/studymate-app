package br.com.studymate.dto;

import br.com.studymate.model.Usuario;

public class UsuarioResponse{
    private Integer idUsuario;
    private String nome;
    private String email;
    private String curso;
    private String semestre;
    private String matricula;
    private String instituicao;

    public UsuarioResponse(Usuario usuario){
        this.idUsuario = usuario.getIdUsuario();
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.curso = usuario.getCurso();
        this.semestre = usuario.getSemestre();
        this.matricula = usuario.getMatricula();
        this.instituicao = usuario.getInstituicao();
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