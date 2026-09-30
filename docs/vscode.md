# VS Code

VS Code's own Settings Sync is **not** used. Turn it off (Accounts menu →
Settings Sync → Turn Off), or it will fight chezmoi over the same files.

## What's managed

The real files live in one place, `~/.config/vscode/`, and VS Code's folders
on each OS link to them:

| In the repo (`home/dot_config/vscode/`) | Linked from |
|---|---|
| `settings.json` | the default profile |
| `profiles/Home/settings.json`, `keybindings.json` | the **Home** profile |
| `profiles/Work/keybindings.json` | the **Work** profile |
| `profiles/Work/encrypted_private_settings.json.age` | the **Work** profile (encrypted, see below) |

VS Code's folder is `~/Library/Application Support/Code/User` on macOS and
`%APPDATA%\Code\User` on Windows; the link entries for each are under
`home/Library/…` and `home/AppData/Roaming/…`. Linux isn't wired up; it would
be a third tree under `home/dot_config/Code/User/`.

**Profiles** are registered by `…/globalStorage/modify_storage.json`. VS Code
keeps its list of profiles in `storage.json`, a state file it rewrites all
the time, so chezmoi only adds missing entries to `userDataProfiles` and
touches nothing else. The profile ids (`-45339981` Home, `-1f17a7bd` Work)
are fixed in `.chezmoidata/vscode.yaml`, so every machine uses the same
folders.

**Extensions** are listed per profile in `.chezmoidata/vscode.yaml` and
installed by `.chezmoiscripts/run_onchange_after_40-vscode-extensions.*`
whenever that list changes. After installing or removing one, run:

```bash
node scripts/vscode-save-extensions.mjs   # rewrites the lists from what's installed
```

then commit.

## Why Work is encrypted

The Work settings hold `mssql.connections`: the client server addresses and
usernames saved by the SQL Server extension. Their passwords live in the
keychain, not in the file. The repo is public, so the whole file is
encrypted like the other secrets, and lands as a real file at
`~/.config/vscode/profiles/Work/settings.json` (0600).

It's a real file rather than a link, so a change made in VS Code stays local
until you save it back:

```bash
chezmoi re-add ~/.config/vscode/profiles/Work/settings.json   # re-encrypts it into the repo
```

`chezmoi status` shows `MM` on it when there's something to save. Home and
default settings are plain links: changes land in the repo straight away.

## Caveats

- **Close VS Code before a first `chezmoi apply` on a new machine.** It
  rewrites `storage.json` while running and could drop the profile entries.
  Just apply again if it does.
- **Connection passwords don't travel.** The SQL Server extension keeps them
  in the OS keychain, so each machine asks for them once.
