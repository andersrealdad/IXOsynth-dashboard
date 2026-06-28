-- 001_agents.sql — the fingerprint registry for the IxoSynth agent-connection layer.
-- See ../../../AGENT-CONNECTION-LAYER.md (Step 1). Apply to the shared Postgres registry.
-- One row per external agent identity. The credential_hash is the lookup path:
-- the validator hashes a presented key and resolves it to a stable agent_id + scope.
-- Idempotent: safe to re-run.

CREATE TABLE IF NOT EXISTS agents (
    agent_id        TEXT PRIMARY KEY,                      -- stable id: claude-web | codex-web | cursor-web | grok
    credential_hash TEXT        NOT NULL UNIQUE,           -- SHA-256 hex of the presented key; NEVER store the raw key
    scope           TEXT[]      NOT NULL DEFAULT '{}',     -- allow-list of MCP tool names this key may call (the "devbox")
    display_name    TEXT,                                  -- human label for the per-agent dashboard layer
    created         TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen       TIMESTAMPTZ,                           -- updated on each resolved call (presence)
    active          BOOLEAN     NOT NULL DEFAULT TRUE      -- soft-disable a key without deleting attribution history
);

-- The UNIQUE constraint on credential_hash already creates the btree index the
-- validator's lookup uses. A partial index keeps the hot path (active keys) tight.
CREATE INDEX IF NOT EXISTS idx_agents_credential_active
    ON agents (credential_hash) WHERE active;

-- Seed template (run separately with REAL hashes minted via bw; do NOT commit raw keys):
--   INSERT INTO agents (agent_id, credential_hash, scope, display_name) VALUES
--     ('grok',       '<sha256>', ARRAY['ixosynth_get_work_queue','ixosynth_get_roadmap','ixosynth_get_build_orders','ixosynth_get_dispatches','ixosynth_post_message','ixosynth_create_open_notebook_topic','ixosynth_claim','ixosynth_report'], 'Grok'),
--     ('claude-web',  '<sha256>', ARRAY['ixosynth_signin','ixosynth_heartbeat','ixosynth_signout','ixosynth_post_message','ixosynth_claim','ixosynth_report','ixosynth_get_work_queue','ixosynth_get_roadmap','ixosynth_get_build_orders','ixosynth_get_dispatches','ixosynth_create_open_notebook_topic'], 'Claude web'),
--     ('codex-web',   '<sha256>', ARRAY['ixosynth_get_work_queue','ixosynth_post_message','ixosynth_claim','ixosynth_report'], 'Codex web'),
--     ('cursor-web',  '<sha256>', ARRAY['ixosynth_get_work_queue','ixosynth_post_message','ixosynth_claim','ixosynth_report'], 'Cursor web')
--   ON CONFLICT (agent_id) DO UPDATE SET credential_hash = EXCLUDED.credential_hash, scope = EXCLUDED.scope;
