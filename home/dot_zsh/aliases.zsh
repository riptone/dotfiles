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

# --- Dotfiles (chezmoi) ---
alias dot='chezmoi cd'          # a shell in the repo; exit to come back
alias dotu='chezmoi update'     # git pull, then apply
alias dotd='chezmoi diff'       # what apply would change
# What's changed and not saved yet: in $HOME vs the repo, then in the repo vs git.
alias dots='chezmoi status; chezmoi git -- status --short'
alias up='topgrade'             # update everything (brew, winget, npm, VS Code, chezmoi)

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
