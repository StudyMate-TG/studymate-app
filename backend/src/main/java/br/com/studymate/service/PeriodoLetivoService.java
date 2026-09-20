package br.com.studymate.service;

import br.com.studymate.dao.DaoPeriodoLetivo;
import br.com.studymate.dto.PeriodoLetivoRequest;
import br.com.studymate.dto.PeriodoLetivoResponse;
import br.com.studymate.model.PeriodoLetivo;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PeriodoLetivoService {

    private final DaoPeriodoLetivo daoPeriodoLetivo;

    public PeriodoLetivoService(DaoPeriodoLetivo daoPeriodoLetivo) {
        this.daoPeriodoLetivo = daoPeriodoLetivo;
    }

    public List<PeriodoLetivoResponse> listar(Integer idUsuario) {
        validarIdUsuario(idUsuario);
        validarUsuarioExiste(idUsuario);

        return daoPeriodoLetivo.listarPorUsuario(idUsuario)
                .stream()
                .map(PeriodoLetivoResponse::new)
                .toList();
    }

    public PeriodoLetivoResponse consultarPorId(Integer idPeriodo, Integer idUsuario) {
        validarIdPeriodo(idPeriodo);
        validarIdUsuario(idUsuario);

        PeriodoLetivo periodoLetivo = daoPeriodoLetivo.consultarPorIdEUsuario(
                idPeriodo,
                idUsuario
        );

        if (periodoLetivo == null) {
            throw new IllegalArgumentException("Período letivo não encontrado.");
        }

        return new PeriodoLetivoResponse(periodoLetivo);
    }

    public PeriodoLetivoResponse consultarAtivo(Integer idUsuario) {
        validarIdUsuario(idUsuario);
        validarUsuarioExiste(idUsuario);

        PeriodoLetivo periodoLetivo = daoPeriodoLetivo.consultarAtivoPorUsuario(idUsuario);

        if (periodoLetivo == null) {
            throw new IllegalArgumentException("Nenhum período letivo ativo encontrado.");
        }

        return new PeriodoLetivoResponse(periodoLetivo);
    }

    public PeriodoLetivoResponse cadastrar(PeriodoLetivoRequest request) {
        validarRequest(request);
        validarUsuarioExiste(request.getIdUsuario());

        String status = normalizarStatus(request.getStatus());

        if ("ATIVO".equals(status)) {
            daoPeriodoLetivo.inativarTodosPeriodosDoUsuario(request.getIdUsuario());
        }

        PeriodoLetivo periodoLetivo = new PeriodoLetivo(
                request.getIdUsuario(),
                request.getNome().trim(),
                request.getDataInicio(),
                request.getDataFim(),
                status
        );

        PeriodoLetivo periodoCadastrado = daoPeriodoLetivo.inserir(periodoLetivo);

        return new PeriodoLetivoResponse(periodoCadastrado);
    }

    public PeriodoLetivoResponse alterar(
            Integer idPeriodo,
            Integer idUsuario,
            PeriodoLetivoRequest request
    ) {
        validarIdPeriodo(idPeriodo);
        validarIdUsuario(idUsuario);
        validarRequest(request);

        if (!idUsuario.equals(request.getIdUsuario())) {
            throw new IllegalArgumentException("Usuário da URL e do corpo da requisição são diferentes.");
        }

        PeriodoLetivo periodoExistente = daoPeriodoLetivo.consultarPorIdEUsuario(
                idPeriodo,
                idUsuario
        );

        if (periodoExistente == null) {
            throw new IllegalArgumentException("Período letivo não encontrado.");
        }

        String status = normalizarStatus(request.getStatus());

        if ("ATIVO".equals(status)) {
            daoPeriodoLetivo.inativarOutrosPeriodos(idUsuario, idPeriodo);
        }

        PeriodoLetivo periodoLetivo = new PeriodoLetivo(
                idUsuario,
                request.getNome().trim(),
                request.getDataInicio(),
                request.getDataFim(),
                status
        );

        PeriodoLetivo periodoAlterado = daoPeriodoLetivo.alterar(idPeriodo, periodoLetivo);

        return new PeriodoLetivoResponse(periodoAlterado);
    }

    public PeriodoLetivoResponse ativar(Integer idPeriodo, Integer idUsuario) {
        validarIdPeriodo(idPeriodo);
        validarIdUsuario(idUsuario);

        PeriodoLetivo periodoExistente = daoPeriodoLetivo.consultarPorIdEUsuario(
                idPeriodo,
                idUsuario
        );

        if (periodoExistente == null) {
            throw new IllegalArgumentException("Período letivo não encontrado.");
        }

        PeriodoLetivo periodoAtivado = daoPeriodoLetivo.ativar(idPeriodo, idUsuario);

        return new PeriodoLetivoResponse(periodoAtivado);
    }

    public void excluir(Integer idPeriodo, Integer idUsuario) {
        validarIdPeriodo(idPeriodo);
        validarIdUsuario(idUsuario);

        PeriodoLetivo periodoExistente = daoPeriodoLetivo.consultarPorIdEUsuario(
                idPeriodo,
                idUsuario
        );

        if (periodoExistente == null) {
            throw new IllegalArgumentException("Período letivo não encontrado.");
        }

        Integer totalDisciplinas = daoPeriodoLetivo.contarDisciplinasDoPeriodo(idPeriodo);

        if (totalDisciplinas != null && totalDisciplinas > 0) {
            throw new IllegalArgumentException(
                    "Não é possível excluir um período que possui disciplinas cadastradas."
            );
        }

        boolean excluiu = daoPeriodoLetivo.excluir(idPeriodo, idUsuario);

        if (!excluiu) {
            throw new IllegalArgumentException("Não foi possível excluir o período letivo.");
        }
    }

    private void validarRequest(PeriodoLetivoRequest request) {
        validarIdUsuario(request.getIdUsuario());

        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome do período letivo é obrigatório.");
        }

        if (request.getDataInicio() == null) {
            throw new IllegalArgumentException("A data de início é obrigatória.");
        }

        if (request.getDataFim() == null) {
            throw new IllegalArgumentException("A data de fim é obrigatória.");
        }

        if (request.getDataFim().isBefore(request.getDataInicio())) {
            throw new IllegalArgumentException("A data de fim não pode ser anterior à data de início.");
        }

        normalizarStatus(request.getStatus());
    }

    private void validarIdUsuario(Integer idUsuario) {
        if (idUsuario == null || idUsuario <= 0) {
            throw new IllegalArgumentException("O usuário informado é inválido.");
        }
    }

    private void validarIdPeriodo(Integer idPeriodo) {
        if (idPeriodo == null || idPeriodo <= 0) {
            throw new IllegalArgumentException("O período informado é inválido.");
        }
    }

    private void validarUsuarioExiste(Integer idUsuario) {
        if (!daoPeriodoLetivo.usuarioExiste(idUsuario)) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }
    }

    private String normalizarStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ATIVO";
        }

        String statusTratado = status.trim().toUpperCase();

        if (
                !"ATIVO".equals(statusTratado) &&
                !"INATIVO".equals(statusTratado) &&
                !"CONCLUIDO".equals(statusTratado)
        ) {
            throw new IllegalArgumentException(
                    "Status inválido. Use ATIVO, INATIVO ou CONCLUIDO."
            );
        }

        return statusTratado;
    }
}