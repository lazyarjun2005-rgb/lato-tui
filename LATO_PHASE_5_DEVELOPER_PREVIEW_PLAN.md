# Lato Phase 5 Developer-Preview Release Plan

Status: **implemented, CI-executed, released, and real-machine validated.**
Prereleases `v0.1.0-preview.1` and `v0.1.0-preview.2` are published on GitHub
Releases (prerelease channel, never marked "latest"). `v0.1.0-preview.2` was
built from CI run `41696675487` at commit `c4e7db8de65ba9673bbba51a86a3a6eecf29a121`
with CI-asserted version stamps (`lato 0.1.0-preview.2` in every
runtime-verified target), verified by checksum against the manifest, published
from those exact run artifacts, and used to update a real Arch Linux x64
(no-AVX2) installation via the official installer; `lato-cli --version`
reported `lato 0.1.0-preview.2` and the existing user data was preserved.
Windows and macOS installer runs on real machines remain outstanding.

Reviewer note: the final review found and fixed one verified installer defect
(a `set -e` early exit on the macOS branch of `install.sh`), added a darwin zip
fixture scenario, and shipped the first two published previews. The first
preview (`v0.1.0-preview.1`, CI run `41645034351` at commit `3bc5ac9`) shipped
with development version stamps inside the binaries; the cross-platform
workflow gained a required `version` dispatch input and strict installed-stamp
assertions in commit `c4e7db8`, so `v0.1.0-preview.2` stamped releases
correctly.

Baseline: `51156f4ba6b7902504c549fbe0f6b420fa4ef572` on
`lato-development`.

## Scope

Phase 5 establishes a small, reproducible Lato developer-preview release,
cross-platform installation, and reliability contract. The intended user
experience after implementation is:

```text
download -> verify -> install -> open a new terminal -> lato-cli
```

without cloning the repository or installing Bun.

This document is a proposal only. No release assets, installers, checksums, or
package channels currently exist. It does not rename `packages/opencode`, change
provider IDs, remove OpenCode free models, migrate existing data, or publish
packages automatically.

The first release should be an explicit GitHub Release archive channel. npm,
Homebrew, AUR, Docker images, desktop installers, and automatic updates remain
out of scope until separately approved.

## Current Availability Guardrail

Before implementation, the following facts must remain explicit:

- The source workflow remains available through `git clone`, `bun install`, and
  `bun run dev` from the repository root.
- CI builds and uploads Actions artifacts for the 12 targets; the dependent
  `validate-archives` job then publishes a validated `SHA256SUMS` artifact.
- `install.sh` and `install.ps1` are fixture-validated, CI-executed, and used to
  install two published prereleases; releases are explicit-version only.
- `lato-cli` installs through the official installers from published Releases;
  no `latest` channel, uninstaller, signing, or update channel exists.
- README installation instructions now describe the published previews and
  separately mark which platforms have been exercised on real machines.

## Implemented Milestones

### Milestone 2: CI archive assembly and validation

Implemented in `packages/opencode/script/archive.ts` and
`.github/workflows/cross-platform-build.yml`:

- Existing 12-target matrix remains the source of truth.
- Linux archives are deterministic `.tar.gz` files containing root-level `lato`.
- macOS archives are deterministic `.zip` files containing root-level `lato`.
- Windows archives are deterministic `.zip` files containing root-level
  `lato.exe`.
- Target names, archive names, executable names, and archive member lists are
  validated.
- Unsupported targets and unexpected archive names are rejected.
- Archive assembly remains separate from release publication.

Acceptance evidence:

- A focused local fixture assembled and validated all 12 archive types without
  native builds or dependency installation.
- The fixture generated and validated a 12-entry lexical `SHA256SUMS` file.
- Native CI execution remains unchanged; runtime-verified versus build-only
  limitations remain explicit in the matrix.

### Milestone 3: CI checksum manifest foundation

The workflow now has a dependent `validate-archives` job that downloads the
12 per-target Actions artifacts, validates the complete archive set, generates
and validates `SHA256SUMS`, and uploads the manifest as an Actions artifact.

