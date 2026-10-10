-- Execute no schema da aplicacao antes de iniciar a API com a protecao habilitada.
-- Nao remove tabelas nem reinicia contadores existentes ao executar novamente.
WHENEVER SQLERROR EXIT SQL.SQLCODE
DECLARE
    existe NUMBER;
BEGIN
    SELECT COUNT(*) INTO existe FROM user_tables WHERE table_name = 'AUTH_RATE_LIMIT_BUCKET';
    IF existe = 0 THEN
        EXECUTE IMMEDIATE '
            CREATE TABLE auth_rate_limit_bucket (
                bucket_key VARCHAR2(100) NOT NULL,
                operation VARCHAR2(16) NOT NULL,
                attempts NUMBER(10) DEFAULT 0 NOT NULL,
                window_end TIMESTAMP WITH TIME ZONE NOT NULL,
                CONSTRAINT pk_auth_rate_limit_bucket PRIMARY KEY (bucket_key),
                CONSTRAINT ck_auth_rate_limit_attempts CHECK (attempts >= 0),
                CONSTRAINT ck_auth_rate_limit_operation CHECK (
                    operation IN (''LOGIN'', ''REGISTER'', ''VERIFY'', ''EMAIL_CHANGE'')
                )
            )';
    END IF;
    SELECT COUNT(*) INTO existe FROM user_indexes WHERE index_name = 'IDX_AUTH_RATE_LIMIT_EXPIRY';
    IF existe = 0 THEN
        EXECUTE IMMEDIATE 'CREATE INDEX idx_auth_rate_limit_expiry
            ON auth_rate_limit_bucket (operation, window_end)';
    END IF;
END;
/

MERGE INTO auth_rate_limit_bucket target
USING (
    SELECT 'LOGIN:GLOBAL' bucket_key, 'LOGIN' operation FROM dual
    UNION ALL SELECT 'REGISTER:GLOBAL', 'REGISTER' FROM dual
    UNION ALL SELECT 'VERIFY:GLOBAL', 'VERIFY' FROM dual
    UNION ALL SELECT 'EMAIL_CHANGE:GLOBAL', 'EMAIL_CHANGE' FROM dual
) source
ON (target.bucket_key = source.bucket_key)
WHEN NOT MATCHED THEN INSERT (bucket_key, operation, attempts, window_end)
VALUES (source.bucket_key, source.operation, 0,
    TO_TIMESTAMP_TZ('2000-01-01 00:00:00 +00:00', 'YYYY-MM-DD HH24:MI:SS TZH:TZM'));

COMMIT;
