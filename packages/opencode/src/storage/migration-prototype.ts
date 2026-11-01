import { createHash } from "node:crypto"
import { access, constants, mkdir, open, readdir, lstat, readFile, realpath, rm, stat } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"
import { Schema } from "effect"

export type StoragePlatform = "linux" | "darwin" | "win32" | "other"

export type StorageRoots = {
  config: string
  data: string
  state: string
  cache: string
  logs: string
  tmp: string
}

export function resolveStorageRoots(input: {
  platform: StoragePlatform
  home: string
  env?: Record<string, string | undefined>
}): StorageRoots {
  const env = input.env ?? {}
  const temporary = env.TMPDIR ?? env.TEMP ?? env.TMP ?? "/tmp"
  if (input.platform === "darwin") {
    const support = `${input.home}/Library/Application Support/Lato`
    return {
      config: support,
      data: support,
      state: `${support}/state`,
      cache: `${input.home}/Library/Caches/Lato`,
      logs: `${input.home}/Library/Logs/Lato`,
      tmp: `${temporary}/lato`,
    }
  }
  if (input.platform === "win32") {
    const roaming = env.APPDATA ?? `${input.home}/AppData/Roaming`
    const local = env.LOCALAPPDATA ?? `${input.home}/AppData/Local`
    return {
      config: `${roaming}/Lato`,
      data: `${roaming}/Lato`,
      state: `${local}/Lato/state`,
      cache: `${local}/Lato/cache`,
      logs: `${local}/Lato/logs`,
      tmp: `${temporary}/Lato`,
    }
  }
  return {
    config: `${env.XDG_CONFIG_HOME ?? `${input.home}/.config`}/lato`,
    data: `${env.XDG_DATA_HOME ?? `${input.home}/.local/share`}/lato`,
    state: `${env.XDG_STATE_HOME ?? `${input.home}/.local/state`}/lato`,
    cache: `${env.XDG_CACHE_HOME ?? `${input.home}/.cache`}/lato`,
    logs: `${env.XDG_STATE_HOME ?? `${input.home}/.local/state`}/lato/log`,
    tmp: `${temporary}/lato`,
  }
}

export type StorageCategory =
  | "auth"
  | "cache"
  | "config"
  | "database"
  | "desktop"
  | "log"
  | "plugin"
  | "project"
  | "session"
  | "skill"
  | "unknown"

export type StorageItem = {
  relativePath: string
  category: StorageCategory
  kind: "file" | "directory" | "symlink"
  size: number
  modified: number
  readable: boolean
  database: boolean
  issue?: "inaccessible" | "symlink-outside-root"
}

export type StorageInventory = {
  root: string
  items: StorageItem[]
  totalFiles: number
  totalBytes: number
  categories: StorageCategory[]
  inaccessible: string[]
  unsupported: string[]
}

export type PreviewConflict = {
  relativePath: string
  kind: "identical" | "different" | "database" | "unsupported" | "inaccessible"
}

export type StoragePreview = {
  source: StorageInventory
  destination: StorageInventory | undefined
  conflicts: PreviewConflict[]
  warnings: string[]
}

export const MigrationManifest = Schema.Struct({
  version: Schema.Literal(1),
  kind: Schema.Literal("lato-storage-migration"),
  sourceRoot: Schema.String,
  destinationRoot: Schema.String,
  createdAt: Schema.Number,
  status: Schema.Literals(["preview", "staged", "verified", "failed", "rolled-back"]),
  entries: Schema.Array(
    Schema.Struct({
      relativePath: Schema.String,
      category: Schema.String,
      kind: Schema.Literals(["file", "directory", "symlink"]),
      action: Schema.Literals(["copy", "skip", "conflict"]),
      conflict: Schema.optional(Schema.String),
    }),
  ),
})

export type MigrationManifest = typeof MigrationManifest.Type

export function manifestFromPreview(preview: StoragePreview, createdAt = Date.now()): MigrationManifest {
  const conflicts = new Map(preview.conflicts.map((conflict) => [conflict.relativePath, conflict.kind]))
  return {
    version: 1,
    kind: "lato-storage-migration",
    sourceRoot: preview.source.root,
    destinationRoot: preview.destination?.root ?? resolve(preview.source.root, "lato-destination"),
    createdAt,
    status: "preview",
    entries: preview.source.items.map((item) => {
      const conflict = conflicts.get(item.relativePath)
      return {
        relativePath: item.relativePath,
        category: item.category,
        kind: item.kind,
        action: conflict ? "conflict" : item.kind === "file" ? "copy" : "skip",
        ...(conflict ? { conflict } : {}),
      }
    }),
  }
}

