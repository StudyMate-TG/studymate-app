package br.com.studymate.dto;

import jakarta.validation.constraints.*;

public class LoginRequest{
    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 100)
    private String email;
    @NotBlank(message = "A senha é obrigatória.")
    @Size(max = 72)
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
