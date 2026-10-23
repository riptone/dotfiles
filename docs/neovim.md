# Neovim (LazyVim)

Neovim is the IDE; opencode is the agent. It has no MCP servers on purpose —
that config lives in `config/opencode/`. The only AI is GitHub Copilot
autocomplete (`ai.copilot` extra), off until you run `:Copilot auth`.

## Config

Stock [LazyVim starter](https://github.com/LazyVim/starter), unmodified, in
`config/nvim/`, symlinked whole to `~/.config/nvim`. LazyVim writes
`lazy-lock.json` and `lazyvim.json` back through the symlink, so both are
versioned here. Plugins live in `stdpath("data")`, not in the repo.

`lua/config/*.lua` are the starter defaults. Add overrides there or new spec
files under `lua/plugins/`; nothing else is managed. `lua/plugins/colorscheme.lua`
is the one override: Pierre, the same palette as the VS Code extension, with
lualine matched and tokyonight disabled.

## Cheatsheet

`<leader>` is space. Press it and wait; which-key lists everything.

| Keys | Does |
| --- | --- |
| `<leader>ff` / `<leader><space>` | find files from the project root |
| `<leader>fr` | recent files |
| `<leader>sg` | live grep |
| `<leader>fb` | open buffers |
| `<leader>e` | file explorer |
| `<C-h/j/k/l>` | move between splits |
| `<C-/>` | toggle terminal |
| `<leader>gg` | lazygit |
| `gd` / `gr` / `K` | definition / references / hover |
| `<leader>ca` / `<leader>cr` | code action / rename |
| `<leader>cf` / `<leader>cd` | format / line diagnostics |
| `[d` / `]d` | previous / next diagnostic |
| `<leader>D` | toggle DBUI (SQL) |
| `<leader>qq` | quit all |
| `:Lazy` | plugin manager: sync, update, clean |
| `:LazyExtras` | enable/disable language extras |
| `:Mason` | LSP/formatter/linter installs |
| `:LazyHealth` | diagnose the config |

## Copilot

`ai.copilot` uses `copilot.lua` and `blink-copilot`: suggestions show up in
blink's completion menu; `<C-y>` accepts. Run `:Copilot auth` once (free tier
works; no paid plan needed). Disable the extra in `:LazyExtras` to remove it.

## Extras are the profile system

There is no profile plugin worth adding. LazyVim extras are lazy, so the Home
and Work languages live in one config at no startup cost. Enabled in
`lazyvim.json` and editable with `:LazyExtras`:

| Extra | Replaces |
| --- | --- |
| `lang.typescript` + `lang.typescript.biome` | TS/JS + Biome extension |
| `lang.svelte` | Svelte for VS Code |
| `lang.sql` | dbcode: `vim-dadbod` + `vim-dadbod-ui` (`<leader>D`) |

Not replaced, on purpose: Live Server, PDF preview, indent-rainbow and
errorlens (LazyVim defaults cover the useful part), Remote-SSH (use the
terminal), Bruno (GUI client), GitHub PRs (use `gh`).

## Database connections

`:DBUIAddConnection` stores URLs under `stdpath("data")/dadbod_ui`, outside
this repo. That keeps credentials out of git; reuse the same DSNs as
`~/.doti/dbhub.toml`. To auto-load them, set `vim.g.dbs` from the environment
in `lua/plugins/` — do not commit the URLs.

## Neovim version

`neovim = "latest"` in `config/mise/config.toml`. LazyVim requires >= 0.11.2.
After a version bump, run `nvim --headless "+Lazy! sync" +qa` to refresh
`lazy-lock.json`.
