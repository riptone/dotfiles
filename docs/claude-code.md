# Claude Code

Claude Code is the primary agent. opencode stays installed as a second one
(see [opencode.md](opencode.md)).

## Install

Claude Code runs from the VS Code extension (`anthropic.claude-code`, in
`config/vscode/profiles.json`), which bundles its own copy and updates with the
extension. It reads the same `~/.claude/settings.json` and `~/.claude.json` a
CLI would.

A terminal `claude` is optional and not managed by this repo. If you want mise
to own one, add `claude-code = "latest"` to `[tools]` in
`config/mise/config.toml`; otherwise install it with Claude's own installer.

## What's managed

```
home/.claude/settings.json  ->  ~/.claude/settings.json   (a symlink)
home/.claude/AGENTS.md      ->  ~/.claude/AGENTS.md       (global instructions)
                                ~/.claude/CLAUDE.md       (same file, so is ~/.codex/AGENTS.md)
config/ponytail/config.json ->  ~/.config/ponytail/config.json            (macOS)
                                ~/AppData/Roaming/ponytail/config.json    (Windows)
```

mise links files, not the directory, so `~/.claude` stays a real
directory full of Claude's own state (sessions, projects, plugin caches,
auto-memory), and none of that comes near this repo.

`AGENTS.md` holds the rules for every project (run the gate, never push
without asking, no paid services, Bun and Biome). A project's own file wins
where they disagree. `CLAUDE.md` is a second `[dotfiles]` entry for the same
file, and opencode loads it through `instructions`.

`config/ponytail/config.json` is the shared ponytail config, read by both the
Claude and opencode plugins. It is a file symlink, so editing it in the repo is
all either agent needs.

Other user-authored config can be added the same way, with
a `[dotfiles]` entry in `mise.toml` (for `~/.claude/agents/...` or `output-styles/`).
Skills you write yourself could go there too; third-party ones are
installed from a list (below). Never add `~/.claude.json`: it's app state, holding
OAuth, trust decisions and per-project data.

**`settings.json` is a symlink, so Claude's writes land here.** Changing
something with `/config`, or picking "always allow", edits the tracked file,
and the change shows up in `git diff`. Commit what you want to keep, and
revert one-off permissions you don't.

### What's in `settings.json`

- **Model and effort:** `sonnet`, effort `high`; `claude-opus-5-5` stays at
  `medium` through `modelSettings`. Output style `Concise`, rolling update
  channel, dark theme.
- **`env`:** larger Bash and MCP output caps, plus the non-interactive set
  (`GIT_EDITOR=true`, `GIT_PAGER`/`PAGER=cat`, `GIT_TERMINAL_PROMPT=0`,
  `GCM_INTERACTIVE=never`, `npm_config_yes`, `PIP_NO_INPUT`), so a command
  Claude runs can never hang on a prompt or pager. They're here rather than in
  `.zprofile` so your own shell stays normal. `CI=true` is deliberately not
  set: it changes how many tools behave, and Claude doesn't need it.
- **Permissions:** read-only git, gh and file inspection commands are
  pre-allowed, along with every dbhub tool (`mcp__dbhub`).
  `~/.doti/**` and the age key (`~/.config/age/key.txt`) are denied to `Read` and `Edit`,
  because that's where the decrypted secrets and their key live.
- **Plugins:** ponytail only.

### Plugins

Ponytail is the only plugin, installed at user scope as
`ponytail@ponytail` from its own marketplace. `settings.json` declares both
the marketplace and the enabled plugin. To install or refresh it:

```sh
claude plugin marketplace add https://github.com/DietrichGebert/ponytail.git
claude plugin install ponytail@ponytail -s user
```

Its hooks read `config/ponytail/config.json`, the same file opencode uses, so
`hideStatus` and `defaultMode` apply to both agents. The plugin's task-board
hooks need Claude Code 2.1.290+; update the CLI if you want those. opencode has
its own pinned copy.

## MCP servers: merged into `~/.claude.json`

Claude only reads user-level MCP servers from `~/.claude.json`. That file is
also Claude's own state (logins, projects, trust decisions), so it's never
managed whole. `node scripts/dots.mjs mcp` (run by the `bootstrap` task) sets
`mcpServers.<name>` for each server in `home/.claude/mcp.json` and leaves every other
key alone. Servers you add by hand with `claude mcp add`
survive. When everything is already in place, it doesn't write the file.

- **One server for every database.** It gets two tools per source
  (`execute_sql`, `search_objects`). SQL Server sources are read-only. SQLite
  sources are local tablet copies and are writable.
- **The command is `dbhub`,** installed by mise (`"npm:@bytebase/dbhub"` in `[tools]`).
- **`~/.doti/dbhub.toml` is a secret:** see [secrets.md](secrets.md). Until
  `mise run secrets` has decrypted it, the server fails to start and nothing else
  breaks.
- **The same everywhere.** dbhub expands `~` in `--config` and in a SQLite
  source's `database = "~/…"` itself, so the config is identical on every
  OS. Don't write a SQLite source as a `sqlite:///~/…` DSN: dbhub 1.4.0
  drops the home directory from that form. SQLite sources are `lazy = true`,
  so a machine without the tablet copies loses just those sources, not the
  whole server.
- **If Claude is running during `apply`,** it may write the file back
  without the change. Run `mise run bootstrap` again with Claude closed.

To add another MCP server, add it to `home/.claude/mcp.json` and its npm package to
`[tools]` as `"npm:<pkg>"`. If opencode should have it too, add it to
`opencode.jsonc`'s `"mcp"` as well.

## Skills

Third-party skills are tracked as a **list**, not as files:
`home/.agents/skills.json` maps each GitHub repo to the skills taken
from it. The `bootstrap` task installs them with
`pnpm dlx skills add <repo> -g -a claude-code opencode -s <names>` into `~/.agents/skills` with links from `~/.claude/skills`.

| To... | Do |
|---|---|
| Add a skill | `pnpm dlx skills add <repo> -g -s <name>`, then `save` (it rewrites the list from `~/.agents/.skill-lock.json`) |
| Remove one | `pnpm dlx skills remove -g <name>`, then `save`; other machines keep it until removed there too |

`up` only installs skills that are missing from `~/.agents/.skill-lock.json`;
it does not refresh existing ones. To update, remove the skill, add it again,
then `save`.

The ponytail skills come from the ponytail plugin (Claude and opencode), so
they're not in the list. A skill that some other tool drops into
`~/.agents/skills` without the lock file isn't tracked.
