CREATE TABLE usuario (
 id_usuario INTEGER PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 email VARCHAR(100) NOT NULL UNIQUE,
 senha_hash VARCHAR(255) NOT NULL,
 data_criacao TIMESTAMP NOT NULL,
 curso VARCHAR(100),
 matricula VARCHAR(50),
 instituicao VARCHAR(100)
);
CREATE SEQUENCE seq_usuario START WITH 1 INCREMENT BY 1;
CREATE TABLE progresso_estudante (
 id_usuario INTEGER PRIMARY KEY REFERENCES usuario(id_usuario),
 xp_total INTEGER NOT NULL,
 nivel INTEGER NOT NULL,
 sequencia_atual INTEGER NOT NULL,
 maior_sequencia INTEGER NOT NULL,
 data_ultimo_dia_sequencia DATE
);
CREATE TABLE periodo_letivo (
 id_periodo INTEGER PRIMARY KEY,
 id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario),
 nome VARCHAR(50) NOT NULL,
 data_inicio DATE NOT NULL,
 data_fim DATE NOT NULL,
 status VARCHAR(20) NOT NULL,
 CHECK (data_fim >= data_inicio)
);
CREATE SEQUENCE seq_periodo_letivo START WITH 1 INCREMENT BY 1;
CREATE TABLE disciplina (
 id_disciplina INTEGER PRIMARY KEY,
 id_periodo INTEGER NOT NULL REFERENCES periodo_letivo(id_periodo),
 nome VARCHAR(100) NOT NULL,
 professor VARCHAR(100) NOT NULL,
 media_aprovacao DECIMAL(4,2) NOT NULL,
 limite_faltas INTEGER NOT NULL,
 CHECK (media_aprovacao BETWEEN 0 AND 10),
 CHECK (limite_faltas >= 0)
);
CREATE SEQUENCE seq_disciplina START WITH 1 INCREMENT BY 1;
CREATE TABLE falta (
 id_falta INTEGER PRIMARY KEY,
 id_disciplina INTEGER NOT NULL REFERENCES disciplina(id_disciplina),
 data_falta DATE NOT NULL,
 quantidade_aulas INTEGER NOT NULL
);
CREATE TABLE avaliacao (
 id_avaliacao BIGINT PRIMARY KEY,
 id_disciplina INTEGER NOT NULL REFERENCES disciplina(id_disciplina),
 nome VARCHAR(100) NOT NULL,
 tipo VARCHAR(20) NOT NULL,
 nota DECIMAL(4,2) CHECK (nota BETWEEN 0 AND 10),
 peso DECIMAL(4,2) NOT NULL CHECK (peso > 0),
 data_avaliacao DATE NOT NULL
);
CREATE SEQUENCE seq_avaliacao START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_falta START WITH 1 INCREMENT BY 1;
CREATE TABLE tarefa (
 id_tarefa INTEGER PRIMARY KEY,
 id_disciplina INTEGER NOT NULL REFERENCES disciplina(id_disciplina),
 titulo VARCHAR(100) NOT NULL, tipo VARCHAR(20) NOT NULL, descricao CLOB,
 data_hora_inicio TIMESTAMP, data_entrega TIMESTAMP NOT NULL, data_conclusao TIMESTAMP,
 status VARCHAR(20) NOT NULL, prioridade VARCHAR(20) NOT NULL, xp_gerado INTEGER NOT NULL
);
CREATE SEQUENCE seq_tarefa START WITH 1 INCREMENT BY 1;
CREATE TABLE auth_rate_limit_bucket (
 bucket_key VARCHAR(100) PRIMARY KEY, operation VARCHAR(16) NOT NULL,
 attempts INTEGER NOT NULL, window_end TIMESTAMP WITH TIME ZONE NOT NULL
);
INSERT INTO auth_rate_limit_bucket VALUES ('LOGIN:GLOBAL','LOGIN',0,TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00+00:00');
INSERT INTO auth_rate_limit_bucket VALUES ('REGISTER:GLOBAL','REGISTER',0,TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00+00:00');
INSERT INTO auth_rate_limit_bucket VALUES ('VERIFY:GLOBAL','VERIFY',0,TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00+00:00');
INSERT INTO auth_rate_limit_bucket VALUES ('EMAIL_CHANGE:GLOBAL','EMAIL_CHANGE',0,TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00+00:00');
CREATE TABLE email_verification (
 token_hash VARCHAR(64) PRIMARY KEY, purpose VARCHAR(20) NOT NULL,
 id_usuario INTEGER REFERENCES usuario(id_usuario), email VARCHAR(100) NOT NULL,
 nome VARCHAR(100), senha_hash VARCHAR(255), expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
 used_at TIMESTAMP WITH TIME ZONE
);
