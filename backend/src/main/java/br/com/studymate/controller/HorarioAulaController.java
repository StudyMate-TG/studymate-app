package br.com.studymate.controller;

import br.com.studymate.dto.HorarioAulaRequest;
import br.com.studymate.exception.RespostaErroInterno;
import br.com.studymate.service.HorarioAulaService;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/horarios-aula")
public class HorarioAulaController {

    private final HorarioAulaService horarioAulaService;

    public HorarioAulaController(
            HorarioAulaService horarioAulaService
    ) {
        this.horarioAulaService = horarioAulaService;
    }

    @GetMapping
    public ResponseEntity<?> listar(
            @AuthenticationPrincipal Jwt principal,
            @RequestParam(required = false)
            Integer idDisciplina
    ) {
        try {
            Integer idUsuario =
                    Integer.valueOf(principal.getSubject());

            return ResponseEntity.ok(
                    horarioAulaService.listar(
                            idUsuario,
                            idDisciplina
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "mensagem",
                            erro.getMessage()
                    )
            );
        } catch (
                org.springframework.security.access.AccessDeniedException erro
        ) {
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
            return ResponseEntity.ok(
                    horarioAulaService.consultarPorId(
                            id,
                            Integer.valueOf(
                                    principal.getSubject()
                            )
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "mensagem",
                            erro.getMessage()
                    )
            );
        } catch (
                org.springframework.security.access.AccessDeniedException erro
        ) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(
            @AuthenticationPrincipal Jwt principal,
            @RequestBody HorarioAulaRequest request
    ) {
        request.setIdUsuario(
                Integer.valueOf(principal.getSubject())
        );

        try {
            return ResponseEntity.ok(
                    horarioAulaService.cadastrar(request)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "mensagem",
                            erro.getMessage()
                    )
            );
        } catch (
                org.springframework.security.access.AccessDeniedException erro
        ) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer id,
            @AuthenticationPrincipal Jwt principal,
            @RequestBody HorarioAulaRequest request
    ) {
        Integer idUsuario =
                Integer.valueOf(principal.getSubject());

        request.setIdUsuario(idUsuario);

        try {
            return ResponseEntity.ok(
                    horarioAulaService.alterar(
                            id,
                            idUsuario,
                            request
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "mensagem",
                            erro.getMessage()
                    )
            );
        } catch (
                org.springframework.security.access.AccessDeniedException erro
        ) {
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
            horarioAulaService.excluir(
                    id,
                    Integer.valueOf(
                            principal.getSubject()
                    )
            );

            return ResponseEntity.ok(
                    Map.of(
                            "mensagem",
                            "Horário de aula excluído com sucesso."
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "mensagem",
                            erro.getMessage()
                    )
            );
        } catch (
                org.springframework.security.access.AccessDeniedException erro
        ) {
            throw erro;
        } catch (Exception erro) {
            return RespostaErroInterno.responder(erro);
        }
    }
}