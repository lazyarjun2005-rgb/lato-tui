# Lato Transformation Log

## 2026-10-31

### Phase 0 - Baseline verified

- Repository was clean at the start of the transformation.
- HEAD: `810c0eba1a7348036f8bdf61e6632d0c36c6876c`
- Tag: `v1.19.5`
- Remote: `https://github.com/anomalyco/opencode.git`
- History: shallow clone, 1 commit.
- Node: `v22.23.2`
- Bun: not installed initially.
- Disk: 18 GB available.
- No unexpected tracked working-tree changes.
- Created branch `lato-development`.
- Created local annotated baseline tag `lato-baseline-v1.19.5`.
- Created transformation tracking documents.

### Environment note

- Bun `1.4.4` must be installed user-locally before dependency installation.
- No secrets or environment values were recorded.

## 2026-10-31 - Recovery after forced shutdown

- Machine restarted; no source files had been modified before shutdown.
- Branch `lato-development`, baseline tag `lato-baseline-v1.19.5`, and baseline commit verified.
- The four Lato tracking documents were present and readable.
- No Bun/TypeScript/build processes remained active.
- `node_modules` was present at approximately 2.5 GB; lockfile and package manifest were unchanged.
- `bun install --frozen-lockfile --dry-run` completed successfully with exit code 0, confirming dependency resolution is complete.
- Resource state before checks: 7.5 GiB RAM, 3.9 GiB available, 16 GB disk free, no swap.
- The previous parallel typecheck attempt was discarded as the likely cause of resource pressure. All future heavy checks will run sequentially.

### Baseline verification results

- `packages/core` typecheck (`bun run typecheck`): PASS, exit code 0.
- `packages/opencode` typecheck: not yet run after recovery.
- `packages/tui` typecheck: not yet run after recovery.

## Pending

- Sequential baseline verification for `packages/opencode` and `packages/tui`.
- Identity and provider-separation implementation.

## 2026-10-31 - Phase 3 and Phase 5 implementation

### User-facing identity

- CLI exposes `lato` as an additional bin while retaining legacy `opencode`; help, command descriptions, skill name, mDNS default, server banners, resume hints, and upgrade stubs use Lato.
- CLI/TUI wordmarks and the compact splash badge were replaced with Lato marks.
- TUI window titles, crash screen, and session presentation use Lato.
- App window title, manifest, notification icon, English desktop strings, and provider/settings dialogs use Lato or neutral wording.
- Desktop product names are Lato Dev, Lato Beta, and Lato; window title is Lato.
- Vector Lato marks and wordmarks replaced the OpenCode glyphs in shared UI logo components.
- The upstream crash-report issue URL and the upstream error-page feedback button were removed rather than replaced with invented Lato endpoints.

### Go promotion and Zen separation

- Removed the Go retry action, Go upsell listener, animated Go backgrounds, and the usage-exceeded dialog component/call sites.
- Retry messages no longer include Go upsell text, actions, or links.
- Removed Zen/Go recommended tags, taglines, and promotional panels from TUI and app provider surfaces.
- Removed automatic OpenCode/Go ordering from CLI provider and model listing.
- Kept the `opencode` and `opencode-go` provider backends and auth/config compatibility; only promotion and prioritization were removed.
- Kept Zen as an optional provider. No Lato domain or replacement console was invented.

### Update-feed safety

- `lato upgrade` now reports that self-upgrade is unavailable instead of querying or installing OpenCode releases.
- TUI update checks and applies are disabled; no upstream release feed is contacted.
- The global server upgrade endpoint rejects requests with `Updates are not available in this Lato build`.
- Electron auto-update remains gated behind `LATO_UPDATER_ENABLED=1`, packaged builds, and non-dev channels; GitHub publish metadata was removed from beta/prod builder config.

### Verification

- `bun src/index.ts --help`: Lato wordmark, `lato` commands, and no upstream product name in command descriptions.
- `bun test test/session/retry.test.ts --timeout 30000`: 60 pass, 0 fail, 75 expect() calls.
- `bun test test/server/httpapi-global.test.ts --timeout 30000`: 4 pass, 0 fail, 5 expect() calls.
- `git diff --check`: clean.
- Targeted oxlint over changed TypeScript files: 0 errors; warnings are existing project warnings.
- Full workspace typecheck and desktop/web builds were not run in this phase.

### Not done

- No commit or push was made.
- Existing OpenCode data paths, auth files, config names, package scopes, provider IDs, protocol scheme, and desktop app IDs remain for compatibility.
- English is the only locale updated so far; upstream web docs, README, raster icons, GitHub integration, Console authentication, WSL onboarding labels, and desktop artifact identifiers remain.

## 2026-10-31 - Identity cleanup follow-up

- Rebranded the bundled model system prompts and removed upstream feedback/documentation URLs from them.
- Rebranded remaining CLI/TUI hints, error messages, permission prompts, notification titles, update-dialog text, ACP labels, MCP OAuth client name, and provider guidance.
- Removed upstream promotional TUI tips (Go/Zen/docker/GitHub actions) while keeping compatibility paths such as `opencode.json`, `.opencode`, and `OPENCODE_*`.
- Removed upstream community and feedback links from the desktop Help menu; documentation intentionally remains the upstream docs URL until a Lato docs destination exists.
- Gated app release-note fetching behind optional `VITE_LATO_CHANGELOG_URL`; no upstream changelog is fetched by default.
- Desktop notifications now use the locally served favicon instead of an upstream URL.
- Desktop renderer title and English updater/CLI-install strings now use Lato.
- Updated desktop AppStream metadata and the legacy Linux launcher to Lato naming, and removed upstream URLs and publisher metadata; a real Lato publisher identity is still required before packaging.
- `bun test test/component/dialog-update.test.ts --timeout 30000`: 7 pass, 0 fail, 18 expect() calls.
- `bun test electron-builder.config.test.ts --timeout 30000`: 7 pass, 0 fail, 28 expect() calls.
- `lato upgrade` smoke check exits 0 and reports that self-upgrade is unavailable.
- `bun run generate` in `packages/client` completed without changing generated files.