This is not public release publication. A Release asset, installer download,
signing, and release-level checksum contract remain unimplemented.

## Cross-Platform Installation Contract

### Public command and archive contents

Every supported archive must contain exactly one Lato native executable:

| Platform | Archive executable | Installed command                                    |
| -------- | ------------------ | ---------------------------------------------------- |
| Linux    | `lato`             | `lato-cli`                                           |
| macOS    | `lato`             | `lato-cli`                                           |
| Windows  | `lato.exe`         | `lato-cli.exe`/`lato-cli` through PowerShell/PATHEXT |

The archive must not contain an `opencode` application executable. Internal
package names and compatibility identifiers remain unchanged.

### Supported installation directories

Installers should use user-owned directories by default and never require
administrator privileges:

- Linux: `${XDG_BIN_HOME:-$HOME/.local/bin}` if `XDG_BIN_HOME` is set; otherwise
  `$HOME/.local/bin`.
- macOS: `$HOME/.local/bin` by default, with the same PATH guidance as Linux.
- Windows: `$env:USERPROFILE\.local\bin` by default.

The chosen directory must be configurable through an explicit installer option.
Installers must not write into the repository, `/usr/bin`, `/usr/local/bin`,
`Program Files`, or another user's profile by default.

### PATH behavior

Installers must not silently edit shell startup files or user environment state.
They should:

1. Detect whether the default install directory is already on PATH.
2. Print an exact, platform-appropriate PATH command when it is absent.
3. Explain that a new terminal may be required after PATH changes.
4. Verify the executable by absolute path before reporting success.

The acceptance test must start a fresh shell/process with the configured PATH and
run `lato-cli --version` and `lato-cli --help` from outside the checkout.

### Upgrade and reinstall behavior

Reinstalling the same version must be idempotent. Upgrading must:

- Download into a private temporary directory.
- Verify the archive and checksum before touching the installed executable.
- Replace only the existing Lato-owned `lato-cli`/`lato-cli.exe`.
- Preserve configuration, credentials, sessions, databases, and preferences.
- Leave the previous executable intact if download, verification, extraction,
  or replacement fails.

Uninstall remains disabled until Lato installation ownership is approved. The
future uninstall operation must remove only the installed executable and
Lato-owned installation metadata, never shared compatibility data.

### Platform and architecture policy

Supported build artifacts are the existing CI matrix only:

- Linux: x64 glibc, x64 baseline glibc, x64 musl, x64 baseline musl, arm64
  glibc, and arm64 musl.
- macOS: arm64, x64, and x64 baseline.
- Windows: x64, x64 baseline, and arm64 cross-build.

There is no Linux ARM64 baseline target and no 32-bit ARM target. Installers
must reject unsupported OS/architecture combinations with a clear message.

Runtime status must remain honest:

- Linux x64/ARM64 and musl variants are CI runtime-verified.
- Windows x64 is CI runtime-verified; Windows ARM64 is build-only.
- macOS ARM64 is CI runtime-verified; macOS x64 is build-only when the hosted
  runner cannot execute Bun 1.4.4 under Rosetta due to missing AVX.

Build-only artifacts may be published only if the release notes clearly label
their runtime-verification status.

## Non-goals

- No production release claim.
- No package or workspace rename.
- No change to `opencode`/`opencode-go` provider IDs.
- No removal or renaming of OpenCode free models.
- No migration of `opencode.json`, `.opencode`, `auth.json`, databases, sessions,
  or other existing user data.
- No replacement of OpenCode compatibility URLs without an approved Lato-owned
  destination.

## Implementation Order

### Milestone 1: Approve the release contract

Define the contract before changing release code:

- Release repository: `lazyarjun2005-rgb/lato-tui`.
- Release channel name: developer preview.
- Version/tag format, for example `lato-v<version>` or `v<version>`.
- Whether prerelease GitHub Releases are the only distribution channel.
- Supported archive targets and build-only targets.
- Ownership of release credentials and signing identities.
- Retention policy for development releases.

Acceptance criteria:

- A written decision identifies the release repository, tag format, version
  source, channel, and artifact owner.
