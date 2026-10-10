package br.com.studymate.dto;

public record LoginResponse(Integer idUsuario, String nome, String email, String curso,
        String matricula, String instituicao, String token, String tipo, long expiresIn) {
    public LoginResponse(UsuarioResponse usuario, String token, long expiresIn) {
        this(usuario.getIdUsuario(),usuario.getNome(),usuario.getEmail(),usuario.getCurso(),
            usuario.getMatricula(),usuario.getInstituicao(),token,"Bearer",expiresIn);
    }
}
