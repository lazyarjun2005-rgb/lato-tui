# Lato Native Cross-Platform Validation

> Historical Phase 3.9 validation. Phase 4.1 removes the OpenCode application entry point and changes the native build output to `lato`/`lato.exe`. References below to `bin/opencode`, `opencode` identity, and dual executable state describe the Phase 3.9 state and are superseded by `LATO_PHASE_4_1_REPORT.md`.

Status: Phase 3.9 partially complete — Linux native validation executed; Windows and macOS CI definitions prepared but not executed because no native host or push-capable remote was available in this environment.

No native Windows or macOS result is claimed from Linux mocks.

## 1. Existing CI Architecture

GitHub Actions is the existing CI system.

- `.github/workflows/test.yml` runs `unit` and `e2e` jobs.
- Its runner matrix uses Blacksmith hosts: `blacksmith-4vcpu-ubuntu-2404` and `blacksmith-4vcpu-windows-2025`.
- It has no macOS job.
- It triggers on pushes to `v1`, pull requests, and manual dispatch.
- `.github/actions/setup-bun/action.yml` installs Node 24, resolves Bun from `packageManager` (`bun@1.4.4`), caches Bun packages, and runs `bun install`.
- Package test convention is `bun test --timeout 30000 --only-failures`; focused files are run directly from the package directory.

## 2. CI Changes Made

Added `.github/workflows/lato-native-validation.yml`:

| Runner           | Platform | Purpose                                        | Executed in Phase 3.9 |
| ---------------- | -------- | ---------------------------------------------- | --------------------- |
| `ubuntu-latest`  | Linux    | Native identity, state-path, persistence tests | No                    |
| `windows-latest` | Windows  | Native identity, path, filesystem tests        | No                    |
| `macos-latest`   | macOS    | Native identity, path, persistence tests       | No                    |

The workflow:

- Reuses the existing local `./.github/actions/setup-bun` composite action.
- Runs only focused identity, native state, TUI persistence, and TUI runtime tests.
- Uses no secrets, authentication, publication, deployment, packaging, or release steps.
- Requests only `contents: read`.
- Triggers on manual dispatch, pull requests, and pushes to `lato-development`.
- Uses `bun test --timeout 30000` to match the repository test convention.

The workflow YAML was parsed successfully as part of this phase. It has not been executed by GitHub Actions because Phase 3.9 prohibits commits and pushes, and the development host has no native Windows or macOS machine.

## 3. Linux Native Results

Linux native validation was executed on the Arch Linux development host using Bun `1.4.4`. These are real Linux filesystem and path results, not mocks.

- `packages/opencode`: `bun test --timeout 60000 test/cli/identity.test.ts test/cli/native-state.test.ts` — 7 pass, 0 fail, 38 expect calls.
- `packages/tui`: `bun test --timeout 30000 test/prompt/persistence.test.ts` — 7 pass, 0 fail, 17 expect calls.
- `packages/tui`: `bun test --timeout 30000 test/runtime.test.tsx` — 2 pass, 0 fail, 6 expect calls.
- `packages/opencode`: `bun test --timeout 30000 test/provider/provider.test.ts` — 103 pass, 0 fail, 248 expect calls.

An initial provider run omitted `--timeout 30000`, used Bun's default 5-second timeout, and produced two test timeouts plus a hook timeout. Re-running with the repository's configured timeout passed all 103 tests. This was a command configuration issue, not a provider defect; it is recorded rather than hidden.

The permission tests ran as a non-root user and exercised real permission failures. They are skipped automatically on Windows and when the process runs as root.

## 4. Windows Native Results

Not executed. No native Windows host or GitHub Actions run was available.

The prepared `windows-latest` job will run the same focused tests when the workflow is pushed. Until those results exist, Windows is **not natively verified**.

Expected from the existing architecture (not yet observed on Windows):

