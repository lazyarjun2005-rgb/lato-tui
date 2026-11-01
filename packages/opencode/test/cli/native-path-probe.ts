import path from "node:path"
import { Global } from "@opencode-ai/core/global"
import { cliPreferenceState, cliScriptName } from "../../src/cli/identity"

const state = Global.Path.state
const root = path.dirname(state)
const lato = cliPreferenceState("lato", state)
const opencode = cliPreferenceState("opencode", state)
const invokedLato = path.join(root, "bin", "lato")
const invokedOpencode = path.join(root, "bin", "opencode")

console.log(
  JSON.stringify({
    platform: process.platform,
    separator: path.sep,
    state,
    root,
    lato,
    opencode,
    entryPoint: {
      lato: cliPreferenceState(cliScriptName([invokedLato, "--help"], invokedLato), state),
      opencode: cliPreferenceState(cliScriptName([invokedOpencode, "--help"], invokedOpencode), state),
    },
    latoName: path.basename(lato),
    opencodeName: path.basename(opencode),
    identity: {
      lato: cliScriptName([invokedLato, "--help"]),
      opencode: cliScriptName([invokedOpencode, "--help"]),
      latoExe: cliScriptName([path.join(root, "bin", "lato.exe"), "--help"]),
      opencodeExe: cliScriptName([path.join(root, "bin", "opencode.exe"), "--help"]),
      latoCmd: cliScriptName([path.join(root, "bin", "lato.cmd"), "--help"]),
    },
  }),
)
