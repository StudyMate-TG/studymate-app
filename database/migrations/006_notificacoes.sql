-- RF12: additive Oracle migration. Stop API instances before applying DDL.
-- Re-runnable; old notifications keep their messages, read flags and sending dates.
-- Legacy DATE values are interpreted in America/Sao_Paulo and backfilled as UTC.
DECLARE
    quantidade NUMBER;
    PROCEDURE adicionar_coluna(nome VARCHAR2, ddl VARCHAR2) IS
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_tab_columns
            WHERE table_name='NOTIFICACAO' AND column_name=UPPER(nome);
        IF quantidade=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE notificacao ADD (' || ddl || ')'; END IF;
    END;
BEGIN
    adicionar_coluna('criado_em', 'criado_em TIMESTAMP(6) WITH TIME ZONE');
    adicionar_coluna('previsto_para', 'previsto_para TIMESTAMP(6) WITH TIME ZONE');
    adicionar_coluna('processado_em', 'processado_em TIMESTAMP(6) WITH TIME ZONE');
    adicionar_coluna('cancelado_em', 'cancelado_em TIMESTAMP(6) WITH TIME ZONE');
    adicionar_coluna('origem_tipo', 'origem_tipo VARCHAR2(20 CHAR)');
    adicionar_coluna('origem_id', 'origem_id NUMBER(38,0)');
    adicionar_coluna('id_tarefa', 'id_tarefa NUMBER(38,0)');
    adicionar_coluna('id_avaliacao', 'id_avaliacao NUMBER(38,0)');
    adicionar_coluna('chave_deduplicacao', 'chave_deduplicacao VARCHAR2(200 CHAR)');
    -- Dynamic SQL is necessary when columns are first created by this block.
    EXECUTE IMMEDIATE q'~UPDATE notificacao SET
        criado_em = FROM_TZ(CAST(data_envio AS TIMESTAMP), 'America/Sao_Paulo') AT TIME ZONE 'UTC',
        previsto_para = FROM_TZ(CAST(data_envio AS TIMESTAMP), 'America/Sao_Paulo') AT TIME ZONE 'UTC',
        processado_em = FROM_TZ(CAST(data_envio AS TIMESTAMP), 'America/Sao_Paulo') AT TIME ZONE 'UTC',
        origem_tipo = 'LEGADO', origem_id = id_notificacao,
        chave_deduplicacao = 'LEGADO:' || TO_CHAR(id_notificacao, 'TM9')
        WHERE chave_deduplicacao IS NULL~';
END;
/
DECLARE
    quantidade NUMBER;
    PROCEDURE garantir_nao_nulo(nome VARCHAR2) IS
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_tab_columns
            WHERE table_name='NOTIFICACAO' AND column_name=UPPER(nome) AND nullable='Y';
        IF quantidade>0 THEN EXECUTE IMMEDIATE 'ALTER TABLE notificacao MODIFY (' || nome || ' NOT NULL)'; END IF;
    END;
    PROCEDURE criar_constraint(nome VARCHAR2, ddl VARCHAR2) IS
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_constraints
            WHERE table_name='NOTIFICACAO' AND constraint_name=UPPER(nome);
        IF quantidade=0 THEN EXECUTE IMMEDIATE 'ALTER TABLE notificacao ADD CONSTRAINT ' || nome || ' ' || ddl; END IF;
    END;
    PROCEDURE garantir_fk(coluna VARCHAR2, nome VARCHAR2, destino VARCHAR2, regra VARCHAR2) IS
    BEGIN
        -- Existing FK names may differ in databases initialized before migrations.
        FOR registro IN (
            SELECT c.constraint_name, c.delete_rule FROM user_constraints c
            JOIN user_cons_columns cc ON cc.constraint_name=c.constraint_name AND cc.table_name=c.table_name
            WHERE c.table_name='NOTIFICACAO' AND c.constraint_type='R' AND cc.column_name=UPPER(coluna)
        ) LOOP
            IF registro.delete_rule <> regra THEN
                EXECUTE IMMEDIATE 'ALTER TABLE notificacao DROP CONSTRAINT ' || DBMS_ASSERT.ENQUOTE_NAME(registro.constraint_name, FALSE);
            END IF;
        END LOOP;
        SELECT COUNT(*) INTO quantidade FROM user_constraints c
            JOIN user_cons_columns cc ON cc.constraint_name=c.constraint_name AND cc.table_name=c.table_name
            WHERE c.table_name='NOTIFICACAO' AND c.constraint_type='R' AND cc.column_name=UPPER(coluna);
        IF quantidade=0 THEN
            EXECUTE IMMEDIATE 'ALTER TABLE notificacao ADD CONSTRAINT ' || nome ||
                ' FOREIGN KEY (' || coluna || ') REFERENCES ' || destino || ' ON DELETE ' || regra;
        END IF;
    END;
BEGIN
    garantir_nao_nulo('criado_em');
    garantir_nao_nulo('previsto_para');
    garantir_nao_nulo('origem_tipo');
    garantir_nao_nulo('chave_deduplicacao');
    criar_constraint('uk_notificacao_chave', 'UNIQUE (chave_deduplicacao)');
    criar_constraint('ck_notificacao_estado', 'CHECK (processado_em IS NULL OR cancelado_em IS NULL)');
    garantir_fk('id_usuario','fk_notificacao_usuario','usuario(id_usuario)','CASCADE');
    garantir_fk('id_disciplina','fk_notificacao_disciplina','disciplina(id_disciplina)','SET NULL');
    garantir_fk('id_tarefa','fk_notificacao_tarefa','tarefa(id_tarefa)','SET NULL');
    garantir_fk('id_avaliacao','fk_notificacao_avaliacao','avaliacao(id_avaliacao)','SET NULL');
END;
/
DECLARE
    quantidade NUMBER;
    PROCEDURE criar_indice(nome VARCHAR2, ddl VARCHAR2) IS
    BEGIN
        SELECT COUNT(*) INTO quantidade FROM user_indexes WHERE index_name=UPPER(nome);
        IF quantidade=0 THEN EXECUTE IMMEDIATE ddl; END IF;
    END;
BEGIN
    criar_indice('ix_notificacao_historico', 'CREATE INDEX ix_notificacao_historico ON notificacao(id_usuario,processado_em DESC,id_notificacao DESC,lida)');
    criar_indice('ix_notificacao_pendente', 'CREATE INDEX ix_notificacao_pendente ON notificacao(processado_em,cancelado_em,previsto_para,id_usuario)');
    criar_indice('ix_notificacao_tarefa', 'CREATE INDEX ix_notificacao_tarefa ON notificacao(id_tarefa)');
    criar_indice('ix_notificacao_avaliacao', 'CREATE INDEX ix_notificacao_avaliacao ON notificacao(id_avaliacao)');
END;
/
COMMIT;
