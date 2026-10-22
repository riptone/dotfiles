# New Windows machine, one line (PowerShell, Developer Mode on):
#   irm https://raw.githubusercontent.com/riptone/dotfiles/main/scripts/install.ps1 | iex
# Preview first:  $env:DOTFILES_DRY_RUN = 1, then the line above.
$ErrorActionPreference = 'Stop'

$dir = if ($env:DOTFILES_DIR) { $env:DOTFILES_DIR } else { Join-Path $HOME 'dotfiles' }
$refresh = { $env:PATH = [Environment]::GetEnvironmentVariable('PATH', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('PATH', 'User') }

if (-not (Get-Command git -ErrorAction SilentlyContinue)) { winget install --id Git.Git -e --silent; & $refresh }
if (-not (Test-Path $dir)) { git clone https://github.com/riptone/dotfiles $dir }
if (-not (Get-Command mise -ErrorAction SilentlyContinue)) { irm https://mise.run/powershell | iex; & $refresh }

Set-Location $dir
mise trust .
# Only needed until bootstrap links ~/.config/mise back into this repo.
$env:MISE_GLOBAL_CONFIG_FILE = Join-Path $dir 'config\mise\config.toml'
if ($env:DOTFILES_DRY_RUN) { mise bootstrap --dry-run } else { mise bootstrap }
