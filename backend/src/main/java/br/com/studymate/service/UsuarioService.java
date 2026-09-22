package br.com.studymate.service;

import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.dto.UsuarioUpdateRequest;
import br.com.studymate.exception.EmailEmUsoException;
import br.com.studymate.exception.UsuarioNotFoundException;
import br.com.studymate.model.Usuario;
import br.com.studymate.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Locale;

@Service
@Validated
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    public UsuarioService(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder, JdbcTemplate jdbcTemplate) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listarUsuarios() {
        return usuarioRepository.findAll().stream().map(UsuarioResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public UsuarioResponse listarPorId(@NotNull @Positive Integer id) {
        return new UsuarioResponse(buscarUsuario(id));
    }

    @Transactional
    public UsuarioResponse criar(@NotNull @Valid RegisterRequest request) {
        String email = normalizarEmail(request.getEmail());
        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new EmailEmUsoException();
        }
        if (request.getSenha().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("A senha deve ocupar no máximo 72 bytes em UTF-8.");
        }
        Usuario usuario = new Usuario(request.getNome().trim(), email,
                passwordEncoder.encode(request.getSenha()));
        Usuario salvo = usuarioRepository.saveAndFlush(usuario);
        // O progresso ainda usa JDBC, participando da mesma transacao JPA.
        jdbcTemplate.update("""
                INSERT INTO progresso_estudante
                    (id_usuario, xp_total, nivel, sequencia_atual, maior_sequencia,
                     data_ultimo_dia_sequencia)
                VALUES (?, 0, 1, 0, 0, NULL)
                """, salvo.getIdUsuario());
        return new UsuarioResponse(salvo);
    }

    @Transactional
    public UsuarioResponse atualizar(@NotNull @Positive Integer idUsuario,
                                     @NotNull @Valid UsuarioUpdateRequest request) {
        Usuario usuario = buscarUsuario(idUsuario);
        String email = normalizarEmail(request.getEmail());
        if (usuarioRepository.existsByEmailIgnoreCaseAndIdUsuarioNot(email, idUsuario)) {
            throw new EmailEmUsoException();
        }
        usuario.setNome(request.getNome().trim());
        usuario.setEmail(email);
        usuario.setCurso(textoOpcional(request.getCurso()));
        usuario.setMatricula(textoOpcional(request.getMatricula()));
        usuario.setInstituicao(textoOpcional(request.getInstituicao()));
        return new UsuarioResponse(usuarioRepository.saveAndFlush(usuario));
    }

    private Usuario buscarUsuario(Integer id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new UsuarioNotFoundException(id));
    }

    private String normalizarEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String textoOpcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
