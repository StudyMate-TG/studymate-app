package br.com.studymate.controller;

import br.com.studymate.exception.RespostaErroInterno;

import br.com.studymate.dto.PeriodoLetivoRequest;
import br.com.studymate.service.PeriodoLetivoService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Map;

@RestController
@RequestMapping("/api/periodos")
public class PeriodoLetivoController {

    private final PeriodoLetivoService periodoLetivoService;

    public PeriodoLetivoController(PeriodoLetivoService periodoLetivoService) {
        this.periodoLetivoService = periodoLetivoService;
    }

    @GetMapping
    public ResponseEntity<?> listar(@AuthenticationPrincipal Jwt principal) {
        try {
            return ResponseEntity.ok(periodoLetivoService.listar(Integer.valueOf(principal.getSubject())));
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

    @GetMapping("/ativo")
    public ResponseEntity<?> consultarAtivo(@AuthenticationPrincipal Jwt principal) {
        try {
            return ResponseEntity.ok(periodoLetivoService.consultarAtivo(Integer.valueOf(principal.getSubject())));
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

    @GetMapping("/{idPeriodo}")
    public ResponseEntity<?> consultarPorId(
            @PathVariable Integer idPeriodo,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            return ResponseEntity.ok(
                    periodoLetivoService.consultarPorId(idPeriodo, Integer.valueOf(principal.getSubject()))
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
    public ResponseEntity<?> cadastrar(@AuthenticationPrincipal Jwt principal, @RequestBody PeriodoLetivoRequest request) {
        request.setIdUsuario(Integer.valueOf(principal.getSubject()));
        try {
            return ResponseEntity.ok(periodoLetivoService.cadastrar(request));
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

    @PutMapping("/{idPeriodo}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer idPeriodo,
            @AuthenticationPrincipal Jwt principal,
            @RequestBody PeriodoLetivoRequest request
    ) {
        request.setIdUsuario(Integer.valueOf(principal.getSubject()));
        try {
            return ResponseEntity.ok(
                    periodoLetivoService.alterar(idPeriodo, Integer.valueOf(principal.getSubject()), request)
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

    @PutMapping("/{idPeriodo}/ativar")
    public ResponseEntity<?> ativar(
            @PathVariable Integer idPeriodo,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            return ResponseEntity.ok(
                    periodoLetivoService.ativar(idPeriodo, Integer.valueOf(principal.getSubject()))
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

    @DeleteMapping("/{idPeriodo}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer idPeriodo,
            @AuthenticationPrincipal Jwt principal
    ) {
        try {
            periodoLetivoService.excluir(idPeriodo, Integer.valueOf(principal.getSubject()));

            return ResponseEntity.ok(
                    Map.of("mensagem", "Período letivo excluído com sucesso.")
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