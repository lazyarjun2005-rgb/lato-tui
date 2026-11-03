# Lato Installation and Distribution Audit

Audit baseline: `51156f4ba6b7902504c549fbe0f6b420fa4ef572` on
`lato-development`.

## Executive Summary

Lato has a supported **source/developer workflow**, but it does not currently
have a public native-binary release or a usable one-command installer.

The current practical workflow is:

```text
git clone -> bun install -> bun run dev
```

from the repository root. This runs the source application and does not install
a global `lato-cli` command.

GitHub Actions builds all 12 native targets and uploads per-job archives as
Actions artifacts. Those artifacts are not GitHub Release assets. There are
currently no GitHub Releases in `lazyarjun2005-rgb/lato-tui`, so the installer
scripts point at URLs that do not currently resolve to downloadable Lato
artifacts.

An external developer cannot currently perform:

```text
download -> install -> type lato-cli from any directory
```

without manually obtaining an Actions artifact or building/packaging Lato
themselves.

## Installation Capability Matrix

| Level                                  | Linux                                               | Windows                                                 | macOS                                                                                 |
| -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Source/developer installation          | Available                                           | Available by documented workflow; CI validated          | Available by documented workflow; CI support validated                                |
| CI-built native binary                 | Available as Actions artifact                       | Available as Actions artifact for x64; ARM64 build-only | Available as Actions artifact; ARM64 runtime verified, x64 runtime capability-limited |
| Downloadable GitHub Release archive    | Not available                                       | Not available                                           | Not available                                                                         |
| Installer-based installation           | Script exists but cannot download a current release | Script exists but cannot download a current release     | Script exists but cannot download a current release                                   |
| Globally installed `lato-cli`          | Not available from a public Lato package            | Not available from a public Lato package                | Not available from a public Lato package                                              |
| Published package-manager installation | Not available                                       | Not available                                           | Not available                                                                         |

## Source Installation Today

### Documented commands

`README.md:43-62` documents Linux/macOS source setup:

```bash
git clone https://github.com/lazyarjun2005-rgb/lato-tui.git
cd lato-tui
bun install
bun run dev
```

Windows uses the equivalent PowerShell flow at `README.md:64-96`:

```powershell
cd lato-tui
bun install
bun run dev
```

The root script is `package.json:8-23`:

```json
"dev": "bun run --cwd packages/opencode src/index.ts"
```

Therefore the source workflow must be run from the repository root, or the
equivalent package-local command must be used. `packages/opencode/package.json`
also exposes `dev` as `bun run ./src/index.ts`.

### Bun requirement

Bun `1.4.4` is required by the root `package.json:7` package-manager field and
is used by the scripts, TypeScript execution, workspace installation, and build
process. GitHub Actions obtains this version through
`.github/actions/setup-bun/action.yml:18-38`.

This is a source/developer workflow, not a product installation. It does not:

- Install a global `lato-cli` command.
- Install a native binary into PATH.
- Create a package-manager registration.
- Provide an uninstall operation.

### Source command behavior

The README documents source invocations such as:

```bash
bun run dev -- --help
bun run dev -- models
bun run dev -- run "Explain the structure of this project"
```

This is the verified form of the current developer workflow. A bare
`lato-cli --version` from an arbitrary directory is not established by the
source instructions.

## Native Build and Artifact Behavior

### Targets

`packages/opencode/script/build.ts:61-122` defines 12 targets:

- `lato-linux-x64`
- `lato-linux-x64-baseline`
- `lato-linux-x64-musl`
- `lato-linux-x64-baseline-musl`
- `lato-linux-arm64`
- `lato-linux-arm64-musl`
- `lato-darwin-arm64`
- `lato-darwin-x64`
- `lato-darwin-x64-baseline`
- `lato-windows-arm64`
- `lato-windows-x64`
- `lato-windows-x64-baseline`

The target selector is implemented at `build.ts:28-31` and `133-162`.

### Build output

Each target is generated under:

```text
packages/opencode/dist/<target>/bin/lato
```

Windows packaging uses the same generated binary path and archives it as
`lato.exe` in the workflow. `build.ts:164` clears `dist` before a build.

When `Script.release` is enabled, `build.ts:260-268` creates Linux tarballs and
macOS/Windows zip files and attempts to upload them to an existing GitHub
Release. The cross-platform workflow does not use that release path.

### CI artifacts versus releases

`.github/workflows/cross-platform-build.yml`:

- Builds one target per matrix job at lines `170-173`.
- Performs native, Alpine, or Rosetta/build-only verification at lines `175-228`.
- Creates Linux archives at lines `230-236`.
- Creates macOS archives at lines `238-244`.
- Creates Windows archives containing `lato.exe` at lines `246-255`.
- Uploads them using `actions/upload-artifact` at lines `257-262`.

These are GitHub Actions run artifacts. They are not GitHub Release assets and
are not stable public download URLs.

The workflow does not create a Release, attach artifacts to a Release, publish
an npm package, or publish a registry package.

The repository currently has no GitHub Releases according to the read-only
GitHub inspection. Snapshot branches exist, but they are not release channels.

