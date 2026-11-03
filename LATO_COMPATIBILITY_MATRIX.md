# Lato Compatibility Matrix

The authoritative ownership, migration, and compatibility contracts are defined in [`LATO_OWNERSHIP_AND_COMPATIBILITY.md`](LATO_OWNERSHIP_AND_COMPATIBILITY.md). This matrix summarizes the current compatibility surface; it does not authorize migrations.

Storage inventory and migration rules are defined in [`LATO_STORAGE_AND_MIGRATION_CONTRACT.md`](LATO_STORAGE_AND_MIGRATION_CONTRACT.md), with the Phase 4.3 audit and proposed implementation contract in [`LATO_PHASE_4_3_STORAGE_AUDIT.md`](LATO_PHASE_4_3_STORAGE_AUDIT.md) and [`LATO_PHASE_4_3_IMPLEMENTATION_CONTRACT.md`](LATO_PHASE_4_3_IMPLEMENTATION_CONTRACT.md).

The isolated storage prototype and Phase 4.3 implementation results are documented in [`LATO_STORAGE_PROTOTYPE_REPORT.md`](LATO_STORAGE_PROTOTYPE_REPORT.md) and [`LATO_PHASE_4_3_IMPLEMENTATION_REPORT.md`](LATO_PHASE_4_3_IMPLEMENTATION_REPORT.md).

Phase 4.4 distribution findings and the Linux-first implementation plan are documented in [`LATO_PHASE_4_4_DISTRIBUTION_AUDIT.md`](LATO_PHASE_4_4_DISTRIBUTION_AUDIT.md).