## 2026-10-31 - Phase 1 and Phase 2 continuation

### WSL installer safety

- Removed the desktop WSL automated download of the upstream installer. `installWslOpencode` now returns a safe unavailable result without network access or package installation.
- WSL onboarding and server settings now offer `Open terminal` for missing or mismatched CLIs instead of presenting automatic installation as available.
- Existing detection and execution of a user-managed `~/.opencode/bin/opencode` remain intact.
- English WSL onboarding, WSL status, and desktop-native WSL messages now use Lato or neutral CLI wording.
- Added a focused regression test that asserts the installer stub does not run the upstream installer.

### Approved Lato assets

- Preserved the supplied source files unchanged in `~/Downloads`.
- Added cropped display assets at `packages/ui/src/assets/brand/icon-lato.png` (164x164 RGBA) and `packages/ui/src/assets/brand/logo-lato.png` (359x101 RGBA).
- The original icon is 181x181 and the original wordmark is 450x277. Generated 256px and larger icons are high-quality resizes, not native high-resolution artwork.

### Logo, splash, and wordmark

- Replaced the provisional inline SVG `Mark`, `Splash`, and `Logo` implementations with the approved Lato PNG assets through the existing SolidJS/Vite asset pipeline.
- Updated logo sizing so the square icon is not distorted; splash call sites now use square dimensions.
- Replaced the provisional V2 watermark shape with a current-color mask derived from the approved wordmark asset, preserving the previous fade and visual weight.
- Updated the shared logo story metadata.
- Added the brand asset directory to the published UI package file list.

### Favicon and desktop icons

- Replaced both favicon PNG sets, both ICO files, the Apple touch icon, and both web-app manifest PNGs with Lato artwork derived from the approved icon.
- Confirmed the app public symlinks resolve to the Lato favicon resources and the manifest still points to the existing paths.
- Removed SVG favicon links from the app and desktop renderer HTML; primary browser branding now uses the PNG/ICO pipeline. Upstream web/docs/console SVG favicon assets remain deferred.
- Replaced desktop icon PNG, ICO, and ICNS resources for dev, beta, and prod from the approved icon; added `packages/desktop/app-icon.png` as the 1024x1024 source master.
- Verified `bun scripts/copy-icons.ts prod` copies identical icon resources into the ignored `resources/icons` directory used by development packaging.
- Updated the desktop icon README to document the actual source and resolution limitation.

### Other cleanup

- Changed the special OpenCode project avatar source to the local Lato favicon instead of the upstream favicon URL.
- Removed the stale usage-exceeded dialog reference from `packages/app/V1_API_MIGRATION.md`.

### Verification

- `bun test src/wsl/settings-model.test.ts` in `packages/app`: 10 pass, 0 fail.
- `bun test src/i18n/desktop-native.test.ts src/i18n/parity.test.ts` in `packages/app`: 13 pass, 0 fail, 1434 expect() calls.
- `bun test src/main/wsl/servers.test.ts` in `packages/desktop`: 13 pass, 0 fail.
- `bun test electron-builder.config.test.ts` in `packages/desktop`: 7 pass, 0 fail.
- `bun run typecheck` in `packages/ui`, `packages/app`, and `packages/desktop`: pass.
- `bun src/index.ts --help` in `packages/opencode`: Lato banner and `lato` command names; no automatic installer was attempted.
- Asset validation: favicon dimensions, RGBA transparency, ICO frame sets, ICNS containers, desktop PNG dimensions, and app public symlinks passed.
- `bunx prettier --write` over changed source files: pass.
- No full workspace typecheck, web build, desktop production build, or E2E run was performed.

### Not done

- No commit, push, or publish.
- Help-text snapshots and upstream installation tests still encode OpenCode-era behavior.
- Desktop packaging, macOS icon appearance, and actual application launch have not been verified.
- Non-English locales, upstream web/docs/console imagery, social cards, and distribution identity remain.

## 2026-10-31 - Phase 2.5 safety and upstream isolation

### PR executable compatibility

- Added `resolveCliCommand` in `packages/opencode/src/cli/cmd/pr.ts`.
- The PR command now relaunches the currently invoked script or compiled executable, prefers an explicitly available `lato` executable, and falls back to a verified `opencode` executable.
- The relaunch receives no original `pr` arguments, preventing recursive PR invocation.
- If no safe executable can be found, the command returns a clear error instead of blindly spawning `lato`.
- Added focused resolver tests for current scripts, compiled executables, Lato preference, legacy fallback, and no executable availability.

### Uninstall safety

- `lato uninstall` is disabled until independent Lato installation ownership exists.
- The command now returns before installation detection, filesystem inspection, shell cleanup, package-manager commands, or data deletion.
- Existing OpenCode installations, `.opencode`, configuration, sessions, authentication, databases, and shell files are preserved.
- The legacy uninstall implementation remains in place for future distribution work but its installation module is loaded dynamically behind the unavailable guard.
- Added a handler-level safety test proving the installation method is not inspected and no destructive path is entered.

### Hosted UI isolation

- Removed the automatic `https://app.opencode.ai` UI proxy from `packages/opencode/src/server/shared/ui.ts`.
- Embedded UI serving remains unchanged when generated assets are present.
- Missing or disabled embedded UI now returns HTTP 503 with a local Lato-specific message.
- API route ordering and authentication middleware remain intact.
- Existing UI tests now assert that disabled or missing embedded assets never invoke the injected HTTP client or upstream URL.