export function validateMigrationManifest(input: unknown): MigrationManifest {
  return Schema.decodeUnknownSync(MigrationManifest)(input)
}

export type SqliteStatement = {
  all: () => unknown[]
  get: () => unknown
}

export type SqliteConnection = {
  exec: (sql: string) => unknown
  prepare: (sql: string) => SqliteStatement
  close: () => void
}

export type SqliteBackupResult = {
  path: string
  bytes: number
  integrity: "ok"
  userVersion: number
  tables: string[]
  migrationJournal: Array<{ table: string; rows: number }>
  foreignKeys: "ok"
}

export async function discoverStorage(root: string): Promise<StorageInventory> {
  const resolvedRoot = await realpath(requireDirectory(root))
  const items: StorageItem[] = []
  await walk(resolvedRoot, resolvedRoot, items)
  return inventory(resolvedRoot, items)
}

export async function previewStorage(sourceRoot: string, destinationRoot: string): Promise<StoragePreview> {
  const source = await discoverStorage(sourceRoot)
  const destination = (await isDirectory(destinationRoot)) ? await discoverStorage(destinationRoot) : undefined
  const destinationByPath = new Map(destination?.items.map((item) => [item.relativePath, item]))
  const conflicts: PreviewConflict[] = []

  for (const sourceItem of source.items) {
    const destinationItem = destinationByPath.get(sourceItem.relativePath)
    if (!destinationItem) continue
    if (sourceItem.issue || destinationItem.issue || sourceItem.kind !== destinationItem.kind) {
      conflicts.push({ relativePath: sourceItem.relativePath, kind: "unsupported" })
      continue
    }
    if (sourceItem.kind !== "file") continue
    if (sourceItem.database || destinationItem.database) {
      conflicts.push({ relativePath: sourceItem.relativePath, kind: "database" })
      continue
    }
    if (isSensitive(sourceItem.category)) {
      conflicts.push({ relativePath: sourceItem.relativePath, kind: "inaccessible" })
      continue
    }
    conflicts.push({
      relativePath: sourceItem.relativePath,
      kind:
        (await hashFile(resolve(sourceRoot, sourceItem.relativePath))) ===
        ((await hashFile(resolve(destinationRoot, destinationItem.relativePath))) ?? "")
          ? "identical"
          : "different",
    })
  }

  return {
    source,
    destination,
    conflicts,
    warnings: destination ? [] : ["Destination does not exist; no destination files were inspected."],
  }
}

export async function backupSqlite(input: {
  source: SqliteConnection
  destination: string
  open: (path: string) => SqliteConnection
}): Promise<SqliteBackupResult> {
  if (!isAbsolute(input.destination)) throw new Error("Backup destination must be absolute")
  if (await exists(input.destination)) throw new Error(`Backup destination already exists: ${input.destination}`)
  await mkdir(dirname(input.destination), { recursive: true })

  try {
    const source = inspectSqlite(input.source)
    input.source.exec(`VACUUM INTO '${sqlString(input.destination)}'`)
    const result = verifySqlite(input.destination, input.open)
    if (
      source.userVersion !== result.userVersion ||
      source.tables.join("\u0000") !== result.tables.join("\u0000") ||
      JSON.stringify(source.migrationJournal) !== JSON.stringify(result.migrationJournal)
    ) {
      throw new Error("SQLite backup schema or migration journal mismatch")
    }
    const info = await stat(input.destination)
    return { ...result, path: input.destination, bytes: info.size }
  } catch (error) {
    await rm(input.destination, { force: true }).catch(() => undefined)
    throw error
  }
}

function requireDirectory(root: string) {
  if (!isAbsolute(root)) throw new Error("Storage root must be absolute")
  return root
}

async function walk(root: string, current: string, items: StorageItem[]) {
  const entries = await readdir(current, { withFileTypes: true })
  for (const entry of entries.toSorted((a, b) => a.name.localeCompare(b.name))) {
    const file = resolve(current, entry.name)
    const relativePath = relative(root, file).split(sep).join("/")
    const metadata = await lstat(file)
    const base = {
      relativePath,
      category: categoryFor(relativePath),
      kind: entry.isSymbolicLink()
        ? ("symlink" as const)
        : entry.isDirectory()
          ? ("directory" as const)
          : ("file" as const),
      size: metadata.size,
      modified: metadata.mtimeMs,
      readable: true,
      database: false,
    }

    if (entry.isSymbolicLink()) {
      const target = await realpath(file).catch(() => undefined)
      items.push({
        ...base,
        readable: !!target,
        issue: target && isWithin(root, target) ? undefined : "symlink-outside-root",
      })
      continue
    }

    const readable = await access(file, constants.R_OK)
      .then(() => true)
      .catch(() => false)
    const item = { ...base, readable, database: entry.isFile() && readable ? await isSqlite(file) : false }
    if (!readable) item.issue = "inaccessible"
    items.push(item)
    if (entry.isDirectory() && readable) await walk(root, file, items)
  }
}

