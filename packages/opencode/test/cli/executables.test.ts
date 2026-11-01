import { afterEach, describe, expect, test } from "bun:test"
import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import path from "node:path"

const packageRoot = path.resolve(import.meta.dir, "../..")
const cliEntry = path.join(packageRoot, "src/index.ts")
const nodeRuntime = Bun.which("node")
const require = createRequire(import.meta.url)
const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true })
})

async function run(args: string[], env: Record<string, string> = {}) {
  const child = Bun.spawn(args, {
    cwd: packageRoot,
    env: { ...process.env, ...env },
    stdout: "pipe",
    stderr: "pipe",
  })
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  return { code, stdout, stderr }
}

async function syntheticRoot(prefix: string) {
  const root = await mkdtemp(path.join(tmpdir(), prefix))
  roots.push(root)
  return root
}

describe("executable entry points", () => {
  test("exposes only the lato-cli command", async () => {
    const pkg = (await Bun.file(path.join(packageRoot, "package.json")).json()) as {
      bin: Record<string, string>
    }
    // The public user-facing command is lato-cli; the old `lato` bin entry must be gone.
    expect(pkg.bin).toEqual({ "lato-cli": "./bin/lato-cli.cjs" })
    expect(await Bun.file(path.join(packageRoot, pkg.bin["lato-cli"])).exists()).toBe(true)
    expect(await Bun.file(path.join(packageRoot, "bin/opencode")).exists()).toBe(false)

    if (process.platform !== "win32") {
      const mode = (await Bun.file(path.join(packageRoot, pkg.bin["lato-cli"])).stat()).mode
      expect(mode & 0o111).not.toBe(0)
    }
  })

  test("uses Lato-native target names across package layouts", () => {
    const targets = require(path.join(packageRoot, "bin/native-target.cjs")) as {
      nativeTargetName: (input: { platform: string; arch: string; baseline?: boolean; musl?: boolean }) => string
    }
    expect(targets.nativeTargetName({ platform: "linux", arch: "x64" })).toBe("lato-linux-x64")
    expect(targets.nativeTargetName({ platform: "linux", arch: "arm64", musl: true })).toBe("lato-linux-arm64-musl")
    expect(targets.nativeTargetName({ platform: "darwin", arch: "x64", baseline: true })).toBe(
      "lato-darwin-x64-baseline",
    )
    expect(targets.nativeTargetName({ platform: "win32", arch: "arm64" })).toBe("lato-windows-arm64")
  })

  test("wrapper preserves arguments and exit codes", async () => {
    const root = await syntheticRoot("lato-wrapper-")
    const probe = path.join(root, "probe.cjs")
    await writeFile(
      probe,
      [
        "console.log(JSON.stringify(process.argv.slice(2)))",
        'process.exit(process.argv[2] === "exit-7" ? 7 : 0)',
        "",
      ].join("\n"),
    )

    const result = await run(
      [nodeRuntime ?? process.execPath, path.join(packageRoot, "bin/lato.cjs"), probe, "alpha", "beta"],
      {
        LATO_BIN_PATH: process.execPath,
      },
    )
    expect(result.code).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual(["alpha", "beta"])

    const exit = await run([nodeRuntime ?? process.execPath, path.join(packageRoot, "bin/lato.cjs"), probe, "exit-7"], {
      LATO_BIN_PATH: process.execPath,
    })
    expect(exit.code).toBe(7)
  })

  test("published CommonJS launcher loads the shared runtime", async () => {
    const root = await syntheticRoot("lato-published-")
    await mkdir(path.join(root, "bin"), { recursive: true })
    await copyFile(path.join(packageRoot, "bin/run.cjs"), path.join(root, "bin/run.cjs"))
    await copyFile(path.join(packageRoot, "bin/lato.cjs"), path.join(root, "bin/lato.cjs"))
    await copyFile(path.join(packageRoot, "bin/lato-cli.cjs"), path.join(root, "bin/lato-cli.cjs"))
    await copyFile(path.join(packageRoot, "bin/native-target.cjs"), path.join(root, "bin/native-target.cjs"))
    const probe = path.join(root, "probe.cjs")
    await writeFile(probe, "console.log(process.argv.slice(2).join(','))\n")

    const result = await run([nodeRuntime ?? process.execPath, path.join(root, "bin/lato.cjs"), probe, "one"], {
      LATO_BIN_PATH: process.execPath,
    })
    expect(result.code).toBe(0)
    expect(result.stdout.trim()).toBe("one")
  })

  test("wrapper honors a symlinked invocation name", async () => {
    if (process.platform === "win32" || !nodeRuntime) return

    const root = await syntheticRoot("lato-symlink-")
    const probe = path.join(root, "probe.cjs")
    const link = path.join(root, "lato")
    await writeFile(probe, "console.log(process.argv.slice(2).join(','))\n")
    await symlink(path.join(packageRoot, "bin/lato.cjs"), link)
    const result = await run([nodeRuntime, link, probe, "one"], { LATO_BIN_PATH: process.execPath })
    expect(result.code).toBe(0)
    expect(result.stdout.trim()).toBe("one")
  })

  test("Lato help and errors use the Lato command identity", async () => {
    const root = await syntheticRoot("lato-help-")
    await mkdir(path.join(root, "home"), { recursive: true })
    const env = {
      HOME: path.join(root, "home"),
      XDG_CONFIG_HOME: path.join(root, "config"),
      XDG_DATA_HOME: path.join(root, "data"),
      XDG_STATE_HOME: path.join(root, "state"),
      XDG_CACHE_HOME: path.join(root, "cache"),
      COLUMNS: "120",
    }

    const runtime = nodeRuntime ?? process.execPath
    // Use the public lato-cli.cjs shim for command-identity assertions.
    const wrapper = path.join(packageRoot, "bin/lato-cli.cjs")
    const version = await run([runtime, wrapper, "run", cliEntry, "--version"], {
      ...env,
      LATO_BIN_PATH: process.execPath,
    })
    expect(version.code).toBe(0)
    expect(version.stdout.trim()).toMatch(/^lato /)

    const result = await run([runtime, wrapper, "run", cliEntry, "--help"], {
      ...env,
      LATO_BIN_PATH: process.execPath,
    })
    expect(result.code).toBe(0)
    expect(result.stderr).toContain("lato-cli completion")
    expect(result.stderr).not.toContain("opencode completion")

    const completion = await run([runtime, wrapper, "run", cliEntry, "completion", "bash"], {
      ...env,
      LATO_BIN_PATH: process.execPath,
    })
    expect(completion.code).toBe(0)
    expect(completion.stdout + completion.stderr).toContain("###-begin-lato-cli-completions-###")

    const invalid = await run([runtime, wrapper, "run", cliEntry, "--definitely-invalid"], {
      ...env,
      LATO_BIN_PATH: process.execPath,
    })
    expect(invalid.code).toBe(1)
    expect(invalid.stderr).toContain("lato-cli completion")
  }, 30000)
})
