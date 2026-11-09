DECLARE
    quantidade NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO quantidade
    FROM user_tab_columns
    WHERE table_name = 'PRESENCA_AULA'
      AND column_name = 'QUANTIDADE_AULAS';

    IF quantidade = 0 THEN
        EXECUTE IMMEDIATE '
            ALTER TABLE presenca_aula
            ADD (
                quantidade_aulas NUMBER(38,0)
                DEFAULT 1
                NOT NULL
            )
        ';
    END IF;

    SELECT COUNT(*)
    INTO quantidade
    FROM user_constraints
    WHERE constraint_name = 'CK_PRESENCA_QUANTIDADE';

    IF quantidade = 0 THEN
        EXECUTE IMMEDIATE '
            ALTER TABLE presenca_aula
            ADD CONSTRAINT ck_presenca_quantidade
            CHECK (quantidade_aulas > 0)
        ';
    END IF;
END;
/