# Global agent instructions

These apply in every project. A project's own `AGENTS.md` / `CLAUDE.md`
comes first where the two disagree. `~/.claude/CLAUDE.md` is a symlink to
this file, and opencode loads it through `instructions` in `opencode.jsonc`.
The source is `home/dot_claude/AGENTS.md` in the dotfiles repo.

## Before calling something done

- Run the project's own gate (`bun run ci`, `npm run ci`, ...) and report
  what failed. Don't call work finished while it's red.
- Match the project's language: identifiers, comments, docs and commit
  messages follow whatever the repo already uses.

## Never without asking

- `git push`, tags, releases, deploys, or anything that publishes.
- Paid models, paid services, or new accounts.
- Real customer data in a repo, a fixture or a session. Use synthetic data.
- New dependencies or global tools. Prefer what the project already has.

## Tooling defaults

- JS/TS: Bun when the project has a `bun.lock`, otherwise the lockfile's
  package manager. Biome, not ESLint/Prettier, unless the project says so.
- Secrets never go in a repo, a commit message or a doc, even in an example.
