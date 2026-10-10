-- Execute com as instancias antigas da API paradas, no schema da aplicacao.
WHENEVER SQLERROR EXIT SQL.SQLCODE
DECLARE
    proximo_id NUMBER;
    existe NUMBER;
BEGIN
    SELECT COUNT(*) INTO existe FROM user_sequences WHERE sequence_name = 'SEQ_PERIODO_LETIVO';
    IF existe = 0 THEN
        SELECT NVL(MAX(id_periodo), 0) + 1 INTO proximo_id FROM periodo_letivo;
        EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_periodo_letivo START WITH ' ||
            TO_CHAR(proximo_id, 'FM99999999999999999999999999999999999999') ||
            ' INCREMENT BY 1 MAXVALUE 2147483647 NOCYCLE NOCACHE';
    END IF;
    SELECT COUNT(*) INTO existe FROM user_sequences WHERE sequence_name = 'SEQ_DISCIPLINA';
    IF existe = 0 THEN
        SELECT NVL(MAX(id_disciplina), 0) + 1 INTO proximo_id FROM disciplina;
        EXECUTE IMMEDIATE 'CREATE SEQUENCE seq_disciplina START WITH ' ||
            TO_CHAR(proximo_id, 'FM99999999999999999999999999999999999999') ||
            ' INCREMENT BY 1 MAXVALUE 2147483647 NOCYCLE NOCACHE';
    END IF;
END;
/
