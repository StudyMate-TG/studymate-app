# StudyMate

O **StudyMate** é uma aplicação desenvolvida para auxiliar estudantes na organização da rotina acadêmica, centralizando informações como períodos letivos, disciplinas, tarefas, avaliações, frequência e progresso.

O projeto é composto por:

- aplicativo mobile desenvolvido com React Native e Expo;
- frontend web em React;
- backend REST desenvolvido com Java e Spring Boot;
- banco de dados central Oracle;
- banco SQLite local no aplicativo mobile para suporte ao funcionamento offline de tarefas.

---

## Estrutura do projeto

```text
backend/     API REST e regras de negócio
frontend/    aplicação web
mobile/      aplicativo React Native / Expo
database/    scripts Oracle, migrations e schema SQLite
docs/        documentação e diagramas do projeto
```

---

## Pré-requisitos

Para executar o projeto localmente:

- JDK 17 ou superior;
- Node.js 22.13 ou superior;
- npm;
- internet para instalação inicial das dependências.

O backend utiliza o Maven Wrapper incluído no projeto.

---

# Executando o projeto

## 1. Backend

Para desenvolvimento local, o backend pode ser executado com o perfil `local`, utilizando H2 persistente em vez do Oracle.

Abra um PowerShell na raiz do projeto:

```powershell
cd backend

$env:SPRING_PROFILES_ACTIVE="local"
$env:JWT_SECRET=[Convert]::ToBase64String(
    [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64)
)

.\mvnw.cmd spring-boot:run
```

A API será iniciada em:

```text
http://localhost:8081
```

Os dados do ambiente local são armazenados em:

```text
backend/.local/
```

Esse ambiente utiliza H2 persistente, portanto os dados permanecem disponíveis após reiniciar a aplicação.

### Confirmação de e-mail no ambiente local

Os e-mails de confirmação gerados durante testes são armazenados em:

```text
backend/.local/emails/
```

Nenhum e-mail externo é enviado quando o perfil `local` está ativo.

---

## 2. Frontend web

Abra outro terminal:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 8080
```

A aplicação web ficará disponível em:

```text
http://localhost:8080
```

---

## 3. Aplicativo mobile

O aplicativo mobile utiliza Expo.

Instale as dependências:

```powershell
cd mobile
npm ci
```

### Testar em um celular físico

O computador e o celular devem estar conectados à mesma rede.

Primeiro descubra o endereço IPv4 do computador:

```powershell
ipconfig
```

Exemplo:

```text
192.168.0.10
```

Inicie o backend permitindo conexões pela rede local:

```powershell
cd backend

$env:SPRING_PROFILES_ACTIVE="local"
$env:SERVER_ADDRESS="0.0.0.0"
$env:JWT_SECRET=[Convert]::ToBase64String(
    [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64)
)

.\mvnw.cmd spring-boot:run
```

Depois, em outro terminal, entre em `mobile/` e configure o IP do computador:

```powershell
cd mobile

$env:EXPO_PUBLIC_API_URL="http://SEU_IP:8081/api"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="SEU_IP"

npx expo start --lan --port 8082
```

Exemplo:

```powershell
$env:EXPO_PUBLIC_API_URL="http://192.168.0.10:8081/api"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.10"

