# Lato Cross-Platform Preference Validation

Status: Phase 3.7 implementation validation complete; native platform validation pending

## 1. Phase 3.6 Reinspection

The Phase 3.6 implementation is present and matches the previous report:

- `packages/opencode/src/cli/identity.ts` derives display identity and preference state.
- `packages/opencode/src/cli/cmd/tui.ts` and `attach.ts` pass an explicit state path.
- `packages/tui/src/app.tsx` uses `TuiInput.state` when supplied.
- `packages/tui/src/context/kv.tsx` persists to `${TuiPaths.state}/kv.json`.
- `packages/tui/src/context/theme.tsx` stores `theme`, `theme_mode`, and `theme_mode_lock` in that KV file.

The shared-state root cause remains correctly identified: both aliases previously used `Global.Path.state`, which is derived from the OpenCode compatibility namespace.

## 2. Linux Test Environment

Validation was executed on the current Arch Linux development machine using Bun and temporary directories only.

Verified synthetic path behavior:

- Lato state: `/synthetic-parent/lato/kv.json`.
- OpenCode state: `/synthetic-parent/opencode/kv.json`.
- Custom XDG state roots are supported because the Lato path is derived from the resolved compatibility state path.

No real home directory preference file was read or modified.

## 3. Runtime Identity

`cliScriptName()` behavior was verified for:

- Bun/source Lato invocation: `lato`.
- Compiled Lato invocation: `lato`.
- Legacy `/path/opencode`: `opencode`.
- Windows-style `opencode.exe` path: `opencode`.
- Unrelated runtime/script: `lato` fallback.

`cliPreferenceState()` behavior was verified for:

- `lato` -> sibling `lato` state directory.
- `opencode` -> unchanged compatibility state directory.

## 4. Preference Path Resolution

The interactive TUI theme preference path is:

| Runtime  | Preference file                              |
| -------- | -------------------------------------------- |
| Lato     | `${dirname(Global.Path.state)}/lato/kv.json` |
| OpenCode | `${Global.Path.state}/kv.json`               |

The implementation does not copy or import the other runtime’s preference file.

The TUI and attach entry points both pass the product-specific path. Other `TuiInput` callers retain the previous fallback to `Global.Path.state`.

## 5. Linux Validation

Verified through focused tests:

- Lato/OpenCode identity resolution.
- Windows-style executable suffix handling.
- Lato/OpenCode preference path separation.
- Synthetic Lato preference persistence without an OpenCode preference file.
- Existing configuration discovery and precedence.
- Existing TUI configuration behavior.
- Existing V2 compatibility behavior.
- Provider registration and model behavior.
- TUI runtime path provider tests.

No full interactive TUI restart was automated. User-level local smoke validation from Phase 2.75 remains the evidence for actual TUI/browser operation.

## 6. Windows Validation

Native Windows was not available and is **not claimed as natively verified**.

Automated platform-independent coverage verifies Windows-style `opencode.exe` path normalization. The current path derivation uses the already-resolved compatibility state path, so it does not manually concatenate Linux separators or construct Windows absolute roots.

Still required on Windows:

- Actual `lato.exe` and `opencode.exe` wrapper invocation.
- `%APPDATA%`/`%LOCALAPPDATA%` state resolution.
- Packaged desktop CLI invocation.
- Read-only and malformed preference behavior under Windows ACLs.

## 7. macOS Validation

Native macOS was not available and is **not claimed as natively verified**.

The identity helper handles executable basenames after normalizing backslash separators and `.exe` suffixes, but packaged macOS bundle invocation was not executed.

Still required on macOS:

- Application bundle executable identity.
- Symlink and launcher invocation.
- Electron desktop userData behavior.
- Packaged TUI/CLI preference persistence.

## 8. Preference Failure Handling

### Verified

- Missing synthetic preference files use the existing default KV behavior.
- Lato and OpenCode synthetic files are separate.
- Cleanup is limited to test-created temporary roots.

### Existing behavior not changed

`useKV()` currently catches read/write failures, logs an error, and continues with in-memory state. The Phase 3.6 scope did not change this behavior.

### Not independently exercised in Phase 3.7

- Malformed `kv.json` recovery.
- Permission-denied preference files.
- Read-only state directories.
- Concurrent writes from two same-identity TUI processes.

These require a dedicated TUI persistence test because the current context is UI-runtime coupled.

## 9. Shared Configuration Theme Behavior

The TUI theme selection has two sources:

- `config.theme`, loaded from shared OpenCode-compatible configuration.
- `kv.json` interactive preference, now runtime-isolated.

`packages/tui/src/context/theme.tsx` gives `config.theme` precedence over the KV-selected theme:

```ts
const active = config.theme ?? kv.get("theme", "opencode")
```

Therefore:

- Interactive Lato theme selection is isolated from OpenCode.
- Interactive OpenCode theme selection is isolated from Lato.
- An explicit shared `theme` configuration value remains shared by design.
- Changing the interactive theme does not write shared configuration.

Configuration precedence was not changed in this phase.

## 10. Desktop And Browser Findings

### Desktop

Status: **Not yet separated**.

Desktop settings use Electron `app.getPath("userData")` and named `electron-store` files. Desktop preference namespace isolation was not changed or verified in this phase.

### Browser

Status: **Shared by browser origin/local storage**.

Browser theme keys remain compatibility-named local-storage keys such as `opencode-theme-id` and `opencode-color-scheme` in `packages/ui/src/theme/context.tsx`. Browser storage is separate from the TUI KV file but is not yet Lato/OpenCode origin-isolated by product identity.

No browser storage migration or key rename was performed.

## 11. Provider Regression

The required `opencode` and `opencode-go` integrations remain in the provider catalog and provider tests. No provider code or authentication behavior was changed.

The full provider test suite had one transient five-second timeout during a sequential run while reporting 102 other tests passed. The timed-out test was rerun directly and passed. This is recorded as a test-environment timing limitation, not as a provider failure.

## 12. Exact Verification Commands

- `bun test test/cli/identity.test.ts` in `packages/opencode`: 5 pass, 0 fail, 10 expect calls.
- `bun test test/config/config.test.ts` in `packages/opencode`: 108 pass, 0 fail, 184 expect calls.
- `bun test test/provider/provider.test.ts` in `packages/opencode`: 102 pass, 1 transient timeout.
- `bun test test/provider/provider.test.ts --test-name-pattern 'opencode loader keeps paid models when auth exists'` in `packages/opencode`: 1 pass, 0 fail.
- `bun test test/runtime.test.tsx` in `packages/tui`: 2 pass, 0 fail, 6 expect calls.
- `bunx prettier --check` on Phase 3.7 files: pass.
- `git diff --check`: clean.

## 13. Known Limitations

- Native Windows validation was not performed.
- Native macOS validation was not performed.
- Packaged desktop runtime validation was not performed.
- Browser theme storage remains compatibility-named and not product-isolated.
- Desktop userData preferences remain shared/undecided.
- Malformed, unreadable, read-only, and concurrent `kv.json` scenarios were not independently exercised.
- No preference migration or import was implemented.
- No full typecheck, production build, E2E suite, or desktop packaging was run.

## 14. Recommended Next Phase

Create a focused preference failure-path test suite using a synthetic TUI path provider. Cover malformed JSON, unreadable files, read-only directories, atomic-write failures, and same-identity concurrent writes without changing production storage namespaces.
