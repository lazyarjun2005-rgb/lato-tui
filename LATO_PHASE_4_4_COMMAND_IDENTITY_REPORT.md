# Lato Phase 4.4 Command Identity Report

## Status

Complete. The official user-facing CLI command is now `lato-cli`.

No packages were published. No real user data was modified. All uncommitted
Phase 4.1–4.4 work was preserved.

## Why the command changed from `lato` to `lato-cli`

The product decision requires an unambiguous, independently identifiable
user-facing command that cannot conflict with shell aliases, distribution
package names, or existing tooling. `lato-cli` is explicit, portable, and
convention-compliant for CLI tools distributed through package managers.

## What changed

### `packages/opencode/package.json`

The `bin` field was updated from:

```json
{ "lato": "./bin/lato.cjs" }
```

to:

```json
{ "lato-cli": "./bin/lato-cli.cjs" }
```

### `packages/opencode/bin/lato-cli.cjs`

New file. The public package-manager shim that delegates to `run.cjs`:

```js
#!/usr/bin/env node
require("./run.cjs").main()
```

This is the entry point exposed by the `lato-cli` bin mapping. It is a thin
wrapper identical in structure to the existing `lato.cjs`. The separation keeps
the public name and internal resolver decoupled.

### `packages/opencode/src/cli/identity.ts`

`cliScriptName()` now returns `"lato-cli"`. This controls:

- Yargs `scriptName`, which drives all help/usage text.
- Shell completion marker (`###-begin-lato-cli-completions-###`).
- Error messages.
- Every occurrence of the command name in `--help` output.

### `packages/opencode/script/publish.ts`

The generated distribution package `bin` entry was updated from `lato` to
`lato-cli`. The `lato-cli.cjs` shim is now included in the generated package
layout alongside `lato.cjs`, `run.cjs`, and `native-target.cjs`.

### `packages/opencode/test/cli/executables.test.ts`

Updated to assert `lato-cli` as the bin key, verify `lato-cli.cjs` exists and
is executable, verify help output contains `lato-cli completion`, verify
completion marker contains `###-begin-lato-cli-completions-###`, and copy
`lato-cli.cjs` in the synthetic published layout test.

## Why the internal binary remains `lato`

The internal native binary compiled by `script/build.ts` remains:

```text
dist/lato-linux-x64/bin/lato
```

Renaming the native binary would require:

- Changing the Bun compile target (`bun-linux-x64`), which is separate from the
  output filename.
- Changing `run.cjs` binary resolution logic for all platforms.
- Changing `postinstall.mjs` copy targets.
- Rebuilding all native targets.
- Risk of launcher regression on Windows (`.exe` suffix) and macOS (quarantine,
  codesign).

The public command and internal binary are intentionally separate. The
package-manager shim is `lato-cli.cjs`; it delegates to `run.cjs`, which
resolves the internal `lato` or `lato.exe` binary. Users never need to know the
internal binary name.

## How package-manager shim resolution works

When a user runs `lato-cli` after installing the package:

1. The package manager executes `bin/lato-cli.cjs` via Node.
2. `lato-cli.cjs` calls `run.cjs` `main()`.
3. `run.cjs` checks `LATO_BIN_PATH`.
4. `run.cjs` checks a cached `.lato` binary path beside the wrapper.
5. `run.cjs` checks a sibling `lato` or `lato.exe`.
6. `run.cjs` searches `../dist/<lato-name>/bin/lato` in the repository local
   build output.
7. `run.cjs` searches parent `node_modules` for installed native packages.
8. If nothing is found, a diagnostic message lists the expected native package
   names and exits with code 1.

## How native binary discovery works

`bin/native-target.cjs` generates deterministic package names for all supported
targets:

