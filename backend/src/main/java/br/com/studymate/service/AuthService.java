package br.com.studymate.service;

import br.com.studymate.dao.DaoUsuario;
import br.com.studymate.dto.LoginRequest;
import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.model.Usuario;

import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final DaoUsuario daoUsuario;

    public AuthService(DaoUsuario daoUsuario) {
        this.daoUsuario = daoUsuario;
    }

    public UsuarioResponse cadastrar(RegisterRequest request) {
        validarCadastro(request);

        String nome = request.getNome().trim();
        String email = request.getEmail().trim().toLowerCase();
        String senha = request.getSenha();

        if (daoUsuario.existePorEmail(email)) {
            throw new IllegalArgumentException("Já existe um usuário cadastrado com este e-mail.");
        }

        Usuario usuario = new Usuario(nome, email, senha);

        Usuario usuarioCadastrado = daoUsuario.inserir(usuario);

        return new UsuarioResponse(usuarioCadastrado);
    }

    public UsuarioResponse login(LoginRequest request) {
        validarLogin(request);

        String email = request.getEmail().trim().toLowerCase();
        String senha = request.getSenha();

        Usuario usuario = daoUsuario.consultaPorEmailESenha(email, senha);

        if (usuario == null) {
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }

        return new UsuarioResponse(usuario);
    }

    private void validarCadastro(RegisterRequest request) {
        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new IllegalArgumentException("Preencha o nome corretamente.");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("O e-mail é obrigatório.");
        }

        if (!request.getEmail().contains("@")) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }

        if (request.getSenha() == null || request.getSenha().isBlank()) {
            throw new IllegalArgumentException("Digite uma senha.");
        }

        if (request.getSenha().length() < 6) {
            throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
        }
    }

    private void validarLogin(LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Digite seu e-mail.");
        }

        if (request.getSenha() == null || request.getSenha().isBlank()) {
            throw new IllegalArgumentException("Digite sua senha.");
        }
    }
}