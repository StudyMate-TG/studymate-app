package br.com.studymate.dto;

import java.math.BigDecimal;

// Media nula quando nao ha notas; somente avaliacoes com nota entram na soma dos pesos.
public record MediaDisciplinaResponse(Integer idDisciplina, BigDecimal media,
        int avaliacoesComNota, int avaliacoesPendentes) {}
