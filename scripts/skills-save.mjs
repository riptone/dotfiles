#!/usr/bin/env node
// Rewrites home/.chezmoidata/skills.yaml from the skills CLI's lock file
// (~/.agents/.skill-lock.json), so a skill installed or removed by hand with
// `npx skills` is tracked. `save` runs it.
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const yamlPath = path.join(repo, "home", ".chezmoidata", "skills.yaml")
const lockPath = path.join(os.homedir(), ".agents", ".skill-lock.json")
if (!fs.existsSync(lockPath)) process.exit(0)

const bySource = {}
for (const [name, s] of Object.entries(JSON.parse(fs.readFileSync(lockPath, "utf8")).skills)) {
  ;(bySource[s.source] ??= []).push(name)
}

// Keep the header comment, replace the list under `skills:`.
const yaml = fs.readFileSync(yamlPath, "utf8")
const head = yaml.slice(0, yaml.indexOf("skills:\n") + "skills:\n".length)
const body = Object.keys(bySource)
  .sort()
  .map((src) => `  ${src}:\n${bySource[src].sort().map((n) => `    - ${n}\n`).join("")}`)
  .join("")
fs.writeFileSync(yamlPath, head + body)
console.log(`updated ${path.relative(repo, yamlPath)}`)
