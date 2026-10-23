# Secrets

Plaintext credentials never go in this repo. It's public, and nothing scans for
secrets, so check every diff before you push.

## How it works

1. **The secrets are in this repo, encrypted.** `*.age` files (next to where they land)
   encrypted with [age](https://age-encryption.org) to a random key. A random
   256-bit key can't be guessed or brute-forced, so the ciphertext being
   public is fine.
2. **The key is not in this repo.** `key.txt.age` lives in a **secret gist**
   on your GitHub account, itself encrypted with your passphrase. The gist's
   URL isn't written anywhere: `scripts/dots.mjs secrets` finds it through
   your `gh` login, by looking for the gist that contains a file named
   `key.txt.age`. Secret gists aren't listed or searchable, and the ID is
   random.

To read a secret, someone needs **both** your GitHub login and your
passphrase. The passphrase is stored nowhere: keep it in a password manager
or offline. If it's lost, rebuild the secrets from the original passwords.

On each machine the key is decrypted **once**, to `~/.config/age/key.txt`
(0600). `mise bootstrap` runs `mise run secrets` before it links dotfiles; it
only asks for the passphrase when that file is missing.

## What's in it

| File | Lands at | Used by |
|---|---|---|
| `home/.doti/connections.csv.age` | `~/.doti/connections.csv`, and from it the generated `~/.doti/dbhub.toml` (never edit that one) | The dbhub MCP server in Claude and opencode; DBCode imports the CSV |
| `config/vscode/profiles/Work/settings.json.age` | `config/vscode/profiles/Work/settings.json` (git-ignored) | The Work VS Code profile |

They're written as real files at 0600. (`~/.doti` is a historical name; the
insales project reads from it.) Claude is denied `Read`/`Edit` on
`~/.doti/**` and on the key.

## Daily use

Edit the decrypted file (`~/.doti/connections.csv`, then `node scripts/dots.mjs dbhub` to regenerate the toml, or the Work VS Code settings
in VS Code), then `save`: it re-encrypts every secret whose decrypted copy
changed, then commits and pushes.

On your other machines, `up` pulls it and `mise run secrets` decrypts it.
To add a new secret: encrypt it to `<target>.age` (files under `home/` land in
`~`, e.g. `home/.doti/x.age` becomes `~/.doti/x`; others decrypt in place),
add the plaintext path to `.gitignore`, and `mise run secrets` picks it up.

## A new machine

The README one-liner handles it: it asks for `gh auth login` if needed, then
your passphrase once.

## Rotating

- **A password inside a secret:** change it at the source, re-encrypt the
  file, commit.
- **The key itself (e.g. a machine was lost):**
  1. `age-keygen -o ~/.config/age/key.txt`.
  2. Re-encrypt every `*.age` in the repo to the new key (`age-keygen -y`
     prints its public half).
  3. Upload the new `key.txt.age` (below).

  The old ciphertext stays in git history, so also rotate the passwords it
  protected.

Uploading `key.txt.age` (first time, or after rotating):

```bash
age --encrypt --passphrase --output /tmp/key.txt.age ~/.config/age/key.txt
gh gist create --desc "age key (passphrase-encrypted)" /tmp/key.txt.age   # first time: secret by default
gh gist edit <gist-id> /tmp/key.txt.age                                  # after rotating
rm /tmp/key.txt.age
```

Keep exactly one gist with a `key.txt.age` in it, because the script takes
the first one it finds. Don't share the gist's URL: anyone with it can
download the (still passphrase-locked) key.
