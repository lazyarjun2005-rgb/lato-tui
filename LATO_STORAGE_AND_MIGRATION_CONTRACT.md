# Lato Storage And Migration Contract

Status: Phase 3.4/3.5 architecture contract, pending product-owner approval

Baseline: `lato-baseline-v1.19.5` (`810c0eba1a7348036f8bdf61e6632d0c36c6876c`)

This document records the storage architecture verified in the repository and defines a future, opt-in migration contract. It does not move, copy, rename, delete, or rewrite any user data.

The isolated Phase 3.5 prototype is documented in [`LATO_STORAGE_PROTOTYPE_REPORT.md`](LATO_STORAGE_PROTOTYPE_REPORT.md). It operates only on caller-provided synthetic roots and disposable databases.

## 1. Executive Summary

The current application uses OpenCode-compatible storage identities across the CLI, server, desktop application, and project integrations. The primary global root is derived from `xdg-basedir` and the application name `opencode`; the database, authentication files, MCP tokens, logs, caches, snapshots, plugin metadata, and project metadata are distributed across that root, project directories, and Electron-managed `userData`.

The safest Phase 3.4 decision is to keep these locations compatibility-shared. Lato should not create a second storage tree until ownership, conflict behavior, database copying, authentication handling, and rollback are approved. A future migration must be explicit, previewed, backed up, copy-first, verifiable, and reversible without touching the original OpenCode data.

## 2. Scope And Non-Goals

### In scope

- Inventory current paths, readers, writers, sensitivity, persistence, and ownership.
- Define compatibility-shared versus future Lato-owned storage.
- Define a future migration, backup, verification, conflict, rollback, and consent contract.
- Identify database and credential risks.

### Not in scope

- Changing any storage path.
- Creating a Lato storage resolver.
- Moving or copying real user data.
- Changing database schemas or migration files.
- Migrating authentication or provider credentials.
- Changing configuration filenames.
- Changing desktop application IDs or protocol schemes.

## 3. Existing Storage Architecture

### Global path root

Source: `packages/core/src/global.ts:10-28`.

The application name is currently `opencode`. Paths are derived from `xdg-basedir` and `os.tmpdir()`:

| Logical path     | Current path pattern                           | Source               |
| ---------------- | ---------------------------------------------- | -------------------- |
| Data             | `${XDG_DATA_HOME:-platform data}/opencode`     | `Global.Path.data`   |
| Cache            | `${XDG_CACHE_HOME:-platform cache}/opencode`   | `Global.Path.cache`  |
| Config           | `${XDG_CONFIG_HOME:-platform config}/opencode` | `Global.Path.config` |
| State            | `${XDG_STATE_HOME:-platform state}/opencode`   | `Global.Path.state`  |
| Temporary        | `${os.tmpdir()}/opencode`                      | `Global.Path.tmp`    |
| Logs             | `${Global.Path.data}/log`                      | `Global.Path.log`    |
| Repository cache | `${Global.Path.data}/repos`                    | `Global.Path.repos`  |
| Binary cache     | `${Global.Path.cache}/bin`                     | `Global.Path.bin`    |

The module creates the data, config, state, temp, log, binary, and repository directories during initialization. `OPENCODE_TEST_HOME` affects the logical home value used by tests; `OPENCODE_CONFIG_DIR` can override the config directory through `Global.make` and configuration loading.

The exact macOS and Windows roots are delegated to `xdg-basedir` and Electron platform APIs. They were not independently executed on those platforms in this phase and must not be treated as verified absolute paths.

### Configuration and project-local state

Configuration discovery is defined in `packages/opencode/src/config/config.ts` and `packages/opencode/src/config/paths.ts`. It uses the existing OpenCode paths and is covered by the Phase 3.3 configuration contract.

Project-local `.opencode` directories may contain:

- Project configuration.
- Agents and agent modes.
- Commands.
- Plugins and plugin metadata.
- TUI settings and themes.
- Plans under `.opencode/plans` when configured by the session layer.

The project service also stores a project ID marker named `opencode` in the Git common directory. This is implemented in `packages/core/src/project.ts:55-65` and is compatibility metadata, not a session database.

## 4. Storage Inventory

