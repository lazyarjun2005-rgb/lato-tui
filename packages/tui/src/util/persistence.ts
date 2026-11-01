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

// Windows can hold the rename destination lockable for a moment after it is
// created or read (handles without delete sharing, antivirus/indexer scans of
// freshly replaced files), so renames over an existing file fail transiently
// with these codes even though a retry succeeds. POSIX renames do not have
// this window, so retries stay Windows-only to keep other platforms unchanged.
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

export async function writeJsonAtomic(filePath: string, value: unknown) {
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
