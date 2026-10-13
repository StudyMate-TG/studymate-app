-- Additive gamification migration. Run with the API stopped; safe to run again.
-- Reward origins and subject names remain historical snapshots after task/subject removal.
DECLARE
    quantidade NUMBER;
    PROCEDURE criar_tabela(nome VARCHAR2, ddl VARCHAR2) IS
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_tables WHERE table_name=UPPER(nome);
        IF quantidade=0 THEN EXECUTE IMMEDIATE ddl; END IF;
    END;
BEGIN
    criar_tabela('atividade_gamificacao', q'~CREATE TABLE atividade_gamificacao (
        id_atividade VARCHAR2(36 CHAR) NOT NULL,
        id_usuario NUMBER(38,0) NOT NULL,
        tipo VARCHAR2(10 CHAR) NOT NULL,
        origem_id NUMBER(38,0) NOT NULL,
        descricao VARCHAR2(240 CHAR) NOT NULL,
        xp NUMBER(10,0) NOT NULL,
        data_atividade DATE NOT NULL,
        registrada_em TIMESTAMP(6) WITH TIME ZONE NOT NULL,
        CONSTRAINT pk_atividade_gamificacao PRIMARY KEY (id_atividade),
        CONSTRAINT fk_atividade_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        CONSTRAINT ck_atividade_tipo CHECK (tipo IN ('TAREFA','PRESENCA')),
        CONSTRAINT ck_atividade_xp CHECK (xp>0),
        CONSTRAINT uk_atividade_origem UNIQUE (id_usuario,tipo,origem_id)
    )~');
    criar_tabela('medalha_estudante', q'~CREATE TABLE medalha_estudante (
        id_usuario NUMBER(38,0) NOT NULL,
        codigo VARCHAR2(32 CHAR) NOT NULL,
        desbloqueada_em TIMESTAMP(6) WITH TIME ZONE NOT NULL,
        CONSTRAINT pk_medalha_estudante PRIMARY KEY (id_usuario,codigo),
        CONSTRAINT fk_medalha_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
    )~');
    criar_tabela('presenca_aula', q'~CREATE TABLE presenca_aula (
        id_presenca NUMBER(38,0) NOT NULL,
        id_usuario NUMBER(38,0) NOT NULL,
        id_disciplina NUMBER(38,0) NOT NULL,
        nome_disciplina VARCHAR2(100 CHAR) NOT NULL,
        data_presenca DATE NOT NULL,
        xp_gerado NUMBER(10,0) NOT NULL,
        CONSTRAINT pk_presenca_aula PRIMARY KEY (id_presenca),
        CONSTRAINT fk_presenca_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        CONSTRAINT ck_presenca_xp CHECK (xp_gerado>0),
        CONSTRAINT uk_presenca_dia UNIQUE (id_usuario,id_disciplina,data_presenca)
    )~');
END;
/

DECLARE
    quantidade NUMBER;
    proximo NUMBER;
BEGIN
    SELECT COUNT(*) INTO quantidade FROM user_sequences WHERE sequence_name='SEQ_PRESENCA_AULA';
    IF quantidade=0 THEN
        SELECT NVL(MAX(id_presenca),0)+1 INTO proximo FROM presenca_aula;
        EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_presenca_aula START WITH ' ||
            TO_CHAR(proximo,'FM99999999999999999999999999999999999999') ||
            ' INCREMENT BY 1 MAXVALUE 2147483647 NOCACHE NOCYCLE';
    END IF;
    SELECT COUNT(*) INTO quantidade FROM user_indexes WHERE index_name='IX_ATIVIDADE_USUARIO_DIA';
    IF quantidade=0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX ix_atividade_usuario_dia ON atividade_gamificacao(id_usuario,data_atividade)';
    END IF;
END;
/
