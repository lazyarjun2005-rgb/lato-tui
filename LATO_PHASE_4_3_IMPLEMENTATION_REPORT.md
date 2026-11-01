# Lato Phase 4.3 Implementation Report

## Status

Implemented the approved synthetic, read-only Phase 4.3 scope. No production
storage paths were changed, no real OpenCode storage was opened, and no
credentials or user databases were inspected.

Phase 4.4 was not started.

## Implemented

### Platform-root resolution

Added pure `resolveStorageRoots()` resolution in
`packages/opencode/src/storage/migration-prototype.ts` for Linux, macOS, and
Windows.

The resolver accepts an explicit platform, home, and environment map. It does
not read the filesystem or application globals.

Covered roots include:

- Linux XDG config/data/state/cache/log roots.
- macOS Application Support, Caches, Logs, and temporary roots.
- Windows APPDATA, LOCALAPPDATA, and TEMP roots.

### Read-only discovery and previews

The existing synthetic discovery and preview implementation remains isolated to
caller-supplied absolute roots. It now has a versioned migration-manifest
projection without any copy, promotion, or migration behavior.

Discovery continues to report only metadata, including category, path, kind,
size, timestamps, readability, SQLite recognition, symlink issues, and
unsupported/inaccessible entries.

Sensitive categories are not hashed or exposed in preview conflicts.

### Versioned manifest

Added `MigrationManifest` schema version `1` with:

- Manifest kind.
- Source and destination roots.
- Creation timestamp.
- Preview/staged/verified/failed/rolled-back status vocabulary.
- Per-entry relative path, category, kind, action, and conflict metadata.

Added `manifestFromPreview()` and `validateMigrationManifest()`.

The manifest is an in-memory validation/projection contract only. No manifest is
automatically written to a user or application storage root.

### SQLite backup improvements

The existing `VACUUM INTO` abstraction now additionally:

- Rejects relative destination paths.
- Verifies `PRAGMA integrity_check`.
- Verifies `PRAGMA foreign_key_check`.
- Captures and compares `PRAGMA user_version`.
- Captures and compares table names.
- Captures and compares deterministic migration-journal table row counts.
- Preserves existing destination protection.
- Removes only the requested destination after verification failure.

The source connection remains open and the source database remains unchanged.

No live database, `Database.Service`, WAL sidecar, authentication file, or
production storage path was used.

## Tests

Focused synthetic test command:

```text
packages/opencode: bun test test/storage/migration-prototype.test.ts
```

Result:

- 11 passed.
- 0 failed.
- 32 expect calls.

Covered:

- Linux, macOS, and Windows root fixtures.
- Synthetic discovery and source preservation.
- Relative-root rejection.
- Outside-root symlink detection.
- Identical, different, database, and sensitive preview conflicts.
- Versioned manifest creation and validation.
- Invalid manifest rejection.
- Bun WAL backup.
- Node WAL backup.
- Migration-journal metadata preservation.
- Integrity and foreign-key verification.
- Relative destination rejection.
- Existing destination protection.
- Failed-backup cleanup.

Formatting and whitespace checks:

- Prettier passed for changed Phase 4.3 files.
- `git diff --check` passed.

## Limitations

- No concurrent-writer stress test was added.
- No production database was opened.
- No online backup or quiescence coordinator exists.
- No database schema-aware import exists.
- No credential migration or keychain integration exists.
- No migration copy, promotion, rollback command, or startup integration exists.
- Manifest persistence and backup retention are not implemented.
- Native macOS and Windows execution remains unverified on this Linux host.
- No full workspace build, typecheck, lint, E2E, or full test suite was run.

## Remaining Product Decisions

The following remain intentionally undecided:

1. Credential ownership, encryption, and OS-keychain policy.
2. Main database and session ownership.
3. Project ID marker and snapshot ownership.
4. Plugin metadata, skill, and LSP asset ownership.
5. Desktop userData, application IDs, store names, and debug export ownership.
6. Backup encryption, retention, and recovery policy.
7. Database quiescence requirements for any future live backup.
8. Whether and when any real migration command may be introduced.

## Safety Confirmation

- Existing Phase 4.1 and Phase 4.2 changes were preserved.
- Existing production storage paths were not changed.
- No real OpenCode configuration was modified.
- No real credentials were read or printed.
- No database, session history, auth file, MCP credential file, project marker,
  snapshot, or desktop store was moved, renamed, deleted, or overwritten.
- Provider IDs `opencode` and `opencode-go` remain unchanged.
- No commit, push, reset, clean, stash, branch switch, or history rewrite was
  performed.
