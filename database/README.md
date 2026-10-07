# Banco Oracle do StudyMate

## Executar

Com a API parada, conecte ao schema da aplicacao no Oracle 21c usando SQL*Plus ou SQLcl e execute:

```sql
@database/scripts/scripts/oracle_schema.sql
```

No SQL Developer, use Executar Script (F5). A conexao e as credenciais nao fazem parte do script.

O script pode ser executado num schema vazio ou reexecutado: cria objetos ausentes, adiciona os metadados de TAREFA, preserva dados e nao reinicia sequences. As sequences novas comecam acima do maior ID existente. Objetos existentes devem seguir o modelo original: este script nao corrige automaticamente tipos ou constraints divergentes. DDL Oracle realiza commit implicito; uma falha pode deixar etapas anteriores aplicadas. Corrija a causa e reexecute, com backup antes de atualizar um banco compartilhado.

Emails duplicados sem distincao de maiusculas/minusculas impedem a criacao do indice unico. Corrija os dados explicitamente; o script nao remove registros.

## Sincronizacao preparada na etapa 1

O primeiro recorte sincronizado e TAREFA, conforme a Revisao 05. As demais tabelas e FKs existentes foram preservadas.

- version: NUMBER(19,0), nao nulo, valor inicial zero e restricao nao negativo. Preparado para @Version na etapa de implementacao Java.
- updated_at: TIMESTAMP(6) WITH TIME ZONE, nao nulo, inicialmente SYSTIMESTAMP.
- deleted_at: TIMESTAMP(6) WITH TIME ZONE, anulavel, representa exclusao logica.
- ix_tarefa_delta: (id_disciplina, updated_at, id_tarefa), inclui tarefas excluidas logicamente para consulta delta.

Nao ha trigger que incremente version: o Hibernate devera controlar a versao. O futuro service Java devera atualizar updated_at em toda alteracao, inclusive soft delete. Os defaults apenas inicializam campos; o DDL sozinho nao implementa sincronizacao.

processed_sync_operations registra operacoes confirmadas. Sua chave (id_usuario, client_operation_id) deduplica por conta; entity_local_id identifica a entidade no celular, sendo diferente do identificador da operacao. request_hash permite detectar reutilizacao do UUID com outro conteudo. response_payload (JSON em CLOB), response_status, response_resource_id e response_version permitem repetir a resposta original mesmo depois de novas alteracoes no recurso. A mutacao e esse registro deverao ser gravados na mesma transacao Java. Esta tabela nao e a Outbox do celular.

IDs de entidades existentes permanecem NUMBER(38), preservando o modelo. Sequences novas das entidades atualmente mapeadas como Integer respeitam o limite desse tipo; seq_tarefa suporta Long. Nao altera automaticamente sequences existentes. Integridade referencial continua bloqueando exclusoes fisicas de registros com dependencias.

## Limite desta entrega

Somente DDL: autenticação JWT, CRUD Java de tarefas e endpoints push/pull pertencem as etapas seguintes, sujeitas a validacao.
