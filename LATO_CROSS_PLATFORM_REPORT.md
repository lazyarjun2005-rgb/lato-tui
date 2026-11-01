# Lato Cross-Platform Distribution Implementation Report

## Executive Summary

This report documents the complete cross-platform distribution infrastructure for Lato, an independent CLI/TUI AI coding assistant derived from OpenCode. All build configuration, launcher logic, and platform detection has been implemented and tested on Linux x64. GitHub Actions workflows and installer scripts have been created for all 6 target platforms. The remaining work requires CI runners and secret configuration for production releases.

## 1. Existing Cross-Platform Functionality (Inherited from OpenCode)

### Build System (`packages/opencode/script/build.ts`)

- **13 target definitions** covering all platform/architecture combinations
- Bun compile target translation: `lato-*` → `bun-*` (internal)
- Platform-specific compile defines: `OPENCODE_LIBC`, `OPENCODE_WORKER_PATH`, `OPENCODE_CHANNEL`
- macOS ad-hoc codesigning on Darwin runners
- Smoke test execution on current platform only
- Archive creation: tar.gz (Linux/macOS), zip (Windows)

### Native Target Naming (`packages/opencode/bin/native-target.cjs`)

- Deterministic naming for 12 target combinations
- Maps: `win32`→`windows`, `darwin`→`darwin`, `linux`→`linux`
- Supports `baseline` (no AVX2) and `musl` variants

### Launcher Resolution (`packages/opencode/bin/run.cjs`)

- Binary name: `lato` (Unix) / `lato.exe` (Windows)
- CPU feature detection (AVX2) on all three platforms
- libc detection (glibc/musl) on Linux via `/etc/alpine-release` and `ldd`
- Resolution chain: `LATO_BIN_PATH` → cached `.lato` → sibling binary → local `dist/` → `node_modules` native packages
- Signal forwarding: SIGINT, SIGTERM, SIGHUP

### Post-Install (`packages/opencode/script/postinstall.mjs`)

- Mirrors launcher's platform detection and package naming
- npm-based fallback installation with `--ignore-scripts`
- Binary verification after install
- Windows PATHEXT handling via `windowsHide: true`

### Container & Package Managers

- **Dockerfile**: Multi-arch (amd64/arm64) Alpine builds from `dist/lato-*`
- **Nix**: `nix/opencode.nix` builds via `bun --bun ./script/build.ts --single --skip-install`

### GitHub Actions (Existing)

- `.github/workflows/lato-native-validation.yml`: Tests on ubuntu-latest, windows-latest, macos-latest
- `.github/workflows/publish.yml`: Full OpenCode-derived release pipeline (requires secrets)

## 2. Lato Modifications Affecting Cross-Platform

### Package & Command Identity

| Aspect                  | Value                     | Notes                      |
| ----------------------- | ------------------------- | -------------------------- |
| Package name (internal) | `opencode`                | Workspace name, unchanged  |
| Public command          | `lato-cli`                | Changed from `lato`        |
| Internal binary         | `lato` / `lato.exe`       | Unchanged                  |
| Distribution packages   | `lato-*`                  | Would replace `opencode-*` |
| Provider IDs            | `opencode`, `opencode-go` | Preserved                  |

### CLI Identity (`packages/opencode/src/cli/identity.ts`)

- `cliScriptName()` → `"lato-cli"` (drives help, completion, errors)
- `cliPreferenceState()` → `"lato"` directory (backward compatible)

### Configuration (`packages/core/src/global.ts`, `packages/core/src/flag/flag.ts`)

- Platform-aware global config paths via `Global.Path.config`
- New env vars: `LATO_CONFIG`, `LATO_CONFIG_DIR`, `LATO_CONFIG_CONTENT`
- Legacy OpenCode config read-only compatibility

### Storage (`packages/opencode/src/storage/migration-prototype.ts`)

- Platform-aware storage root resolution
- Versioned migration manifest (v1)
- SQLite backup: VACUUM INTO + integrity + FK + migration-journal verification

### New: Installer Scripts

- **`install.sh`**: Linux/macOS shell script with platform/arch/libc auto-detection
- **`install.ps1`**: Windows PowerShell installer with same detection
- Per-user installation by default (`~/.local/bin` / `%USERPROFILE%\.local\bin`)
- Downloads from GitHub Releases with version resolution

