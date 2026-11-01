# Lato Phase 4.4 Implementation Report

## Status

Implemented the approved local-first Phase 4.4 scope.

The Linux x64 native Lato CLI now builds locally and the repository launcher
can resolve it from the generated local `dist` layout without an OpenCode
installation.

No public package was published. No external installer, Docker push, Nix
release, Homebrew/AUR operation, upgrade, or uninstall operation was executed.

## Implemented

### Shared native target naming

Added `packages/opencode/bin/native-target.cjs`. It provides shared Lato-native
names such as `lato-linux-x64`, `lato-linux-arm64-musl`,
`lato-darwin-x64-baseline`, and `lato-windows-arm64`.

The helper is used by local build and launcher paths without introducing a
public package namespace or release URL.

### Launcher

Updated `bin/run.cjs` to resolve Lato-native target names and search the
repository-local `dist` layout before package-manager locations. Existing
`LATO_BIN_PATH`, sibling binary, cached binary, native package lookup, argument
forwarding, and signal forwarding remain supported.

No OpenCode application executable fallback was introduced.

### Native build metadata

Updated `script/build.ts` so generated local native package directories use
Lato-native target names while retaining Bun's required `bun-*` compile target
syntax.

Updated local Docker and Nix binary paths to consume `dist/lato-*` layouts. No
Docker or Nix build was executed.

Updated `script/publish.ts` to include the shared resolver in generated local
launcher layouts. Nothing was published.

### Synthetic cross-platform coverage

Added executable tests for Linux, Windows, and macOS target naming. These tests
validate package-layout naming only and do not claim native Windows or macOS
execution.

## Linux Build Verification

Command:

```text
cd packages/opencode
bun run script/build.ts --single --skip-install --skip-embed-web-ui
```

Exact target built:

```text
lato-linux-x64
```

Generated binary:

```text
packages/opencode/dist/lato-linux-x64/bin/lato
```

Binary size:

```text
178157744 bytes
```

The build's native smoke test passed:

```text
lato 0.0.0-lato-development-202611011114
```

Generated local descriptor:

```text
packages/opencode/dist/lato-linux-x64/package.json
```

## Launcher Verification

Passed:

```text
node packages/opencode/bin/lato.cjs --version
```

Output:

```text
lato 0.0.0-lato-development-202611011114
```

Passed:

```text
node packages/opencode/bin/lato.cjs --help
```

The help output exposes `lato` commands, including the default interactive TUI
entry point, and does not expose an OpenCode application command.

## TUI Verification

The launcher was executed through a disposable pseudo-terminal with isolated
`HOME`, `OPENCODE_TEST_HOME`, `XDG_CONFIG_HOME`, `XDG_DATA_HOME`,
`XDG_STATE_HOME`, and `XDG_CACHE_HOME` values. `OPENCODE_PURE=1` and model-fetch
disabling were used.

Captured terminal output showed the Lato banner, prompt editor, model/status
area, and terminal title `Lato`. The process was terminated only by the bounded
test timeout; no background process was left running and temporary roots were
removed.

## Focused Tests

Passed sequentially:

- `packages/opencode`: `bun test --timeout 30000 test/cli/executables.test.ts`
  - 6 passed.
- Native smoke test from `script/build.ts`.
- Direct `node bin/lato.cjs --version` verification.
- Direct `node bin/lato.cjs --help` verification.
- Disposable pseudo-terminal TUI startup verification.

Safety checks passed:

- `node --check bin/run.cjs`.
- `node --check bin/native-target.cjs`.
- `node --check script/postinstall.mjs`.
- `git diff --check`.
- Prettier checks for changed Phase 4.4 files.

## Remaining Limitations

- Windows and macOS native builds were not run on this Linux host.
- Windows `.exe`, `.cmd`, and PATHEXT behavior remains unverified.
- macOS codesigning, quarantine, and Apple Silicon/Intel execution remain
  unverified.
- Linux ARM64 and musl binaries were not built locally.
- `postinstall.mjs` and generated optional dependency publication were not run
  against a published package.
- No public npm package name or native package namespace was introduced.
- No release repository, artifact URL, Docker identity, Homebrew tap, AUR
  package, installer URL, update feed, or signing identity was finalized.
- Upgrade and uninstall remain intentionally unavailable.
- Full workspace builds, typecheck, lint, E2E, and release workflows were not
  run.

## Preserved Compatibility

- Provider IDs `opencode` and `opencode-go` remain unchanged.
- No OpenCode application executable was added.
- No existing OpenCode binary was overwritten or removed.
- Existing Phase 4.1, 4.2, and 4.3 changes were preserved.
- No user OpenCode configuration, data, authentication, database, sessions, or
  storage were modified.

Phase 4.5 was not started.
