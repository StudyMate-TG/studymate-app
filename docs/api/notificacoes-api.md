# RF12 — Central de notificações acadêmicas

## Implementação e arquitetura

Versões confirmadas nos manifestos: Java 17, Spring Boot 4.0.6, JPA/Hibernate, driver Oracle `ojdbc11`; aplicativo Expo 57/React 19; frontend Vite/React 18. A configuração normal continua usando Oracle. H2 é usado nos testes e no perfil local já existente.

A tabela `NOTIFICACAO` existente foi reaproveitada. `Notificacao` usa `SimNaoBooleanConverter` para armazenar `lida` em `S/N` e expor boolean na API. Repository, service, DTOs, controller e tratamento de erro seguem as camadas do projeto. O controller extrai o usuário do `sub` do JWT; consultas e leitura filtram proprietário, e a camada de serviço também protege as operações públicas de consulta/leitura. Um `idUsuario` recebido na URL ou no corpo não autoriza acesso.

Os serviços de tarefas, avaliações, faltas e disciplinas chamam a geração de avisos dentro da mesma transação de escrita. A sincronização offline já chama `TarefaService`, portanto usa os mesmos hooks; não existe um segundo gerador para sincronização. Reenvios de `clientTxId` são tratados pelo fluxo de idempotência existente antes da alteração acadêmica.

Arquivos principais:

- `backend/.../model/Notificacao.java` e `SimNaoBooleanConverter.java`.
- `backend/.../repository/NotificacaoRepository.java`.
- `backend/.../service/NotificacaoService.java` e `MediaPonderada.java`.
- `backend/.../config/NotificacaoPolicy.java` e `NotificacaoScheduler.java`.
- `backend/.../controller/NotificacaoController.java`, DTOs e exceções de notificações.
- `mobile/src/screens/NotificationsScreen.tsx`, `services/centralNotificacoesService.ts`, `services/notificacaoService.ts` e `utils/notificacaoPolicy.ts`.
- `frontend/src/pages/Notifications.tsx`, `services/notificacaoService.ts` e `hooks/useNotificacoes.ts`.

## Migration Oracle e histórico

Com as instâncias da API paradas, execute `database/migrations/006_notificacoes.sql` depois das migrations anteriores usando a conexão Oracle já configurada. O script principal `database/scripts/scripts/oracle_schema.sql` também a inclui. Nenhuma credencial precisa ser alterada. A migration é aditiva e permite reexecução; não foi aplicada automaticamente ao banco do desenvolvedor.

Colunas adicionadas:

| Coluna | Significado |
| --- | --- |
| `criado_em` | Instante da primeira persistência do aviso |
| `previsto_para` | Instante previsto para disponibilizar o aviso |
| `processado_em` | Instante em que entrou no histórico consultável; não comprova entrega pelo sistema operacional |
| `cancelado_em` | Cancelamento de aviso ainda pendente |
| `origem_tipo`, `origem_id` | Identificação histórica da origem, preservada após exclusão |
| `id_tarefa`, `id_avaliacao`, `id_disciplina` | Referências navegáveis; FKs com `ON DELETE SET NULL` |
| `chave_deduplicacao` | Chave estável protegida por `uk_notificacao_chave` no banco |

As notificações antigas mantêm mensagem, leitura e `data_envio`. O backfill interpreta o `DATE` legado no fuso `America/Sao_Paulo`, preenche os novos instantes em UTC e usa uma chave `LEGADO:<id>`. Essa suposição deve ser conferida se o banco antigo armazenava horários em outro fuso. O SQL de backfill é dinâmico, permitindo criar e preencher colunas na mesma execução Oracle.

Um aviso já processado permanece no histórico quando sua origem é editada, concluída ou excluída. Somente avisos pendentes são cancelados. Ao excluir avaliações, as referências são desvinculadas antes do delete; a origem histórica permanece. A exclusão de disciplina continua respeitando os bloqueios existentes para registros acadêmicos vinculados, mas o histórico de notificações não impede a exclusão. A FK do usuário usa `ON DELETE CASCADE`: remover uma conta remove seu histórico.

`schema-test.sql` e `schema-local.sql` foram atualizados. A alteração local preexistente no script Oracle foi preservada.

## Regras e fuso horário

O `Clock` UTC já disponível é injetado no serviço; não há relógio paralelo. Datas acadêmicas sem offset são interpretadas em `America/Sao_Paulo`. Os novos campos de ciclo de vida usam `TIMESTAMP WITH TIME ZONE` e são produzidos em UTC. As interfaces mostram os horários no fuso acadêmico.

