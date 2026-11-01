# Lato TUI Preference Reliability

Status: Phase 3.8 implementation validation complete; native platform validation pending

## 1. Existing Preference Architecture

The TUI preference path is supplied at the runtime boundary:

- `packages/opencode/src/cli/identity.ts` determines executable identity and preference namespace.
- `packages/opencode/src/cli/cmd/tui.ts` and `attach.ts` pass `TuiInput.state`.
- `packages/tui/src/app.tsx` provides that value through `TuiPathsProvider`.
- `packages/tui/src/context/kv.tsx` persists `${TuiPaths.state}/kv.json`.
- `packages/tui/src/context/theme.tsx` stores `theme`, `theme_mode`, and `theme_mode_lock`.

The Phase 3.6 separation remains intact.

## 2. Platform Path Behavior

### Linux

The current compatibility state path is derived from `xdg-basedir` through `Global.Path.state`.

Expected paths:

- Lato: `${XDG_STATE_HOME:-~/.local/state}/lato/kv.json`
- OpenCode: `${XDG_STATE_HOME:-~/.local/state}/opencode/kv.json`

The Lato path is derived from the resolved compatibility state path, so an explicit XDG state root is preserved.

### Windows

Native Windows was not available. Platform-independent tests now cover Windows-style executable and path separators:

- `opencode.exe` identifies as `opencode`.
- A Windows-style compatibility state path produces a sibling `lato` path.

The absolute Windows state root remains delegated to the existing `xdg-basedir`/runtime path infrastructure and requires native Windows verification.

### macOS

Native macOS was not available. POSIX path behavior and executable identity are covered, but packaged bundle invocation and native Application Support behavior remain unverified.

## 3. Preference Failure Handling

Current `useKV()` behavior:

- Missing file: `readJson` fails, the error is logged, and the in-memory store starts with defaults.
- Malformed JSON: same safe in-memory fallback; the malformed source is not rewritten by the loader.
- Empty or unexpected JSON: handled by the existing store/decode behavior; no cross-runtime file is touched.
- Write failure: the in-memory value updates, the asynchronous write logs the error, and the other runtime’s file is not involved.
- Missing parent directory: `writeJsonAtomic` creates the parent directory.
- Atomic writes: data is written to a unique same-directory temporary file and renamed into place; failed writes clean up the temporary file.

Read-only filesystem and permission-denied behavior is platform-dependent and was not natively exercised here.

## 4. Atomic And Concurrent Writes

`packages/tui/src/util/persistence.ts` uses a unique temporary path followed by rename. `packages/tui/src/context/kv.tsx` additionally serializes same-process writes and uses the existing `Flock` lock for cross-process access.

Synthetic concurrent writes produced valid JSON in the focused test. The resulting value is last-writer-wins; arbitrary preference merges are not promised.

The test does not claim identical rename semantics on Windows and Linux. Native Windows validation remains required.

## 5. Theme Persistence

Interactive TUI theme state is isolated:

- Lato writes to its Lato KV namespace.
- OpenCode writes to its OpenCode KV namespace.
- `theme_mode` and `theme_mode_lock` follow the same separation.
- No existing OpenCode preference is imported automatically.

Explicit `config.theme` remains shared when supplied through OpenCode-compatible configuration. It has precedence over the KV-selected theme and was intentionally not changed in this phase.

## 6. Desktop And Browser Scope

- Browser preference isolation: out of scope; browser theme keys remain compatibility-named local-storage keys.
- Desktop preference isolation: out of scope; Electron `userData` and named stores remain unchanged.
- Desktop packaging: out of scope.
- No browser or desktop source was deleted or migrated.

## 7. Provider Regression

The required `opencode` and `opencode-go` provider integrations remain unchanged. Provider registration, authentication, model discovery, endpoint behavior, and credentials were not modified.

The provider suite was previously verified during Phase 3.6; no provider source changed in Phase 3.8.

## 8. Tests

- `bun test test/cli/identity.test.ts` in `packages/opencode`: 5 pass, 0 fail, 12 expect calls.
- `bun test test/prompt/persistence.test.ts` in `packages/tui`: 3 pass, 0 fail, 8 expect calls.
- `bun test test/runtime.test.tsx` in `packages/tui`: 2 pass, 0 fail, 6 expect calls.
- `bun test test/config/config.test.ts` in `packages/opencode`: 108 pass, 0 fail, 184 expect calls.
- `bun test test/provider/provider.test.ts` was previously run in Phase 3.6; no provider code changed in this phase.
- Prettier checks passed for changed files and documents.
- `git diff --check` passed.

## 9. Remaining Limitations

- Native Windows verification is pending.
- Native macOS verification is pending.
- Packaged desktop invocation is pending.
- Permission-denied/read-only filesystem behavior is not natively verified.
- Browser and desktop preference namespaces remain outside this phase.
- No preference migration or import exists.
- Full typecheck, production build, E2E, and packaging remain unverified.

## 10. Recommended Follow-Up

Run the focused identity and persistence tests in Linux, Windows, and macOS CI. After native filesystem behavior is confirmed, address browser/desktop preference namespaces in a separate approved phase rather than expanding TUI storage scope here.
