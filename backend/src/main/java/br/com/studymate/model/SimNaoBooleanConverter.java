package br.com.studymate.model;

import jakarta.persistence.*;

/** Oracle stores the historic read flag as S/N; the public contract remains boolean. */
@Converter
public class SimNaoBooleanConverter implements AttributeConverter<Boolean, String> {
    @Override public String convertToDatabaseColumn(Boolean value) { return Boolean.TRUE.equals(value) ? "S" : "N"; }
    @Override public Boolean convertToEntityAttribute(String value) { return "S".equals(value); }
}
