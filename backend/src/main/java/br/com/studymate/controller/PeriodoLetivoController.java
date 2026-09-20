package br.com.studymate.controller;

import br.com.studymate.dto.PeriodoLetivoRequest;
import br.com.studymate.service.PeriodoLetivoService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/periodos")
public class PeriodoLetivoController {

    private final PeriodoLetivoService periodoLetivoService;

    public PeriodoLetivoController(PeriodoLetivoService periodoLetivoService) {
        this.periodoLetivoService = periodoLetivoService;
    }

    @GetMapping
    public ResponseEntity<?> listar(@RequestParam Integer idUsuario) {
        try {
            return ResponseEntity.ok(periodoLetivoService.listar(idUsuario));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao listar períodos: " + erro.getMessage())
            );
        }
    }

    @GetMapping("/ativo")
    public ResponseEntity<?> consultarAtivo(@RequestParam Integer idUsuario) {
        try {
            return ResponseEntity.ok(periodoLetivoService.consultarAtivo(idUsuario));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao consultar período ativo: " + erro.getMessage())
            );
        }
    }

    @GetMapping("/{idPeriodo}")
    public ResponseEntity<?> consultarPorId(
            @PathVariable Integer idPeriodo,
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(
                    periodoLetivoService.consultarPorId(idPeriodo, idUsuario)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao consultar período: " + erro.getMessage())
            );
        }
    }

    @PostMapping
    public ResponseEntity<?> cadastrar(@RequestBody PeriodoLetivoRequest request) {
        try {
            return ResponseEntity.ok(periodoLetivoService.cadastrar(request));
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao cadastrar período: " + erro.getMessage())
            );
        }
    }

    @PutMapping("/{idPeriodo}")
    public ResponseEntity<?> alterar(
            @PathVariable Integer idPeriodo,
            @RequestParam Integer idUsuario,
            @RequestBody PeriodoLetivoRequest request
    ) {
        try {
            return ResponseEntity.ok(
                    periodoLetivoService.alterar(idPeriodo, idUsuario, request)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao alterar período: " + erro.getMessage())
            );
        }
    }

    @PutMapping("/{idPeriodo}/ativar")
    public ResponseEntity<?> ativar(
            @PathVariable Integer idPeriodo,
            @RequestParam Integer idUsuario
    ) {
        try {
            return ResponseEntity.ok(
                    periodoLetivoService.ativar(idPeriodo, idUsuario)
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao ativar período: " + erro.getMessage())
            );
        }
    }

    @DeleteMapping("/{idPeriodo}")
    public ResponseEntity<?> excluir(
            @PathVariable Integer idPeriodo,
            @RequestParam Integer idUsuario
    ) {
        try {
            periodoLetivoService.excluir(idPeriodo, idUsuario);

            return ResponseEntity.ok(
                    Map.of("mensagem", "Período letivo excluído com sucesso.")
            );
        } catch (IllegalArgumentException erro) {
            return ResponseEntity.badRequest().body(
                    Map.of("mensagem", erro.getMessage())
            );
        } catch (Exception erro) {
            erro.printStackTrace();

            return ResponseEntity.internalServerError().body(
                    Map.of("mensagem", "Erro interno ao excluir período: " + erro.getMessage())
            );
        }
    }
}