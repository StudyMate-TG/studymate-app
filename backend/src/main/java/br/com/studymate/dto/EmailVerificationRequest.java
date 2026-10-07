package br.com.studymate.dto;
import jakarta.validation.constraints.*;
public record EmailVerificationRequest(
 @NotBlank @Pattern(regexp="[a-fA-F0-9]{64}") String codigo,
 @NotBlank @Size(min=6,max=72) String senha) {}
