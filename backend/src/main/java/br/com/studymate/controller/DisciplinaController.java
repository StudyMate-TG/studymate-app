package br.com.studymate.controller;

import br.com.studymate.exception.RespostaErroInterno;

import br.com.studymate.dto.DisciplinaRequest;
import br.com.studymate.service.DisciplinaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Map;

@RestController
@RequestMapping("/api/disciplinas")
public class DisciplinaController {

    private final DisciplinaService disciplinaService;

    public DisciplinaController(DisciplinaService disciplinaService) {
        this.disciplinaService = disciplinaService;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(required = false) String termo
    ) {
        try {
            return ResponseEntity.ok(disciplinaService.listar(Integer.valueOf(principal.getSubject()), termo));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> consultarPorId(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            return ResponseEntity.ok(disciplinaService.consultarPorId(id, Integer.valueOf(principal.getSubject())));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@AuthenticationPrincipal Jwt principal, @RequestBody DisciplinaRequest request) {
        request.setIdUsuario(Integer.valueOf(principal.getSubject()));
        try {
            return ResponseEntity.ok(disciplinaService.cadastrar(request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal,
            @RequestBody DisciplinaRequest request
    ) {
        request.setIdUsuario(Integer.valueOf(principal.getSubject()));
        try {
            return ResponseEntity.ok(disciplinaService.alterar(id, Integer.valueOf(principal.getSubject()), request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            disciplinaService.excluir(id, Integer.valueOf(principal.getSubject()));

            return ResponseEntity.ok(
                    Map.of("mensagem", "Disciplina excluída com sucesso.")
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (org.springframework.security.access.AccessDeniedException erro) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }
}