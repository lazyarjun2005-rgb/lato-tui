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
- Phase 6: partly complete. Upstream update feeds and the WSL auto-installer are disabled; the OpenCode-hosted anonymous free tier is no longer offered and the last TUI brand-line leak ("Open Code" footer) is fixed; Phase 6A user-facing identity cleanup (audit items A1, A2, A5, A7, A8, A11) and Phase 6B remaining identity cleanup (help/docs links, built-in init templates, CLI provider hints, translation/updater/GitHub-integration audits) are implemented in the working tree and **pending review**; Phase 6C identified the remaining decisions and did safe groundwork (translation-prompt product-term fix, GitHub-agent isolation findings, desktop identity migration plan) — also pending review; Phase 6 stays open: non-English locale refresh via a downstreamized translation pipeline, desktop/distribution identity (see 6C migration plan), and GitHub-agent service isolation (see 6C recommendation) remain deferred; distribution identifiers and packaging remain OpenCode-compatible.
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
- Phase 3.9: focused `lato-native-validation` GitHub Actions matrix added for Ubuntu, Windows, and macOS. Its focused identity, state-path, persistence, permission, provider, and runtime tests now pass in CI; the later Phase 4.4/4.5 records document the macOS x64 capability-limited runtime case.
- Phase 4.4: public command identity is `lato-cli`, internal native binaries remain `lato`/`lato.exe`, and cross-platform build/runtime validation is complete for the supported CI capability matrix. macOS x64 runtime is build-only when Bun lacks AVX on the ARM64 runner.
- Phase 4.5: final user-facing identity audit completed; safe documentation status updates were made, compatibility/provider/model references were preserved, and unresolved Lato-owned distribution links remain documented.
- Phase 5: **complete.** CI archive assembly, checksum-manifest generation and validation, explicit-version installers (with the macOS `set -e` defect fixed), installer fixture coverage including darwin zip target selection, a first-session smoke test, a process-restart session recovery test, and CI-installed-stamp assertions are implemented and validated. Prereleases `v0.1.0-preview.1` and `v0.1.0-preview.2` are published from CI-verified assets; `v0.1.0-preview.2` (CI run `41696675487`, commit `c4e7db8`, version-asserted `lato 0.1.0-preview.2` in every runtime-verified target) updated a real Arch Linux x64 (no-AVX2) installation via the official installer, reporting `lato-cli --version` → `lato 0.1.0-preview.2` with user data preserved. Outstanding follow-ups are Phase 6 hardening: Windows/macOS real-machine installer runs, multi-OS execution of the smoke/recovery fixtures in CI, signing, uninstaller, and a future `latest` channel.
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

Phase 6 acceptance criteria, refined by Phase 5 results (the previews are published, so distribution identity is now concrete):

- Decide Lato-owned package/npm/channel identifiers and publish Lato ownership for installed distribution metadata, while package-level compatibility identifiers (`@opencode-ai/*` scope, provider IDs, `.opencode` engine paths) remain intentionally preserved until a compatibility migration is explicitly approved.
- Decide and document the globally installed command surface that ships outside this repository: today `lato-cli` from Releases plus the repository-provided `lato` source command; add any new command names only with snapshot updates.
- Windows and macOS: execute the official installers on real machines, record target selection, checksum verification, and `lato-cli --version`/`--help` results per platform.
- CI: extend the multi-OS test job to execute the first-session smoke fixture and the process-restart recovery fixture on Linux, Windows, and macOS ARM64; keep macOS x64 and Windows ARM64 explicitly build-only.
- Keep the explicit-version installer contract and the fail-closed checksum path; add in-place upgrade verification on Windows/macOS (upgrade without data removal).
- Signing: decide the ownership and plan for macOS notarization and Windows Authenticode; keep prerelease binaries unsigned until that decision executes.
- Decide whether a `latest` channel is ever introduced; if it is, it must resolve only through the Lato GitHub Releases API.
- Keep disabled: upstream update feeds and the WSL auto-installer; no invented endpoints.
- Keep the OpenCode-hosted anonymous free tier off: the `opencode` provider must never load keyless (its loader no longer injects `apiKey: "public"`), and never try to bypass the hosted gateway's anonymous-client eligibility gate by spoofing OpenCode identity; authenticated Zen usage with a real key stays fully supported (recorded 2026-11-04 in the transformation log).
- Never claim an unexecuted verification, and keep proving released artifacts regenerate from CI, never from developer machines.

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
