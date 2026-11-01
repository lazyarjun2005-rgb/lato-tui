import { afterEach, describe, expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { readJson, writeJsonAtomic } from "@opencode-ai/tui/util/persistence"
import { cliPreferenceState } from "../../src/cli/identity"

const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

describe("compiled executable identity", () => {
  test("compiled lato binary resolves Lato identity", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "lato-native-binary-"))
    roots.push(root)

    const entry = path.join(root, "entry.ts")
    const identity = path.resolve(import.meta.dir, "../../src/cli/identity.ts")
    await Bun.write(entry, `import { cliScriptName } from ${JSON.stringify(identity)}\nconsole.log(cliScriptName())\n`)

    const extension = process.platform === "win32" ? ".exe" : ""
    const outfile = path.join(root, "lato" + extension)
    const build = Bun.spawn([process.execPath, "build", "--compile", entry, "--outfile", outfile], {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
    })
    const [buildError, buildCode] = await Promise.all([new Response(build.stderr).text(), build.exited])
    if (buildCode !== 0) throw new Error(`failed to compile lato (${buildCode}): ${buildError}`)

    const run = Bun.spawn([outfile], { cwd: root, stdout: "pipe", stderr: "pipe" })
    const [stdout, stderr, code] = await Promise.all([
      new Response(run.stdout).text(),
      new Response(run.stderr).text(),
      run.exited,
    ])
    if (code !== 0) throw new Error(`failed to execute lato (${code}): ${stderr}`)
    expect(stdout.trim()).toBe("lato-cli")

    const override = Bun.spawn([outfile], {
      cwd: root,
      env: { ...process.env, LATO_RUNTIME_IDENTITY: "opencode" },
      stdout: "pipe",
      stderr: "pipe",
    })
    const [overrideOut, overrideErr, overrideCode] = await Promise.all([
      new Response(override.stdout).text(),
      new Response(override.stderr).text(),
      override.exited,
    ])
    if (overrideCode !== 0) throw new Error(`failed to execute identity override (${overrideCode}): ${overrideErr}`)
    expect(overrideOut.trim()).toBe("lato-cli")
  }, 60000)
})

describe("native state resolution", () => {
  test("resolves the Lato state root through the real platform path stack", async () => {
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
      entryPoint: string
      latoName: string
      identity: string
    }

    const state = path.join(root, "state", "opencode")
    expect(result.platform).toBe(process.platform)
    expect(result.separator).toBe(path.sep)
    expect(result.state).toBe(state)
    expect(result.root).toBe(path.join(root, "state"))
    expect(result.lato).toBe(path.join(root, "state", "lato"))
    expect(result.entryPoint).toBe(result.lato)
    expect(result.latoName).toBe("lato")
    expect(result.identity).toBe("lato-cli")
    expect(cliPreferenceState(result.lato)).toBe(result.lato)

    if (process.platform === "win32") {
      expect(result.lato).toContain("\\")
      expect(result.lato).not.toContain("/")
    } else {
      expect(result.lato).toContain("/")
    }

    const latoFile = path.join(result.lato, "kv.json")
    const compatibilityFile = path.join(result.state, "kv.json")
    const preferences = { theme: "lato", theme_mode: "light", theme_mode_lock: "light" }

    await writeJsonAtomic(compatibilityFile, { theme: "compatibility" })
    await writeJsonAtomic(latoFile, preferences)

    expect(await readJson(latoFile)).toEqual(preferences)
    expect(await readJson(compatibilityFile)).toEqual({ theme: "compatibility" })

    const updated = { ...preferences, theme: "lato-updated" }
    await writeJsonAtomic(latoFile, updated)
    expect(await readJson(latoFile)).toEqual(updated)
    expect(await readJson(compatibilityFile)).toEqual({ theme: "compatibility" })
  }, 20000)
})
