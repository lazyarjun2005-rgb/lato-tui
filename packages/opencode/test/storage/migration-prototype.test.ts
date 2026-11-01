import { DatabaseSync } from "node:sqlite"
import { afterEach, describe, expect, test } from "bun:test"
import { Database } from "bun:sqlite"
import { access, mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  backupSqlite,
  discoverStorage,
  manifestFromPreview,
  previewStorage,
  resolveStorageRoots,
  type SqliteConnection,
  validateMigrationManifest,
} from "../../src/storage/migration-prototype"

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function root() {
  const value = await mkdtemp(join(tmpdir(), "lato-storage-prototype-"))
  roots.push(value)
  return value
}

function bunConnection(database: Database): SqliteConnection {
  return {
    exec: (sql) => database.exec(sql),
    prepare: (sql) => {
      const statement = database.query(sql)
      return { all: () => statement.all(), get: () => statement.get() }
    },
    close: () => database.close(false),
  }
}

function nodeConnection(database: DatabaseSync): SqliteConnection {
  return {
    exec: (sql) => database.exec(sql),
    prepare: (sql) => {
      const statement = database.prepare(sql)
      return { all: () => statement.all(), get: () => statement.get() }
    },
    close: () => database.close(),
  }
}

async function createFixture() {
  const source = await root()
  await mkdir(join(source, "config", ".opencode"), { recursive: true })
  await mkdir(join(source, "storage", "session"), { recursive: true })
  await mkdir(join(source, "skills"), { recursive: true })
  await writeFile(join(source, "config", "opencode.json"), '{"model":"test/model"}')
  await writeFile(join(source, "auth.json"), '{"test":{"type":"api","key":"fake-only"}}')
  await writeFile(join(source, "config", ".opencode", "agent.md"), "synthetic agent")
  await writeFile(join(source, "storage", "session", "record.json"), '{"id":"session-test"}')
  await writeFile(join(source, "skills", "SKILL.md"), "synthetic skill")
  return source
}

async function tree(root: string) {
  const inventory = await discoverStorage(root)
  return inventory.items.map((item) => [item.relativePath, item.kind, item.size] as const)
}

describe("storage discovery and preview", () => {
  test("resolves platform storage roots without reading the filesystem", () => {
    expect(resolveStorageRoots({ platform: "linux", home: "/home/test", env: {} })).toEqual({
      config: "/home/test/.config/lato",
      data: "/home/test/.local/share/lato",
      state: "/home/test/.local/state/lato",
      cache: "/home/test/.cache/lato",
      logs: "/home/test/.local/state/lato/log",
      tmp: "/tmp/lato",
    })
    expect(resolveStorageRoots({ platform: "darwin", home: "/Users/test", env: {} }).config).toBe(
      "/Users/test/Library/Application Support/Lato",
    )
    expect(
      resolveStorageRoots({
        platform: "win32",
        home: "C:/Users/test",
        env: { APPDATA: "C:/Users/test/AppData/Roaming", LOCALAPPDATA: "C:/Users/test/AppData/Local", TEMP: "C:/Temp" },
      }),
    ).toEqual({
      config: "C:/Users/test/AppData/Roaming/Lato",
      data: "C:/Users/test/AppData/Roaming/Lato",
      state: "C:/Users/test/AppData/Local/Lato/state",
      cache: "C:/Users/test/AppData/Local/Lato/cache",
      logs: "C:/Users/test/AppData/Local/Lato/logs",
      tmp: "C:/Temp/Lato",
    })
  })

  test("discovers synthetic storage without changing its source", async () => {
    const source = await createFixture()
    const before = await tree(source)
    const inventory = await discoverStorage(source)

    expect(inventory.root).toBe(await realpath(source))
    expect(inventory.totalFiles).toBe(5)
    expect(inventory.categories).toEqual(["auth", "config", "session", "skill"])
    expect(inventory.items.some((item) => item.relativePath === "auth.json" && item.category === "auth")).toBe(true)
    expect(await tree(source)).toEqual(before)
  })

  test("rejects relative roots and records symlinks outside the root", async () => {
    await expect(discoverStorage("relative/storage")).rejects.toThrow("absolute")
    const source = await createFixture()
    const outside = await root()
    await writeFile(join(outside, "outside.txt"), "outside")
    await symlink(join(outside, "outside.txt"), join(source, "escape"))

    const item = (await discoverStorage(source)).items.find((entry) => entry.relativePath === "escape")
    expect(item).toMatchObject({ kind: "symlink", issue: "symlink-outside-root", readable: true })
  })

  test("previews identical, different, and sensitive conflicts without writing", async () => {
    const source = await createFixture()
    const destination = await root()
    await mkdir(join(destination, "config"), { recursive: true })
    await writeFile(join(destination, "config", "opencode.json"), '{"model":"test/model"}')
    await writeFile(join(destination, "auth.json"), '{"test":{"type":"api","key":"other-fake"}}')

    const beforeSource = await tree(source)
    const beforeDestination = await tree(destination)
    const preview = await previewStorage(source, destination)

    expect(preview.conflicts).toEqual([
      { relativePath: "auth.json", kind: "inaccessible" },
      { relativePath: "config/opencode.json", kind: "identical" },
    ])
    expect(await tree(source)).toEqual(beforeSource)
    expect(await tree(destination)).toEqual(beforeDestination)
  })

  test("creates and validates a versioned preview manifest", async () => {
    const source = await createFixture()
    const preview = await previewStorage(source, join(await root(), "destination"))
    const manifest = manifestFromPreview(preview, 123)

    expect(manifest).toMatchObject({ version: 1, kind: "lato-storage-migration", status: "preview", createdAt: 123 })
    expect(manifest.entries.some((entry) => entry.relativePath === "auth.json" && entry.action === "copy")).toBe(true)
    expect(validateMigrationManifest(manifest)).toEqual(manifest)
    expect(() => validateMigrationManifest({ ...manifest, version: 2 })).toThrow()
  })
})

