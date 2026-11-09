package br.com.studymate.dto;

import java.time.LocalDate;

public record PresencaRequest(
        Integer idDisciplina,
        LocalDate dataPresenca,
        Integer quantidadeAulas
) {
    public PresencaRequest(
            Integer idDisciplina,
            LocalDate dataPresenca
    ) {
        this(
                idDisciplina,
                dataPresenca,
                1
        );
    }
}