package br.com.studymate.service;

import br.com.studymate.dto.SyncTarefaPullResponse;
import br.com.studymate.dto.SyncTarefaRequest;
import br.com.studymate.dto.SyncTarefaResponse;
import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.dto.TarefaResponse;
import br.com.studymate.model.SyncRequest;
import br.com.studymate.repository.SyncRequestRepository;
import br.com.studymate.repository.TarefaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class SyncService {

    private final SyncRequestRepository syncRequestRepository;
    private final TarefaRepository tarefaRepository;
    private final TarefaService tarefaService;

    public SyncService(
            SyncRequestRepository syncRequestRepository,
            TarefaRepository tarefaRepository,
            TarefaService tarefaService) {

        this.syncRequestRepository = syncRequestRepository;
        this.tarefaRepository = tarefaRepository;
        this.tarefaService = tarefaService;
    }

    @Transactional
    public SyncTarefaResponse sincronizarTarefa(
            SyncTarefaRequest request) {

        validarRequest(request);

        /*
         * Antes de executar qualquer alteração, verifica se
         * esse comando já foi processado anteriormente.
         */
        SyncRequest existente =
                syncRequestRepository
                        .findByClientTxIdAndIdUsuario(
                                request.getClientTxId(),
                                request.getIdUsuario()
                        )
                        .orElse(null);

        if (existente != null) {

            if (!"TAREFA".equalsIgnoreCase(
                    existente.getEntityType())) {

                throw new IllegalArgumentException(
                        "O identificador da operação já foi utilizado para outra entidade."
                );
            }

            String operationRecebida =
                    request.getOperation()
                            .trim()
                            .toUpperCase(Locale.ROOT);

            if (!existente.getOperation()
                    .equalsIgnoreCase(operationRecebida)) {

                throw new IllegalArgumentException(
                        "O identificador da operação já foi utilizado para outra operação."
                );
            }

            if (!"CREATE".equalsIgnoreCase(operationRecebida)
                    && request.getIdTarefa() != null
                    && !request.getIdTarefa()
                            .equals(existente.getResponseResourceId())) {

                throw new IllegalArgumentException(
                        "O identificador da operação já foi utilizado para outra tarefa."
                );
            }

            return new SyncTarefaResponse(
                    existente.getClientTxId(),
                    "SYNCED",
                    existente.getResponseResourceId(),
                    true
            );
        }

        String operation =
                request.getOperation()
                        .trim()
                        .toUpperCase(Locale.ROOT);

        Integer idTarefa;

        switch (operation) {

    case "CREATE" ->
            idTarefa = criar(request);

    case "UPDATE" ->
            idTarefa = alterar(request);

    case "COMPLETE" ->
            idTarefa = concluir(request);

    case "REOPEN" ->
        idTarefa = reabrir(request);

    case "DELETE" -> {
        excluir(request);
        idTarefa = request.getIdTarefa();
    }

    default ->
            throw new IllegalArgumentException(
                    "Operação de sincronização inválida."
            );
}

        SyncRequest syncRequest =
                new SyncRequest(
                        request.getClientTxId(),
                        request.getIdUsuario(),
                        "TAREFA",
                        operation,
                        idTarefa
                );

        syncRequestRepository.saveAndFlush(syncRequest);

        return new SyncTarefaResponse(
                request.getClientTxId(),
                "SYNCED",
                idTarefa,
                false
        );
    }

    /*
     * Retorna as alterações ocorridas no servidor desde
     * o último cursor recebido pelo cliente.
     */
    @Transactional(readOnly = true)
    public SyncTarefaPullResponse buscarAlteracoesTarefas(
            Integer idUsuario,
            String cursor) {

        validarIdUsuario(idUsuario);

        OffsetDateTime since =
                decodificarCursor(cursor);

        /*
         * Define o limite desta sincronização antes da consulta.
         * Alterações posteriores a esse momento ficam para
         * o próximo pull.
         */
        OffsetDateTime until =
                OffsetDateTime.now();

        List<TarefaResponse> tarefas;

        if (since == null) {

            /*
             * Primeira sincronização:
             * retorna todos os registros existentes até agora.
             */
            tarefas =
                    tarefaRepository.listarAlteracoesAte(
                            idUsuario,
                            until
                    );

        } else {

            /*
             * Próximas sincronizações:
             * retorna apenas o delta.
             */
            tarefas =
                    tarefaRepository.listarAlteracoesEntre(
                            idUsuario,
                            since,
                            until
                    );
        }

        return new SyncTarefaPullResponse(
                tarefas,
                codificarCursor(until)
        );
    }

    private Integer criar(
            SyncTarefaRequest request) {

        if (request.getTarefa() == null) {
            throw new IllegalArgumentException(
                    "Os dados da tarefa são obrigatórios para CREATE."
            );
        }

        validarUsuarioPayload(request);

        TarefaResponse response =
                tarefaService.cadastrar(
                        request.getTarefa()
                );

        return response.getIdTarefa();
    }

    private Integer alterar(
            SyncTarefaRequest request) {

        validarIdTarefa(request);

        if (request.getTarefa() == null) {
            throw new IllegalArgumentException(
                    "Os dados da tarefa são obrigatórios para UPDATE."
            );
        }

        validarUsuarioPayload(request);

        TarefaResponse response =
                tarefaService.alterar(
                        request.getIdTarefa(),
                        request.getIdUsuario(),
                        request.getTarefa()
                );

        return response.getIdTarefa();
    }

    private Integer concluir(
                SyncTarefaRequest request) {

        validarIdTarefa(request);

        TarefaResponse response =
                tarefaService.concluir(
                        request.getIdTarefa(),
                        request.getIdUsuario()
                );

        return response.getIdTarefa();
        }

    private Integer reabrir(
                SyncTarefaRequest request) {

        validarIdTarefa(request);

        TarefaResponse response =
                tarefaService.reabrir(
                        request.getIdTarefa(),
                        request.getIdUsuario()
                );

        return response.getIdTarefa();
        }

    private void excluir(
            SyncTarefaRequest request) {

        validarIdTarefa(request);

        tarefaService.excluir(
                request.getIdTarefa(),
                request.getIdUsuario()
        );
    }

    private void validarUsuarioPayload(
            SyncTarefaRequest request) {

        TarefaRequest tarefa =
                request.getTarefa();

        if (tarefa.getIdUsuario() == null) {

            tarefa.setIdUsuario(
                    request.getIdUsuario()
            );

            return;
        }

        if (!request.getIdUsuario()
                .equals(tarefa.getIdUsuario())) {

            throw new IllegalArgumentException(
                    "Usuário da sincronização e usuário da tarefa são diferentes."
            );
        }
    }

    private void validarIdTarefa(
            SyncTarefaRequest request) {

        if (request.getIdTarefa() == null
                || request.getIdTarefa() <= 0) {

            throw new IllegalArgumentException(
                    "A tarefa é obrigatória para esta operação."
            );
        }
    }

    private void validarRequest(
            SyncTarefaRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Informe os dados da sincronização."
            );
        }

        if (request.getClientTxId() == null
                || request.getClientTxId().isBlank()) {

            throw new IllegalArgumentException(
                    "O identificador da operação é obrigatório."
            );
        }

        try {
            UUID.fromString(
                    request.getClientTxId()
            );

        } catch (IllegalArgumentException exception) {

            throw new IllegalArgumentException(
                    "O identificador da operação deve ser um UUID válido."
            );
        }

        if (request.getIdUsuario() == null
                || request.getIdUsuario() <= 0) {

            throw new IllegalArgumentException(
                    "O usuário é obrigatório."
            );
        }

        if (request.getOperation() == null
                || request.getOperation().isBlank()) {

            throw new IllegalArgumentException(
                    "A operação é obrigatória."
            );
        }
    }

    private void validarIdUsuario(
            Integer idUsuario) {

        if (idUsuario == null || idUsuario <= 0) {

            throw new IllegalArgumentException(
                    "O usuário é obrigatório."
            );
        }
    }

    private String codificarCursor(
            OffsetDateTime dataHora) {

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(
                        dataHora.toString()
                                .getBytes(StandardCharsets.UTF_8)
                );
    }

    private OffsetDateTime decodificarCursor(
            String cursor) {

        if (cursor == null || cursor.isBlank()) {
            return null;
        }

        try {

            String valor =
                    new String(
                            Base64.getUrlDecoder()
                                    .decode(cursor),
                            StandardCharsets.UTF_8
                    );

            return OffsetDateTime.parse(valor);

        } catch (Exception exception) {

            throw new IllegalArgumentException(
                    "Cursor de sincronização inválido."
            );
        }
    }
}