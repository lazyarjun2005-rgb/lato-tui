# Lato Phase 4.2 Report

## Status

Phase 4.2 implementation is complete for the audited configuration paths,
loaders, TUI behavior, core V2 discovery, and focused writers covered by the
current test suites.

The implementation preserves uncommitted Phase 4.1 work. No commit or push was
performed.

## Implemented

- Added platform-aware Lato global configuration paths.
- Added legacy OpenCode global path exposure without moving OpenCode data paths.
- Added `LATO_CONFIG`, `LATO_CONFIG_DIR`, and `LATO_CONFIG_CONTENT`.
- Converted legacy config flags to access-time getters for test and runtime env
  consistency.
- Added Lato and legacy global file loading.
- Added Lato project files and `.lato` directory discovery.
- Kept `OPENCODE_CONFIG_DIR` as a compatibility directory.
- Added Lato explicit-file and inline-content precedence.
- Updated V2 configuration entries for Lato files, directories, legacy global
  compatibility, and custom compatibility directories.
- Removed V1 read-time `$schema` rewriting.
- Removed destructive extensionless TOML migration.
- Replaced TUI migration writes with read-only legacy TUI projection.
- Updated global/project config, MCP, plugin, agent, theme, uninstall, and path
  consumers to use active Lato paths or Lato-native defaults.
- Preserved existing OpenCode configuration and provider compatibility.

## Precedence

Remote, legacy global, Lato global, legacy explicit file, Lato explicit file,
legacy project files, Lato project files, `.opencode`, `.lato`, legacy custom
directory, legacy inline content, Lato inline content, account, and managed/MDM
are applied in that order.

V1 retains deep object merging, instruction concatenation, plugin-origin
deduplication, and existing post-processing. V2 retains ordered entries and
last-defined-field behavior.

## Focused Verification

Passed sequentially:

- `packages/core`: `bun test test/config/config.test.ts` — 15 passed.
- `packages/core`: `bun test test/global.test.ts` — 3 passed.
- `packages/core`: `bun run typecheck` — passed.
- `packages/opencode`: `bun test test/config/config.test.ts` — 112 passed.
- `packages/opencode`: `bun test test/config/tui.test.ts` — 36 passed.
- `packages/opencode`: `bun test test/cli/mcp-add.test.ts` — 2 passed.
- `packages/opencode`: `bun test test/plugin/install-concurrency.test.ts` — 3 passed.
- `packages/opencode`: `bun test test/cli/tui/plugin-loader.test.ts` — 15 passed.
- `git diff --check` — passed.
- Prettier checks for changed core configuration files — passed.

The `packages/opencode` typecheck was attempted but exceeded the available
resource window and was terminated without diagnostics. Full workspace builds,
lint, E2E, and full test suites were intentionally not run.

## Remaining Risks

- Native macOS and Windows runtime path validation still depends on CI because
  this implementation environment is Linux.
- The V1 and V2 engines intentionally retain different merge models.
- Existing external users relying on automatic migration files will now receive
  read-only compatibility instead of generated backups/files.

## Scope Boundary

Phase 4.3 was not started. Authentication, database, sessions, cache, state,
repositories, provider IDs, and managed OpenCode ownership remain outside this
phase.
