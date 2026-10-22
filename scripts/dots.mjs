#!/usr/bin/env node
// Everything mise can't declare, as one cross-platform script (node ships
// with mise). Run through the tasks in mise.toml:  node scripts/dots.mjs <cmd>
//
//   mcp           merge home/.claude/mcp.json into ~/.claude.json (only mcpServers)
//   vscode        register profiles in VS Code's storage.json, install extensions
//   skills        install home/.agents/skills.json for Claude Code and opencode
//   secrets       decrypt every *.age in the repo next to itself (home/.doti is linked by hand, see below) (asks for the key passphrase once)
//   save-lists    rewrite config/vscode/profiles.json and home/.agents/skills.json from this machine
import { execFileSync, spawnSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const home = os.homedir()
const win = process.platform === "win32"
const file = {
  mcp: path.join(repo, "home", ".claude", "mcp.json"),
  skills: path.join(repo, "home", ".agents", "skills.json"),
  vscode: path.join(repo, "config", "vscode", "profiles.json"),
}
const data = (name) => JSON.parse(fs.readFileSync(file[name], "utf8"))
const writeJson = (file, obj) => fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n")
const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback)
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { stdio: "inherit", shell: win, ...opts })
const out = (cmd, args) =>
  execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], shell: win })

const vscodeUser = {
  darwin: path.join(home, "Library", "Application Support", "Code", "User"),
  win32: path.join(process.env.APPDATA ?? "", "Code", "User"),
}[process.platform] ?? path.join(home, ".config", "Code", "User")

const commands = {
  // ~/.claude.json is Claude's own state file: touch mcpServers and nothing else.
  mcp() {
    const file = path.join(home, ".claude.json")
    const json = readJson(file, {})
    const next = { ...json, mcpServers: { ...json.mcpServers, ...data("mcp") } }
    if (JSON.stringify(next) !== JSON.stringify(json)) {
      writeJson(file, next)
      console.log("mcp: updated ~/.claude.json")
    }
  },

  vscode() {
    const { extensions, profiles } = data("vscode")
    // Profile folders are named by a fixed id, so the linked settings files land
    // inside the profile VS Code later finds, not in a fresh one.
    const file = path.join(vscodeUser, "globalStorage", "storage.json")
    const storage = readJson(file, {})
    const have = storage.userDataProfiles ?? []
    for (const { name, location, icon, useDefaultFlags } of profiles) {
      if (!have.some((p) => p.location === location)) {
        have.push({ location, name, icon, ...(useDefaultFlags && { useDefaultFlags }) })
      }
    }
    fs.mkdirSync(path.dirname(file), { recursive: true })
    writeJson(file, { ...storage, userDataProfiles: have })

    const code = codeBin()
    if (!code) return console.log("vscode: not installed yet, skipping extensions")
    const install = (ids, profile) => {
      for (const id of ids) {
        const args = ["--install-extension", id, ...(profile ? ["--profile", profile] : [])]
        if (run(code, args, { stdio: "ignore" }).status) console.log(`  failed: ${id}`)
      }
    }
    install(extensions)
    for (const p of profiles) install(p.extensions, p.name)
  },

  // Install only; `skills add` overwrites, and removal is `npx skills remove -g <name>`.
  skills() {
    for (const [source, names] of Object.entries(data("skills"))) {
      const r = run("npx", ["-y", "skills", "add", source, "-g", "-y", "-a", "claude-code", "opencode", "-s", ...names], {
        cwd: home,
        stdio: "ignore",
      })
      if (r.status) console.log(`  failed: ${source}`)
    }
  },

  // The age key is key.txt.age in a secret gist on your GitHub account, found
  // through `gh`, locked with a passphrase. See docs/secrets.md.
  secrets() {
    const key = path.join(home, ".config", "age", "key.txt")
    if (!fs.existsSync(key) || !fs.statSync(key).size) {
      if (spawnSync("gh", ["auth", "status"], { stdio: "ignore", shell: win }).status) run("gh", ["auth", "login"])
      const id = out("gh", ["api", "gists", "--paginate", "--jq", '.[] | select(.files | has("key.txt.age")) | .id'])
        .split(/\r?\n/)[0]
      if (!id) throw new Error("no gist with key.txt.age on this gh account - see docs/secrets.md")
      const tmp = path.join(os.tmpdir(), "key.txt.age")
      fs.writeFileSync(tmp, out("gh", ["api", `gists/${id}`, "--jq", '.files["key.txt.age"].content']).trim() + "\n")
      fs.mkdirSync(path.dirname(key), { recursive: true })
      console.log("==> decrypting the age key (your passphrase)")
      // Decrypt to a side file: a wrong passphrase must not leave a key behind.
      const r = run("age", ["--decrypt", "--output", key + ".tmp", tmp])
      fs.rmSync(tmp, { force: true })
      if (r.status) {
        fs.rmSync(key + ".tmp", { force: true })
        throw new Error("could not decrypt the age key")
      }
      fs.renameSync(key + ".tmp", key)
      fs.chmodSync(key, 0o600)
    }
    // Each secret sits in the repo as <target>.age. Files under home/ land in
    // ~ (home/.doti/x.age -> ~/.doti/x); the rest decrypt in place, where a
    // [dotfiles] entry links them.
    const found = execFileSync("git", ["-C", repo, "ls-files", "*.age"], { encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean)
    for (const rel of found) {
      const plain = rel.slice(0, -".age".length)
      const target = rel.startsWith("home/") ? path.join(home, plain.slice("home/".length)) : path.join(repo, plain)
      fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 })
      const r = run("age", ["--decrypt", "--identity", key, "--output", target, path.join(repo, rel)])
      if (r.status) throw new Error(`could not decrypt ${rel}`)
      fs.chmodSync(target, 0o600)
    }
    console.log("secrets: decrypted")
  },

  // Refresh the vscode and skills lists from what is installed here, so installs and removals
  // made by hand are tracked. `mise run save` does this before committing.
  "save-lists"() {
    const code = codeBin()
    if (code) {
      const list = (profile) => {
        try {
          return out(code, ["--list-extensions", ...(profile ? ["--profile", profile] : [])])
            .split(/\r?\n/)
            .filter(Boolean)
            .sort()
        } catch {
          return null
        }
      }
      const v = data("vscode")
      v.extensions = list(null) ?? v.extensions
      for (const p of v.profiles) p.extensions = list(p.name) ?? p.extensions
      writeJson(file.vscode, v)
    }
    const lock = readJson(path.join(home, ".agents", ".skill-lock.json"), null)
    if (lock) {
      const bySource = {}
      for (const [name, s] of Object.entries(lock.skills)) (bySource[s.source] ??= []).push(name)
      const sorted = Object.fromEntries(Object.keys(bySource).sort().map((k) => [k, bySource[k].sort()]))
      writeJson(file.skills, sorted)
    }
  },
}

function codeBin() {
  const mac = "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"
  for (const c of ["code", mac]) {
    if (c !== "code" && !fs.existsSync(c)) continue
    if (!spawnSync(c, ["--version"], { stdio: "ignore", shell: win && c === "code" }).status) return c
  }
  return null
}

const cmd = commands[process.argv[2]]
if (!cmd) {
  console.error(`usage: scripts/dots.mjs <${Object.keys(commands).join("|")}>`)
  process.exit(1)
}
try {
  cmd()
} catch (e) {
  console.error(e.message)
  process.exit(1)
}
