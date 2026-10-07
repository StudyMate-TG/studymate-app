-- StudyMate / Oracle 21c. Execute conectado ao schema da aplicacao.
-- Reexecutavel: preserva tabelas, dados e sequences existentes.
-- Execute com a API parada. DDL Oracle faz commit implicito.
SET SQLBLANKLINES ON
SET DEFINE OFF
SET SERVEROUTPUT ON
WHENEVER OSERROR EXIT FAILURE
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK

DECLARE
    PROCEDURE criar_tabela(nome VARCHAR2, ddl VARCHAR2) IS
        quantidade NUMBER;
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_tables WHERE table_name = UPPER(nome);
        IF quantidade = 0 THEN
            EXECUTE IMMEDIATE ddl;
            DBMS_OUTPUT.PUT_LINE('Tabela criada: ' || nome);
        END IF;
    END;
BEGIN
    criar_tabela('usuario', q'~CREATE TABLE usuario (
    id_usuario NUMBER(38) NOT NULL,
    nome VARCHAR2(100) NOT NULL,
    email VARCHAR2(100) NOT NULL,
    senha_hash VARCHAR2(255) NOT NULL,
    data_criacao DATE DEFAULT SYSDATE NOT NULL,
    curso VARCHAR2(100),
    matricula VARCHAR2(50),
    instituicao VARCHAR2(100),
    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uk_usuario_email UNIQUE (email)
)~');
    criar_tabela('periodo_letivo', q'~CREATE TABLE periodo_letivo (
    id_periodo NUMBER(38) NOT NULL,
    id_usuario NUMBER(38) NOT NULL,
    nome VARCHAR2(50) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    status VARCHAR2(20) NOT NULL,
    CONSTRAINT pk_periodo_letivo PRIMARY KEY (id_periodo),
    CONSTRAINT fk_periodo_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario),
    CONSTRAINT ck_periodo_datas CHECK (data_fim >= data_inicio)
)~');
    criar_tabela('disciplina', q'~CREATE TABLE disciplina (
    id_disciplina NUMBER(38) NOT NULL,
    id_periodo NUMBER(38) NOT NULL,
    nome VARCHAR2(100) NOT NULL,
    professor VARCHAR2(100) NOT NULL,
    media_aprovacao NUMBER(4,2) NOT NULL,
    limite_faltas NUMBER(38) NOT NULL,
    CONSTRAINT pk_disciplina PRIMARY KEY (id_disciplina),
    CONSTRAINT fk_disciplina_periodo FOREIGN KEY (id_periodo)
        REFERENCES periodo_letivo (id_periodo),
    CONSTRAINT ck_disciplina_media CHECK (media_aprovacao BETWEEN 0 AND 10),
    CONSTRAINT ck_disciplina_limite_faltas CHECK (limite_faltas >= 0)
)~');
    criar_tabela('horario_aula', q'~CREATE TABLE horario_aula (
    id_horario NUMBER(38) NOT NULL,
    id_disciplina NUMBER(38) NOT NULL,
    dia_semana VARCHAR2(20) NOT NULL,
    hora_inicio VARCHAR2(5) NOT NULL,
    hora_fim VARCHAR2(5) NOT NULL,
    local VARCHAR2(100),
    CONSTRAINT pk_horario_aula PRIMARY KEY (id_horario),
    CONSTRAINT fk_horario_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina)
)~');
    criar_tabela('tarefa', q'~CREATE TABLE tarefa (
    id_tarefa NUMBER(38) NOT NULL,
    id_disciplina NUMBER(38) NOT NULL,
    titulo VARCHAR2(100) NOT NULL,
    tipo VARCHAR2(20) NOT NULL,
    descricao CLOB,
    data_hora_inicio DATE,
    data_entrega DATE NOT NULL,
    data_conclusao DATE,
    status VARCHAR2(20) NOT NULL,
    prioridade VARCHAR2(20) NOT NULL,
    xp_gerado NUMBER(38) NOT NULL,
    updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    deleted_at TIMESTAMP(6) WITH TIME ZONE,
    version NUMBER(19,0) DEFAULT 0 NOT NULL,
    CONSTRAINT pk_tarefa PRIMARY KEY (id_tarefa),
    CONSTRAINT fk_tarefa_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina),
    CONSTRAINT ck_tarefa_xp CHECK (xp_gerado >= 0)
)~');
    criar_tabela('avaliacao', q'~CREATE TABLE avaliacao (
    id_avaliacao NUMBER(38) NOT NULL,
    id_disciplina NUMBER(38) NOT NULL,
    nome VARCHAR2(100) NOT NULL,
    tipo VARCHAR2(20) NOT NULL,
    nota NUMBER(4,2),
    peso NUMBER(4,2) NOT NULL,
    data_avaliacao DATE NOT NULL,
    CONSTRAINT pk_avaliacao PRIMARY KEY (id_avaliacao),
    CONSTRAINT fk_avaliacao_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina),
    CONSTRAINT ck_avaliacao_nota CHECK (nota IS NULL OR nota BETWEEN 0 AND 10),
    CONSTRAINT ck_avaliacao_peso CHECK (peso > 0)
)~');
    criar_tabela('falta', q'~CREATE TABLE falta (
    id_falta NUMBER(38) NOT NULL,
    id_disciplina NUMBER(38) NOT NULL,
    data_falta DATE NOT NULL,
    quantidade_aulas NUMBER(38) NOT NULL,
    CONSTRAINT pk_falta PRIMARY KEY (id_falta),
    CONSTRAINT fk_falta_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina),
    CONSTRAINT ck_falta_quantidade CHECK (quantidade_aulas > 0)
)~');
    criar_tabela('notificacao', q'~CREATE TABLE notificacao (
    id_notificacao NUMBER(38) NOT NULL,
    id_usuario NUMBER(38) NOT NULL,
    id_disciplina NUMBER(38),
    titulo VARCHAR2(100) NOT NULL,
    mensagem CLOB NOT NULL,
    tipo VARCHAR2(20) NOT NULL,
    data_envio DATE DEFAULT SYSDATE NOT NULL,
    lida CHAR(1) DEFAULT 'N' NOT NULL,
    CONSTRAINT pk_notificacao PRIMARY KEY (id_notificacao),
    CONSTRAINT fk_notificacao_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario),
    CONSTRAINT fk_notificacao_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina),
    CONSTRAINT ck_notificacao_lida CHECK (lida IN ('S', 'N'))
)~');
    criar_tabela('conquista', q'~CREATE TABLE conquista (
    id_conquista NUMBER(38) NOT NULL,
    nome VARCHAR2(100) NOT NULL,
    descricao VARCHAR2(255) NOT NULL,
    icone VARCHAR2(100) NOT NULL,
    criterio VARCHAR2(50) NOT NULL,
    CONSTRAINT pk_conquista PRIMARY KEY (id_conquista)
)~');
    criar_tabela('usuario_conquista', q'~CREATE TABLE usuario_conquista (
    id_usuario NUMBER(38) NOT NULL,
    id_conquista NUMBER(38) NOT NULL,
    data_conquista DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT pk_usuario_conquista PRIMARY KEY (id_usuario, id_conquista),
    CONSTRAINT fk_usuario_conquista_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario),
    CONSTRAINT fk_usuario_conquista_conquista FOREIGN KEY (id_conquista)
        REFERENCES conquista (id_conquista)
)~');
    criar_tabela('progresso_estudante', q'~CREATE TABLE progresso_estudante (
    id_usuario NUMBER(38) NOT NULL,
    xp_total NUMBER(38) NOT NULL,
    nivel NUMBER(38) NOT NULL,
    sequencia_atual NUMBER(38) NOT NULL,
    maior_sequencia NUMBER(38) NOT NULL,
    data_ultimo_dia_sequencia DATE,
    CONSTRAINT pk_progresso_estudante PRIMARY KEY (id_usuario),
    CONSTRAINT fk_progresso_estudante_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario),
    CONSTRAINT ck_progresso_xp CHECK (xp_total >= 0),
    CONSTRAINT ck_progresso_nivel CHECK (nivel >= 1),
    CONSTRAINT ck_progresso_seq_atual CHECK (sequencia_atual >= 0),
    CONSTRAINT ck_progresso_maior_seq CHECK (maior_sequencia >= 0)
)~');
    criar_tabela('sync_request', q'~CREATE TABLE sync_request (
    client_tx_id VARCHAR2(36) NOT NULL,
    id_usuario NUMBER(38) NOT NULL,
    entity_type VARCHAR2(30) NOT NULL,
    operation VARCHAR2(10) NOT NULL,
    response_resource_id NUMBER(38),
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_sync_request PRIMARY KEY (client_tx_id),
    CONSTRAINT fk_sync_request_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario)
)~');
END;
/

