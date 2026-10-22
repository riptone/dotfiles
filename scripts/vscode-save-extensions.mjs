#!/usr/bin/env node
// Rewrites the extension lists in home/.chezmoidata/vscode.yaml from what is
// installed right now, per profile. Run it after installing or removing an
// extension, then commit:  node scripts/vscode-save-extensions.mjs
import { execSync } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const yamlPath = path.join(repo, "home", ".chezmoidata", "vscode.yaml")
const user = {
  darwin: path.join(os.homedir(), "Library", "Application Support", "Code", "User"),
  win32: path.join(process.env.APPDATA ?? "", "Code", "User"),
}[process.platform] ?? path.join(os.homedir(), ".config", "Code", "User")

const isBuiltin = (e) =>
  e.metadata?.isBuiltin === true || /\/resources\/app\/extensions\//.test(e.location?.path ?? "")
const ids = (file) =>
  fs.existsSync(file)
    ? [
        ...new Set(
          JSON.parse(fs.readFileSync(file, "utf8"))
            .filter((e) => !isBuiltin(e))
            .map((e) => e.identifier.id),
        ),
      ].sort()
    : []
const list = (xs, indent) => xs.map((x) => `${indent}- ${x}\n`).join("")
// Ask VS Code itself first: it includes extensions a profile inherits from the
// default profile, which the profile's extensions.json does not list.
const cli = (profile) => {
  try {
    const args = profile ? ` --profile ${JSON.stringify(profile)}` : ""
    return execSync(`code --list-extensions${args}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .sort()
  } catch {
    return null
  }
}

// Profile folder ids are per machine. Resolve them by name so a profile whose
// id differs between macOS and Windows still saves the right list.
const storageFile = path.join(user, "globalStorage", "storage.json")
const storage = fs.existsSync(storageFile)
  ? JSON.parse(fs.readFileSync(storageFile, "utf8"))
  : {}
const profileDirs = new Map((storage.userDataProfiles ?? []).map((p) => [p.name, p.location]))

// Keep everything but the extension lists: split on them and splice in.
let yaml = fs.readFileSync(yamlPath, "utf8")
const defaults =
  cli(null) ?? ids(path.join(os.homedir(), ".vscode", "extensions", "extensions.json"))
yaml = yaml.replace(/(\n  extensions:[^\n]*\n)(?:    - [^\n]*\n)*/, `$1${list(defaults, "    ")}`)
// Look each profile up again after every splice: a list that changed length
// shifts everything after it, so offsets from before the splice are stale.
for (const [, name, loc] of [...yaml.matchAll(/\n    - name: ([^\n]+)\n      location: "([^"]+)"/g)]) {
  const dir = profileDirs.get(name.trim()) ?? loc
  const exts =
    cli(name.trim()) ?? ids(path.join(user, "profiles", dir, "extensions.json"))
  const at = yaml.indexOf("\n      extensions:\n", yaml.indexOf(`\n    - name: ${name.trim()}`))
  const start = at + "\n      extensions:\n".length
  let end = start
  while (yaml.startsWith("        - ", end)) end = yaml.indexOf("\n", end) + 1
  yaml = yaml.slice(0, start) + list(exts, "        ") + yaml.slice(end)
}
fs.writeFileSync(yamlPath, yaml)
console.log(`updated ${path.relative(repo, yamlPath)}`)
