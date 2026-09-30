# aliases.zsh — all aliases in one place

# --- File ops ---
alias cp='cp -iv'
alias mv='mv -iv'
alias rm='rm -i'
alias mkdir='mkdir -p'

# --- Navigation ---
alias ..='cd ..'
alias ...='cd ../..'
alias ~='cd ~'
alias -- -='cd -'

# --- Dotfiles ---
# Two directions: `up` brings everything in, `save` sends this machine's
# changes out. Anything else is `cz <command>` (cz status, cz diff, cz edit).
alias cz='chezmoi'
alias up='topgrade'   # brew, winget, npm, VS Code extensions, skills, then chezmoi update

# save [message]: refresh the VS Code extension lists, re-add changed
# encrypted files (Work settings), then commit and push whatever changed.
# The pre-commit hook scans the commit for secrets first.
save() {
  local repo; repo="$(chezmoi source-path)/.." || return
  command -v code >/dev/null && node "$repo/scripts/vscode-save-extensions.mjs" >/dev/null
  chezmoi re-add
  git -C "$repo" add -A
  if git -C "$repo" diff --cached --quiet; then echo "nothing to save"; return 0; fi
  git -C "$repo" status --short
  git -C "$repo" commit -q -m "${1:-save from $(hostname -s)}" && git -C "$repo" push -q && echo "saved and pushed"
}

# --- OpenCode ---
alias oc='opencode'
alias ocr='opencode run'

# --- Networking ---
alias myip='curl -s ifconfig.me'
alias ping='ping -c 5'

# --- Listing ---
alias ll='ls -lah'
alias la='ls -A'
alias l1='ls -1'

# --- System ---
alias df='df -h'
alias du='du -h -d 2'
alias free='vm_stat 2>/dev/null || free -h'
alias reload='exec zsh'
alias path='echo "$PATH" | tr : \\\n'
