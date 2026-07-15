-- Migration number: 0001 	 Create ai tables (companies, files_index, chat_threads, chat_messages, pending_actions)

CREATE TABLE companies (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Single tenant for now. Every row and every vector carries company_uid so that
-- going multi-company later is a filter change, not a reindex.
INSERT INTO companies (uid, name) VALUES ('00000000000000000000000000000001', 'Default');

-- Ingestion ledger. R2 holds the bytes and remains the source of truth for which
-- files exist; this table tracks what has been indexed and how.
CREATE TABLE files_index (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    r2_key TEXT NOT NULL UNIQUE,
    company_uid TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('company', 'personal', 'module')),
    source TEXT DEFAULT '',
    owner_uid TEXT DEFAULT '',
    file_name TEXT NOT NULL,
    content_type TEXT DEFAULT '',
    size INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    chunk_count INTEGER DEFAULT 0,
    error TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_files_index_scope ON files_index (company_uid, scope, source);
CREATE INDEX idx_files_index_owner ON files_index (owner_uid);

CREATE TABLE chat_threads (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    company_uid TEXT NOT NULL,
    user_uid TEXT NOT NULL,
    title TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_chat_threads_user ON chat_threads (user_uid, updated_at DESC);

CREATE TABLE chat_messages (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    thread_uid TEXT NOT NULL REFERENCES chat_threads (uid) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'tool')),
    content TEXT DEFAULT '',
    citations TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_chat_messages_thread ON chat_messages (thread_uid, created_at);

-- A write tool the model proposed. Nothing touches the management db until the
-- user confirms. Doubles as the audit log of every action the AI took or proposed.
CREATE TABLE pending_actions (
    uid TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    thread_uid TEXT NOT NULL REFERENCES chat_threads (uid) ON DELETE CASCADE,
    message_uid TEXT DEFAULT '',
    user_uid TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    input TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected', 'executed', 'failed')),
    result TEXT DEFAULT '',
    error TEXT DEFAULT '',
    created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    executed_at TEXT DEFAULT ''
);

CREATE INDEX idx_pending_actions_thread ON pending_actions (thread_uid, created_at);