| Aviso | Regra padrão |
| --- | --- |
| Tarefa | 24 horas antes da entrega, somente pendente e com prazo futuro |
| Avaliação na véspera | 18h da véspera, somente avaliação ainda não corrigida e cuja data ainda é futura |
| Avaliação no dia | 8h do dia; como o cadastro tem apenas data, permanece válido até o fim desse dia |
| Aproximação das faltas | `total >= ceil(limite × 0,75)`, enquanto abaixo do limite |
| Limite de faltas | `total >= limite` e pelo menos uma falta |
| Média | Média ponderada das avaliações corrigidas abaixo da média de aprovação da disciplina |

Se uma tarefa ainda futura é cadastrada dentro das 24 horas de antecedência, o aviso entra imediatamente no histórico. Na recuperação após indisponibilidade, avisos de tarefa vencida são cancelados; o aviso de véspera não aparece como “amanhã” no próprio dia. Datas passadas não criam novos lembretes de tarefa/avaliação.

Limite de faltas zero significa nenhuma falta permitida: zero faltas não gera aviso, uma ou mais geram o aviso de 100%. Se o cadastro já salta diretamente para 100%, somente o nível de maior gravidade é criado. Repetições com a mesma disciplina, limite e nível não criam novas notificações. Correções de faltas e limites reavaliam o estado, preservando o histórico anterior.

O cálculo de média foi extraído para `MediaPonderada` e é compartilhado com o endpoint de média existente: `sum(nota × peso) / sum(pesos)` somente das avaliações com nota, arredondado em duas casas, `HALF_UP`. Sem avaliações corrigidas não há alerta. O texto informa que a média é parcial e não determina reprovação definitiva. A deduplicação usa as notas/pesos corrigidos e a média de aprovação, com representação decimal normalizada; mudanças relevantes podem produzir um novo aviso.

Os padrões de prazo, horários, fuso e faltas também estão documentados em `mobile/src/utils/notificacaoPolicy.ts` e cobertos por testes. Ao personalizar os parâmetros do servidor, alinhe essa política local no mesmo release para manter lembretes offline coerentes.

## Configuração e processamento

| Propriedade | Padrão configurado | Limites |
| --- | --- | --- |
| `app.notifications.zone` | `America/Sao_Paulo` | ZoneId válido |
| `app.notifications.task-lead-hours` | `24` | 1–168 |
| `app.notifications.evaluation-eve-hour` | `18` | 0–23 |
| `app.notifications.evaluation-day-hour` | `8` | 0–23 |
| `app.notifications.absence-warning-ratio` | `0.75` | finito, maior que 0 e menor que 1 |
| `app.notifications.average-enabled` | `true` | habilita alerta de média |
| `app.notifications.scheduler-enabled` | `true` | desabilitado no perfil de testes |
| `app.notifications.user-batch-size` | `100` | 1–1000 |
| `app.notifications.processing-batch-size` | `500` | 1–1000 |
| `app.notifications.scan-delay-ms` | `60000` | intervalo e atraso inicial do scheduler |

O scheduler reaproveita `@EnableScheduling`. Cada usuário é processado em uma transação própria, sob bloqueio pessimista da sua linha. O mesmo bloqueio é usado nas escritas acadêmicas, inclusive faltas, e na leitura idempotente. Instâncias concorrentes serializam pelo banco; a constraint única protege a deduplicação mesmo fora do Java. Uma falha reverte a transação daquele usuário e será tentada novamente em uma próxima execução; falhas são registradas no log.

O processamento prioriza contas com avisos vencendo e também percorre usuários em lotes por cursor para reconciliar dados anteriores à instalação do módulo. Cada execução trata até dois lotes de contas: prioritárias e reconciliação. `processing-batch-size` limita a consulta final de pendências por conta; a reconciliação também pode publicar avisos já devidos e esse parâmetro não é um teto absoluto da transação. Reiniciar o processo não apaga os avisos nem suas chaves. Mudança de prazo cancela pendências anteriores; reabertura pode reativar o mesmo aviso cancelado ainda não publicado. Um aviso já publicado não é publicado de novo para a mesma chave. A reconciliação consulta as tarefas sem carregar seus CLOBs de descrição.

## Endpoints

Todos exigem `Authorization: Bearer <JWT de login>`.

| Método e URL | Resultado |
| --- | --- |
| `GET /api/notificacoes?page=0&size=20&lida=false` | Histórico do usuário, filtro `lida` opcional |
| `GET /api/notificacoes/nao-lidas/total` | `{ "total": 3 }` |
| `PATCH /api/notificacoes/{id}/lida` | DTO com `lida: true`; repetir retorna o mesmo estado |

