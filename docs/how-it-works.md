# How this repo works

## The idea

[chezmoi](https://chezmoi.io) keeps a **source**, this repo, and makes your
**home directory** match it.

- `chezmoi apply` does that once.
- `chezmoi update` pulls from GitHub first, then applies.
- `chezmoi diff` shows what `apply` would change, without changing anything.

## What `chezmoi apply` does, in order

1. **Packages.** Reads `home/.chezmoidata/packages.yaml` and runs
   `.chezmoiscripts/run_onchange_before_10-packages.*` if the list changed
   since last time: `brew bundle` on macOS and Linux, winget + bun on
   Windows, and `npm install -g` for the MCP servers everywhere.
2. **The age key, first run only.** `run_once_before_20-age-key.*` downloads
   `key.txt.age` from a secret gist on your account (found through your `gh`
   login) and asks for your
   passphrase to unlock it into `~/.config/chezmoi/key.txt`. It never asks
   again on that machine.
3. **Configs.** Every file under `home/` gets a symlink at the matching path
   in `~`. `home/dot_zshrc` becomes `~/.zshrc`, pointing back into this repo.
4. **Claude's MCP servers.** `home/modify_dot_claude.json` adds the servers
   from `.chezmoidata/mcp.yaml` to `~/.claude.json` and leaves the rest of
   that file (Claude's own state) alone.
5. **Secrets.** Decrypts `home/private_dot_doti/*.age` into `~/.doti/` as
   real files, readable only by you.
6. **Git hooks, first run only.** `run_once_after_30-githooks.*` turns on
   `.githooks/pre-commit` (a gitleaks scan) for this checkout.

## Reading the file names

chezmoi encodes what to do with a file in its name:

| Prefix / suffix | Means | Example |
|---|---|---|
| `dot_` | the name starts with `.` | `dot_zshrc` becomes `~/.zshrc` |
| `private_` | only you can read it (0600 / 0700) | `private_dot_doti` becomes `~/.doti` |
| `encrypted_` … `.age` | stored encrypted, decrypted on apply | the two secrets |
| `create_` | written once, never overwritten | `create_dot_gitconfig.local.tmpl` |
| `symlink_` | a symlink whose target is the file's content | the PowerShell 5 profile |
| `.tmpl` | filled in per machine (OS, home path, ...) | `.chezmoi.toml.tmpl`, the scripts |
| `run_once_` / `run_onchange_` | a script, run once or whenever its content changes | `.chezmoiscripts/` |
| `modify_` | edits part of an existing file instead of replacing it | `modify_dot_claude.json` |

## What each part is for

```
.chezmoiroot                 "the source is in home/"; everything else at the root is ignored by chezmoi
home/
  .chezmoi.toml.tmpl         chezmoi's own settings: symlink mode, the age key
  .chezmoiignore             what to skip per OS (no zsh on Windows, no AppData on macOS)
  .chezmoidata/packages.yaml THE package list; edit it to add or remove a tool
  .chezmoidata/mcp.yaml      Claude's MCP servers (today: dbhub)
  .chezmoidata/vscode.yaml   VS Code profiles and their extensions
  modify_dot_claude.json     puts those servers into ~/.claude.json (step 4)
  .chezmoiscripts/           the scripts from steps 1, 2 and 6 (a bash and a PowerShell twin each)
  dot_zshrc, dot_zprofile, dot_zsh/                                 zsh
  dot_gitconfig, dot_config/git/, create_dot_gitconfig.local.tmpl  git
  dot_claude/settings.json   Claude Code: model, permissions, the rtk hook, env
  dot_config/opencode/       opencode: config, 2 agents, the /vacuum and /versions plugins
  dot_config/ghostty/, dot_config/starship.toml                   terminal and prompt
  dot_config/vscode/         VS Code settings (Work's encrypted); see vscode.md
  Library/, AppData/Roaming/ links from VS Code's own folders to dot_config/vscode
  private_dot_doti/          the encrypted secrets
  Documents/, AppData/       PowerShell profile, Windows Terminal (Windows only)
.githooks/pre-commit         blocks a commit that contains a secret
.github/workflows/ci.yml     on every push: gitleaks, plus a real apply on macOS, Linux and Windows
scripts/windows/             run by hand: Defender exclusions
docs/                        the longer explanations
AGENTS.md                    rules for AI agents editing this repo (CLAUDE.md links to it)
```

## Why symlinks

Configs are symlinks into the repo (`mode = "symlink"`), so there is one
copy of each file. Edit `~/.zshrc` or `home/dot_zshrc`: it's the same file.
When an app rewrites its own settings (Claude's `/config`, opencode's
`/versions`), the change shows up in `git diff`, and you commit what you
want to keep.

Templates, encrypted and `private_` files can't be symlinks, because chezmoi
has to render them, so those are real files. Edit them in the repo, or with
`chezmoi edit <file>`, then run `chezmoi apply`.

chezmoi manages **files, not folders**. `~/.claude` and `~/.config/opencode`
are real directories, so what the apps write there themselves (sessions,
caches, `node_modules`) never comes near this repo.

## Day to day

| To... | Do |
|---|---|
| Change a config | Edit it, then commit |
| Add a tool | Add a line to `packages.yaml`, then `chezmoi apply` |
| Change a secret | `chezmoi edit ~/.doti/dbhub.toml`, then commit |
| Update everything | `up` (topgrade: brew, winget, npm, VS Code extensions, skills, then `chezmoi update`) |
| Sync another machine | `chezmoi update` |
| See what's unsaved | `dots` |
| Save a changed encrypted file | `chezmoi re-add <file>`: commits and pushes by itself |
| Check for drift | `chezmoi status` (lists) / `chezmoi verify` (exit code) |

## Secrets

See [secrets.md](secrets.md): the encrypted files live here, their key lives
in a secret gist on your account, and your passphrase unlocks the key once per
machine.
