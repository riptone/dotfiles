#!/usr/bin/env node
// Everything mise can't declare, as one cross-platform script (node ships
// with mise). Run through the tasks in mise.toml:  node scripts/dots.mjs <cmd>
//
//   mcp           merge home/.claude/mcp.json into ~/.claude.json (only mcpServers)
//   vscode        register profiles in VS Code's storage.json, install missing extensions (--prune: remove the rest)
//   skills        install home/.agents/skills.json for Claude Code and opencode
//   secrets       decrypt every *.age in the repo next to itself (home/.doti is linked by hand, see below) (asks for the key passphrase once)
//   dbhub         generate ~/.doti/dbhub.toml from ~/.doti/connections.csv (`secrets` does it too)
//   reencrypt     re-encrypt secrets whose decrypted copy changed on this machine
//   save-lists    reencrypt, then rewrite config/vscode/profiles.json and home/.agents/skills.json
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generate } from "./dbhub.mjs";

const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const home = os.homedir();
const win = process.platform === "win32";
const file = {
	mcp: path.join(repo, "home", ".claude", "mcp.json"),
	skills: path.join(repo, "home", ".agents", "skills.json"),
	vscode: path.join(repo, "config", "vscode", "profiles.json"),
};
const data = (name) =>
	JSON.parse(fs.readFileSync(file[name], "utf8").replace(/^\uFEFF/, ""));
const writeJson = (file, obj) =>
	fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n");
const readJson = (file, fallback) =>
	fs.existsSync(file)
		? JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, ""))
		: fallback;
const run = (cmd, args, opts = {}) =>
	spawnSync(cmd, args, { stdio: "inherit", shell: win, ...opts });
const out = (cmd, args) =>
	execFileSync(cmd, args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "ignore"],
		shell: win,
	});

const vscodeUser =
	{
		darwin: path.join(home, "Library", "Application Support", "Code", "User"),
		win32: path.join(process.env.APPDATA ?? "", "Code", "User"),
	}[process.platform] ?? path.join(home, ".config", "Code", "User");

