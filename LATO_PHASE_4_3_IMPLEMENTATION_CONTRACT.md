# Lato Phase 4.3 Storage Implementation Contract

Status: proposed contract after audit. Production implementation is not
authorized until this contract receives explicit approval.

## 1. Scope

Phase 4.3 may establish storage ownership metadata, read-only discovery,
synthetic backup abstractions, preview structures, and focused tests. It may not
move, copy, rename, delete, overwrite, or migrate real OpenCode storage.

## 2. Ownership Rules

### Lato-owned now

- New Lato configuration files and `.lato` assets created explicitly by Phase
  4.2 behavior.
- New disposable Lato-only metadata introduced after this contract is approved.
- Future Lato-only rebuildable caches, only when they are not used as a source
  of OpenCode compatibility data.

### OpenCode-compatible/shared

- Legacy configuration files and `.opencode` trees.
- `Global.Path.data`, `cache`, `state`, `tmp`, `repos`, and logs.
- `auth.json` and `mcp-auth.json`.
- SQLite databases, sessions, messages, account data, projects, workspaces,
  events, permissions, and shares.
- Project ID markers, snapshots, plans, plugin metadata, skills, LSP assets,
  and existing desktop storage.

### Legacy read-only during migration work

- Existing OpenCode storage is read-only from migration tooling.
- Legacy TOML/config/TUI compatibility is read-only during discovery and preview.
- Existing OpenCode cache and executable content is never copied automatically.

### Undecided

- Credential ownership and encryption/keychain policy.
- Main database/session ownership.
- Project marker and snapshot ownership.
- Plugin metadata and shared installation root.
- Desktop `userData`, application IDs, store names, and debug exports.
- Backup retention and encryption.

## 3. Platform Roots

Future Lato roots are:

| Platform | Config                               | Durable data                            | State/logs                                            | Cache                              | Temporary        |
| -------- | ------------------------------------ | --------------------------------------- | ----------------------------------------------------- | ---------------------------------- | ---------------- |
| Linux    | `${XDG_CONFIG_HOME:-~/.config}/lato` | `${XDG_DATA_HOME:-~/.local/share}/lato` | `${XDG_STATE_HOME:-~/.local/state}/lato`              | `${XDG_CACHE_HOME:-~/.cache}/lato` | system temp/Lato |
| macOS    | `~/Library/Application Support/Lato` | `~/Library/Application Support/Lato`    | `Application Support/Lato/state`, `Library/Logs/Lato` | `~/Library/Caches/Lato`            | system temp/Lato |
| Windows  | `%APPDATA%\Lato`                     | `%APPDATA%\Lato`                        | `%LOCALAPPDATA%\Lato\state` and `logs`                | `%LOCALAPPDATA%\Lato\cache`        | `%TEMP%\Lato`    |

These roots are not to replace current OpenCode roots for database,
authentication, sessions, project markers, snapshots, or desktop stores without
the product decisions listed below.

## 4. Compatibility Resolution

The compatibility resolver must:

- Continue reading current OpenCode storage paths.
- Prefer an explicit source selected by the user over inferred sources.
- Never silently merge two databases or two credential stores.
- Treat an incomplete Lato destination as non-authoritative.
- Record source identity and ownership in metadata without recording secrets.
- Preserve provider IDs `opencode` and `opencode-go`.
- Preserve current desktop application IDs, protocol identifiers, and store
  names.

## 5. SQLite Backup Contract

The production backup abstraction must provide separate Bun and Node adapter
implementations behind one Effect service boundary.

Required behavior:

- Accept an explicit source connection and destination path.
- Refuse an existing destination unless an explicit overwrite policy is
  approved; default is refusal.
- Never raw-copy `.db`, `-wal`, or `-shm` files.
- Use SQLite-native consistent backup, currently `VACUUM INTO`, or a future
  equivalent.
- Require a coordinated quiescence/backup window before production use.
- Verify `PRAGMA integrity_check`.
- Verify foreign keys where supported.
- Record `user_version`, migration markers, table/schema metadata, and counts.
- Verify source and destination project/session associations without exposing
  message or credential contents.
- Preserve source connection and source database unchanged.
- Clean only the exact failed staging destination.
- Record runtime adapter, database path metadata, timestamps, and verification
  result in a protected manifest.

The existing prototype is not promoted directly to production because it lacks
the coordination and application-level verification requirements above.

## 6. Discovery and Preview API

The first production-facing storage feature, if approved, must be read-only and
explicit-root based.

Discovery returns metadata only:

