<div align="center">

# dotfiles

**Bare machine to fully configured, in one command.**

![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)
![Windows](https://img.shields.io/badge/Windows-0078D6?logo=windows&logoColor=white)
![chezmoi](https://img.shields.io/badge/chezmoi-managed-4B8BBE)

</div>

---

Cross-platform config for macOS, Linux and Windows, managed with
[chezmoi](https://chezmoi.io). One command installs the packages, links the
configs into `$HOME` and decrypts the secrets.

## Quick start

A new machine:

```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply riptone
```

```powershell
iex "&{$(irm 'https://get.chezmoi.io/ps1')} -- init --apply riptone"
```

On first run it asks you to log in to `gh` (if you aren't already) and for
your passphrase, once. On Windows, symlinks need **Developer Mode**
(Settings → System → For developers) or an elevated shell.

## Everyday

| Do this | Command |
|---|---|
| **Update everything** (packages, extensions, this repo) | `topgrade` (alias `up`) |
| Pull the repo and apply it | `chezmoi update` (alias `dotu`) |
| Preview what would change | `chezmoi diff` (alias `dotd`) |
| Apply local edits | `chezmoi apply` |
| What's changed and not saved | `dots` (`chezmoi status` + `git status`) |
| Open a shell in the repo | `chezmoi cd` (alias `dot`) |
| Start managing a file | `chezmoi add ~/.config/foo` |
| Add or edit a secret | `chezmoi add --encrypt FILE` / `chezmoi edit FILE` |
| Something's off | `chezmoi doctor` |

Configs are **symlinks** into this repo, so editing `~/.zshrc` edits the
tracked file, and so does an app changing its own settings. Commit what you
want to keep. `chezmoi add`, `re-add` and `edit` commit and push by
themselves.

## Layout

```
home/                         everything that lands in $HOME
  .chezmoidata/packages.yaml  every package, per OS
  .chezmoiscripts/            package installs, age key, git hooks
  dot_zshrc, dot_zprofile, dot_zsh/
  dot_gitconfig, dot_config/git/
  dot_claude/settings.json    Claude Code
  modify_dot_claude.json      adds the MCP servers (mcp.yaml) to ~/.claude.json
  dot_config/opencode/        opencode
  dot_config/ghostty/, dot_config/starship.toml
  dot_config/vscode/          VS Code settings, Home + Work profiles
  Library/, AppData/          links from VS Code's own folders to the above
  private_dot_doti/           encrypted secrets
  Documents/, AppData/Local/  PowerShell profile, Windows Terminal (Windows only)
.githooks/                    pre-commit secret scan
scripts/windows/              run-by-hand extras
docs/
```

## What gets installed

Edit **`home/.chezmoidata/packages.yaml`**; the next `chezmoi apply`
installs what's new.

- **CLI:** git, curl, node, bun, gh, gitleaks, fd, fzf, zoxide, starship,
  rtk, topgrade, **claude**, opencode
- **MCP servers:** `@bytebase/dbhub`
- **zsh:** zsh-autosuggestions, zsh-fast-syntax-highlighting (PSReadLine on Windows)
- **GUI:** VS Code, Brave, Ghostty (macOS) or Windows Terminal, hiddenbar (macOS)
- **Font:** JetBrainsMono Nerd Font

VS Code settings, profiles and extensions **are** managed here (its own
Settings Sync is off); Brave uses Brave Sync.

## Docs

| | |
|---|---|
| [docs/how-it-works.md](docs/how-it-works.md) | **Start here:** what `apply` does, the file-name prefixes, what each folder is for |
| [docs/claude-code.md](docs/claude-code.md) | Claude Code: settings, rtk, MCP servers |
| [docs/secrets.md](docs/secrets.md) | How the encrypted secrets and the age key work |
| [docs/vscode.md](docs/vscode.md) | VS Code: profiles, extensions, the encrypted Work settings |
| [docs/opencode.md](docs/opencode.md) | opencode: config, plugin rules, `/vacuum` and `/versions` |
| [docs/cheatsheet.md](docs/cheatsheet.md) | Ghostty keys, fzf, zoxide, git aliases and the rest |
| [AGENTS.md](AGENTS.md) | Rules for agents editing this repo (`CLAUDE.md` is a symlink to it) |
