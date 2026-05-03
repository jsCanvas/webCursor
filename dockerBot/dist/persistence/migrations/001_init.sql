-- dockerBot schema bootstrap
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS model_configs (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  base_url      TEXT NOT NULL,
  api_key_enc   TEXT NOT NULL,
  model         TEXT NOT NULL,
  is_active     INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_model_configs_active ON model_configs(is_active);

CREATE TABLE IF NOT EXISTS projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  git_url         TEXT,
  git_token_enc   TEXT,
  default_branch  TEXT NOT NULL DEFAULT 'main',
  workdir         TEXT NOT NULL,
  status          TEXT NOT NULL,
  last_error      TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id                  TEXT PRIMARY KEY,
  project_id          TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  claude_session_id   TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id          TEXT PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  run_id      TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id, created_at);

CREATE TABLE IF NOT EXISTS agent_runs (
  id                    TEXT PRIMARY KEY,
  session_id            TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  status                TEXT NOT NULL,
  started_at            TEXT NOT NULL,
  finished_at           TEXT,
  total_input_tokens    INTEGER,
  total_output_tokens   INTEGER,
  cost_usd              REAL,
  stop_reason           TEXT,
  error_message         TEXT
);

CREATE INDEX IF NOT EXISTS idx_runs_session ON agent_runs(session_id, started_at);

CREATE TABLE IF NOT EXISTS attachments (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  session_id  TEXT,
  filename    TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INTEGER NOT NULL,
  rel_path    TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id);

CREATE TABLE IF NOT EXISTS skills (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  body        TEXT NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 1,
  is_builtin  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mcp_servers (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  transport   TEXT NOT NULL,
  config_json TEXT NOT NULL,
  enabled     INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runtimes (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  status        TEXT NOT NULL,
  compose_file  TEXT,
  preview_url   TEXT,
  meta_json     TEXT,
  started_at    TEXT,
  stopped_at    TEXT,
  updated_at    TEXT NOT NULL
);
