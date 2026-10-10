package br.com.studymate.controller;

import br.com.studymate.exception.RespostaErroInterno;

import br.com.studymate.dto.FaltaRequest;
import br.com.studymate.service.FaltaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Map;

@RestController
@RequestMapping("/api/faltas")
public class FaltaController {

    private final FaltaService faltaService;

    public FaltaController(FaltaService faltaService) {
        this.faltaService = faltaService;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @RequestParam Integer idDisciplina,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            return ResponseEntity.ok(
                    faltaService.listar(idDisciplina, Integer.valueOf(principal.getSubject()))
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

    @GetMapping("/total")
    public ResponseEntity<?> total(
            @RequestParam Integer idDisciplina,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            return ResponseEntity.ok(
                    Map.of(
                            "total",
                            faltaService.totalFaltas(idDisciplina, Integer.valueOf(principal.getSubject()))
                    )
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

    @PostMapping
    public ResponseEntity<?> cadastrar(
            @AuthenticationPrincipal Jwt principal,
            @RequestBody FaltaRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    faltaService.cadastrar(Integer.valueOf(principal.getSubject()), request)
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

    @PutMapping("/{idFalta}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer idFalta,
            @AuthenticationPrincipal Jwt principal,
            @RequestBody FaltaRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    faltaService.alterar(
                            idFalta,
                            Integer.valueOf(principal.getSubject()),
                            request
                    )
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

    @DeleteMapping("/{idFalta}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer idFalta,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            faltaService.excluir(idFalta, Integer.valueOf(principal.getSubject()));

            return ResponseEntity.ok(
                    Map.of(
                            "mensagem",
                            "Falta excluída com sucesso."
                    )
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