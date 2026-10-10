package br.com.studymate.service;

import br.com.studymate.dto.SyncTarefaPullResponse;
import br.com.studymate.dto.SyncTarefaRequest;
import br.com.studymate.dto.SyncTarefaResponse;
import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.dto.TarefaResponse;
import br.com.studymate.model.SyncRequest;
import br.com.studymate.repository.SyncRequestRepository;
import br.com.studymate.repository.TarefaRepository;
import br.com.studymate.repository.UsuarioRepository;
import jakarta.persistence.EntityManager;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
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
    private final UsuarioRepository usuarioRepository;
    private final int maxDescription;
    private final EntityManager entityManager;
    private static final int PAGE_SIZE = 50;

    public SyncService(
            SyncRequestRepository syncRequestRepository,
            TarefaRepository tarefaRepository,
            TarefaService tarefaService,
            UsuarioRepository usuarioRepository,
            EntityManager entityManager,
            @Value("${app.tasks.max-description:4096}") int maxDescription) {

        this.syncRequestRepository = syncRequestRepository;
        this.tarefaRepository = tarefaRepository;
        this.tarefaService = tarefaService;
        this.usuarioRepository = usuarioRepository;
        this.maxDescription = maxDescription;
        this.entityManager = entityManager;
    }

    @Transactional
    @PreAuthorize("#request != null and #request.idUsuario != null and #request.idUsuario.toString() == authentication.name")
    public SyncTarefaResponse sincronizarTarefa(
            SyncTarefaRequest request) {

        validarRequest(request);
        // Serializa tambem a verificacao de idempotencia, antes de alterar a tarefa.
        usuarioRepository.buscarParaAtualizacao(request.getIdUsuario())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

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

                throw new DataIntegrityViolationException(
                        "O identificador da operação já foi utilizado para outra entidade."
                );
            }

            String operationRecebida =
                    request.getOperation()
                            .trim()
                            .toUpperCase(Locale.ROOT);

            if (!existente.getOperation()
                    .equalsIgnoreCase(operationRecebida)) {

                throw new DataIntegrityViolationException(
                        "O identificador da operação já foi utilizado para outra operação."
                );
            }

            if (!"CREATE".equalsIgnoreCase(operationRecebida)
                    && request.getIdTarefa() != null
                    && !request.getIdTarefa()
                            .equals(existente.getResponseResourceId())) {

                throw new DataIntegrityViolationException(
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

        // A PK global nunca pode ser reutilizada para substituir a operacao de outro usuario.
        if (syncRequestRepository.existsById(request.getClientTxId())) {
            throw new DataIntegrityViolationException("Identificador da operação já utilizado.");
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

        // Identificador atribuido pelo cliente: persist garante INSERT, em vez do merge
        // que poderia substituir uma PK existente numa corrida entre usuarios.
        entityManager.persist(syncRequest);
        syncRequestRepository.flush();

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
    @PreAuthorize("#idUsuario != null and #idUsuario.toString() == authentication.name")
    public SyncTarefaPullResponse buscarAlteracoesTarefas(Integer idUsuario, String cursor) {
        validarIdUsuario(idUsuario);
        PullCursor janela = decodificarCursor(cursor);
        if (tarefaRepository.maiorDescricaoPorUsuario(idUsuario) > maxDescription) {
            throw new IllegalArgumentException(
                    "Há tarefas com descrição acima do limite. Edite ou exclua essas tarefas antes de sincronizar.");
        }
        List<TarefaResponse> pagina = tarefaRepository.listarAlteracoesPaginadas(
                idUsuario, janela.since(), janela.until(), janela.afterAt(), janela.afterId(),
                PageRequest.of(0, PAGE_SIZE + 1));
        boolean hasMore = pagina.size() > PAGE_SIZE;
        List<TarefaResponse> tarefas = List.copyOf(pagina.subList(0, Math.min(PAGE_SIZE, pagina.size())));
        String proximoCursor;
        if (hasMore) {
            TarefaResponse ultima = tarefas.get(tarefas.size() - 1);
            proximoCursor = codificarCursor("v1|"
                    + (janela.since() == null ? "" : janela.since()) + "|"
                    + janela.until() + "|" + ultima.getUpdatedAt() + "|" + ultima.getIdTarefa());
        } else {
            proximoCursor = codificarCursor(janela.until().toString());
        }
        return new SyncTarefaPullResponse(tarefas, proximoCursor, hasMore);
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
            String canonical = UUID.fromString(request.getClientTxId()).toString();
            if (!canonical.equalsIgnoreCase(request.getClientTxId())) {
                throw new IllegalArgumentException("UUID não canônico.");
            }
            request.setClientTxId(canonical);

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
                || !List.of(
                        "CREATE",
                        "UPDATE",
                        "DELETE",
                        "COMPLETE",
                        "REOPEN"
                ).contains(
                        request.getOperation()
                                .trim()
                                .toUpperCase(Locale.ROOT))) {

        throw new IllegalArgumentException(
                "A operação é obrigatória ou inválida."
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

    private String codificarCursor(String valor) {
        return Base64.getUrlEncoder().withoutPadding()
                .encodeToString(valor.getBytes(StandardCharsets.UTF_8));
    }

    private record PullCursor(OffsetDateTime since, OffsetDateTime until,
                              OffsetDateTime afterAt, Integer afterId) {}

    private PullCursor decodificarCursor(String cursor) {
        OffsetDateTime agora = OffsetDateTime.now();
        if (cursor == null || cursor.isBlank()) {
            return new PullCursor(null, agora, null, null);
        }
        if (cursor.length() > 512) {
            throw new IllegalArgumentException("Cursor de sincronização inválido.");
        }
        try {
            String valor = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            if (!valor.startsWith("v1|")) {
                OffsetDateTime since = OffsetDateTime.parse(valor);
                if (since.isAfter(agora)) throw new IllegalArgumentException();
                return new PullCursor(since, agora, null, null);
            }
            String[] partes = valor.split("\\|", -1);
            if (partes.length != 5) throw new IllegalArgumentException();
            OffsetDateTime since = partes[1].isEmpty() ? null : OffsetDateTime.parse(partes[1]);
            OffsetDateTime until = OffsetDateTime.parse(partes[2]);
            OffsetDateTime afterAt = OffsetDateTime.parse(partes[3]);
            int afterId = Integer.parseInt(partes[4]);
            if (until.isAfter(agora) || afterAt.isAfter(until) || afterId <= 0
                    || (since != null && (!since.isBefore(until) || !afterAt.isAfter(since)))) {
                throw new IllegalArgumentException();
            }
            return new PullCursor(since, until, afterAt, afterId);
        } catch (IllegalArgumentException | java.time.DateTimeException erro) {
            throw new IllegalArgumentException("Cursor de sincronização inválido.");
        }
    }
}