| Category                    | Current path                                                                   | Path source                                                         | Readers                                                                 | Writers                                      | Sensitivity                         | Persistence                   | OpenCode dependency                  | Lato ownership                                    | Migration risk | Strategy                                                             |
| --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------- | ----------------------------- | ------------------------------------ | ------------------------------------------------- | -------------- | -------------------------------------------------------------------- |
| Global config               | `${Global.Path.config}/config.json`, `opencode.json`, `opencode.jsonc`         | XDG/platform root plus config loader                                | `Config`, CLI, TUI, plugins, desktop                                    | Config update APIs, legacy config conversion | Personal/internal                   | Persistent                    | Shared                               | Compatibility-shared                              | High           | Preserve; copy only after explicit config migration approval         |
| Project config              | Project/worktree `opencode.json`, `opencode.jsonc`                             | `ConfigPaths.files()`                                               | `Config`, providers, agents, plugins, MCP, permissions                  | User/editor/config update paths              | Personal/project policy             | Persistent                    | Shared                               | Compatibility-shared                              | High           | Never move automatically                                             |
| `.opencode` tree            | Project/home `.opencode`                                                       | `ConfigPaths.directories()` and config/TUI discovery                | Agents, commands, plugins, skills, TUI, plans                           | Plugin/skill/config writers and users        | Personal/project code               | Persistent                    | Shared                               | Compatibility-shared                              | High           | Preserve in place; migrate by explicit copy later                    |
| Auth credentials            | `${Global.Path.data}/auth.json`                                                | `packages/opencode/src/auth/index.ts:8-10`                          | Provider auth and CLI provider commands                                 | Auth service, provider login/logout          | Secret                              | Persistent                    | Shared                               | Undecided                                         | Critical       | Never copy or expose without consent; use restricted permissions     |
| Account credentials         | Rows in current SQLite database                                                | `AccountRepo` uses `Database.Service`                               | Account/Console integration                                             | Account repository transactions              | Secret                              | Persistent                    | Shared                               | Undecided                                         | Critical       | Require schema-aware export/import; never raw-merge silently         |
| MCP OAuth state             | `${Global.Path.data}/mcp-auth.json`                                            | `packages/opencode/src/mcp/auth.ts:37`                              | MCP auth service                                                        | MCP OAuth mutations with file lock           | Secret                              | Persistent                    | Shared                               | Undecided                                         | Critical       | Copy only with explicit credential consent and mode `0600`           |
| Main database               | `${Global.Path.data}/opencode.db` or channel-specific `opencode-${channel}.db` | `packages/core/src/database/database.ts:43-55`                      | Session, account, project, workspace, event, permission, share services | All database repositories and migrations     | Personal/secret                     | Persistent                    | Shared                               | Compatibility-shared                              | Critical       | Consistent SQLite backup; schema-aware import; source remains intact |
| Sessions/messages           | Main SQLite database tables                                                    | `packages/core/src/session/sql.ts`, projector and session services  | Session APIs, TUI, browser UI, tools                                    | Session execution/projector/services         | Personal, potentially secret        | Persistent                    | Shared                               | Compatibility-shared                              | Critical       | Preserve IDs and records; verify counts and integrity                |
| File-backed storage         | `${Global.Path.data}/storage`                                                  | `packages/opencode/src/storage/storage.ts:224`                      | Storage service and session/revert code                                 | Storage migrations and JSON resource writers | Personal/project                    | Persistent                    | Shared                               | Compatibility-shared                              | High           | Copy directory with manifest; preserve migration marker              |
| Snapshots                   | `${Global.Path.data}/snapshot/{projectID}/{worktreeHash}`                      | `packages/opencode/src/snapshot/index.ts:70-75`                     | Snapshot/revert/summary services                                        | Git snapshot operations                      | Project content                     | Persistent                    | Shared                               | Compatibility-shared                              | High           | Preserve Git object state; verify repository refs before use         |
| Plans                       | Project `.opencode/plans` or `${Global.Path.data}/plans`                       | `packages/opencode/src/session/session.ts:333-334`                  | Session/tool/agent paths                                                | Plan tool/session code                       | Project/personal                    | Persistent                    | Shared                               | Compatibility-shared                              | Medium         | Copy with project association; never delete source                   |
| Logs                        | `${Global.Path.log}`, including `direct/` traces                               | `packages/core/src/observability/logging.ts`, CLI trace             | Diagnostics, support export                                             | Logger and direct trace                      | Personal; may include prompts/paths | Persistent with cleanup       | Shared                               | Lato-owned eventually, compatibility-readable now | Medium         | Copy selectively after redaction policy; do not treat as public      |
| Tool output                 | `${Global.Path.data}/tool-output`                                              | `packages/core/src/plugin/agent.ts`, truncation paths               | Tool result rendering                                                   | Tool/truncation services                     | Potentially sensitive               | Persistent/cleanup-dependent  | Shared                               | Undecided                                         | Medium         | Classify by age/content before migration                             |
| Skills cache                | `${Global.Path.cache}/skills`                                                  | `packages/opencode/src/skill/discovery.ts:35`                       | Skill discovery/runtime                                                 | Skill downloader and index writer            | Code/external content               | Rebuildable cache             | Shared implementation                | Lato-owned eventually                             | Low/Medium     | Re-fetch or copy with provenance; never assume trusted content       |
| Binary/LSP cache            | `${Global.Path.bin}`                                                           | `Global.Path.bin`, LSP/ripgrep code                                 | LSP, formatter, ripgrep, executable lookup                              | Download/install helpers                     | Executable content                  | Rebuildable cache             | Shared implementation                | Lato-owned eventually                             | Medium         | Rebuild from owned sources; do not migrate blindly                   |
| Plugin metadata             | `${Global.Path.state}/plugin-meta.json` or `OPENCODE_PLUGIN_META_FILE`         | `packages/opencode/src/plugin/meta.ts:49`                           | Plugin loader/TUI runtime                                               | Plugin metadata service                      | Internal/project metadata           | Persistent                    | Shared                               | Undecided                                         | Medium         | Copy with plugin provenance and conflict manifest                    |
| Model state                 | `${Global.Path.state}/model.json`                                              | `packages/opencode/src/provider/provider.ts:2038`, CLI variant code | Provider/model selection                                                | Model selection code                         | Personal preference                 | Persistent                    | Shared                               | Undecided                                         | Low/Medium     | Preserve IDs; copy only after config contract                        |
| Desktop settings            | `${app.getPath("userData")}/opencode.settings` and named stores                | `packages/desktop/src/main/store.ts:15-24`                          | Desktop main/preload/renderer                                           | Electron Store                               | Personal settings                   | Persistent                    | Compatibility-shared                 | Undecided                                         | High           | Preserve app IDs and store names until desktop migration             |
| Desktop renderer stores     | `${app.getPath("userData")}/*.dat`                                             | Renderer storage API and `electron-store`                           | Desktop renderer                                                        | Renderer store API                           | Personal settings/drafts            | Persistent                    | Shared with legacy desktop migration | Undecided                                         | Medium         | Use existing Tauri migration semantics; copy and skip conflicts      |
| Desktop logs                | `${app.getPath("userData")}/logs/{run}`                                        | `packages/desktop/src/main/logging.ts:101-105`                      | Desktop logger/exporter                                                 | Electron log and net log                     | Personal/diagnostic                 | Persistent with 7-day cleanup | Desktop-specific                     | Lato-owned eventually                             | Medium         | Copy selectively and redact on export                                |
| Crash data                  | `${app.getPath("crashDumps")}` / Crashpad                                      | `packages/desktop/src/main/logging.ts:36-41`                        | Electron crash reporter/export                                          | Electron                                     | Diagnostic, potentially sensitive   | Persistent/cleanup-dependent  | Desktop-specific                     | Lato-owned eventually                             | Medium         | Do not migrate automatically; export only with consent               |
| Debug exports               | Downloads `opencode-debug-{timestamp}.zip`                                     | `packages/desktop/src/main/logging.ts:57-67`                        | User/support                                                            | Desktop export                               | Potentially highly sensitive        | User-controlled               | OpenCode-named compatibility output  | Undecided                                         | Medium         | Future rename only with support ownership decision                   |
| Desktop bundled CLI staging | `${app.getPath("userData")}/cli/{version}/opencode-cli*`                       | `packages/desktop/src/main/background-cli.ts:62-76`                 | Desktop background service                                              | Desktop staging                              | Executable                          | Persistent/cache-like         | Shared artifact naming               | Undecided                                         | High           | Do not migrate until package ownership is approved                   |

