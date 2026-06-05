package br.com.studymate.dto;

public class LoginRequest{
    private String email;
    private String senha;

    public LoginRequest(){
    }

    public void setEmail(String email){
        this.email = email;
    }

    public void setSenha(String senha){
        this.senha = senha;
    }

    public String getEmail(){
        return email;
    }

    public String getSenha(){
        return senha;
    }
}