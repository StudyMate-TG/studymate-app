package br.com.studymate.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;

import java.util.Map;

/** Keeps unexpected exception details in server logs, never in API responses. */
public final class RespostaErroInterno {
    private static final Logger log = LoggerFactory.getLogger(RespostaErroInterno.class);

    private RespostaErroInterno() {
    }

    public static ResponseEntity<Map<String, String>> responder(Exception erro) {
        log.error("Erro interno ao processar a solicitação", erro);
        return ResponseEntity.internalServerError().body(
                Map.of("mensagem", "Erro interno ao processar a solicitação.")
        );
    }
}