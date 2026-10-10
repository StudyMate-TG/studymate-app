# Correções de segurança da API

Implementação concluída em 2026-10-06 para APPSEC-01, APPSEC-02 e APPSEC-03. Mantém Java17/Spring e Oracle.

## Preparar o banco

No Oracle local deste computador, as migrations abaixo já foram aplicadas e reexecutadas com sucesso, sem mudar as contagens dos dados acadêmicos. Em outros ambientes, execute antes de iniciar esta versão:

```sql
@database/migrations/003_auth_protection.sql
@database/migrations/004_email_verification.sql
```

O script de criação Oracle também chama essas migrations. Elas criam tabelas auxiliares e não reiniciam contadores existentes. Não alteram usuários/tarefas existentes. Execute no schema da aplicação; DDL Oracle faz commit implícito.

## SMTP por variáveis de ambiente

Configure no ambiente do processo Java, ou no backend.local.properties ignorado pelo Git:

```properties
SMTP_HOST=smtp.seu-provedor.example
SMTP_PORT=587
SMTP_USERNAME=seu-usuario-smtp
SMTP_PASSWORD=substitua-por-seu-segredo
SMTP_FROM=contato@seu-dominio.example
SMTP_STARTTLS=true
```

Esses valores são exemplos, não credenciais funcionais. Nunca envie a senha pelo chat nem versione valores reais. O SMTP usa STARTTLS obrigatório e validação de identidade do servidor por padrão, com timeouts de5segundos. A implementação atual é para SMTP com STARTTLS, normalmente porta587. Para SMTP local de desenvolvimento sem TLS, desative apenas nesse ambiente. Envio tem dois workers e fila limitada a100mensagens; erros não imprimem endereço, código nem detalhes de credenciais.

Sem SMTP_HOST/SMTP_FROM, cadastro e solicitação de alteração de e-mail retornam503 de forma uniforme, antes de consultar a existência de conta. Login de contas existentes continua disponível. O envio real pelo provedor ainda depende dessas configurações; os testes usam transporte simulado e não enviaram e-mails externos.

## Cadastro e confirmação

1. POST /api/auth/register recebe nome/email/senha. Retorna202 com a mesma mensagem para endereço novo ou existente; não devolve usuário nem token e não entra automaticamente no app.
2. O endereço recebe código de64caracteres hexadecimais. O banco guarda somente SHA-256 desse código e BCrypt da senha solicitada. Validade padrão15minutos, uso único.
3. POST /api/auth/verify-email recebe codigo e a mesma senha do cadastro:
```json
{"codigo":"codigo-recebido-no-email","senha":"a-mesma-senha-do-cadastro"}
```
4. A conta só é criada após comprovar código e senha. Conta existente não tem senha substituída. Depois, faça login normalmente para obter o JWT.

Códigos não ficam em URL, logs, perfil armazenado ou respostas públicas. Confirmações simultâneas não criam duas contas. Tokens expirados/usados são removidos periodicamente; a quantidade de solicitações pendentes é limitada. Falha de SMTP não transforma o resultado da API em um oráculo de conta existente.

## Perfil e alteração de e-mail

PUT /api/usuarios/{proprioId} continua retornando os dados de perfil. Nome/curso/matrícula/instituição podem ser atualizados, porém novo endereço permanece pendente: a resposta preserva o e-mail atual e inclui emailAlteracaoPendente=true, tanto para endereço disponível quanto existente.

Para aplicar o endereço novo, envie POST /api/auth/verify-email com Bearer JWT do dono, código recebido nesse endereço e senha atual. Token de outra conta, ausência de autenticação, senha incorreta ou código inválido são recusados. A unicidade do endereço permanece protegida no banco. Após confirmar, entre com endereço novo/senha atual para atualizar a sessão.

## Limitação de tentativas

Contadores atômicos compartilhados no Oracle, com bloqueio da linha global por operação, expiração e quantidade limitada de buckets. Decisões são confirmadas em transação independente antes do trabalho de credenciais; lançar erro ou reverter outra transação não apaga as tentativas.

Valores padrão por janela de60segundos:

| Operação | Conta/código | Origem | Global |
|---|---:|---:|---:|
| Login |5|20|200|
| Cadastro |3|5|40|
| Confirmação |5|20|200|
| Atualização de perfil |3|5|40|

Excesso retorna429 e Retry-After. Falha no banco/controle retorna503; não há fallback que desative proteção. Login de endereço ausente também compara com um hash fictício pré-computado, sem emitir token. Senhas não são aparadas; o limite de72bytes UTF8 permanece.

A origem usa o peer da requisição. Não confie em X-Forwarded-For enviado por qualquer cliente. A configuração padrão desabilita interpretação de headers forwarded. Se houver proxy, configure explicitamente os proxies confiáveis e ajuste os orçamentos à carga real; não ative confiança irrestrita.

## Tarefas e corpo das requisições

Descrição bruta até4096caracteres; até1000tarefas e4.096.000caracteres armazenados por conta. Quotas e gravação usam o mesmo bloqueio de usuário; criação concorrente não ultrapassa o teto. Corpos POST/PUT/PATCH até64KiB, inclusive quando Content-Length está ausente ou há transferência chunked; excesso413.

GET /api/tarefas?page=0&size=50 retorna array de resumos sem descrição, no máximo50itens, ordenados por entrega/ID. Propriedade é filtrada antes de paginar; X-Next-Page permite carregar a próxima página. Detalhes continuam no GET por ID. Descrições antigas grandes não são lidas na listagem e podem ser substituídas ou excluídas por operações explícitas, sem truncamento silencioso. Veja task-api-limits.md.

## Clientes e validação

Web/mobile foram adaptados à confirmação de cadastro/alteração e à paginação. JWT fica só na memória da sessão; perfil salvo não inclui token. Reabrir/recarregar exige novo login.401limpa a sessão.

Backend:106testes passaram em H2 isolado, incluindo concorrência, expiração/replay, orçamento compartilhado, campos/propriedade, quotas, legado e corpo chunked. Oracle local: migrations executadas duas vezes; bloqueio e consultas escalares CLOB validados; dados acadêmicos preservados. Frontend e exportação web do mobile compilaram. Typecheck dos serviços/aplicação frontend e strict do mobile passaram. A checagem de todos os arquivos frontend ainda aponta três templates antigos sem dependências declaradas (recharts,vaul,react-resizable-panels), fora do fluxo ativo e sem relação com estas correções.

O relatório completo de correção e os logs ficam nos artefatos do Codex Security, separados do repositório e do scan original selado.
