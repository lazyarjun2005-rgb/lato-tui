# Lato Phase 4.1 Report

## A. Final Status

**Partially complete.** Lato now has a single application entry point and only a `lato` command. The legacy `opencode` executable, bin mapping, runtime identity switch, and `lato pr` fallback are removed. Native build, postinstall, publish, Docker, Nix, and release-workflow command paths target `lato`/`lato.exe`.

Phase 4.1 is not production-ready. External publication channels, the root installer, native Windows/macOS execution, and a full native build remain unresolved or unverified.

## B. Objective

Make Lato a genuinely Lato-only application while preserving the OpenCode-derived engine and its `opencode`/`opencode-go` provider integrations. Lato must not expose or require a second OpenCode application executable.

## C. Pre-Edit Audit

- The package exposed both `lato` and `opencode` bins through separate ESM launchers.
- `bin/run.cjs` selected runtime identity from `argv[1]`/`LATO_RUNTIME_IDENTITY`, used `.opencode`, `opencode.exe`, `OPENCODE_BIN_PATH`, and `opencode-*` package names.
- CLI identity was dual, so the same application could display as OpenCode.
- TUI state selection accepted an identity and returned either the compatibility state path or `.../lato`.
- `lato pr` fell back to an `opencode` executable.
- Native builds emitted `bin/opencode`; postinstall installed `bin/opencode.exe`; generated npm metadata still exposed an `opencode` command.
- Docker, Nix, AUR/Homebrew, and release workflows still referenced OpenCode command paths.
- `packages/core` had a stale `opencode` bin whose file did not exist. `packages/cli` exposes a separate experimental `lildax` command.
- Provider IDs, configuration filenames, environment variables, mDNS defaults, storage paths, server headers, GitHub integration identifiers, and external URLs are independent of the application command and were not treated as rename targets.

## D. Implementation

- Added `packages/opencode/bin/lato.cjs` as the only application launcher.
- Removed `packages/opencode/bin/lato` and `packages/opencode/bin/opencode`.
- Reduced `packages/opencode/bin/run.cjs` to Lato-only execution:
  - `LATO_BIN_PATH`, `.lato`, sibling `lato`/`lato.exe`, and `bin/lato`/`lato.exe` lookup.
  - Inherited `LATO_RUNTIME_IDENTITY` no longer changes application identity.
  - No command identity argument or OpenCode error product.
- Exposed only `"lato": "./bin/lato.cjs"` in `packages/opencode/package.json`.
- Removed the stale `opencode` bin from `packages/core/package.json`.
- Made CLI identity constant Lato and simplified `cliPreferenceState(state)`.
- Kept the Lato preference path at `${XDG_STATE_HOME:-~/.local/state}/lato/kv.json`; it is idempotent if the state path already ends in `lato`.
- Updated TUI and attach preference wiring to use the Lato-only helper.
- Changed CLI version output to `lato <version>`.
- Removed the `opencode` executable fallback from `lato pr`.
- Changed the debug-agent hint to `lato agent list`.
- Updated native build output to `bin/lato`/`lato.exe` and changed the Lato user agent.
- Updated postinstall to copy the native `lato` binary to `bin/lato`/`bin/lato.exe`.
- Updated generated npm package metadata to expose only `lato`.
- Updated Docker, Nix, AUR/Homebrew install paths, and release-workflow binary paths to `lato`.
- Preserved provider IDs, provider endpoints, authentication, configuration discovery, engine behavior, permissions, sessions, MCP, and extensibility.

## E. Provider and Engine Preservation

- Provider IDs `opencode` and `opencode-go` were not renamed.
- Provider tests pass: 103 tests, 248 expectations, zero failures.
- Configuration filename `opencode.json`, `OPENCODE_*` environment variables, `opencode.local` mDNS default, `.opencode` project directories, server headers, storage paths, and GitHub integration identifiers remain compatibility surfaces.
- No configuration, database, auth, session, or storage migration was performed.

## F. Verification

Focused tests were run sequentially from package directories:

- `packages/opencode`: `identity.test.ts` + `pr.test.ts` — 8 pass, 0 fail, 14 expectations, 2.32s.
- `packages/opencode`: `executables.test.ts` — 5 pass, 0 fail, 20 expectations, 15.03s.
- `packages/opencode`: `native-state.test.ts` — 2 pass, 0 fail, 16 expectations, 3.72s.
- `packages/opencode`: `provider.test.ts` — 103 pass, 0 fail, 248 expectations, 53.80s.
- `packages/opencode`: `help-snapshots.test.ts` — 1 pass, 0 fail, 34 snapshots, 40 expectations, 43.20s.
- `packages/tui`: `prompt/persistence.test.ts` + `runtime.test.tsx` — 9 pass, 0 fail, 23 expectations, 699ms.
- Manual source invocation: `lato --version` printed `lato local`.
- Prettier checks passed for changed JavaScript/TypeScript/JSON/YAML files. Nix and Dockerfile have no Prettier parser and were inspected directly.

The executable tests verify:

- Only `lato` is exposed; `bin/opencode` does not exist.
- Arguments and exit codes are preserved.
- The published CommonJS launcher loads the shared wrapper.
- A symlinked Lato invocation resolves.
- Help, completion, errors, and version output use Lato identity.

The native-state tests verify:

- A compiled Linux Lato binary resolves `lato`.
- An inherited `LATO_RUNTIME_IDENTITY=opencode` value is ignored.
- Lato and compatibility state paths remain separate.
- The Lato state path is idempotent and compatibility preference files are untouched.

## G. Platform and Packaging Status

- Linux source invocation was verified.
- Linux temporary compiled identity and state tests passed.
- Native Windows and macOS execution was not run and was not simulated as success.
- Windows expected entry point remains `lato.exe`; `.cmd`/PATHEXT shim behavior is unverified.
- No native build was run, so the new `bin/lato`/`lato.exe` build outputs, postinstall replacement, signed artifacts, Docker image, Nix derivation, or release workflow were not validated.
- External distribution identifiers remain OpenCode-owned: npm package `opencode-ai`, optional packages/release archives `opencode-*`, Docker image `ghcr.io/anomalyco/opencode`, AUR/Homebrew package names, and the root `install` script. These are not approved Lato release channels.
- `packages/cli` remains a separate experimental `lildax` command; its `OPENCODE_BIN_PATH` lookup is outside the Lato application entry point.

## H. Remaining Issues

- Configure and verify Lato-owned package, release, Docker, AUR, Homebrew, installer, signing, and update channels.
- Replace or formally retire the inherited root OpenCode installer before directing users to it.
- Validate native Linux, Windows, and macOS builds and packaged installs.
- Verify Windows `.cmd`, `lato.exe`, PATH/PATHEXT, postinstall replacement, and signed binaries.
- Run full workspace typecheck, lint, native build, and application launch verification when resources permit.
- Decide whether external artifact/package identifiers should be renamed; do not invent Lato URLs or publish inherited OpenCode artifacts as Lato releases.
- Keep `lato upgrade` and `lato uninstall` unavailable until Lato installation ownership exists.

## I. Safety and Git State

- No commit, push, branch switch, tag change, rebase, reset, clean, stash, or remote change was performed.
- No user configuration, database, authentication, session, or storage data was read, moved, or modified.
- No full release build, package publication, Docker build, Nix build, or background process was run.
- The working tree contains the Phase 4.0 and Phase 4.1 changes plus existing untracked `LATO_*.md` documentation.