-- Metadados do primeiro fluxo sincronizado: tarefas.
DECLARE
    quantidade NUMBER;
    PROCEDURE adicionar_coluna(nome VARCHAR2, definicao VARCHAR2) IS
        quantidade NUMBER;
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_tab_columns
        WHERE table_name = 'TAREFA' AND column_name = UPPER(nome);
        IF quantidade = 0 THEN
            EXECUTE IMMEDIATE 'ALTER TABLE tarefa ADD (' || definicao || ')';
        END IF;
    END;
BEGIN
    adicionar_coluna('version', 'version NUMBER(19,0) DEFAULT 0 NOT NULL');
    adicionar_coluna('updated_at', 'updated_at TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL');
    adicionar_coluna('deleted_at', 'deleted_at TIMESTAMP(6) WITH TIME ZONE');
    SELECT COUNT(*) INTO quantidade FROM user_constraints WHERE constraint_name = 'CK_TAREFA_VERSION';
    IF quantidade = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE tarefa ADD CONSTRAINT ck_tarefa_version CHECK (version >= 0)';
    END IF;
END;
/

-- O mesmo UUID pode existir em contas distintas; deduplicacao sempre por usuario.
-- Hash identifica reenvio com payload diferente. Resposta permite replay exato.
DECLARE
    quantidade NUMBER;