### Runtime verification

The current CI capability split is:

| Target group                     | Current evidence                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Linux x64 and x64 baseline       | Native `lato --version` verification                                                                                                                    |
| Linux x64 musl and baseline-musl | Alpine 3.20 verification with `libstdc++` and `libgcc`                                                                                                  |
| Linux ARM64 and ARM64 musl       | Native/Alpine ARM64 verification on the ARM64 runner                                                                                                    |
| Windows x64 and x64 baseline     | Native Windows verification                                                                                                                             |
| Windows ARM64                    | Build and archive only; no hosted ARM64 Windows runtime runner                                                                                          |
| macOS ARM64                      | Native Apple Silicon verification                                                                                                                       |
| macOS x64 and x64 baseline       | Build verified; runtime verification may be build-only because Bun 1.4.4 requires AVX unavailable through the hosted ARM64 runner's Rosetta environment |

The latest successful workflows for `51156f4` are:

- Cross-platform build: `https://github.com/lazyarjun2005-rgb/lato-tui/actions/runs/41610841364`
- Native validation: `https://github.com/lazyarjun2005-rgb/lato-tui/actions/runs/41610841413`

CI success proves build and selected runtime paths. It does not create a user-
downloadable release or validate external installation.

## CLI Entry Point and Resolution

### Public command

`packages/opencode/package.json:18-20` declares:

```json
"bin": {
  "lato-cli": "./bin/lato-cli.cjs"
}
```

`packages/opencode/bin/lato-cli.cjs:1-3` is a Node-compatible shim that calls
`run.cjs`.

### Resolution order

`packages/opencode/bin/run.cjs:47-219` resolves the native executable in this
order:

1. `LATO_BIN_PATH`, if set.
2. A `.lato` cache beside the launcher.
3. A sibling `lato` or `lato.exe` beside the launcher.
4. A local checkout path under `dist/<target>/bin/`.
5. A matching native package under ancestor `node_modules/<target>/bin/`.

The launcher maps `win32` to the `windows` target name and uses `lato.exe` on
Windows (`run.cjs:57-76`). It also selects baseline targets when AVX2 is not
detected (`run.cjs:78-175`).

This is a reliable launcher design for a correctly packaged installation, but a
correctly packaged installation does not currently exist publicly.

### Current availability

The package is private (`packages/opencode/package.json:6`) and the workspace
package is not published. A checkout therefore does not provide a globally
registered `lato-cli` command merely by running `bun install`.

The source workflow invokes `src/index.ts` directly through Bun rather than
through the `lato-cli.cjs` package bin.

## Installer Audit

### `install.sh`

`install.sh:28-66` detects Linux/macOS and x64/ARM64. It selects baseline x64
when AVX2 is unavailable and detects musl on Linux (`install.sh:68-92`).

It requests assets using:

```text
https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v<VERSION>/<asset>
```

at `install.sh:103-121`.

The script currently cannot work against the repository's actual public state
because no Lato Release assets are published.

If assets existed, it would:

- Install to `${HOME}/.local/bin` (`install.sh:13`).
- Extract `lato` and rename it to `lato-cli` (`install.sh:124-139`).
- Print a PATH instruction but not modify shell startup files (`install.sh:152-163`).
- Verify by executing `~/.local/bin/lato-cli --version` (`install.sh:141-149`).

It does not:

- Verify SHA-256 checksums or signatures.
- Use a private temporary directory; it uses `/tmp/<asset>`.
- Provide uninstall behavior.
- Reliably preserve the prior binary if extraction or replacement fails.
- Guarantee that `lato-cli` is available from every shell after installation; it
  only warns when the directory is absent from PATH.

An explicit version is accepted as the first argument. `latest` queries the
GitHub Releases API, which currently has no Lato release to resolve.

### `install.ps1`

`install.ps1:33-64` detects Windows x64/ARM64 and baseline x64. It downloads
from the same nonexistent Release channel at lines `66-92`.

If a valid release existed, it would:

- Default to `$env:USERPROFILE\.local\bin` (`install.ps1:19-22`).
- Extract `lato*.exe` and rename it to `lato-cli.exe` (`install.ps1:95-112`).
- Verify `lato-cli.exe --version` (`install.ps1:115-129`).
- Print a user PATH instruction without changing the environment automatically
  (`install.ps1:131-141`).

It does not:

- Verify checksums or signatures.
- Use an isolated extraction directory; it deletes/reuses `$env:TEMP\lato-extract`.
- Provide uninstall behavior.
- Safely preserve the prior executable if replacement fails.

### Installer classification

| OS      | Current classification                                      | Reason                                                                       |
| ------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Linux   | Partially available in source only; installer not available | Script exists, but no release asset exists and no checksum validation exists |
| Windows | Partially available in source only; installer not available | Script exists, but no release asset exists and no checksum validation exists |
| macOS   | Partially available in source only; installer not available | Script exists, but no release asset exists and no checksum validation exists |

## Published Package and Release Audit

`packages/opencode/script/publish.ts` does not establish a Lato release:

