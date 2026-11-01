import path from "path"
import { appendFile, mkdir, rename, rm } from "fs/promises"

export function readText(filePath: string) {
  return Bun.file(filePath).text()
}

export function readJson<T>(filePath: string) {
  return Bun.file(filePath).json() as Promise<T>
}

export async function writeText(filePath: string, content: string) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await Bun.write(filePath, content)
}

export async function appendText(filePath: string, content: string) {
  await mkdir(path.dirname(filePath), { recursive: true })
  await appendFile(filePath, content)
}

// Windows replace-renames are mutually exclusive on the destination. Under a
// burst of writers, MoveFileEx lets one rename win while the others fail with
// EPERM/EACCES/EBUSY; each retry round can therefore promote at most one
// writer, so a bounded retry budget alone is exhausted by peer writers even
// when nothing external holds the file. These codes also cover transient
// external locks (antivirus/indexer scans, readers without delete sharing).
// Both protections stay Windows-only so POSIX keeps its previous behavior.
const renameRetryDelaysMs = [10, 25, 50, 100, 200, 400]

function transientWindowsRename(error: unknown) {
  if (process.platform !== "win32") return false
  const code = error instanceof Error && "code" in error ? String(error.code) : undefined
  return code === "EPERM" || code === "EACCES" || code === "EBUSY"
}

async function renameAtomic(temporary: string, filePath: string) {
  let attempt = 0
  for (;;) {
    try {
      await rename(temporary, filePath)
      return
    } catch (error) {
      if (attempt >= renameRetryDelaysMs.length || !transientWindowsRename(error)) throw error
      await Bun.sleep(renameRetryDelaysMs[attempt])
      attempt++
    }
  }
}

async function writeJsonNow(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true })
  const temporary = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`
  try {
    await Bun.write(temporary, JSON.stringify(value))
    await renameAtomic(temporary, filePath)
  } catch (error) {
    // The temporary file is ours to discard; the previous preference file is
    // never deleted before a successful rename, only replaced by it.
    await rm(temporary, { force: true }).catch(() => undefined)
    throw error
  }
}

// Queue same-process writes per destination on Windows so competing writers
// never race the same replace-rename. Unique temporary files are still created
// per write, so each queued write remains independently atomic. POSIX keeps
// its parallel last-writer-wins renames.
const writeQueues = new Map<string, Promise<void>>()

function queueKey(filePath: string) {
  const resolved = path.resolve(filePath)
  return process.platform === "win32" ? resolved.toLowerCase() : resolved
}

async function writeJsonQueued(filePath: string, value: unknown) {
  const key = queueKey(filePath)
  const previous = writeQueues.get(key) ?? Promise.resolve()
  const write = previous.catch(() => undefined).then(() => writeJsonNow(filePath, value))
  writeQueues.set(key, write)
  try {
    await write
  } finally {
    if (writeQueues.get(key) === write) writeQueues.delete(key)
  }
}

export async function writeJsonAtomic(filePath: string, value: unknown) {
  if (process.platform !== "win32") return writeJsonNow(filePath, value)
  return writeJsonQueued(filePath, value)
}
