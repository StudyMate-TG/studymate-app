package br.com.studymate.service;

import br.com.studymate.dto.HorarioAulaRequest;
import br.com.studymate.dto.HorarioAulaResponse;
import br.com.studymate.model.Disciplina;
import br.com.studymate.model.HorarioAula;
import br.com.studymate.repository.DisciplinaRepository;
import br.com.studymate.repository.HorarioAulaRepository;
import br.com.studymate.repository.UsuarioRepository;
import br.com.studymate.model.PeriodoLetivo;
import br.com.studymate.repository.PeriodoLetivoRepository;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class HorarioAulaService {

    private final HorarioAulaRepository horarioAulaRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final PeriodoLetivoRepository periodoLetivoRepository;
    private final UsuarioRepository usuarioRepository;

public HorarioAulaService(
        HorarioAulaRepository horarioAulaRepository,
        DisciplinaRepository disciplinaRepository,
        PeriodoLetivoRepository periodoLetivoRepository,
        UsuarioRepository usuarioRepository
) {
    this.horarioAulaRepository = horarioAulaRepository;
    this.disciplinaRepository = disciplinaRepository;
    this.periodoLetivoRepository = periodoLetivoRepository;
    this.usuarioRepository = usuarioRepository;
}

    @PreAuthorize(
            "#idUsuario != null and #idUsuario.toString() == authentication.name"
    )
    public List<HorarioAulaResponse> listar(
            Integer idUsuario,
            Integer idDisciplina
    ) {
        validarIdUsuario(idUsuario);

        if (idDisciplina != null) {
            validarDisciplinaDoUsuario(
                    idDisciplina,
                    idUsuario
            );
        }

        return horarioAulaRepository.listarPorUsuario(
                idUsuario,
                idDisciplina
        );
    }

    @PreAuthorize(
            "#idUsuario != null and #idUsuario.toString() == authentication.name"
    )
    public HorarioAulaResponse consultarPorId(
            Integer idHorario,
            Integer idUsuario
    ) {
        HorarioAula horario =
                buscarDoUsuario(idHorario, idUsuario);

        return resposta(horario, idUsuario);
    }

    @Transactional
    @PreAuthorize("""
            #request != null
            and #request.idUsuario != null
            and #request.idUsuario.toString() == authentication.name
            """)
    public HorarioAulaResponse cadastrar(
            HorarioAulaRequest request
    ) {
        validarDadosHorario(request);

        bloquearUsuario(request.getIdUsuario());

        Disciplina disciplina =
                validarDisciplinaDoUsuario(
                        request.getIdDisciplina(),
                        request.getIdUsuario()
                );

        HorarioAula horario = new HorarioAula(
                disciplina.getIdDisciplina(),
                request.getDiaSemana().trim(),
                request.getHoraInicio().trim(),
                request.getHoraFim().trim()
        );

        preencherDados(horario, request);

        HorarioAula salvo =
                horarioAulaRepository.saveAndFlush(horario);

        PeriodoLetivo periodo =
        buscarPeriodoDaDisciplina(
                disciplina,
                request.getIdUsuario()
        );

        return new HorarioAulaResponse(
                salvo,
                disciplina.getNome(),
                periodo.getDataInicio(),
                periodo.getDataFim()
        );
    }

    @Transactional
    @PreAuthorize(
            "#idUsuario != null and #idUsuario.toString() == authentication.name"
    )
    public HorarioAulaResponse alterar(
            Integer idHorario,
            Integer idUsuario,
            HorarioAulaRequest request
    ) {
        validarDadosHorario(request);
        validarIdUsuario(idUsuario);

        if (
                request.getIdUsuario() != null
                && !idUsuario.equals(request.getIdUsuario())
        ) {
            throw new IllegalArgumentException(
                    "Usuário da URL e do corpo da requisição são diferentes."
            );
        }

        bloquearUsuario(idUsuario);

        HorarioAula horario =
                buscarDoUsuario(idHorario, idUsuario);

        Disciplina disciplina =
                validarDisciplinaDoUsuario(
                        request.getIdDisciplina(),
                        idUsuario
                );

        horario.setIdDisciplina(
                disciplina.getIdDisciplina()
        );

        preencherDados(horario, request);

        HorarioAula salvo =
                horarioAulaRepository.saveAndFlush(horario);

        PeriodoLetivo periodo =
                buscarPeriodoDaDisciplina(
                disciplina,
                idUsuario
        );

        return new HorarioAulaResponse(
                salvo,
                disciplina.getNome(),
                periodo.getDataInicio(),
                periodo.getDataFim()
        );
    }

    @Transactional
    @PreAuthorize(
            "#idUsuario != null and #idUsuario.toString() == authentication.name"
    )
    public void excluir(
            Integer idHorario,
            Integer idUsuario
    ) {
        bloquearUsuario(idUsuario);

        HorarioAula horario =
                buscarDoUsuario(idHorario, idUsuario);

        horarioAulaRepository.delete(horario);
        horarioAulaRepository.flush();
    }

    private HorarioAula buscarDoUsuario(
            Integer idHorario,
            Integer idUsuario
    ) {
        validarIdUsuario(idUsuario);

        if (idHorario == null || idHorario <= 0) {
            throw new IllegalArgumentException(
                    "O horário de aula informado é inválido."
            );
        }

        return horarioAulaRepository
                .buscarPorIdEUsuario(
                        idHorario,
                        idUsuario
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Horário de aula não encontrado."
                        )
                );
    }

    private Disciplina validarDisciplinaDoUsuario(
            Integer idDisciplina,
            Integer idUsuario
    ) {
        if (idDisciplina == null || idDisciplina <= 0) {
            throw new IllegalArgumentException(
                    "A disciplina é obrigatória."
            );
        }

        return disciplinaRepository
                .buscarPorIdEUsuario(
                        idDisciplina,
                        idUsuario
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "A disciplina informada não pertence ao usuário."
                        )
                );
    }

    private PeriodoLetivo buscarPeriodoDaDisciplina(
                Disciplina disciplina,
                Integer idUsuario
        ) {
        return periodoLetivoRepository
                .findByIdPeriodoAndIdUsuario(
                        disciplina.getIdPeriodo(),
                        idUsuario
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Período letivo da disciplina não encontrado."
                        )
                );
        }

   private HorarioAulaResponse resposta(
                HorarioAula horario,
                Integer idUsuario
        ) {
        Disciplina disciplina =
                validarDisciplinaDoUsuario(
                        horario.getIdDisciplina(),
                        idUsuario
                );

        PeriodoLetivo periodo =
                buscarPeriodoDaDisciplina(
                        disciplina,
                        idUsuario
                );

        return new HorarioAulaResponse(
                horario,
                disciplina.getNome(),
                periodo.getDataInicio(),
                periodo.getDataFim()
        );
        }

    private void preencherDados(
            HorarioAula horario,
            HorarioAulaRequest request
    ) {
        horario.setDiaSemana(
                request.getDiaSemana().trim()
        );

        horario.setHoraInicio(
                request.getHoraInicio().trim()
        );

        horario.setHoraFim(
                request.getHoraFim().trim()
        );

        horario.setLocal(
                request.getLocal() == null
                        || request.getLocal().isBlank()
                        ? null
                        : request.getLocal().trim()
        );
    }

    private void bloquearUsuario(
            Integer idUsuario
    ) {
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
            Integer idUsuario
    ) {
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

    private void validarDadosHorario(
            HorarioAulaRequest request
    ) {
        if (request == null) {
            throw new IllegalArgumentException(
                    "Informe os dados do horário de aula."
            );
        }

        validarIdUsuario(
                request.getIdUsuario()
        );

        if (
                request.getIdDisciplina() == null
                || request.getIdDisciplina() <= 0
        ) {
            throw new IllegalArgumentException(
                    "A disciplina é obrigatória."
            );
        }

        if (
                request.getDiaSemana() == null
                || request.getDiaSemana().isBlank()
        ) {
            throw new IllegalArgumentException(
                    "O dia da semana é obrigatório."
            );
        }

        if (
                request.getDiaSemana().trim().length() > 20
        ) {
            throw new IllegalArgumentException(
                    "O dia da semana deve ter até 20 caracteres."
            );
        }

        validarHora(
                request.getHoraInicio(),
                "O horário de início"
        );

        validarHora(
                request.getHoraFim(),
                "O horário de fim"
        );

        if (
                request.getLocal() != null
                && request.getLocal().trim().length() > 100
        ) {
            throw new IllegalArgumentException(
                    "O local deve ter até 100 caracteres."
            );
        }
    }

    private void validarHora(
            String hora,
            String campo
    ) {
        if (hora == null || hora.isBlank()) {
            throw new IllegalArgumentException(
                    campo + " é obrigatório."
            );
        }

        String valor = hora.trim();

        if (!valor.matches(
                "^([01]\\d|2[0-3]):[0-5]\\d$"
        )) {
            throw new IllegalArgumentException(
                    campo + " deve estar no formato HH:mm."
            );
        }
    }
}