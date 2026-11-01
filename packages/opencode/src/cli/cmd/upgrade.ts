import type { Argv } from "yargs"
import { UI } from "../ui"
import * as prompts from "@clack/prompts"

export const UpgradeCommand = {
  command: "upgrade [target]",
  describe: "check for Lato updates",
  builder: (yargs: Argv) => {
    return yargs.positional("target", {
      describe: "reserved for the Lato distribution channel",
      type: "string",
    })
  },
  handler: async () => {
    UI.empty()
    UI.println(UI.logo("  "))
    UI.empty()
    prompts.intro("Upgrade")
    prompts.log.warn("Self-upgrade is not available in this Lato development build.")
    prompts.log.info("Install updates from the Lato distribution channel when one is configured.")
    prompts.outro("Done")
  },
}
