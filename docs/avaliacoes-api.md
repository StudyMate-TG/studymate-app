# Avaliacoes e media por disciplina

Rotas do backend atual (idUsuario identifica a conta conforme contrato existente; JWT ainda pendente):

| Metodo | Rota | Parametros |
| --- | --- | --- |
| POST | /api/avaliacoes | idUsuario |
| GET | /api/avaliacoes | idUsuario, idDisciplina |
| GET | /api/avaliacoes/{idAvaliacao} | idUsuario |
| PUT | /api/avaliacoes/{idAvaliacao} | idUsuario |
| DELETE | /api/avaliacoes/{idAvaliacao} | idUsuario |
| GET | /api/avaliacoes/media | idUsuario, idDisciplina |

Body de cadastro e edicao (PUT substitui todos os campos):

```json
{
  "idDisciplina": 1,
  "nome": "Prova 1",
  "tipo": "PROVA",
  "nota": 8.5,
  "peso": 2,
  "dataAvaliacao": "2026-10-10"
}
```

Nome obrigatorio ate 100 caracteres; tipo obrigatorio ate 20 caracteres, sem inventar uma lista fechada de tipos. Nota opcional, entre 0 e 10; peso obrigatorio maior que zero e no maximo 99.99 (Oracle NUMBER(4,2)). Valores com mais de duas casas decimais sao rejeitados. Datas futuras sao permitidas para agendar avaliacoes. A disciplina de origem e a de destino, em uma edicao, precisam pertencer ao usuario informado.

Media = soma(nota * peso) / soma(peso), considerando somente avaliacoes com nota. Resultado arredondado para duas casas decimais, HALF_UP. Sem notas a media e null, evitando confundir falta de notas com nota zero. Retorna tambem avaliacoesComNota e avaliacoesPendentes. O valor e calculado na consulta; altera automaticamente apos cadastro, edicao ou exclusao. A media parcial nao representa aprovacao definitiva.

Cadastro/consulta/edicao/exclusao: HTTP 200 conforme rotas existentes. Dados invalidos: 400. Avaliacao inexistente ou pertencente a outra conta: 404, sem revelar dados. Conflito de integridade: 409. Erros inesperados: 500 com mensagem generica. Exclusao fisica nesta versao; sincronizacao de avaliacoes nao faz parte deste modulo.

A tabela avaliacao e a sequence seq_avaliacao ja constam no DDL Oracle; execute o script atualizado em um schema adequado antes de usar. ID da avaliacao e Long, compatível com a sequence preparada. Nenhuma alteracao no app mobile foi implementada nesta entrega.

Testes: em backend com JDK 17, executar `mvnw.cmd test`. AvaliacaoFlowTests verifica CRUD, media ponderada, notas pendentes, validacoes HTTP e restricoes por usuario.
