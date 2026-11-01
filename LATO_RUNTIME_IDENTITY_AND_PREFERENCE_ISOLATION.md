# Lato Runtime Identity And Preference Isolation

Status: Phase 3.6 implementation, complete with limitations

## 1. Root Cause

The shared theme state was caused by TUI key-value persistence, not by provider identity or the agent engine.

The previous flow was:

1. `packages/opencode/src/cli/cmd/tui.ts` and `attach.ts` invoked the TUI without a product-specific preference state path.
2. `packages/opencode/src/cli/tui/layer.ts` provided `Global.node`.
3. `packages/tui/src/app.tsx` passed `global.state` into `TuiPathsProvider`.
4. `Global.Path.state` was derived from the compatibility application name `opencode` in `packages/core/src/global.ts`.
5. `packages/tui/src/context/kv.tsx` persisted preferences to `${TuiPaths.state}/kv.json`.
6. `packages/tui/src/context/theme.tsx` read and wrote `theme`, `theme_mode`, and `theme_mode_lock` through that KV store.

Therefore, `lato` and `opencode` both used the same OpenCode state file for TUI theme selection.

## 2. Architecture Change

The engine remains shared. Only TUI product preference state is separated.

`packages/opencode/src/cli/identity.ts` now provides:

- `cliScriptName()` for the invocation-aware display identity.
- `cliPreferenceState(identity, compatibilityState)` for product-specific TUI preference state.

The CLI TUI and attach paths pass an explicit state path into `TuiInput`:

- `lato`: sibling state namespace derived from the compatibility state path.
- `opencode`: existing compatibility state path unchanged.

`packages/tui/src/app.tsx` uses the explicit state path when provided and retains the existing global fallback for other callers.

`packages/tui/src/context/kv.tsx` now relies only on `TuiPaths.state`, so the persisted `kv.json` file follows the caller’s runtime identity.

## 3. Preference Paths

For the current Linux/XDG-compatible layout:

| Runtime    | Preference state path                                |
| ---------- | ---------------------------------------------------- |
| `opencode` | `${XDG_STATE_HOME:-~/.local/state}/opencode/kv.json` |
| `lato`     | `${XDG_STATE_HOME:-~/.local/state}/lato/kv.json`     |

The Lato path is derived from the existing compatibility state path rather than changing `Global.Path` or any production storage resolver.

This phase isolates TUI product preferences only. It does not isolate:

- `opencode.json` or `opencode.jsonc`.
- `.opencode` theme definitions.
- Provider credentials.
- Sessions or databases.
- Agent/tool/permission configuration.
- Plugin or skill discovery.
- Desktop userData.

An explicit `theme` value in shared OpenCode-compatible configuration remains shared by design. The interactive TUI selection persisted in `kv.json` is isolated.

## 4. Read And Write Flow

### Read

- CLI determines invocation identity from the executable/script name.
- CLI derives the preference state path.
- TUI receives the path through `TuiInput.state`.
- `TuiPathsProvider` exposes the path.
- `useKV()` reads `{state}/kv.json`.
- `useTheme()` reads `theme`, `theme_mode`, and `theme_mode_lock` from that KV store.

### Write

- Theme selection calls `theme.set()`.
- Theme mode lock/unlock calls `kv.set()`.
- `useKV()` writes atomically under the runtime-specific state path using the existing flock mechanism.

## 5. Compatibility Guarantees

- `opencode` continues using its existing state namespace.
- `lato` does not import or copy OpenCode KV preferences.
- Existing OpenCode config files and environment variables remain unchanged.
- Existing provider IDs `opencode` and `opencode-go` remain unchanged.
- Provider authentication and model discovery are untouched.
- The shared agent engine, tools, permissions, MCP, ACP, sessions, and databases are untouched.
- Non-TUI callers that do not provide `TuiInput.state` retain the previous `Global.Path.state` fallback.

## 6. Tests

Focused tests cover:

- `lato` and `opencode` runtime display identity.
- Lato/OpenCode preference state path separation.
- Synthetic Lato preference file isolation.
- PR executable behavior.
- Existing configuration behavior.
- Provider preservation.

Commands and results:

- `bun test test/cli/identity.test.ts`: 5 pass, 0 fail, 10 expect calls.
- `bun test test/cli/pr.test.ts`: 5 pass, 0 fail.
- `bun test test/config/config.test.ts`: 108 pass, 0 fail.
- `bun test test/provider/provider.test.ts`: 103 pass, 0 fail.
- `bunx prettier --check` on Phase 3.6 files: pass.
- `git diff --check`: pass.

No test accessed real user state.

## 7. Limitations

- Native Windows and macOS preference path behavior was not executed.
- A full TUI render test was not run; path wiring and synthetic persistence are covered at the identity boundary.
- Existing configuration-level theme values remain shared for compatibility.
- Desktop preference storage remains shared/undecided and is not changed in this phase.
- No migration or import of existing OpenCode preferences occurs.

## 8. Deferred Work

- Decide whether browser and desktop preferences need separate Lato namespaces.
- Define any Lato-native configuration or preference file only after ownership and precedence approval.
- Design opt-in import of selected OpenCode preferences with preview, backup, conflict handling, and rollback.
- Verify native platform paths and packaged desktop behavior in platform CI.
