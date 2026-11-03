# Lato Phase 4.5 Identity Audit Report

## Summary

Phase 4.5 completed as a focused user-facing identity audit. The public
application identity remains Lato and the public CLI command remains
`lato-cli`. The audit found stale platform-status documentation after the
successful `51156f4` cross-platform CI run, but no safe source-level rename that
could be made without risking provider, model, configuration, storage, or
upstream compatibility.

Lato remains a developer preview. It runs from source and has cross-platform CI
artifacts, but it has no Lato-owned release channel, published package,
installer-backed release, signing pipeline, or externally verified first-session
workflow.

## Audited locations

- Phase documents: `LATO_TRANSFORMATION_PLAN.md`, `LATO_TRANSFORMATION_LOG.md`,
  `LATO_COMPATIBILITY_MATRIX.md`, `LATO_KNOWN_ISSUES.md`, and Phase 4.4 reports.
- User documentation: `README.md`, `install.sh`, and `install.ps1`.
- CLI identity and distribution: `packages/opencode/bin`, `packages/opencode/src/cli`,
  `packages/opencode/package.json`, `packages/opencode/script`, and release workflows.
- TUI identity and display: `packages/tui/src`.
- App and desktop links, assets, metadata, storage keys, and localized strings:
  `packages/app`, `packages/desktop`, and `packages/ui`.
- Provider, model, configuration, authentication, and storage paths in
  `packages/core` and `packages/opencode/src`.

## Changes made

- `README.md`: updated Windows/macOS/Linux platform status to reflect the green
  CI matrix and clarified that packaged binaries remain unpublished.
- `LATO_COMPATIBILITY_MATRIX.md`: updated native executable and preference
  validation status, including the macOS x64 build-only limitation.
- `LATO_KNOWN_ISSUES.md`: replaced stale “Windows/macOS unverified” statements
  with the current CI evidence and remaining limitations.
- `LATO_TRANSFORMATION_PLAN.md`: recorded Phase 4.4 completion and Phase 4.5
  completion.
- `LATO_TRANSFORMATION_LOG.md`: added the Phase 4.5 audit entry.
- No production source, workflow, lockfile, asset, provider, model, or
  compatibility code was changed.

## Preserved OpenCode references

The following are intentional and were not renamed:

- Provider IDs and integrations: `opencode`, `opencode-go`.
- OpenCode free-model catalog entries and their model discovery/request paths.
- Compatibility configuration: `opencode.json`, `opencode.jsonc`, `.opencode`,
  `OPENCODE_*`, and legacy configuration discovery.
- Compatibility data: `auth.json`, `mcp-auth.json`, `opencode.db`, storage,
  session, migration, and protocol identifiers.
- Internal package and service namespaces: `@opencode-ai/*` and `@opencode/*`.
- Desktop protocol, storage keys, bundled artifact names, and upstream legal
  attribution.
- Provider-specific OpenCode Console, Zen, Cloudflare, and GitHub integration
  URLs where they are part of the provider/service contract.

These references identify upstream compatibility or a provider/service, not the
Lato application itself.

## OpenCode free models

OpenCode free models were preserved. The audit did not remove or rename model
definitions, provider integrations, model discovery, authentication, request
routing, or provider identifiers required to access them. The TUI still treats
zero-cost models from the `opencode` provider as free; this is provider behavior,
not application branding.

## Remaining identity references

### Intentional compatibility or implementation references

- Root and workspace package names remain OpenCode-derived.
- Configuration, environment, database, auth, protocol, and storage identifiers
  remain OpenCode-compatible.
- Desktop and app persistence keys remain OpenCode-namespaced.
- Internal SDK/client names and service tags remain `@opencode-ai/*`/`@opencode/*`.
- `opencode.local` remains the default mDNS hostname by explicit compatibility
  decision.
- Existing desktop localization still contains OpenCode text and `opencode`
  command instructions; changing all locales would require a separate desktop
  identity and packaging decision.

### Unresolved user-facing links

- TUI and app help links still point to `https://opencode.ai/docs`.
- Provider-specific links still point to OpenCode provider/Console services.
- Desktop documentation and theme links remain upstream links.
- No Lato documentation, feedback, changelog, OAuth, download, or update URL is
  currently verified, so no replacement URL was invented.

### Distribution blockers

- `install.sh` and `install.ps1` target GitHub Release assets, but no Lato-owned
  release is currently published.
- The publication script and inherited publish workflow still contain OpenCode
  package, registry, Docker, AUR, Homebrew, and repository assumptions.
- No signing/notarization or checksum publication pipeline is established.
- `lato-cli` from a fresh external installation is not verified because no
  supported external installation artifact exists.

### mDNS decision

The `opencode.local` default in `packages/opencode/src/cli/network.ts` is
intentional compatibility behavior and was not changed. A Lato-specific default
would risk breaking existing discovery and requires an explicit migration/alias
plan. Users can provide an explicit custom mDNS domain.

## Validation

Read-only inspection performed:

- `git status --short --branch`
- `git log -1 --oneline --decorate`
- Targeted `rg` searches across CLI, TUI, app, desktop, UI, installers,
  workflows, package metadata, provider/model, and compatibility paths.
- `gh run list` confirmed successful `cross-platform-build` and
  `lato-native-validation` runs for `51156f4`.

No tests were run in this audit. No install, build, typecheck, Turbo task, E2E
suite, or full test suite was run.

## Resource usage

No dependency installation or heavyweight workspace operation was performed.
No source, workflow, lockfile, asset, or configuration implementation was
changed.

## Git status

- Branch: `lato-development`
- HEAD: `51156f4ba6b7902504c549fbe0f6b420fa4ef572`
- Working tree: clean at audit start; contains only the documented Phase 4.5 documentation changes now.
- No commit or push was performed.

## Recommended next phase

Phase 5 should not begin until the distribution decision is approved. The next
small implementation phase should instead establish a Lato-owned developer
preview release contract: release tags, artifact URLs, checksums, signing
requirements, and installer ownership. Then add a deterministic provider fixture
and a process-restart session recovery test before claiming production readiness.
