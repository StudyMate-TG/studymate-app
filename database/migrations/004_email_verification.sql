-- Execute no schema Oracle da aplicacao, depois de 003_auth_protection.sql.
WHENEVER SQLERROR EXIT SQL.SQLCODE ROLLBACK
DECLARE quantidade NUMBER;
BEGIN
 SELECT COUNT(*) INTO quantidade FROM user_tables WHERE table_name='EMAIL_VERIFICATION';
 IF quantidade=0 THEN
  EXECUTE IMMEDIATE q'~CREATE TABLE email_verification(
   token_hash VARCHAR2(64) PRIMARY KEY,
   purpose VARCHAR2(20) NOT NULL,
   id_usuario NUMBER(38),
   email VARCHAR2(100) NOT NULL,
   nome VARCHAR2(100),
   senha_hash VARCHAR2(255),
   expires_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
   used_at TIMESTAMP(6) WITH TIME ZONE,
   CONSTRAINT fk_email_verification_user FOREIGN KEY(id_usuario) REFERENCES usuario(id_usuario),
   CONSTRAINT ck_email_verification_purpose CHECK(purpose IN ('REGISTER','EMAIL_CHANGE'))
  )~';
 END IF;
 SELECT COUNT(*) INTO quantidade FROM user_indexes WHERE index_name='IX_EMAIL_VERIFICATION_EXP';
 IF quantidade=0 THEN EXECUTE IMMEDIATE 'CREATE INDEX ix_email_verification_exp ON email_verification(expires_at)'; END IF;
END;
/
