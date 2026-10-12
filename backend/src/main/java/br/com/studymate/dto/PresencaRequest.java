package br.com.studymate.dto;

import java.time.LocalDate;

public record PresencaRequest(Integer idDisciplina, LocalDate dataPresenca) {}
