package br.com.studymate.service;

import br.com.studymate.dto.MediaDisciplinaResponse;
import br.com.studymate.model.Avaliacao;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/** Shared weighted-average policy: only corrected evaluations contribute to numerator and denominator. */
public final class MediaPonderada {
    private MediaPonderada() {}
    public static MediaDisciplinaResponse calcular(Integer idDisciplina, List<Avaliacao> lista) {
        BigDecimal soma = BigDecimal.ZERO;
        BigDecimal pesos = BigDecimal.ZERO;
        int corrigidas = 0;
        for (Avaliacao avaliacao : lista) {
            if (avaliacao.getNota() != null && avaliacao.getPeso() != null && avaliacao.getPeso().signum() > 0) {
                soma = soma.add(avaliacao.getNota().multiply(avaliacao.getPeso()));
                pesos = pesos.add(avaliacao.getPeso());
                corrigidas++;
            }
        }
        BigDecimal media = corrigidas == 0 ? null : soma.divide(pesos, 2, RoundingMode.HALF_UP);
        return new MediaDisciplinaResponse(idDisciplina, media, corrigidas, lista.size() - corrigidas);
    }
}
