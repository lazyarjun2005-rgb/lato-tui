import { Installation } from "@/installation"

// Checking never installs anything. Updates only happen when the user runs `/update` or `lato upgrade`.
export function shouldNotify(input: {
  autoupdate: boolean | "notify" | undefined
  disabled: boolean
  always: boolean
  current: string
  latest: string
}) {
  if (input.autoupdate === false || input.disabled) return false
  if (input.always) return true
  return Installation.isUpdate(input.current, input.latest)
}

// Lato builds do not check the upstream OpenCode release feed. Return no notice until a
// dedicated Lato update channel is configured.
export async function upgrade(): Promise<undefined> {
  return undefined
}
