package br.com.studymate.service;

import br.com.studymate.dto.PeriodoLetivoRequest;
import br.com.studymate.dto.PeriodoLetivoResponse;
import br.com.studymate.model.PeriodoLetivo;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.PeriodoLetivoRepository;
import br.com.studymate.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@Transactional(readOnly = true)
public class PeriodoLetivoService {
    private final PeriodoLetivoRepository periodoRepository;
    private final UsuarioRepository usuarioRepository;
    private final DisciplinaRepository disciplinaRepository;

    public PeriodoLetivoService(PeriodoLetivoRepository periodoRepository,
                               UsuarioRepository usuarioRepository,
                               DisciplinaRepository disciplinaRepository) {
        this.periodoRepository = periodoRepository;
        this.usuarioRepository = usuarioRepository;
        this.disciplinaRepository = disciplinaRepository;
    }

    public List<PeriodoLetivoResponse> listar(Integer idUsuario) {
        validarIdUsuario(idUsuario);
        validarUsuarioExiste(idUsuario);
        return periodoRepository.findByIdUsuarioOrderByDataInicioDescIdPeriodoDesc(idUsuario)
                .stream().map(PeriodoLetivoResponse::new).toList();
    }

    public PeriodoLetivoResponse consultarPorId(Integer idPeriodo, Integer idUsuario) {
        return new PeriodoLetivoResponse(buscarDoUsuario(idPeriodo, idUsuario));
    }

    public PeriodoLetivoResponse consultarAtivo(Integer idUsuario) {
        validarIdUsuario(idUsuario);
        validarUsuarioExiste(idUsuario);
        return periodoRepository.findFirstByIdUsuarioAndStatusOrderByIdPeriodoDesc(idUsuario, "ATIVO")
                .map(PeriodoLetivoResponse::new)
                .orElseThrow(() -> new IllegalArgumentException("Nenhum período letivo ativo encontrado."));
    }

    @Transactional
    public PeriodoLetivoResponse cadastrar(PeriodoLetivoRequest request) {
        validarRequest(request);
        bloquearUsuario(request.getIdUsuario());
        String status = normalizarStatus(request.getStatus());
        if ("ATIVO".equals(status)) {
            inativarOutros(request.getIdUsuario(), null);
        }
        PeriodoLetivo periodo = new PeriodoLetivo(request.getIdUsuario(), request.getNome().trim(),
                request.getDataInicio(), request.getDataFim(), status);
        return new PeriodoLetivoResponse(periodoRepository.saveAndFlush(periodo));
    }

    @Transactional
    public PeriodoLetivoResponse alterar(Integer idPeriodo, Integer idUsuario, PeriodoLetivoRequest request) {
        validarIdPeriodo(idPeriodo);
        validarIdUsuario(idUsuario);
        validarRequest(request);
        if (!idUsuario.equals(request.getIdUsuario())) {
            throw new IllegalArgumentException("Usuário da URL e do corpo da requisição são diferentes.");
        }
        bloquearUsuario(idUsuario);
        PeriodoLetivo periodo = buscarDoUsuario(idPeriodo, idUsuario);
        String status = normalizarStatus(request.getStatus());
        if ("ATIVO".equals(status)) {
            inativarOutros(idUsuario, idPeriodo);
        }
        periodo.setNome(request.getNome().trim());
        periodo.setDataInicio(request.getDataInicio());
        periodo.setDataFim(request.getDataFim());
        periodo.setStatus(status);
        return new PeriodoLetivoResponse(periodoRepository.saveAndFlush(periodo));
    }

    @Transactional
    public PeriodoLetivoResponse ativar(Integer idPeriodo, Integer idUsuario) {
        validarIdPeriodo(idPeriodo);
        bloquearUsuario(idUsuario);
        PeriodoLetivo periodo = buscarDoUsuario(idPeriodo, idUsuario);
        inativarOutros(idUsuario, idPeriodo);
        periodo.setStatus("ATIVO");
        return new PeriodoLetivoResponse(periodoRepository.saveAndFlush(periodo));
    }

    @Transactional
    public void excluir(Integer idPeriodo, Integer idUsuario) {
        validarIdPeriodo(idPeriodo);
        bloquearUsuario(idUsuario);
        PeriodoLetivo periodo = buscarDoUsuario(idPeriodo, idUsuario);
        if (disciplinaRepository.existsByIdPeriodo(idPeriodo)) {
            throw new IllegalArgumentException("Não é possível excluir um período que possui disciplinas cadastradas.");
        }
        periodoRepository.delete(periodo);
        periodoRepository.flush();
    }

    // O lock do usuario serializa alteracoes dos periodos e disciplinas desse usuario.
    @Transactional
    public PeriodoLetivo obterOuCriarPeriodoPadrao(Integer idUsuario) {
        bloquearUsuario(idUsuario);
        return periodoRepository.findFirstByIdUsuarioAndStatusOrderByIdPeriodoDesc(idUsuario, "ATIVO")
                .orElseGet(() -> {
                    LocalDate hoje = LocalDate.now();
                    return periodoRepository.saveAndFlush(new PeriodoLetivo(
                            idUsuario, "Período atual", hoje, hoje.plusMonths(6), "ATIVO"));
                });
    }

    private PeriodoLetivo buscarDoUsuario(Integer idPeriodo, Integer idUsuario) {
        validarIdPeriodo(idPeriodo);
        validarIdUsuario(idUsuario);
        return periodoRepository.findByIdPeriodoAndIdUsuario(idPeriodo, idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Período letivo não encontrado."));
    }

    private void bloquearUsuario(Integer idUsuario) {
        validarIdUsuario(idUsuario);
        usuarioRepository.buscarParaAtualizacao(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    private void inativarOutros(Integer idUsuario, Integer idIgnorado) {
        periodoRepository.findByIdUsuarioAndStatus(idUsuario, "ATIVO").stream()
                .filter(p -> !p.getIdPeriodo().equals(idIgnorado))
                .forEach(p -> p.setStatus("INATIVO"));
        periodoRepository.flush();
    }
    private void validarRequest(PeriodoLetivoRequest request) {
        if (request == null) { throw new IllegalArgumentException("Informe os dados do período."); }
        validarIdUsuario(request.getIdUsuario());

        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome do período letivo é obrigatório.");
        }

        if (request.getNome().trim().length() > 50) { throw new IllegalArgumentException("O nome deve ter até 50 caracteres."); }

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
        if (!usuarioRepository.existsById(idUsuario)) {
            throw new IllegalArgumentException("Usuário não encontrado.");
        }
    }

    private String normalizarStatus(String status) {
        if (status == null || status.isBlank()) {
            return "ATIVO";
        }

        String statusTratado = status.trim().toUpperCase(Locale.ROOT);

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
