# opencode

Kept as a second agent; Claude Code is the primary one ([claude-code.md](claude-code.md)).

## Install

`opencode` is in `[tools]` of `config/mise/config.toml`, so mise installs and
upgrades it on every OS (`up`).

## What's managed (`config/opencode/`)

| File                               | What                                                                        |
| ---------------------------------- | --------------------------------------------------------------------------- |
| `opencode.jsonc`                   | Model, permissions, plugins (pinned), the dbhub MCP server, formatter       |
| `oh-my-opencode-slim.jsonc`        | Settings for the oh-my-opencode-slim plugin (agent presets, council)        |
| `dcp.jsonc`                        | Settings for the dynamic context pruning plugin                             |
| `opencode-quota/quota-toast.jsonc` | Settings for the quota readout plugin                                       |
| `agents/code-reviewer.md`          | A read-only review subagent                                                 |
| `cli.json`                         | The TUI: theme (`pierre-dark-soft`), diffs, session behaviour               |
| `themes/pierre-dark-soft.json`     | A custom Pierre Dark Soft theme for the TUI                                 |
| `biome.jsonc`                      | Biome rules for the formatter                                               |
| `shell-strategy.md`                | Notes on non-interactive shell flags (not referenced from `opencode.jsonc`) |

On macOS each file is a symlink; `~/.config/opencode` itself is a real
directory. On Windows mise copies these files instead (directory
`symlink-each` falls back to copies), so re-run `mise dot apply` after editing
the repo. Either way, what opencode writes there itself (a `package.json` and
`node_modules` for the plugin SDK) stays out of this repo.

Plugins in use: oh-my-opencode-slim (orchestration), `@tarquinen/opencode-dcp`
(context pruning), `opencode-antigravity-auth`, `opencode-claude-auth`,
`@dietrichgebert/ponytail` (lean modes) and `@slkiser/opencode-quota`. All are
pinned in `opencode.jsonc`.

## Rules

- **Pin every third-party plugin** (`openslimedit@1.0.4`). An unpinned
  plugin costs a registry round trip on every startup.
- **Never put a pinned plugin in mise's `npm:` tools too.** opencode
  installs plugin packages itself, one full `node_modules` per version, under
  `~/.cache/opencode/packages/`. A second global copy is dead weight.
- **`npm:` tools are for MCP servers only,** and each one must be run by name from
  an agent config. Today that's just `dbhub`, which is off by default here
  (`"disabled": true` in `mcp.servers.dbhub`) because it registers two tools
  per database.

## Windows performance

opencode's SQLite session store grows with every streamed token. Defender
re-scanning it, plus each MCP server's `node_modules`, causes slow startup and stalls on
every response. Run `config/powershell/defender-exclusions.ps1` once from an
**elevated** PowerShell.