## 5. Authentication And Sensitive Data

Inspected authentication paths include:

- Provider credentials in `${Global.Path.data}/auth.json`.
- MCP OAuth tokens and client state in `${Global.Path.data}/mcp-auth.json`.
- Account access and refresh tokens in SQLite account tables through `packages/opencode/src/account/repo.ts`.
- Runtime environment credentials such as `OPENCODE_AUTH_CONTENT` and provider-specific environment variables.

The inspected code writes JSON auth files with mode `0600` and uses file locking for MCP auth mutations. No operating-system keychain integration or encryption-at-rest layer was found in the inspected paths. Treat these credentials as sensitive plaintext-at-rest data protected primarily by filesystem permissions and application access controls.

Migration must never print token values, copy credentials without explicit consent, or include secret contents in preview output. Credential migration must report only presence, type, server/provider identity, and verification status.

## 6. Database And Session Storage

The database is SQLite through `@opencode-ai/effect-drizzle-sqlite`.

Verified behavior:

- Database path is resolved by `packages/core/src/database/database.ts:43-55`.
- WAL mode is enabled.
- Synchronous mode is `NORMAL`.
- Busy timeout is `5000` milliseconds.
- Foreign keys are enabled.
- Passive WAL checkpointing occurs during initialization.
- Schema and migrations are applied by `packages/core/src/database/migration.ts`.
- Each pending migration runs inside a transaction and records a migration marker.
- Existing Drizzle migration journals are translated into the current migration journal.
- Bun exposes SQLite serialization through the client `export` implementation in `packages/core/src/database/sqlite.bun.ts`.
- The inspected Node SQLite adapter does not expose the same serialization method; a portable backup implementation is therefore not yet established.

