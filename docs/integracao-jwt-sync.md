# Integracao da autenticacao com tarefas offline

Este merge combina a branch de JWT e limites da API com as alteracoes de edicao de tarefas, agenda e sincronizacao offline recebidas da main.

- As rotas de tarefas e sincronizacao enviam e validam Bearer Token. A identidade do usuario vem da autenticacao.
- Tarefas usam version, updated_at e deleted_at. A exclusao deixa metadados para que o pull remova a copia local.
- O pull preserva tarefas/cursor e acrescenta hasMore. O mobile aplica cada pagina e continua ate finalizar.
- A listagem online usa resumos paginados; a edicao consulta o detalhe antes de modificar a descricao.
- No mobile nativo, o banco SQLite e separado por usuario autenticado. O banco legado studymate.db e preservado e nao e atribuido automaticamente a uma conta, pois seus dados nao identificam o proprietario.
- Na web, os servicos usam o CRUD online com JWT. Os arquivos de plataforma selecionam o fluxo apropriado.
- O token continua em memoria. Ao reabrir o app, o login precisa ser renovado antes de acessar a fila local da conta. Nao foi acrescentado refresh token nem armazenamento persistente de credenciais.

Para atualizar o Oracle, siga database/README.md com a API parada. O schema de testes H2 tambem inclui os metadados e a tabela sync_request. Nenhuma migracao foi executada automaticamente em um banco remoto nesta integracao.

Os testes de integracao cobrem identidade autenticada, replay idempotente, rollback, metadados de edicao/exclusao e pull paginado. Os resultados da execucao sao registrados na descricao do PR.
