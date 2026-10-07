package br.com.studymate.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SyncTarefaRequest {
    private String clientTxId;
    private Integer idUsuario;
    private String operation;
    private Integer idTarefa;
    private TarefaRequest tarefa;
}