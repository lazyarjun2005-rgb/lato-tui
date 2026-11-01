import { describe, expect, mock, test } from "bun:test"

const installationMethod = mock(() => {
  throw new Error("destructive uninstall path reached")
})
const warning = mock(() => undefined)
const outro = mock(() => undefined)

void mock.module("../../src/installation", () => ({
  Installation: { method: installationMethod },
}))
void mock.module("@clack/prompts", () => ({
  intro: mock(() => undefined),
  log: { warn: warning },
  outro,
}))

const { UNINSTALL_UNAVAILABLE_MESSAGE, UninstallCommand, uninstallStatus } = await import("../../src/cli/cmd/uninstall")
mock.restore()

describe("Lato uninstall safety", () => {
  test("is disabled until installation ownership is established", () => {
    expect(uninstallStatus()).toEqual({ available: false, message: UNINSTALL_UNAVAILABLE_MESSAGE })
    expect(UNINSTALL_UNAVAILABLE_MESSAGE).toContain("Existing OpenCode installations")
    expect(UNINSTALL_UNAVAILABLE_MESSAGE).toContain("data will be preserved")
  })

  test("returns before inspecting or removing any installation", async () => {
    await UninstallCommand.handler({ keepConfig: false, keepData: false, dryRun: false, force: true })
    expect(installationMethod).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledWith(UNINSTALL_UNAVAILABLE_MESSAGE)
    expect(outro).toHaveBeenCalledWith("No changes made")
  })
})
