# Lato Ownership And Compatibility Contract

Status: Phase 3.0 contract, pending product-owner approval

Repository baseline: `lato-baseline-v1.19.5` (`810c0eba1a7348036f8bdf61e6632d0c36c6876c`)

This document is the authoritative contract for separating Lato product ownership from the retained OpenCode compatibility surface. It describes current guarantees and future decisions; it does not authorize package renames, data migration, publishing, or update enablement.

## 1. Product Ownership

### Lato-owned product surfaces

Lato owns the product identity and future ownership decisions for:

- Product name, logo, wordmark, icons, splash, browser metadata, and desktop presentation.
- The primary `lato` CLI experience and user-facing CLI/TUI wording.
- The desktop application presentation, menus, window title, and platform resources.
- The browser UI as a locally served and embedded application.
- Lato documentation, support channels, release notes, installer, packages, artifacts, and signing identity once those services are established.
- Future update infrastructure and distribution channels.

### Retained upstream compatibility surface

The following remain OpenCode-compatible until an approved migration exists:

- `@opencode-ai/*` and `@opencode/*` identifiers.
- `OPENCODE_*` environment variables.
- `opencode.json`, `opencode.jsonc`, `.opencode`, and existing config paths.
- Existing data, authentication, database, session, protocol, provider, plugin, and skill identifiers.
- Existing `opencode://` handling and desktop application IDs.
- MIT attribution and upstream provenance.

### External ownership boundaries

OpenCode-hosted services are not Lato-owned. Lato must not silently depend on them for UI, updates, installation, release metadata, OAuth, documentation, or support. An external dependency may remain only when it is an explicit compatibility or optional integration decision documented in the compatibility matrix.

## 2. CLI Compatibility

### Executable contract

- `lato` is the primary future executable name.
- `opencode` remains a compatibility executable and must continue to work for existing installations and scripts.
- `lato pr` resolves the current invocation first, then a verified `lato` executable, then a verified legacy `opencode` executable.
- Executable fallback must not use hardcoded machine paths, pass the original `pr` arguments into the relaunch, or create recursive PR invocations.
- A missing executable must produce an actionable error rather than spawning an arbitrary command.

### Distribution contract

The current repository still builds and packages OpenCode-named binaries and packages. A future Lato package migration requires:

- An approved Lato package name and registry owner.
- A defined relationship between Lato packages and existing `opencode-ai` installations.
- Dual-bin or shim behavior during the transition.
- Explicit upgrade, rollback, and uninstall ownership.
- Platform-specific tests for shell shims, Windows launchers, desktop-bundled CLIs, and source execution.

No package or executable rename is authorized by this document.

## 3. Configuration Compatibility

### Current compatibility inputs

Lato continues to read the existing configuration surfaces:

- Global `opencode.jsonc`, `opencode.json`, and legacy `config.json`.
- Project-local `.opencode` directories and project `opencode.json`/`opencode.jsonc` files.
- Existing `OPENCODE_CONFIG`, `OPENCODE_CONFIG_DIR`, and `OPENCODE_CONFIG_CONTENT` environment inputs.
- Existing OpenCode configuration schema and compatibility parsing.

### Future Lato-native configuration

No final Lato-native configuration filename or directory is approved yet. A future name requires explicit product-owner approval and must be introduced as an additive compatibility surface, not as a replacement by implicit rename.

### Precedence contract

Until a Lato-native format is approved:

- Existing OpenCode precedence remains authoritative.
- Environment-provided configuration continues to take precedence according to current implementation.
- Existing global and project files remain readable.
- If Lato-native and OpenCode-native files are eventually supported together, precedence must be deterministic, documented, and diagnosed to the user.
- No existing configuration file may be silently rewritten, renamed, or deleted.

## 4. Data And Storage Compatibility

### Current storage contract

The current implementation retains OpenCode-compatible locations for:

- Global data, cache, config, state, temporary files, logs, and binary cache.
- SQLite databases, sessions, messages, todos, snapshots, and project metadata.
- `auth.json`, MCP authentication, provider credentials, and account state.
- Plugins, skills, plans, tool output, repository caches, and LSP assets.