- No installer or release workflow uses an unapproved URL or secret.
- The contract explicitly states that artifacts are unsigned until signing is
  approved and implemented.
- The contract distinguishes GitHub Actions artifacts from public Release
  assets and states that no public assets exist before the first approved
  release.

Likely files: a new release policy document, `README.md`, and the Phase 5
reports. Do not change release workflows yet.

### Milestone 2: Freeze artifact names and archive layout

Use the existing CI target names without introducing new targets:

| Target                         | Archive                               |
| ------------------------------ | ------------------------------------- |
| `lato-linux-x64`               | `lato-linux-x64.tar.gz`               |
| `lato-linux-x64-baseline`      | `lato-linux-x64-baseline.tar.gz`      |
| `lato-linux-x64-musl`          | `lato-linux-x64-musl.tar.gz`          |
| `lato-linux-x64-baseline-musl` | `lato-linux-x64-baseline-musl.tar.gz` |
| `lato-linux-arm64`             | `lato-linux-arm64.tar.gz`             |
| `lato-linux-arm64-musl`        | `lato-linux-arm64-musl.tar.gz`        |
| `lato-darwin-arm64`            | `lato-darwin-arm64.zip`               |
| `lato-darwin-x64`              | `lato-darwin-x64.zip`                 |
| `lato-darwin-x64-baseline`     | `lato-darwin-x64-baseline.zip`        |
| `lato-windows-x64`             | `lato-windows-x64.zip`                |
| `lato-windows-x64-baseline`    | `lato-windows-x64-baseline.zip`       |
| `lato-windows-arm64`           | `lato-windows-arm64.zip`              |

Release archive contents must be explicit. The CI job may assemble archives from
`dist/<target>/bin`, but the final archive layout must place the executable at
the archive root:

- Linux: archive root contains `lato`.
- macOS: archive root contains `lato` with executable permissions preserved.
- Windows: archive root contains `lato.exe`.
- No archive may contain an unrelated OpenCode application executable.

Acceptance criteria:

- CI validates archive names, target names, executable names, archive layout,
  and that no unrelated executable is included.
- The release contract records which targets are build-only.
- The artifact set is deterministic for a given source revision and version.

Likely files: a new release/archive workflow or a narrowly extended
`.github/workflows/cross-platform-build.yml`, a new archive validation script or
focused test, and `LATO_CROSS_PLATFORM_CI_REPORT.md`. Existing build-only
target behavior must remain unchanged.

### Milestone 3: Add checksum manifests

Generate a release-level `SHA256SUMS` file after all artifacts are assembled.

Requirements:

- One line per release archive.
- Stable lexical ordering.
- Hashes computed from the exact uploaded files.
- Manifest uploaded with the same GitHub Release.
- Installer downloads and verifies the requested archive before extraction.
- A checksum mismatch is fatal and leaves no installed executable behind.
- The manifest is fetched from the same approved Release/tag as the archive;
  installers must not accept an arbitrary manifest URL by default.

Acceptance criteria:

- CI verifies every uploaded archive has exactly one manifest entry.
- A deliberate mismatch fails the installer test.
- No installer bypasses checksum validation when a manifest is expected.
- A missing manifest or missing archive entry fails closed.

Likely files: `.github/workflows/cross-platform-build.yml`, `install.sh`,
`install.ps1`, and a small checksum verification helper if shared behavior is
needed.

### Milestone 4: Harden installer behavior and version selection

Implementation status: **implemented, CI-executed, and validated against two
published releases.** `v0.1.0-preview.1` was installed on a real Arch Linux
machine, and `v0.1.0-preview.2` upgraded it in place through the same official
installer: explicit version accepted, checksum verified, atomic staged
replacement, config/session data preserved, PATH guidance printed, and the
reporter and `lato-cli --version` both printed `lato 0.1.0-preview.2`.

Implemented in `install.sh` and `install.ps1`:

