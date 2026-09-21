package br.com.studymate.dto;

import jakarta.validation.constraints.*;

public class RegisterRequest{
    @NotBlank(message = "O nome é obrigatório.")
    @Size(max = 100)
    private String nome;
    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 100)
    private String email;
    @NotBlank(message = "A senha é obrigatória.")
    @Size(min = 6, max = 72, message = "A senha deve ter entre 6 e 72 caracteres.")
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
