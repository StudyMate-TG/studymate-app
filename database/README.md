# Banco de Dados do StudyMate

O StudyMate utiliza o Oracle Database como banco de dados central da aplicação e o SQLite como banco de dados local do aplicativo móvel.

O Oracle é responsável pela persistência definitiva das informações acadêmicas, dados de autenticação, sincronização, presença e gamificação. O SQLite é utilizado no aplicativo móvel para permitir o funcionamento offline das tarefas e armazenar operações pendentes de sincronização.

---

## 1. Banco Oracle

### 1.1 Execução do schema

Com a API parada, conecte-se ao schema utilizado pela aplicação e execute:

```sql
@database/scripts/scripts/oracle_schema.sql
```

No Oracle SQL Developer, abra o script utilizando a conexão correspondente ao schema da aplicação e utilize **Executar Script (F5)**.

As credenciais de conexão com o banco não fazem parte dos scripts e não devem ser versionadas no repositório.

O script pode ser utilizado tanto na criação de um schema vazio quanto na atualização de um schema existente. Ele cria objetos ausentes, preserva os dados existentes e não reinicia sequences já criadas.

Quando uma nova sequence precisa ser criada em um banco que já possui registros, seu valor inicial é definido acima do maior identificador existente na tabela correspondente.

Os scripts não corrigem automaticamente objetos existentes que tenham tipos, constraints ou estruturas diferentes das esperadas pelo projeto.

> Como comandos DDL no Oracle realizam commit implícito, uma falha durante a execução pode manter etapas anteriores já aplicadas. Em bancos compartilhados, recomenda-se realizar backup antes de alterações estruturais.

---

## 2. Migrations

As alterações incrementais do banco ficam armazenadas em:

```text
database/migrations/
```

Entre as migrations utilizadas atualmente pelo projeto estão:

```text
001_usuario_jpa.sql
002_periodos_disciplinas_jpa.sql
003_auth_protection.sql
004_email_verification.sql
005_gamificacao.sql
```

O `oracle_schema.sql` contempla o schema atual da aplicação e executa as migrations necessárias para complementar sua estrutura.

As migrations mais recentes foram desenvolvidas de forma aditiva, preservando os dados acadêmicos existentes e verificando, quando necessário, a existência dos objetos antes de criá-los.

Sempre execute migrations com a API parada.

---

## 3. Estruturas de autenticação e segurança

As migrations de autenticação adicionam as estruturas necessárias para os mecanismos de segurança utilizados pela API, incluindo suporte à confirmação de e-mail, controle de tentativas e proteção dos fluxos de autenticação.

As senhas dos usuários não são armazenadas em texto puro. O tratamento das credenciais, autenticação JWT e regras de autorização são implementados pelo backend.

Informações sensíveis, como chaves JWT, credenciais do Oracle e configurações de SMTP, não devem ser armazenadas nos scripts SQL nem versionadas no Git.

---

## 4. Sincronização de tarefas

Nesta versão do StudyMate, o funcionamento offline e a sincronização são aplicados às tarefas acadêmicas.

A tabela `TAREFA` possui metadados utilizados pelo mecanismo de sincronização:

- `version`: versão do registro utilizada no controle de concorrência;
- `updated_at`: data e hora da última atualização;
- `deleted_at`: data e hora da exclusão lógica, quando existente.

A exclusão das tarefas utilizadas pelo fluxo de sincronização é lógica, permitindo que a remoção seja propagada posteriormente para o aplicativo móvel.

O backend utiliza a tabela `SYNC_REQUEST` para registrar operações de sincronização já processadas. O campo `client_tx_id` identifica de forma única uma operação enviada pelo aplicativo e permite o processamento idempotente de requisições reenviadas.

Dessa forma, uma mesma operação não deve ser aplicada mais de uma vez caso o aplicativo precise reenviá-la após uma falha de comunicação.

Os metadados existentes no banco dão suporte à sincronização, mas o comportamento de PUSH, PULL, tratamento de conflitos e atualização do SQLite é implementado pelo backend e pelo aplicativo móvel.

---

## 5. Gamificação e presença

A migration:

```text
database/migrations/005_gamificacao.sql
```

adiciona as estruturas utilizadas pelo módulo de gamificação e pelo registro de presença.

### 5.1 ATIVIDADE_GAMIFICACAO

A tabela `ATIVIDADE_GAMIFICACAO` mantém o histórico das atividades que geraram experiência (XP).

Principais informações armazenadas:

- usuário responsável pela atividade;
- tipo da atividade;
- identificador da origem;
- descrição;
- quantidade de XP concedida;
- data da atividade;
- data e hora do registro.

Os tipos atualmente previstos são:

```text
TAREFA
PRESENCA
```

A combinação entre usuário, tipo e origem é única, evitando que uma mesma atividade gere XP mais de uma vez.

Os identificadores de origem são mantidos como referência histórica e não possuem foreign key direta para tarefa ou disciplina. Isso permite preservar o histórico da gamificação mesmo após alterações ou remoções permitidas em outras entidades.

---

### 5.2 MEDALHA_ESTUDANTE

A tabela `MEDALHA_ESTUDANTE` registra as medalhas desbloqueadas por cada estudante.

Sua chave primária é composta por:

```text
id_usuario
codigo
```

Também é armazenada a data e hora em que a medalha foi desbloqueada.

As medalhas permanecem registradas como parte do histórico de progresso do estudante.

---

### 5.3 PRESENCA_AULA

A tabela `PRESENCA_AULA` registra as presenças do estudante nas disciplinas.

Cada registro contém:

