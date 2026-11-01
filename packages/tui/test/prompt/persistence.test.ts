import { expect, test } from "bun:test"
import path from "path"
import { chmod, mkdtemp, readdir, rm } from "fs/promises"
import { tmpdir } from "os"
import { appendText, readJson, readText, writeJsonAtomic, writeText } from "../../src/util/persistence"

// Windows ACLs and root do not honour POSIX permission bits, so those native
// permission tests only run where the failure is meaningful.
const unprivileged = process.platform !== "win32" && process.getuid?.() !== 0

test("persistence creates parent directories and supports text, append, and JSON", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "opencode-tui-persistence-"))
  try {
    const textPath = path.join(root, "nested", "state.jsonl")
    await writeText(textPath, "one\n")
    await appendText(textPath, "two\n")
    expect(await readText(textPath)).toBe("one\ntwo\n")

    const jsonPath = path.join(root, "other", "state.json")
    await writeJsonAtomic(jsonPath, { value: 1 })
    expect(await readJson<{ value: number }>(jsonPath)).toEqual({ value: 1 })
    await writeJsonAtomic(jsonPath, { value: 2 })
    expect(await readJson<{ value: number }>(jsonPath)).toEqual({ value: 2 })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("atomic JSON writes remain valid under concurrent synthetic updates", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "opencode-tui-concurrent-"))
  try {
    const jsonPath = path.join(root, "kv.json")
    await Promise.all(Array.from({ length: 20 }, (_, value) => writeJsonAtomic(jsonPath, { value })))
    const result = await readJson<{ value: number }>(jsonPath)
    expect(Number.isInteger(result.value)).toBe(true)
    expect(result.value).toBeGreaterThanOrEqual(0)
    expect(result.value).toBeLessThan(20)
    expect((await readdir(root)).filter((entry) => entry.endsWith(".tmp"))).toEqual([])
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("malformed JSON is reported without replacing the source file", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "opencode-tui-malformed-"))
  try {
    const jsonPath = path.join(root, "kv.json")
    await writeText(jsonPath, '{"theme":')
    await expect(readJson(jsonPath)).rejects.toThrow()
    expect(await readText(jsonPath)).toBe('{"theme":')
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("missing preference files reject so the runtime can use defaults", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "opencode-tui-missing-"))
  try {
    await expect(readJson(path.join(root, "missing", "kv.json"))).rejects.toThrow()
    await expect(readdir(path.join(root, "missing"))).rejects.toThrow()
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test("theme preferences round-trip through the stored KV shape", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "opencode-tui-theme-"))
  try {
    const jsonPath = path.join(root, "lato", "kv.json")
    const preferences = { theme: "lato", theme_mode: "light", theme_mode_lock: "light" }
    await writeJsonAtomic(jsonPath, preferences)
    expect(await readJson(jsonPath)).toEqual(preferences)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test.skipIf(!unprivileged)("unreadable preference files are reported without being rewritten", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "opencode-tui-unreadable-"))
  try {
    const jsonPath = path.join(root, "kv.json")
    await writeText(jsonPath, '{"theme":"dark"}')
    await chmod(jsonPath, 0o000)
    try {
      await expect(readJson(jsonPath)).rejects.toThrow()
    } finally {
      await chmod(jsonPath, 0o600)
    }
    expect(await readText(jsonPath)).toBe('{"theme":"dark"}')
  } finally {
    await chmod(root, 0o755).catch(() => undefined)
    await rm(root, { recursive: true, force: true })
  }
})

test.skipIf(!unprivileged)("read-only state directories keep the existing preference file intact", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "opencode-tui-readonly-"))
  try {
    const jsonPath = path.join(root, "kv.json")
    await writeJsonAtomic(jsonPath, { theme: "dark" })
    await chmod(root, 0o555)
    try {
      await expect(writeJsonAtomic(jsonPath, { theme: "light" })).rejects.toThrow()
    } finally {
      await chmod(root, 0o755)
    }
    expect(await readJson(jsonPath)).toEqual({ theme: "dark" })
    expect((await readdir(root)).filter((entry) => entry.endsWith(".tmp"))).toEqual([])
  } finally {
    await chmod(root, 0o755).catch(() => undefined)
    await rm(root, { recursive: true, force: true })
  }
})