- Executable identity: `lato.exe` -> `lato`, `opencode.exe` -> `opencode`.
- State root: `%XDG_STATE_HOME%` if set, otherwise `%USERPROFILE%\.local\state\opencode`.
- Lato state: sibling `%USERPROFILE%\.local\state\lato`.
- Path separators: backslashes; `cliPreferenceState` selects `path.win32.join` because the resolved compatibility path contains `\`.

The architecture does not use `%APPDATA%` or `%LOCALAPPDATA%` for this path because `Global.Path.state` currently comes from `xdg-basedir`, which is platform-independent. Phase 3.9 did not introduce a different Windows convention.

Known Windows limitation: npm-style `.cmd` shims invoke the underlying `bin/opencode` script, so `process.argv` may not contain the `lato.cmd` name. Compiled `lato.exe` execution is expected to resolve correctly, but wrapper execution remains to be tested.

## 5. macOS Native Results

Not executed. No native macOS host or GitHub Actions run was available.

The prepared `macos-latest` job will run the same focused tests when the workflow is pushed. Until those results exist, macOS is **not natively verified**.

Expected from the existing architecture (not yet observed on macOS):

- Executable identity: `lato` -> `lato`, `opencode` -> `opencode`.
- State root: `$XDG_STATE_HOME` if set, otherwise `$HOME/.local/state/opencode`.
- Lato state: sibling `$HOME/.local/state/lato`.
- Path separators: forward slashes.

The architecture does not use `~/Library/Application Support` for this path. Phase 3.9 did not introduce a different macOS convention.

## 6. Runtime Identity Results

Linux native plus platform-independent identity coverage:

| Input                                    | Result             |
| ---------------------------------------- | ------------------ |
| `/opt/lato/bin/lato`                     | `lato`             |
| `/opt/opencode/bin/opencode`             | `opencode`         |
| `C:\Program Files\Lato\lato.exe`         | `lato`             |
| `C:\Program Files\OpenCode\opencode.exe` | `opencode`         |
| `C:\Program Files\Lato\lato.cmd`         | `lato`             |
| Unrelated runtime or source entry        | `lato`             |
| `lato`/`opencode` binary with `--help`   | identity preserved |

The native state test also executes the exact entry-point composition:

```ts
cliPreferenceState(cliScriptName([invokedPath, "--help"], invokedPath), Global.Path.state)
```

for both `lato` and `opencode` against the real platform path stack.

Linux native compiled-binary evidence: `bun build --compile` created temporary executables named `lato` and `opencode`; each executed in an isolated working directory and reported its own filename identity (`lato`, `opencode`). The same test runs on each CI platform and uses `.exe` naming on Windows. This is a test-only compile, not a production packaging change.

## 7. Preference Paths

| Platform | Lato path                                               | OpenCode path                                               | Evidence                  |
| -------- | ------------------------------------------------------- | ----------------------------------------------------------- | ------------------------- |
| Linux    | `${XDG_STATE_HOME:-$HOME/.local/state}/lato/kv.json`    | `${XDG_STATE_HOME:-$HOME/.local/state}/opencode/kv.json`    | Native synthetic XDG root |
| Windows  | `%XDG_STATE_HOME%` or `%USERPROFILE%\.local\state\lato` | `%XDG_STATE_HOME%` or `%USERPROFILE%\.local\state\opencode` | Pending native execution  |
| macOS    | `${XDG_STATE_HOME:-$HOME/.local/state}/lato`            | `${XDG_STATE_HOME:-$HOME/.local/state}/opencode`            | Pending native execution  |

The Linux native test recorded:

- State root: `<temp>/state/opencode`.
- Lato: `<temp>/state/lato`.
- OpenCode: `<temp>/state/opencode`.

The test child process received isolated `HOME`, `USERPROFILE`, `XDG_*`, `TMPDIR`, `TEMP`, and `TMP` values so no real user preference directory was read or created.

## 8. Preference Persistence

Linux native synthetic results:

- Lato creates its own state directory and `kv.json`.
- OpenCode creates its own state directory and `kv.json`.
- Writing Lato preferences does not change OpenCode preferences.
- Writing OpenCode preferences does not change Lato preferences.
- `theme`, `theme_mode`, and `theme_mode_lock` round-trip through the same JSON shape used by `useKV()`.
- Missing preference files reject `readJson`, which `useKV()` turns into an in-memory default state.
- Missing parent directories are created by `writeJsonAtomic`.

The tests exercise the real `packages/tui/src/util/persistence.ts` functions and the real resolved state paths. They do not duplicate the storage implementation in test code.

Full `KVProvider`/theme context restart behavior was not automated because the context requires the TUI renderer and async lock initialization; the persistence layer and resolved paths it uses are covered directly.

## 9. Filesystem Failure Behaviour

| Scenario                         | Linux native               | Windows                  | macOS                    |
| -------------------------------- | -------------------------- | ------------------------ | ------------------------ |
| Unreadable preference file       | Pass (non-root)            | Skipped (ACL semantics)  | Pending CI               |
| Read-only state directory        | Pass (non-root)            | Skipped (ACL semantics)  | Pending CI               |
| Atomic replacement over existing | Pass                       | Pending native execution | Pending native execution |
| Failed write preserves old file  | Pass                       | Pending native execution | Pending native execution |
| Temporary-file cleanup           | Pass (no `.tmp` leftovers) | Pending native execution | Pending native execution |
| Concurrent writes (20 writers)   | Pass (valid JSON)          | Pending native execution | Pending native execution |

`useKV()` continues to log read/write errors and keep in-memory state on failure. The tests assert the throwing persistence behavior; the logging itself is verified by code inspection, not by a UI-level test.

The read-only-directory test simulates failure before replacement and confirms the previous valid file remains intact with no leftover temporary file.

## 10. TUI Entry Points

Wiring inspected:

- `packages/opencode/src/cli/cmd/tui.ts:295` passes `cliPreferenceState(cliScriptName(), Global.Path.state)`.
- `packages/opencode/src/cli/cmd/attach.ts:139` passes the same expression.
- `packages/tui/src/app.tsx:244` uses `input.state ?? global.state`.
- `packages/tui/src/context/kv.tsx` persists `${TuiPaths.state}/kv.json`.

The exact composition was executed natively in the state test for both identities. Full normal TUI startup and attach startup were not automated because they require a server process and an interactive terminal; Phase 2.75 remains the only interactive smoke evidence. No interactive test framework was added.

## 11. Provider Compatibility

`opencode` and `opencode-go` remain present and unchanged. No provider registration, endpoint, authentication, model discovery, or credential logic was modified.

Provider regression: 103 pass, 0 fail with the repository timeout. No live authentication or credential access occurred.

## 12. Files Changed

Created:

- `.github/workflows/lato-native-validation.yml`
- `packages/opencode/test/cli/native-path-probe.ts`
- `packages/opencode/test/cli/native-state.test.ts`
- `LATO_NATIVE_CROSS_PLATFORM_VALIDATION.md`

Modified:

- `packages/tui/test/prompt/persistence.test.ts`
- `LATO_TRANSFORMATION_PLAN.md`
- `LATO_TRANSFORMATION_LOG.md`
- `LATO_COMPATIBILITY_MATRIX.md`
- `LATO_KNOWN_ISSUES.md`

No production source or storage architecture was changed.

## 13. Exact Commands And Results

Linux native:

- `bun test --timeout 60000 test/cli/identity.test.ts test/cli/native-state.test.ts` in `packages/opencode`: 7 pass, 0 fail, 38 expect calls.
- `bun test --timeout 30000 test/prompt/persistence.test.ts` in `packages/tui`: 7 pass, 0 fail, 17 expect calls.
- `bun test --timeout 30000 test/runtime.test.tsx` in `packages/tui`: 2 pass, 0 fail, 6 expect calls.
- `bun test --timeout 30000 test/provider/provider.test.ts` in `packages/opencode`: 103 pass, 0 fail, 248 expect calls.
- `bunx prettier --check` on changed JS/TS/YAML files: pass.
- Workflow YAML parse: pass.
- `git diff --check`: clean.

Windows and macOS: no command executed because no native runner was available.

## 14. Git Status

- Branch: `lato-development`.
- Working tree before Phase 3.9: 214 status entries; 19 untracked.
- Phase 3.9 added four files and modified five existing files (including documentation).
- No commits, pushes, resets, cleans, stashes, branch switches, or remote changes were performed.
- `git diff --check`: clean.

## 15. Safety Report

No real user authentication files, databases, sessions, preference files, or home-directory preference state were accessed or modified.

All persistence tests used synthetic directories under the system temporary directory. The native state probe redirected all writable OpenCode path roots to an isolated temporary environment before importing the global path module. Test cleanup removed only test-created roots.

No packages were published, no services deployed, and no secrets were used.

## 16. Remaining Limitations

- The focused CI workflow has not been executed because commits and pushes are prohibited and no native Windows/macOS host was available.
- Native Windows identity, path, ACL, and rename-over-existing behavior remain unverified.
- Native macOS identity, path, and filesystem behavior remain unverified.
- Compiled executable identity is covered by a temporary Bun compile; packaged installers, desktop-bundled CLI wrappers, and macOS bundle/launcher invocation remain untested.
- npm-style Windows `.cmd` shim identity remains a known limitation.
- Full `KVProvider`/theme restart through an interactive TUI was not automated.
- Failure logging through `useKV()` was verified by inspection, not by a UI-level assertion.
- Full typecheck, production build, packaging, and E2E were not run.
- Provider tests used mocked/recorded infrastructure and no live authentication.

## 17. Recommended Next Phase

Execute `lato-native-validation` on a push-capable branch or fork and record the actual `ubuntu-latest`, `windows-latest`, and `macos-latest` results. Fix only failures demonstrated by those native runs. After native CI is green, validate compiled Lato binaries and packaged CLI/TUI invocation on each platform before starting any browser/desktop preference separation.
