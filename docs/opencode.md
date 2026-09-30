# opencode

Kept as a second agent; Claude Code is the primary one ([claude-code.md](claude-code.md)).

## Install

- **macOS/Linux:** `brew`, from the `anomalyco/tap` tap. homebrew-core lags
  upstream by patches.
- **Windows:** `bun install -g opencode-ai` (`bun` in `packages.yaml`). The
  winget package lags upstream. `opencode upgrade` detects the bun install
  and follows it.

## What's managed (`home/dot_config/opencode/`)

| File | What |
|---|---|
| `opencode.jsonc` | Model, permissions, plugins (pinned), the dbhub MCP server, formatter |
| `tui.jsonc` | Theme, keybinds, the two TUI plugins below |
| `agents/` | `code-reviewer`, `security-engineer` (read-only subagents) |
| `plugins/` | The `/vacuum` and `/versions` TUI plugins |
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
- **Never put a pinned plugin in `packages.yaml`'s `npm` too.** opencode
  installs plugin packages itself, one full `node_modules` per version, under
  `~/.cache/opencode/packages/`. A second global copy is dead weight.
- **`npm` is for MCP servers only,** and each one must be run by name from
  an agent config. Today that's just `dbhub`, which is off by default here
  (`"enabled": false`) because it registers two tools per database.

## Slash commands (the TUI plugins)

| Command | Does |
|---|---|
| `/vacuum` (alias `/compactdb`) | Prunes sessions by rule, then reclaims SQLite space. Rules: **folder** (all / other folders only / this folder only), age, size, keep-per-folder, protect-shared. Reported sizes include the WAL, because a `VACUUM` in WAL mode rewrites every page *through* the log, so it checkpoints again afterwards or the footprint looks doubled. Run it when opencode is idle: the `VACUUM` needs exclusive database access, so it runs in a child process (bun, else node). |
| `/versions` (alias `/updates`, `/check-versions`) | A panel for everything about pinned plugins. **Update plugins** checks each pin in `opencode.jsonc` against npm and rewrites it in place, keeping comments. **Clear old versions** and **Clear unused packages** delete cached package directories under `~/.cache/opencode/packages`. Updating also clears the versions it replaces. A cached package named in any config file is reported but never deleted. |

## Windows performance

opencode's SQLite session store grows with every streamed token. Defender
re-scanning it, plus npx's `node_modules`, causes slow startup and stalls on
every response. Two fixes:

- `scripts/windows/defender-exclusions.ps1`: run it once from an **elevated** PowerShell.
- `/vacuum`, run whenever the store gets large.