BEGIN
    SELECT COUNT(*) INTO quantidade FROM user_tables WHERE table_name = 'PROCESSED_SYNC_OPERATIONS';
    IF quantidade = 0 THEN
        EXECUTE IMMEDIATE q'~CREATE TABLE processed_sync_operations (
            id_usuario NUMBER(38,0) NOT NULL,
            client_operation_id VARCHAR2(36 CHAR) NOT NULL,
            entity_local_id VARCHAR2(36 CHAR) NOT NULL,
            entity_type VARCHAR2(30 CHAR) NOT NULL,
            operation VARCHAR2(10 CHAR) NOT NULL,
            request_hash VARCHAR2(64 CHAR) NOT NULL,
            response_resource_id NUMBER(38,0),
            response_version NUMBER(19,0),
            response_status NUMBER(3,0) NOT NULL,
            response_payload CLOB NOT NULL,
            processed_at TIMESTAMP(6) WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
            CONSTRAINT pk_processed_sync_operations PRIMARY KEY (id_usuario, client_operation_id),
            CONSTRAINT fk_processed_sync_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
            CONSTRAINT ck_processed_sync_operation CHECK (operation IN ('CREATE','UPDATE','DELETE')),
            CONSTRAINT ck_processed_sync_version CHECK (response_version >= 0),
            CONSTRAINT ck_processed_sync_http CHECK (response_status BETWEEN 200 AND 299),
            CONSTRAINT ck_processed_sync_json CHECK (response_payload IS JSON)
        )~';
    END IF;
END;
/

