# Lato Phase 4.4 Distribution Audit

Status: audit and implementation-plan stage only. No Phase 4.4 production
implementation, native build, package publication, installer execution, Docker
build, Nix build, release operation, or external installation was performed.

Repository: `/home/arjun/Desktop/lato-base`
Branch: `lato-development`

## Executive Summary

The repository has Lato user-facing identity and a Lato CommonJS package bin,
but it does not yet provide an independently installable Lato distribution.

The immediate Linux blocker is reproducible:

```text
cd packages/opencode
node bin/lato.cjs --version
```

The launcher reports that no native Lato CLI package is installed. This is
expected from the current source tree because:

- `bin/lato.cjs` delegates to `bin/run.cjs`.
- `run.cjs` searches for a sibling `lato`, cached `.lato`, or native packages
  named `opencode-*`.
- `packages/opencode/package.json` has no `optionalDependencies` containing
  native CLI packages.
- `packages/opencode/bin/` contains the two JavaScript launchers but no sibling
  native executable.
- Native packages are generated only by the build/publish pipeline and retain
  OpenCode-derived names such as `opencode-linux-x64`.
- The published wrapper package is generated as `opencode-ai`, not a Lato-owned
  package.

The native build itself already emits a `lato` executable, but its output
package names, archives, registry metadata, Docker image, Homebrew/AUR
artifacts, root installer, and upgrade ownership remain OpenCode-derived.

## 1. Package Metadata Audit

`packages/opencode/package.json` currently has:

- Private package name `opencode`.
- Version `1.19.5`.
- One bin entry: `lato: ./bin/lato.cjs`.
- No native optional dependencies.
- Workspace dependencies still using `@opencode-ai/*` identifiers.
- OpenCode-named third-party package dependencies where inherited compatibility
  requires them.

The package bin exposes the correct command name, but package metadata does not
describe a complete installable Lato distribution.

The generated package in `script/publish.ts` currently becomes:

```text
opencode-ai
```

with native optional dependencies collected from `dist/*/package.json`. This is
an OpenCode-owned publication identity and cannot be treated as an independent
Lato release.

## 2. Launcher Audit

### `bin/lato.cjs`

`lato.cjs` is a thin Node launcher:

```js
require("./run.cjs").main()
```

It is suitable as the package-manager shim entry point.

### `bin/run.cjs`

The wrapper:

1. Reads `LATO_BIN_PATH`.
2. Checks a cached `.lato` path beside the wrapper.
3. Checks a sibling `lato` or `lato.exe`.
4. Detects platform, architecture, AVX2, and Linux musl/glibc.
5. Searches parent `node_modules` directories for native packages named with
   the `opencode-${platform}-${arch}` convention.
6. Spawns the selected binary and forwards signals.

The signal forwarding and argument forwarding are appropriate. The unresolved
ownership problem is the native package naming and source-package availability.

The wrapper currently reports OpenCode-derived manual package names when it
fails. This must become Lato-owned after package/repository names are approved.

`node bin/run.cjs --version` does not invoke `main()` directly; the intended
entry point is `bin/lato.cjs`. This is not a package-manager defect, but direct
execution tests should target `lato.cjs`.

## 3. Native Build Audit

`packages/opencode/script/build.ts` already emits:

```text
dist/<native-target>/bin/lato
```

It supports Linux, macOS, and Windows target matrices, including:

- Linux arm64/x64.
- Linux musl variants.
- Linux x64 baseline variants.
- macOS arm64/x64 and x64 baseline.
- Windows arm64/x64 and x64 baseline.

The build also:

- Embeds the application bundle unless skipped.
- Emits Lato user-agent and binary names.
- Runs `--version` smoke tests only for the current native platform.
- Generates native package directories with `package.json` files.

Current limitation: generated native package names use `pkg.name`, which is
currently `opencode`. The build therefore emits OpenCode-derived native package
names even though the binary itself is called `lato`.

The build also invokes several native dependency installs unless `--skip-install`
is supplied. A Linux-first focused build must use `--single --skip-install`
after dependencies are already present, or another explicitly bounded command.

## 4. Optional Native Package Audit

The source package declares no `optionalDependencies`, so a local package
installation cannot automatically install a native binary.

The generated publish package declares optional dependencies from the native
build output, but those names are currently `opencode-*`. This creates a split:

- Source workspace package: launcher exists, native package metadata absent.
- Generated distribution package: native package metadata exists, but names and
  publication identity are OpenCode-derived.

The intended Phase 4.4 fix must make the Lato package metadata and generated
native package names agree. It must not introduce an OpenCode executable as a
fallback feature.

## 5. Postinstall Audit

`script/postinstall.mjs`:

- Detects the current platform and architecture.
- Detects AVX2 and Linux musl.
- Resolves native package names from `optionalDependencies`.
- Copies `bin/lato` or `bin/lato.exe` into the package's `bin` directory.
- Verifies the copied binary with `--version`.
- Falls back to a temporary `npm install --ignore-scripts` if the optional
  package is unavailable.

This is a useful installation mechanism, but it is not independently Lato-owned
because:

- It expects generated optional dependencies to exist.
- It currently resolves OpenCode-derived native package names.
- It uses a temporary npm install fallback without an independent Lato registry
  or release source.
- It does not provide an upgrade/uninstall ownership contract.

The postinstall must never overwrite an existing OpenCode executable. Its copy
target is the current package's `bin/lato` path, which is safe when the package
itself is independently named and installed.

## 6. Release Workflow Audit

