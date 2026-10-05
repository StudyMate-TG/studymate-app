package br.com.studymate.dto;

import br.com.studymate.model.Avaliacao;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoResponse(Long idAvaliacao, Integer idDisciplina, String nome,
        String tipo, BigDecimal nota, BigDecimal peso, LocalDate dataAvaliacao) {
    public AvaliacaoResponse(Avaliacao avaliacao) {
        this(avaliacao.getIdAvaliacao(), avaliacao.getIdDisciplina(), avaliacao.getNome(),
             avaliacao.getTipo(), avaliacao.getNota(), avaliacao.getPeso(), avaliacao.getDataAvaliacao());
    }
}
