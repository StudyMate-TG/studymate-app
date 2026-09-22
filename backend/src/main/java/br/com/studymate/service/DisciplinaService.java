package br.com.studymate.service;

import br.com.studymate.dto.DisciplinaRequest;
import br.com.studymate.dto.DisciplinaResponse;
import br.com.studymate.model.Disciplina;
import br.com.studymate.model.PeriodoLetivo;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.PeriodoLetivoRepository;
import br.com.studymate.repository.UsuarioRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class DisciplinaService {
    private final DisciplinaRepository disciplinaRepository;
    private final PeriodoLetivoRepository periodoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PeriodoLetivoService periodoService;

    public DisciplinaService(DisciplinaRepository disciplinaRepository,
                             PeriodoLetivoRepository periodoRepository,
                             UsuarioRepository usuarioRepository, PeriodoLetivoService periodoService) {
        this.disciplinaRepository = disciplinaRepository;
        this.periodoRepository = periodoRepository;
        this.usuarioRepository = usuarioRepository;
        this.periodoService = periodoService;
    }

    public List<DisciplinaResponse> listar(Integer idUsuario, String termo) {
        validarIdUsuario(idUsuario);
        String busca = termo == null || termo.isBlank() ? "%" : "%" + termo.trim().replace("!", "!!") + "%";
        return disciplinaRepository.listarPorUsuario(idUsuario, busca);
    }

    public DisciplinaResponse consultarPorId(Integer idDisciplina, Integer idUsuario) {
        return resposta(buscarDoUsuario(idDisciplina, idUsuario), idUsuario);
    }

    @Transactional
    public DisciplinaResponse cadastrar(DisciplinaRequest request) {
        validarDadosDisciplina(request);
        bloquearUsuario(request.getIdUsuario());
        PeriodoLetivo periodo = request.getIdPeriodo() == null
                ? periodoService.obterOuCriarPeriodoPadrao(request.getIdUsuario())
                : periodoRepository.findByIdPeriodoAndIdUsuario(request.getIdPeriodo(), request.getIdUsuario())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "O período letivo informado não pertence ao usuário."));
        Disciplina disciplina = new Disciplina(periodo.getIdPeriodo(),
                request.getNome().trim(), request.getProfessor().trim());
        preencherDados(disciplina, request);
        return new DisciplinaResponse(disciplinaRepository.saveAndFlush(disciplina), periodo.getNome());
    }

    @Transactional
    public DisciplinaResponse alterar(Integer idDisciplina, Integer idUsuario, DisciplinaRequest request) {
        validarDadosDisciplina(request);
        validarIdUsuario(idUsuario);
        if (request.getIdUsuario() != null && !idUsuario.equals(request.getIdUsuario())) {
            throw new IllegalArgumentException("Usuário da URL e do corpo da requisição são diferentes.");
        }
        bloquearUsuario(idUsuario);
        Disciplina disciplina = buscarDoUsuario(idDisciplina, idUsuario);
        // Mantem o periodo original, como no contrato anterior de edicao.
        preencherDados(disciplina, request);
        return resposta(disciplinaRepository.saveAndFlush(disciplina), idUsuario);
    }

    @Transactional
    public void excluir(Integer idDisciplina, Integer idUsuario) {
        bloquearUsuario(idUsuario);
        Disciplina disciplina = buscarDoUsuario(idDisciplina, idUsuario);
        try {
            disciplinaRepository.delete(disciplina);
            disciplinaRepository.flush();
        } catch (DataIntegrityViolationException erro) {
            throw new IllegalArgumentException(
                    "Não é possível excluir uma disciplina que possui registros vinculados.", erro);
        }
    }

    private Disciplina buscarDoUsuario(Integer idDisciplina, Integer idUsuario) {
        validarIdUsuario(idUsuario);
        if (idDisciplina == null || idDisciplina <= 0) {
            throw new IllegalArgumentException("A disciplina informada é inválida.");
        }
        return disciplinaRepository.buscarPorIdEUsuario(idDisciplina, idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Disciplina não encontrada."));
    }

    private DisciplinaResponse resposta(Disciplina disciplina, Integer idUsuario) {
        PeriodoLetivo periodo = periodoRepository
                .findByIdPeriodoAndIdUsuario(disciplina.getIdPeriodo(), idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Período letivo não encontrado."));
        return new DisciplinaResponse(disciplina, periodo.getNome());
    }

    private void preencherDados(Disciplina disciplina, DisciplinaRequest request) {
        disciplina.setNome(request.getNome().trim());
        disciplina.setProfessor(request.getProfessor().trim());
        disciplina.setMediaAprovacao(request.getMediaAprovacao());
        disciplina.setLimiteFaltas(request.getLimiteFaltas());
    }

    private void bloquearUsuario(Integer idUsuario) {
        validarIdUsuario(idUsuario);
        usuarioRepository.buscarParaAtualizacao(idUsuario)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }
    private void validarIdUsuario(Integer idUsuario) {
        if (idUsuario == null) {
            throw new IllegalArgumentException("O usuário é obrigatório.");
        }

        if (idUsuario <= 0) {
            throw new IllegalArgumentException("O usuário informado é inválido.");
        }
    }

    private void validarDadosDisciplina(DisciplinaRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Informe os dados da disciplina.");
        }
        if (request.getNome() == null || request.getNome().isBlank()) {
            throw new IllegalArgumentException("O nome da disciplina é obrigatório.");
        }

        if (request.getProfessor() == null || request.getProfessor().isBlank()) {
            throw new IllegalArgumentException("O professor da disciplina é obrigatório.");
        }

        if (request.getNome().trim().length() > 100 || request.getProfessor().trim().length() > 100) {
            throw new IllegalArgumentException("Nome e professor devem ter até 100 caracteres.");
        }

        if (request.getMediaAprovacao() == null) {
            throw new IllegalArgumentException("A média de aprovação é obrigatória.");
        }

        if (!Double.isFinite(request.getMediaAprovacao()) || request.getMediaAprovacao() < 0 || request.getMediaAprovacao() > 10) {
            throw new IllegalArgumentException("A média de aprovação deve estar entre 0 e 10.");
        }

        if (request.getLimiteFaltas() == null) {
            throw new IllegalArgumentException("O limite de faltas é obrigatório.");
        }

        if (request.getLimiteFaltas() < 0) {
            throw new IllegalArgumentException("O limite de faltas não pode ser negativo.");
        }
    }
}
