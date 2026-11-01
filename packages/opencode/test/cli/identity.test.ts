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
  test("always uses Lato", () => {
    expect(cliScriptName()).toBe("lato-cli")
  })

  test("derives the Lato preference path from compatibility state", () => {
    expect(cliPreferenceState("/home/user/.local/state/opencode")).toBe("/home/user/.local/state/lato")
    expect(cliPreferenceState("C:\\Users\\user\\AppData\\Local\\opencode")).toBe(
      "C:\\Users\\user\\AppData\\Local\\lato",
    )
    expect(cliPreferenceState("/Users/user/Library/Application Support/opencode")).toBe(
      "/Users/user/Library/Application Support/lato",
    )
    expect(cliPreferenceState("/home/user/.local/state/lato")).toBe("/home/user/.local/state/lato")
    expect(cliPreferenceState("C:\\Users\\user\\AppData\\Local\\lato")).toBe("C:\\Users\\user\\AppData\\Local\\lato")
  })

  test("keeps compatibility preference files untouched", async () => {
    const root = await mkdtemp(join(tmpdir(), "lato-identity-test-"))
    roots.push(root)
    const compatibilityState = join(root, "opencode")
    const latoState = cliPreferenceState(compatibilityState)
    await mkdir(latoState, { recursive: true })
    await mkdir(compatibilityState, { recursive: true })
    const latoFile = join(latoState, "kv.json")
    const opencodeFile = join(compatibilityState, "kv.json")
    await writeFile(latoFile, '{"theme":"lato-test"}')
    await writeFile(opencodeFile, '{"theme":"opencode-test"}')

    expect(JSON.parse(await readFile(latoFile, "utf8"))).toEqual({ theme: "lato-test" })
    expect(JSON.parse(await readFile(opencodeFile, "utf8"))).toEqual({ theme: "opencode-test" })

    await writeFile(latoFile, '{"theme":"lato-updated"}')
    expect(JSON.parse(await readFile(opencodeFile, "utf8"))).toEqual({ theme: "opencode-test" })
  })
})
