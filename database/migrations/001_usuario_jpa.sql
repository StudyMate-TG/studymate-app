-- Execute com a aplicacao parada, conectado ao schema da aplicacao.
-- Interrompa se houver emails duplicados ignorando maiusculas/minusculas.
WHENEVER SQLERROR EXIT SQL.SQLCODE
DECLARE
    proximo_id NUMBER;
    existe NUMBER;
BEGIN
    SELECT COUNT(*) INTO existe FROM user_sequences WHERE sequence_name = 'SEQ_USUARIO';
    IF existe = 0 THEN
        SELECT NVL(MAX(id_usuario), 0) + 1 INTO proximo_id FROM usuario;
        EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_usuario START WITH ' ||
            TO_CHAR(proximo_id, 'FM99999999999999999999999999999999999999') ||
            ' INCREMENT BY 1 MAXVALUE 2147483647 NOCYCLE NOCACHE';
    END IF;
END;
/
DECLARE
    existe NUMBER;
BEGIN
    SELECT COUNT(*) INTO existe FROM user_indexes WHERE index_name = 'UK_USUARIO_EMAIL_CI';
    IF existe = 0 THEN
        EXECUTE IMMEDIATE 'CREATE UNIQUE INDEX uk_usuario_email_ci ON usuario (LOWER(email))';
    END IF;
END;
/
