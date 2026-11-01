# Lato Cross-Platform Distribution Matrix

## Platform/Architecture Support Matrix

| Platform | Architecture | libc  | Variant  | Target Name                    | Build Status   | Verified      |
| -------- | ------------ | ----- | -------- | ------------------------------ | -------------- | ------------- |
| Linux    | x64          | glibc | standard | `lato-linux-x64`               | ✅ Implemented | ✅ Local      |
| Linux    | x64          | glibc | baseline | `lato-linux-x64-baseline`      | ✅ Implemented | ⏳ CI only    |
| Linux    | arm64        | glibc | standard | `lato-linux-arm64`             | ✅ Implemented | ⏳ CI only    |
| Linux    | x64          | musl  | standard | `lato-linux-x64-musl`          | ✅ Implemented | ⏳ CI only    |
| Linux    | arm64        | musl  | standard | `lato-linux-arm64-musl`        | ✅ Implemented | ⏳ CI only    |
| Linux    | x64          | musl  | baseline | `lato-linux-x64-baseline-musl` | ✅ Implemented | ⏳ CI only    |
| macOS    | arm64        | —     | standard | `lato-darwin-arm64`            | ✅ Implemented | ⏳ CI only    |
| macOS    | x64          | —     | standard | `lato-darwin-x64`              | ✅ Implemented | ⏳ CI only    |
| macOS    | x64          | —     | baseline | `lato-darwin-x64-baseline`     | ✅ Implemented | ⏳ CI only    |
| Windows  | arm64        | —     | standard | `lato-windows-arm64`           | ✅ Implemented | ⚠️ Build only |
| Windows  | x64          | —     | standard | `lato-windows-x64`             | ✅ Implemented | ⏳ CI only    |
| Windows  | x64          | —     | baseline | `lato-windows-x64-baseline`    | ✅ Implemented | ⏳ CI only    |

## Verification Status Legend

- ✅ Implemented: Build configuration exists in `script/build.ts` and `native-target.cjs`
- ✅ Local: Successfully built and tested on developer machine (Linux x64)
- ⏳ CI only: Built and runtime-verified on the mapped CI runner
- ⚠️ Build only: Cross-compiled and packaged but not runtime-verified (no suitable hosted runner)
- ❌ Missing: Not yet implemented

## Existing Cross-Platform Infrastructure (Inherited from OpenCode)

### 1. Native Target Naming (`bin/native-target.cjs`)

- Generates deterministic package names for all 12 target combinations
- Maps `win32` → `windows`, preserves `darwin`/`linux`
- Supports `baseline` (AVX2 disabled) and `musl` variants

### 2. Launcher Resolution (`bin/run.cjs`)

- Platform-aware binary discovery (`lato` vs `lato.exe`)
- CPU feature detection (AVX2) on Linux, macOS, Windows
- libc detection (glibc vs musl) on Linux
- Fallback chain: `LATO_BIN_PATH` → cached `.lato` → sibling binary → local `dist/` → `node_modules` native packages
- Signal forwarding (SIGINT, SIGTERM, SIGHUP)

### 3. Build Script (`script/build.ts`)

- 13 target definitions covering all 6 platforms × architectures
- Bun compile target translation (`lato-*` → `bun-*`)
- Platform-specific defines (`OPENCODE_LIBC`, `OPENCODE_WORKER_PATH`, etc.)
- macOS ad-hoc codesigning on Darwin runners
- Smoke test on current platform only
- Archive creation (tar.gz for Linux/macOS, zip for Windows)

### 4. Post-install Script (`script/postinstall.mjs`)

- Same platform detection and package naming as launcher
- npm-based fallback installation for native packages
- Binary verification after installation
- Supports all platforms including Windows PATHEXT

### 5. Dockerfile

- Multi-arch: `linux/amd64` (baseline musl) and `linux/arm64` (musl)
- Alpine base with minimal dependencies

### 6. Nix Derivation (`nix/opencode.nix`)

- Builds `dist/lato-*/bin/lato` via `bun --bun ./script/build.ts --single --skip-install`
- Wraps binary with ripgrep in PATH
- Generates shell completions

### 7. GitHub Actions Workflows

- `.github/workflows/lato-native-validation.yml` - runs tests on ubuntu-latest, windows-latest, macos-latest
- `.github/workflows/publish.yml` - full release pipeline (OpenCode-derived, requires secrets)

## Lato Modifications Affecting Cross-Platform

### 1. Package Identity

- Package name: `opencode` (unchanged, internal workspace name)
- Public bin command: `lato-cli` (was `lato`)
- Internal binary: `lato` / `lato.exe` (unchanged)
- Distribution packages would be `lato-*` (was `opencode-*`)

### 2. CLI Identity (`src/cli/identity.ts`)

- `cliScriptName()` returns `"lato-cli"`
- `cliPreferenceState()` still returns `"lato"` directory (backward compat)
- Provider IDs preserved: `opencode`, `opencode-go`

### 3. Configuration Paths (`core/src/global.ts`, `core/src/flag/flag.ts`)

- Platform-aware Lato global config dirs
- `LATO_CONFIG`, `LATO_CONFIG_DIR`, `LATO_CONFIG_CONTENT` env vars
- Legacy OpenCode config compatibility

