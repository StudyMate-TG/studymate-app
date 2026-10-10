package br.com.studymate.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Configuration
public class JwtConfig {
    @Bean
    SecretKey jwtSecretKey(@Value("${security.jwt.secret}") String secret) {
        byte[] bytes = Base64.getDecoder().decode(secret);
        if (bytes.length < 32) {
            throw new IllegalStateException("JWT_SECRET deve conter ao menos 32 bytes aleatorios em Base64.");
        }
        return new SecretKeySpec(bytes, "HmacSHA256");
    }

    @Bean
    JwtEncoder jwtEncoder(SecretKey key) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(key));
    }

    @Bean
    JwtDecoder jwtDecoder(SecretKey key, @Value("${security.jwt.issuer}") String issuer,
                          @Value("${security.jwt.audience}") String audience) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(key)
                .macAlgorithm(MacAlgorithm.HS256).build();
        MappedJwtClaimSetConverter converter = MappedJwtClaimSetConverter.withDefaults(Map.of());
        decoder.setClaimSetConverter(claims -> {
            Map<String, Object> converted = new HashMap<>(converter.convert(claims));
            // Preserve absence instead of accepting a library-generated issued-at value.
            if (claims.get("iat") == null) {
                converted.remove("iat");
            }
            return converted;
        });
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                new JwtTimestampValidator(Duration.ZERO),
                new JwtIssuerValidator(issuer),
                jwt -> validarClaims(jwt, audience)));
        return decoder;
    }

    private OAuth2TokenValidatorResult validarClaims(Jwt jwt, String audience) {
        try {
            int id = Integer.parseInt(jwt.getSubject());
            Instant issuedAt = jwt.getIssuedAt();
            Instant expiresAt = jwt.getExpiresAt();
            if (id > 0 && Integer.toString(id).equals(jwt.getSubject())
                    && jwt.getAudience().contains(audience)
                    && issuedAt != null && expiresAt != null
                    && !issuedAt.isAfter(Instant.now())
                    && expiresAt.isAfter(issuedAt)) {
                return OAuth2TokenValidatorResult.success();
            }
        } catch (RuntimeException ignored) {
            // Malformed claims are an authentication failure.
        }
        return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Claims invalidas", null));
    }
}
