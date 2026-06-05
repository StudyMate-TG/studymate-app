package br.com.studymate.dto;

public class RegisterRequest{
    private String nome;
    private String email;
    private String senha;

    public RegisterRequest(){

    }
    
    public void setNome(String nome){
        this.nome = nome;
    }

    public void setEmail(String email){
        this.email = email;
    }

    public void setSenha(String senha){
        this.senha = senha;
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
}