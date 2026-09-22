package br.com.studymate.service;

import br.com.studymate.dto.LoginRequest;
import br.com.studymate.dto.RegisterRequest;
import br.com.studymate.dto.UsuarioResponse;
import br.com.studymate.model.Usuario;
import br.com.studymate.repository.UsuarioRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@Validated
public class AuthService {
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioService usuarioService, UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder) {
        this.usuarioService = usuarioService;
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UsuarioResponse cadastrar(@NotNull @Valid RegisterRequest request) {
        return usuarioService.criar(request);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse login(@NotNull @Valid LoginRequest request) {
        if (request.getSenha().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }
        Usuario usuario = usuarioRepository
                .findByEmailIgnoreCase(request.getEmail().trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha inválidos."));
        if (!passwordEncoder.matches(request.getSenha(), usuario.getSenha())) {
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }
        return new UsuarioResponse(usuario);
    }
}
