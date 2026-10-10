package br.com.studymate.config;

import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .requestCache(cache -> cache.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/register", "/api/auth/verify-email").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .anyRequest().authenticated())
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((req,res,error) -> {
                    res.setStatus(401); res.setHeader("WWW-Authenticate", "Bearer");
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"mensagem\":\"Token ausente, inválido ou expirado. Faça login novamente.\"}");
                })
                .accessDeniedHandler((req,res,error) -> {
                    res.setStatus(403); res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"mensagem\":\"Acesso não permitido.\"}");
                }))
            .oauth2ResourceServer(resource -> resource.jwt(Customizer.withDefaults())
                .authenticationEntryPoint((req,res,error) -> {
                    res.setStatus(401); res.setHeader("WWW-Authenticate", "Bearer");
                    res.setContentType("application/json;charset=UTF-8");
                    res.getWriter().write("{\"mensagem\":\"Token inválido ou expirado. Faça login novamente.\"}");
                }))
            .build();
    }
}
