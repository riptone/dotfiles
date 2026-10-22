# TODO: migrate dotfiles to mise + WezTerm

Replace chezmoi and the per-OS scripts with one `mise bootstrap` config, and
use one WezTerm config on Windows and macOS. Keep `vscode.yaml`; mise cannot
install VS Code extensions, so that stays a bootstrap task.

## Install

| Tool | Windows | macOS | Arch |
| --- | --- | --- | --- |
| mise | `irm https://mise.run/powershell \| iex` | `curl -fsSL https://mise.run \| sh` | `yay -S mise` |
| WezTerm | `winget install wez.wezterm` | `brew install --cask wezterm` | `yay -S wezterm` |

`mise bootstrap` is destructive and runs everything it declares. Always
`mise bootstrap --dry-run` first.

## Migration

- [ ] **Decide secrets first.** Chezmoi decrypts age files into `$HOME`. Mise
      `[bootstrap.secrets]` takes values from the environment and templates
      them into files, so the Work VS Code settings and `~/.doti` need a
      store (keychain/password manager) or stay age-encrypted via a task.
      No plaintext in the repo either way.
- [ ] Inventory what must survive: packages, age key, VS Code extensions and
      profile linking, Claude MCP merge, skills, git hooks, macOS defaults,
      shell activation.
- [ ] Spike on a branch, packages only: `[bootstrap.packages]` per OS, then
      `mise bootstrap --only packages --dry-run`.
- [ ] Convert dotfiles to `[dotfiles]` groups; keep `mode = "symlink"` for
      files apps edit, templates for the rest.
- [ ] Convert scripts to `[bootstrap]` sections, hooks, or one `bootstrap`
      task: VS Code extensions (`vscode.yaml`), skills, githooks, macOS
      defaults, shell.
- [ ] Move tools from `packages.yaml` to `[tools]` where mise can own them.
- [ ] Test from zero on Windows and macOS: install mise, run
      `mise bootstrap`, get a working shell and apps.
- [ ] Remove chezmoi only after parity. Delete `home/.chezmoiscripts/`,
      `home/.chezmoi*`, and the chezmoi bootstrap from the README.

## WezTerm

- [ ] One `wezterm.lua` in `~/.config/wezterm/wezterm.lua`, applied by the
      dotfiles on both OSes. Font and shell chosen with
      `wezterm.target_triple`.
- [ ] Run alongside Windows Terminal/Ghostty until config, fonts and keybinds
      match.
- [ ] Then remove Windows Terminal and Ghostty.

## Done when

- A fresh Windows or macOS machine goes from nothing to usable with one
  `mise bootstrap`.
- Both OSes share the same WezTerm config.
- VS Code extensions still sync from `vscode.yaml` and `save` still works.
- No secret is plaintext in git.
