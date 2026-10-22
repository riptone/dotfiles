# Agent instructions for dotfiles work

This repository is managed by [mise](https://mise.jdx.dev) (`mise bootstrap`).
`mise.toml` says what links where; `config/mise/config.toml` says what gets
installed. Nothing here is written to `$HOME` except through those two files.
`README.md` is the human-facing tour.

`CLAUDE.md` is a symlink to this file.

## Layout

```
mise.toml                  [dotfiles] links + tasks (bootstrap, secrets, up, save)
config/mise/config.toml    [tools], [bootstrap.*] packages/repos/macOS defaults, [env]
home/                      links into ~     (.zshrc, .zprofile, .gitconfig, .claude/, .ssh/config)
config/                    links into ~/.config (opencode, starship, git, wezterm, ghostty, vscode, powershell)
*.age                      secrets, encrypted, next to where they land (home/.doti/, config/vscode/profiles/Work/)
config/vscode/profiles.json  VS Code profiles + extensions
home/.agents/skills.json   agent skills; home/.claude/mcp.json is Claude's MCP servers
scripts/                   install.sh, install.ps1 (the one-line installers) and dots.mjs (cross-platform glue, node): mcp, vscode, skills, secrets, save-lists
docs/                      the longer explanations
```

## Rules

- **Change a config by editing its file under `home/` or `config/`.** They
  are symlinked into `$HOME`, so edits made by an app (Claude's `/config`,
  opencode's `/config`) show up in `git diff`.
- **A new linked file needs a `[dotfiles]` entry in `mise.toml`.** Nothing is
  picked up by glob. Whole directories use `mode = "symlink-each"` so app
  state (caches, sessions) never lands in the repo.
- **One tool list:** `[tools]` in `config/mise/config.toml`. Adding a tool is
  a one-line edit. GUI apps and fonts go in `[bootstrap.packages]`
  (`brew-cask:` / `winget:` with an `os =`), only when mise has no backend.
- **Per-OS differences use `variants = [{ os = "..." }]` or `os =`,** never
  duplicated files. Scripts are node (`scripts/dots.mjs`), not bash and
  PowerShell pairs.
- **Install only what the user actually uses.** Agents bring their own
  ripgrep, so `rg` isn't installed. `eza`, `bat` and `topgrade` were dropped
  as unused. Ask before adding a tool "for the agent".
- **Agent-only env vars go in the agent's config, not the shell.** The
  non-interactive set (`GIT_EDITOR=true`, `PAGER=cat`, ...) lives in
  `home/.claude/settings.json` `env`. Exported from `.zprofile`, it broke the
  user's own shell.
- **Shell env vars for tools** go in `[env]` of `config/mise/config.toml`.
- **Machine-local git settings** go in `~/.gitconfig.local` (included from
  `.gitconfig`, missing is fine, never tracked).
- **VS Code settings are managed here, and Settings Sync is off.** Files live
  in `config/vscode/`; one `[dotfiles]` entry per OS links each. The Work
  profile's settings are encrypted (they hold client DB hosts). Profiles and
  extensions are in `config/vscode/profiles.json`. See `docs/vscode.md`.
- **Skills are a list, not files.** Third-party skills go in
  `home/.agents/skills.json`; never commit their folders. `save` rewrites the list
  from `~/.agents/.skill-lock.json`. See `docs/claude-code.md`.
- **macOS settings** are `[bootstrap.macos.defaults]` in
  `config/mise/config.toml`.
- **Line endings:** `.gitattributes` forces LF on shell files and CRLF on
  PowerShell. `*.age` is binary to git.
- **`mise bootstrap` is destructive.** Run `mise bootstrap --dry-run` first,
  and set `MISE_GLOBAL_CONFIG_FILE` to this repo's `config/mise/config.toml`
  when `~/.config/mise` isn't linked yet.

## Agents

- **Claude Code is primary.** Its config is `home/.claude/settings.json`;
  the rules for every project are `home/.claude/AGENTS.md`, linked as
  `~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md` and `~/.gemini/AGENTS.md`
  (separate `[dotfiles]` entries, one source), and opencode loads the same
  file.
  `~/.claude.json` is app state and is never managed. Claude writes to
  `settings.json` through the symlink, so keep generic permissions and drop
  one-off ones before committing. See `docs/claude-code.md`.
- **Claude's MCP servers live in `home/.claude/mcp.json`.** `scripts/dots.mjs mcp`
  merges them into `~/.claude.json` and touches no other key, because that
  file is Claude's state. Never manage `~/.claude.json` whole. Entries must
  work unchanged on every OS, so no absolute paths; dbhub expands `~`
  itself. The server's npm package goes in `[tools]` as `"npm:<pkg>"`.
  opencode keeps its own copy in `opencode.jsonc`.
- **opencode is secondary** and kept minimal: `opencode.jsonc` and two
  agents. Pin every
  third-party plugin version. A pinned plugin must not also be an `npm:` tool:
  opencode installs plugin packages itself.

## Secrets — the hard rule

**No plaintext credentials in this repository, ever.** It's public. Nothing scans for
secrets, so check every diff yourself.

Secrets are age-encrypted `*.age` files next to where they land, encrypted to a random key. The
key never enters this repo. It lives as `key.txt.age` in a secret gist on the
user's account, found through `gh` and encrypted with a passphrase, and each
machine decrypts it once to `~/.config/age/key.txt` (`mise run secrets`).
Never write the gist's URL or ID into this repo. Add or change a secret by
encrypting with `age -r "$(age-keygen -y ~/.config/age/key.txt)"` into
`<target>.age` in the repo, never by copying plaintext into the repo.

That includes client database hosts, IPs and usernames: they belong in the
encrypted `dbhub.toml`. If you're shown a credential, don't echo it into a
commit, a doc, or a comment. See `docs/secrets.md`.

## Conventions

- **Preview before applying.** `mise bootstrap --dry-run` and `mise dot diff`
  show exactly what would change.
- **Confirm before any destructive operation against `$HOME`.**
- **Read-only checks:** `mise dot status`, `mise bootstrap status`.
- **`save` (a mise task, aliased in `aliases.zsh` / `profile.ps1`) commits and
  pushes.** It's the user's command; an agent doesn't run it, or `git push`,
  unless asked.
