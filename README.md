<div align="center">

# dotfiles

**Bare machine to fully configured, in one command.**

![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)
![mise](https://img.shields.io/badge/mise-managed-F5A97F)

</div>

---

Cross-platform config for macOS and Windows, managed with
[mise](https://mise.jdx.dev). One command installs the tools and apps, links
the configs into `$HOME`, applies the macOS settings and decrypts the secrets.

## Quick start

macOS:

```bash
curl -fsSL https://raw.githubusercontent.com/riptone/dotfiles/main/scripts/install.sh | sh
```

Windows (PowerShell, with **Developer Mode** on so symlinks work):

```powershell
irm https://raw.githubusercontent.com/riptone/dotfiles/main/scripts/install.ps1 | iex
```

It clones to `~/dotfiles`, installs mise and runs `mise bootstrap`, which is
destructive and runs everything declared. To look first: `... | sh -s -- --dry-run`,
or on Windows set `$env:DOTFILES_DRY_RUN = 1` before the line. On first run it
asks you to log in to `gh` and for your passphrase, once (the age key, see
[docs/secrets.md](docs/secrets.md)).

## Everyday

| | Command | Does |
|---|---|---|
| **In** | `up` | Pulls this repo, upgrades every tool, re-runs bootstrap |
| **Out** | `save [message]` | Refreshes the VS Code extension and skill lists, commits and pushes |

| Do this | Command |
|---|---|
| Preview what bootstrap would change | `mise bootstrap --dry-run` |
| What a re-apply would change | `mise dot diff` / `mise dot status` |
| Decrypt secrets | `mise run secrets` |
| Add a tool | one line under `[tools]` in `config/mise/config.toml` |
| Go to the repo | `dots` |

Configs live in this repo and are **linked into place**, so editing `~/.zshrc`
edits the tracked file, and so does an app changing its own settings. On
Windows, mise copies a few directory-based configs instead of linking them;
re-run `mise dot apply` after editing those in the repo. `save` commits
whatever changed.

## Layout

```
mise.toml                 what links where ([dotfiles]) and the tasks: bootstrap, secrets, up, save
config/mise/config.toml   tools, apps, macOS settings, zsh plugin repos
home/                     links into ~         (.zshrc, .gitconfig, .claude/, .ssh/config)
config/                   app configs linked by mise.toml (opencode, nvim, starship, git, wezterm, ghostty, vscode, powershell, ponytail)
*.age                     secrets, encrypted, next to where they land
scripts/                  install.sh + install.ps1 (the one-liners), dots.mjs (the glue, node)
docs/
```

Per-OS differences are `variants = [{ os = "..." }]` on a `[dotfiles]` entry
or `os =` on a package, never duplicated files.

## What gets installed

Edit **`config/mise/config.toml`**.

- **CLI (mise):** node, pnpm, age, gh, fd, fzf, zoxide, starship, cloudflared, opencode, neovim
- **MCP server (mise):** `@bytebase/dbhub`
- **Apps + font:** VS Code, Brave, Ghostty, JetBrains Mono Nerd Font and hiddenbar (macOS) via brew casks; Git, PowerShell, VS Code, Brave, WezTerm and the font via winget on Windows
- **zsh:** autosuggestions + fast-syntax-highlighting, cloned to `~/.zsh/plugins` (PSReadLine on Windows)

VS Code settings, profiles and extensions are managed here (Settings Sync is
off); Brave uses Brave Sync. macOS settings (Dock, Finder, dark mode) are
`[bootstrap.macos.defaults]`.

## Docs

| | |
|---|---|
| [docs/claude-code.md](docs/claude-code.md) | Claude Code: settings, plugins, MCP servers, skills |
| [docs/secrets.md](docs/secrets.md) | How the encrypted secrets and the age key work |
| [docs/vscode.md](docs/vscode.md) | VS Code: profiles, extensions, the encrypted Work settings |
| [docs/opencode.md](docs/opencode.md) | opencode: config and plugin rules |
| [docs/neovim.md](docs/neovim.md) | Neovim: LazyVim defaults, extras, database connections |
| [docs/cheatsheet.md](docs/cheatsheet.md) | Terminal keys, fzf, zoxide, git aliases and the rest |
| [AGENTS.md](AGENTS.md) | Rules for agents editing this repo (`CLAUDE.md` is a symlink to it) |
