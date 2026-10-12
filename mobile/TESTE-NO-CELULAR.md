# Testar a gamificação no celular

A gamificação foi implementada no aplicativo React Native (`mobile/`).
A interface web (`frontend/`) permanece na versão anterior.

## 1. Preparar computador e celular

- No computador Windows: JDK 17 ou superior e **Node.js 22.13 ou superior com npm**.
  Internet é necessária na primeira instalação das dependências.
- Conecte computador e celular à mesma rede do roteador. O computador pode usar
  cabo Ethernet e o celular Wi-Fi, desde que se comuniquem na mesma rede.
- **iPhone:** instale **Expo Go pela App Store**. O projeto foi alinhado ao
  **SDK 54**, suportado por essa versão, para permitir o teste sem assinatura
  Apple Developer. Não é necessário TestFlight ou compilar um IPA.
  Veja a [compatibilidade oficial](https://docs.expo.dev/troubleshooting/expo-go-version-mismatch/).
- **Android:** instale Expo Go compatível com **SDK 54** pelo
  [site oficial do Expo](https://expo.dev/go), caso a versão da Play Store use outro SDK.

## 2. Iniciar a API e o aplicativo

Na pasta raiz `studymate-app`, dê dois cliques em **`iniciar-mobile.cmd`**.
Espere a compilação da API e a exibição do QR Code. Mantenha a janela aberta.

O iniciador faz o seguinte:

1. Instala dependências mobile se necessário.
2. Inicia a API local na porta **8081**, acessível pela rede para este teste.
   Se a API estiver restrita ao computador, reinicia somente o processo gerenciado.
3. Configura `EXPO_PUBLIC_API_URL` com o IPv4 do computador.
4. Inicia o Expo/Metro na porta **8082**, usando Expo Go e conexão LAN.

O cache do Metro é limpo ao iniciar para que os módulos do SDK 54 sejam usados.

Se o IP escolhido for de uma VPN ou outra rede, abra PowerShell na raiz e use:

```powershell
.\iniciar-mobile.cmd -IpComputador 192.168.0.105
```

Substitua `192.168.0.105` pelo **IPv4 do Wi-Fi/Ethernet**, mostrado por `ipconfig`.
No celular, `localhost` é o próprio celular; `10.0.2.2` é específico do emulador Android.

## 3. Abrir no celular

No Android, abra Expo Go e use o leitor de QR Code. No iPhone, leia o QR Code
pela câmera e confirme a abertura no Expo Go. Se solicitada, permita ao Expo Go
acessar a rede local. O app deve abrir a tela de login do StudyMate.

Para conferir a conexão com a API, abra no navegador do celular:

```text
http://IP_DO_COMPUTADOR:8081/api/health
```

A resposta **401** com mensagem de token ausente é esperada nesse endereço,
pois ele exige login: isso confirma que a API está alcançável. Página sem resposta
ou conexão recusada indica problema de rede, IP, porta ou firewall.

## 4. Usar uma conta sem XP

A conta padrão `teste@studymate.local` / `StudyMate123!` está disponível,
mas pode ter atividade de testes anteriores. Para testar a primeira comemoração,
use a conta nova fornecida na conversa ou cadastre outra em **Cadastrar**.

No perfil local, os códigos de confirmação ficam no computador em
`backend/.local/emails/`. Abra o arquivo mais recente, copie o código para a
tela **Confirmar e-mail** e informe a senha escolhida. Depois entre na conta.
Nenhum e-mail é enviado pela internet nesse perfil.

Uma conta nova deve mostrar **0 XP**, **nível 1**, **0 dias de ofensiva** e medalhas
bloqueadas. O login sozinho não abre a comemoração.

Se a conta estiver vazia, vá a **Perfil → Períodos Letivos** para criar um período
e a **Disciplinas → + / Cadastrar disciplina** para cadastrar uma matéria nesse período.

## 5. Conferir as regras e a comemoração

Faça os testes nesta ordem, com a conexão ativa:

| Ação | Resultado esperado |
| --- | --- |
| Em Início, toque em `+` e `Registrar presença ou falta`; escolha a disciplina e registre presença | +20 XP, 1 dia de ofensiva e medalha `Presente!` |
| Observe a primeira atividade do dia | Mascote com olhos fechados, sorriso sem dentes e três pequenos fogos estáticos; botão `Continuar estudando` fecha a tela |
| Confira a data da presença | Data de hoje fixa, pelo horário de São Paulo; campo não aceita editar para ontem ou amanhã |
| Registre novamente presença na mesma disciplina hoje | API recusa duplicidade; continua com 20 XP |
| Crie uma tarefa com entrega hoje e, na aba Agenda, toque no círculo à esquerda dela para concluir | +30 XP; total 50, meta diária atingida, medalha `Primeiro passo`; ofensiva continua 1 dia |
| Toque no círculo para reabrir e concluir a mesma tarefa novamente | Continua com 50 XP; não há segunda recompensa nem nova comemoração |
| Vá a Conquistas | Medalhas conquistadas e progresso das bloqueadas refletem atividades reais |
| Conclua mais duas tarefas distintas | Total 110 XP, nível 2 e medalha `Aprendiz` |
| Registre uma falta | Salva a falta sem conceder XP nem preencher a ofensiva de outro dia |
| Feche/recarregue e entre novamente | XP e medalhas preservados; comemoração de hoje não se repete nesse aparelho |

Se preferir começar pela tarefa, a primeira conclusão também abre a comemoração
e concede 30 XP. Presença posterior concede mais 20 XP, sem repetir a comemoração.

Para a ofensiva de vários dias, faça uma atividade **amanhã**, após a meia-noite
de São Paulo: deve chegar a 2 dias. Ao perder um dia inteiro, a contagem atual
reinicia; melhor ofensiva e medalhas permanecem. Alterar a data do celular não
retroage a ofensiva: a API define o dia da recompensa.

## 6. Testar tarefa offline

1. Com conexão, crie uma tarefa distinta e espere ela sincronizar.
2. Ative modo avião **sem fechar o aplicativo já carregado**.
3. Conclua essa tarefa na Agenda. Ela fica concluída localmente, com
   sincronização pendente/erro; os 30 XP ainda não foram confirmados na API.
4. Desative modo avião, reconecte ao mesmo Wi-Fi e saia/volte à Agenda
   ou ao Início para disparar sincronização. Espere a atualização de última sincronização.
5. Confira os +30 XP, a tarefa concluída e a medalha/progresso correspondente.
   Reabrir a tela ou reenviar a fila não pode duplicar os pontos.

Se a conexão retornar em outro dia, os pontos e a ofensiva usam **o dia da
confirmação no servidor**, nunca o dia anterior. A presença exige conexão e é
registrada somente hoje; não há fila de presença retroativa.

## Se não conectar

- Confirme o IP exibido na janela, a mesma rede e as portas 8081/8082 livres.
- Se o Windows perguntar, permita **Java** e **Node.js** na rede **Privada**.
  Se houver bloqueio, permita TCP 8081 e 8082 apenas na rede privada/local;
  o iniciador não modifica regras do firewall automaticamente.
- Redes de convidados podem impedir comunicação entre aparelhos. Use a rede
  principal do roteador. VPN também pode selecionar o endereço errado.
- O túnel do Expo só entrega o bundle: não torna a API 8081 acessível. Para este
  tutorial, use LAN e confirme primeiro o endereço `/api/health` no celular.
- Se trocar o IP do computador, encerre o Expo com Ctrl+C e execute novamente
  `iniciar-mobile.cmd` com o IP correto, depois releia o QR Code.
- Erro de SDK: confira se as dependências mobile estão atualizadas com `npm ci`
  dentro de `mobile/` e se o Expo Go suporta **SDK 54**. No iPhone, use o Expo Go
  da App Store; no Android, escolha SDK 54 no site oficial.

## Encerrar

Pressione **Ctrl+C** na janela do Expo. Para encerrar os serviços locais,
execute `parar-studymate.cmd`. Os dados permanecem para o próximo teste.
Para voltar a testar somente pelo computador, execute `iniciar-studymate.cmd`:
a API volta a aceitar apenas conexões locais.

## Verificações no computador

Dentro de `mobile/`:

```powershell
npm test
npx tsc --noEmit
npx expo export --platform android --platform ios
```

Esses comandos verificam regras, concorrência da fila offline, TypeScript e os
bundles Android/iOS. O teste visual e os toques no aparelho devem seguir os passos
acima; a exportação não é uma instalação de APK/IPA.
