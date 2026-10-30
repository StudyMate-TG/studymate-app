package br.com.studymate.config;

import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class NotificacaoPolicy {
    private final ZoneId zone;
    private final int taskLeadHours;
    private final int eveHour;
    private final int dayHour;
    private final double absenceRatio;
    private final boolean averageEnabled;
    private final int userBatchSize;
    private final int processingBatchSize;

    public NotificacaoPolicy(@Value("${app.notifications.zone:America/Sao_Paulo}") String zone,
            @Value("${app.notifications.task-lead-hours:24}") int taskLeadHours,
            @Value("${app.notifications.evaluation-eve-hour:18}") int eveHour,
            @Value("${app.notifications.evaluation-day-hour:8}") int dayHour,
            @Value("${app.notifications.absence-warning-ratio:0.75}") double absenceRatio,
            @Value("${app.notifications.average-enabled:true}") boolean averageEnabled,
            @Value("${app.notifications.user-batch-size:100}") int userBatchSize,
            @Value("${app.notifications.processing-batch-size:200}") int processingBatchSize) {
        this.zone = ZoneId.of(zone);
        if (taskLeadHours < 1 || taskLeadHours > 168 || eveHour < 0 || eveHour > 23 || dayHour < 0 || dayHour > 23
                || !Double.isFinite(absenceRatio) || absenceRatio <= 0 || absenceRatio >= 1
                || userBatchSize < 1 || userBatchSize > 1000 || processingBatchSize < 1 || processingBatchSize > 1000) {
            throw new IllegalArgumentException("Parâmetros de notificações fora dos limites permitidos.");
        }
        this.taskLeadHours = taskLeadHours; this.eveHour = eveHour; this.dayHour = dayHour;
        this.absenceRatio = absenceRatio; this.averageEnabled = averageEnabled;
        this.userBatchSize = userBatchSize; this.processingBatchSize = processingBatchSize;
    }
    public ZoneId zone() { return zone; }
    public int taskLeadHours() { return taskLeadHours; }
    public int eveHour() { return eveHour; }
    public int dayHour() { return dayHour; }
    public double absenceRatio() { return absenceRatio; }
    public boolean averageEnabled() { return averageEnabled; }
    public int userBatchSize() { return userBatchSize; }
    public int processingBatchSize() { return processingBatchSize; }
}