A paginação aceita `page` entre 0 e 10000 e `size` entre 1 e 50. Ordenação por `processadoEm DESC, idNotificacao DESC`. A resposta de listagem contém `content`, `page`, `size`, `totalElements`, `totalPages`. Cada item contém ID, título, mensagem, tipo, booleano de leitura, instantes e referências de origem. Avisos pendentes/cancelados não entram na listagem nem na contagem.

Respostas seguem o padrão `{ "mensagem": "..." }`: 400 para entrada inválida, 401 para JWT ausente/expirado/inválido e 404 para notificação inexistente, ainda pendente ou de outra conta. Não há endpoint para um cliente criar notificações arbitrárias.

## Testar pelo navegador

1. Aplique a migration Oracle e suba o backend pelo fluxo habitual do projeto. Ele permanece na porta 8081.
2. Para Expo web, em `mobile`, configure `EXPO_PUBLIC_API_URL` se necessário (incluindo `/api`) e execute `npm run web -- --port 8082`. Entre e abra **Perfil → Notificações**. O backend usa 8081; escolha outra porta para o Expo.
3. Para o frontend Vite, em `frontend`, execute `npm run dev`. Entre e abra o sino, **Perfil → Notificações** ou `/notifications`. A origem da API continua no padrão já utilizado pelos outros serviços; veja o README do frontend para a URL base.
4. Crie uma tarefa com entrega futura dentro das próximas 24 horas. Acesse a central e confira o título, o horário e o contador. Marque como lida e confirme a redução da contagem e os filtros **Todas / Não lidas / Lidas**.
5. Saia e entre com outra conta para conferir isolamento. As chaves de cache incluem conta/geração de sessão e respostas atrasadas de outra sessão são descartadas. JWT expirado leva à tela de entrada com mensagem.
6. Para testar agendamento sem esperar horas, use os testes com relógio controlado. Alterar o relógio da máquina não é necessário.

O histórico persistido é consultável no navegador e no aplicativo. Consultar a central nunca dispara um alerta adicional do sistema operacional. Lembretes nativos locais continuam úteis offline: IDs estáveis, separação por conta, serialização de operações, cancelamento no logout/expiração e reconciliação após sincronização evitam agendamentos antigos e duplicados. A versão web não solicita permissão de `expo-notifications`.

## Verificações

Executado em 26/10/2026:

- Backend com JDK 17: compilação e suíte completa (`.\mvnw.cmd test`), 149 testes; mais 10 testes adicionais executados depois, totalizando 159 testes com zero falhas/erros/skips.
- `NotificacaoFlowTests`: 17 testes de autenticação, dois usuários, paginação/filtros/contagem, S/N, leitura idempotente, horários exatos, deduplicação de banco, concorrência, rollback, prazos, conclusão/reabertura/exclusão, avaliações, média, faltas, limites zero, datas passadas e sincronização repetida.
- `NotificacaoEdgeTests` e `NotificacaoPolicyTests`: 10 testes de parâmetros inválidos, ausência de alerta de véspera no próprio dia, precisão de prazo, normalização decimal, prioridade de pendências e deduplicação após criar outra instância do processador. Esta última verificação usa a mesma base H2 e não simula reiniciar a JVM ou Oracle.
- Mobile: `npx tsc --noEmit`, `npm test` (40 testes) e `npm run build:web` passaram, incluindo concorrência de reconciliação, cancelamento no logout e rejeição de respostas de outra sessão.
- Frontend: `npm test` (6 testes), `npm run build` e ESLint dos arquivos alterados passaram. Tipagem/lint globais têm erros preexistentes em componentes não utilizados e dependências ausentes, detalhados em `frontend/README.md`.

Não foi executada a migration contra um Oracle real nem validada apresentação de alertas em dispositivo Android/iOS real. Os testes de banco usam o schema H2 em modo Oracle, conforme infraestrutura existente; eles não comprovam execução do PL/SQL Oracle. Os builds web comprovam empacotamento; o roteiro acima orienta a validação manual contra a conexão Oracle do ambiente.

## Etapa futura — push remoto

Push remoto não faz parte desta entrega. Uma etapa posterior precisa cadastrar e revogar dispositivos/assinaturas por conta, tratar permissões e troca de usuário, selecionar um provedor (por exemplo, Expo/APNs/FCM ou Web Push), manter tentativas com idempotência/backoff e guardar recibos/confirmação de entrega. Deve haver uma política de prioridade entre lembrete local e push remoto para não apresentar o mesmo alerta duas vezes.

O token de transporte identifica um destino no provedor de notificações. Ele não é o JWT de login e não autoriza consultas ou alterações no StudyMate. `processado_em` nesta entrega significa disponibilidade no histórico da API, não confirmação de entrega por um provedor.
