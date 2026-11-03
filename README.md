<p align="center">
  <img src="packages/ui/src/assets/brand/logo-lato.png" alt="Lato" width="320">
</p>

# Lato

Lato is an independent, cross-platform AI coding assistant for the terminal. It combines an interactive TUI with a scriptable CLI, a local server, and a locally served web interface, so you can work with an AI agent without leaving your development workflow.

> **Project status:** early development. Lato runs from source, and focused Linux, Windows, and macOS CI validation is passing. macOS x64 runtime execution remains capability-limited on the current ARM64 runner. Installer scripts and CI release tooling exist in the repository, but no packaged installers or binary releases are published, and packaged installation is not usable yet.

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

| Platform | Source CLI/TUI | Packaged binary | Status                                                                  |
| -------- | -------------- | --------------- | ----------------------------------------------------------------------- |
| Linux    | Validated      | Not published   | Native x64 and musl CI validation passed                                |
| Windows  | Validated      | Not published   | Focused native x64 CI validation passed; Windows Terminal recommended   |
| macOS    | Validated      | Not published   | ARM64 CI validation passed; x64 builds are verified, runtime is limited |

Source installation is the only supported installation method at this time.

## Requirements

- [Bun](https://bun.sh/) 1.4.4, the version pinned in `package.json`
- Git
- A terminal with Unicode and ANSI support; Windows Terminal is recommended on Windows
- Provider credentials if you want to use a hosted model; local CLI commands work without them

## Installation

Lato is currently distributed as source. There is no official installer, package, or prebuilt binary. Use the source in this repository.

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
state-path, persistence, and runtime coverage. No official `lato.exe` is
published; do not download one from third-party sources.

### Notes for all platforms

- Run `bun install` from the repository root; Lato uses a Bun workspace.
- A source run is tied to the checkout. These steps do not install a global `lato` command.
- Confirm `bun --version` reports 1.4.4 before reporting installation issues.

## Packaged Developer Preview installation — not available yet

A packaged Developer Preview without a repository checkout or Bun is prepared, but is **not usable today**, because no Lato GitHub Release exists. The repository contains installer scripts (`install.sh` for Linux/macOS, `install.ps1` for Windows) plus CI archive and checksum jobs, and they only start working once the first Lato GitHub Release is published with archives and a `SHA256SUMS` manifest. This README will be updated with verified commands and download URLs at that time. Do not run installers from third-party mirrors, and do not treat GitHub Actions artifacts as release downloads.

When the first release is published, the documented installation behavior will be:

|                               |                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Channel                       | GitHub Releases on `lazyarjun2005-rgb/lato-tui`, manual and explicit only                                                               |
| Version selection             | An explicit version is required (for example `0.1.0-preview.1`); there is no `latest` channel                                           |
| Archives                      | `lato-<os>-<arch>[-baseline][-musl].tar.gz` (Linux) or `.zip` (macOS/Windows) plus `SHA256SUMS`                                         |
| Verification                  | SHA-256 checksum entry for the archive must match `SHA256SUMS`; mismatch aborts without touching any installed binary                   |
| Linux/macOS install directory | `$XDG_BIN_HOME` or `$HOME/.local/bin`, overridable with `--install-dir`                                                                 |
| Windows install directory     | `%USERPROFILE%\.local\bin`, overridable with `-InstallDir`                                                                              |
| Installed command             | `lato-cli` (the internal binary inside each archive is `lato` or `lato.exe`)                                                            |
| Upgrade/reinstall             | Re-run the installer with the new explicit version; replacement is staged atomically and any existing install survives a failed run     |
| PATH setup                    | The installers print the exact directory to add to `PATH` and never edit shell startup files or the Windows PATH variable automatically |
| Uninstaller                   | Not provided                                                                                                                            |
| Signing                       | Developer-preview binaries are unsigned; Windows installers print an unsigned-preview warning                                           |

Planned platform behavior, matching the CI build matrix:

- Linux x64 and ARM64, with automatic musl and no-AVX2 (`-baseline`) selection.
- macOS ARM64 on Apple Silicon; macOS x64 with automatic `-baseline` selection.
- Windows x64, x64-baseline, and ARM64 (ARM64 binaries are build-verified in CI, not runtime-validated).
- A successful install verifies `lato-cli --version` with the absolute installed path before reporting success.

These behaviors are covered by local installer fixture tests; real installation against published release assets has not been executed yet and will only be claimed after it is.

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

- Lato-owned developer-preview release contract.
- The first packaged binaries and installers.
- Storage ownership decisions and a safe migration path.
- Broader terminal, platform, and accessibility coverage.
- Documentation and localization cleanup.

## License

Lato is released under the [MIT License](LICENSE). Third-party notices are recorded in [NOTICE](NOTICE).
