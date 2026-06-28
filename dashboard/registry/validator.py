"""Key -> agent_id + scope validator for the IxoSynth agent-connection layer.

Backs the fingerprint model in ../../AGENT-CONNECTION-LAYER.md (Step 2):
resolve agent_id from the *validated credential*, never from the free-text `agent`
param, then enforce `tool in scope` before executing a tool.

Wire into ixosynth-mcp/server.py at the seam (see README.md). Dependency: psycopg
(v3). DSN via the AGENTS_DSN env var, e.g. postgresql://user:pass@host:5432/registry
"""

from __future__ import annotations

import hashlib
import os

import psycopg  # psycopg 3


def hash_credential(raw_key: str) -> str:
    """SHA-256 hex of a presented key. Store/compare only this — never the raw key."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


class UnknownAgent(PermissionError):
    """Presented credential is not registered (or inactive)."""


class ToolNotInScope(PermissionError):
    """Resolved agent exists but is not allowed to call this tool."""


class AgentValidator:
    def __init__(self, dsn: str | None = None) -> None:
        self.dsn = dsn or os.environ["AGENTS_DSN"]

    def resolve(self, raw_key: str, *, touch: bool = True) -> dict | None:
        """Return {'agent_id', 'scope'} for a presented key, or None if unknown/inactive.

        Single indexed lookup on credential_hash. When touch=True, stamps last_seen
        so presence ("who is online") falls out of normal auth traffic.
        """
        h = hash_credential(raw_key)
        with psycopg.connect(self.dsn) as conn:
            row = conn.execute(
                "SELECT agent_id, scope FROM agents WHERE credential_hash = %s AND active",
                (h,),
            ).fetchone()
            if not row:
                return None
            if touch:
                conn.execute(
                    "UPDATE agents SET last_seen = now() WHERE credential_hash = %s",
                    (h,),
                )
        return {"agent_id": row[0], "scope": list(row[1])}

    def authorize(self, raw_key: str, tool: str) -> str:
        """Resolve the key and assert `tool` is in scope.

        Returns the agent_id to stamp on the write. Raises UnknownAgent or
        ToolNotInScope otherwise. This agent_id is authoritative — the MCP tool
        must use it and ignore any free-text `agent` argument.
        """
        ident = self.resolve(raw_key)
        if ident is None:
            raise UnknownAgent("credential not registered")
        if tool not in ident["scope"]:
            raise ToolNotInScope(f"tool {tool!r} not in scope for {ident['agent_id']}")
        return ident["agent_id"]


def register_agent(
    raw_key: str,
    agent_id: str,
    scope: list[str],
    display_name: str | None = None,
    dsn: str | None = None,
) -> None:
    """Upsert one agent identity. Pass the RAW key once (here); only its hash is stored.

    Mint the key out-of-band (e.g. via bw) and call this once per agent.
    """
    dsn = dsn or os.environ["AGENTS_DSN"]
    with psycopg.connect(dsn) as conn:
        conn.execute(
            """
            INSERT INTO agents (agent_id, credential_hash, scope, display_name)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (agent_id) DO UPDATE
              SET credential_hash = EXCLUDED.credential_hash,
                  scope           = EXCLUDED.scope,
                  display_name     = COALESCE(EXCLUDED.display_name, agents.display_name)
            """,
            (agent_id, hash_credential(raw_key), scope, display_name),
        )
