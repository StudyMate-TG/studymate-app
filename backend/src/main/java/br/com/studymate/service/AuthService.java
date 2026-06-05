package br.com.studymate.service;

import br.com.studymate.dao.DaoUsuario;
import br.com.studymate.dto.LoginRequest;
import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.model.Usuario;
import org.springframework.stereotype.Service;

@Service
public class AuthService{
    private final DaoUsuario daoUsuario;

    public AuthService(DaoUsuario daoUsuario){
        this.daoUsuario = daoUsuario;
    }

    public UsuarioResponse cadastrar(RegisterRequest request){
        if (request.getNome() == null || request.getNome().isBlank()){
            throw new IllegalArgumentException("Preencha o nome corretamente.");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()){
            throw new IllegalArgumentException("O email é obrigatório.");
        }

        if (request.getSenha() == null || request.getSenha().isBlank()){
            throw new IllegalArgumentException("Digite uma senha.");
        }

        if (daoUsuario.existePorEmail(request.getEmail())){
            throw new IllegalArgumentException("Já existe um usuário cadastrado com este email.");
        }

            Usuario usuario = new Usuario(request.getNome(), request.getEmail(), request.getSenha());

            Usuario usuarioCadastrado = daoUsuario.inserir(usuario);

            return new UsuarioResponse(usuarioCadastrado);
    }

    public UsuarioResponse login(LoginRequest request){
        if (request.getEmail() == null || request.getEmail().isBlank()){
            throw new IllegalArgumentException("Digite seu email.");
        }

        if (request.getSenha() == null || request.getSenha().isBlank()){
            throw new IllegalArgumentException("Digite sua senha.");
        }

        Usuario usuario = daoUsuario.consultaPorEmailESenha(request.getEmail(), request.getSenha());

        if (usuario == null){
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }

        return new UsuarioResponse(usuario);
    }
}