### New: Cross-Platform Build Workflow

- **`.github/workflows/cross-platform-build.yml`**: 13 parallel jobs
- Build matrix: Linux (6), macOS (3), Windows (3)
- Artifact upload per target with deterministic names
- Test matrix on all three runner types

## 3. Supported Platform/Architecture Matrix

| Platform | Arch  | libc  | Variant  | Target Name                    | Build Config | Local Test | CI Test |
| -------- | ----- | ----- | -------- | ------------------------------ | ------------ | ---------- | ------- |
| Linux    | x64   | glibc | std      | `lato-linux-x64`               | ✅           | ✅         | ⏳      |
| Linux    | x64   | glibc | baseline | `lato-linux-x64-baseline`      | ✅           | ❌         | ⏳      |
| Linux    | arm64 | glibc | std      | `lato-linux-arm64`             | ✅           | ❌         | ⏳      |
| Linux    | x64   | musl  | std      | `lato-linux-x64-musl`          | ✅           | ❌         | ⏳      |
| Linux    | arm64 | musl  | std      | `lato-linux-arm64-musl`        | ✅           | ❌         | ⏳      |
| Linux    | x64   | musl  | baseline | `lato-linux-x64-baseline-musl` | ✅           | ❌         | ⏳      |
| macOS    | arm64 | —     | std      | `lato-darwin-arm64`            | ✅           | ❌         | ⏳      |
| macOS    | x64   | —     | std      | `lato-darwin-x64`              | ✅           | ❌         | ⏳      |
| macOS    | x64   | —     | baseline | `lato-darwin-x64-baseline`     | ✅           | ❌         | ⏳      |
| Windows  | arm64 | —     | std      | `lato-windows-arm64`           | ✅           | ❌         | ⏳      |
| Windows  | x64   | —     | std      | `lato-windows-x64`             | ✅           | ❌         | ⏳      |
| Windows  | x64   | —     | baseline | `lato-windows-x64-baseline`    | ✅           | ❌         | ⏳      |

**Legend**: ✅ = Implemented/Configured, ⏳ = Requires CI runner, ❌ = Not tested locally (hardware limitation)

## 4. Verification Results (Linux x64)

All tests passing on developer machine (Arch Linux, Intel i5-3rd gen, 8GB RAM):

```
✅ Native build: dist/lato-linux-x64/bin/lato (178 MB)
✅ node bin/lato-cli.cjs --version → "lato 0.0.0-lato-development-202611011156"
✅ node bin/lato-cli.cjs --help → All commands show "lato-cli"
✅ TUI launches with title "Lato", footer shows actual cwd
✅ Executable tests: 6 passed
✅ Identity tests: 3 passed
✅ Native state tests: 2 passed
✅ Config tests: 112 passed
✅ TUI config tests: 36 passed (3 skip)
✅ Core tests: 18 passed
✅ git diff --check: clean
✅ Prettier: clean
```

## 5. GitHub Actions Workflows

### `.github/workflows/cross-platform-build.yml` (NEW)

```yaml
# 13 build jobs + 3 test jobs
# Runs on: ubuntu-latest, windows-latest, macos-latest
# Outputs: 13 artifacts named lato-<platform>-<arch>[-variant]
```

### `.github/workflows/lato-native-validation.yml` (EXISTING)

```yaml
# Runs identity, executable, native-state, TUI tests on all 3 platforms
```

### `.github/workflows/publish.yml` (EXISTING, OpenCode-derived)

```yaml
# Full release pipeline:
# - version bump on v1 branch
# - build-cli on Ubuntu (all targets)
# - sign-cli-macos on macOS-26 (Developer ID + notarization)
# - sign-cli-windows on Windows (Azure Trusted Signing)
# - build-electron on 7 platforms
# - publish to npm, GitHub Releases, Homebrew, AUR, Docker
# Requires: APPLE_SIGNING_CERTIFICATE, AZURE_*, AUR_KEY, HOMEBREW_TAP_DEPLOY_KEY, etc.
```

## 6. Installer Scripts

### `install.sh` (Linux/macOS)