| Surface                 | Current identity                                 | Lato status                                                                     | Compatibility rule                                           |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| CLI command             | `lato-cli`                                       | Phase 4.4: public command renamed to `lato-cli`; internal binary remains `lato` | Do not reintroduce an OpenCode application bin               |
| CLI user guidance       | `lato-cli`                                       | Help and completion use `lato-cli`; provider IDs unchanged                      | Preserve commands and flags; do not direct users to OpenCode |
| CLI display identity    | `lato`                                           | Constant Lato identity                                                          | Do not derive application identity from invocation           |
| Desktop bundled CLI     | `opencode-cli` / `@opencode-ai/cli-*`            | Existing bundled service path retained                                          | Do not rename until distribution ownership is approved       |
| Global config files     | `opencode.jsonc`, `opencode.json`, `config.json` | Supported and tested                                                            | Preserve discovery and existing merge order                  |
| Project config files    | `opencode.jsonc`, `opencode.json`                | Supported and tested                                                            | Preserve project/worktree discovery behavior                 |
| Config directory        | `~/.config/opencode`, `.opencode`                | Retained                                                                        | Do not move or rename                                        |
| Config environment      | `OPENCODE_CONFIG*`, `OPENCODE_*`                 | Preserved and tested                                                            | Do not rename or reinterpret existing variables              |
| Lato-native config      | `lato.jsonc`, `lato.json`, `.lato`               | Phase 4.2 additive ownership                                                    | Preserve legacy OpenCode reads and active-file writes        |
| PR CLI relaunch         | Current executable                               | Current invocation, then `lato` only                                            | No OpenCode executable fallback                              |
| Root package name       | `opencode`                                       | Pending                                                                         | Private; change only after distribution decision             |
| Published CLI package   | `opencode-ai`                                    | Exposes only `lato`; package name pending                                       | Do not publish inherited OpenCode artifacts as Lato          |
| Workspace scope         | `@opencode-ai/*`                                 | Retained initially                                                              | Internal imports must keep resolving                         |
| Runtime service tags    | `@opencode/*`                                    | Retained initially                                                              | No behavior change                                           |
| Provider IDs            | `opencode`, `opencode-go`                        | Retained, no promotion or automatic priority                                    | Keep provider compatibility; do not re-add upsells           |
| Config dir              | `~/.config/opencode`                             | Retained                                                                        | Must remain readable                                         |
| Data dir                | `~/.local/share/opencode`                        | Retained                                                                        | Must not be moved or deleted                                 |
| Auth file               | `${data}/auth.json`                              | Retained                                                                        | Must remain readable                                         |
| MCP auth                | `${data}/mcp-auth.json`                          | Retained/shared                                                                 | Treat as secret; no automatic migration                      |
| Database                | `${data}/opencode.db`                            | Retained                                                                        | No destructive migration                                     |
| Session/storage data    | `${data}/storage`, snapshots, plans              | Retained/shared                                                                 | Copy-first migration only                                    |
| Plugin/skill state      | `.opencode`, state/cache roots                   | Retained/shared                                                                 | Preserve discovery and provenance                            |
| Desktop user data       | Electron `app.getPath("userData")`               | Retained/shared                                                                 | Preserve IDs/store names; platform paths unverified          |
| Storage prototype       | Synthetic roots only                             | Roots, manifest, preview, WAL backup, integrity tested                          | No production path or user data access                       |
| TUI preferences         | `${state}/kv.json`                               | CLI uses sibling `lato` state only                                              | Do not migrate or copy existing preferences automatically    |
| Preference validation   | Linux/Windows/macOS ARM64 CI                     | Identity, paths, persistence, permissions verified                              | macOS x64 runtime build-only without AVX                    |
| Native validation CI    | `.github/workflows/lato-native-validation.yml`   | Ubuntu/Windows/macOS focused test matrix                                        | Must not publish, deploy, or release                         |
| Native executable       | `bin/lato`, `lato.exe`                           | Linux/Windows x64 + macOS ARM64 CI; macOS x64 build verified                    | Preserve Lato executable; no OpenCode application fallback   |
| Project config          | `.opencode`                                      | Retained                                                                        | Must remain readable                                         |
| Env prefix              | `OPENCODE_*`                                     | Retained                                                                        | No breaking rename                                           |
| Desktop product name    | `Lato`                                           | Changed                                                                         | Local data paths and app IDs preserved                       |
| Desktop protocol        | `opencode://`                                    | Retained                                                                        | Add Lato scheme only with compatibility plan                 |
| Update feeds            | `anomalyco/opencode*`                            | Disabled in CLI, TUI, server, and builder config                                | Do not enable without a Lato-owned feed                      |
| Lato uninstall          | No independent package ID                        | Disabled in development builds                                                  | Never remove OpenCode packages or shared user data           |
| Lato distribution       | No Lato-owned registry/release identity          | Local Linux path verified; public distribution deferred                         | Do not publish inherited OpenCode artifacts as Lato          |
| Legacy installation     | `packages/opencode/src/installation`             | Retained but removed from normal runtime graphs                                 | Reach only through explicitly controlled future paths        |
| Hosted UI fallback      | `https://app.opencode.ai`                        | Disabled; missing UI returns local HTTP 503                                     | Never proxy silently to upstream hosted UI                   |
| Default mDNS hostname   | `opencode.local`                                 | Restored for compatibility                                                      | Explicit custom domains remain supported                     |
| WSL auto-installer      | `https://opencode.ai/install`                    | Disabled; safe unavailable result                                               | Never auto-download upstream; use manual terminal setup      |
| WSL existing CLI        | `~/.opencode/bin/opencode`                       | Detected and used when present                                                  | Preserve user-managed CLI compatibility                      |
| Primary logo assets     | Lato wordmark and icon                           | Approved PNG assets integrated                                                  | Do not redraw or recolor; preserve source artwork            |
| Favicon                 | Lato icon                                        | PNG/ICO and manifest resources replaced                                         | Use existing paths; no invented manifest entries             |
| Desktop icons           | Lato icon                                        | Dev, beta, and prod resources replaced                                          | Preserve channel paths and builder references                |
| Zen provider            | `opencode`                                       | Optional; no automatic priority                                                 | Must not be mandatory or auto-preferred                      |
| Go subscription         | `opencode-go`                                    | Upsell UI and retry actions removed                                             | Preserve provider code until safe removal                    |
| Third-party providers   | Various                                          | Keep                                                                            | No removal                                                   |
| Third-party free models | Various                                          | Keep                                                                            | No removal                                                   |
| MIT attribution         | `Copyright (c) 2025 opencode`                    | Kept                                                                            | Legal requirement                                            |

## Phase 2.75 validation

- Local development smoke validation passed for CLI/TUI startup, browser UI startup, project discovery and inspection, file reads/writes, Python and shell execution, permission approval/rejection, session persistence after backend restart, and provider switching.
- Validation used disposable project state under `~/lato-smoke-test` and did not migrate or modify repository user data.
- Full typecheck, production builds, E2E, desktop packaging, visual regression, and cross-platform release validation remain outstanding.

## Data safety

- No user data migration is to be performed without explicit approval.
- No existing database or authentication file may be overwritten.
- Legacy compatibility is preferred over premature internal renaming.
