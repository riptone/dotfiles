# Agent instructions for dotfiles work

This repository is a [chezmoi](https://chezmoi.io) source directory.
`.chezmoiroot` points chezmoi at `home/`; nothing outside `home/` is ever
written into `$HOME`. `docs/how-it-works.md` is the human-facing tour.

`CLAUDE.md` is a symlink to this file. CI diffs them.

## Layout

```
home/                         what lands in $HOME (chezmoi source state)
  .chezmoi.toml.tmpl          chezmoi's own config: symlink mode, age, data
  .chezmoidata/packages.yaml  every package, per OS
  .chezmoidata/mcp.yaml       Claude's MCP servers
  .chezmoidata/vscode.yaml    VS Code profiles and their extensions
  modify_dot_claude.json      merges those into ~/.claude.json, nothing else
  .chezmoiscripts/            install packages, fetch the age key, git hooks
  .chezmoiignore              per-OS exclusions (a template)
  dot_zshrc, dot_config/...   configs, named the chezmoi way
  private_dot_doti/           encrypted secrets (encrypted_*.age)
.githooks/pre-commit          gitleaks on staged changes
scripts/windows/              run-by-hand extras (Defender exclusions)
docs/                         the longer explanations
```

## Rules

- **Change a config by editing its file under `home/`.** chezmoi runs in
  symlink mode, so a plain config in `$HOME` is a symlink into this repo and
  edits made by an app (Claude's `/config`, opencode's `/versions`) show up in
  `git diff`. Templates (`*.tmpl`), `encrypted_` and `private_` files can't
  be symlinks: they're rendered as real files, so edit those in the repo, or
  with `chezmoi edit`, then run `chezmoi apply`.
- **Follow chezmoi's naming:** `dot_` for a leading dot, `private_` for 0600
  or 0700, `encrypted_` for age, `create_` to write once and never
  overwrite, `symlink_` for a symlink whose target is the file's content,
  `.tmpl` for a template. A new top-level file under `home/` lands in `$HOME`.
- **One package list:** `home/.chezmoidata/packages.yaml`. Adding a tool is a
  one-line edit there. The install scripts re-run whenever it changes.
- **Per-OS differences go in `.chezmoiignore` or a template,** never in
  duplicated files. Scripts wrap their whole body in an OS check, so they
  render to nothing, and are skipped, elsewhere.
- **Install only what the user actually uses.** Agents bring their own
  ripgrep, so `rg` isn't installed. `eza` and `bat` were dropped as unused.
  Ask before adding a tool "for the agent".
- **Agent-only env vars go in the agent's config, not the shell.** The
  non-interactive set (`GIT_EDITOR=true`, `PAGER=cat`, ...) lives in
  `home/dot_claude/settings.json` `env`. Exported from `.zprofile`, it broke
  the user's own shell.
- **A tool installed outside a package manager** puts its PATH/env in
  `home/dot_zprofile`, **not** in the line its installer appends to
  `~/.zshrc`. That file is a symlink into this repo.
- **Machine-local git settings** go in `~/.gitconfig.local`. It's created
  once by `home/create_dot_gitconfig.local.tmpl`, included from
  `.gitconfig`, and never overwritten.
- **VS Code settings are managed here, and Settings Sync is off.** The files
  live in `home/dot_config/vscode/`; VS Code's per-OS folders link to them.
  The Work profile's settings are encrypted (they hold client DB hosts).
  Profiles and extensions are in `.chezmoidata/vscode.yaml`. See
  `docs/vscode.md`.
- **Line endings:** `.gitattributes` forces LF on shell files and CRLF on
  PowerShell. `*.age` is binary to git.

## Agents

- **Claude Code is primary.** Its config is `home/dot_claude/settings.json`.
  `~/.claude.json` is app state and is never managed. Claude writes to
  `settings.json` through the symlink, so keep generic permissions and drop
  one-off ones before committing. See `docs/claude-code.md`.
- **rtk is wired in by a hook, not an init script.** The `rtk hook claude`
  hook is already in `settings.json`; never run `rtk init`, which would try
  to patch that file.
- **Claude's MCP servers live in `home/.chezmoidata/mcp.yaml`.**
  `modify_dot_claude.json` merges them into `~/.claude.json` and touches no
  other key, because that file is Claude's state. Never manage
  `~/.claude.json` whole. Entries must work unchanged on every OS, so no
  absolute paths; dbhub expands `~` itself. The server's npm package goes in
  `packages.yaml` under `npm`. opencode keeps its own copy in
  `opencode.jsonc`.
- **opencode is secondary** and kept minimal: `opencode.jsonc`, `tui.jsonc`,
  two agents, and the `/vacuum` and `/versions` TUI plugins. Pin every
  third-party plugin version. A pinned plugin must not also be in `npm`:
  opencode installs plugin packages itself.

## Secrets — the hard rule

**No plaintext credentials in this repository, ever.** It's public, and CI
runs gitleaks over the full history. The pre-commit hook runs it on staged
changes, since after a push is too late.

Secrets are chezmoi `encrypted_` files under `home/private_dot_doti/`,
encrypted to a random age key. The key never enters this repo. It lives as
`key.txt.age` in a secret gist on the user's account, found through `gh` and
encrypted with a passphrase, and each machine decrypts it once. Never write
the gist's URL or ID into this repo. Add or change a secret with
`chezmoi add --encrypt <file>` or `chezmoi edit <file>`, never by copying
plaintext into `home/`.

That includes client database hosts, IPs and usernames: they belong in the
encrypted `dbhub.toml`. If you're shown a credential, don't echo it into a
commit, a doc, or a comment. See `docs/secrets.md`.

## Conventions

- **Preview before applying.** `chezmoi diff` shows exactly what `apply`
  would change.
- **Confirm before any destructive operation against `$HOME`.**
- **Read-only checks:** `chezmoi status` and `chezmoi verify`.
