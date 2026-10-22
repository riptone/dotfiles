#!/bin/sh
# New macOS machine, one line:
#   curl -fsSL https://raw.githubusercontent.com/riptone/dotfiles/main/scripts/install.sh | sh
# Preview first:  ... | sh -s -- --dry-run
set -eu

DOTFILES="${DOTFILES_DIR:-$HOME/dotfiles}"

command -v git >/dev/null 2>&1 || { xcode-select --install; echo "re-run once the Command Line Tools finish installing"; exit 1; }
[ -d "$DOTFILES" ] || git clone https://github.com/riptone/dotfiles "$DOTFILES"
command -v mise >/dev/null 2>&1 || curl -fsSL https://mise.run | sh
export PATH="$HOME/.local/bin:$PATH"

cd "$DOTFILES"
mise trust .
# Only needed until bootstrap links ~/.config/mise back into this repo.
MISE_GLOBAL_CONFIG_FILE="$DOTFILES/config/mise/config.toml" mise bootstrap "$@"