| Platform | Arch  | Variant    | Name                           |
| -------- | ----- | ---------- | ------------------------------ |
| linux    | x64   | glibc      | `lato-linux-x64`               |
| linux    | x64   | glibc+base | `lato-linux-x64-baseline`      |
| linux    | x64   | musl       | `lato-linux-x64-musl`          |
| linux    | x64   | musl+base  | `lato-linux-x64-baseline-musl` |
| linux    | arm64 | glibc      | `lato-linux-arm64`             |
| linux    | arm64 | musl       | `lato-linux-arm64-musl`        |
| darwin   | arm64 |            | `lato-darwin-arm64`            |
| darwin   | x64   |            | `lato-darwin-x64`              |
| darwin   | x64   | baseline   | `lato-darwin-x64-baseline`     |
| win32    | x64   |            | `lato-windows-x64`             |
| win32    | arm64 |            | `lato-windows-arm64`           |

## What was tested on Linux

All tests run on Arch Linux x64.

- Native build succeeded: `dist/lato-linux-x64/bin/lato` (178 MB).
- `node bin/lato-cli.cjs --version` → `lato 0.0.0-lato-development-202611011156`.
- `node bin/lato-cli.cjs --help` → shows `lato-cli` in all command entries.
- From repository root: verified.
- From a disposable temp directory: verified.
- TUI started with disposable `HOME`/`XDG_*` environment; terminal title `Lato`.
- TUI footer shows the actual working directory, not the binary location.
- Launching from `packages/opencode` shows `packages/opencode` in footer.
- Launching from `/tmp/lato-proj-*` shows `/tmp/lato-proj-*` in footer.
- Provider IDs `opencode` and `opencode-go` remain unchanged.
- No OpenCode application bin entry exists.

## Regression tests passed

- `packages/opencode` executable tests: 6 passed.
- `packages/opencode` V1 config tests: 112 passed.
- `packages/opencode` TUI config tests: 36 passed (3 skip).
- `packages/opencode` MCP add tests: 2 passed.
- `packages/opencode` plugin concurrency tests: 3 passed.
- `packages/opencode` storage prototype tests: 11 passed.
- `packages/core` config tests: 15 passed.
- `packages/core` global tests: 3 passed.
- `git diff --check`: passed.
- Prettier: passed for all changed files.

## What was tested synthetically for Windows/macOS

`test/cli/executables.test.ts` includes naming assertions for:

- Linux x64, arm64, musl, and baseline variants.
- macOS x64 and arm64.
- Windows x64 and arm64.

These test `nativeTargetName()` output only. No native Windows or macOS
process was started.

## What requires native CI

- Windows x64 and arm64 native binary build and execution.
- Windows `lato-cli.cmd` shim behavior from npm/pnpm.
- macOS ARM64 and Intel binary execution.
- macOS executable permissions and codesign/quarantine behavior.
- Linux ARM64 and musl binary builds.
- Cross-platform `postinstall.mjs` execution.

## Whether `packages/opencode` directory rename is recommended

**Not recommended now.**

The directory `packages/opencode` is referenced by:

- `packages/opencode/package.json` `name: "opencode"` (workspace identity).
- All `packages/*/package.json` `devDependencies` and workspace references.
- `bunfig.toml` and `bun.lockb` workspace paths.
- All import paths using `@/` aliases defined in `tsconfig.json`.
- Build scripts (`build.ts`, `postinstall.mjs`, `publish.ts`) that use
  `path.resolve(__dirname, "..")`.
- Test helpers with `path.resolve(import.meta.dir, "../..")`.
- The Dockerfile and Nix derivation.
- Many `LATO_*.md` report files referencing source paths.

A safe rename would require:

1. Updating the workspace `package.json` paths.
2. Updating all cross-package imports and aliases.
3. Running a full workspace build to verify nothing is broken.
4. Updating CI workflows and all documentation.

This is a high-risk mechanical change with no functional benefit to the user.
The internal directory name is invisible to users after installation.
Recommendation: defer until a separate approved task with a full workspace
build and typecheck available.

## Distribution decisions still deferred

- npm package name and registry owner.
- Native package namespace (currently local `lato-*`).
- Release repository and artifact URLs.
- Docker image registry/name.
- Homebrew tap/formula.
- AUR package name.
- Installer URL and upgrade feed.
- Signing and notarization identities.

## Remaining risks

- The native binary still carries `lato` as its filename; this is intentional.
- Upgrade and uninstall remain disabled until ownership is established.
- Full workspace typecheck times out on this machine.
- Windows and macOS remain unverified natively.
