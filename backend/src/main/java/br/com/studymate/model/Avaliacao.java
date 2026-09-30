package br.com.studymate.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "avaliacao")
@Getter
@Setter
@NoArgsConstructor
public class Avaliacao {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "avaliacao_seq")
    @SequenceGenerator(name = "avaliacao_seq", sequenceName = "seq_avaliacao", allocationSize = 1)
    @Column(name = "id_avaliacao")
    private Long idAvaliacao;
    @Column(name = "id_disciplina", nullable = false)
    private Integer idDisciplina;
    @Column(nullable = false, length = 100)
    private String nome;
    @Column(nullable = false, length = 20)
    private String tipo;
    @Column(precision = 4, scale = 2)
    private BigDecimal nota;
    @Column(nullable = false, precision = 4, scale = 2)
    private BigDecimal peso;
    @Column(name = "data_avaliacao", nullable = false)
    private LocalDate dataAvaliacao;
}