function inventory(root: string, items: StorageItem[]): StorageInventory {
  return {
    root,
    items,
    totalFiles: items.filter((item) => item.kind === "file").length,
    totalBytes: items.reduce((sum, item) => sum + (item.kind === "file" ? item.size : 0), 0),
    categories: [...new Set(items.map((item) => item.category))].sort(),
    inaccessible: items.filter((item) => !item.readable).map((item) => item.relativePath),
    unsupported: items.filter((item) => item.issue).map((item) => item.relativePath),
  }
}

function categoryFor(value: string): StorageCategory {
  const normalized = value.toLowerCase()
  if (/(^|\/)mcp-auth\.json$|(^|\/)auth\.json$/.test(normalized)) return "auth"
  if (/(^|\/)(cache|bin)(\/|$)/.test(normalized)) return "cache"
  if (/(^|\/)(config|config\.jsonc?|opencode\.jsonc?|\.opencode)(\/|$)/.test(normalized)) return "config"
  if (/\.db$/.test(normalized)) return "database"
  if (/(^|\/)(desktop|crashpad|logs?)(\/|$)|\.log$/.test(normalized)) return "log"
  if (/(^|\/)(plugin|plugins|plugin-meta\.json)(\/|$)/.test(normalized)) return "plugin"
  if (/(^|\/)(repos?|projects?|worktree)(\/|$)|(^|\/)opencode$/.test(normalized)) return "project"
  if (/(^|\/)(storage|snapshot|plans?|tool-output)(\/|$)/.test(normalized)) return "session"
  if (/(^|\/)skills?(\/|$)/.test(normalized)) return "skill"
  if (/(^|\/)(user-data|electron)(\/|$)/.test(normalized)) return "desktop"
  return "unknown"
}

function isSensitive(category: StorageCategory) {
  return category === "auth" || category === "database" || category === "session"
}

function isWithin(root: string, target: string) {
  const value = relative(root, target)
  return value === "" || (!value.startsWith(`..${sep}`) && value !== ".." && !isAbsolute(value))
}

async function isDirectory(value: string) {
  return stat(value)
    .then((info) => info.isDirectory())
    .catch(() => false)
}

async function exists(value: string) {
  return stat(value)
    .then(() => true)
    .catch(() => false)
}

async function isSqlite(file: string) {
  const handle = await open(file, "r")
  try {
    const buffer = Buffer.alloc(16)
    await handle.read(buffer, 0, buffer.length, 0)
    return buffer.toString("utf8") === "SQLite format 3\u0000"
  } finally {
    await handle.close()
  }
}

async function hashFile(file: string) {
  const handle = await open(file, "r")
  try {
    const hash = createHash("sha256")
    hash.update(await readFile(file))
    return hash.digest("hex")
  } finally {
    await handle.close()
  }
}

function verifySqlite(path: string, openDatabase: (path: string) => SqliteConnection) {
  const database = openDatabase(path)
  try {
    return inspectSqlite(database)
  } finally {
    database.close()
  }
}

function inspectSqlite(database: SqliteConnection) {
  const integrity = firstValue(database.prepare("PRAGMA integrity_check").get())
  if (integrity !== "ok") throw new Error(`SQLite integrity check failed: ${integrity}`)
  if (database.prepare("PRAGMA foreign_key_check").all().length) throw new Error("SQLite foreign key check failed")
  const userVersion = Number(firstValue(database.prepare("PRAGMA user_version").get()))
  const tables = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .flatMap((row) => (isRecord(row) && typeof row.name === "string" ? [row.name] : []))
  const migrationJournal = tables
    .filter((table) => /migration|drizzle/i.test(table))
    .map((table) => ({
      table,
      rows: database.prepare(`SELECT count(*) AS count FROM "${table.replaceAll('"', '""')}"`).get(),
    }))
    .map((entry) => ({ table: entry.table, rows: Number(firstValue(entry.rows)) }))
  return {
    integrity: "ok" as const,
    userVersion,
    tables,
    migrationJournal,
    foreignKeys: "ok" as const,
  }
}

function firstValue(value: unknown) {
  if (!isRecord(value)) return value
  return Object.values(value)[0]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function sqlString(value: string) {
  return value.replaceAll("'", "''")
}
