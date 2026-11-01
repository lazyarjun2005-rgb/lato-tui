import { basename, dirname, join, win32 } from "node:path"

export function cliScriptName(argv = process.argv, execPath = process.execPath) {
  const names = [argv[1], argv[0], execPath]
    .filter((value): value is string => !!value)
    .map((value) =>
      basename(value.replaceAll("\\", "/"))
        .replace(/\.(?:cmd|exe)$/i, "")
        .toLowerCase(),
    )

  return names.includes("opencode") ? "opencode" : "lato"
}

export function cliPreferenceState(identity: "lato" | "opencode", compatibilityState: string) {
  if (identity === "opencode") return compatibilityState
  if (compatibilityState.includes("\\")) return win32.join(win32.dirname(compatibilityState), "lato")
  return join(dirname(compatibilityState), "lato")
}