### Legacy installation service

- Removed `Installation.node` from the normal application runtime and HTTP API route graphs.
- The legacy installation module remains available for future controlled distribution work and direct historical installation tests.
- Normal Lato upgrade behavior remains a no-op and now has explicit regression coverage proving it returns without invoking an installer.
- No Lato-facing path invokes the OpenCode installer URLs or package-manager upgrade operations.

### mDNS compatibility

- Restored `opencode.local` as the default mDNS hostname and CLI help value.
- Explicit custom domains, including `lato.local`, remain supported.
- Added coverage for the compatibility default and explicit custom hostname behavior.

### CLI snapshots

- Regenerated the CLI help snapshot after the approved Lato wording and safe uninstall/update command changes.
- Snapshot output now reflects `lato` command names and Lato user-facing descriptions.
- Snapshot test identifiers retain `opencode` naming because they are internal compatibility/test identifiers, not displayed CLI output.

### Verification

- `bun test test/cli/pr.test.ts` in `packages/opencode`: 5 pass, 0 fail.
- `bun test test/cli/uninstall.test.ts` in `packages/opencode`: 2 pass, 0 fail.
- `bun test test/cli/upgrade.test.ts` in `packages/opencode`: 7 pass, 0 fail.
- `bun test test/server/httpapi-ui.test.ts` in `packages/opencode`: 13 pass, 0 fail.
- `bun test test/server/httpapi-mdns.test.ts` in `packages/opencode`: 4 pass, 0 fail.
- `bun test test/server/httpapi-global.test.ts --timeout 30000` in `packages/opencode`: 4 pass, 0 fail.
- `bun test test/installation/installation.test.ts` in `packages/opencode`: 39 pass, 0 fail.
- `bun test test/cli/help/help-snapshots.test.ts` in `packages/opencode`: 1 pass, 0 fail, 34 snapshots.
- `git diff --check`: clean.
- `bun run typecheck` in `packages/opencode` was attempted sequentially but exceeded five minutes and was terminated by SIGTERM without a compiler diagnostic.
- No production build, desktop packaging, E2E run, external network request, commit, or push was performed.

## 2026-10-31 - Phase 2.75 closure and Phase 3.0 contracts

- Closed Phase 2.75 using user-verified local smoke results for CLI/TUI startup, browser UI startup, project discovery and inspection, file reads/writes, Python and shell execution, permissions, session persistence after backend restart, and provider switching.
- Recorded the remaining unverified checks: full typecheck, production build, E2E, desktop packaging, visual regression, and cross-platform release testing.
- Added `LATO_OWNERSHIP_AND_COMPATIBILITY.md` as the authoritative Phase 3.0 contract for product ownership, CLI aliases, configuration, data/storage, protocols, desktop IDs, providers, agents, distribution, updates, and decision gates.
- Added minimal references from the plan, compatibility matrix, and known-issues documents without duplicating the authoritative contract.
- No application source, configuration, dependency, or runtime files were modified for Phase 3.0.

## 2026-10-31 - Phase 3.1 product identity completion

- Reviewed primary browser, desktop, CLI/TUI, localization, favicon, metadata, and user-facing reference surfaces against the Phase 3.0 ownership contract.
- Confirmed existing Lato logo, wordmark, favicon, splash, window title, desktop metadata, and CLI branding integrations remain active.
- Updated the remaining meaningful primary CLI guidance reference from `opencode models` to `lato models` in `packages/opencode/src/cli/error.ts` and its focused test.
- Preserved compatibility-sensitive package scopes, environment variables, config filenames, data paths, provider IDs, protocol schemes, desktop IDs, and legacy executable names.
- Preserved external OpenCode documentation, Zen, Console, GitHub, and provider URLs because no Lato-owned destinations exist; recorded these as deferred ownership work.
- No broad localization rewrite was performed. Non-English updater and product strings remain queued for native-speaker review.
- `bun test test/cli/error.test.ts` in `packages/opencode`: 6 pass, 0 fail, 18 expect() calls.

## 2026-10-31 - Phase 2.75 local validation closure

### User-verified development smoke coverage

- CLI/TUI startup: PASS.
- Browser UI startup: PASS.
- Project discovery and project inspection: PASS.
- File reading: PASS.
- File creation and editing: PASS.
- Python execution: PASS.
- Shell execution: PASS.
- Permission approval dialog: PASS.
- Permission rejection prevented file creation: PASS.
- Permission approval allowed file creation: PASS.
- Session persistence after backend restart: PASS.
- Provider switching: PASS.

### Disposable validation project

- Smoke project: `~/lato-smoke-test`.
- Project configuration used `opencode.json` with `edit: "ask"` permission behavior.
- Session persistence marker: `LATO-SESSION-7319`.
- The smoke project and configuration were used for validation; no repository data migration was performed.

### Phase 2.75 limitations

- Full TypeScript typecheck remains outstanding; the previous sequential `packages/opencode` attempt exceeded five minutes and was terminated without a compiler diagnostic.
- Production builds, E2E tests, desktop packaging, visual regression testing, and cross-platform release testing remain outstanding.
- These smoke results establish local development usability, not release readiness.

## 2026-10-31 - Phase 3.2 CLI and executable independence