### 4. Storage Roots (`opencode/src/storage/migration-prototype.ts`)

- Platform-aware storage root resolution
- Versioned migration manifest
- SQLite backup with VACUUM INTO, integrity/FK checks

### 5. Installer Scripts (NEW)

- `install.sh` - Linux/macOS shell installer
- `install.ps1` - Windows PowerShell installer
- Per-user installation by default
- Auto-detects platform/arch/libc
- Downloads from GitHub Releases

### 6. Cross-Platform Build Workflow (NEW)

- `.github/workflows/cross-platform-build.yml`
- 12 per-target build jobs, each runs `script/build.ts --target <name>`
- Runners: `ubuntu-latest` (x64), `ubuntu-24.04-arm` (arm64), `macos-14` (arm64), `windows-latest` (x64)
- Runtime verification: native, Alpine container (musl), Rosetta (macOS x64), or none (Windows arm64)
- Artifact upload per target
- Details: see `LATO_CROSS_PLATFORM_CI_REPORT.md`

## Missing Work / Blockers

| Item                             | Status            | Blocker                                                          |
| -------------------------------- | ----------------- | ---------------------------------------------------------------- |
| Linux x64 glibc build            | ✅ CI ready       | Native runner; verified locally                                  |
| Linux ARM64 glibc build          | ⏳ CI ready       | Needs `ubuntu-24.04-arm` (public repos)                          |
| Linux x64 musl build             | ⏳ CI ready       | Cross-libc on x64; verified in Alpine container                  |
| Linux ARM64 musl build           | ⏳ CI ready       | Needs `ubuntu-24.04-arm`; verified in arm64 Alpine container     |
| Linux baseline variants          | ⏳ CI ready       | x64 baseline runtime on x64 runner                               |
| macOS ARM64 build                | ⏳ CI ready       | `macos-14` (Apple Silicon)                                       |
| macOS x64 build                  | ⏳ CI ready       | Cross-compiled on `macos-14`; Rosetta-gated runtime verification |
| Windows x64 build                | ⏳ CI ready       | `windows-latest`                                                 |
| Windows ARM64 build              | ⚠️ Build only     | No hosted arm64 Windows runner; not runtime-verified             |
| `lato-linux-arm64-baseline`      | ❌ Unsupported    | Not a repository/Bun target (baseline is x64-only)               |
| macOS codesigning (Developer ID) | ⏳ Workflow ready | Requires `APPLE_SIGNING_CERTIFICATE` secret                      |
| macOS notarization               | ⏳ Workflow ready | Requires `APPLE_NOTARY_KEY` secrets                              |
| Windows Authenticode signing     | ⏳ Workflow ready | Requires Azure Trusted Signing secrets                           |
| npm package publishing           | ⏳ Workflow ready | Requires npm provenance, `GH_REPO` owner approval                |
| Homebrew formula                 | ⏳ Workflow ready | Requires `HOMEBREW_TAP_DEPLOY_KEY`                               |
| AUR package                      | ⏳ Workflow ready | Requires `AUR_KEY`                                               |
| Docker image (ghcr.io)           | ⏳ Workflow ready | Requires registry permissions                                    |
| Installer download URLs          | ⏳ Scripts ready  | Requires actual releases published                               |

## Artifact Naming Convention

```
lato-<platform>-<arch>[-baseline][-musl]
```

Examples:

- `lato-linux-x64`
- `lato-linux-x64-baseline`
- `lato-linux-arm64-musl`
- `lato-darwin-arm64`
- `lato-darwin-x64-baseline`
- `lato-windows-x64`
- `lato-windows-arm64`

Archive formats:

- Linux: `.tar.gz`
- macOS and Windows: `.zip`

SHA-256 checksums: Generated by release workflow (not yet implemented in cross-platform-build.yml)

## Installation Paths

| Platform | Default Install Dir        | Binary Name    |
| -------- | -------------------------- | -------------- |
| Linux    | `~/.local/bin`             | `lato-cli`     |
| macOS    | `~/.local/bin`             | `lato-cli`     |
| Windows  | `%USERPROFILE%\.local\bin` | `lato-cli.exe` |

## Acceptance Criteria per Platform

Each platform must pass:

- [ ] `lato-cli --version` shows correct version
- [ ] `lato-cli --help` shows Lato-branded help
- [ ] `lato-cli` launches TUI (terminal title "Lato")
- [ ] Provider initialization (opencode, opencode-go)
- [ ] Configuration directory created at platform-appropriate path
- [ ] Session/database initialization works
- [ ] Working directory detection shows actual cwd
- [ ] Clean process exit on Ctrl+C / window close
- [ ] Shell completion generation works

## Next Steps

1. **Enable cross-platform-build.yml** - Push to `lato-development` branch to trigger CI
2. **Verify CI builds** - Check all 12 targets build on the mapped runners
3. **Add checksum generation** - Extend workflow to produce SHA-256 sums
4. **Create first pre-release** - Tag a version to test full publish pipeline
5. **Validate installers** - Test `install.sh` and `install.ps1` against real artifacts
6. **Windows arm64 verification** - Add a self-hosted arm64 Windows runner when available
7. **Configure secrets** - Add signing/notarization/publishing secrets for production releases