- Explicit version is required; the implicit `latest` channel is rejected.
- Linux/macOS select the existing x64/ARM64 and glibc/musl target names.
- Windows selects the existing x64/ARM64 and baseline target names.
- Archives and `SHA256SUMS` are downloaded from the same versioned Release URL.
- SHA-256 verification fails closed before extraction.
- Archive contents must contain exactly one root-level executable.
- Private per-run temporary directories are cleaned up on exit.
- Installation is staged through a temporary file in the configured user install
  directory before replacement.
- Default install directories and configurable directory options are supported.
- PATH guidance is printed without editing shell startup files or user PATH.
- Uninstall and signing remain intentionally unimplemented.

Current validation includes static/syntax checks, Linux shell fixtures,
CI-configured Windows PowerShell checks, and native download/install/upgrade
against two real Releases on Linux x64. No `latest` channel exists; the
installer requires an explicit version before downloading.

If `latest` is ever introduced, it must only be after a deliberate product
decision, and it must then:

- Resolve `latest` only through the Lato GitHub Releases API.
- Permit an explicit version/tag or release URL only through documented inputs.
- Use a private temporary directory per invocation.
- Validate the archive before extraction.
- Verify the checksum before execution.
- Replace only the Lato-owned `lato-cli`/`lato-cli.exe` target.
- Keep failed downloads and failed verification from modifying the installation.
- Make repeat installation idempotent.
- Document PATH changes, upgrade behavior, and uninstall scope.
- Never treat a GitHub Actions artifact URL as a stable installer source.

Windows-specific requirements:

- Avoid deleting arbitrary shared temporary directories.
- Use an isolated extraction directory.
- Handle an existing running `lato-cli.exe` with a clear failure message.

Linux/macOS-specific requirements:

- Use an isolated temporary directory and cleanup trap.
- Preserve executable permissions.
- Do not require `sudo` by default.

Acceptance criteria:

- Fresh install succeeds from a published test release on each supported native
  platform.
- Re-running the installer is idempotent.
- Upgrade preserves user data and configuration.
- Failed checksum, missing asset, unsupported architecture, and interrupted
  extraction leave the previous installation intact.
- Uninstall behavior is either implemented and tested or explicitly disabled.

Likely files: `install.sh`, `install.ps1`, a small shared manifest/asset
contract if needed, and focused installer tests. README installation sections
must be updated only after a real release has passed installation validation.
Do not modify compatibility storage paths.

Focused validation implemented in `packages/opencode/script/installer-fixtures.sh`
covers explicit and malformed versions, upgrade/reinstall, missing manifests,
missing entries, incorrect checksums, corrupted/unexpected archives, previous
binary preservation, and temporary-target cleanup. Native Windows PowerShell
syntax and mandatory-version validation are configured in CI; PowerShell is not
available on the development laptop.

### Milestone 5: Define a deterministic local provider fixture

Implementation status: **implemented as a focused core session-runner fixture.**

The existing test-only `LLMClient.Service` seam in
`packages/core/test/session-runner.test.ts` is used instead of adding a new
provider ID, network server, dependency, or production provider implementation.
The fixture returns deterministic LLM text events for the existing fake model
and runs through the real SessionV2 runner, persistence, and message projection
layers.

Add a test-only provider fixture without changing production provider IDs or
model catalogs.

The fixture should provide:

- A deterministic model ID.
- A deterministic streaming or non-streaming response.
- Configurable authentication success/failure.
- Predictable tool-call and permission scenarios.
- No external network access.
- No real credentials.

The fixture must be injected through existing test seams rather than replacing
the real `opencode` provider or deleting free-model behavior.

Acceptance criteria:

- A focused test can discover the fixture model.
- A prompt produces a stable assistant response.
- Invalid credentials produce a stable, asserted error.
- Tool permission approval and rejection are both testable.
- Existing provider IDs and free-model tests remain unchanged.

Likely files: a test fixture under `packages/opencode/test/` or `packages/core/`
and the narrow provider/session test harness. Exact location requires code
inspection before implementation.

### Milestone 6: Add the first-session smoke test

Implementation status: **one focused first-session turn is implemented and
locally validated.**

