<p align="center">
  <img src="packages/ui/src/assets/brand/logo-lato.png" alt="Lato" width="320">
</p>

# Lato

Lato is a terminal-first AI coding assistant. It combines an interactive TUI, a scriptable CLI, a local headless server, and a locally hosted web UI, and connects to whichever AI provider you choose. Lato is a community-driven, independently developed fork of [OpenCode](https://github.com/anomalyco/opencode), rebranded, refocused, and maintained under its own name; it shares no infrastructure or accounts with the upstream project.

> **Project status:** Developer Preview `v0.1.0-preview.3` ([GitHub Release](https://github.com/lazyarjun2005-rgb/lato-tui/releases/tag/v0.1.0-preview.3)). Pre-releases are explicit, unsigned, and never marked "latest". Lato is not yet production-ready; use it in shared or critical environments at your own risk. On a real Arch Linux machine the installer was exercised end-to-end and validated (checksum verification, no-AVX2 baseline auto-selection, atomic replacement, user-data preservation). Windows and macOS installers are CI- and fixture-validated but have not yet been exercised on real machines — firsthand test reports from those platforms are welcome.

## What Lato offers

- **Interactive terminal UI** with streaming responses, persistent sessions, themes, and a compact mini mode.
- **Scriptable CLI** for prompts, model discovery, provider management, session export/import, and automation.
- **Project-aware tools** for inspecting and editing files, running shell commands, and approving sensitive actions through permission prompts.
- **Persistent sessions** resumable, forkable, or attachable to a running local server.
- **Extensible integrations** including MCP servers, ACP server mode, plugins, custom agents, and GitHub PR workflows.
- **Provider-agnostic model access** through API keys, OAuth, or self-hosted/OpenAI-compatible endpoints.
- **Local server + web UI** for headless or browser-based use — nothing is hosted for you; your sessions stay on your machine.

## Installation

Requires no repository checkout and no Bun. Everything below installs the packaged Developer Preview from the official release ([view the release page](https://github.com/lazyarjun2005-rgb/lato-tui/releases/tag/v0.1.0-preview.3)).

### Download matrix

Each archive contains a single native binary (`lato`, or `lato.exe` on Windows). Pick one variant per machine:

| Platform                 | Download                                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows x64              | [`lato-windows-x64.zip`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-windows-x64.zip)                               |
| Windows x64 baseline     | [`lato-windows-x64-baseline.zip`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-windows-x64-baseline.zip)             |
| Windows ARM64            | [`lato-windows-arm64.zip`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-windows-arm64.zip)                           |
| Linux x64                | [`lato-linux-x64.tar.gz`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-linux-x64.tar.gz)                             |
| Linux x64 baseline       | [`lato-linux-x64-baseline.tar.gz`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-linux-x64-baseline.tar.gz)           |
| Linux x64 musl           | [`lato-linux-x64-musl.tar.gz`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-linux-x64-musl.tar.gz)                   |
| Linux x64 baseline musl  | [`lato-linux-x64-baseline-musl.tar.gz`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-linux-x64-baseline-musl.tar.gz) |
| Linux ARM64              | [`lato-linux-arm64.tar.gz`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-linux-arm64.tar.gz)                         |
| Linux ARM64 musl         | [`lato-linux-arm64-musl.tar.gz`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-linux-arm64-musl.tar.gz)               |
| macOS Apple Silicon      | [`lato-darwin-arm64.zip`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-darwin-arm64.zip)                             |
| macOS Intel x64          | [`lato-darwin-x64.zip`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-darwin-x64.zip)                                 |
| macOS Intel x64 baseline | [`lato-darwin-x64-baseline.zip`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/lato-darwin-x64-baseline.zip)               |
| Checksums                | `SHA256SUMS` on the [release page](https://github.com/lazyarjun2005-rgb/lato-tui/releases/tag/v0.1.0-preview.3)                                               |

Variant notes:

- **x64 vs ARM64:** not interchangeable; pick the one matching your CPU architecture (see per-platform detection below).
- **baseline:** builds for older x64 CPUs without AVX2 support. If your CPU is that older generation or a constrained VM, use the baseline archive; the installers auto-select it correctly.
- **musl:** for musl-based Linux systems (e.g. Alpine). Other distros use the default (glibc) builds.
- **macOS Intel:** baseline is the safe default for Intel Macs without AVX2; the installer auto-selects it.
- Checksums live on the release page: [`SHA256SUMS`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/SHA256SUMS).

### Linux

Detect your architecture:

```bash
uname -m          # x86_64 or aarch64
grep -o avx2 /proc/cpuinfo | head -1   # empty output → use the -baseline variant
```

#### Automatic (official installer)

```bash
curl -fsSL https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/lato-development/install.sh | bash -s -- 0.1.0-preview.3
```

Then open a new terminal and verify: `lato-cli --version` → `lato 0.1.0-preview.3`.

#### Manual (archive)

```bash
ARCHIVE=lato-linux-x64.tar.gz   # pick one variant from the table above
curl -fsSLO https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/$ARCHIVE
curl -fsSLO https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/SHA256SUMS
grep "$ARCHIVE" SHA256SUMS | sha256sum -c -
tar -xzf "$ARCHIVE"             # extracts a single ./lato binary (already executable)
mkdir -p ~/.local/bin && mv ./lato ~/.local/bin/lato-cli
```

Use any directory already on `PATH`; adjust the file name to `lato` or `lato-cli` as you prefer.

### macOS

Terminal-based, same installer script as Linux:

```bash
uname -m   # arm64 (Apple Silicon) or x86_64 (Intel)
curl -fsSL https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/lato-development/install.sh | bash -s -- 0.1.0-preview.3
lato-cli --version
```

Manual archive installation: download the matching zip from the table above, extract with `unzip`, and move the contained `lato` binary to a directory on `PATH` (for example `~/.local/bin/lato-cli`).

### Windows

Runs natively; Windows Terminal is recommended.

#### Automatic (PowerShell installer)

```powershell
# Check architecture: AMD64 → x64 variants; ARM64 → ARM64 variant
echo $env:PROCESSOR_ARCHITECTURE
Invoke-WebRequest -Uri https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/lato-development/install.ps1 -OutFile install.ps1
.\install.ps1 -Version 0.1.0-preview.3        # auto-selects ARM64 or x64 (+ baseline when no AVX2)
lato-cli.exe --version
```

#### Manual (archive)

Download the matching zip from the table above, extract it (the archive contains a single `lato.exe`), and place it in a directory on your `PATH` — for example `%USERPROFILE%\.local\bin`, mirroring the installer's default target.

### Verifying checksums manually

Both installers download the release archive together with its `SHA256SUMS` manifest and fail closed before installing anything. If installing manually, download [`SHA256SUMS`](https://github.com/lazyarjun2005-rgb/lato-tui/releases/download/v0.1.0-preview.3/SHA256SUMS) alongside your archive and verify:

```bash
# Linux
grep lato-linux-x64.tar.gz SHA256SUMS | sha256sum -c -

# macOS
grep lato-darwin-arm64.zip SHA256SUMS | shasum -a 256 -c -
```

```powershell
# Windows — compare the Get-FileHash output against the SHA256SUMS entry
Get-FileHash -Algorithm SHA256 lato-windows-x64.zip
Select-String -Pattern "lato-windows-x64.zip" SHA256SUMS
```

### What the installers do (and do not do)

| Topic           | Behavior                                                                                                     |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Version pinning | Explicit version argument required (e.g. `0.1.0-preview.3`); no implicit "latest" channel                    |
| Checksums       | Fail-closed against `SHA256SUMS` before installing                                                           |
| Version check   | `lato-cli --version` is run after install; a silent mismatch aborts with an error                            |
| Atomic replace  | Your current install keeps working if the install fails mid-run                                              |
| PATH            | The exact directory to add is printed; startup files and the Windows PATH variable are never edited silently |
| Uninstall       | Installers provide no uninstall mode; use `lato-cli uninstall` or remove the binary manually                 |
| Upgrade         | Re-run the installer with the newer explicit version; replacement is atomic                                  |

## Usage

Lato needs a terminal with Unicode and ANSI support (Windows Terminal is recommended on Windows).

Interactive TUI (start it from your project directory):

```bash
cd your-project
lato-cli
```

One-off scriptable prompt:

```bash
lato-cli run "Explain the structure of this project"
```

Useful everyday commands:

| Command                                    | Purpose                                                 |
| ------------------------------------------ | ------------------------------------------------------- |
| `lato-cli`                                 | Start the interactive TUI in the current directory      |
| `lato-cli run "<message>"`                 | Run a one-off prompt (no TUI)                           |
| `lato-cli providers login`                 | Log in to a provider; credentials are stored locally    |
| `lato-cli providers list`                  | Show configured providers and credentials               |
| `lato-cli models [provider]`               | List available models (all providers or a specific one) |
| `lato-cli session list`                    | List sessions                                           |
| `lato-cli serve`                           | Start a headless local server                           |
| `lato-cli web`                             | Start the local server and open the web interface       |
| `lato-cli attach <url>`                    | Attach a TUI to a running local server                  |
| `lato-cli export` / `import`               | Session JSON export/import                              |
| `lato-cli github` / `lato-cli pr <number>` | GitHub agent / PR-checkout-and-run workflows            |
| `lato-cli stats`                           | Token usage and cost statistics                         |
| `lato-cli mcp`                             | Manage MCP servers                                      |
| `lato-cli acp`                             | Start an ACP (Agent Client Protocol) server             |
| `lato-cli completion`                      | Generate shell completion                               |
| `lato-cli debug` / `lato-cli db`           | Troubleshooting / database tools                        |

The full command surface (including `agent`, `plugin`, and more) is documented in `lato-cli --help`.

## Providers and models

Lato is provider-agnostic: it ships with a built-in catalog of hosted providers and models, plus support for any OpenAI-compatible endpoint. All credentials are yours — set up hosted aggregators (e.g. OpenRouter, including its `:free` models), direct API-key providers, or a self-hosted local model server; nothing proxies through Lato itself.

Connect a provider and select a model interactively with `/connect` inside the TUI, or from the shell:

```bash
lato-cli providers login
lato-cli providers list
lato-cli models openrouter
```

For self-hosted or OpenAI-compatible endpoints (for example a local [Ollama](https://ollama.com) server, LM Studio, llama.cpp server, or any OpenAI-compatible gateway), configure a custom provider in your project or user config using the standard `@ai-sdk/openai-compatible` adapter — the example below points at a local Ollama instance:

```jsonc
{
  "provider": {
    "ollama": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Ollama (local)",
      "options": {
        "baseURL": "http://127.0.0.1:11434/v1",
      },
      "models": {
        "llama3.1:8b": { "name": "Llama 3.1 8B (local)" },
      },
    },
  },
}
```

Lato does **not** ship anonymous free-tier or tokenless model access; every provider requires credentials you own or a server you host.

## Configuration

- **Project config:** `lato.jsonc` (or `lato.json`) in the project root, or `.lato/lato.jsonc`.
- **User config:** the platform user-configuration directory — e.g. `~/.config/lato/` on Linux.
- **Backwards compatibility:** existing `opencode.jsonc` / `opencode.json` / `config.json` files, and `.opencode/` directories, are auto-detected and still work — no forced migration.
- **Credentials:** stored by `lato-cli providers login` under the platform data directory, for example `~/.local/share/opencode/auth.json` on Linux.
- **TUI preferences** (theme, state) live in the runtime state directory, e.g. `~/.local/state/lato/kv.json`.

Never commit provider credentials, session data, or local state.

## Upgrading and uninstalling

- **Upgrade:** re-run the installer above with the newer explicit version. Self-upgrade via `lato-cli upgrade` is intentionally unavailable in this development build.
- **Uninstall:** `lato-cli uninstall` removes the installation and its related files (review what it deletes with `lato-cli uninstall --help` first). If you installed manually, remove the binary and keep your session/auth directories.

## Development

This section is for people hacking on Lato itself, not for installing it to use day-to-day. Prefer the packaged Developer Preview (above) for normal use.

```bash
git clone https://github.com/lazyarjun2005-rgb/lato-tui.git
cd lato-tui
bun install
bun run dev          # start Lato from source (TUI in the current directory)
bun run lint         # lint the workspace (oxlint)
bun run typecheck    # typecheck the workspace (slower)
```

Bun 1.4.4 is pinned in `package.json` (`bun@1.4.4`) and is required. Lato is a Bun monorepo with per-package test setups — run `bun test` inside the relevant `packages/<name>` directory, never from the repo root (the root test script intentionally exits to prevent accidental whole-repo runs).

## Contributing

Contributions are welcome. Keep changes focused, add or update tests for behavior changes, and run the relevant package tests plus `bun run lint` before opening a pull request. Document user-visible changes and any platform-specific testing in the PR description. Do not commit provider credentials, personal data, or generated local state.

## License

Lato is released under the [MIT License](LICENSE) and remains a fork of the MIT-licensed [OpenCode](https://github.com/anomalyco/opencode) project. Third-party provider names and trademarks belong to their respective owners and do not indicate endorsement.

Unlike upstream OpenCode's hosted services, Lato runs entirely on your machine and never proxies your prompts through anything operated by this project.
