package br.com.studymate.dto;

import br.com.studymate.model.Notificacao;
import java.time.OffsetDateTime;

public record NotificacaoResponse(Long idNotificacao, String titulo, String mensagem, String tipo, boolean lida,
        OffsetDateTime criadoEm, OffsetDateTime previstoPara, OffsetDateTime processadoEm,
        Integer idDisciplina, Integer idTarefa, Long idAvaliacao, String origemTipo, Long origemId) {
    public NotificacaoResponse(Notificacao n) {
        this(n.getIdNotificacao(), n.getTitulo(), n.getMensagem(), n.getTipo(), n.isLida(),
                n.getCriadoEm(), n.getPrevistoPara(), n.getProcessadoEm(), n.getIdDisciplina(),
                n.getIdTarefa(), n.getIdAvaliacao(), n.getOrigemTipo(), n.getOrigemId());
    }
}
