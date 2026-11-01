export * as ConfigPaths from "./paths"

import path from "path"
import { Flag } from "@opencode-ai/core/flag/flag"
import { Global } from "@opencode-ai/core/global"
import { unique } from "remeda"
import * as Effect from "effect/Effect"
import { FSUtil } from "@opencode-ai/core/fs-util"

export const files = Effect.fn("ConfigPaths.projectFiles")(function* (
  name: string,
  directory: string,
  worktree?: string,
) {
  const afs = yield* FSUtil.Service
  const legacy = (yield* afs.up({
    targets: [`${name}.jsonc`, `${name}.json`],
    start: directory,
    stop: worktree,
  })).toReversed()
  if (name !== "opencode") return legacy
  const lato = (yield* afs.up({
    targets: ["lato.jsonc", "lato.json"],
    start: directory,
    stop: worktree,
  })).toReversed()
  return [...legacy, ...lato]
})

export const directories = Effect.fn("ConfigPaths.directories")(function* (directory: string, worktree?: string) {
  const afs = yield* FSUtil.Service
  const global = Global.make()
  return unique([
    global.config,
    Global.Path.legacyConfig,
    ...(!Flag.OPENCODE_DISABLE_PROJECT_CONFIG
      ? yield* afs.up({
          targets: [".opencode"],
          start: directory,
          stop: worktree,
        })
      : []),
    ...(yield* afs.up({
      targets: [".opencode"],
      start: Global.Path.home,
      stop: Global.Path.home,
    })),
    ...(!Flag.OPENCODE_DISABLE_PROJECT_CONFIG
      ? yield* afs.up({
          targets: [".lato"],
          start: directory,
          stop: worktree,
        })
      : []),
    ...(yield* afs.up({
      targets: [".lato"],
      start: Global.Path.home,
      stop: Global.Path.home,
    })),
    ...(Flag.OPENCODE_CONFIG_DIR ? [Flag.OPENCODE_CONFIG_DIR] : []),
  ])
})

export function fileInDirectory(dir: string, name: string) {
  return [path.join(dir, `${name}.json`), path.join(dir, `${name}.jsonc`)]
}

export function globalConfigFiles(global = Global.make()) {
  return [
    ...["lato.jsonc", "lato.json", "opencode.jsonc", "opencode.json", "config.json"].map((file) =>
      path.join(global.config, file),
    ),
    ...["opencode.jsonc", "opencode.json", "config.json"].map((file) => path.join(global.legacyConfig, file)),
  ]
}

export function projectConfigFiles(directory: string) {
  return [
    path.join(directory, ".lato", "lato.jsonc"),
    path.join(directory, ".lato", "lato.json"),
    path.join(directory, ".opencode", "opencode.jsonc"),
    path.join(directory, ".opencode", "opencode.json"),
    path.join(directory, "lato.jsonc"),
    path.join(directory, "lato.json"),
    path.join(directory, "opencode.jsonc"),
    path.join(directory, "opencode.json"),
  ]
}
