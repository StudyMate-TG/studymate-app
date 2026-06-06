CREATE TABLE usuario ( 
    id_usuario NUMBER,  
    nome VARCHAR2(100),  
    email VARCHAR2(100),  
    senha VARCHAR2(255),  
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  
    curso VARCHAR2(100),  
    semestre VARCHAR2(50),  
    matricula VARCHAR2(50),  
    instituicao VARCHAR2(100) 
    ); 

CREATE TABLE calendario (  
    id_calendario NUMBER,  
    id_usuario NUMBER,  
    nome VARCHAR2(100),  
    modo_visualizacao VARCHAR2(50),  
    data_inicio DATE, data_fim DATE  
    ); 

CREATE TABLE periodo_letivo (  
    id_periodo NUMBER,  
    id_calendario NUMBER,  
    nome VARCHAR2(100),  
    data_inicio DATE,  
    data_fim DATE,  
    status VARCHAR2(30) 
    ); 

CREATE TABLE disciplina (  
    id_disciplina NUMBER, 
    id_periodo NUMBER,  
    nome VARCHAR2(100),  
    professor VARCHAR2(100),  
    media_aprovacao NUMBER(4,2),  
    limite_faltas NUMBER 
    ); 

CREATE TABLE horario_aula ( 
    id_horario NUMBER, id_disciplina NUMBER,  
    dia_semana VARCHAR2(20), 
    hora_inicio VARCHAR2(8),  
    hora_fim VARCHAR2(8), 
    local VARCHAR2(100) 
    );

CREATE TABLE tarefa (  
    id_tarefa NUMBER,  
    id_disciplina NUMBER,  
    titulo VARCHAR2(150),  
    tipo VARCHAR2(50),  
    descricao CLOB,  
    data_hora_inicio TIMESTAMP,  
    data_hora_fim TIMESTAMP,  
    data_conclusao TIMESTAMP,  
    status VARCHAR2(30),  
    prioridade VARCHAR2(30), 
    xp_gerado NUMBER  
    ); 

CREATE TABLE avaliacao (  
    id_avaliacao NUMBER, 
    id_disciplina NUMBER,  
    nome VARCHAR2(100),  
    tipo VARCHAR2(50),  
    nota NUMBER(4,2), 
    peso NUMBER(4,2),  
    data_avaliacao DATE 
    ); 

CREATE TABLE falta ( 
    id_falta NUMBER, 
    id_disciplina NUMBER, 
    data_falta DATE, 
    quantidade_aulas NUMBER
    ); 

CREATE TABLE notificacao (  
    id_notificacao NUMBER,  
    id_usuario NUMBER,  
    id_disciplina NUMBER,  
    titulo VARCHAR2(100),  
    mensagem CLOB,  
    tipo VARCHAR2(50),
    data_envio TIMESTAMP,  
    lida CHAR(1) 
    ); 

CREATE TABLE progresso_estudante (  
    id_usuario NUMBER,  
    nivel NUMBER, 
    xp_atual NUMBER,  
    xp_proximo_nivel NUMBER, 
    sequencia_atual NUMBER, 
    maior_sequencia NUMBER, 
    data_ultimo_dia_sequencia DATE  
    );

CREATE TABLE badge (
    id_badge NUMBER,  
    nome VARCHAR2(100),  
    descricao CLOB, 
    icone VARCHAR2(255),  
    criterio CLOB  
    );

CREATE TABLE conquista (  
    id_usuario NUMBER,  
    id_badge NUMBER,  
    data_conquista TIMESTAMP DEFAULT CURRENT_TIMESTAMP  
    ); 