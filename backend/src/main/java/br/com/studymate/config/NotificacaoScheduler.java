package br.com.studymate.config;

import br.com.studymate.service.NotificacaoService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.notifications.scheduler-enabled", havingValue = "true", matchIfMissing = true)
public class NotificacaoScheduler {
    private final NotificacaoService notificacoes;
    public NotificacaoScheduler(NotificacaoService notificacoes) { this.notificacoes = notificacoes; }
    @Scheduled(fixedDelayString = "${app.notifications.scan-delay-ms:60000}", initialDelayString = "${app.notifications.scan-delay-ms:60000}")
    public void processar() { notificacoes.processarPendentes(); }
}