- Root and normalized relative paths.
- Category and file kind.
- Size, modification time, readability, permissions, and symlink status.
- SQLite recognition and schema metadata without row contents.
- Credential presence/type/provider or MCP server identity without values.
- Unsupported, inaccessible, and outside-root issues.

Preview compares source and destination metadata and reports:

- Missing items.
- Identical files by hash where safe.
- Different files.
- Database conflicts.
- Credential conflicts without hashes or values.
- Unsupported and inaccessible items.
- Estimated size and required permissions.

Neither operation creates destination directories or writes a manifest unless an
explicit preview-output path is supplied by the caller.

## 7. Backup and Approval

Before any migration copy:

1. The user explicitly selects source, destination, and categories.
2. Discovery and preview complete successfully.
3. The user receives a conflict and risk summary.
4. A backup is created and independently verified.
5. Credential and database categories receive separate confirmation.

No startup, installation, upgrade, or first-launch code may call migration.

## 8. Copy-First Migration

Migration writes only to a new staging destination beneath the approved Lato
root.

- Source files are never moved or deleted.
- Destination files are never silently overwritten.
- New files are written to temporary names and promoted only after verification.
- File permissions are preserved where possible; credential files require
  restricted permissions.
- Every operation is recorded in a manifest with source/destination relative
  paths, category, action, hashes where safe, and status.
- Interrupted migration remains explicitly incomplete and cannot become the
  active source.

## 9. Conflict Policy

- Identical non-sensitive files: verify and skip or record as already present.
- Different non-sensitive files: preserve both in a conflict area or require
  explicit selection.
- Databases: never raw-merge; use schema-aware import or keep shared.
- Credentials: never merge automatically; require explicit source selection and
  verification.
- Plugins, skills, and LSP binaries: preserve provenance and require explicit
  replacement approval.
- Project IDs and snapshots: require project-association verification.
- Unsupported or inaccessible files: leave source untouched and mark unresolved.

## 10. Verification and Rollback

Verification must include:

- File hashes and expected counts.
- Destination permissions and path containment.
- SQLite integrity, foreign-key checks, schema/migration markers, and relevant
  record counts.
- Project, session, and message associations without printing content.
- Credential record presence without values.
- Plugin/skill/LSP discovery and provenance.
- Manifest completeness.

Rollback removes or quarantines only destination files created by the migration,
using the manifest. It never deletes or changes the OpenCode source. The source
remains the usable compatibility path until the user explicitly confirms the
destination.

## 11. Product Decisions Required

Implementation cannot safely migrate these categories until explicitly decided:

1. Whether credentials remain shared indefinitely or gain a Lato-owned encrypted
   or OS-keychain-backed store.
2. Whether the main database and session history remain shared or become
   copy-on-write/schema-import storage.
3. Whether project IDs and snapshots retain the `opencode` marker and Git
   layout.
4. Whether plugin metadata, skills, and LSP binaries are copied, rebuilt, or
   permanently shared.
5. Whether desktop `userData`, IDs, stores, protocol schemes, and debug exports
   remain compatibility-owned.
6. Backup encryption, retention, user-selected backup location, and recovery
   policy.
7. Required database quiescence behavior during backup.
8. Exact cross-platform validation requirements for native roots and desktop
   integration.

## 12. Safe Initial Implementation Sequence

After approval, implementation must proceed in this order:

1. Add pure platform-root resolution tests using synthetic homes and environment
   variables; do not connect them to live storage.
2. Refine synthetic storage category detection and redacted metadata contracts.
3. Add an Effect-level SQLite backup interface with explicit Bun and Node
   adapters over disposable databases.
4. Add WAL, lock, failed-verification, integrity, foreign-key, migration-marker,
   and destination-permission fixtures.
5. Add a read-only storage inspection/preview service requiring an explicit root.
6. Add manifest schemas and conflict fixtures without copy behavior.
7. Add interrupted-preview and rollback planning fixtures using synthetic roots.
8. Validate Linux, macOS, and Windows path helpers in focused CI jobs.
9. Stop and obtain separate approval before implementing any real migration
   copy, credential handling, database import, or startup integration.

## 13. Explicit Non-Goals

This contract does not authorize:

- Changing `Global.Path.data`, `state`, `cache`, `repos`, `tmp`, or current logs.
- Moving or copying `auth.json`, `mcp-auth.json`, or account records.
- Changing database schema, migrations, or session IDs.
- Renaming the Git `opencode` project marker.
- Moving snapshots, plans, plugin metadata, or desktop stores.
- Reading real credential values or printing sensitive metadata.
- Automatic migration during startup, installation, upgrade, or first launch.