- Added `packages/opencode/src/cli/identity.ts` to derive the displayed CLI script name from the invoked executable without changing package names or binary artifacts.
- Updated `packages/opencode/src/index.ts` so `lato` remains the primary help/CLI identity while legacy `opencode` invocations retain the `opencode` script name.
- Added `packages/opencode/test/cli/identity.test.ts` covering Lato source/compiled invocation, legacy OpenCode invocation, and unrelated runtime handling.
- Preserved the existing `packages/opencode/package.json` dual-bin definition and `packages/opencode/bin/opencode` wrapper.
- Preserved desktop `opencode-cli` resource names and `@opencode-ai/cli-*` package references because package and artifact ownership is deferred by the Phase 3.0 contract.
- `bun test test/cli/identity.test.ts` in `packages/opencode`: 3 pass, 0 fail, 5 expect() calls.
- `bun test test/cli/pr.test.ts` in `packages/opencode`: 5 pass, 0 fail, 5 expect() calls.
- `bun test test/cli/help/help-snapshots.test.ts` in `packages/opencode`: 1 pass, 0 fail, 34 snapshots.
- `bun src/index.ts --help` in `packages/opencode`: exit 0 with Lato command output.

## 2026-10-31 - Phase 3.3 configuration independence

### Architecture verified

- Global discovery is implemented in `packages/opencode/src/config/config.ts`.
- Global file order is `config.json`, then `opencode.json`, then `opencode.jsonc`, with later merges overriding earlier values; the default seed file is selected in `opencode.jsonc`, `opencode.json`, `config.json` order.
- Project file discovery is implemented by `packages/opencode/src/config/paths.ts` and loads `opencode.json`/`opencode.jsonc` through the project/worktree hierarchy; focused tests verify same-directory JSONC precedence and project overrides.
- `.opencode` directories are discovered across the project and home hierarchy and contribute `opencode.json`, `opencode.jsonc`, commands, agents, plugins, and TUI configuration.
- `OPENCODE_CONFIG_DIR` adds a configuration directory and suppresses automatic global config creation in the tested path.
- `OPENCODE_CONFIG` loads an explicit file after global config and before project configuration.
- `OPENCODE_CONFIG_CONTENT` is parsed as local configuration after directory-based configuration.
- Managed account configuration, managed files, `OPENCODE_PERMISSION`, legacy `tools`, and mode-to-agent normalization apply in later stages.
- Configuration consumers include providers/models, agents, commands, plugins, permissions, MCP, formatter, LSP, skills, TUI settings, experimental flags, and remote/managed configuration.

### Implementation decision

- Chose Option B, contract-first implementation.
- No `lato.json` or other new Lato-native filename was introduced.
- A new filename would create unresolved duplicate-file and precedence questions, especially alongside global/project OpenCode files, explicit `OPENCODE_CONFIG`, `OPENCODE_CONFIG_DIR`, and `OPENCODE_CONFIG_CONTENT`.
- Existing OpenCode configuration discovery, paths, environment variables, merge behavior, schema handling, and compatibility parsing remain unchanged.
- Future configuration migration remains explicit, previewable, backup-first, copy-first, reversible, and consent-based.

### Verification

- `bun test test/config/config.test.ts` in `packages/opencode`: 108 pass, 0 fail, 184 expect() calls.
- `bun test test/config/tui.test.ts` in `packages/opencode`: 33 pass, 3 skipped, 0 fail, 102 expect() calls.
- `bun test test/config/v2-compat.test.ts` in `packages/opencode`: 35 pass, 0 fail, 109 expect() calls.
- No application source or configuration behavior was modified for Phase 3.3.

## 2026-10-31 - Phase 3.4 storage independence and migration contracts

### Storage architecture investigated

- Global paths are derived in `packages/core/src/global.ts` from `xdg-basedir` and the compatibility application name `opencode`: data, cache, config, state, temporary, logs, repository cache, and binary cache.
- Main SQLite database paths are resolved in `packages/core/src/database/database.ts`; current defaults are `${data}/opencode.db` or channel-specific OpenCode database names, with `OPENCODE_DB` override support.
- SQLite uses WAL mode, normal synchronous mode, a busy timeout, foreign keys, passive WAL checkpointing, and transactional migrations in `packages/core/src/database/migration.ts`.
- Provider authentication is stored in `${data}/auth.json` through `packages/opencode/src/auth/index.ts` with restricted `0600` writes.
- MCP OAuth state is stored in `${data}/mcp-auth.json` through `packages/opencode/src/mcp/auth.ts`, also with restricted writes and file locking.
- Account access/refresh credentials are stored in SQLite account tables through `packages/opencode/src/account/repo.ts`.
- Sessions, messages, parts, todos, permissions, projects, workspaces, events, and shares are database-backed; filesystem storage, snapshots, plans, tool output, plugins, skills, and LSP/binary caches use additional global or project paths.
- Desktop settings, logs, crash data, staged CLI binaries, and legacy Tauri `.dat` migration use Electron `app.getPath("userData")` and platform-specific application-data roots.

### Ownership decisions

- Existing config, auth, database, session, project, plugin, skill, snapshot, and desktop state paths remain compatibility-shared.
- New Lato-only logs and disposable caches may become Lato-owned after distribution ownership is approved.
- Global authentication, provider credentials, main database/session history, plugin metadata, project IDs/snapshots, and desktop userData ownership remain undecided.
- No current user-data path was reclassified as independently Lato-owned.

### Migration contract

- Created `LATO_STORAGE_AND_MIGRATION_CONTRACT.md` as the authoritative Phase 3.4 storage document.
- Defined discovery, read-only preview, backup, copy-first migration, conflict handling, verification, rollback, and explicit-consent requirements.
- Raw copying of a live WAL database is explicitly prohibited; a runtime-appropriate consistent backup mechanism must be established before implementation.
- No user data was read, copied, moved, migrated, or modified.

### Verification

- Targeted source inventory completed without exposing credential contents.
- No storage source files or database schemas were modified.
- `git diff --check`: clean.
- No build, full typecheck, E2E test, desktop packaging, migration, commit, or push was performed.

