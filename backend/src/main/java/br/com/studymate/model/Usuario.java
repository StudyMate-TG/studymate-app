package br.com.studymate.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "usuario")
public class Usuario {

    // Sequence compartilhada pelo banco para evitar colisao entre cadastros.
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "usuario_seq")
    @SequenceGenerator(name = "usuario_seq", sequenceName = "seq_usuario", allocationSize = 1)
    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario;

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String nome;

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "O email deve ser válido")
    @Size(max = 100)
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @NotBlank(message = "A senha é obrigatória")
    @Size(max = 255)
    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senha;

    @Column(name = "data_criacao", nullable = false, updatable = false)
    private LocalDateTime dataCriacao;

    @Size(max = 100)
    @Column(length = 100)
    private String curso;

    @Size(max = 50)
    @Column(length = 50)
    private String matricula;

    @Size(max = 100)
    @Column(length = 100)
    private String instituicao;

    public Usuario(String nome, String email, String senha) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    @PrePersist
    private void preencherDataCriacao() {
        if (dataCriacao == null) {
            dataCriacao = LocalDateTime.now();
        }
    }
}
