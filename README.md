<p align="center">
  <img src="packages/ui/src/assets/brand/logo-lato.png" alt="Lato" width="320">
</p>

# Lato

Lato is an independent, cross-platform AI coding assistant for the terminal. It combines an interactive TUI with a scriptable CLI, a local server, and a locally served web interface, so you can work with an AI agent without leaving your development workflow.

> **Project status:** early development. Lato runs from source, and focused Linux, Windows, and macOS CI validation is passing. macOS x64 runtime execution remains capability-limited on the current ARM64 runner. A packaged Developer Preview is published on GitHub Releases (`v0.1.0-preview.2`, explicit prerelease, never marked "latest") and installs through the official installers below; `v0.1.0-preview.2` was updated successfully on a real Arch Linux machine and reports `lato 0.1.0-preview.2`.

## Features

- **Interactive terminal UI** with streaming responses, persistent sessions, themes, and a compact mini mode.
- **Scriptable CLI** for prompts, model discovery, provider management, session export, and automation.
- **Project-aware tools** for inspecting and editing files, running shell commands, and approving sensitive actions through permission prompts.
- **Persistent sessions** that can be resumed, forked, or attached to a running local server.
- **Extensible integrations** including MCP servers, ACP server mode, plugins, agents, and GitHub pull-request workflows.
- **Provider-agnostic model access** through API keys or OAuth, with compatibility for existing provider configuration.
- **Local server and web UI** for headless use or browser-based access without a hosted service.
- **Independent preferences** so Lato's TUI theme and interface settings stay in their own state namespace.

## Screenshots

Screenshots and terminal recordings will be added after the first public UI capture. No mocked or fabricated product screenshots are included.

## Platform status

| Platform | Source CLI/TUI | Packaged binary                | Status                                                                  |
| -------- | -------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Linux    | Validated      | Published (real-machine validated) | Native x64 and musl CI validation passed; `v0.1.0-preview.2` installed on an Arch Linux x64 (no-AVX2) machine |
| Windows  | Validated      | Published (build-verified)     | Focused native x64 CI validation passed; Windows Terminal recommended; real-machine installer run not yet exercised |
| macOS    | Validated      | Published (ARM64 CI runtime-validated) | ARM64 CI validation passed; x64 builds are verified, runtime is limited; real-machine installer run not yet exercised |

Packaged installation is available through the official installers (see "Install the packaged Developer Preview" below); source installation is the checkout-based alternative for development.

## Requirements