## 2026-10-31 - Phase 3.5 storage prototype

- Added the isolated prototype module `packages/opencode/src/storage/migration-prototype.ts`.
- Added synthetic-only tests in `packages/opencode/test/storage/migration-prototype.test.ts`.
- Discovery accepts only an explicit absolute root, produces deterministic metadata, detects SQLite headers, rejects relative roots, and records symlinks that resolve outside the root without following them.
- Preview compares synthetic source and destination inventories, reports identical/different/database/sensitive conflicts, and performs no writes.
- SQLite backup uses `VACUUM INTO` through the existing Bun and Node SQLite connection APIs instead of raw copying a live WAL database.
- Backups are refused when the destination exists, independently reopened, checked with `PRAGMA integrity_check`, inspected for tables and `user_version`, and cleaned if verification fails.
- Bun and Node disposable WAL-mode databases preserved committed synthetic records in independent backups.
- No production storage resolver, migration command, schema change, authentication migration, or user-data access was introduced.
- `bun test test/storage/migration-prototype.test.ts` in `packages/opencode`: 7 pass, 0 fail, 20 expect() calls.
- Prettier check and `git diff --check` passed for the prototype and tracking documents.
- Concurrent-writer behavior remains untested; a production migration must establish application quiescence or a supported online-backup coordination strategy.

## 2026-10-31 - Phase 3.6 runtime identity and preference isolation

### Root cause

- TUI theme selection was persisted by `packages/tui/src/context/kv.tsx` to `${TuiPaths.state}/kv.json`.
- `packages/tui/src/app.tsx` supplied `Global.Path.state` as `TuiPaths.state`.
- `Global.Path.state` is derived from the compatibility application name `opencode` in `packages/core/src/global.ts`.
- Both `lato` and `opencode` therefore shared the same TUI KV file, including `theme`, `theme_mode`, and `theme_mode_lock`.

### Implementation

- Added `cliPreferenceState()` to `packages/opencode/src/cli/identity.ts`.
- `lato` TUI and attach flows now pass a sibling Lato state namespace into `TuiInput.state`.
- Legacy `opencode` continues using the existing `Global.Path.state`.
- `packages/tui/src/app.tsx` consumes the explicit state path while retaining the old fallback for other callers.
- `packages/tui/src/context/kv.tsx` now relies on the supplied TUI path and no longer references `Global.Path.state` directly.
- Existing config files, `.opencode`, `OPENCODE_*` variables, provider credentials, sessions, databases, and engine storage remain unchanged.

### Preference paths

- OpenCode: `${XDG_STATE_HOME:-~/.local/state}/opencode/kv.json`.
- Lato: `${XDG_STATE_HOME:-~/.local/state}/lato/kv.json`.
- No existing OpenCode preference was copied or imported.

### Verification

- `bun test test/cli/identity.test.ts` in `packages/opencode`: 5 pass, 0 fail, 9 expect() calls.
- `bun test test/provider/provider.test.ts` in `packages/opencode`: 103 pass, 0 fail, 248 expect() calls.
- `bun test test/config/config.test.ts` in `packages/opencode`: 108 pass, 0 fail, 184 expect() calls.
- Prettier check passed for Phase 3.6 files and tracking documents.
- `git diff --check`: clean.
- No real configuration, credentials, database, session, or user data was accessed or modified.

### Limitations

- Browser and desktop preference namespaces remain shared or undecided.
- Explicit `theme` values in shared OpenCode-compatible configuration remain shared by design.
- Native Windows/macOS paths and packaged desktop behavior were not verified.
- No preference migration or OpenCode-to-Lato import was implemented.

## 2026-10-31 - Phase 3.7 cross-platform preference validation

- Re-inspected Phase 3.6 identity and TUI preference wiring.
- Verified Linux/platform-independent identity behavior for `lato`, `opencode`, Windows-style `.exe` paths, and synthetic Lato/OpenCode KV separation.
- Verified existing configuration and provider behavior with focused tests.
- Confirmed explicit shared `config.theme` continues to override KV-selected theme; configuration precedence was not changed.
- Confirmed browser theme storage remains localStorage-based with compatibility-named keys and is not yet product-isolated.
- Confirmed desktop Electron userData preferences remain shared/undecided and were not changed.
- Native Windows, native macOS, packaged desktop, malformed/unreadable/read-only KV files, and concurrent preference writes remain unverified.
- Created `LATO_CROSS_PLATFORM_PREFERENCE_VALIDATION.md`.
- `bun test test/cli/identity.test.ts` in `packages/opencode`: 5 pass, 0 fail, 10 expect() calls.
- `bun test test/config/config.test.ts` in `packages/opencode`: 108 pass, 0 fail, 184 expect() calls.
- `bun test test/provider/provider.test.ts` in `packages/opencode`: 102 pass and 1 transient timeout; the timed-out test passed when rerun by name.
- `bun test test/runtime.test.tsx` in `packages/tui`: 2 pass, 0 fail, 6 expect() calls.
- Prettier check and `git diff --check` passed.

## 2026-10-31 - Phase 3.8 TUI preference reliability

- Revalidated Phase 3.6 runtime identity and preference wiring.
- Extended identity tests for Windows-style `.exe` and path separators.
- Added synthetic persistence coverage for concurrent atomic JSON writes and malformed JSON preservation.
- Confirmed existing `useKV()` behavior: missing/malformed reads fall back in memory, failed writes are logged, parent directories are created, and atomic temporary-file replacement is used.
- Created `LATO_TUI_PREFERENCE_RELIABILITY.md`.
- Native Windows/macOS, packaged desktop, read-only filesystem, permission-denied, and browser/desktop namespace validation remain pending.

