package br.com.studymate.controller;

import br.com.studymate.dto.FaltaRequest;
import br.com.studymate.service.FaltaService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(
                    faltaService.listar(idDisciplina, idUsuario)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao listar faltas: " + erro.getMessage()
                    )
            );
        }
    }

    @GetMapping("/total")
    public ResponseEntity<?> total(
            @RequestParam Integer idDisciplina,
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(
                    Map.of(
                            "total",
                            faltaService.totalFaltas(idDisciplina, idUsuario)
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao consultar total de faltas: "
                                    + erro.getMessage()
                    )
            );
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(
            @RequestParam Integer idUsuario,
            @RequestBody FaltaRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    faltaService.cadastrar(idUsuario, request)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao cadastrar falta: "
                                    + erro.getMessage()
                    )
            );
        }
    }

    @PutMapping("/{idFalta}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer idFalta,
            @RequestParam Integer idUsuario,
            @RequestBody FaltaRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    faltaService.alterar(
                            idFalta,
                            idUsuario,
                            request
                    )
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao alterar falta: "
                                    + erro.getMessage()
                    )
            );
        }
    }

    @DeleteMapping("/{idFalta}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer idFalta,
            @RequestParam Integer idUsuario
    ) {
        try {
            faltaService.excluir(idFalta, idUsuario);

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
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of(
                            "mensagem",
                            "Erro interno ao excluir falta: "
                                    + erro.getMessage()
                    )
            );
        }
    }
}