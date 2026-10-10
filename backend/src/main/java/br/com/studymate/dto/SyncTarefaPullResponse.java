package br.com.studymate.dto;

import lombok.Getter;

import java.util.List;

@Getter
public class SyncTarefaPullResponse {
    private final List<TarefaResponse> tarefas;
    private final String cursor;
    private final boolean hasMore;

    public SyncTarefaPullResponse(List<TarefaResponse> tarefas, String cursor, boolean hasMore) {
        this.tarefas = tarefas;
        this.cursor = cursor;
        this.hasMore = hasMore;
    }
}