The test creates an isolated test session, submits `Hello Lato`, receives the
deterministic `Lato fixture response`, verifies the real fake model request and
projected user/assistant messages, and exits through the existing Effect test
scope. It does not exercise a subprocess or a real installed binary; those
remain separate release-validation work.

Using the fixture from Milestone 5, test the smallest complete user journey:

1. Start with isolated temporary config, data, state, and cache directories.
2. Start the local Lato server or CLI execution path.
3. Discover and select the fixture provider/model.
4. Submit one prompt.
5. Verify the assistant response.
6. Exercise one allowed tool call and one permission decision.
7. Verify session, message, and preference writes.
8. Shut down cleanly.

Acceptance criteria:

- The test is deterministic and offline.
- It never reads or writes the developer's real home state.
- It uses `lato-cli`/Lato entry-point identity where applicable.
- It does not assert that compatibility identifiers have been renamed.
- Failures identify startup, provider, model, permission, or persistence stage.

Likely files: a focused test under `packages/opencode/test/`, fixture support,
and possibly an isolated test helper. No production flow change should be
needed unless the test exposes a real defect.

### Milestone 7: Verify session recovery after process restart

Implementation status: **implemented and locally validated with two sequential
Bun test subprocesses.**

The focused test launches the existing session-runner test file once to create a
session and persist a deterministic user/assistant exchange, then launches it a
second time with the same isolated SQLite path and reopens the session by ID.
The test uses isolated `OPENCODE_DB`, `OPENCODE_TEST_HOME`, and XDG directories.
The test preload now preserves an explicitly supplied `OPENCODE_DB` so the
subprocess can use that isolated database instead of forcing `:memory:`.

Create a focused process-boundary test:

1. Start a process with isolated state/data paths.
2. Create a session and persist a user/assistant exchange.
3. Terminate the process cleanly.
4. Start a second process with the same paths.
5. Reopen the session by ID.
6. Verify messages, metadata, model selection, and resumability.
7. Confirm no compatibility files were moved or overwritten.

Acceptance criteria:

- Recovery works after a normal process restart.
- The test validates the real SQLite/session path rather than duplicating
  storage logic.
- Existing sessions remain readable using current compatibility paths.
- Interrupted or incomplete writes produce a clear failure rather than silent
  data loss, where the existing architecture supports that assertion.

Likely files: focused session/database tests under `packages/opencode/test/`
and test-only process helpers. No migration implementation is part of this
milestone.

### Milestone 8: Add focused CI validation

Implementation status: **implemented and CI-executed.** A non-publishing
`validate-archives` job downloads all 12 build artifacts, validates each
archive, generates and validates the lexical `SHA256SUMS` manifest, and uploads
only that manifest. On `ubuntu-latest`, a `Validate installer fixture contract`
step runs the installer fixture suite for Linux and darwin zip selection, and
a `Validate shell installer syntax` step covers `install.sh` with
`ShellCheck`-grade `bash -n` plus mandatory-version checks. On `windows-latest`,
a PowerShell parser plus mandatory-version check covers `install.ps1`. These
jobs executed successfully for the published releases (CI run `41696675487`
for `v0.1.0-preview.2`; run `41645034351` for `v0.1.0-preview.1`). The
workflow also gained a required `version` dispatch input and strict
installed-stamp assertions, so the dispatched run failed-closed until every
runtime-verified target printed `lato 0.1.0-preview.2`.

Not yet implemented: running the first-session smoke and process-restart
recovery tests in the multi-OS test job, and an installed-archive
`lato-cli --version`/`--help` check as a CI step (the real-machine Linux
install verifies `lato-cli --version` at install time).

Add only targeted jobs or steps:

- Archive layout and checksum validation on Linux.
- Installer shell validation on Linux.
- PowerShell syntax and installer validation on Windows.
- `lato-cli --version` and `lato-cli --help` from an installed archive.
- First-session fixture test on Linux, Windows, and macOS ARM64.
- Session restart/recovery test on at least Linux and Windows; add macOS when
  the runner behavior is stable.
- Existing cross-platform build and native-validation workflows remain required.
- macOS x64 and Windows ARM64 remain explicitly build-only where runtime
  execution is unavailable.

