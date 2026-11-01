import { dirname, join, win32 } from "node:path"

export function cliScriptName() {
  return "lato-cli"
}

export function cliPreferenceState(compatibilityState: string) {
  if (compatibilityState.includes("\\")) return win32.join(win32.dirname(compatibilityState), "lato")
  return join(dirname(compatibilityState), "lato")
}
