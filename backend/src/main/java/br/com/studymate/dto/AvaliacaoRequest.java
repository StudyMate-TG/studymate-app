package br.com.studymate.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AvaliacaoRequest(
    @NotNull @Positive Integer idDisciplina,
    @NotBlank @Size(max = 100) String nome,
    @NotBlank @Size(max = 20) String tipo,
    @DecimalMin("0.00") @DecimalMax("10.00") @Digits(integer = 2, fraction = 2) BigDecimal nota,
    @NotNull @DecimalMin(value = "0.00", inclusive = false)
    @DecimalMax("99.99") @Digits(integer = 2, fraction = 2) BigDecimal peso,
    @NotNull LocalDate dataAvaliacao
) {}
