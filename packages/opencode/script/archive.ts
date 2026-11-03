#!/usr/bin/env bun

import { createHash } from "node:crypto"
import { readdir, rm } from "node:fs/promises"
import path from "node:path"

const targets = [
  "lato-linux-x64",
  "lato-linux-x64-baseline",
  "lato-linux-x64-musl",
  "lato-linux-x64-baseline-musl",
  "lato-linux-arm64",
  "lato-linux-arm64-musl",
  "lato-darwin-arm64",
  "lato-darwin-x64",
  "lato-darwin-x64-baseline",
  "lato-windows-arm64",
  "lato-windows-x64",
  "lato-windows-x64-baseline",
]

const command = process.argv[2]
const options = parseOptions(process.argv.slice(3))

if (command === "assemble") await assemble(options)
else if (command === "validate") await validate(options)
else if (command === "manifest") await manifest(options)
else if (command === "validate-manifest") await validateManifest(options)
else throw new Error("Usage: archive.ts <assemble|validate|manifest|validate-manifest> [options]")

async function assemble(options: Map<string, string>) {
  const target = requireOption(options, "target")
  const binary = requireOption(options, "binary")
  const output = requireOption(options, "output")
  const executable = executableName(target)
  const archive = archiveName(target)
  if (!targets.includes(target)) throw new Error(`Unsupported target: ${target}`)
  if (path.basename(binary) !== executable) throw new Error(`Expected ${executable} for ${target}, got ${binary}`)
  if (!(await Bun.file(binary).exists())) throw new Error(`Binary not found: ${binary}`)

  await rm(output, { force: true })
  await Bun.write(output, new Uint8Array())
  await rm(output)
  await runArchive(target, binary, output)
  await validateArchive(target, output)
  console.log(`assembled ${archive}`)
}

async function validate(options: Map<string, string>) {
  const target = requireOption(options, "target")
  const archive = requireOption(options, "archive")
  if (!targets.includes(target)) throw new Error(`Unsupported target: ${target}`)
  if (path.basename(archive) !== archiveName(target)) throw new Error(`Unexpected archive name: ${archive}`)
  await validateArchive(target, archive)
  console.log(`validated ${archive}`)
}

async function manifest(options: Map<string, string>) {
  const directory = requireOption(options, "dir")
  const output = requireOption(options, "output")
  const files = (await readdir(directory)).filter((file) => file.endsWith(".tar.gz") || file.endsWith(".zip")).sort()
  const expected = targets.map(archiveName).sort()
  if (files.length !== expected.length || files.some((file, index) => file !== expected[index])) {
    throw new Error(`Archive set mismatch. Expected ${expected.join(", ")}; found ${files.join(", ")}`)
  }

  const lines = await Promise.all(files.map(async (file) => `${await sha256(path.join(directory, file))}  ${file}`))
  await Bun.write(output, `${lines.join("\n")}\n`)
  console.log(`wrote ${output}`)
}

async function validateManifest(options: Map<string, string>) {
  const directory = requireOption(options, "dir")
  const manifestPath = requireOption(options, "manifest")
  const lines = (await Bun.file(manifestPath).text()).trim().split("\n")
  const expected = targets.map(archiveName).sort()
  if (lines.length !== expected.length) throw new Error("Checksum manifest has an unexpected number of entries")
  for (const [index, line] of lines.entries()) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line)
    if (!match || match[2] !== expected[index]) throw new Error(`Malformed checksum entry: ${line}`)
    const actual = await sha256(path.join(directory, match[2]))
    if (actual !== match[1]) throw new Error(`Checksum mismatch: ${match[2]}`)
  }
  console.log(`validated ${manifestPath}`)
}

async function runArchive(target: string, binary: string, output: string) {
  const absoluteBinary = path.resolve(binary)
  const absoluteOutput = path.resolve(output)
  if (target.startsWith("lato-linux-")) {
    await run(["tar", "-czf", absoluteOutput, "-C", path.dirname(absoluteBinary), path.basename(absoluteBinary)])
    return
  }
  if (process.platform === "win32") {
    const command = `Compress-Archive -LiteralPath ${quotePowerShell(absoluteBinary)} -DestinationPath ${quotePowerShell(absoluteOutput)} -Force`
    await run(["pwsh", "-NoProfile", "-NonInteractive", "-Command", command])
    return
  }
  await run(["zip", "-j", absoluteOutput, absoluteBinary])
}

async function validateArchive(target: string, archive: string) {
  const expected = executableName(target)
  if (process.platform === "win32") {
    const directory = path.join(path.dirname(archive), `.validate-${crypto.randomUUID()}`)
    try {
      const command = `Expand-Archive -LiteralPath ${quotePowerShell(path.resolve(archive))} -DestinationPath ${quotePowerShell(directory)} -Force; $files = @(Get-ChildItem -LiteralPath ${quotePowerShell(directory)} -File -Recurse); if ($files.Count -ne 1 -or $files[0].Name -ne '${expected}') { exit 1 }`
      await run(["pwsh", "-NoProfile", "-NonInteractive", "-Command", command])
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
    return
  }
  const listing = target.startsWith("lato-linux-")
    ? await runText(["tar", "-tzf", path.resolve(archive)])
    : await runText(["unzip", "-Z1", path.resolve(archive)])
  if (listing.trim() !== expected) throw new Error(`Archive must contain only ${expected}, got ${listing.trim()}`)
}

function archiveName(target: string) {
  return `${target}${target.startsWith("lato-linux-") ? ".tar.gz" : ".zip"}`
}

function executableName(target: string) {
  return target.startsWith("lato-windows-") ? "lato.exe" : "lato"
}

function parseOptions(args: string[]) {
  const options = new Map<string, string>()
  for (let index = 0; index < args.length; index++) {
    const key = args[index]
    if (!key.startsWith("--") || !args[index + 1] || args[index + 1].startsWith("--"))
      throw new Error(`Invalid option: ${key}`)
    options.set(key.slice(2), args[++index])
  }
  return options
}

function requireOption(options: Map<string, string>, name: string) {
  const value = options.get(name)
  if (!value) throw new Error(`Missing --${name}`)
  return value
}

function quotePowerShell(value: string) {
  return `'${value.replaceAll("'", "''")}'`
}

async function run(args: string[]) {
  const process = Bun.spawn(args, { stdout: "inherit", stderr: "inherit" })
  if ((await process.exited) !== 0) throw new Error(`Command failed: ${args.join(" ")}`)
}

async function runText(args: string[]) {
  const process = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" })
  const output = await new Response(process.stdout).text()
  if ((await process.exited) !== 0) throw new Error(`Command failed: ${args.join(" ")}`)
  return output
}

async function sha256(file: string) {
  const hash = createHash("sha256")
  hash.update(Buffer.from(await Bun.file(file).arrayBuffer()))
  return hash.digest("hex")
}
