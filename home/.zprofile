# .zprofile — login shell config (managed by mise, see mise.toml)

# Homebrew (casks only) — detect the prefix instead of assuming Apple Silicon, so Intel Macs
# (/usr/local) and Linuxbrew (/home/linuxbrew) get brew on PATH too.
for _brew in /opt/homebrew/bin/brew /usr/local/bin/brew /home/linuxbrew/.linuxbrew/bin/brew; do
  [ -x "$_brew" ] && eval "$("$_brew" shellenv)" && break
done
unset _brew

# (Homebrew's HOMEBREW_NO_* vars are in [env] of config/mise/config.toml. The
# non-interactive vars for agents - GIT_EDITOR=true, PAGER=cat, ... - live in
# home/.claude/settings.json "env", so they apply to Claude's commands only.)

# User-level binaries (Claude Code's native installer on Linux, pipx, ...).
export PATH="$HOME/.local/bin:$PATH"

# Added by OrbStack: command-line tools and integration
# This won't be added again if you remove it.
source ~/.orbstack/shell/init.zsh 2>/dev/null || :