- It generates a package named `opencode-ai` at lines `43-68`.
- It publishes npm packages with `npm publish` at lines `14-24`.
- It still references OpenCode Docker, AUR, Homebrew, and repository metadata at
  lines `70-213`.
- It requires external credentials and registry/repository ownership.

The root `package.json` and `packages/opencode/package.json` are private/source
workspace metadata, not a public installation package.

Classification: **published package-manager installation is not available**.

## Configuration, Authentication, and User Data

The source and binary launcher do not change the compatibility data model.

`packages/core/src/global.ts:10-30` defines shared data/cache/state roots using
the compatibility application name `opencode`. `global.ts:94-103` defines the
Lato-owned configuration directory behavior:

- Linux: `$XDG_CONFIG_HOME/lato` or `~/.config/lato`.
- macOS: `$XDG_CONFIG_HOME/lato` or `~/Library/Application Support/Lato`.
- Windows: `$XDG_CONFIG_HOME/lato` or `%APPDATA%\Lato`.

The default data and database paths remain compatibility-oriented. The database
path is `Global.Path.data/opencode.db` in normal/latest channels
(`packages/core/src/database/database.ts:43-55`). Authentication remains under
the compatibility data path, including `auth.json` and `mcp-auth.json`.

This means an external installation, once available, must preserve existing
configuration, credentials, sessions, and databases rather than creating a
parallel destructive namespace.

## Exact Commands That Work Today

These commands are supported by the current source documentation and scripts,
but are not re-executed in this audit:

```bash
git clone https://github.com/lazyarjun2005-rgb/lato-tui.git
cd lato-tui
bun install
bun run dev
```

CLI arguments can be passed through the root script:

```bash
bun run dev -- --help
bun run dev -- models
bun run dev -- run "Explain the structure of this project"
```

Equivalent Windows PowerShell commands are documented in `README.md:75-94`.

## Commands That Do Not Work as a Public Installation

These are not currently supported as external-user commands:

```bash
lato-cli --version
lato-cli --help
```

from a fresh checkout or arbitrary directory without a separately installed
native/package artifact.

The following installer commands are also not currently usable because the
referenced release assets do not exist:

```bash
curl -fsSL https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.sh | bash
```

```powershell
irm https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.ps1 | iex
```

They can only become functional after a matching Lato GitHub Release exists.

## README Accuracy Review

Currently accurate:

- Source installation is the only supported installation method.
- Bun 1.4.4 and Git are required.
- `bun run dev` is the source entry point.
- No official installer or packaged binary is published.
- Provider credentials are needed for hosted-model use.

Needs eventual follow-up after a real release exists:

- Add an actual binary-download installation section.
- Add checksums and archive verification instructions.
- Document post-install PATH behavior and supported release tags.
- Provide upgrade/uninstall guidance.
- State which targets are runtime-verified versus build-only.

The current README does not falsely claim that binary releases are published.

## Local and GitHub State

The remote `lato/lato-development` ref also points to `51156f4`, but the local
README is not byte-identical to the README at that commit because the working
tree contains uncommitted Phase 4.5 documentation changes. The remote branch
therefore does not yet contain the local README/status updates or the Phase 4.5
and Phase 5 planning documents.

The same distinction applies to the existing local documentation changes: they
are preserved in the working tree but are not published in Git history by this
audit.

## Required Work for `download -> install -> lato-cli`

1. Approve a Lato GitHub Release contract and tag/version scheme.
2. Create Release assets from the already-defined CI target archives.
3. Publish a SHA-256 manifest with every release.
4. Harden both installers with isolated temporary directories and checksum
   verification.
5. Define safe replacement, upgrade, and uninstall behavior.
6. Validate installed `lato-cli --version` and `lato-cli --help` on Linux,
   Windows x64, and macOS ARM64.
7. Document build-only macOS x64 and Windows ARM64 limitations.
8. Decide signing/notarization and package-manager ownership before enabling
   those channels.

## Evidence Classification

### Verified by source inspection or existing CI evidence

- The source workflow and commands exist.
- Bun 1.4.4 is pinned.
- The public bin field is `lato-cli`.
- The launcher maps platform/architecture names and searches native package,
  sibling, cache, and local `dist` paths.
- CI defines 12 native targets and uploads per-job artifacts.
- Latest cross-platform and native-validation workflows passed for `51156f4`.
- No GitHub Releases are currently listed.
- Install scripts target GitHub Release URLs, not Actions artifact URLs.

### Not verified by this audit

- Fresh checkout dependency installation.
- A new local native build.
- Running `lato-cli --version` from a packaged archive.
- Real installer execution on Linux, Windows, or macOS.
- Provider authentication against a real or fixture provider.
- First coding session from a fresh installation.
- Session recovery after an external process restart.

## Repository State

- Branch: `lato-development`
- HEAD: `51156f4`
- Existing Phase 4.5 and Phase 5 planning changes were preserved.
- This audit adds `LATO_INSTALLATION_AUDIT_REPORT.md` only.
- No source, workflow, lockfile, or README file was modified by this audit.