`.github/workflows/publish.yml` remains OpenCode-owned:

- Runs only for the upstream `anomalyco/opencode` repository and `v1` branch.
- Installs `opencode-ai` globally.
- Uses OpenCode release/version environment variables.
- Builds OpenCode-named native package directories.
- Uploads artifacts under OpenCode-derived names.
- Calls `script/publish.ts`, which publishes `opencode-ai` and native
  `opencode-*` packages.
- Pushes Docker, AUR, and Homebrew changes through OpenCode infrastructure.

This workflow cannot be treated as a Lato release workflow. Phase 4.4 must not
enable or execute it for Lato without an approved Lato repository, registry,
release feed, signing identity, and artifact ownership.

## 7. Docker and Nix Audit

### Docker

`packages/opencode/Dockerfile` already launches `/usr/local/bin/lato` and uses
the Lato binary in the build output. However, the image is still built from the
OpenCode package/repository context and is not independently published as a
Lato-owned image.

Phase 4.4 may prepare local Docker path tests, but must not build or push an
image under an OpenCode or unapproved Lato registry identity.

### Nix

`nix/opencode.nix` already installs `$out/bin/lato`, generates completions for
`lato`, and uses the native Lato build output. Its derivation remains named
`opencode`, and the schema output remains under an OpenCode share path.

The Nix executable path is close to independently usable locally, but package
attribute naming and flake/channel ownership remain unresolved.

## 8. Homebrew, AUR, and Root Installer Audit

`script/publish.ts` still generates:

- AUR package `opencode-bin`.
- OpenCode GitHub release URLs.
- OpenCode homepage and repository metadata.
- An OpenCode Homebrew formula/class and tap.
- OpenCode package conflict/provides identifiers.

The root `install` script still downloads from `opencode.ai` and installs
OpenCode release assets. It is not safe to redirect users to it as a Lato
installer.

Existing README translations and web installation instructions also advertise
OpenCode package/install commands. They are outside the focused CLI/TUI
implementation boundary unless explicitly included in a later documentation
pass.

## 9. Upgrade and Uninstall Audit

`lato upgrade` currently reports that self-upgrade is unavailable. The legacy
installation service still contains OpenCode npm, Homebrew, Scoop, Chocolatey,
and curl upgrade logic, including OpenCode URLs and package names.

`lato uninstall` is intentionally unavailable and guarded before filesystem
operations. This is currently the safe behavior because Lato does not own an
independent package identity or installation root.

Phase 4.4 must not enable upgrade or uninstall until the package, binary path,
installation ownership, and coexistence rules are explicit.

## 10. Why Source `lato` Currently Fails

The current failure is caused by the combination of these facts:

1. `bin/lato.cjs` requires `bin/run.cjs`.
2. No native `bin/lato` or `bin/lato.exe` exists in the source package.
3. The source `package.json` has no native optional dependencies.
4. `run.cjs` searches only known native package layouts and `LATO_BIN_PATH`.
5. The generated native packages are not installed in this workspace package.
6. The generated package naming still uses `opencode-*` and `opencode-ai`.

Therefore, renaming the source launcher alone cannot make `lato` independently
installable.

## 11. Linux-First Focused Implementation Plan

After approval of the implementation plan, proceed sequentially:

1. Define a local Lato native target naming helper shared by build, publish
   metadata, postinstall, and launcher tests.
2. Make the single-target Linux build emit a native `lato` binary and a
   deterministic Lato-native package descriptor without publishing it.
3. Add a local package fixture containing the native binary and verify
   `bin/lato.cjs --version` and `bin/lato.cjs --help`.
4. Verify `lato` launches the interactive TUI through the native binary, using
   a disposable home/config/state environment and no OpenCode installation.
5. Make generated package metadata declare the matching native optional package
   names; do not install or publish them.
6. Test postinstall and launcher behavior against synthetic package layouts,
   including missing binaries, baseline CPU fallback, and `LATO_BIN_PATH`.
7. Define an independent installation layout without deleting or overwriting
   OpenCode binaries.
8. Keep upgrade/uninstall disabled unless the implementation can identify only
   Lato-owned files and packages.
9. Add Windows/macOS path and package-layout fixtures without claiming native
   execution.
10. Prepare, but do not execute, Lato-owned Docker/Nix/Homebrew/AUR/release
    metadata changes unless the required external ownership values are approved.

## 12. Windows and macOS Requirements

Required before claiming support:

- Native `lato.exe` and `.cmd`/PATHEXT package-manager behavior on Windows.
- Windows x64/arm64 and baseline selection tests.
- macOS arm64/x64 binary execution and signing behavior.
- macOS quarantine/codesign handling.
- Native postinstall replacement and executable permissions.
- Package-manager shim behavior from npm, pnpm, Bun, and yarn where supported.
- Native CI evidence for `--version`, `--help`, and TUI launch.

The existing native validation workflow covers focused identity/state tests on
Ubuntu, Windows, and macOS, but it does not yet build or install the packaged
native distribution.

## 13. Remaining Product Decisions

The following values are not present and must not be invented:

- Lato npm package name and registry owner.
- Lato native package naming namespace.
- Lato release repository and artifact URLs.
- Lato Docker registry/image.
- Lato Homebrew tap/formula name.
- Lato AUR package name.
- Lato installer URL and upgrade feed.
- Lato signing/notarization identities.
- Whether inherited OpenCode package names are compatibility aliases or remain
  permanently separate.

The Linux source/build implementation can proceed with local synthetic names,
but publishing and external installation cannot proceed until these values are
approved.
