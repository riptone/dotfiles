# Secrets

Plaintext credentials never go in this repo. It's public, and CI runs
gitleaks over the full history. A pre-commit hook runs it on your staged
changes too, because a secret caught after the push is already out.

## How it works

There are two layers:

1. **The secrets are in this repo, encrypted.** They're chezmoi
   `encrypted_` files under `home/private_dot_doti/`, encrypted with
   [age](https://age-encryption.org) to a random key. A random 256-bit key
   can't be guessed or brute-forced, so the ciphertext being public is fine.
2. **The key is not in this repo.** `key.txt.age` lives in a **secret gist**
   on your GitHub account, itself encrypted with your passphrase. The gist's
   URL isn't written anywhere: the key script finds it through your `gh`
   login, by looking for the gist that contains a file named `key.txt.age`.
   Secret gists aren't listed or searchable, and the ID is random.

To read a secret, someone needs **both** your GitHub login (to find the
gist) **and** your passphrase. The passphrase is stored nowhere:
keep it in a password manager or somewhere offline. If it's lost, the
secrets have to be rebuilt from the original passwords.

On each machine, the key is decrypted **once**, by
`home/.chezmoiscripts/run_once_before_20-age-key.*`, to
`~/.config/chezmoi/key.txt` (0600). After that, every `chezmoi apply` or
`chezmoi update` decrypts the secrets silently.

## What's in it

| File | Lands at | Used by |
|---|---|---|
| `encrypted_private_dbhub.toml.age` | `~/.doti/dbhub.toml` | The dbhub MCP server, in Claude and opencode |
| `encrypted_private_insales-accounts.json.age` | `~/.doti/insales-accounts.json` | The insales project |

They're written as real files at 0600, in a 0700 directory. (`~/.doti` is a
historical name; the insales project reads from it.) Claude is denied
`Read`/`Edit` on `~/.doti/**` and on the key.

## Daily use

```bash
cz edit ~/.doti/dbhub.toml   # opens the decrypted file in VS Code; re-encrypts when you close the tab
save "dbhub: add source"     # commit and push
```

On your other machines, `up` (or `cz update`) picks it up.

To add a new secret: `cz add --encrypt ~/.doti/new-thing.json`, then `save`.

## A new machine

The one-liner in the README handles it: it asks for `gh auth login` if
needed, then your passphrase once.

## Rotating

- **A password inside a secret:** change it at the source, `chezmoi edit`
  the file, and commit.
- **The key itself (e.g. a machine was lost):**
  1. Generate a new key with `chezmoi age-keygen --output ~/.config/chezmoi/key.txt`.
  2. Put its public half in `home/.chezmoi.toml.tmpl` as `recipient`.
  3. Re-add each secret with `chezmoi add --encrypt`.
  4. Upload the new `key.txt.age` (see below).

  The old ciphertext stays in git history, so also rotate the passwords it
  protected.

Uploading `key.txt.age` (first time, or after rotating):

```bash
chezmoi age encrypt --passphrase --output /tmp/key.txt.age ~/.config/chezmoi/key.txt
gh gist create --desc "chezmoi age key (passphrase-encrypted)" /tmp/key.txt.age   # first time: secret by default
gh gist edit <gist-id> /tmp/key.txt.age                                          # after rotating
rm /tmp/key.txt.age
```

Keep exactly one gist with a `key.txt.age` in it, because the script takes
the first one it finds. Don't share the gist's URL: anyone with it can
download the (still passphrase-locked) key.
