# Lato Phase 4.3 Storage Ownership Audit

Status: audit and decision-contract stage only. No production storage changes,
database access, credential access, migration, or user-data modification was
performed.

Repository: `/home/arjun/Desktop/lato-base`

## Executive Summary

Phase 4.2 established Lato configuration ownership while intentionally keeping
OpenCode data, authentication, databases, sessions, state, cache, and project
metadata compatible. Phase 4.3 must not infer that a Lato configuration root
authorizes a second Lato storage tree.

The current application still has one compatibility-oriented storage graph:

- `Global.Path.data`, `cache`, `state`, `tmp`, `repos`, and `log` remain
  OpenCode-derived paths.
- Authentication and MCP OAuth files are plaintext files protected primarily by
  filesystem permissions and locks.
- SQLite owns sessions, messages, parts, projects, workspaces, permissions,
  account records, events, shares, and related state.
- Project IDs use the repo-local `opencode` marker in Git common storage.
- Snapshots use Git repositories under the global data root.
- Desktop settings and stores use Electron `userData` and compatibility store
  names.

The existing storage prototype is safe as an isolated synthetic prototype. It
is not yet a production migration mechanism because concurrent-writer
coordination, a shared Bun/Node backup service, schema-aware import, credential
policy, manifests, and rollback execution remain unresolved.

## 1. Current Storage Ownership

### Configuration

Phase 4.2 introduced Lato global/project configuration names and paths while
keeping OpenCode files readable. New Lato configuration is Lato-owned. Existing
OpenCode configuration is compatibility-shared because writers may update an
active legacy file when no higher-priority Lato file exists.

Relevant code:

- `packages/core/src/global.ts`
- `packages/opencode/src/config/config.ts`
- `packages/opencode/src/config/paths.ts`
- `packages/opencode/src/config/tui.ts`

Classification: **Lato-owned for new Lato files; OpenCode-compatible/shared for
legacy files**.

### Authentication and provider credentials

Provider credentials are stored in `${Global.Path.data}/auth.json` by
`packages/opencode/src/auth/index.ts`. The file is written with mode `0600`.
Runtime environment credentials are not storage migration inputs.

No keychain or encryption-at-rest abstraction was found in the inspected path.

Classification: **OpenCode-compatible/shared; Lato ownership undecided**.

Provider IDs `opencode` and `opencode-go` remain unchanged.

### MCP credentials

MCP OAuth tokens, client registration details, code verifiers, and OAuth state
are stored in `${Global.Path.data}/mcp-auth.json` by
`packages/opencode/src/mcp/auth.ts`. Mutations use `EffectFlock` and write mode
`0600`.

Classification: **OpenCode-compatible/shared; Lato ownership undecided**.

No migration may print token values, copy the file automatically, or merge
records without explicit credential consent.

### Main database and session history

`packages/core/src/database/database.ts` resolves the database under
`Global.Path.data` or `OPENCODE_DB`. Production databases use WAL mode,
`synchronous=NORMAL`, a busy timeout, foreign keys, and transactional schema
migrations.

The database contains or supports:

- Sessions, messages, parts, todos, and context snapshots.
- Projects, workspaces, and project directories.
- Saved permissions.
- Account and Console records.
- Events and shares.
- Migration metadata.

Classification: **OpenCode-compatible/shared; Lato ownership undecided**.

This is the highest-risk migration surface. No database path change, schema
change, raw file copy, or record-level import is authorized by this audit.

### Project IDs, snapshots, and plans

Project identity is derived from repository information and may be persisted in
the Git common directory as a file named `opencode`. The marker is written by
`packages/core/src/project.ts` and remains a compatibility marker.

Snapshots are Git repositories under:

```text
${Global.Path.data}/snapshot/{projectID}/{worktreeHash}
```

Plans may live under project `.opencode/plans` or global data plans.

Classification:

- Project ID marker: **OpenCode-compatible/shared**.
- Snapshots: **OpenCode-compatible/shared**.
- Plans: **OpenCode-compatible/shared; future Lato project assets may be
  Lato-owned only when explicitly separated**.

The `opencode` project marker must not be renamed automatically. Snapshot
repositories must not be copied or relocated without a project-association
manifest and verification.

### Plugins, skills, and LSP assets

Existing `.opencode` directories, plugin metadata, downloaded skills, binary
cache, LSP binaries, and plugin dependencies are compatibility surfaces.

Phase 4.2 adds `.lato` directories and Lato-native plugin/config targets for new
writes. New assets created explicitly under `.lato` can be Lato-owned. Existing
`.opencode` assets remain shared and readable.