describe("SQLite backup prototype", () => {
  test("backs up committed WAL records with Bun SQLite", async () => {
    const directory = await root()
    const sourcePath = join(directory, "source.db")
    const backupPath = join(directory, "backup-bun.db")
    const source = new Database(sourcePath)
    source.exec("PRAGMA journal_mode = WAL; CREATE TABLE session (id TEXT PRIMARY KEY, marker TEXT NOT NULL);")
    source.exec("INSERT INTO session VALUES ('session-1', 'LATO-SYNTHETIC');")

    const result = await backupSqlite({
      source: bunConnection(source),
      destination: backupPath,
      open: (path) => bunConnection(new Database(path)),
    })
    const backup = new Database(backupPath)
    expect(result.integrity).toBe("ok")
    expect(result.foreignKeys).toBe("ok")
    expect(result.migrationJournal).toEqual([])
    expect(backup.query("SELECT marker FROM session").get()).toEqual({ marker: "LATO-SYNTHETIC" })
    expect(source.query("SELECT count(*) AS count FROM session").get()).toEqual({ count: 1 })
    backup.close(false)
    source.close(false)
  })

  test("preserves migration journal metadata", async () => {
    const directory = await root()
    const sourcePath = join(directory, "source-journal.db")
    const backupPath = join(directory, "backup-journal.db")
    const source = new Database(sourcePath)
    source.exec(
      "CREATE TABLE drizzle_migrations (id INTEGER PRIMARY KEY, hash TEXT NOT NULL); INSERT INTO drizzle_migrations VALUES (1, 'synthetic');",
    )

    const result = await backupSqlite({
      source: bunConnection(source),
      destination: backupPath,
      open: (path) => bunConnection(new Database(path)),
    })
    expect(result.migrationJournal).toEqual([{ table: "drizzle_migrations", rows: 1 }])
    source.close(false)
  })

  test("backs up committed WAL records with Node SQLite API", async () => {
    const directory = await root()
    const sourcePath = join(directory, "source-node.db")
    const backupPath = join(directory, "backup-node.db")
    const source = new DatabaseSync(sourcePath)
    source.exec("PRAGMA journal_mode = WAL; CREATE TABLE session (id TEXT PRIMARY KEY, marker TEXT NOT NULL);")
    source.exec("INSERT INTO session VALUES ('session-1', 'NODE-SYNTHETIC');")

    const result = await backupSqlite({
      source: nodeConnection(source),
      destination: backupPath,
      open: (path) => nodeConnection(new DatabaseSync(path)),
    })
    const backup = new DatabaseSync(backupPath)
    expect(result.integrity).toBe("ok")
    expect(result.foreignKeys).toBe("ok")
    expect(backup.prepare("SELECT marker FROM session").get()).toEqual({ marker: "NODE-SYNTHETIC" })
    expect(source.prepare("SELECT count(*) AS count FROM session").get()).toEqual({ count: 1 })
    backup.close()
    source.close()
  })

  test("does not overwrite an existing backup", async () => {
    const directory = await root()
    const sourcePath = join(directory, "source.db")
    const backupPath = join(directory, "backup.db")
    const source = new Database(sourcePath)
    source.exec("CREATE TABLE value (value TEXT); INSERT INTO value VALUES ('source');")
    await writeFile(backupPath, "existing")

    await expect(
      backupSqlite({
        source: bunConnection(source),
        destination: backupPath,
        open: (path) => bunConnection(new Database(path)),
      }),
    ).rejects.toThrow("already exists")
    expect(await readFile(backupPath, "utf8")).toBe("existing")
    source.close(false)
  })

  test("rejects relative backup destinations", async () => {
    const directory = await root()
    const source = new Database(join(directory, "source.db"))
    source.exec("CREATE TABLE value (value TEXT);")

    await expect(
      backupSqlite({
        source: bunConnection(source),
        destination: "relative.db",
        open: (path) => bunConnection(new Database(path)),
      }),
    ).rejects.toThrow("absolute")
    source.close(false)
  })

  test("cleans a failed backup destination", async () => {
    const directory = await root()
    const sourcePath = join(directory, "source.db")
    const backupPath = join(directory, "backup.db")
    const source = new Database(sourcePath)
    source.exec("CREATE TABLE value (value TEXT);")

    await expect(
      backupSqlite({
        source: bunConnection(source),
        destination: backupPath,
        open: () => {
          throw new Error("verification failure")
        },
      }),
    ).rejects.toThrow("verification failure")
    await expect(access(backupPath)).rejects.toThrow()
    source.close(false)
  })
})
