package br.com.studymate.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

public record GamificacaoResponse(
        int xpTotal, int nivel, int xpNoNivel, int xpParaProximoNivel,
        int ofensivaAtual, int melhorOfensiva, boolean ativoHoje,
        int xpHoje, int metaDiaria, int tarefasConcluidas,
        int presencasRegistradas, int diasAtivos,
        List<Dia> semana, List<Medalha> medalhas, List<Atividade> atividadesRecentes) {
    public record Dia(LocalDate data, boolean ativo, int xp) {}
    public record Medalha(String codigo, String nome, String descricao, String icone,
            String categoria, int meta, int progresso, boolean desbloqueada,
            OffsetDateTime desbloqueadaEm) {}
    public record Atividade(String id, String tipo, String descricao, int xp,
            OffsetDateTime data, LocalDate dataAtividade) {}
}