## 2026-11-01 - Phase 3.9 native cross-platform validation

- Inspected existing GitHub Actions infrastructure; the existing unit/e2e matrix uses Blacksmith Linux and Windows runners with no macOS job.
- Added `.github/workflows/lato-native-validation.yml` for `ubuntu-latest`, `windows-latest`, and `macos-latest`, running focused identity, native state, TUI persistence, and TUI runtime tests without secrets, publication, deployment, or packaging.
- Added a native state probe/test that imports the real `Global.Path` module in an isolated temporary XDG environment and executes the entry-point identity composition.
- Added a test-only `bun build --compile` check confirming temporary `lato` and `opencode` executables resolve their own invocation identity.
- Added native persistence/failure coverage for unreadable files, read-only directories, theme-key round-trips, temp-file cleanup, and missing directories.
- Linux native results: identity/native-state 7 pass, TUI persistence 7 pass, TUI runtime 2 pass, provider 103 pass.
- An initial provider run without the repository 30-second timeout produced timeouts; rerunning with `--timeout 30000` passed all 103 tests. The validation document records both results.
- Native Windows and macOS execution was not available because commits/pushes are prohibited and no native host exists; those platforms are not claimed as verified.
- Created `LATO_NATIVE_CROSS_PLATFORM_VALIDATION.md`.
- `bun test --timeout 60000 test/cli/identity.test.ts test/cli/native-state.test.ts` in `packages/opencode`: 7 pass, 0 fail, 38 expect() calls.
- `bun test --timeout 30000 test/prompt/persistence.test.ts` in `packages/tui`: 7 pass, 0 fail, 17 expect() calls.
- `bun test --timeout 30000 test/runtime.test.tsx` in `packages/tui`: 2 pass, 0 fail, 6 expect() calls.
- `bun test --timeout 30000 test/provider/provider.test.ts` in `packages/opencode`: 103 pass, 0 fail, 248 expect() calls.
- Prettier check and `git diff --check` passed.

## 2026-11-01 - Phase 4.1 Lato-only application entry point

- Removed the legacy `opencode` application launcher and bin mapping. `lato`/`bin/lato.cjs` is now the only application command.
- Made CLI identity unconditionally Lato and removed invocation/env identity overrides.
- Kept Lato TUI preferences at `${XDG_STATE_HOME:-~/.local/state}/lato/kv.json`; the state helper is idempotent and does not migrate or copy compatibility preferences.
- Prefixed CLI version output with `lato` and removed the `lato pr` OpenCode fallback.
- Updated native build output, postinstall, generated npm bin metadata, Docker, Nix, AUR/Homebrew install paths, and release-workflow binary paths to `lato`.
- Preserved `opencode`/`opencode-go` provider IDs, configuration filenames, environment variables, storage paths, mDNS defaults, and engine behavior.
- Left inherited OpenCode package/archive/Docker/AUR/Homebrew identifiers and the root installer unresolved because no Lato publication channel exists.
- Focused Linux verification: CLI identity/PR 8 pass; executables 5 pass; native state 2 pass; TUI persistence/runtime 9 pass; provider 103 pass; help snapshots 1 pass with 34 snapshots.
- Native Windows/macOS execution, native builds, package installs, Docker/Nix builds, and release workflows were not run. No commit, push, publication, or user-data migration was performed.

## 2026-11-03 - Phase 4.5 final user-facing identity audit

- Reconstructed the phase status from the transformation plan, log, compatibility matrix, known issues, and Phase 4.4 reports.
- Audited user-facing OpenCode references across the CLI/TUI, app, desktop, package metadata, installers, workflows, URLs, assets, provider/model surfaces, and compatibility paths.
- Confirmed the public application identity remains `lato-cli`, with internal native binaries named `lato`/`lato.exe`.
- Preserved OpenCode free-model catalog entries, provider integrations, provider IDs (`opencode`, `opencode-go`), configuration names, environment variables, authentication paths, storage identifiers, protocol names, and legal attribution.
- Updated stale platform-validation status in `README.md`, `LATO_COMPATIBILITY_MATRIX.md`, and `LATO_KNOWN_ISSUES.md` after the successful `51156f4` CI workflows.
- Documented unresolved user-facing OpenCode links and inherited distribution metadata where no verified Lato-owned destination or publication channel exists.
- No source code, workflows, lockfiles, assets, provider IDs, compatibility identifiers, or distribution endpoints were changed.

## 2026-11-03 - Phase 5 developer-preview distribution proposal

- Revised `LATO_PHASE_5_DEVELOPER_PREVIEW_PLAN.md` to define an explicit
  cross-platform installation contract for Linux, Windows, and macOS.
- Documented per-OS install directories, PATH behavior, `lato-cli`/`lato.exe`
  naming, upgrade/reinstall safety, checksum verification, unsupported target
  handling, and build-only runtime limitations.
- Clarified that Actions artifacts are not public Release assets and that the
  current installer scripts are not usable until an approved Release and
  checksum manifest exist.
- Added ordered milestones for release contract, archives, installers,
  deterministic provider fixtures, first-session smoke coverage, process-restart
  recovery, and focused CI validation.
- This is a planning-only proposal. No Phase 5 implementation, release,
  package publication, commit, or push was performed.

## 2026-11-03 - Phase 5 Milestones 2-3 archive foundation

- Added `packages/opencode/script/archive.ts` for deterministic per-target
  archive assembly, root executable validation, archive-set validation, SHA-256
  manifest generation, and manifest verification.
- Updated `.github/workflows/cross-platform-build.yml` to use the archive tool
  for Linux, macOS, and Windows packaging while retaining the existing 12-target
  matrix and runtime/build-only distinctions.