Sessions, messages, parts, todos, permissions, projects, workspaces, account records, events, and shares are represented in the database schema under `packages/core/src/*/sql.ts` and projected through the corresponding services.

Raw copying of a live WAL database is not an acceptable migration backup strategy. A future implementation must quiesce the application and use a supported consistent SQLite backup/export path for each runtime, or explicitly close the database before a verified filesystem copy.

## 7. Desktop Storage

Desktop storage is distinct from the CLI/server global root:

- Electron `app.getPath("userData")` is the primary desktop settings/log/crash/staging root.
- `electron-store` creates named stores using that userData path.
- `packages/desktop/src/main/migrate.ts` reads legacy Tauri `.dat` files from platform-specific application-data paths and copies keys into Electron stores without overwriting existing keys.
- Desktop logs are stored under userData `logs/{timestamp}` and cleaned after seven days.
- Crashpad is configured under userData-derived crash dump storage.
- Background CLI binaries are staged under userData `cli/{version}`.
- Debug-log exports are written to the user Downloads directory and may include desktop and server logs.

The exact absolute userData path is platform-managed by Electron and was not executed on macOS or Windows during this phase. Desktop application IDs and store names remain compatibility-sensitive.

## 8. Storage Ownership Matrix

### Compatibility-shared

- Existing OpenCode global config and data roots.
- `auth.json`, `mcp-auth.json`, account records, and provider credentials.
- Main SQLite database and session history.
- Project IDs and `.opencode` project metadata.
- Snapshots, plans, tool output, plugins, skills, and MCP state.
- Existing desktop app IDs, store names, Tauri migration sources, and protocol-associated state.

These must remain readable by existing OpenCode installations and must not be silently duplicated or moved.

### Future Lato-owned

Only new, non-compatibility state can be considered Lato-owned without migration. Candidates include:

- New Lato-specific logs after a future logging ownership decision.
- New Lato-only disposable caches generated from Lato-owned distribution sources.
- New release/update metadata after Lato distribution exists.

No current user-data path is classified as independently Lato-owned yet.

### Undecided

- Global authentication location.
- Main database and session location.
- Account and provider credential location.
- Plugin metadata and shared plugin installation roots.
- Desktop userData root and store names.
- Project ID marker and snapshot ownership.
- Debug export naming and support ownership.

These require product-owner decisions because changing them can break existing installations or duplicate sensitive state.

## 9. Future Lato Storage Proposal

This is a proposal only. It is not an implementation decision.

### Linux proposal

- Config: `${XDG_CONFIG_HOME:-~/.config}/lato`
- Data: `${XDG_DATA_HOME:-~/.local/share}/lato`
- State: `${XDG_STATE_HOME:-~/.local/state}/lato`
- Cache: `${XDG_CACHE_HOME:-~/.cache}/lato`
- Temporary: system temporary directory under a Lato-specific namespace

### macOS proposal

- Application support/data: `~/Library/Application Support/Lato`
- Cache: `~/Library/Caches/Lato`
- Logs: `~/Library/Logs/Lato` or Electron-managed logs
- Temporary files: system temporary directory under a Lato-specific namespace

Exact macOS paths require platform review and must align with Electron behavior.

### Windows proposal

- Roaming configuration/user settings: `%APPDATA%/Lato`
- Local data/cache/logs: `%LOCALAPPDATA%/Lato`
- Temporary files: `%TEMP%/Lato`

This proposal must not replace OpenCode paths until an explicit migration and compatibility policy is approved.

## 10. Migration Architecture

### Stage 1: discovery

Collect only metadata initially:

- Existing source roots and candidate Lato roots.
- Categories present.
- File sizes, timestamps, permissions, and hashes where safe.
- Database schema/migration state.
- Record counts and project/session identifiers without secret contents.
- Accessibility, lock, and unsupported-file status.

Discovery must not mutate files or expose credential values.