const commands = {
	// ~/.claude.json is Claude's own state file: touch mcpServers and nothing else.
	mcp() {
		const file = path.join(home, ".claude.json");
		const json = readJson(file, {});
		const next = {
			...json,
			mcpServers: { ...json.mcpServers, ...data("mcp") },
		};
		if (JSON.stringify(next) !== JSON.stringify(json)) {
			writeJson(file, next);
			console.log("mcp: updated ~/.claude.json");
		}
	},

	vscode() {
		const { extensions, profiles } = data("vscode");
		// Profile folders are named by a fixed id, so the linked settings files land
		// inside the profile VS Code later finds, not in a fresh one.
		const file = path.join(vscodeUser, "globalStorage", "storage.json");
		const storage = readJson(file, {});
		const have = storage.userDataProfiles ?? [];
		for (const { name, location, icon, useDefaultFlags } of profiles) {
			// Profiles get a random folder id per machine. If one with this name
			// already exists under another id, keep it: adding the configured id
			// would create a second profile with the same name and split extensions.
			const same = have.find((p) => p.name === name);
			if (same && same.location !== location) {
				console.log(
					`vscode: profile ${name} exists at ${same.location}, not ${location}; leaving it alone`,
				);
				continue;
			}
			if (!same) {
				have.push({
					location,
					name,
					icon,
					...(useDefaultFlags && { useDefaultFlags }),
				});
			}
		}
		fs.mkdirSync(path.dirname(file), { recursive: true });
		writeJson(file, { ...storage, userDataProfiles: have });

		const code = codeBin();
		if (!code)
			return console.log("vscode: not installed yet, skipping extensions");
		// List what is installed once per profile, then install only what is missing
		// (a `code --install-extension` call per id is slow). `--prune` also removes
		// what the list doesn't have; `up` passes it, bootstrap doesn't.
		const prune = process.argv.includes("--prune");
		const sync = (want, profile) => {
			const base = profile ? ["--profile", profile] : [];
			const have = out(code, ["--list-extensions", ...base])
				.split(/\r?\n/)
				.filter(Boolean);
			const lower = (xs) => new Set(xs.map((x) => x.toLowerCase()));
			for (const id of want.filter(
				(id) => !lower(have).has(id.toLowerCase()),
			)) {
				if (
					run(code, ["--install-extension", id, ...base], { stdio: "ignore" })
						.status
				)
					console.log(`  failed: ${id}`);
			}
			if (!prune) return;
			for (const id of have.filter(
				(id) => !lower(want).has(id.toLowerCase()),
			)) {
				// A dependency of another extension refuses to go; that is fine, it goes with its parent.
				run(code, ["--uninstall-extension", id, ...base], { stdio: "ignore" });
				console.log(`  removed: ${id}${profile ? ` (${profile})` : ""}`);
			}
		};
		sync(extensions);
		for (const p of profiles) sync(p.extensions, p.name);
	},

	// Install what the lock file doesn't have; `skills add` overwrites, so a
	// source with every skill present is skipped. Removal is `pnpm dlx skills remove -g <name>`.
	skills() {
		const lock = readJson(path.join(home, ".agents", ".skill-lock.json"), {
			skills: {},
		}).skills;
		for (const [source, names] of Object.entries(data("skills"))) {
			if (names.every((n) => lock[n])) continue;
			const r = run(
				"pnpm",
				[
					"dlx",
					"skills",
					"add",
					source,
					"-g",
					"-y",
					"-a",
					"claude-code",
					"opencode",
					"-s",
					...names,
				],
				{
					cwd: home,
					stdio: "ignore",
				},
			);
			if (r.status) console.log(`  failed: ${source}`);
		}
	},

	// The age key is key.txt.age in a secret gist on your GitHub account, found
	// through `gh`, locked with a passphrase. See docs/secrets.md.
	secrets() {
		const key = path.join(home, ".config", "age", "key.txt");
		if (!fs.existsSync(key) || !fs.statSync(key).size) {
			if (
				spawnSync("gh", ["auth", "status"], { stdio: "ignore", shell: win })
					.status
			)
				run("gh", ["auth", "login"]);
			// No --jq: Windows shells mangle the quotes in the filter, so GitHub
			// would receive `has(key.txt.age)` and fail with "function not defined".
			const gists = JSON.parse(
				out("gh", ["api", "gists", "--paginate", "--slurp"]),
			).flat();
			const gist = gists.find((g) => g.files && "key.txt.age" in g.files);
			if (!gist)
				throw new Error(
					"no gist with key.txt.age on this gh account - see docs/secrets.md",
				);
			const tmp = path.join(os.tmpdir(), "key.txt.age");
			const content = JSON.parse(out("gh", ["api", `gists/${gist.id}`])).files[
				"key.txt.age"
			].content;
			fs.writeFileSync(tmp, content.trim() + "\n");
			fs.mkdirSync(path.dirname(key), { recursive: true });
			console.log("==> decrypting the age key (your passphrase)");
			// Decrypt to a side file: a wrong passphrase must not leave a key behind.
			const r = run("age", ["--decrypt", "--output", key + ".tmp", tmp]);
			fs.rmSync(tmp, { force: true });
			if (r.status) {
				fs.rmSync(key + ".tmp", { force: true });
				throw new Error("could not decrypt the age key");
			}
			fs.renameSync(key + ".tmp", key);
			fs.chmodSync(key, 0o600);
		}
		for (const { rel, target } of secretFiles()) {
			fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
			// Decrypt to a side file so an edit not yet `save`d is kept as .bak
			// instead of being overwritten. Only under ~: a .bak in the repo
			// would not be git-ignored.
			const tmp = target + ".tmp";
			const r = run("age", [
				"--decrypt",
				"--identity",
				key,
				"--output",
				tmp,
				path.join(repo, rel),
			]);
			if (r.status) {
				fs.rmSync(tmp, { force: true });
				throw new Error(`could not decrypt ${rel}`);
			}
			if (
				target.startsWith(home) &&
				fs.existsSync(target) &&
				!fs.readFileSync(target).equals(fs.readFileSync(tmp))
			) {
				fs.copyFileSync(target, target + ".bak");
				fs.chmodSync(target + ".bak", 0o600);
				console.log(`secrets: ${target} differed, old copy kept as .bak`);
			}
			fs.renameSync(tmp, target);
			fs.chmodSync(target, 0o600);
		}
		console.log("secrets: decrypted");
		commands.dbhub();
	},

	// dbhub.toml is derived from connections.csv, the one secret; never edit it.
	dbhub() {
		const dir = path.join(home, ".doti");
		const csv = path.join(dir, "connections.csv");
		if (!fs.existsSync(csv)) return;
		const r = generate(csv, path.join(dir, "dbhub.toml"));
		console.log(
			`dbhub: ${r.count} sources${r.changed ? ", dbhub.toml regenerated" : ", no change"}`,
		);
		if (r.added.length) console.log(`  + ${r.added.join(", ")}`);
		if (r.removed.length) console.log(`  - ${r.removed.join(", ")}`);
		if (r.changedDsn.length)
			console.log(`  ~ dsn changed: ${r.changedDsn.join(", ")}`);
		for (const p of r.problems) console.log(`  ! skipped, ${p}`);
	},

	// Re-encrypt every secret whose decrypted copy changed here (an edit made in
	// VS Code to the Work settings, or by hand to ~/.doti). `save` runs this.
	reencrypt() {
		const key = path.join(home, ".config", "age", "key.txt");
		if (!fs.existsSync(key)) return;
		const recipient = out("age-keygen", ["-y", key]).trim();
		for (const { rel, target } of secretFiles()) {
			if (!fs.existsSync(target)) continue;
			const enc = path.join(repo, rel);
			const current = execFileSync(
				"age",
				["--decrypt", "--identity", key, enc],
				{ stdio: ["ignore", "pipe", "ignore"], shell: win },
			);
			if (current.equals(fs.readFileSync(target))) continue;
			if (
				run("age", [
					"--encrypt",
					"--recipient",
					recipient,
					"--output",
					enc,
					target,
				]).status
			)
				throw new Error(`could not encrypt ${rel}`);
			console.log(`secrets: re-encrypted ${rel}`);
		}
	},

	// Refresh the vscode and skills lists from what is installed here, so installs and removals
	// made by hand are tracked. `mise run save` does this before committing.
	"save-lists"() {
		commands.reencrypt();
		const code = codeBin();
		if (code) {
			const list = (profile) => {
				try {
					return out(code, [
						"--list-extensions",
						...(profile ? ["--profile", profile] : []),
					])
						.split(/\r?\n/)
						.filter(Boolean)
						.sort();
				} catch {
					return null;
				}
			};
			const v = data("vscode");
			v.extensions = list(null) ?? v.extensions;
			for (const p of v.profiles) p.extensions = list(p.name) ?? p.extensions;
			writeJson(file.vscode, v);
		}
		const lock = readJson(path.join(home, ".agents", ".skill-lock.json"), null);
		if (lock) {
			const bySource = {};
			for (const [name, s] of Object.entries(lock.skills))
				(bySource[s.source] ??= []).push(name);
			const sorted = Object.fromEntries(
				Object.keys(bySource)
					.sort()
					.map((k) => [k, bySource[k].sort()]),
			);
			writeJson(file.skills, sorted);
		}
	},
};

