# dotfiles PowerShell profile — managed by mise, see mise.toml.
# Mirrors zsh/.zprofile + zsh/.zshrc + aliases on macOS/Linux, so a Windows
# machine gets the same prompt, tools, and shortcuts.

# mise's PowerShell chpwd hook needs PS7; silence the warning on Windows 5.1.
$env:MISE_PWSH_CHPWD_WARNING = '0'

# User-level binaries, same as ~/.local/bin in .zprofile.
# Compare whole entries: a PATH entry pointing at a file inside the folder
# (claude.exe) would make a wildcard match skip the folder itself.
$localBin = Join-Path $env:USERPROFILE '.local\bin'
if ((Test-Path $localBin) -and ($env:PATH -split ';' -notcontains $localBin)) {
    $env:PATH = "$localBin;$env:PATH"
}

# --- Environment (parity with zsh/.zprofile + .zshrc) ---
# fzf drives traversal with fd (respects .gitignore, includes dotfiles).
if (Get-Command fd -ErrorAction SilentlyContinue) {
    $env:FZF_DEFAULT_COMMAND = 'fd --type f --hidden --strip-cwd-prefix --exclude .git'
    $env:FZF_CTRL_T_COMMAND  = $env:FZF_DEFAULT_COMMAND
    $env:FZF_ALT_C_COMMAND   = 'fd --type d --hidden --strip-cwd-prefix --exclude .git'
}
$env:FZF_DEFAULT_OPTS = '--height 40% --layout=reverse --border --info=inline'
$env:FZF_ALT_C_OPTS = '--preview "Get-ChildItem {}"'
# The non-interactive vars for agents (GIT_EDITOR=true, PAGER=cat, ...) live
# in claude/.claude/settings.json "env", not in this shell.

# --- Dotfiles, same as aliases.zsh ---
function up { mise -C (Join-Path $HOME 'dotfiles') run up }
function save { mise -C (Join-Path $HOME 'dotfiles') run save @args }
function dots { Set-Location (Join-Path $HOME 'dotfiles') }

# mise: puts every tool in config/mise/config.toml on PATH
if (Get-Command mise -ErrorAction SilentlyContinue) {
    (& mise activate pwsh) | Out-String | Invoke-Expression
}

# --- Tool init (parity with .zshrc) ---
if (Get-Command zoxide -ErrorAction SilentlyContinue) {
    $env:_ZO_EXCLUDE_DIRS = '/tmp:/var:/proc:/sys:/node_modules:/.git'
    $env:_ZO_MAXAGE = '365'
    Invoke-Expression (& { (zoxide init powershell | Out-String) })
}
if (Get-Command starship -ErrorAction SilentlyContinue) {
    Invoke-Expression (&starship init powershell | Out-String)
}

# --- PSReadLine: fish-style history prediction (parity with zsh-autosuggestions
#     + fast-syntax-highlighting). Ships with PowerShell 7; guarded for older. ---
if (Get-Module -ListAvailable -Name PSReadLine) {
    Import-Module PSReadLine
    Set-PSReadLineOption -EditMode Emacs
    Set-PSReadLineOption -HistoryNoDuplicates
    try { Set-PSReadLineOption -PredictionSource History } catch { }  # PSReadLine 2.1.0+
    try { Set-PSReadLineOption -PredictionViewStyle ListView } catch { }  # PSReadLine 2.2+
    Set-PSReadLineKeyHandler -Key Tab         -Function MenuComplete
    Set-PSReadLineKeyHandler -Key Ctrl+v      -Function Paste  # Emacs mode drops the Windows Ctrl+V paste
    Set-PSReadLineKeyHandler -Key Ctrl+c      -Function CopyOrCancelLine  # Emacs mode sends ^C (newline) when nothing is selected
    Set-PSReadLineKeyHandler -Key UpArrow     -Function HistorySearchBackward
    Set-PSReadLineKeyHandler -Key DownArrow   -Function HistorySearchForward
    Set-PSReadLineKeyHandler -Key Ctrl+z              -Function Undo
    Set-PSReadLineKeyHandler -Key Ctrl+LeftArrow      -Function BackwardWord
    Set-PSReadLineKeyHandler -Key Ctrl+RightArrow     -Function ForwardWord
    Set-PSReadLineKeyHandler -Key Ctrl+Shift+LeftArrow  -Function SelectBackwardWord
    Set-PSReadLineKeyHandler -Key Ctrl+Shift+RightArrow -Function SelectForwardWord
    # Plain Shift+Arrow (parity with the zsh-shift-select plugin's char selection)
    Set-PSReadLineKeyHandler -Key Shift+LeftArrow  -Function SelectBackwardChar
    Set-PSReadLineKeyHandler -Key Shift+RightArrow -Function SelectForwardChar
}

# --- Tool aliases (parity with aliases.zsh) ---
if (Get-Command opencode -ErrorAction SilentlyContinue) {
    Set-Alias oc opencode
}
# Detached launch: running code from the WezTerm console crashes it (see wezterm log)
function code { Start-Process code -ArgumentList $args }

# --- git shortcuts (parity with aliases.zsh) ---
# NOTE: gc / gp / gl are intentionally NOT defined — they're core PowerShell
# aliases (Get-Content / Get-ItemProperty / Get-Location). Use git's own
# aliases instead: `git c`, `git p`, `git l` (defined in git/.gitconfig).
function gs { git status @args }
function gd { git diff @args }
function ga { git add @args }

# --- Navigation ---
function .. { Set-Location .. }
function ... { Set-Location ..\.. }

# --- Misc (parity with aliases.zsh) ---
function reload { . $PROFILE }

# Clear the startup banner (Windows PowerShell 5.1 welcome text).
Clear-Host
