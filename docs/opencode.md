# opencode

Kept as a second agent; Claude Code is the primary one ([claude-code.md](claude-code.md)).

## Install

`opencode` is in `[tools]` of `config/mise/config.toml`, so mise installs and
upgrades it on every OS (`up`).

## What's managed (`config/opencode/`)

| File | What |
|---|---|
| `opencode.jsonc` | Model, permissions, plugins (pinned), the dbhub MCP server, formatter |
| `agents/` | `code-reviewer`, `security-engineer` (read-only subagents) |
| `caveman-default.md` | Always-on terse-output instructions |

Each file is a symlink; `~/.config/opencode` itself is a real directory. So
what opencode writes there itself (a `package.json` and `node_modules` for
the plugin SDK) stays out of this repo.

Kept deliberately small. oh-my-opencode-slim (its agent presets, council and
custom agents) and the context-pruning plugin were removed when Claude
became the primary agent.

## Rules

- **Pin every third-party plugin** (`openslimedit@1.0.4`). An unpinned
  plugin costs a registry round trip on every startup.
- **Never put a pinned plugin in mise's `npm:` tools too.** opencode
  installs plugin packages itself, one full `node_modules` per version, under
  `~/.cache/opencode/packages/`. A second global copy is dead weight.
- **`npm:` tools are for MCP servers only,** and each one must be run by name from
  an agent config. Today that's just `dbhub`, which is off by default here
  (`"enabled": false`) because it registers two tools per database.

## Windows performance

opencode's SQLite session store grows with every streamed token. Defender
re-scanning it, plus npx's `node_modules`, causes slow startup and stalls on
every response. Run `config/powershell/defender-exclusions.ps1` once from an
**elevated** PowerShell.
