export const DATABASE_SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS local_tarefa (
    local_id TEXT PRIMARY KEY NOT NULL,
    server_id INTEGER UNIQUE,
    id_disciplina INTEGER NOT NULL,
    nome_disciplina TEXT NOT NULL DEFAULT '',
    titulo TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT,
    data_hora_inicio TEXT,
    data_entrega TEXT NOT NULL,
    data_conclusao TEXT,
    status TEXT NOT NULL,
    prioridade TEXT NOT NULL,
    xp_gerado INTEGER NOT NULL,
    server_version INTEGER,
    sync_status TEXT NOT NULL DEFAULT 'PENDING',
    updated_at_local TEXT NOT NULL,
    CONSTRAINT ck_local_tarefa_sync_status
        CHECK (sync_status IN ('PENDING', 'SYNCED', 'ERROR'))
);

CREATE TABLE IF NOT EXISTS sync_outbox (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_tx_id TEXT NOT NULL UNIQUE,
    entity_local_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,
    CONSTRAINT ck_sync_outbox_operation
        CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE', 'COMPLETE', 'REOPEN')),
    CONSTRAINT ck_sync_outbox_status
        CHECK (status IN ('PENDING', 'PROCESSING', 'SYNCED', 'ERROR')),
    CONSTRAINT ck_sync_outbox_attempts
        CHECK (attempts >= 0)
);

CREATE TABLE IF NOT EXISTS sync_metadata (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT
);

CREATE INDEX IF NOT EXISTS ix_local_tarefa_sync_status
    ON local_tarefa (sync_status);

CREATE INDEX IF NOT EXISTS ix_local_tarefa_updated_at
    ON local_tarefa (updated_at_local);

CREATE INDEX IF NOT EXISTS ix_sync_outbox_status_created
    ON sync_outbox (status, created_at);

CREATE INDEX IF NOT EXISTS ix_sync_outbox_entity
    ON sync_outbox (entity_type, entity_local_id);
`;

export const MIGRATION_ADD_COMPLETE_TO_SYNC_OUTBOX = `
DROP TABLE IF EXISTS sync_outbox_new;

CREATE TABLE sync_outbox_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_tx_id TEXT NOT NULL UNIQUE,
    entity_local_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,

    CONSTRAINT ck_sync_outbox_operation
        CHECK (
            operation IN (
                'CREATE',
                'UPDATE',
                'DELETE',
                'COMPLETE'
            )
        ),

    CONSTRAINT ck_sync_outbox_status
        CHECK (
            status IN (
                'PENDING',
                'PROCESSING',
                'SYNCED',
                'ERROR'
            )
        ),

    CONSTRAINT ck_sync_outbox_attempts
        CHECK (attempts >= 0)
);

INSERT INTO sync_outbox_new (
    id,
    client_tx_id,
    entity_local_id,
    entity_type,
    operation,
    payload,
    status,
    attempts,
    last_error,
    created_at
)
SELECT
    id,
    client_tx_id,
    entity_local_id,
    entity_type,
    operation,
    payload,
    status,
    attempts,
    last_error,
    created_at
FROM sync_outbox;

DROP TABLE sync_outbox;

ALTER TABLE sync_outbox_new
RENAME TO sync_outbox;

CREATE INDEX IF NOT EXISTS ix_sync_outbox_status_created
    ON sync_outbox (status, created_at);

CREATE INDEX IF NOT EXISTS ix_sync_outbox_entity
    ON sync_outbox (entity_type, entity_local_id);
`;

export const MIGRATION_ADD_REOPEN_TO_SYNC_OUTBOX = `
DROP TABLE IF EXISTS sync_outbox_new;

CREATE TABLE sync_outbox_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_tx_id TEXT NOT NULL UNIQUE,
    entity_local_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,

    CONSTRAINT ck_sync_outbox_operation
        CHECK (
            operation IN (
                'CREATE',
                'UPDATE',
                'DELETE',
                'COMPLETE',
                'REOPEN'
            )
        ),

    CONSTRAINT ck_sync_outbox_status
        CHECK (
            status IN (
                'PENDING',
                'PROCESSING',
                'SYNCED',
                'ERROR'
            )
        ),

    CONSTRAINT ck_sync_outbox_attempts
        CHECK (attempts >= 0)
);

INSERT INTO sync_outbox_new (
    id,
    client_tx_id,
    entity_local_id,
    entity_type,
    operation,
    payload,
    status,
    attempts,
    last_error,
    created_at
)
SELECT
    id,
    client_tx_id,
    entity_local_id,
    entity_type,
    operation,
    payload,
    status,
    attempts,
    last_error,
    created_at
FROM sync_outbox;

DROP TABLE sync_outbox;

ALTER TABLE sync_outbox_new
RENAME TO sync_outbox;

CREATE INDEX IF NOT EXISTS ix_sync_outbox_status_created
    ON sync_outbox (status, created_at);

CREATE INDEX IF NOT EXISTS ix_sync_outbox_entity
    ON sync_outbox (entity_type, entity_local_id);
`;