Classification:

- Existing `.opencode` plugins/skills/LSP assets: **OpenCode-compatible/shared**.
- New `.lato` plugins/skills/assets: **Lato-owned**, subject to provenance and
  executable-content review.
- Existing plugin metadata and caches: **Undecided/shared**.

Downloaded executable content must not be trusted or copied solely because it
exists in an OpenCode cache.

### Logs, cache, and temporary files

CLI logs use `${Global.Path.log}` and direct traces use the global log root.
Tool output uses `${Global.Path.data}/tool-output`. Skills, models, binaries,
and other rebuildable content use cache/state/data paths. Temporary files use
`${Global.Path.tmp}`.

Classification:

- Current logs: **OpenCode-compatible/shared**.
- Current cache and binary/LSP cache: **OpenCode-compatible/shared and
  rebuildable**.
- Current temporary files: **OpenCode-compatible/shared and ephemeral**.
- Future Lato-only logs/cache generated after an explicit root decision:
  **Lato-owned candidate**.

No current cache may be bulk-copied automatically. Rebuildable caches should be
recreated from owned, verified sources rather than migrated blindly.

### Desktop `userData` and debug exports

Electron settings, renderer stores, drafts, crash data, logs, network logs,
background CLI staging, and cleanup are rooted at `app.getPath("userData")`.
Store names and application IDs remain compatibility-sensitive. Tauri `.dat`
migration already copies keys into Electron stores without overwriting existing
keys.

Debug exports are user-initiated zip files written to Downloads and can include
logs, paths, metadata, crash data, and other sensitive diagnostics.

Classification:

- Desktop `userData`, IDs, store names, and Tauri compatibility: **shared**.
- Desktop logs/crash data: **OpenCode-compatible/shared; future Lato ownership
  undecided**.
- Debug exports: **Undecided; user-controlled compatibility output**.

No desktop ID, protocol, `userData` root, store name, or debug export naming
change is authorized by Phase 4.3.

## 2. Ownership Matrix

| Category                    | Current classification     | Safe now                             | Must remain compatible          | Migration risk |
| --------------------------- | -------------------------- | ------------------------------------ | ------------------------------- | -------------- |
| New Lato config             | Lato-owned                 | Yes, additive writes                 | Legacy config reads             | Medium         |
| Legacy OpenCode config      | OpenCode-compatible/shared | Read and targeted update only        | Yes                             | High           |
| Provider auth               | Shared, undecided          | Metadata-only discovery              | `auth.json`, provider IDs       | Critical       |
| MCP OAuth                   | Shared, undecided          | Presence metadata only               | `mcp-auth.json`                 | Critical       |
| Main SQLite database        | Shared, undecided          | Synthetic backup prototype only      | DB path/schema/session IDs      | Critical       |
| Sessions/messages           | Shared, undecided          | Read-only metadata preview           | Existing database               | Critical       |
| Project IDs                 | Shared                     | Read-only marker discovery           | Git `opencode` marker           | High           |
| Snapshots                   | Shared                     | Metadata-only discovery              | Git snapshot associations       | High           |
| Plans                       | Shared                     | Explicit new Lato plans only         | Existing `.opencode/plans`      | Medium         |
| Existing plugins/skills/LSP | Shared                     | Read/discover in place               | `.opencode`, caches, provenance | High           |
| New `.lato` assets          | Lato-owned                 | Explicit writes                      | Do not duplicate `.opencode`    | Medium         |
| Logs                        | Shared                     | Redacted metadata preview            | Existing log roots              | Medium         |
| Cache/binaries              | Shared/rebuildable         | Rebuild metadata only                | Existing cache remains readable | Medium         |
| Temporary files             | Shared/ephemeral           | No migration                         | Existing runtime behavior       | Low            |
| Desktop userData            | Shared/undecided           | Read-only inventory by explicit root | IDs/store names                 | High           |
| Debug exports               | Undecided                  | Existing user-initiated export only  | Existing naming and redaction   | Medium         |

## 3. SQLite Backup Prototype Review

The prototype in `packages/opencode/src/storage/migration-prototype.ts` uses
SQLite `VACUUM INTO`, not raw copying of `.db`, `-wal`, or `.shm` files.

### What is established

- Bun `bun:sqlite` disposable WAL databases backed up successfully.
- Node `node:sqlite` disposable WAL databases backed up successfully.
- Backups reopen independently.
- `PRAGMA integrity_check` is executed.
- `PRAGMA user_version` and table names are recorded.
- Synthetic committed records survive.
- Existing destinations are not overwritten.
- Failed verification removes only the requested destination.

