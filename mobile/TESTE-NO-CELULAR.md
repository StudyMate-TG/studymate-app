# Testar o StudyMate no celular

Este documento apresenta o procedimento para executar e validar o aplicativo StudyMate em um celular físico utilizando Expo Go, incluindo autenticação, gamificação e funcionamento offline das tarefas.

## 1. Preparar computador e celular

- No computador Windows, utilize JDK 17 ou superior e Node.js 22.13 ou superior com npm.
- Internet é necessária na primeira instalação das dependências.
- Conecte o computador e o celular à mesma rede do roteador. O computador pode utilizar cabo Ethernet e o celular Wi-Fi, desde que os dispositivos consigam se comunicar pela mesma rede.
- No Windows, se estiver utilizando uma rede de confiança, abra **Configurações → Rede e Internet → Ethernet/Wi-Fi → rede conectada** e selecione o perfil **Privado**.
- No iPhone, utilize o Expo Go compatível com o SDK 57 utilizado pelo projeto.
- No Android, utilize uma versão do Expo Go compatível com o SDK 57.

### Login no Expo

Entre no Expo Go com uma conta Expo.

No computador, execute:

```powershell
npx expo login
```

Faça login com a mesma conta utilizada no Expo Go.

Esse login é utilizado apenas pelo Expo. A conta do StudyMate será utilizada posteriormente dentro do aplicativo.

Caso ainda não possua uma conta Expo, crie uma pelo site oficial:

https://expo.dev/signup

---

## 2. Iniciar a API e o aplicativo

### Iniciar a API

Abra um PowerShell na raiz do projeto:

```powershell
cd backend

$env:SPRING_PROFILES_ACTIVE="local"
$env:SERVER_ADDRESS="0.0.0.0"
$env:JWT_SECRET=[Convert]::ToBase64String(
    [System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64)
)

.\mvnw.cmd spring-boot:run
```

A API ficará disponível na porta:

```text
8081
```

Mantenha esse terminal aberto durante os testes.

### Descobrir o IP do computador

Abra outro PowerShell e execute:

```powershell
ipconfig
```

Localize o endereço IPv4 da conexão Wi-Fi ou Ethernet utilizada pelo computador.

Exemplo:

```text
192.168.0.105
```

### Iniciar o aplicativo mobile

Abra outro PowerShell:

```powershell
cd mobile
npm ci

$env:EXPO_PUBLIC_API_URL="http://192.168.0.105:8081/api"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="192.168.0.105"

npx expo start --lan --port 8082
```

Substitua `192.168.0.105` pelo IPv4 do seu computador.

O computador e o celular devem estar conectados à mesma rede local.

Caso o Expo solicite autenticação:

```powershell
npx expo login
```

Utilize no computador a mesma conta utilizada no Expo Go.

---

## 3. Abrir no celular

No Android, abra o Expo Go e utilize o leitor de QR Code.

No iPhone, leia o QR Code pela câmera e confirme a abertura no Expo Go.

Caso seja solicitado, permita que o Expo Go acesse a rede local.

O aplicativo deverá abrir a tela de login do StudyMate.

Se aparecer um aviso de autenticação do Expo, confirme que o computador e o Expo Go utilizam a mesma conta.

Se necessário:

1. encerre o Expo com `Ctrl + C`;
2. execute novamente:

```powershell
npx expo login
```

3. reinicie o Expo:

```powershell
npx expo start --lan --port 8082
```

Para conferir se o celular consegue alcançar a API, acesse pelo navegador do aparelho:

```text
http://IP_DO_COMPUTADOR:8081/api/health
```

Exemplo:

```text
http://192.168.0.105:8081/api/health
```

Se o servidor retornar uma resposta HTTP da aplicação, a comunicação entre o celular e o backend está funcionando.

Erro de conexão, timeout ou conexão recusada indicam possível problema de rede, IP, porta ou firewall.

---

## 4. Usar uma conta sem XP

A conta padrão:

```text
E-mail: teste@studymate.local
Senha: StudyMate123!
```

pode possuir atividades de testes anteriores.

Para testar a gamificação desde o início, é recomendável cadastrar uma nova conta.

Na tela do StudyMate, utilize as credenciais da conta do StudyMate, e não as credenciais da conta Expo.

No perfil local, os códigos de confirmação de e-mail são armazenados em:

```text
backend/.local/emails/
```

Abra o arquivo mais recente, copie o código e informe-o na tela **Confirmar e-mail**, juntamente com a senha escolhida.

Nenhum e-mail é enviado pela internet no perfil local.

Uma conta nova deverá iniciar com:

```text
0 XP
Nível 1
0 dias de ofensiva
Medalhas bloqueadas
```

O login sozinho não deve abrir a comemoração de gamificação.

Caso a conta ainda não possua dados acadêmicos:

1. acesse **Perfil → Períodos Letivos** e crie um período;
2. acesse **Disciplinas → Cadastrar disciplina** e cadastre uma disciplina vinculada ao período.

---

## 5. Conferir gamificação

Realize os testes abaixo com conexão ativa:

