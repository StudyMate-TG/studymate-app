# StudyMate - Frontend

Frontend da aplicação StudyMate, um sistema acadêmico para organização de disciplinas, tarefas, calendário, frequência, conquistas e progresso do estudante.

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router DOM
- Lucide React

## Como executar o projeto

Dentro da pasta `frontend`, instale as dependências:

```bash
npm install```

## Central de notificações (RF12)

Com o backend em `http://localhost:8081` e a migration de notificações aplicada, execute:

```bash
npm run dev
```

Abra `http://localhost:8080`, entre com uma conta confirmada e abra o sino do cabeçalho ou **Perfil → Notificações**. A rota da central é `/notifications`. Os avisos processados aparecem por ordem mais recente, com filtros Todas/Não lidas/Lidas e páginas de 20 registros. A leitura atualiza o histórico e a contagem do sino; o botão Atualizar e a consulta periódica de 60 segundos recuperam novos avisos.

A central usa os endpoints autenticados `GET /api/notificacoes`, `GET /api/notificacoes/nao-lidas/total` e `PATCH /api/notificacoes/{id}/lida`, sem enviar `idUsuario`. O histórico permanece no servidor. O frontend não solicita permissão nem emite alertas do sistema operacional. Os horários da tela são apresentados em `America/Sao_Paulo`, independentemente do fuso do navegador.

O JWT continua apenas em memória. Logout ou expiração limpa o cache da central; respostas iniciadas por uma sessão anterior são descartadas. Uma sessão expirada volta ao login com uma mensagem. Recarregar a página exige um novo login, conforme a política existente.

Validação disponível:

```bash
npm test
npm run build
npx eslint src/App.tsx src/components/MobileHeader.tsx src/hooks/useNotificacoes.ts src/pages/Notifications.tsx src/pages/Profile.tsx src/pages/Login.tsx src/services/apiClient.ts src/services/notificacaoService.ts
npx tsc --noEmit -p tsconfig.app.json
npm run lint
```

Os testes executam os serviços TypeScript reais com transporte HTTP controlado. Cobrem contrato, paginação/filtros, JWT, ausência de sessão, contagem/leitura, expiração e respostas atrasadas entre contas. O build e o lint dos arquivos alterados passam. A verificação global de tipos ainda encontra dependências ausentes nos componentes preexistentes `ui/chart.tsx` (`recharts`), `ui/drawer.tsx` (`vaul`) e `ui/resizable.tsx` (`react-resizable-panels`). O lint global também possui erros preexistentes em `ui/command.tsx`, `ui/textarea.tsx` e `tailwind.config.ts`.
