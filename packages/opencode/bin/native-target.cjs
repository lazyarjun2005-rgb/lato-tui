#!/usr/bin/env node

function platformName(platform) {
  return platform === "win32" ? "windows" : platform
}

function nativeTargetName(input) {
  return [
    "lato",
    platformName(input.platform),
    input.arch,
    input.baseline ? "baseline" : undefined,
    input.musl ? "musl" : undefined,
  ]
    .filter(Boolean)
    .join("-")
}

module.exports = { nativeTargetName, platformName }
