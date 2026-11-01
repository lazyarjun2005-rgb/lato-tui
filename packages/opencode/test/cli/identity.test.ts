import { afterEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { cliPreferenceState, cliScriptName } from "../../src/cli/identity"

const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

describe("CLI script identity", () => {
  test("uses Lato for source and Lato invocations", () => {
    expect(cliScriptName(["/usr/bin/bun", "/workspace/src/index.ts"])).toBe("lato")
    expect(cliScriptName(["/opt/lato/bin/lato", "pr", "42"])).toBe("lato")
  })

  test("preserves the legacy OpenCode display name when invoked that way", () => {
    expect(cliScriptName(["/usr/bin/node", "/home/user/.local/bin/opencode", "completion"])).toBe("opencode")
    expect(cliScriptName(["/opt/opencode/bin/opencode", "--help"])).toBe("opencode")
    expect(cliScriptName(["C:\\Program Files\\OpenCode\\opencode.exe", "--help"])).toBe("opencode")
  })

  test("does not treat an unrelated runtime as the legacy executable", () => {
    expect(cliScriptName(["/usr/bin/node", "/tmp/runner.js"], "/usr/bin/node")).toBe("lato")
  })

  test("isolates Lato TUI preferences from the compatibility state path", () => {
    expect(cliPreferenceState("lato", "/home/user/.local/state/opencode")).toBe("/home/user/.local/state/lato")
    expect(cliPreferenceState("opencode", "/home/user/.local/state/opencode")).toBe("/home/user/.local/state/opencode")
    expect(cliPreferenceState("lato", "C:\\Users\\user\\AppData\\Local\\opencode")).toBe(
      "C:\\Users\\user\\AppData\\Local\\lato",
    )
    expect(cliPreferenceState("lato", "/Users/user/Library/Application Support/opencode")).toBe(
      "/Users/user/Library/Application Support/lato",
    )
  })

  test("keeps synthetic Lato and OpenCode preference files separate", async () => {
    const root = await mkdtemp(join(tmpdir(), "lato-identity-test-"))
    roots.push(root)
    const compatibilityState = join(root, "opencode")
    const latoState = cliPreferenceState("lato", compatibilityState)
    await mkdir(latoState, { recursive: true })
    await writeFile(join(latoState, "kv.json"), '{"theme":"lato-test"}')

    expect(JSON.parse(await readFile(join(latoState, "kv.json"), "utf8"))).toEqual({ theme: "lato-test" })
    await expect(readFile(join(compatibilityState, "kv.json"), "utf8")).rejects.toThrow()
  })
})
