# Autenticacao JWT do StudyMate

## Fluxo

1. POST /api/auth/register solicita confirmação de e-mail e retorna 202 genérico. A conta só é criada após POST /api/auth/verify-email com código e senha; veja seguranca-api.md.
2. POST /api/auth/login recebe email e senha. AuthService verifica BCrypt; credenciais incorretas retornam 401.
3. LoginResponse mantem os dados do usuario e acrescenta token, tipo=Bearer e expiresIn=3600.
4. Nas rotas protegidas, envie Authorization: Bearer <token>. Nao envie idUsuario em query/body. Os controllers extraem o subject do JWT validado; o Spring Security publica o principal no contexto de seguranca.
5. BearerTokenAuthenticationFilter, fornecido pelo Spring Security Resource Server, verifica o token atraves de JwtDecoder. Nao ha filtro JWT artesanal ou dependencia de um provedor externo.
6. Validacoes: assinatura HS256, algoritmo permitido, exp/nbf, emissor studymate-api, destinatario studymate-app, subject inteiro positivo e presenca real de iat/exp, emissao nao futura e expiracao posterior a emissao. O subject deve usar a representacao decimal canonica do ID, sem sinal ou zeros a esquerda. Nao basta decodificar Base64.
7. @PreAuthorize nos services exige que o ID utilizado seja o mesmo do contexto autenticado. Os repositories continuam filtrando propriedade por usuario, disciplina e periodo. O ID de outra conta nao concede permissao.

As rotas de login, cadastro e confirmação de e-mail e os preflights OPTIONS sao publicos; todas as demais rotas exigem token, inclusive health/db-health. A edicao de perfil preserva a rota /api/usuarios/{idUsuario}, mas so aceita o proprio ID (outro ID retorna 403). Os campos legados idUsuario dos DTOs de disciplina, periodo e tarefa sao ignorados na desserializacao e preenchidos pelo controller a partir do token. Nas outras rotas, query idUsuario nao determina a identidade.

## Configuracao

A chave e um segredo Base64 de ao menos 32 bytes aleatorios. Use JWT_SECRET no ambiente ou backend.local.properties, ignorado pelo Git. Nao existe chave padrao para producao; a aplicacao falha ao iniciar se ela nao estiver configurada corretamente. Uma chave aleatoria local foi gerada neste computador sem incluir o valor no repositorio. Configure a propria chave nos demais ambientes; mantenha-a estavel entre reinicios e igual nas replicas. A chave dos testes e exclusiva do perfil test.

security.jwt.issuer=studymate-api
security.jwt.audience=studymate-app
security.jwt.ttl-seconds=3600

Os tokens nao contem senha. O JWT e assinado, nao criptografado: nao adicione dados sensiveis nas claims. Use HTTPS fora do desenvolvimento local.

## Requisicoes prontas no IntelliJ

Abra backend/requests/autenticacao.http, preencha email e senha de uma conta cadastrada e execute primeiro o login. O arquivo salva o token em uma variavel do HTTP Client e o envia na chamada protegida seguinte. A terceira chamada verifica a resposta 401 sem token. Nao compartilhe credenciais reais no Git.

## Postman

POST http://localhost:8081/api/auth/login
Content-Type: application/json

```json
{"email":"ana@example.com","senha":"sua-senha"}
```

Copie token da resposta. Em Authorization selecione Bearer Token e cole somente o token.

GET http://localhost:8081/api/avaliacoes?idDisciplina=1
GET http://localhost:8081/api/disciplinas

O body de cadastro de disciplina nao precisa de idUsuario; idPeriodo e opcional. Tarefa e periodo tambem usam a conta do token. Nota: possuir um token valido nao autoriza acessar disciplinas de outra conta.

## Respostas e limites

- 401: login incorreto, token ausente, invalido ou expirado. Login novamente para obter token novo.
- 403: identidade enviada para um service ou perfil difere da autenticada.
- Recurso de terceiro: nao retorna seus dados; mantem 400/404 conforme contrato existente do modulo.

API stateless, sem cookies de sessao e sem refresh token nesta etapa. Logout do app remove o token local; um token ja emitido continua valido ate expirar. Uma troca de chave invalida tokens anteriores. Mobile deve armazenar o token no Expo SecureStore e enviar o header em cada chamada. Os clientes web/mobile enviam o token e mantêm JWT apenas na memória da sessão; recarregar ou reabrir exige novo login.

## Validacao

mvnw.cmd test com JDK 17. JwtSecurityTests usa JWTs reais e toda a cadeia de filtros: login, validade, assinatura incorreta, emissor/destinatario incorretos, subject invalido, ausencia de expiracao, chamadas sem token, manipulacao de idUsuario, acesso entre contas e preflight CORS. Os demais testes continuam validando os fluxos anteriores com identidade autenticada.

Documentacao oficial: https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html

Exemplo do campo de autenticacao retornado pelo login (junto com os dados do usuario):

{"token":"<JWT emitido pelo servidor>","tipo":"Bearer","expiresIn":3600}

Os testes tambem cobrem token sem iat, iat futuro, nbf futuro, claims ausentes, identidade nao canonica, algoritmo none, assinatura adulterada, token na query e Basic. Tokens validos tem jti distinto a cada login e nao incluem senha nas claims.