npx expo start --lan --port 8082
```

Abra o projeto pelo QR Code utilizando o Expo Go.

Caso o Expo solicite autenticação:

```powershell
npx expo login
```

Utilize no computador a mesma conta utilizada no Expo Go.

Mais informações estão disponíveis em:

```text
mobile/TESTE-NO-CELULAR.md
```

---

## Encerrar a aplicação

Para interromper qualquer serviço executado no terminal:

```text
Ctrl + C
```

Não são necessários scripts `.cmd` ou `.ps1` específicos para iniciar ou encerrar o StudyMate.

---

# Banco de dados

## Oracle

O Oracle é utilizado como banco de dados central da aplicação.

Com a API parada, execute:

```sql
@database/scripts/scripts/oracle_schema.sql
```

No Oracle SQL Developer, utilize:

```text
Executar Script (F5)
```

O script principal também executa as migrations:

```text
003_auth_protection.sql
004_email_verification.sql
005_gamificacao.sql
```

Mais informações:

```text
database/README.md
```

---

## SQLite

O aplicativo mobile utiliza SQLite para armazenar os dados necessários ao funcionamento offline das tarefas.

As principais estruturas locais são:

```text
LOCAL_TAREFA
LOCAL_DISCIPLINA
SYNC_OUTBOX
SYNC_METADATA
```

O Oracle continua sendo a fonte central dos dados da aplicação.

---

# Funcionamento offline

Nesta versão do StudyMate, o funcionamento offline é aplicado às **tarefas acadêmicas**.

O aplicativo permite:

- consultar tarefas armazenadas localmente;
- criar tarefas sem conexão;
- editar tarefas sem conexão;
- concluir tarefas sem conexão;
- reabrir tarefas sem conexão;
- excluir tarefas sem conexão;
- registrar operações pendentes na Outbox;
- sincronizar as operações quando a conexão retornar;
- evitar duplicidade em reenvios;
- receber alterações realizadas no servidor;
- visualizar o estado de sincronização.

As operações locais são persistidas no SQLite antes de serem enviadas para a API.

No Oracle, a tabela `TAREFA` utiliza os campos:

```text
version
updated_at
deleted_at
```

para auxiliar no controle de sincronização e exclusão lógica.

---

# Gamificação

O StudyMate possui recursos de gamificação baseados nas atividades realizadas pelo estudante.

Atualmente:

- a primeira conclusão de uma tarefa concede **30 XP**;
- uma presença válida concede **20 XP**;
- faltas não geram XP;
- concluir novamente uma tarefa já recompensada não gera XP adicional;
- reenvios de sincronização não duplicam recompensas;
- uma atividade válida pode manter a ofensiva diária;
- a meta diária é de **30 XP**;
- um novo nível é alcançado a cada **100 XP**;
- medalhas são desbloqueadas conforme os marcos definidos pelo sistema.

As principais estruturas utilizadas pelo módulo são:

```text
ATIVIDADE_GAMIFICACAO
MEDALHA_ESTUDANTE
PRESENCA_AULA
```

O histórico de gamificação é preservado mesmo quando determinadas entidades acadêmicas são posteriormente removidas.

---

# Escopo funcional

O StudyMate contempla funcionalidades relacionadas a:

- cadastro e autenticação;
- gerenciamento de perfil;
- períodos letivos;
- disciplinas;
- horários de aula;
- agenda acadêmica;
- tarefas;
- avaliações;
- cálculo de média ponderada;
- registro de faltas;
- registro de presenças;
- acompanhamento da frequência;
- notificações;
- XP e níveis;
- ofensivas;
- medalhas;
- funcionamento offline de tarefas;
- sincronização entre o aplicativo mobile e o backend.

---

# Documentação

Os principais documentos do projeto estão disponíveis em `docs/`.

- [Backlog e Casos de Uso](docs/backlog.md)
- [Diagrama de Classes](docs/class_diagram.jpg)
- [Modelo Lógico Oracle](docs/der_logico.jpg)
- [Modelo Lógico SQLite](docs/modelo_logico_sqlite.jpg)
- [Casos de Uso de Alto Nível](docs/use_case_diagram.svg)
- [Resultado da Pesquisa de Opinião](docs/user_research_results.md)
- [Documentação do Banco de Dados](database/README.md)

---

# Testes

## Backend

```powershell
cd backend
.\mvnw.cmd test
```

---

## Frontend

```powershell
cd frontend
npm ci
npm run build
npx tsc -p tsconfig.app.json --noEmit
```

---

## Mobile

```powershell
cd mobile
npm ci
npm test
npx tsc --noEmit
npx expo export --platform android --platform ios
```

---

# Tecnologias utilizadas

- React Native
- React
- TypeScript
- Expo
- SQLite
- Java
- Spring Boot
- Spring Data JPA
- Hibernate
- Spring Security
- JWT
- Oracle Database
- H2
- REST
- JSON
- Git
- GitHub

---

# Protótipo

- [Apresentação final do projeto](https://youtu.be/6xy3lcr84Jw)
- [Protótipo navegável do StudyMate](https://preview--academi-buddy-quest.lovable.app/login)

---

# Integrantes

- **Eduardo Aono** — Nuvem
- **Jamilly Okabe** — Banco de Dados
- **João Vitor** — Back-End
- **Kaue Guedes** — Mobile
- **Luiz Gustavo** — Front-End