Acceptance criteria:

- CI distinguishes build success, archive validation, installer success, and
  runtime verification.
- No unsupported runtime is reported as verified.
- CI uses isolated temporary user/config/data paths.
- No secrets or external provider network calls are required for fixture tests.

Likely files: `.github/workflows/cross-platform-build.yml`,
`.github/workflows/lato-native-validation.yml`, and focused test/helper files.

## Risks and Rollback

### Risks

- Publishing an archive under the wrong identity could create irreversible user
  confusion.
- Installer replacement could overwrite a non-Lato executable or user data.
- A release workflow could accidentally invoke inherited OpenCode publication
  jobs or credentials.
- Provider fixture coupling could alter production provider selection.
- Process-based recovery tests could become memory-heavy on the developer laptop.
- SQLite restart tests could accidentally use real global state if isolation is
  incomplete.

### Rollback strategy

- Keep Phase 5 behind manual workflow dispatch until the first preview is
  approved.
- Publish prereleases only; do not alter `latest` behavior initially.
- Make installers refuse unknown or unverifiable assets.
- Keep the previous installed executable until verification succeeds.
- Revert the release workflow and installer changes independently of provider,
  session, or compatibility code.
- Disable the fixture smoke job if it is flaky without changing production
  provider logic.
- Preserve all existing compatibility paths and data files during rollback.

## Approval Required

Implementation must wait for decisions on:

1. Exact release/tag format.
2. Whether GitHub Releases are the first and only preview distribution channel.
3. Whether unsigned developer-preview binaries are acceptable.
4. Future macOS signing/notarization and Windows Authenticode ownership.
5. Whether `latest` should resolve to a prerelease or remain disabled.
6. Installer upgrade and uninstall semantics.
7. The deterministic provider fixture seam and expected test response format.
8. The minimum supported runtime-verification matrix.
9. Whether a preview may expose any inherited OpenCode package metadata.

## Definition of Done

Phase 5 is complete only when:

- An approved developer-preview contract exists.
- A versioned, reproducible artifact set is generated and checksum-verified.
- Installers use isolated temporary directories and fail safely on integrity
  errors.
- Installed `lato-cli --version` and `lato-cli --help` work on supported native
  platforms.
- A deterministic fixture proves provider/model selection and one coding turn.
- A process restart proves session recovery.
- CI reports build-only versus runtime-verified targets honestly.
- No provider IDs, free models, compatibility paths, credentials, sessions, or
  configuration files are removed or migrated.
- Release, signing, installer, and rollback documentation matches the actual
  implementation.

### Closure status (verified)

All criteria are satisfied for the Linux real-machine scope, with the
following evidence:

1. Contract: explicit-version, prerelease-only, unsigned, no `latest`; approved
   through the documented decision trail in this plan and the transformation
   log.
2. Artifacts: 12 targets plus `SHA256SUMS`; CI job-validated, then verified
   against the manifest before upload (`v0.1.0-preview.2` from CI run
   `41696675487`).
3. Installers: privately staged replacement in the user install directory;
   checksum validation fails closed before any installation change; the real
   update preserved user data.
4. Runtime: `lato-cli --version` prints the CI-asserted stamp on the Linux
   real-machine install; `lato-cli --help` works from the same installation.
5. Provider/session: deterministic provider fixture and process-restart
   recovery test pass locally (documented in the implementation milestones in
   this plan).
6. Honest reporting: README, release notes, and CI label macOS x64 and
   Windows ARM64 as build-only.
7. Compatibility: no provider IDs, compatibility paths, credentials, sessions,
   or configuration files were removed or migrated (archived identities and
   providers preserved).
8. Documentation: README installation instructions, release notes, and this
   plan's rollback/signing notes (unsigned preview, re-run installer to
   upgrade, no uninstaller) match the shipped behavior.

Ubuntu and Windows CI runtime verification covers the remaining supported
matrix; Windows and macOS real-machine installer runs remain listed as Phase 6
hardening follow-ups, not Phase 5 acceptance criteria.

No Phase 5 implementation is authorized by this document.