### What is not established

- No concurrent-writer stress or application quiescence test exists.
- No production `Database.Service` backup method exists.
- Bun exposes an internal serialization method; Node does not expose an
  equivalent client method.
- The prototype's shared `SqliteConnection` adapter proves SQL portability, not
  a production Effect service abstraction.
- No foreign-key check, migration-journal verification, row-count verification,
  schema hash, or application-level session/project association verification is
  performed.
- Destination permissions and ownership are not part of the prototype result.
- Destination-root containment is not enforced by `backupSqlite` itself.
- There is no backup manifest, retention policy, encryption policy, or rollback
  command.

### Safety conclusion

`VACUUM INTO` is the correct foundation for a future consistent SQLite backup,
but it is only production-safe after the application defines a quiescence or
coordinated backup window. A live WAL database must never be copied with a raw
filesystem copy of the main file and sidecars.

## 4. Proposed Platform Storage Roots

These are proposed future roots only. They do not authorize changing current
OpenCode-compatible paths.

### Linux

```text
config: ${XDG_CONFIG_HOME:-~/.config}/lato
data:   ${XDG_DATA_HOME:-~/.local/share}/lato
state:  ${XDG_STATE_HOME:-~/.local/state}/lato
cache:  ${XDG_CACHE_HOME:-~/.cache}/lato
tmp:    ${TMPDIR:-system-temp}/lato
logs:   ${XDG_STATE_HOME:-~/.local/state}/lato/log
```

### macOS

```text
config: ~/Library/Application Support/Lato
data:   ~/Library/Application Support/Lato
state:  ~/Library/Application Support/Lato/state
cache:  ~/Library/Caches/Lato
logs:   ~/Library/Logs/Lato
tmp:    system temporary directory under a Lato namespace
```

### Windows

```text
config: %APPDATA%\Lato
data:   %APPDATA%\Lato
state:  %LOCALAPPDATA%\Lato\state
cache:  %LOCALAPPDATA%\Lato\cache
logs:   %LOCALAPPDATA%\Lato\logs
tmp:    %TEMP%\Lato
```

The database and credentials must not use these proposed roots until their
ownership decisions are approved. The first safe use is new disposable,
rebuildable, or explicitly Lato-only state.

## 5. OpenCode Accessibility

Existing OpenCode data remains accessible through explicit compatibility paths:

- Existing OpenCode configuration roots remain readable through Phase 4.2.
- Existing auth and MCP files remain at their current data paths.
- Existing SQLite databases remain the active database source.
- Existing `.opencode` project assets remain discoverable.
- Existing Git project ID markers remain readable and writable only through
  compatibility behavior.
- Existing snapshots and plans remain in place.
- Existing desktop IDs, `userData`, stores, and Tauri migration sources remain
  unchanged.

No startup fallback should copy or mirror the OpenCode tree into Lato roots.
Where a future Lato-owned root exists, readers must either continue reading the
OpenCode source or use an explicit, verified migration manifest.

## 6. Migration Architecture

Any future migration must use these explicit stages:

1. **Read-only discovery:** resolve explicitly selected source/destination roots;
   collect metadata, categories, permissions, hashes where safe, database
   schema state, and credential presence without values.
2. **Preview:** show source, destination, categories, sizes, conflicts,
   unsupported items, database status, and risk warnings. No writes.
3. **Backup:** create a manifest-backed backup. Use `VACUUM INTO` through a
   runtime-specific database abstraction after a controlled backup window.
4. **Explicit approval:** require category-level user approval. Credentials and
   databases require separate consent from ordinary files.
5. **Copy-first staging:** copy into a staging destination under the approved
   root. Never move or delete the source.
6. **Conflict resolution:** identical files may be verified and skipped;
   differing files remain as conflicts or require a user decision. Databases,
   credentials, plugins, and executable assets cannot be raw-merged.
7. **Verification:** verify hashes, file counts, permissions, SQLite integrity,
   foreign keys, schema/migration markers, row counts, project associations,
   and credential record presence without values.
8. **Promotion:** mark only a completely verified category as available. Never
   make an incomplete destination authoritative.
9. **Rollback:** remove or quarantine only files created by the migration,
   using the manifest. Leave the OpenCode source untouched and usable.
10. **Retention:** retain the source and backup until explicit post-migration
    confirmation and a user-selected retention policy.

Migration must never run at startup, install, upgrade, first launch, or ordinary
configuration loading.
