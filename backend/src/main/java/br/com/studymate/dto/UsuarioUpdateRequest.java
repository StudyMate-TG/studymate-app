package br.com.studymate.dto;

import jakarta.validation.constraints.*;

public class UsuarioUpdateRequest {
    @NotBlank(message = "O nome é obrigatório.")
    @Size(max = 100)
    private String nome;
    @NotBlank(message = "O e-mail é obrigatório.")
    @Email(message = "Informe um e-mail válido.")
    @Size(max = 100)
    private String email;
    @Size(max = 100)
    private String curso;
    @Size(max = 50)
    private String matricula;
    @Size(max = 100)
    private String instituicao;

    public UsuarioUpdateRequest() {
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCurso() {
        return curso;
    }

    public void setCurso(String curso) {
        this.curso = curso;
    }

    public String getMatricula() {
        return matricula;
    }

    public void setMatricula(String matricula) {
        this.matricula = matricula;
    }

    public String getInstituicao() {
        return instituicao;
    }

    public void setInstituicao(String instituicao) {
        this.instituicao = instituicao;
    }
}
