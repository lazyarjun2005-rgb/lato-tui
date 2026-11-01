import { describe, expect, test } from "bun:test"
import { resolveCliCommand } from "../../src/cli/cmd/pr"

describe("PR CLI executable resolution", () => {
  test("relaunches the currently invoked script", () => {
    expect(
      resolveCliCommand({
        runtime: "/usr/bin/node",
        argv: ["/usr/bin/node", "/tmp/opencode"],
        exists: (value) => value === "/tmp/opencode",
        find: () => null,
      }),
    ).toEqual(["/usr/bin/node", "/tmp/opencode"])
  })

  test("relaunches a compiled Lato executable without PR arguments", () => {
    expect(
      resolveCliCommand({
        runtime: "/opt/lato/bin/lato",
        argv: ["/opt/lato/bin/lato", "pr", "42"],
        exists: (value) => value === "/opt/lato/bin/lato",
        find: () => null,
      }),
    ).toEqual(["/opt/lato/bin/lato"])
  })

  test("falls back to the legacy OpenCode executable", () => {
    expect(
      resolveCliCommand({
        runtime: "/usr/bin/node",
        argv: ["/usr/bin/node"],
        exists: () => false,
        find: (name) => (name === "opencode" ? "/home/user/.local/bin/opencode" : null),
      }),
    ).toEqual(["/home/user/.local/bin/opencode"])
  })

  test("prefers an explicitly available Lato executable", () => {
    expect(
      resolveCliCommand({
        runtime: "/usr/bin/node",
        argv: ["/usr/bin/node"],
        exists: () => false,
        find: (name) => (name === "lato" ? "/home/user/.local/bin/lato" : "/home/user/.local/bin/opencode"),
      }),
    ).toEqual(["/home/user/.local/bin/lato"])
  })

  test("returns no command when neither executable is available", () => {
    expect(
      resolveCliCommand({
        runtime: "/usr/bin/node",
        argv: ["/usr/bin/node"],
        exists: () => false,
        find: () => null,
      }),
    ).toBeUndefined()
  })
})
