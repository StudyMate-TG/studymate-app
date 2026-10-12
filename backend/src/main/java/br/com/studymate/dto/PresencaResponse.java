package br.com.studymate.dto;

import java.time.LocalDate;

public record PresencaResponse(Integer idPresenca, Integer idDisciplina,
        String nomeDisciplina, LocalDate dataPresenca, int xpGerado) {}
