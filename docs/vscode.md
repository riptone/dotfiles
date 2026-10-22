# VS Code

VS Code's own Settings Sync is **not** used. Turn it off (Accounts menu →
Settings Sync → Turn Off), or it will fight mise over the same files.

## What's managed

The real files live in `config/vscode/`, and VS Code's folders on each OS
link to them (the `[dotfiles]` entries in `mise.toml`):

| In the repo (`config/vscode/`) | Linked from |
|---|---|
| `settings.json` | the default profile |
| `profiles/Home/settings.json`, `keybindings.json` | the **Home** profile |
| `profiles/Work/keybindings.json` | the **Work** profile |
| `profiles/Work/settings.json` | the **Work** profile (decrypted from `config/vscode/profiles/Work/settings.json.age`, git-ignored) |

VS Code's folder is `~/Library/Application Support/Code/User` on macOS and
`%APPDATA%\Code\User` on Windows, one `[dotfiles]` entry per file with an
`os` variant. Linux isn't wired up.

**Profiles** are registered by `node scripts/dots.mjs vscode`. VS Code keeps
its list of profiles in `storage.json`, a state file it rewrites all the
time, so the script only adds missing entries to `userDataProfiles` and
touches nothing else. The profile ids (`-45339981` Home, `-1f17a7bd` Work)
are fixed in `config/vscode/profiles.json`, so every machine uses the same folders.

**Extensions** are listed per profile in `config/vscode/profiles.json` and installed by
the `bootstrap` task. After installing or removing one, run `save`: it
rewrites the lists from what's installed (`scripts/dots.mjs save-lists`), then
commits and pushes.

## Why Work is encrypted

The Work settings hold `mssql.connections`: the client server addresses and
usernames saved by the SQL Server extension. Their passwords live in the
keychain, not in the file. The repo is public, so the whole file is
encrypted like the other secrets (`config/vscode/profiles/Work/settings.json.age`),
and `mise run secrets` decrypts it to `config/vscode/profiles/Work/settings.json`
(0600, git-ignored).

Edits made in VS Code land in the decrypted file, which git ignores. To keep
one, re-encrypt it:

```bash
age -r "$(age-keygen -y ~/.config/age/key.txt)" -o config/vscode/profiles/Work/settings.json.age config/vscode/profiles/Work/settings.json
```

then `save`. Home and default settings are plain links: changes land in the
repo straight away.

## Caveats

- **Close VS Code before the first `mise bootstrap` on a new machine.** It
  rewrites `storage.json` while running and could drop the profile entries.
  Just apply again if it does.
- **Connection passwords don't travel.** The SQL Server extension keeps them
  in the OS keychain, so each machine asks for them once.