-- Nao reinicia sequences existentes; cria as ausentes acima do maior ID persistido.
DECLARE
    PROCEDURE criar_sequence(nome VARCHAR2, tabela VARCHAR2, coluna VARCHAR2, limite VARCHAR2) IS
        quantidade NUMBER;
        proximo NUMBER;
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_sequences WHERE sequence_name = UPPER(nome);
        IF quantidade = 0 THEN
            EXECUTE IMMEDIATE 'SELECT NVL(MAX(' || coluna || '),0)+1 FROM ' || tabela INTO proximo;
            EXECUTE IMMEDIATE 'CREATE SEQUENCE ' || nome || ' START WITH ' ||
                TO_CHAR(proximo,'FM99999999999999999999999999999999999999') ||
                ' INCREMENT BY 1 MAXVALUE ' || limite || ' NOCACHE NOCYCLE';
        END IF;
    END;
BEGIN
    criar_sequence('seq_usuario','usuario','id_usuario','2147483647');
    criar_sequence('seq_periodo_letivo','periodo_letivo','id_periodo','2147483647');
    criar_sequence('seq_disciplina','disciplina','id_disciplina','2147483647');
    criar_sequence('seq_falta','falta','id_falta','2147483647');
    criar_sequence('seq_horario_aula','horario_aula','id_horario','9223372036854775807');
    criar_sequence('seq_tarefa','tarefa','id_tarefa','9223372036854775807');
    criar_sequence('seq_avaliacao','avaliacao','id_avaliacao','9223372036854775807');
    criar_sequence('seq_notificacao','notificacao','id_notificacao','9223372036854775807');
    criar_sequence('seq_conquista','conquista','id_conquista','9223372036854775807');
END;
/

DECLARE
    PROCEDURE criar_indice(nome VARCHAR2, ddl VARCHAR2) IS
        quantidade NUMBER;
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_indexes WHERE index_name = UPPER(nome);
        IF quantidade = 0 THEN EXECUTE IMMEDIATE ddl; END IF;
    END;
BEGIN
    criar_indice('uk_usuario_email_ci', 'CREATE UNIQUE INDEX uk_usuario_email_ci ON usuario(LOWER(email))');
    criar_indice('ix_periodo_usuario', 'CREATE INDEX ix_periodo_usuario ON periodo_letivo(id_usuario)');
    criar_indice('ix_disciplina_periodo', 'CREATE INDEX ix_disciplina_periodo ON disciplina(id_periodo)');
    criar_indice('ix_tarefa_delta', 'CREATE INDEX ix_tarefa_delta ON tarefa(id_disciplina,updated_at,id_tarefa)');
    criar_indice('ix_tarefa_disc_upd', 'CREATE INDEX ix_tarefa_disc_upd ON tarefa(id_disciplina,updated_at)');
    criar_indice('ix_tarefa_deleted', 'CREATE INDEX ix_tarefa_deleted ON tarefa(deleted_at)');
    criar_indice('ix_falta_disciplina', 'CREATE INDEX ix_falta_disciplina ON falta(id_disciplina)');
    criar_indice('ix_avaliacao_disciplina', 'CREATE INDEX ix_avaliacao_disciplina ON avaliacao(id_disciplina)');
    criar_indice('ix_horario_disciplina', 'CREATE INDEX ix_horario_disciplina ON horario_aula(id_disciplina)');
    criar_indice('ix_notificacao_usuario', 'CREATE INDEX ix_notificacao_usuario ON notificacao(id_usuario)');
    criar_indice('ix_notificacao_disciplina', 'CREATE INDEX ix_notificacao_disciplina ON notificacao(id_disciplina)');
    criar_indice('ix_usuario_conquista', 'CREATE INDEX ix_usuario_conquista ON usuario_conquista(id_conquista)');
END;
/
@@../../migrations/003_auth_protection.sql
@@../../migrations/004_email_verification.sql
PROMPT StudyMate: DDL concluido.