### Stage 2: preview

Show the user:

- Source and destination roots.
- Selected categories.
- Estimated storage usage.
- Files and database records proposed for copy.
- Conflicts, schema mismatches, unsupported data, and risks.
- Credential presence without token values.

Preview must be read-only.

### Stage 3: backup

- Preserve all source files.
- Record backup manifest, hashes, timestamps, schema versions, and tool version.
- Backup SQLite consistently using a supported online backup/serialization mechanism or a quiesced closed-database copy.
- Checkpoint/handle WAL safely before any filesystem-level backup.
- Verify backup readability and SQLite integrity before copy.
- Store backup metadata separately from the destination migration state.

### Stage 4: copy-first migration

- Copy into a new destination; never move the source.
- Never overwrite a destination silently.
- Preserve permissions where practical, especially `0600` credential files.
- Use temporary destination names and atomic rename only after a complete category copy.
- Record a resumable manifest so interrupted work can continue or be discarded safely.
- Keep migration idempotent.

### Stage 5: conflicts

- Identical files: verify hash and skip duplicate copy.
- Different files: preserve both under a migration conflict area and require user choice.
- Duplicate sessions: never silently overwrite; preserve source IDs and map conflicts explicitly.
- Existing destination database: do not raw-merge; use schema-aware import or leave the source database compatibility-shared.
- Credentials: do not merge automatically; require explicit selection and verification.
- Plugins/skills: preserve source and destination versions with provenance; do not silently replace executable code.
- Partial migration: retain manifest and source; mark destination incomplete and refuse to treat it as authoritative.

### Stage 6: verification

Verify:

- File hashes and expected counts.
- SQLite open/readability.
- `PRAGMA integrity_check` and foreign-key checks where supported.
- Migration/schema markers.
- Session, project, and message counts.
- Project associations.
- Credential record presence without values.
- Plugin and skill index/discovery behavior.
- Logs and metadata are readable without exposing secrets.

### Stage 7: rollback

- Leave the source untouched.
- Mark the destination migration incomplete on failure.
- Remove or quarantine only destination files created by the migration, using the manifest.
- Never delete the original OpenCode root as part of rollback.
- Keep the backup until post-migration verification and an explicit retention decision.
- Allow the user to continue using the original compatibility path.

### Stage 8: consent

Migration must be explicitly initiated, previewed, approved, and cancellable. It must never run during startup, installation, upgrade, or first launch without an explicit user action.

## 11. Security And Privacy

- Do not print or include credential values in logs, previews, manifests, or support bundles.
- Treat prompts, tool output, file paths, session history, logs, and debug exports as potentially personal data.
- Preserve `0600` permissions for auth files where supported.
- Do not upload backups or migration reports automatically.
- Use least-privilege file access and avoid following unexpected symlinks during migration discovery.
- Verify destination paths remain within the approved destination root.
- Protect migration manifests because file names and project paths can be sensitive.
- Do not treat downloaded plugins, skills, or LSP binaries as trusted merely because they came from an existing cache.

## 12. Unresolved Product-Owner Decisions

- Whether and when Lato receives a separate global storage root.
- Whether authentication and provider credentials remain shared indefinitely.
- Whether sessions/databases remain shared or become copy-on-write.
- Whether project ID markers and snapshots remain OpenCode-compatible.
- Exact platform-specific Lato roots.
- Database backup API that works consistently across Bun and Node runtimes.
- Whether plugins, skills, and LSP binaries are migrated, rebuilt, or left in compatibility locations.
- Desktop userData/store ownership and migration policy.
- Backup retention, encryption, and user-controlled backup location.

## 13. Future Implementation Phases

1. Storage metadata discovery and read-only preview fixtures.
2. Runtime-specific SQLite consistent-backup abstraction using disposable databases.
3. Backup manifest and integrity verification.
4. Copy-first migration prototype behind explicit user invocation.
5. Conflict and rollback fixtures.
6. Opt-in migration UX and documentation.
7. Cross-platform validation in CI.

No item in this list is authorized by Phase 3.4 alone.

## 14. Phase 3.5 Prototype Boundary

The prototype in `packages/opencode/src/storage/migration-prototype.ts` provides only:

- Read-only inventory of an explicit absolute root.
- Metadata-only source/destination preview.
- Outside-root symlink detection.
- SQLite `VACUUM INTO` backup for caller-provided connections.
- Backup integrity and table metadata verification.

It does not use `Global.Path`, open production databases, inspect real authentication files, create migration manifests, migrate records, or change production storage behavior. Its tests use temporary synthetic directories and Bun/Node disposable SQLite databases.