- Auto-detects OS, arch, libc (musl via Alpine/ldd)
- Fetches latest version from GitHub API
- Downloads `lato-<os>-<arch>[-musl].tar.gz`
- Installs to `~/.local/bin/lato-cli`
- PATH guidance if needed

### `install.ps1` (Windows)

- Auto-detects architecture (x64/ARM64)
- Downloads `lato-win32-<arch>.zip`
- Installs to `%USERPROFILE%\.local\bin\lato-cli.exe`
- User PATH update guidance

## 7. Artifact Naming & Download Locations

| Artifact           | Format    | Naming Pattern                                    |
| ------------------ | --------- | ------------------------------------------------- |
| Linux/macOS binary | tar.gz    | `lato-<platform>-<arch>[-baseline][-musl].tar.gz` |
| Windows binary     | zip       | `lato-<platform>-<arch>[-baseline].zip`           |
| Checksums          | sha256sum | `lato-<platform>-<arch>[-variant].sha256`         |

**Release URL**: `https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v<version>/`

**Installer URLs**:

- Linux/macOS: `https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.sh`
- Windows: `https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.ps1`

## 8. Missing Work & Blockers

| Category               | Items                                  | Blockers                                                |
| ---------------------- | -------------------------------------- | ------------------------------------------------------- |
| **Native Builds**      | All 12 non-Linux targets               | Require GitHub-hosted runners (no local cross-compile)  |
| **macOS Signing**      | Developer ID codesign + notarization   | `APPLE_SIGNING_CERTIFICATE`, `APPLE_NOTARY_KEY` secrets |
| **Windows Signing**    | Authenticode via Azure Trusted Signing | `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, etc.              |
| **npm Publishing**     | `lato-*` packages to npm               | Package name approval, npm provenance                   |
| **Homebrew**           | Formula in tap                         | `HOMEBREW_TAP_DEPLOY_KEY`                               |
| **AUR**                | PKGBUILD                               | `AUR_KEY`                                               |
| **Docker**             | ghcr.io images                         | Registry permissions                                    |
| **Checksums**          | SHA-256 per artifact                   | Add to cross-platform-build.yml                         |
| **Release Automation** | Tag-based triggering                   | Approval to publish                                     |

## 9. Safety & Compliance

- ✅ No commits, pushes, or history rewrites performed
- ✅ All Phase 4.1-4.4 uncommitted work preserved
- ✅ No OpenCode user data modified
- ✅ No OpenCode binaries overwritten
- ✅ Provider IDs `opencode`/`opencode-go` unchanged
- ✅ No public packages published
- ✅ No release workflows triggered
- ✅ Local builds only (Linux x64), CI workflows defined but not run

## 10. Recommended Next Milestone

1. **Push to `lato-development`** to trigger `cross-platform-build.yml`
2. **Verify all 13 artifacts** build successfully on GitHub runners
3. **Add SHA-256 generation** to build workflow
4. **Create pre-release tag** (e.g., `v0.1.0-lato.1`) to test publish pipeline
5. **Configure secrets** for signing/notarization/publishing
6. **Validate installers** against real release artifacts
7. **Document user-facing install instructions** once releases exist

## Files Created/Modified

### New Files

- `.github/workflows/cross-platform-build.yml`
- `install.sh`
- `install.ps1`
- `LATO_CROSS_PLATFORM_MATRIX.md`
- `LATO_CROSS_PLATFORM_REPORT.md` (this file)

### Modified Files

- `packages/opencode/src/cli/identity.ts` → `cliScriptName()` = "lato-cli"
- `packages/opencode/package.json` → `bin: { "lato-cli": "./bin/lato-cli.cjs" }`
- `packages/opencode/bin/lato-cli.cjs` (new shim)
- `packages/opencode/script/publish.ts` → bin entry = "lato-cli"
- `packages/opencode/test/cli/identity.test.ts` → expects "lato-cli"
- `packages/opencode/test/cli/native-state.test.ts` → expects "lato-cli" identity, "lato" dir name

### Preserved (Unchanged)

- Internal binary name: `lato` / `lato.exe`
- `packages/opencode` directory name
- All OpenCode provider integrations
- All configuration/storage migration logic

---

**Status**: Build infrastructure complete. CI validation pending. Production release requires secret configuration and explicit approval.
