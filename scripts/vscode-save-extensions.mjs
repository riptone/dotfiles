#!/usr/bin/env node
// Rewrites the extension lists in home/.chezmoidata/vscode.yaml from what is
// installed right now, per profile. Run it after installing or removing an
// extension, then commit:  node scripts/vscode-save-extensions.mjs
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

const ids = (file) =>
  fs.existsSync(file)
    ? [...new Set(JSON.parse(fs.readFileSync(file, "utf8")).map((e) => e.identifier.id))].sort()
    : []
const list = (xs, indent) => xs.map((x) => `${indent}- ${x}\n`).join("")

// Keep everything but the extension lists: split on them and splice in.
let yaml = fs.readFileSync(yamlPath, "utf8")
const defaults = ids(path.join(os.homedir(), ".vscode", "extensions", "extensions.json"))
yaml = yaml.replace(/(\n  extensions:[^\n]*\n)(?:    - [^\n]*\n)*/, `$1${list(defaults, "    ")}`)
for (const m of [...yaml.matchAll(/\n      location: "([^"]+)"/g)]) {
  const exts = ids(path.join(user, "profiles", m[1], "extensions.json"))
  const at = yaml.indexOf("\n      extensions:\n", m.index)
  const start = at + "\n      extensions:\n".length
  let end = start
  while (yaml.startsWith("        - ", end)) end = yaml.indexOf("\n", end) + 1
  yaml = yaml.slice(0, start) + list(exts, "        ") + yaml.slice(end)
}
fs.writeFileSync(yamlPath, yaml)
console.log(`updated ${path.relative(repo, yamlPath)}`)