- [Bun](https://bun.sh/) 1.4.4, the version pinned in `package.json`
- Git
- A terminal with Unicode and ANSI support; Windows Terminal is recommended on Windows
- Provider credentials if you want to use a hosted model; local CLI commands work without them

## Installation from source

Lato can also run directly from a checkout of this repository, which is useful for development.

### Linux and macOS

```bash
git clone https://github.com/lazyarjun2005-rgb/lato-tui.git
cd lato-tui
bun install
bun run dev
```

`bun run dev` starts the TUI in the current directory. Pass CLI arguments through the root script with `--`:

```bash
bun run dev -- --help
bun run dev -- models
bun run dev -- run "Explain the structure of this project"
```

### Windows

1. Install [Git for Windows](https://git-scm.com/download/win).
2. Install Bun 1.4.4 using the [official Bun installation instructions](https://bun.sh/docs/installation).
3. Open **Windows Terminal** (recommended) or PowerShell and verify both tools:

```powershell
git --version
bun --version
```

4. Clone the repository and install dependencies:

```powershell
git clone https://github.com/lazyarjun2005-rgb/lato-tui.git
cd lato-tui
bun install
```

5. Start Lato:

```powershell
bun run dev
```

6. Run CLI commands from the repository root:

```powershell
bun run dev -- --help
bun run dev -- providers
```

Focused native Windows validation passes in CI, including identity, executable,
state-path, persistence, and runtime coverage. Official packaged Windows
binaries (including `lato.exe`) are published as GitHub Releases prereleases;
do not download one from third-party sources.

### Notes for all platforms

- Run `bun install` from the repository root; Lato uses a Bun workspace.
- A source run is tied to the checkout. These steps do not install a global `lato` command.
- Confirm `bun --version` reports 1.4.4 before reporting installation issues.

## Install the packaged Developer Preview (official installers)

Lato is distributed as unsigned Developer Preview releases on
[GitHub Releases](https://github.com/lazyarjun2005-rgb/lato-tui/releases). The
current published prerelease is
[`v0.1.0-preview.2`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/tag/v0.1.0-preview.2):
12 archives plus a `SHA256SUMS` manifest, all built and version-asserted by
GitHub Actions, without a repository checkout or Bun. This release was installed
on a real Arch Linux machine (x64, no-AVX2), where the installer verified the
checksum, replaced the previous installation atomically, and reported
`lato 0.1.0-preview.2`. Installer runs on Windows and macOS have not yet been
executed on real machines; their installer implementations and fixtures are
validated locally and in CI.

### Linux and macOS

```bash
curl -fsSL https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/lato-development/install.sh | bash -s -- 0.1.0-preview.2
```

Then open a new terminal and verify:

```bash
lato-cli --version
```

### Windows

```powershell
Invoke-WebRequest -Uri https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/lato-development/install.ps1 -OutFile install.ps1
pwsh install.ps1 -Version 0.1.0-preview.2
```

Then open a new terminal and verify: `lato-cli.exe --version`.

### Installation behavior

|                               |                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Channel                       | GitHub Releases on `lazyarjun2005-rgb/lato-tui`, manual and explicit only                                                               |
| Version selection             | An explicit version is required (for example `0.1.0-preview.2`); there is no `latest` channel                                            |
| Archives                      | `lato-<os>-<arch>[-baseline][-musl].tar.gz` (Linux) or `.zip` (macOS/Windows) plus `SHA256SUMS`                                         |
| Verification                  | The installer downloads the archive and its `SHA256SUMS` manifest together, verifies the checksum, and fails closed before installing    |
| Linux/macOS install directory | `$XDG_BIN_HOME` or `$HOME/.local/bin`, overridable with `--install-dir`                                                                 |
| Windows install directory     | `%USERPROFILE%\.local\bin`, overridable with `-InstallDir`                                                                              |
| Installed command             | `lato-cli` (the internal binary inside each archive is `lato` or `lato.exe`)                                                            |
| Upgrade/reinstall             | Re-run the installer with the new explicit version; replacement is staged atomically and any existing install survives a failed run     |
| PATH setup                    | The installers print the exact directory to add to `PATH` and never edit shell startup files or the Windows PATH variable automatically |
| Uninstaller                   | Not provided; configuration, sessions, and user data are never removed by the installer                                                  |
| Signing                       | Developer-preview binaries are unsigned; the Windows installer prints an unsigned-preview warning                                        |
| Update checks                 | None; upstream update feeds are disabled and no Lato update channel exists yet                                                           |

Platform behavior matches the CI build matrix, and CI asserts the installed
version stamp for each executable it can runtime-verify:

- Linux x64 and ARM64, with automatic musl and no-AVX2 (`-baseline`) selection; runtime-verified in CI and validated on a real machine for `v0.1.0-preview.2`.
- macOS ARM64 on Apple Silicon (runtime-verified in CI); macOS x64 with automatic `-baseline` selection is build-verified (CI hosts lack AVX).
- Windows x64, x64-baseline, and ARM64: x64 variants are runtime-verified in CI; ARM64 is build-verified in CI, not runtime-validated.
- A successful install verifies `lato-cli --version` with the absolute installed path before reporting success.

Do not run installers from third-party mirrors, and do not treat GitHub Actions artifacts as release downloads. Cross-check `SHA256SUMS` from the release page before reporting issues, and confirm `lato-cli --version` reports the version you installed.

## Configuration basics

- Run `/connect` in the TUI or `bun run dev -- providers` to choose a provider and authenticate.
- List available models with `bun run dev -- models`, or select one interactively in the TUI.
- Project and user settings are read through the compatibility configuration layer; existing project configuration does not need to be migrated.
- Lato stores TUI preferences such as the selected theme at `lato/kv.json` under the runtime state directory, for example `~/.local/state/lato/kv.json` on Linux.
- Never commit provider credentials, session data, or local state.

## Providers and models

Lato is provider-agnostic. It retains the provider integrations included in the engine, including API-key and OAuth flows, and does not require a specific vendor. Use the provider and model commands above to inspect what is available in your checkout.

Provider configuration and credentials are handled by the existing provider workflow. Lato does not require credentials for commands that only inspect or manage local state.

## Development

Install dependencies once from the repository root:

```bash
bun install
```

Useful commands:

```bash
bun run dev        # start the TUI
bun run lint       # run the linter
bun run typecheck  # typecheck the workspace; may take several minutes
```

Tests must run from their package directories, not from the repository root; the root test script intentionally exits with an error to prevent accidental whole-repository runs. Run the package-local `bun test` command from the CLI and TUI package directories under `packages/`. The repository currently includes focused coverage for runtime identity, native state resolution, preference persistence, uninstall safety, and the storage prototype.

Format the README before submitting documentation changes:

```bash
bunx prettier --check README.md
```

## Contributing

Contributions are welcome. Keep changes focused, add or update tests for behavior changes, and run the relevant package tests plus `bun run lint` before opening a pull request. Describe user-visible changes and platform-specific testing in the pull request. Do not include credentials, personal data, or generated local state in commits.

## Roadmap

These are planned directions, not commitments or currently available features:

- Lato-owned developer-preview release contract (first prereleases are published; hardening, signing, and update channels remain future work).
- An optional `latest` channel, uninstaller, and signed binaries.
- Storage ownership decisions and a safe migration path.
- Broader terminal, platform, and accessibility coverage.
- Documentation and localization cleanup.

## License

Lato is released under the [MIT License](LICENSE). Third-party notices are recorded in [NOTICE](NOTICE).
