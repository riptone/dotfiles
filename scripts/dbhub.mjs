// Generates ~/.doti/dbhub.toml from ~/.doti/connections.csv (the one secret).
// Ported from insales' assets/scripts/dev/dbhub.mjs, minus the insales-only
// parts (SQLite folder scan, CSV bootstrap, MCP launcher).
//
// Columns: name (dbhub id: mssql_<env>, sqlite_<name>), type (sqlserver | sqlite),
// host, port, database, user, password, options (what follows `?` in the dsn),
// file (SQLite only). The same CSV imports into DBCode.
//
// Each generated source copies its options and [[tools]] from one of the same
// kind already in the toml (SQL Server: a read-only one), so tweaks made to
// the toml by hand survive. Without any, it falls back to a read-only default.
// Never prints passwords or DSNs, only names.

import fs from "node:fs";
import path from "node:path";

// --- dbhub.toml: [[sources]] / [[tools]] blocks, read as text ---------------

const parseBlocks = (text) => {
	const blocks = [];
	let current = { header: null, lines: [] };
	for (const line of text.split(/\r?\n/)) {
		const header = line.match(/^\s*\[\[?\s*([\w.-]+)\s*\]\]?\s*(#.*)?$/);
		if (header) {
			blocks.push(current);
			current = { header: header[1], lines: [line] };
		} else current.lines.push(line);
	}
	blocks.push(current);
	return blocks;
};

const value = (raw) => {
	if (raw.startsWith('"')) return JSON.parse(raw.match(/^"(?:[^"\\]|\\.)*"/)[0]);
	if (raw.startsWith("'")) return raw.slice(1, raw.indexOf("'", 1));
	return raw.replace(/\s*#.*$/, "").trim();
};
const field = (block, key) => {
	for (const line of block.lines) {
		const m = line.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`));
		if (m) return value(m[1].trim());
	}
};
const withField = (block, key, v) => ({
	...block,
	lines: block.lines.map((l) =>
		new RegExp(`^\\s*${key}\\s*=`).test(l) ? `${key} = ${JSON.stringify(v)}` : l,
	),
});

// --- connections.csv --------------------------------------------------------

const parseCsv = (text) => {
	const body = text.replace(/^﻿/, "");
	// Excel in pt-PT writes `;`.
	const sep = body.split(/\r?\n/)[0].includes(";") ? ";" : ",";
	const rows = [];
	let row = [];
	let cell = "";
	let quoted = false;
	for (let i = 0; i < body.length; i++) {
		const c = body[i];
		if (quoted) {
			if (c === '"' && body[i + 1] === '"') {
				cell += '"';
				i++;
			} else if (c === '"') quoted = false;
			else cell += c;
		} else if (c === '"') quoted = true;
		else if (c === sep) {
			row.push(cell);
			cell = "";
		} else if (c === "\n" || c === "\r") {
			if (c === "\r" && body[i + 1] === "\n") i++;
			row.push(cell);
			if (row.some((v) => v !== "")) rows.push(row);
			row = [];
			cell = "";
		} else cell += c;
	}
	row.push(cell);
	if (row.some((v) => v !== "")) rows.push(row);
	const [header = [], ...data] = rows;
	const keys = header.map((h) => h.trim().toLowerCase());
	return data.map((r) =>
		Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])),
	);
};

// --- generate ---------------------------------------------------------------

const OWN_KEYS =
	/^\s*(id|dsn|type|host|port|database|user|password|path|description)\s*=/;
const isSqliteRow = (r) => r.type.toLowerCase() === "sqlite";

// Returns { sources, sqlite, problems, changedDsn, changed }.
export function generate(csvPath, tomlPath) {
	const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
	const tomlText = fs.existsSync(tomlPath)
		? fs.readFileSync(tomlPath, "utf8")
		: "";
	const blocks = parseBlocks(tomlText);

	const sources = blocks.filter((b) => b.header === "sources");
	const toolsOf = (id) =>
		blocks.filter((b) => b.header === "tools" && field(b, "source") === id);
	const isSqlite = (b) =>
		/^sqlite:/i.test(field(b, "dsn") || "") || field(b, "type") === "sqlite";
	const isReadonly = (b) =>
		field(b, "readonly") === "true" ||
		toolsOf(field(b, "id")).some((t) => field(t, "readonly") === "true");

	const problems = [];
	const seen = new Set();
	// A bad row stays in the CSV to be fixed; it is only left out of the toml.
	const valid = rows.filter((r) => {
		const missing = (
			isSqliteRow(r)
				? ["name", "file"]
				: ["name", "type", "host", "database", "user", "password"]
		).filter((k) => !r[k]);
		if (missing.length)
			problems.push(`${r.name || "(no name)"}: missing ${missing.join(", ")}`);
		else if (!/^[\w-]+$/.test(r.name))
			problems.push(`${r.name}: name may only have letters, digits, _ and -`);
		else if (seen.has(r.name)) problems.push(`${r.name}: duplicate`);
		else {
			seen.add(r.name);
			return true;
		}
		return false;
	});

	const modelOf = (source) =>
		source
			? {
					options: source.lines
						.slice(1)
						.filter((l) => l.trim() && !OWN_KEYS.test(l)),
					tools: toolsOf(field(source, "id")),
				}
			: { options: [], tools: [] };
	const serverModel = modelOf(
		sources.find((b) => !isSqlite(b) && isReadonly(b)),
	);
	if (
		!serverModel.options.some((l) => /^\s*readonly\s*=\s*true/.test(l)) &&
		!serverModel.tools.some((t) => field(t, "readonly") === "true")
	)
		serverModel.tools = [
			{
				header: "tools",
				lines: [
					"[[tools]]",
					'name = "execute_sql"',
					'source = ""',
					"readonly = true",
					"max_rows = 1000",
				],
			},
		];
	const sqliteSource = sources.find(isSqlite);
	const sqliteModel = modelOf(sqliteSource);
	const sqlitePrefix =
		field(sqliteSource ?? { lines: [] }, "dsn")?.match(/^sqlite:\/\/\/?/i)?.[0] ||
		"sqlite:///";

	const enc = encodeURIComponent;
	const dsnOf = (r) =>
		isSqliteRow(r)
			? `${sqlitePrefix}${r.file}`
			: `${r.type}://${enc(r.user)}:${enc(r.password)}@${r.host}${r.port ? `:${r.port}` : ""}/${enc(r.database)}${r.options ? `?${r.options}` : ""}`;
	const describe = (r) =>
		isSqliteRow(r)
			? `Cópia local do tablet — assets/server/db/${path.basename(r.file)}`
			: `SQL Server ${r.name.replace(/^mssql_/, "")} — ${r.database} (só leitura)`;
	const generated = valid.flatMap((r) => {
		const model = isSqliteRow(r) ? sqliteModel : serverModel;
		return [
			{
				header: "sources",
				lines: [
					"[[sources]]",
					`id = ${JSON.stringify(r.name)}`,
					`dsn = ${JSON.stringify(dsnOf(r))}`,
					`description = ${JSON.stringify(describe(r))}`,
					...model.options,
				],
			},
			...model.tools.map((t) =>
				withField(withField(t, "source", r.name), "description", describe(r)),
			),
		];
	});

	const output = blocks
		.filter((b) => b.header !== "sources" && b.header !== "tools")
		.concat(generated)
		.flatMap((b) => {
			const lines = [...b.lines];
			while (lines.length && lines.at(-1).trim() === "") lines.pop();
			return b.header || lines.length ? [...lines, ""] : [];
		})
		.join("\n");
	const changed = output !== tomlText;
	if (changed) fs.writeFileSync(tomlPath, output, { mode: 0o600 });

	// A source whose dsn changed, compared by parts rather than by encoding:
	// expected after editing the CSV; on the first run, a sign the conversion lost something.
	const parts = (dsn) => {
		try {
			const u = new URL(dsn);
			const d = decodeURIComponent;
			return [u.protocol, u.hostname, u.port, d(u.username), d(u.password), d(u.pathname), u.search].join(" ");
		} catch {
			return dsn;
		}
	};
	const changedDsn = valid
		.filter((r) => {
			const before = sources.find((b) => field(b, "id") === r.name);
			const old = before && field(before, "dsn");
			return old && parts(old) !== parts(dsnOf(r));
		})
		.map((r) => r.name);

	const before = new Set(sources.map((b) => field(b, "id")));
	const after = new Set(valid.map((r) => r.name));
	return {
		changed,
		added: [...after].filter((n) => !before.has(n)),
		removed: [...before].filter((n) => !after.has(n)),
		changedDsn,
		problems,
		count: valid.length,
	};
}
