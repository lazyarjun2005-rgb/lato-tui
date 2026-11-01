import { createHash } from "node:crypto"
import { access, constants, mkdir, open, readdir, lstat, readFile, realpath, rm, stat } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve, sep } from "node:path"

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
  if (await exists(input.destination)) throw new Error(`Backup destination already exists: ${input.destination}`)
  await mkdir(dirname(input.destination), { recursive: true })

  try {
    input.source.exec(`VACUUM INTO '${sqlString(input.destination)}'`)
    const result = verifySqlite(input.destination, input.open)
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
    const integrity = firstValue(database.prepare("PRAGMA integrity_check").get())
    if (integrity !== "ok") throw new Error(`SQLite integrity check failed: ${integrity}`)
    const userVersion = Number(firstValue(database.prepare("PRAGMA user_version").get()))
    const tables = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .flatMap((row) => (isRecord(row) && typeof row.name === "string" ? [row.name] : []))
    return { integrity: "ok" as const, userVersion, tables }
  } finally {
    database.close()
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