- Added a non-publishing `validate-archives` CI job that downloads the 12 Actions
  artifacts, validates their archive contents, creates a lexical `SHA256SUMS`
  manifest, and uploads only that manifest as an Actions artifact.
- Locally validated the tool with 12 tiny placeholder executables; no native
  build, dependency installation, release upload, or public publication was
  performed.
- Public GitHub Releases, installer implementation, signing, provider fixtures,
  first-session smoke tests, and process-restart recovery remain pending.

## 2026-11-03 - Phase 5 Milestone 4 explicit-version installers

- Replaced the placeholder `install.sh` and `install.ps1` behavior with an
  explicit-version developer-preview installer contract.
- Linux/macOS detect the existing target matrix, including x64 baseline and
  Linux musl selection; Windows detects x64/ARM64 and x64 baseline selection.
- Installers download the versioned archive and `SHA256SUMS`, verify SHA-256,
  validate the exact root-level executable, stage the executable safely, and
  print PATH guidance without editing shell startup or user PATH state.
- Default user install locations remain `$HOME/.local/bin`/`XDG_BIN_HOME` on
  Linux and macOS and `%USERPROFILE%\\.local\\bin` on Windows.
- No release was published and no native installer was tested against a real
  GitHub Release; validation is fixture/static only.
- Signing, notarization, uninstall, package-manager publication, and `latest`
  channel support remain pending.

## 2026-11-03 - Phase 5 installer hardening validation

- Added `packages/opencode/script/installer-fixtures.sh` to exercise the Unix
  installer contract with local fixture archives and a fake downloader.
- Fixture validation covers missing/malformed versions, upgrade/reinstall,
  missing manifests and entries, checksum mismatch, corrupt/unexpected archives,
  previous-binary preservation, and temporary-target cleanup.
- Added CI checks for PowerShell parsing and mandatory-version behavior on the
  Windows test runner.
- Hardened version parsing and temporary-target cleanup in both installers.
- Local fixture validation passed; native Windows PowerShell parsing and real
  Release installation remain CI/publishing-dependent and were not claimed as
  locally validated.
- No release, public asset, commit, or push was performed.

## 2026-11-03 - Phase 5 Milestones 5-6 deterministic first-session smoke

- Added one focused test to `packages/core/test/session-runner.test.ts` using
  the existing test-only `LLMClient.Service` seam and fake model.
- The test creates an isolated SessionV2 session, sends `Hello Lato`, receives
  deterministic text `Lato fixture response`, verifies the request/model and
  projected user/assistant messages, and exits through the existing Effect test
  scope.
- No provider ID, production provider implementation, network dependency, real
  credential, or session-recovery behavior was added or changed.
- Focused validation passed: one named `session-runner.test.ts` test, 1 pass,
  0 fail, with 87 tests filtered out.
- Process-restart session recovery remains the next reliability milestone and
  was not started.

## 2026-11-03 - Phase 5 Milestone 7 process-restart session recovery

- Added a focused `session-runner.test.ts` recovery test that launches two
  sequential Bun test subprocesses against the same isolated SQLite database.
- The first process creates a session and persists a deterministic user message
  plus fake-provider assistant response; the second process reopens the same
  session ID and verifies both messages.
- Added only a test-environment change so an explicitly supplied `OPENCODE_DB`
  is preserved instead of being forced to `:memory:` by the core test preload.
- Focused validation passed: 1 recovery test, 1 pass, 90 tests filtered out.
- No production session/storage architecture, compatibility path, credential,
  database, or migration behavior was changed. Provider fixtures and further
  Phase 5 milestones remain outside this task.

## 2026-11-03 - Phase 5 final review and developer-preview readiness

- Reviewed the full uncommitted Phase 4.5 and Phase 5 changeset against the
  review checklist; verified archive names, checksum manifest format, staged
  replacement, and PATH guidance match between `archive.ts`, both installers,
  and the fixtures.
- Found and fixed one verified installer defect: `install.sh` selected `EXT`
  with a short-circuited conditional as the last statement of `detect_target`,
  so under `set -euo pipefail` the function returned 1 and the installer exited
  silently on macOS before downloading anything. Replaced it with an explicit
  `if`. Linux was unaffected, which is why the earlier fixture and CI runs did
  not expose it.
- Added a darwin zip fixture scenario to
  `packages/opencode/script/installer-fixtures.sh` with a scenario-aware
  `uname` stub, a `lato-darwin-arm64.zip` fixture, and a combined checksum
  manifest; the full fixture suite passes, now covering Linux tar.gz and
  darwin zip target selection, upgrade, and all failure modes.
- Reviewed `cross-platform-build.yml`: packaging now routes through
  `archive.ts assemble`, the non-publishing `validate-archives` job generates
  and validates `SHA256SUMS`, and the test job adds the installer fixture on
  ubuntu plus PowerShell parse and mandatory-version checks on windows. These
  run only after a commit containing them is pushed; the green runs on
  `51156f4` predate them.
- Updated the README: the project status line, and a new packaged
  Developer Preview section that labels packaged installation as unavailable
  and documents the intended channel, versions, archives, checksum
  verification, install directories, PATH behavior, upgrade behavior,
  unsigned-preview notice, and per-platform limitations without fabricating
  URLs.
- No commit, push, release, package publication, or compatibility identifier
  change was made. Release publication and native validation require separate
  explicit approval.

## 2026-11-04 - Phase 5 closure: first releases published and validated on a real machine

- Published prereleases `v0.1.0-preview.1` (CI run `41645034351` at commit
  `3bc5ac9`) and `v0.1.0-preview.2` from `lazyarjun2005-rgb/lato-tui`
  GitHub Releases; both are marked prerelease and are never marked "latest".
