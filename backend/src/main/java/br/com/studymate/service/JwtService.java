package br.com.studymate.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class JwtService {
    private final JwtEncoder encoder;
    private final String issuer;
    private final String audience;
    private final long ttl;

    public JwtService(JwtEncoder encoder, @Value("${security.jwt.issuer}") String issuer,
                      @Value("${security.jwt.audience}") String audience,
                      @Value("${security.jwt.ttl-seconds}") long ttl) {
        if (ttl < 60 || ttl > 86400) {
            throw new IllegalArgumentException("Validade JWT deve estar entre 60 e 86400 segundos.");
        }
        this.encoder = encoder;
        this.issuer = issuer;
        this.audience = audience;
        this.ttl = ttl;
    }

    public String emitir(Integer usuario) {
        if (usuario == null || usuario <= 0) {
            throw new IllegalArgumentException("Informe um usuario valido para emitir o token.");
        }
        Instant agora = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .audience(List.of(audience))
                .subject(usuario.toString())
                .issuedAt(agora)
                .expiresAt(agora.plusSeconds(ttl))
                .id(UUID.randomUUID().toString())
                .build();
        return encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    public long getExpiresIn() {
        return ttl;
    }
}
