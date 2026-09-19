package br.com.studymate.service;

import br.com.studymate.dao.DaoUsuario;
import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.dto.UsuarioUpdateRequest;
import br.com.studymate.model.Usuario;

import org.springframework.stereotype.Service;

@Service
public class UsuarioService {

    private final DaoUsuario daoUsuario;

    public UsuarioService(DaoUsuario daoUsuario) {
        this.daoUsuario = daoUsuario;
    }

    public UsuarioResponse atualizar(Integer idUsuario, UsuarioUpdateRequest request) {
        validarIdUsuario(idUsuario);
        validarRequest(request);

        Usuario usuarioExistente = daoUsuario.consultarPorId(idUsuario);

        if (usuarioExistente == null) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }

        String nome = request.getNome().trim();
        String email = request.getEmail().trim().toLowerCase();

        if (daoUsuario.existePorEmailEmOutroUsuario(email, idUsuario)) {
            throw new IllegalArgumentException("Já existe outro usuário cadastrado com este e-mail.");
        }

        String curso = tratarTextoOpcional(request.getCurso());
        String matricula = tratarTextoOpcional(request.getMatricula());
        String instituicao = tratarTextoOpcional(request.getInstituicao());

        Usuario usuarioAtualizado = daoUsuario.atualizar(
                idUsuario,
                nome,
                email,
                curso,
                matricula,
                instituicao
        );

        return new UsuarioResponse(usuarioAtualizado);
    }

    private void validarIdUsuario(Integer idUsuario) {
        if (idUsuario == null) {
            throw new IllegalArgumentException("O usuário é obrigatório.");
        }

        if (idUsuario <= 0) {
            throw new IllegalArgumentException("O usuário informado é inválido.");
        }
    }

    private void validarRequest(UsuarioUpdateRequest request) {
        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome é obrigatório.");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("O e-mail é obrigatório.");
        }

        if (!request.getEmail().contains("@")) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }
    }

    private String tratarTextoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }

        return valor.trim();
    }
}