- Root-caused the development version stamp in the first preview's binaries:
  the cross-platform workflow injected no version, so
  `packages/script/src/index.ts` fell back to the dev stamp
  (`0.0.0-lato-development-<timestamp>`), which `build.ts` froze into the
  binaries and `InstallationVersion` reports at runtime.
- Fixed it in commit `c4e7db8` ("Stamp release versions in cross-platform CI
  builds"): a required `version` dispatch input flows into
  `OPENCODE_VERSION` for the build jobs, and the verify steps now assert the
  installed stamp strictly and fail closed, by capturing
  `lato-cli --version` output, rejecting mismatches with `::error::`, and
  exiting 1.
- `v0.1.0-preview.2` was built by dispatched CI run `41696675487` at commit
  `c4e7db8` (16/16 jobs green). Version assertions passed on Linux x64,
  x64-baseline, ARM64, glibc and musl, macOS ARM64, and Windows x64 native
  verification steps, plus musl verification inside Alpine; macOS x64 and
  Windows ARM64 remain build-only per the documented capability limits, and
  all 12 artifacts plus the regenerated `SHA256SUMS` came from this run.
- Published `v0.1.0-preview.2` from those exact CI artifacts (12 archives plus
  `SHA256SUMS`; ~756 MB downloaded fresh from the run): manifest verified
  `sha256sum --strict -c` 12/12 before upload; tag `v0.1.0-preview.2` points
  at `c4e7db8de65ba9673bbba51a86a3a6eecf29a121`; asset-count and prerelease
  flags verified after upload; post-verification re-downloaded
  `SHA256SUMS` and `lato-linux-x64-baseline.tar.gz` from the live release and
  the checksum matched.
- Windows CI fix from the preview.1 cycle is in place: the PowerShell
  validation step no longer executes `install.ps1` without its mandatory
  parameter (cross-platform-build run `41645034351` and later are green).
- Real-machine validation: the official remote installer (byte-identical to
  the reviewed repo copy) upgraded the existing preview.1 installation on
  Arch Linux x64 (no-AVX2, `lato-linux-x64-baseline` target): explicit version
  accepted, checksum verified, atomic staged replacement,
  `lato-cli --version` reports `lato 0.1.0-preview.2`, `lato-cli --help`
  exits 0, and `~/.local/state/lato` user data was untouched.
- Documentation closure: README now documents real installation commands for
  `v0.1.0-preview.2` (no more "not available yet" wording), publishes the
  per-platform real-machine honesty notes, and updates the roadmap; the Phase
  5 plan's status, guardrails, Milestone 4 and 8 records, and Definition of
  Done closure mapping were updated; the transformation plan's Phase 5 entry
  is complete and Phase 6 acceptance criteria were refined against the
  shipped previews.
- Phase 5 is marked complete on its documented Linux real-machine scope;
  Phase 6 hardening remains: Windows/macOS real-machine installer runs,
  multi-OS CI execution of the smoke/recovery fixtures, signing, uninstaller,
  packaging/npm decisions, and any future `latest` channel.

## 2026-11-04 - Phase 6: anonymous free-tier removal and TUI branding cleanup

- Investigated the reported "OpenCode 1.18.0 or newer is required to use the
  free tier" failure. Root cause: the `opencode` models.dev provider
  (`https://opencode.ai/inference/openai/v1`) serves an anonymous free tier
  under the literal `apiKey: "public"` when no credential exists
  (`packages/opencode/src/provider/provider.ts`), and OpenCode's hosted gateway
  restricts anonymous free-tier access to official OpenCode clients (the error
  string appears nowhere in this repository; the server compares the
  `opencode/<channel>/<version>/<client>` user agent, so Lato's real version
  `0.1.0-preview.2` is rejected). No version spoofing, header fakery, or
  bypass will be attempted.
- Implemented the approved Option B in the `opencode` custom loader: without a
  legitimate credential (env key, `auth.json` entry, or config options apiKey)
  the loader removes all catalog models and returns `{ autoload: false }`, so
  keyless installs no longer offer OpenCode-hosted models at all. The loader
  no longer injects `apiKey: "public"`. Authenticated OpenCode Zen usage is
  unchanged: a real key keeps the full catalog and all compatibility headers
  (`x-opencode-session(-id)`, `x-opencode-client`, `x-opencode-project`,
  `x-opencode-request`, and the `opencode/...` user agent).
- Preserved everything unrelated: OpenRouter (including `:free` models),
  Ollama/local providers, custom OpenAI-compatible endpoints, other providers,
  credentials, configuration, sessions, and databases. Nothing was removed
  merely because a model id contains "free".
- Fixed the last TUI branding leak: the sidebar footer brand line was
  hardcoded as `Open Code` in two places
  (`packages/tui/src/feature-plugins/sidebar/footer.tsx` and
  `packages/tui/src/routes/session/sidebar.tsx`) and now renders
  `Lato <version>` (for example `Lato 0.1.0-preview.2`). The version sources
  (`props.api.app.version` / `InstallationVersion`) were already correct.
- Corrected onboarding copy that claimed Lato ships with free models by
  default: the getting-started panel now explains connecting through
  `/connect` and calls out OpenRouter's legitimate free models explicitly.
- Updated the two provider tests that exercised the anonymous loader
  (`packages/opencode/test/provider/provider.test.ts`): the keyless
  assertions now expect the `opencode` provider to be absent entirely, the
  keyed assertions still require paid models with a real credential, and the
  `paid()` helper tolerates provider absence. Tests are not run locally;
  GitHub Actions validates.
- No commit, tag, release, or installed-binary change was made. The changes
  are staged in the working tree for review and CI validation.
