# Agent registry — step 1 of AGENT-CONNECTION-LAYER.md

The fingerprint layer's foundation: a Postgres `agents` table + a key→`agent_id`
validator. Everything else (per-agent dashboard layers, provable handoffs) builds on this.

## Files
- `migrations/001_agents.sql` — the `agents` table (`agent_id`, `credential_hash`, `scope[]`,
  `display_name`, `created`, `last_seen`, `active`). Indexed on `credential_hash` (UNIQUE +
  partial active index). Idempotent.
- `validator.py` — `hash_credential()`, `AgentValidator.resolve()/authorize()`, `register_agent()`.

## Deploy (Hermes, at the seam)
1. Apply the migration to the **shared Postgres registry**:
   `psql "$AGENTS_DSN" -f migrations/001_agents.sql`
2. Mint one key per agent (via bw) and register each — raw key passed once, only its hash stored:
   ```python
   from validator import register_agent
   register_agent(RAW_KEY, "claude-web", ["ixosynth_signin","ixosynth_claim", ...], "Claude web")
   ```
3. Wire into `ixosynth-mcp/server.py` — resolve identity from the key, not the arg:
   ```python
   from validator import AgentValidator, UnknownAgent, ToolNotInScope
   _validator = AgentValidator()  # reads AGENTS_DSN

   # inside each @mcp.tool, before doing work — `presented_key` comes from the
   # validator sidecar (bearer / Authentik), NOT from a tool argument:
   agent_id = _validator.authorize(presented_key, "ixosynth_claim")  # raises if unknown / out of scope
   # ... then stamp agent_id (ignore the free-text `agent=` param) on every board/registry write.
   ```

## Why this closes the gap
Today the MCP tools trust a free-text `agent` param (default `"grok"`) — spoofable. After this,
`agent_id` is derived from the credential and `tool ∈ scope` is enforced server-side, so every
handoff/claim/data push is provably attributed → the dashboard gets one isolatable layer per agent.

## Notes
- Dependency: `psycopg` (v3). DSN via `AGENTS_DSN`.
- Never commit raw keys. The seed block in the migration is a template with `<sha256>` placeholders.
- The shared Postgres registry is not stood up yet (observations.json marks `hermes-orchestration`
  as `degraded`) — this migration is the deliverable to apply when it is.
