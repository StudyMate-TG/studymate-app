CREATE TABLE usuario (
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
);

CREATE TABLE periodo_letivo (
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
);

CREATE TABLE disciplina (
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
);

CREATE TABLE horario_aula (
    id_horario NUMBER(38) NOT NULL,
    id_disciplina NUMBER(38) NOT NULL,
    dia_semana VARCHAR2(20) NOT NULL,
    hora_inicio VARCHAR2(5) NOT NULL,
    hora_fim VARCHAR2(5) NOT NULL,
    local VARCHAR2(100),

    CONSTRAINT pk_horario_aula PRIMARY KEY (id_horario),
    CONSTRAINT fk_horario_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina)
);

CREATE TABLE tarefa (
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

    CONSTRAINT pk_tarefa PRIMARY KEY (id_tarefa),
    CONSTRAINT fk_tarefa_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina),
    CONSTRAINT ck_tarefa_xp CHECK (xp_gerado >= 0)
);

CREATE TABLE avaliacao (
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
);

CREATE TABLE falta (
    id_falta NUMBER(38) NOT NULL,
    id_disciplina NUMBER(38) NOT NULL,
    data_falta DATE NOT NULL,
    quantidade_aulas NUMBER(38) NOT NULL,

    CONSTRAINT pk_falta PRIMARY KEY (id_falta),
    CONSTRAINT fk_falta_disciplina FOREIGN KEY (id_disciplina)
        REFERENCES disciplina (id_disciplina),
    CONSTRAINT ck_falta_quantidade CHECK (quantidade_aulas > 0)
);

CREATE TABLE notificacao (
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
);

CREATE TABLE conquista (
    id_conquista NUMBER(38) NOT NULL,
    nome VARCHAR2(100) NOT NULL,
    descricao VARCHAR2(255) NOT NULL,
    icone VARCHAR2(100) NOT NULL,
    criterio VARCHAR2(50) NOT NULL,

    CONSTRAINT pk_conquista PRIMARY KEY (id_conquista)
);

CREATE TABLE usuario_conquista (
    id_usuario NUMBER(38) NOT NULL,
    id_conquista NUMBER(38) NOT NULL,
    data_conquista DATE DEFAULT SYSDATE NOT NULL,

    CONSTRAINT pk_usuario_conquista PRIMARY KEY (id_usuario, id_conquista),
    CONSTRAINT fk_usuario_conquista_usuario FOREIGN KEY (id_usuario)
        REFERENCES usuario (id_usuario),
    CONSTRAINT fk_usuario_conquista_conquista FOREIGN KEY (id_conquista)
        REFERENCES conquista (id_conquista)
);

CREATE TABLE progresso_estudante (
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
);