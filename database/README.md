# Banco Oracle do StudyMate

## Executar

Com a API parada, conecte ao schema da aplicacao no Oracle 21c usando SQL*Plus ou SQLcl e execute:

```sql
@database/scripts/scripts/oracle_schema.sql
```

No SQL Developer, use Executar Script (F5). A conexao e as credenciais nao fazem parte do script.

O script pode ser executado num schema vazio ou reexecutado: cria objetos ausentes, adiciona os metadados de TAREFA, preserva dados e nao reinicia sequences. As sequences novas comecam acima do maior ID existente. Objetos existentes devem seguir o modelo original: este script nao corrige automaticamente tipos ou constraints divergentes. DDL Oracle realiza commit implicito; uma falha pode deixar etapas anteriores aplicadas. Corrija a causa e reexecute, com backup antes de atualizar um banco compartilhado.

Emails duplicados sem distincao de maiusculas/minusculas impedem a criacao do indice unico. Corrija os dados explicitamente; o script nao remove registros.

## Metadados de sincronizacao de tarefas

O primeiro recorte sincronizado e TAREFA, conforme a Revisao 05. As demais tabelas e FKs existentes foram preservadas.

- version: NUMBER(19,0), nao nulo, valor inicial zero e restricao nao negativo. Mapeado com @Version na entidade Java.
- updated_at: TIMESTAMP(6) WITH TIME ZONE, nao nulo, inicialmente SYSTIMESTAMP.
- deleted_at: TIMESTAMP(6) WITH TIME ZONE, anulavel, representa exclusao logica.
- ix_tarefa_delta: (id_disciplina, updated_at, id_tarefa), inclui tarefas excluidas logicamente para consulta delta.

Nao ha trigger que incremente version: gravacoes JPA usam @Version e as mutacoes em lote do servico incrementam a versao e atualizam updated_at explicitamente. DELETE usa exclusao logica para permitir o pull das remocoes. Os defaults inicializam campos; o DDL sozinho nao implementa sincronizacao. A reexecucao tambem preenche version/updated_at nulos de bancos antigos antes de garantir NOT NULL.

processed_sync_operations registra operacoes confirmadas. Sua chave (id_usuario, client_operation_id) deduplica por conta; entity_local_id identifica a entidade no celular, sendo diferente do identificador da operacao. request_hash permite detectar reutilizacao do UUID com outro conteudo. response_payload (JSON em CLOB), response_status, response_resource_id e response_version permitem repetir a resposta original mesmo depois de novas alteracoes no recurso. A mutacao e esse registro deverao ser gravados na mesma transacao Java. Esta tabela nao e a Outbox do celular.

IDs de entidades existentes permanecem NUMBER(38), preservando o modelo. Sequences novas das entidades atualmente mapeadas como Integer respeitam o limite desse tipo; seq_tarefa suporta Long. Nao altera automaticamente sequences existentes. Integridade referencial continua bloqueando exclusoes fisicas de registros com dependencias.

## Fluxo Java integrado

POST e GET /api/sync/tarefas recebem Bearer Token. O backend usa a identidade autenticada para limitar as operacoes e o pull de tarefas.

O fluxo atual de idempotencia usa sync_request e sua chave client_tx_id. O registro e a mutacao sao gravados na mesma transacao. processed_sync_operations permanece como modelo preparatorio para o contrato mais completo descrito acima; o fluxo atual nao utiliza essa tabela.

Reexecute o script com a API parada antes de iniciar o backend integrado para garantir sync_request, seus indices e os metadados da entidade Tarefa. As migrations de autenticacao e confirmacao de e-mail tambem sao incluidas pelo script.

Tarefas excluidas logicamente e registros de idempotencia precisam de uma politica futura de retencao. Este merge nao apaga esses metadados automaticamente nem aplica o DDL a um banco remoto.

## Gamificacao e presencas

O script inclui a migration aditiva `005_gamificacao.sql`: cria o historico `atividade_gamificacao`, as medalhas permanentes `medalha_estudante` e `presenca_aula`, com uma presenca por disciplina/dia/usuario. Nao atribui pontos retroativos nem altera faltas, notas, tarefas ou dados academicos existentes.

Cada primeira conclusao de tarefa gera 30 XP; reabrir, reconcluir, excluir e repetir sincronizacao preserva o premio sem duplicar pontos. Cada presenca gera 20 XP e so pode ser registrada para hoje, no fuso `America/Sao_Paulo`. Datas passadas e futuras sao rejeitadas sem presenca, XP ou medalha. Conclusao, credito, medalhas e operacoes de sincronizacao sao atomicos e usam o bloqueio da conta existente.

Uma atividade remunerada por dia mantem a ofensiva. A data da atividade nova vem do relogio do servidor no fuso `America/Sao_Paulo`, inclusive para presencas, e nao do calendario enviado pelo cliente. A validacao ocorre no cadastro e novamente na premiacao; se o dia virar entre essas etapas, a transacao inteira e revertida. A sequencia de ontem permanece ativa durante o dia atual, mas presencas nao podem preencher dias perdidos. Medalhas e recordes permanecem apos quebra da ofensiva. Nivel inicial 1, com um novo nivel a cada 100 XP; meta diaria de 30 XP.

O historico legado, seus pontos, medalhas e recordes nao sao apagados nem reescritos por esta regra. Presencas retroativas aceitas por uma versao anterior continuam visiveis e podem explicar recordes e medalhas ja conquistados. As novas gravacoes nao permitem ampliar a ofensiva com datas retroativas. Recalcular historicos e revogar conquistas antigas exigiria uma politica de migracao explicita, fora desta alteracao.

O historico guarda os identificadores de origem e nomes de disciplinas como snapshots, sem FK para tarefa/disciplina, preservando conquistas apos exclusoes permitidas pelo fluxo academico. Todas as gravacoes conferem o proprietario da disciplina; nao existe endpoint de credito de XP arbitrario.

Endpoints autenticados: `GET /api/gamificacao`, `GET /api/presencas?idDisciplina=...`, `POST /api/presencas` com `idDisciplina` e `dataPresenca` (`YYYY-MM-DD`). O perfil local e os testes usam o mesmo modelo no H2. No Oracle, reexecute o script antes de iniciar esta versao da API.
