# Lato Transformation Plan

## Baseline

- Repository: `/home/arjun/Desktop/lato-base`
- Upstream: `https://github.com/anomalyco/opencode.git`
- Baseline version: OpenCode `v1.19.5`
- Baseline commit: `810c0eba1a7348036f8bdf61e6632d0c36c6876c`
- Baseline tag: `lato-baseline-v1.19.5`
- Working branch: `lato-development`
- Package manager: Bun `1.4.4`
- License: MIT

## Non-negotiable constraints

1. Preserve the existing architecture and functionality.
2. Do not rebuild the application.
3. Do not add product features.
4. Do not remove generic providers or generic free models.
5. Do not perform blanket find-and-replace operations.
6. Do not rename compatibility-sensitive internals without a migration strategy.
7. Do not publish, push, or modify upstream services.
8. Do not delete or migrate user data without approval.
9. Preserve the MIT license and upstream attribution.
10. Never claim an unexecuted build or test passed.

## Progress

- Phase 3: primary identity complete. CLI, TUI, app, shared UI, and desktop product identity use Lato. The approved wordmark and icon are integrated into primary logo, splash, favicon, notification, and desktop icon paths.
- Phase 5: partly complete. Go upsell UI and triggers are removed; Zen is optional and no longer auto-preferred.
- Phase 6: partly complete. Upstream update feeds and the WSL auto-installer are disabled; distribution identifiers and packaging remain OpenCode-compatible.
- Phase 8: focused validation complete. Full workspace typecheck, web build, desktop packaging, and E2E verification remain deferred.
- Phase 2.5: safety gates implemented. PR executable fallback, uninstall blocking, hosted UI isolation, installation-service isolation, mDNS compatibility, and CLI snapshot review are complete; package typecheck was attempted but exceeded the five-minute resource limit.
- Phase 2.75: local validation complete for the CLI/TUI, browser UI, project flow, file operations, command execution, permissions, session persistence, and provider switching. These are development smoke results, not production-build or cross-platform evidence.
- Phase 3.1: primary product identity review completed. A remaining user-facing CLI error reference was changed to `lato models`; compatibility identifiers and external OpenCode-owned URLs remain intentionally preserved or deferred.
- Phase 3.2: CLI identity is invocation-aware. `lato` is the primary display name, legacy `opencode` remains functional, and focused executable-resolution tests cover source, compiled, and fallback paths. Desktop-bundled CLI artifact names remain compatibility-sensitive and were not renamed.
- Phase 3.3: configuration architecture traced and compatibility verified. No new `lato.json` filename was introduced because coexistence and precedence require an explicit product decision; existing OpenCode configuration behavior remains authoritative.
- Phase 3.4: storage architecture inventoried and future migration contract defined. Existing OpenCode-compatible paths remain unchanged; no user-data migration or storage resolver was implemented.
- Phase 3.5: isolated synthetic storage discovery, metadata-only preview, and Bun/Node SQLite backup prototype completed. No production storage behavior changed.
- Phase 3.6: TUI runtime preference identity is isolated. `lato` now uses a Lato-specific KV state namespace while `opencode` retains the existing compatibility state path; engine, config, provider, session, and database paths remain unchanged.
- Phase 3.7: Linux and platform-independent preference identity validation completed. Native Windows/macOS, packaged desktop, browser namespace isolation, and preference failure-path validation remain pending.
- Phase 3.8: TUI preference reliability coverage added for Windows-style normalization, concurrent atomic writes, and malformed JSON preservation. Native Windows/macOS filesystem semantics remain unverified.
- Phase 3.9: focused `lato-native-validation` GitHub Actions matrix added for Ubuntu, Windows, and macOS. Linux native identity, state-path, persistence, permission, and provider tests executed and passed; native Windows/macOS execution is pending a push-capable CI run.
- Remaining identity work: upstream docs/web/console imagery, social cards, non-English locales, and Lato-owned distribution identity.
- Phase 3.0 ownership and compatibility authority: `LATO_OWNERSHIP_AND_COMPATIBILITY.md`.

## Phase plan

### Phase 0 - Baseline and safety

- Verify git state, versions, disk, and environment variable names (never values).
- Create `lato-development`.
- Tag the untouched baseline.
- Establish transformation and compatibility documents.

### Phase 1 - Development environment

- Verify or install Bun `1.4.4` locally.
- Install dependencies with the committed Bun lockfile.
- Verify workspace package resolution.

### Phase 2 - Baseline verification

- Run package-level typechecks and focused tests.
- Verify CLI, TUI, server, and web startup/build where practical.
- Record upstream issues separately from transformation regressions.

### Phase 3 - Lato identity

- Replace user-facing product identity in CLI, TUI, web, desktop, and packaging metadata.
- Keep internal package names, provider IDs, environment variables, and data paths until compatibility plans exist.
- Update assets only after provenance review.

### Phase 4 - Configuration and data compatibility

- Retain OpenCode paths and file formats as legacy inputs.
- Do not move or overwrite existing data.
- Add compatibility tests and documentation for any new Lato-native surface.
- Treat data migration as a separately approved operation.

### Phase 5 - Provider and Zen separation

- Keep Zen optional.
- Remove Go subscription promotion and OpenCode-specific upsells from Lato UI.
- Remove automatic OpenCode provider prioritization.
- Preserve third-party providers, BYOK, and third-party free models.
- Keep OpenCode Console account dependency isolated and documented.

### Phase 6 - Distribution identity

- Audit CLI binary names, package metadata, desktop IDs, protocol schemes, update feeds, CI, Docker, Nix, and extensions.
- Disable or replace any OpenCode release feed for local Lato builds.
- Do not publish or invent external endpoints.

### Phase 7 - Documentation and legal

- Update user-facing README and documentation identity.
- Preserve MIT attribution and upstream provenance.
- Document retained OpenCode references and their reasons.

### Phase 8 - Verification

- Run typecheck, focused tests, CLI/TUI smoke checks, web build, and desktop build where supported.
- Add regression coverage for compatibility and provider separation.
- Record exact commands and observed results.

### Phase 2.5 - Safety and upstream isolation

- Keep `lato pr` compatible with the currently invoked executable and legacy `opencode` fallback.
- Block destructive uninstall behavior until Lato installation ownership exists.
- Serve local embedded UI only; return a local unavailable response instead of proxying to OpenCode-hosted UI.
- Keep the legacy installation module available for later distribution work but remove it from normal runtime graphs and Lato-facing paths.
- Preserve `opencode.local` as the default mDNS hostname while allowing explicit custom domains.
- Refresh user-facing CLI help snapshots without renaming compatibility-oriented snapshot identifiers.

## Compatibility policy

- Internal package scope remains `@opencode-ai/*` for now.
- Runtime service tags remain `@opencode/*` for now.
- Provider IDs remain unchanged initially.
- Config paths, environment variables, `auth.json`, and SQLite compatibility remain unchanged initially.
- User-facing Lato identity must not be coupled to Zen or Go.

## Exit criteria

- Lato branding is present throughout the user-facing application.
- Existing capabilities and generic provider integrations remain intact.
- Zen remains optional and does not drive product identity.
- OpenCode Go promotion is absent from Lato UI.
- Existing configuration and data remain readable.
- No accidental OpenCode update feed is used.
- MIT attribution is preserved.
- Builds/tests are actually executed and recorded.
