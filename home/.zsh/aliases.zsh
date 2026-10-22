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
# changes out. Both are mise tasks in ~/dotfiles/mise.toml.
alias up='mise -C ~/dotfiles run up'
alias save='mise -C ~/dotfiles run save'
alias dots='cd ~/dotfiles'

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