These locations remain compatibility paths and must not be moved during Phase 3.0.

### Future migration contract

Any future Lato data directory or storage migration must satisfy all of the following:

- Explicit user consent.
- A pre-migration backup or snapshot.
- A preview or dry-run showing source, destination, conflicts, and estimated changes.
- Copy-first behavior before any cleanup.
- No destructive movement of OpenCode data.
- Reversible rollback while both formats remain supported.
- Authentication and database integrity verification.
- Preservation of sessions, provider credentials, plugins, skills, logs, and project metadata.
- Clear handling when both Lato and OpenCode state exist.

Existing OpenCode data must remain accessible even after a future Lato-native location is introduced.

## 5. Protocol And Desktop Compatibility

- `opencode://` remains the active protocol for compatibility.
- A future Lato protocol may be added only with dual handling, explicit registration rules, and a migration path.
- Existing desktop application IDs remain unchanged until an upgrade-safe identity migration exists.
- Existing launchers, pins, deep links, package paths, and desktop data locations must continue to resolve.
- Legacy installation detection must distinguish current Lato-owned files from OpenCode-owned or shared files before any cleanup.
- Desktop resources may display Lato while retaining compatibility-sensitive IDs and artifact names.

No protocol scheme or desktop application ID changes are authorized in Phase 3.0.

## 6. Provider And Agent Compatibility

The following are engine compatibility guarantees and must remain unchanged unless a separate migration is approved:

- Existing provider IDs, including `opencode` and `opencode-go`.
- Saved model selections and provider/model references.
- Provider API-key, OAuth, Console, and user-managed authentication records.
- Agent definitions, built-in agents, custom agents, and agent permissions.
- Tool registry behavior, tool arguments, file operations, shell execution, and tool output handling.
- Permission rules, approval prompts, rejection behavior, and persisted approvals.
- Session execution, conversation history, retries, compaction, and database projections.
- Plugins, skills, MCP servers/tools/resources, and ACP behavior.

Branding and provider-promotion changes must remain outside these execution contracts. Removing promotional UI must not remove provider functionality or stored credentials.

## 7. Distribution And Update Ownership

Before Lato distribution is enabled, Lato must own or explicitly control:

- A package registry namespace and package names.
- A release repository and artifact storage location.
- Signed artifact metadata and verification keys.
- Update feeds and release channels.
- Installers for CLI, desktop, and WSL.
- Platform signing identities and notarization credentials.
- Release notes, documentation, support, and incident-response channels.

The current OpenCode installation module, OpenCode package-manager operations, upstream GitHub workflows, and upstream release metadata are legacy infrastructure. They must remain isolated from normal Lato commands.

All update mechanisms remain disabled or gated until independent infrastructure is verified. No OpenCode installer URL, package registry, release feed, or hosted UI may be used as an implicit Lato fallback.

## 8. Decision Register

The following decisions require explicit product-owner approval:

| Decision | Current status | Required before |
|---|---|---|
| Lato package registry and package names | Not approved | Distribution implementation |
| Lato-native config filename/directory | Not approved | Configuration migration |
| Lato data directory and migration policy | Not approved | Storage migration |
| Lato protocol scheme | Not approved | Protocol migration |
| New desktop application IDs | Not approved | Desktop distribution migration |
| Lato hosted UI/docs/support domains | Not approved | Hosted-service replacement |
| Lato OAuth and Console identity | Not approved | Account integration changes |
| Lato update feed and signing keys | Not approved | Update enablement |
| Lato WSL installer and package-manager ownership | Not approved | Installer implementation |

Until these decisions are approved, preserve compatibility identifiers, keep updates disabled, and avoid automatic migration.

## 9. Phase 3.0 Boundaries

Phase 3.0 establishes contracts only. It does not:

- Rename packages, paths, protocols, provider IDs, or desktop IDs.
- Move or migrate user data.
- Enable installers, updates, publishing, OAuth, or hosted services.
- Rewrite the agent engine, provider system, session system, tool registry, permission engine, MCP, or ACP.

Implementation phases must reference this document before changing an ownership-sensitive surface.
