import { afterEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { readJson, writeJsonAtomic } from "@opencode-ai/tui/util/persistence"

const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

describe("compiled executable identity", () => {
  test("compiled lato and opencode binaries resolve their own identity", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "lato-native-binary-"))
    roots.push(root)

    const entry = path.join(root, "entry.ts")
    const identity = path.resolve(import.meta.dir, "../../src/cli/identity.ts")
    await Bun.write(entry, `import { cliScriptName } from ${JSON.stringify(identity)}\nconsole.log(cliScriptName())\n`)

    const extension = process.platform === "win32" ? ".exe" : ""
    for (const name of ["lato", "opencode"] as const) {
      const outfile = path.join(root, name + extension)
      const build = Bun.spawn([process.execPath, "build", "--compile", entry, "--outfile", outfile], {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
      })
      const [buildError, buildCode] = await Promise.all([new Response(build.stderr).text(), build.exited])
      if (buildCode !== 0) throw new Error(`failed to compile ${name} (${buildCode}): ${buildError}`)

      const run = Bun.spawn([outfile], { cwd: root, stdout: "pipe", stderr: "pipe" })
      const [stdout, stderr, code] = await Promise.all([
        new Response(run.stdout).text(),
        new Response(run.stderr).text(),
        run.exited,
      ])
      if (code !== 0) throw new Error(`failed to execute ${name} (${code}): ${stderr}`)
      expect(stdout.trim()).toBe(name)
    }
  }, 60000)
})

describe("native state resolution", () => {
  test("resolves Lato and OpenCode roots through the real platform path stack", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "lato-native-state-"))
    roots.push(root)

    const home = path.join(root, "home")
    await mkdir(path.join(root, "tmp"), { recursive: true })
    await mkdir(home, { recursive: true })
    const probe = path.join(import.meta.dir, "native-path-probe.ts")
    const child = Bun.spawn([process.execPath, "run", probe], {
      cwd: path.resolve(import.meta.dir, "../.."),
      env: {
        ...process.env,
        HOME: home,
        USERPROFILE: home,
        OPENCODE_TEST_HOME: home,
        XDG_STATE_HOME: path.join(root, "state"),
        XDG_DATA_HOME: path.join(root, "data"),
        XDG_CONFIG_HOME: path.join(root, "config"),
        XDG_CACHE_HOME: path.join(root, "cache"),
        TMPDIR: path.join(root, "tmp"),
        TEMP: path.join(root, "tmp"),
        TMP: path.join(root, "tmp"),
      },
      stdout: "pipe",
      stderr: "pipe",
    })

    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ])
    if (code !== 0) throw new Error(`native path probe failed (${code}): ${stderr}`)

    const result = JSON.parse(stdout) as {
      platform: string
      separator: string
      state: string
      root: string
      lato: string
      opencode: string
      entryPoint: Record<"lato" | "opencode", string>
      latoName: string
      opencodeName: string
      identity: Record<"lato" | "opencode" | "latoExe" | "opencodeExe" | "latoCmd", string>
    }

    const state = path.join(root, "state", "opencode")
    expect(result.platform).toBe(process.platform)
    expect(result.separator).toBe(path.sep)
    expect(result.state).toBe(state)
    expect(result.root).toBe(path.join(root, "state"))
    expect(result.lato).toBe(path.join(root, "state", "lato"))
    expect(result.opencode).toBe(state)
    expect(result.latoName).toBe("lato")
    expect(result.opencodeName).toBe("opencode")
    expect(result.lato).not.toBe(result.opencode)

    expect(result.identity.lato).toBe("lato")
    expect(result.identity.opencode).toBe("opencode")
    expect(result.identity.latoExe).toBe("lato")
    expect(result.identity.opencodeExe).toBe("opencode")
    expect(result.identity.latoCmd).toBe("lato")

    expect(result.entryPoint.lato).toBe(result.lato)
    expect(result.entryPoint.opencode).toBe(result.opencode)

    if (process.platform === "win32") {
      expect(result.lato).toContain("\\")
      expect(result.lato).not.toContain("/")
    } else {
      expect(result.lato).toContain("/")
    }

    const latoFile = path.join(result.lato, "kv.json")
    const opencodeFile = path.join(result.opencode, "kv.json")
    const latoPreferences = { theme: "lato", theme_mode: "light", theme_mode_lock: "light" }
    const opencodePreferences = { theme: "opencode", theme_mode: "dark" }

    await writeJsonAtomic(opencodeFile, opencodePreferences)
    await writeJsonAtomic(latoFile, latoPreferences)

    expect(await readJson(latoFile)).toEqual(latoPreferences)
    expect(await readJson(opencodeFile)).toEqual(opencodePreferences)
    expect(latoFile).not.toBe(opencodeFile)

    const updatedLato = { ...latoPreferences, theme: "lato-updated" }
    await writeJsonAtomic(latoFile, updatedLato)
    expect(await readJson(latoFile)).toEqual(updatedLato)
    expect(await readJson(opencodeFile)).toEqual(opencodePreferences)

    const updatedOpencode = { ...opencodePreferences, theme: "opencode-updated" }
    await writeJsonAtomic(opencodeFile, updatedOpencode)
    expect(await readJson(opencodeFile)).toEqual(updatedOpencode)
    expect(await readJson(latoFile)).toEqual(updatedLato)
  }, 20000)
})
