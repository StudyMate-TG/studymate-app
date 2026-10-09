package br.com.studymate.service;

import br.com.studymate.dto.TarefaRequest;
import br.com.studymate.dto.TarefaResponse;
import br.com.studymate.model.Disciplina;
import br.com.studymate.model.Tarefa;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.TarefaRepository;
import br.com.studymate.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class TarefaService {

    private final TarefaRepository tarefaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final UsuarioRepository usuarioRepository;

    public TarefaService(
            TarefaRepository tarefaRepository,
            DisciplinaRepository disciplinaRepository,
            UsuarioRepository usuarioRepository) {

        this.tarefaRepository = tarefaRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public List<TarefaResponse> listar(Integer idUsuario) {
        validarIdUsuario(idUsuario);
        return tarefaRepository.listarPorUsuario(idUsuario);
    }

    public TarefaResponse consultarPorId(
            Integer idTarefa,
            Integer idUsuario) {

        Tarefa tarefa = buscarDoUsuario(idTarefa, idUsuario);

        return resposta(tarefa, idUsuario);
    }

    @Transactional
    public TarefaResponse cadastrar(TarefaRequest request) {

        validarDadosTarefa(request);

        bloquearUsuario(request.getIdUsuario());

        Disciplina disciplina =
                disciplinaRepository.buscarPorIdEUsuario(
                        request.getIdDisciplina(),
                        request.getIdUsuario()
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "A disciplina informada não pertence ao usuário."
                        )
                );

        Tarefa tarefa = new Tarefa();

        tarefa.setIdDisciplina(disciplina.getIdDisciplina());

        preencherDados(tarefa, request);

        // Valores controlados pelo backend.
        tarefa.setStatus("PENDENTE");
        tarefa.setDataConclusao(null);

        // Ainda não definimos a regra de XP.
        tarefa.setXpGerado(0);

        Tarefa salva =
                tarefaRepository.saveAndFlush(tarefa);

        return new TarefaResponse(
                salva,
                disciplina.getNome()
        );
    }

    @Transactional
    public TarefaResponse alterar(
            Integer idTarefa,
            Integer idUsuario,
            TarefaRequest request) {

        validarDadosTarefa(request);
        validarIdUsuario(idUsuario);

        if (request.getIdUsuario() != null
                && !idUsuario.equals(request.getIdUsuario())) {

            throw new IllegalArgumentException(
                    "Usuário da URL e do corpo da requisição são diferentes."
            );
        }

        bloquearUsuario(idUsuario);

        Tarefa tarefa =
                buscarDoUsuario(idTarefa, idUsuario);

        Disciplina disciplina =
                disciplinaRepository.buscarPorIdEUsuario(
                        request.getIdDisciplina(),
                        idUsuario
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "A disciplina informada não pertence ao usuário."
                        )
                );

        tarefa.setIdDisciplina(
                disciplina.getIdDisciplina()
        );

        preencherDados(tarefa, request);

        Tarefa salva =
                tarefaRepository.saveAndFlush(tarefa);

        return new TarefaResponse(
                salva,
                disciplina.getNome()
        );
    }

    @Transactional
    public TarefaResponse concluir(
            Integer idTarefa,
            Integer idUsuario) {

        bloquearUsuario(idUsuario);

        Tarefa tarefa =
                buscarDoUsuario(idTarefa, idUsuario);

        if ("CONCLUIDA".equalsIgnoreCase(
                tarefa.getStatus())) {

            throw new IllegalArgumentException(
                    "A tarefa já está concluída."
            );
        }

        tarefa.setStatus("CONCLUIDA");
        tarefa.setDataConclusao(
                LocalDateTime.now()
        );

        Tarefa salva =
                tarefaRepository.saveAndFlush(tarefa);

        return resposta(salva, idUsuario);
    }

    @Transactional
    public TarefaResponse reabrir(
            Integer idTarefa,
            Integer idUsuario) {

        bloquearUsuario(idUsuario);

        Tarefa tarefa =
                buscarDoUsuario(
                        idTarefa,
                        idUsuario
                );

        if ("PENDENTE".equalsIgnoreCase(
                tarefa.getStatus())) {

                throw new IllegalArgumentException(
                        "A tarefa já está pendente."
                );
        }

        tarefa.setStatus("PENDENTE");
        tarefa.setDataConclusao(null);

        Tarefa salva =
                tarefaRepository.saveAndFlush(
                        tarefa
                );

        return resposta(
                salva,
                idUsuario
        );
        }

        @Transactional
        public void excluir(
                Integer idTarefa,
                Integer idUsuario) {

        bloquearUsuario(idUsuario);

        Tarefa tarefa =
                buscarDoUsuario(idTarefa, idUsuario);

        tarefa.setDeletedAt(OffsetDateTime.now());

        tarefaRepository.saveAndFlush(tarefa);
        }

    private Tarefa buscarDoUsuario(
            Integer idTarefa,
            Integer idUsuario) {

        validarIdUsuario(idUsuario);

        if (idTarefa == null || idTarefa <= 0) {
            throw new IllegalArgumentException(
                    "A tarefa informada é inválida."
            );
        }

        return tarefaRepository
                .buscarPorIdEUsuario(
                        idTarefa,
                        idUsuario
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Tarefa não encontrada."
                        )
                );
    }

    private TarefaResponse resposta(
            Tarefa tarefa,
            Integer idUsuario) {

        Disciplina disciplina =
                disciplinaRepository
                        .buscarPorIdEUsuario(
                                tarefa.getIdDisciplina(),
                                idUsuario
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Disciplina não encontrada."
                                )
                        );

        return new TarefaResponse(
                tarefa,
                disciplina.getNome()
        );
    }

    private void preencherDados(
            Tarefa tarefa,
            TarefaRequest request) {

        tarefa.setTitulo(
                request.getTitulo().trim()
        );

        tarefa.setTipo(
                request.getTipo().trim()
        );

        tarefa.setDescricao(
                request.getDescricao() == null
                        ? null
                        : request.getDescricao().trim()
        );

        tarefa.setDataHoraInicio(
                request.getDataHoraInicio()
        );

        tarefa.setDataEntrega(
                request.getDataEntrega()
        );

        tarefa.setPrioridade(
                request.getPrioridade().trim()
        );
    }

    private void bloquearUsuario(
            Integer idUsuario) {

        validarIdUsuario(idUsuario);

        usuarioRepository
                .buscarParaAtualizacao(idUsuario)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Usuário não encontrado."
                        )
                );
    }

    private void validarIdUsuario(
            Integer idUsuario) {

        if (idUsuario == null) {
            throw new IllegalArgumentException(
                    "O usuário é obrigatório."
            );
        }

        if (idUsuario <= 0) {
            throw new IllegalArgumentException(
                    "O usuário informado é inválido."
            );
        }
    }

    private void validarDadosTarefa(
            TarefaRequest request) {

        if (request == null) {
            throw new IllegalArgumentException(
                    "Informe os dados da tarefa."
            );
        }

        validarIdUsuario(request.getIdUsuario());

        if (request.getIdDisciplina() == null
                || request.getIdDisciplina() <= 0) {

            throw new IllegalArgumentException(
                    "A disciplina é obrigatória."
            );
        }

        if (request.getTitulo() == null
                || request.getTitulo().isBlank()) {

            throw new IllegalArgumentException(
                    "O título da tarefa é obrigatório."
            );
        }

        if (request.getTitulo().trim().length() > 100) {
            throw new IllegalArgumentException(
                    "O título deve ter até 100 caracteres."
            );
        }

        if (request.getTipo() == null
                || request.getTipo().isBlank()) {

            throw new IllegalArgumentException(
                    "O tipo da tarefa é obrigatório."
            );
        }

        if (request.getTipo().trim().length() > 20) {
            throw new IllegalArgumentException(
                    "O tipo deve ter até 20 caracteres."
            );
        }

        if (request.getDataEntrega() == null) {
            throw new IllegalArgumentException(
                    "A data de entrega é obrigatória."
            );
        }

        if (request.getDataHoraInicio() != null
                && request.getDataEntrega()
                .isBefore(request.getDataHoraInicio())) {

            throw new IllegalArgumentException(
                    "A data de entrega não pode ser anterior à data de início."
            );
        }

        if (request.getPrioridade() == null
                || request.getPrioridade().isBlank()) {

            throw new IllegalArgumentException(
                    "A prioridade da tarefa é obrigatória."
            );
        }

        if (request.getPrioridade().trim().length() > 20) {
            throw new IllegalArgumentException(
                    "A prioridade deve ter até 20 caracteres."
            );
        }
    }
}