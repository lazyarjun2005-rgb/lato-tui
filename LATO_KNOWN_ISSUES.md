# Lato Known Issues

## Active

- Full workspace typecheck, web build, desktop packaging, and application launch verification have not been run.
- `packages/opencode` typecheck was attempted sequentially during Phase 2.5 but exceeded five minutes and was terminated by SIGTERM without a compiler diagnostic.
- The repository is a shallow clone; upstream history and provenance cannot be fully audited.
- No Lato-owned domains, OAuth applications, package names, release feeds, or installer are available.
- External distribution identity must remain local/development-only until ownership is confirmed.
- OpenCode Console authentication remains an isolated upstream dependency.
- The model catalog may contain `opencode` and `opencode-go` entries from both embedded and runtime sources.
- `lato uninstall` is intentionally unavailable until independent Lato installation ownership is established.
- The legacy OpenCode installation module remains in the repository for future controlled distribution work, but is removed from normal runtime graphs and no longer reachable from normal Lato upgrade/uninstall paths.
- Missing or disabled embedded web UI now returns local HTTP 503 instead of proxying to `app.opencode.ai`; a separately owned Lato hosted UI does not exist yet.
- Full desktop packaging depends on platform tooling and has not yet been verified.
- Upstream self-update tests still describe OpenCode behavior; product update paths are intentionally disabled.
- The GitHub agent integration still targets the upstream OpenCode GitHub app and services.
- WSL automatic installation is unavailable by design. English UI routes users to the distro terminal and preserves manually installed CLI detection; non-English WSL strings still contain OpenCode.
- Desktop Help/documentation links still point to upstream OpenCode docs; upstream community and feedback links were removed.
- Release notes are disabled unless `VITE_LATO_CHANGELOG_URL` is configured.
- Desktop metadata no longer names the upstream publisher, but no verified Lato publisher identity exists yet.
- The approved source icon is only 181x181. The 256px and larger favicon/desktop resources, ICO, and ICNS are resized from it and may look soft at large sizes; macOS icon appearance is unverified.
- Dev, beta, and prod desktop icons use the same approved icon because no channel-specific Lato variants were supplied.
- Primary app and desktop favicon links now use Lato PNG/ICO resources, but the shared `favicon.svg` remains upstream artwork for deferred web/docs/console surfaces.
- Upstream social-share images, web docs, README files, and non-English locales still contain upstream branding.
- The desktop protocol scheme, app IDs, RPM package names, and artifact names still use OpenCode identifiers for compatibility.
- CLI help-text snapshots now reflect Lato output; internal snapshot identifiers and upstream installation tests still contain OpenCode compatibility terminology.
- The default mDNS hostname remains `opencode.local` for compatibility. `lato.local` is available only through explicit configuration.
- `lato pr` uses the current invocation first, then a verified `lato`/`opencode` lookup; full installed-package integration remains unverified.
- Desktop bundled CLI integration still uses OpenCode-compatible `opencode-cli` artifact names and `@opencode-ai/cli-*` packages; platform packaging verification and a future Lato distribution decision are required before renaming them.
- Source builds report the version as `local`.
- Phase 2.75 smoke validation passed in a disposable project, but the results do not establish production or cross-platform release readiness.
- Phase 3.0 ownership decisions remain open; see `LATO_OWNERSHIP_AND_COMPATIBILITY.md` before implementing package, configuration, storage, protocol, OAuth, installer, or update migrations.
- Phase 3.1 primary identity cleanup is limited to verified user-facing copy; external OpenCode documentation, Zen/Console integrations, non-English locale review, and deferred web/console assets remain intentionally unresolved.
- No Lato-native configuration filename has been approved or introduced. A future `lato.json` would require deterministic coexistence, precedence, conflict diagnostics, and migration ownership decisions.
- Existing configuration precedence is complex because global files, explicit `OPENCODE_CONFIG`, project files, `.opencode` directories, `OPENCODE_CONFIG_CONTENT`, managed configuration, and runtime permission overrides participate at different stages; it is preserved and covered by focused tests.
- Storage ownership remains undecided for global auth, provider credentials, the main database/session history, plugin metadata, project IDs/snapshots, and desktop userData stores; see `LATO_STORAGE_AND_MIGRATION_CONTRACT.md`.
- No SQLite online-backup abstraction is established across Bun and Node runtimes; raw copying of a live WAL database is unsafe and migration remains deferred.
- Phase 3.5 provides only an isolated synthetic discovery/preview/SQLite backup prototype; no production migration implementation exists.
- The prototype uses SQLite `VACUUM INTO` successfully in Bun and Node, but concurrent-writer coordination and a portable online-backup abstraction remain unresolved.
- Phase 3.9 added `.github/workflows/lato-native-validation.yml`, but it has not run: Phase 3.9 prohibits commits/pushes and no native Windows/macOS host was available. Windows and macOS remain unverified.
- Native Windows npm-style `.cmd` shims invoke the underlying `bin/opencode` script, so argv-based identity may resolve as `opencode`; compiled `lato.exe` remains the reliable wrapper pending native testing.
- Full interactive `KVProvider`/theme restart, `useKV()` failure logging, packaged CLI/TUI wrappers, and Windows ACL/rename-over-existing behavior remain without native assertions.

