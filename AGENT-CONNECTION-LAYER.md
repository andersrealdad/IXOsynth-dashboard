# Agent Connection & Fingerprint Layer

How every external agent (Claude web, Codex web, Cursor web, Grok, …) connects, is **tracked by key**,
and shows up as its **own layer** in the IxoSynth Dashboard. For Hermes to build.

## The model (one line)
**One agent = one MCP Sandbox identity = one key.** The key *is* the fingerprint: every handoff and
every data push is stamped server-side with the `agent_id` derived from the key — not from a
free-text name (which is spoofable). The dashboard then renders one **layer per agent**.

```
Claude web ─┐
Codex web  ─┤   each with its OWN key
Cursor web ─┼──▶  mcp.ixobot.com  ──▶  validator (key → agent_id)  ──▶  MCP tools
Grok       ─┘     (OAuth / bearer)      = THE FINGERPRINT              (scoped per key = "devbox")
                                                   │
                                                   ▼  stamp agent_id on every write
                                         shared Postgres registry (handoffs · claims · data)
                                                   │
                                                   ▼
                                         Dashboard: a LAYER per agent (lens filtered by agent_id)
```

## What exists today (the starting point)
- **Gateway:** `mcp.ixobot.com` → `ixosynth-mcp/server.py` (:8787) → Trainline board `:8765`.
- **Tools** (these are what you *assign* to an agent's devbox): `ixosynth_signin`, `ixosynth_heartbeat`,
  `ixosynth_signout`, `ixosynth_post_message`, `ixosynth_claim`, `ixosynth_report`,
  `ixosynth_get_work_queue`, `ixosynth_get_roadmap`, `ixosynth_get_build_orders`,
  `ixosynth_get_dispatches`, `ixosynth_create_open_notebook_topic`.
- **Auth:** validator sidecar accepts a static bearer **or** an Authentik OIDC JWT. OAuth providers
  already exist for Grok and Claude.
- **The gap to close:** today the `agent` is a *free-text param* (default `"grok"`) — spoofable — and the
  board already rejects unregistered names (`{"ok":false,"error":"unknown agent"}`). So identity is
  half-enforced. Fingerprinting = make the key the single source of identity.

## Step 1 — Register each agent (issue the key = the fingerprint)
For each agent, create one identity in the registry: `agent_id` (stable, e.g. `claude-web`, `codex-web`,
`cursor-web`, `grok`), a **credential** (an Authentik OAuth client *or* a minted API key), and a
**tool scope** (the allow-list of MCP tools this key may call = its "devbox"). Store
`{agent_id, credential_hash, scope[], created}` in Postgres.

## Step 2 — Make the key the fingerprint (server-side stamping)
In `ixosynth-mcp/server.py`, resolve `agent_id` from the **validated credential**, not the call args:
- The validator already authenticates the request → have it return the `agent_id` for that key.
- The MCP tools (`signin/heartbeat/claim/report/post_message/create_open_notebook_topic`) **ignore the
  free-text `agent` param and use the resolved `agent_id`** (or reject if they disagree).
- Every write to the board / registry carries that `agent_id` → so attribution is provable, not claimed.

## Step 3 — Tool scopes per agent (the "devbox")
Each key's `scope[]` gates which tools it can call. Examples:
- `grok` → research scope: `get_*`, `post_message`, `create_open_notebook_topic`, `claim`, `report`.
- `claude-web` → builder scope: all of the above + `signin/heartbeat/signout`.
- a read-only observer → only `get_*`.
The MCP server checks `tool ∈ scope` before executing. This is "assign them tools" — per key.

## Step 4 — Push data with the fingerprint
Any data an agent delivers (a handoff, a research note, a claim outcome) is written with its `agent_id`
and a timestamp. Minimum stamped fields on every record: `agent_id`, `at`, `kind`, `payload`,
optional `task`/`target`. That feeds `handoffs` + the registry the dashboard already reads.

## Step 5 — A layer per agent in the dashboard
Because every record carries `agent_id`, the dashboard gets agent layers **for free**: add one
`type:"lens"` view per agent (`layer:agent=<agent_id>`) that filters the graph/handoffs to that agent —
color + isolate. Contract additions (small):
- `handoffs[].agent_id` and `observations[].agent_id` (who produced it).
- a `participants[].agent_id` (already effectively the `agent` field — make it the stable key id).
- auto-generated views: one `{"id":"layer_<agent_id>","name":"<agent_id>","type":"lens","algorithm":"agent","agent_id":"<id>"}` per registered agent.

## Connection recipes (what you hand each agent)
| Agent | How it connects | Identity |
|---|---|---|
| **Grok** | Custom MCP connector → `https://mcp.ixobot.com` (OAuth, existing client) | `agent_id=grok` |
| **Claude web** | Add custom connector → `https://mcp.ixobot.com` (OAuth, existing Claude client) | `agent_id=claude-web` |
| **Codex web** | MCP server URL `https://mcp.ixobot.com` + its key (bearer or OAuth client) | `agent_id=codex-web` |
| **Cursor web** | MCP server URL `https://mcp.ixobot.com` + its key | `agent_id=cursor-web` |

Each gets a **distinct key** → distinct fingerprint → distinct dashboard layer. That's the separate
layer per agent, exactly as planned.

## What Hermes builds (checklist)
1. `agents` table in Postgres: `{agent_id, credential_hash, scope[], created}`.
2. Validator returns `agent_id` for a presented key.
3. MCP server stamps `agent_id` from the key (ignore free-text), enforces `tool ∈ scope`.
4. Every board/registry write carries `agent_id` + `at`.
5. Mint one key per agent (Claude/Codex/Cursor/Grok); register in the table.
6. Dashboard auto-emits one `layer_<agent_id>` lens per registered agent.
