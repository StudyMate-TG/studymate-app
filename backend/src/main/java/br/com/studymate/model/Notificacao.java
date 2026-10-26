package br.com.studymate.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;

@Entity
@Table(name = "notificacao", uniqueConstraints = @UniqueConstraint(name = "uk_notificacao_chave", columnNames = "chave_deduplicacao"))
@Getter @Setter @NoArgsConstructor
public class Notificacao {
    @Id @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "notificacao_seq")
    @SequenceGenerator(name = "notificacao_seq", sequenceName = "seq_notificacao", allocationSize = 1)
    @Column(name = "id_notificacao") private Long idNotificacao;
    @Column(name = "id_usuario", nullable = false) private Integer idUsuario;
    @Column(name = "id_disciplina") private Integer idDisciplina;
    @Column(name = "id_tarefa") private Integer idTarefa;
    @Column(name = "id_avaliacao") private Long idAvaliacao;
    @Column(nullable = false, length = 100) private String titulo;
    @Lob @Column(nullable = false) private String mensagem;
    @Column(nullable = false, length = 20) private String tipo;
    @Convert(converter = SimNaoBooleanConverter.class)
    @Column(nullable = false, length = 1) private boolean lida;
    // Compatibility column. All scheduling decisions use the timezone-aware columns below.
    @Column(name = "data_envio", nullable = false) private LocalDateTime dataEnvio;
    @Column(name = "criado_em", nullable = false) private OffsetDateTime criadoEm;
    @Column(name = "previsto_para", nullable = false) private OffsetDateTime previstoPara;
    @Column(name = "processado_em") private OffsetDateTime processadoEm;
    @Column(name = "cancelado_em") private OffsetDateTime canceladoEm;
    @Column(name = "origem_tipo", nullable = false, length = 20) private String origemTipo;
    // Immutable source snapshot: it survives deletion and nulling of foreign keys.
    @Column(name = "origem_id") private Long origemId;
    @Column(name = "chave_deduplicacao", nullable = false, length = 200) private String chaveDeduplicacao;
}
