import path from "node:path"
import { Global } from "@opencode-ai/core/global"
import { cliPreferenceState, cliScriptName } from "../../src/cli/identity"

const state = Global.Path.state
const root = path.dirname(state)
const lato = cliPreferenceState(state)

console.log(
  JSON.stringify({
    platform: process.platform,
    separator: path.sep,
    state,
    root,
    lato,
    entryPoint: cliPreferenceState(state),
    latoName: path.basename(lato),
    identity: cliScriptName(),
  }),
)
