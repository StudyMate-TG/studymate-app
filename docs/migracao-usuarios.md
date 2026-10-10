# Migracao do fluxo de usuarios

Cadastro, login, periodos e disciplinas agora usam repositories JPA.
Nao ha autenticacao de sessao/token nesta etapa.

## Banco Oracle

Com a aplicacao parada e usando o schema da aplicacao:
1. Se o banco estiver vazio, execute database/scripts/scripts/oracle_schema.sql.
2. Execute database/migrations/001_usuario_jpa.sql antes de iniciar esta versao.
3. Execute database/migrations/002_periodos_disciplinas_jpa.sql para criar as sequences academicas.

A migration cria seq_usuario acima do maior ID existente e um indice de email sem
distincao entre maiusculas e minusculas. Se houver emails duplicados desse modo,
resolva-os antes de aplicar. Nao recrie nem reinicie uma sequence existente.
Nao execute a versao antiga do cadastro (MAX + 1) junto com a nova.

## Senhas existentes

Novos cadastros usam BCrypt. O banco local verificado estava vazio.
Em outros bancos, senhas antigas em texto simples nao sao aceitas pelo novo login:
e necessario planejar conversao controlada ou redefinicao antes da implantacao.
Nao existe fallback para comparar senha em texto simples.

## Contratos

As rotas e campos de resposta foram preservados, incluindo mensagem nos erros.
Cadastro/login bem-sucedidos continuam com HTTP 200.
Usuario inexistente na edicao: 404. Email em uso: 409. Entrada invalida: 400.
A edicao substitui nome, email, curso, matricula e instituicao; campos opcionais
nulos ou em branco sao limpos. ID, senha e data de criacao sao preservados.

## Testes

Execute backend/mvnw.cmd test dentro de backend, com JAVA_HOME apontando ao JDK 17.
Os testes usam H2 isolado, sem depender do Oracle local nem alterar seus dados.

## Services academicos

PeriodoLetivoService e DisciplinaService usam transacoes e bloqueiam a linha do usuario nas alteracoes para serializar cadastros concorrentes. Um novo periodo ativo inativa os demais. A disciplina sem periodo usa o ativo ou cria um periodo padrao de hoje ate seis meses depois. A edicao preserva o periodo original da disciplina.

As consultas restringem os registros ao idUsuario informado; isso nao substitui autenticacao. Exclusoes com registros vinculados sao recusadas. Os IDs usam sequences Oracle, sem MAX + 1 a cada cadastro. Pare versoes antigas antes de migrar.

Os testes academicos cobrem CRUD, busca, vinculos, rollback e criacao concorrente do periodo padrao.
