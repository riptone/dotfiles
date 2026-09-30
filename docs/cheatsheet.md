# Everyday cheatsheet

What the more niche installed things actually do — the stuff that's easy to
forget between uses. chezmoi itself is in the [README](../README.md#everyday).

**Ghostty — tmux-style multiplexing** (`ghostty/.config/ghostty/config`).
`ctrl+a` is the leader key, like tmux's prefix. Ghostty waits indefinitely
after a leader, so a bare `ctrl+a` never reaches the shell — double-tap it to
send a real `^A` (zsh's beginning-of-line, fzf's too). `window-save-state =
always` restores windows on relaunch (macOS), standing in for tmux sessions.

| Key | Does |
|---|---|
| `ctrl+a` `h` / `j` / `k` / `l` | New split left / down / up / right |
| `ctrl+h` / `j` / `k` / `l` | Move to split left / bottom / top / right |
| `ctrl+a` `f` | Toggle split zoom |
| `ctrl+a` `x` | Close focused split (tmux kill-pane) |
| `ctrl+n` | New window |
| `ctrl+a` `n` / `p` | Next / previous tab |
| `cmd+w` / `cmd+alt+w` / `cmd+shift+w` | Close split / tab / window (macOS defaults) |
| `super+r` | Reload config |

Caveat: the plain `ctrl+h/j/k/l` navigation binds swallow those keys from
shell and vim (`ctrl+l` clear-screen, `ctrl+j` accept-line, `ctrl+k`
kill-line, vim `ctrl+h/l` pane-nav). Move them under the leader
(`ctrl+a>h=goto_split:left` …) if they're missed.

**fzf** (`Ctrl-T` / `Ctrl-R` / `Alt-C` — zsh and PowerShell, same bindings)

| Key | Does |
|---|---|
| `Ctrl-T` | Fuzzy-find a file, paste its path at the cursor — preview pane shows its first 100 lines |
| `Ctrl-R` | Fuzzy-search shell history |
| `Alt-C` | Fuzzy-find a directory and `cd` into it — preview pane lists its contents |

**zoxide** — `z <fragment>` jumps to the best-matching directory you've
visited before (frecency: frequency + recency, not just "most recent"); `zi`
opens an interactive picker when more than one directory matches well.

**Listing** — `ll` (long, all), `la` (all), `l1` (one per line).

**starship prompt** — config lives at `~/.config/starship.toml` (this repo's
`starship/` package). Colors match the Tokyo Night theme used everywhere else
(ghostty, opencode TUI, Windows Terminal). Just edit the file — starship
re-reads it on every prompt, no reload needed.

**Windows PowerShell git-alias gotcha** — `gs` / `gd` / `ga` work, but
`gc` / `gp` / `gl` are deliberately **not** overridden (they're core
PowerShell aliases for `Get-Content` / `Get-ItemProperty` / `Get-Location`).
Use git's own aliases instead — `git c`, `git p`, `git l` — which work
identically on every platform (defined once, in `git/.gitconfig`).

**git aliases** (`git/.gitconfig`) — the non-obvious ones:

| Alias | Does |
|---|---|
| `git l` / `git lg` / `git adog` | Log graph variants (plain / decorated / all-decorated) |
| `git undo` | `reset --soft HEAD~1` — undo the last commit, keep changes staged |
| `git amend` | `commit --amend --no-edit` |
| `git reword` | `commit --amend --only` — edit the last message without touching the diff |
| `git unstage` | `reset HEAD --` |
| `git discard` | `restore` |
| `git recent` | Branches sorted newest-committed first |
| `git st` | `stash` |
| `git ri` | `rebase --interactive` |

**Shift-select** (`zsh-shift-select` plugin) — Shift+arrows selects text at
the shell prompt like a normal text editor, instead of zsh's default of just
moving the cursor.

**Misc aliases** — `myip` (public IP via ifconfig.me), `path` (one `$PATH`
entry per line), `reload` (`exec zsh`, reloads the shell in place).

**Drift check** — `chezmoi status` lists every managed file that differs
from the repo, and `chezmoi verify` exits non-zero if anything does, which
is handy in a script. `chezmoi doctor` checks chezmoi's own setup.