// Each secret sits in the repo as <target>.age. Files under home/ land in ~
// (home/.doti/x.age -> ~/.doti/x); the rest decrypt in place, where a
// [dotfiles] entry links them.
function secretFiles() {
	// Walk the repo instead of asking git: a broken global git config (or a
	// missing git) must not block decrypting the files bootstrap needs.
	const rels = [];
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === ".git" || entry.name === "node_modules") continue;
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(full);
			else if (entry.isFile() && entry.name.endsWith(".age"))
				rels.push(path.relative(repo, full).split(path.sep).join("/"));
		}
	};
	walk(repo);
	return rels.sort().map((rel) => {
		const plain = rel.slice(0, -".age".length);
		const target = rel.startsWith("home/")
			? path.join(home, plain.slice("home/".length))
			: path.join(repo, plain);
		return { rel, target };
	});
}

function codeBin() {
	const mac =
		"/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code";
	for (const c of ["code", mac]) {
		if (c !== "code" && !fs.existsSync(c)) continue;
		if (
			!spawnSync(c, ["--version"], {
				stdio: "ignore",
				shell: win && c === "code",
			}).status
		)
			return c;
	}
	return null;
}

const cmd = commands[process.argv[2]];
if (!cmd) {
	console.error(`usage: scripts/dots.mjs <${Object.keys(commands).join("|")}>`);
	process.exit(1);
}
try {
	cmd();
} catch (e) {
	console.error(e.message);
	process.exit(1);
}
