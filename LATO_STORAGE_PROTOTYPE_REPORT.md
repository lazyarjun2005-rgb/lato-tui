# Lato Storage Prototype Report

Status: Phase 3.5 prototype, complete with limitations

## 1. Executive Summary

Phase 3.5 adds an isolated, non-production prototype for synthetic storage discovery, metadata-only migration preview, and SQLite backup verification. It does not connect to `Global.Path`, the live application database, authentication services, desktop storage, or any user directory.

The existing Bun and Node SQLite adapters both support executing SQLite `VACUUM INTO` through their current APIs. The prototype uses that SQLite-native mechanism rather than copying a live `.db`, `-wal`, or `-shm` file set. Disposable WAL-mode databases were backed up successfully in both runtimes, reopened independently, passed `PRAGMA integrity_check`, preserved schema metadata, and retained synthetic records.

Concurrent-writer behavior was not claimed or stress-tested. A production migration must still define how the application is quiesced or how a consistent backup window is coordinated.

## 2. Scope And Safety Boundaries

Implemented in:

- `packages/opencode/src/storage/migration-prototype.ts`
- `packages/opencode/test/storage/migration-prototype.test.ts`

The prototype:

- Requires an explicit absolute synthetic root.
- Does not inspect default OpenCode or Lato paths.
- Does not connect to production storage.
- Does not read real credentials.
- Does not expose file contents in inventory metadata.
- Does not copy, move, delete, or migrate storage during discovery or preview.
- Uses only temporary test directories and synthetic data.

## 3. Database Architecture Findings

The production database architecture remains unchanged:

- `packages/core/src/database/database.ts` resolves compatibility database paths and configures WAL, synchronous mode, busy timeout, foreign keys, and migrations.
- `packages/core/src/database/sqlite.bun.ts` uses `bun:sqlite` and exposes serialization internally through the client adapter.
- `packages/core/src/database/sqlite.node.ts` uses `node:sqlite` and exposes execution but not the same serialization method.
- `packages/core/src/database/migration.ts` applies transactional migrations and translates legacy Drizzle migration journals.

The prototype intentionally avoids the production `Database.Service` so it can test both runtime APIs with disposable databases.

## 4. Runtime-Specific SQLite Findings

### Bun

- `bun:sqlite` supports `exec`, prepared statements, WAL mode, and close operations.
- `VACUUM INTO` successfully produced an independent backup from a WAL-mode database.
- The backup reopened in Bun and preserved synthetic records.

### Node

- `node:sqlite` `DatabaseSync` is available in the current Node runtime.
- It supports `exec`, prepared statements, and close operations.
- `VACUUM INTO` successfully produced an independent backup from a WAL-mode database.
- The backup reopened in Node and preserved synthetic records.

### Limitation

The prototype does not establish a cross-runtime online-backup API abstraction. It establishes that the same SQLite SQL mechanism works through both currently available adapters for disposable databases.

## 5. Storage Discovery Architecture

`discoverStorage(root)` recursively inventories only an explicitly provided absolute root.

Collected metadata:

- Normalized relative path.
- Category.
- File, directory, or symlink kind.
- Size.
- Modification time.
- Readability.
- SQLite header recognition.
- Inaccessible or outside-root symlink issue.

Categories include:

- Auth.
- Cache.
- Config.
- Database.
- Desktop.
- Logs.
- Plugins.
- Projects.
- Sessions/storage.
- Skills.
- Unknown.

The implementation sorts directory entries for deterministic output and does not follow symlinks outside the supplied root.

## 6. Preview Architecture

`previewStorage(sourceRoot, destinationRoot)` performs metadata-only comparison.

It reports:

- Source inventory.
- Optional destination inventory.
- Identical file conflicts using SHA-256 hashes.
- Different file conflicts.
- Database conflicts.
- Sensitive-file conflicts without hashing or exposing contents.
- Unsupported/inaccessible conflicts.
- Missing-destination warnings.

It does not create destination directories, copy files, write manifests, modify databases, or alter either fixture tree.

## 7. Backup Abstraction

`backupSqlite({ source, destination, open })` provides the isolated backup contract.

Behavior:

- Rejects an existing destination.
- Creates only the requested destination parent directory.
- Executes SQLite `VACUUM INTO` with SQL-string escaping.
- Opens the resulting backup through the supplied runtime adapter.
- Runs `PRAGMA integrity_check`.
- Reads `PRAGMA user_version`.
- Records table names.
- Records backup byte size.
- Removes a partially created destination if verification fails.
- Closes the verification connection.

The source connection remains open and is not modified by the abstraction beyond SQLite’s backup operation.

## 8. WAL Behavior

Tests create WAL-mode databases, insert committed synthetic records, run `VACUUM INTO`, and reopen the backup independently. The committed records are present in both Bun and Node backups.

The prototype does not test writes occurring concurrently with `VACUUM INTO`. Production migration must coordinate a safe snapshot window, application quiescence, or a future online-backup mechanism before copying live user databases.

## 9. Integrity Verification

The prototype verifies:

- Backup opens successfully.
- `PRAGMA integrity_check` returns `ok`.
- Table names are available.
- `PRAGMA user_version` is readable.
- Synthetic session records survive backup.
- Source records remain present.
- Existing backup destinations are not overwritten.
- Failed verification removes only the exact temporary destination.

No real credential or user database content was used.

## 10. Test Results

Command from `packages/opencode`:

```bash
bun test test/storage/migration-prototype.test.ts
```

Result:

- 7 passed.
- 0 failed.
- 20 expect calls.

Covered:

- Synthetic discovery.
- Read-only source preservation.
- Relative-root rejection.
- Outside-root symlink detection.
- Identical and sensitive preview conflicts.
- Bun WAL backup.
- Node WAL backup.
- Existing destination protection.
- Failed-backup cleanup.

Formatting and repository validation:

- Prettier check: passed for Phase 3.5 documents and prototype files.
- `git diff --check`: clean.

## 11. Known Limitations

- No concurrent-writer stress test was performed.
- No production database was opened.
- No OS keychain or encrypted credential migration exists.
- No database schema migration or record-level import exists.
- No migration manifest is created by the preview.
- Discovery categorization is intentionally lightweight and should be reviewed before production use.
- Native macOS and Windows path behavior was not executed on this Linux machine.
- No production path resolver or migration command was added.

## 12. Recommendations

Before implementing production migration:

1. Decide whether the application must quiesce before backup or whether a runtime-specific online backup API is required.
2. Establish a portable SQLite backup abstraction with explicit Bun and Node implementations.
3. Add schema-aware migration manifests and conflict records.
4. Define credential export/import and backup encryption policy.
5. Build disposable interrupted-migration and rollback fixtures.
6. Validate platform-specific storage roots in CI.

No automatic migration should be enabled until these decisions are approved.