- usuário;
- disciplina;
- nome da disciplina;
- data da presença;
- XP gerado.

O nome da disciplina é mantido como informação histórica.

A combinação:

```text
id_usuario
id_disciplina
data_presenca
```

é única, impedindo registros duplicados para o mesmo estudante, disciplina e data.

A migration também cria a sequence:

```text
SEQ_PRESENCA_AULA
```

utilizada na geração dos identificadores das presenças.

---

## 6. Banco SQLite do aplicativo móvel

O aplicativo móvel utiliza um banco SQLite separado por usuário autenticado.

O banco local possui atualmente as seguintes estruturas principais:

```text
LOCAL_TAREFA
LOCAL_DISCIPLINA
SYNC_OUTBOX
SYNC_METADATA
```

O SQLite é utilizado somente para os dados necessários ao funcionamento offline. O Oracle continua sendo a fonte central de persistência da aplicação.

---

### 6.1 LOCAL_TAREFA

A tabela `LOCAL_TAREFA` mantém as tarefas disponíveis localmente no aplicativo.

Sua estrutura contempla:

```text
local_id
server_id
id_disciplina
nome_disciplina
titulo
tipo
descricao
data_hora_inicio
data_entrega
data_conclusao
status
prioridade
xp_gerado
server_version
sync_status
updated_at_local
```

O `local_id` identifica a tarefa no dispositivo.

O `server_id` é preenchido quando a tarefa possui correspondente persistido no servidor.

O campo `sync_status` indica a situação da tarefa em relação ao processo de sincronização.

---

### 6.2 LOCAL_DISCIPLINA

A tabela `LOCAL_DISCIPLINA` funciona como cache das disciplinas necessárias ao fluxo offline de tarefas.

Sua estrutura contempla informações como:

```text
id_disciplina
id_periodo
nome_periodo
nome
professor
media_aprovacao
limite_faltas
updated_at_local
```

Esse cache permite, por exemplo, que o estudante selecione e visualize a disciplina associada a uma tarefa mesmo durante períodos sem conexão.

O cache de disciplinas não significa que o gerenciamento completo de disciplinas funcione offline nesta versão.

---

### 6.3 SYNC_OUTBOX

A tabela `SYNC_OUTBOX` armazena as operações realizadas localmente que ainda precisam ser enviadas ao servidor.

Cada item possui, entre outras informações:

```text
client_tx_id
entity_local_id
entity_type
operation
payload
status
attempts
last_error
created_at
```

As operações atualmente previstas para tarefas são:

```text
CREATE
UPDATE
DELETE
COMPLETE
REOPEN
```

O `client_tx_id` identifica de forma única a operação e é utilizado no mecanismo de idempotência durante a sincronização.

A relação entre `SYNC_OUTBOX.entity_local_id` e `LOCAL_TAREFA.local_id` é uma referência lógica utilizada pelo aplicativo, não uma foreign key física no SQLite.

---

### 6.4 SYNC_METADATA

A tabela `SYNC_METADATA` armazena metadados utilizados pelo mecanismo de sincronização.

Sua estrutura é composta por:

```text
key
value
```

Ela é utilizada para armazenar informações de controle necessárias aos ciclos de sincronização, como cursores utilizados no recebimento incremental das alterações do servidor.

---

## 7. Relações do banco local

As principais relações lógicas do SQLite são:

```text
LOCAL_DISCIPLINA
       |
       | id_disciplina
       v
LOCAL_TAREFA
       |
       | local_id
       v
SYNC_OUTBOX
```

Essas associações são utilizadas pelo código da aplicação para relacionar as informações locais.

`SYNC_METADATA` possui finalidade de controle e não depende diretamente das demais tabelas.

---

## 8. Oracle e SQLite

Os dois bancos possuem responsabilidades distintas.

### Oracle

O Oracle representa a persistência central e definitiva do StudyMate, incluindo usuários, períodos letivos, disciplinas, tarefas, avaliações, faltas, presenças, gamificação e demais informações persistentes da aplicação.

### SQLite

O SQLite representa a persistência local do aplicativo móvel e dá suporte ao funcionamento offline das tarefas.

Nesta versão, o funcionamento offline não abrange todas as entidades acadêmicas.

A arquitetura permite que o mesmo padrão seja estendido futuramente para outros dados, como avaliações e faltas.

---

## 9. Cuidados ao atualizar o banco

Antes de executar alterações estruturais:

1. pare a API;
2. confirme que está conectado ao schema correto;
3. realize backup se estiver utilizando um banco compartilhado;
4. execute o `oracle_schema.sql` ou a migration necessária;
5. verifique se não ocorreram erros `ORA-`;
6. inicie novamente o backend;
7. execute os testes da aplicação.

No Oracle SQL Developer, utilize **F5 – Executar Script** para migrations que possuam blocos PL/SQL separados por `/`.

Não reinicie sequences manualmente em bancos que já possuam dados.

Não armazene credenciais, senhas, chaves JWT ou segredos SMTP dentro dos scripts versionados.

---

## 10. Observações finais

Os scripts SQL representam a estrutura de persistência necessária ao StudyMate.

As regras de negócio, autenticação, autorização, sincronização, atribuição de XP, controle de conquistas e demais comportamentos do sistema são implementados pelas camadas da aplicação e não apenas pelo banco de dados.

Os diagramas do trabalho devem manter separados:

- o modelo lógico do banco central Oracle;
- o modelo lógico do banco local SQLite.

Essa separação permite representar corretamente as diferentes responsabilidades de persistência da arquitetura do StudyMate.