## Resolved

- Baseline working tree cleanliness and expected commit verified.
- Dedicated local branch and baseline tag created.
- WSL onboarding no longer downloads the upstream installer; English manual terminal setup is implemented and tested.
- `lato pr` no longer requires a globally installed `lato` executable when the current or legacy `opencode` executable is available.
- `lato uninstall` is guarded before any installation or filesystem operation and has regression coverage for the no-op safety path.
- The OpenCode hosted UI proxy is disabled; embedded UI remains local and missing UI assets return a predictable local error.
- The established `opencode.local` mDNS default is restored, with explicit custom hostname support preserved.
- CLI help snapshots were regenerated for the current Lato user-facing output.
- Approved Lato wordmark and icon are integrated into the primary logo, splash, favicon, and desktop icon paths.
- `V1_API_MIGRATION.md` no longer references the deleted usage-exceeded dialog.
- CLI/TUI and browser UI development startup were user-verified.
- CLI display identity now follows the invoked executable: `lato` is primary while legacy `opencode` remains supported.
- Existing global/project configuration discovery, JSON/JSONC parsing, environment overrides, merge behavior, TUI configuration discovery, and V2 compatibility behavior were verified by focused configuration tests.
- Existing storage paths and sensitive-data locations were inventoried in `LATO_STORAGE_AND_MIGRATION_CONTRACT.md`; no user data was read, copied, moved, or modified.
- Synthetic storage discovery, read-only preview, WAL backup, and integrity verification were tested without accessing real user storage.
- Browser and desktop preference namespaces remain shared or undecided; Phase 3.6 isolates only the CLI/TUI KV preference state.
- Explicit `theme` values in shared OpenCode-compatible configuration remain shared by design; only interactive TUI theme selection is isolated.
- Phase 3.7 verified Linux and platform-independent identity behavior. Phase 3.9 added Linux native coverage for unreadable files, read-only state directories, atomic replacement, temp-file cleanup, concurrent writes, and theme-key round-trips; native Windows/macOS, packaged desktop, and browser namespace isolation remain unverified.
- Project discovery, inspection, file reads/writes, Python and shell execution, permission approval/rejection, session persistence after backend restart, and provider switching were user-verified in `~/lato-smoke-test`.
- The TUI theme root cause and preference path isolation are documented in `LATO_RUNTIME_IDENTITY_AND_PREFERENCE_ISOLATION.md`.
- Cross-platform preference validation and its provider-test timing limitation are documented in `LATO_CROSS_PLATFORM_PREFERENCE_VALIDATION.md`.
- Phase 3.9 verified temporary compiled `lato` and `opencode` executable identity on Linux using a test-only Bun compile; packaged distribution wrappers and native Windows/macOS execution remain pending.
