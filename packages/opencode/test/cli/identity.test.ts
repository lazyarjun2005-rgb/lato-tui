import { afterEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join, win32 } from "node:path"
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
    // Windows-style input always takes the win32 branch, so the result is a
    // concrete win32 path on every host.
    expect(cliPreferenceState("C:\\Users\\user\\AppData\\Local\\opencode")).toBe(
      "C:\\Users\\user\\AppData\\Local\\lato",
    )
    expect(cliPreferenceState("C:\\Users\\user\\AppData\\Local\\lato")).toBe("C:\\Users\\user\\AppData\\Local\\lato")

    // POSIX-style input uses the host path module: it stays POSIX on Linux and
    // macOS, and is normalized with host separators on Windows. Build the
    // expectation with the same host utilities rather than hardcoding a separator.
    const cases = [
      "/home/user/.local/state/opencode",
      "/home/user/.local/state/lato",
      "/Users/user/Library/Application Support/opencode",
    ]
    for (const input of cases) {
      expect(cliPreferenceState(input)).toBe(join(dirname(input), "lato"))
    }

    // The win32 branch is host-independent; assert it explicitly too.
    expect(cliPreferenceState(win32.join("C:\\Users\\user\\AppData\\Local", "opencode"))).toBe(
      win32.join("C:\\Users\\user\\AppData\\Local", "lato"),
    )
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