| Ação | Resultado esperado |
| --- | --- |
| Registrar presença em uma disciplina | +20 XP, 1 dia de ofensiva e medalha relacionada à primeira presença |
| Observar a primeira atividade válida do dia | Exibição da comemoração do StudyMate |
| Conferir a data da presença | A data corresponde ao dia atual no horário de São Paulo |
| Registrar novamente presença na mesma disciplina no mesmo dia | A API recusa a duplicidade e nenhum XP adicional é concedido |
| Criar uma tarefa e concluí-la | +30 XP |
| Reabrir e concluir novamente a mesma tarefa | Nenhum XP adicional é concedido |
| Acessar Conquistas | Medalhas conquistadas e progresso refletem as atividades registradas |
| Concluir mais duas tarefas distintas após os testes anteriores | XP e nível são atualizados conforme as regras de gamificação |
| Registrar uma falta | A falta é salva sem conceder XP |
| Fechar o aplicativo, abrir novamente e entrar na conta | XP, medalhas e histórico permanecem registrados |

A primeira conclusão de uma tarefa concede:

```text
30 XP
```

Uma presença válida concede:

```text
20 XP
```

A meta diária é:

```text
30 XP
```

Um novo nível é alcançado a cada:

```text
100 XP
```

Reabrir e concluir novamente uma tarefa já recompensada não concede uma segunda recompensa.

A mesma operação reenviada pela sincronização também não deve duplicar os pontos.

### Ofensiva

Uma atividade válida realizada no dia mantém a ofensiva.

Para testar uma sequência de vários dias, realize uma nova atividade após a mudança do dia no horário de `America/Sao_Paulo`.

Se um dia inteiro for perdido, a sequência atual é reiniciada, mas o recorde e as medalhas conquistadas permanecem.

A alteração manual da data do celular não deve permitir criar atividades retroativas, pois o servidor determina a data utilizada pela gamificação.

---

## 6. Testar tarefas offline

### Concluir uma tarefa sem internet

1. Com conexão ativa, crie uma tarefa e aguarde a sincronização.
2. Ative o modo avião sem fechar o aplicativo.
3. Na Agenda, conclua a tarefa.
4. A tarefa deverá ser atualizada localmente.
5. A operação deverá permanecer pendente de sincronização.
6. Os 30 XP ainda não deverão ser confirmados pela API.
7. Desative o modo avião.
8. Reconecte o celular à mesma rede Wi-Fi.
9. Volte à Agenda ou ao Início para permitir uma nova tentativa de sincronização.
10. Aguarde a atualização do estado de sincronização.
11. Confira se a tarefa foi confirmada no servidor e se os 30 XP foram concedidos.

Reabrir telas ou reenviar a mesma operação não deve duplicar os pontos.

### Outras operações offline

Também podem ser verificadas operações de:

```text
CREATE
UPDATE
DELETE
COMPLETE
REOPEN
```

As alterações realizadas sem conexão devem permanecer armazenadas localmente até que possam ser enviadas ao backend.

Se a conexão retornar apenas em outro dia, XP e ofensiva utilizam o dia em que a operação é confirmada pelo servidor.

O registro de presença não utiliza a fila offline e deve ser realizado com conexão ativa.

---

## 7. Se não conectar

Confira:

- se o IP utilizado é o IPv4 correto da conexão Wi-Fi ou Ethernet;
- se computador e celular estão na mesma rede;
- se as portas `8081` e `8082` estão disponíveis;
- se Java e Node.js possuem permissão no Firewall do Windows para redes privadas;
- se a rede do Windows está configurada como **Privada**;
- se o roteador permite comunicação entre os dispositivos da rede;
- se alguma VPN está interferindo na seleção do endereço de rede.

Redes de convidados podem impedir a comunicação direta entre dispositivos.

O túnel do Expo pode disponibilizar o bundle do aplicativo, mas não torna automaticamente a API local da porta `8081` acessível. Para este procedimento, utilize conexão LAN.

### Se o IP do computador mudar

Encerre o Expo:

```text
Ctrl + C
```

Configure novamente:

```powershell
$env:EXPO_PUBLIC_API_URL="http://NOVO_IP:8081/api"
$env:REACT_NATIVE_PACKAGER_HOSTNAME="NOVO_IP"
```

E reinicie:

```powershell
npx expo start --lan --port 8082
```

Leia novamente o QR Code.

### Problema de versão do Expo

Confirme que a versão instalada do Expo Go é compatível com o SDK utilizado pelo projeto.

Dentro de `mobile/`, execute:

```powershell
npm ci
npx expo start --lan --port 8082
```

Depois leia novamente o QR Code.

---

## 8. Encerrar

No terminal do Expo, pressione:

```text
Ctrl + C
```

No terminal do backend, pressione também:

```text
Ctrl + C
```

Os dados persistidos pelo ambiente local permanecem disponíveis para os próximos testes.

---

## 9. Verificações no computador

Dentro de `mobile/`, execute:

```powershell
npm test
npx tsc --noEmit
npx expo export --platform android --platform ios
```

Esses comandos verificam os testes automatizados, a validação TypeScript e a geração dos bundles Android e iOS.

A exportação do Expo não representa a instalação de um APK ou IPA.

Os fluxos visuais, comportamento offline, sincronização e gamificação também devem ser verificados diretamente no aparelho.