package br.com.studymate.dto;

import lombok.Getter;

@Getter
public class SyncTarefaResponse {

    private final String clientTxId;
    private final String status;
    private final Integer idTarefa;
    private final boolean alreadyProcessed;

    public SyncTarefaResponse(
            String clientTxId,
            String status,
            Integer idTarefa,
            boolean alreadyProcessed) {

        this.clientTxId = clientTxId;
        this.status = status;
        this.idTarefa = idTarefa;
        this.alreadyProcessed = alreadyProcessed;
    }
}