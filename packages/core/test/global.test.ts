import { describe, expect, test } from "bun:test"
import fs from "fs/promises"
import os from "os"
import path from "path"
import { Global } from "@opencode-ai/core/global"

describe("global paths", () => {
  test("uses the Lato config path without moving OpenCode data paths", () => {
    expect(Global.Path.config).toContain(`${path.sep}lato`)
    expect(Global.Path.legacyConfig).toContain(`${path.sep}opencode`)
    expect(Global.Path.data).toContain(`${path.sep}opencode`)
    expect(Global.Path.cache).toContain(`${path.sep}opencode`)
    expect(Global.Path.state).toContain(`${path.sep}opencode`)
  })

  test("tmp path is under the system temp directory", () => {
    expect(Global.Path.tmp).toBe(path.join(os.tmpdir(), "opencode"))
    expect(Global.make().tmp).toBe(Global.Path.tmp)
  })

  test("tmp path is created on module load", async () => {
    expect((await fs.stat(Global.Path.tmp)).isDirectory()).toBe(true)
  })
})
