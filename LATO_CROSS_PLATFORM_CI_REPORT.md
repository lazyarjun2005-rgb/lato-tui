# Lato Cross-Platform CI Build Report

## Summary

The CI workflow now builds **one exact native target per job** via a new
`--target <name>` selector in `packages/opencode/script/build.ts`. Each job
builds the target it verifies and uploads. No job uploads a host binary under
another platform's name, and no target is silently skipped.

Cross-compilation is real and was verified locally: Bun 1.4.4 on Linux x64
produced a valid `ELF 64-bit LSB executable, ARM aarch64` binary from a tiny
entrypoint. The full build was intentionally not run locally (8 GB RAM limit).

## Build-script findings (`script/build.ts`)

| Flag                    | Behavior                                                                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--single`              | Builds **only** the host platform/arch, glibc, non-baseline. Skips musl entirely and build `avx2:false` unless `--baseline`. Not usable for a multi-target matrix.                                           |
| `--baseline`            | Only affects `--single`: also builds the host x64 baseline variant.                                                                                                                                          |
| `--skip-install`        | Skips the `--os=* --cpu=* --libc=*` install of cross-platform native deps (`@opentui/core`, `@parcel/watcher`, `@ff-labs/fff-bun`). **Required to be absent** for cross-target builds.                       |
| `--target <name>` (new) | Selects exactly one of the 12 repository-defined targets by Lato native name. Backward compatible; `--single` and default (all-targets) behavior unchanged. Unknown names fail fast with the supported list. |
| `--skip-embed-web-ui`   | Skips embedding the web UI bundle. CLI/TUI unaffected; the `web` command would lack embedded assets in CI artifacts.                                                                                         |
| default (no flag)       | Builds **all 12** targets by cross-compiling (the original release behavior).                                                                                                                                |

Native deps for other platforms are installed by `script/build.ts` only when
`--skip-install` is absent. The workflow therefore omits `--skip-install`.

## Exact build command per target

Run from `packages/opencode`:

```
bun run script/build.ts --target <TARGET_NAME> --skip-embed-web-ui
```

## Target, runner, cross-compilation, artifact

| Target                         | Runner (arch)              | Build method                    | Artifact path                                 | Archive                               |
| ------------------------------ | -------------------------- | ------------------------------- | --------------------------------------------- | ------------------------------------- |
| `lato-linux-x64`               | `ubuntu-latest` (x64)      | native arch/libc                | `dist/lato-linux-x64/bin/lato`                | `lato-linux-x64.tar.gz`               |
| `lato-linux-x64-baseline`      | `ubuntu-latest` (x64)      | native arch, baseline runtime   | `dist/lato-linux-x64-baseline/bin/lato`       | `lato-linux-x64-baseline.tar.gz`      |
| `lato-linux-x64-musl`          | `ubuntu-latest` (x64)      | native arch, libc cross         | `dist/lato-linux-x64-musl/bin/lato`           | `lato-linux-x64-musl.tar.gz`          |
| `lato-linux-x64-baseline-musl` | `ubuntu-latest` (x64)      | native arch, libc+baseline      | `dist/lato-linux-x64-baseline-musl/bin/lato`  | `lato-linux-x64-baseline-musl.tar.gz` |
| `lato-linux-arm64`             | `ubuntu-24.04-arm` (arm64) | native arch/libc                | `dist/lato-linux-arm64/bin/lato`              | `lato-linux-arm64.tar.gz`             |
| `lato-linux-arm64-musl`        | `ubuntu-24.04-arm` (arm64) | native arch, libc cross         | `dist/lato-linux-arm64-musl/bin/lato`         | `lato-linux-arm64-musl.tar.gz`        |
| `lato-darwin-arm64`            | `macos-14` (arm64)         | native arch, ad-hoc signed      | `dist/lato-darwin-arm64/bin/lato`             | `lato-darwin-arm64.zip`               |
| `lato-darwin-x64`              | `macos-14` (arm64)         | **cross-arch** on Apple Silicon | `dist/lato-darwin-x64/bin/lato`               | `lato-darwin-x64.zip`                 |
| `lato-darwin-x64-baseline`     | `macos-14` (arm64)         | **cross-arch**, baseline        | `dist/lato-darwin-x64-baseline/bin/lato`      | `lato-darwin-x64-baseline.zip`        |
| `lato-windows-x64`             | `windows-latest` (x64)     | native arch                     | `dist/lato-windows-x64/bin/lato.exe`          | `lato-windows-x64.zip`                |
| `lato-windows-x64-baseline`    | `windows-latest` (x64)     | native arch, baseline           | `dist/lato-windows-x64-baseline/bin/lato.exe` | `lato-windows-x64-baseline.zip`       |
| `lato-windows-arm64`           | `windows-latest` (x64)     | **cross-arch**                  | `dist/lato-windows-arm64/bin/lato.exe`        | `lato-windows-arm64.zip`              |

Uploaded artifacts use the archive name above (one file per matrix job) under
`packages/opencode/out/`.

## Runtime verification per target

| Target                         | Verification                                                              |
| ------------------------------ | ------------------------------------------------------------------------- |
| Linux x64 / x64-baseline       | `lato --version` natively on runner                                       |
| Linux x64 musl / baseline-musl | `lato --version` inside `alpine:3.20` (`--platform linux/amd64`)          |
| Linux arm64                    | `lato --version` natively on arm64 runner                                 |
| Linux arm64-musl               | `lato --version` inside `alpine:3.20` (`--platform linux/arm64`)          |
| macOS arm64                    | `lato --version` natively on Apple Silicon                                |
| macOS x64 / x64-baseline       | Rosetta 2 (`arch -x86_64`) when available; otherwise build-only + warning |
| Windows x64 / x64-baseline     | `lato.exe --version` natively                                             |
| Windows arm64                  | **No runtime verification** (no hosted arm64 Windows runner)              |

An early step asserts `runner.arch` matches the target arch for every
`native_arch: true` row, so the architecture is verified at runtime rather than
assumed from the OS label.

## Unsupported / invalid targets

- **`lato-linux-arm64-baseline`** — listed as a desired target but **not defined**
  by the repository and **not a Bun target**. `baseline` (AVX2-disabled) is an
  x64-only concept; there is no arm64 baseline runtime. Not built; not invented.
- **32-bit `arm`** — not defined by the repository; installer rejects it.
- No other target is skipped.

## Remaining blockers

1. **Windows arm64 runtime verification** — GitHub provides no hosted arm64
   Windows runner. The target is built by cross-compilation and packaged, but is
   explicitly not runtime-verified (workflow emits a warning).
2. **macOS x64 native verification** — GitHub's hosted Intel macOS runner
   (`macos-13`) is past end-of-life in this timeframe; the workflow cross-builds
   on Apple Silicon and only executes it when Rosetta 2 is present.
3. **`ubuntu-24.04-arm` availability** — GitHub-hosted arm64 Linux runners are
   available for public repositories; if unavailable, Linux arm64 would fall
   back to cross-compile + QEMU (not currently wired in).
4. **Signing / notarization / publication** — deferred; CI artifacts are
   unsigned except macOS ad-hoc signing performed by `build.ts` on Darwin.
5. **Web UI** — CI uses `--skip-embed-web-ui`, so artifacts do not embed web UI
   assets. CLI and TUI are unaffected.

## Installer alignment

`install.sh` and `install.ps1` now request names/extensions that exactly match
the generated artifacts:

- extensions: Linux `tar.gz`; macOS and Windows `zip`.
- platform token: `windows` (not `win32`).
- x64 baseline selected when AVX2 is unavailable; base order is
  `<platform>-<arch>[-baseline][-musl]`.

Validated: all 12 installer-requestable asset names exist among the generated
artifacts.

## Validation performed

- `bun run script/build.ts --target lato-nope ...` fails fast and prints all 12
  supported targets (confirms the selector and name mapping).
- Tiny cross-compile to `bun-linux-arm64` produced an aarch64 ELF (confirms
  cross-compilation capability).
- Workflow parsed with `yaml@2.9.0`; 12 targets; every supported target present
  exactly once; `native_arch`/`smoke` fields consistent with the runner map.
- 33 `${{ }}` expressions scanned; no `+` concatenation, `===`, or `!==`.
- `bash -n install.sh` passes. `install.ps1` not parse-checked (no `pwsh` here).
- Installer/artifact name cross-check: 12/12 match.
- `prettier --check` and `git diff --check` pass.
- Full workspace typecheck and full native builds were **not** run locally.

## Windows native validation: persistence rename fix

The Windows native validation job runs
`packages/tui/test/prompt/persistence.test.ts`, including the concurrent
reader/writer regression test. The first fix added a Windows-only bounded retry
around the atomic rename, but CI still failed with:

```
EPERM: operation not permitted, rename
'...\kv.json.<unique>.tmp' -> '...\kv.json'
at renameAtomic (persistence.ts:39)
```

after the full ~804 ms of backoff.

### Actual root cause

Windows replace-renames are mutually exclusive per destination: `MoveFileEx`
lets one writer win and fails the peers with `EPERM`/`EACCES`/`EBUSY`. The
regression test issues 20 simultaneous `writeJsonAtomic` calls for one
`kv.json`, so each retry round can promote only one writer. The bounded budget
was consumed by peer writers rather than by one transient lock, and some
writers exhausted every retry and rethrew. The plain 20-writer test passing
while the reader/writer test failed confirmed the residual contention was
writer-vs-writer; the reader only added scheduling pressure.

### Implementation

- Same-process writes to the same destination are serialized on Windows with a
  per-path promise queue (`writeQueues`, keyed by the resolved path and
  lowercased for case-insensitive Windows paths).
- Every queued write still creates its own `pid + UUID` temporary file and uses
  the same atomic rename. The destination is never deleted before replacement,
  and cleanup removes only the writer's own temporary file on failure.
- The bounded Windows retry (`EPERM`/`EACCES`/`EBUSY`, 10–400 ms) remains as
  protection against genuine transient external locks (antivirus/indexer scans,
  readers without delete sharing). It is still bounded and never silently
  swallows the final `EPERM`.
- POSIX behavior is unchanged: Linux and macOS still use the original parallel
  `writeJsonNow` path with no queue and no retry.

### Validation

- `bun test --timeout 30000 test/prompt/persistence.test.ts` (packages/tui):
  8 pass, 0 fail.
- `bun test --timeout 30000 test/cli/identity.test.ts test/cli/native-state.test.ts`
  (packages/opencode): 5 pass, 0 fail.
- Local Windows-branch sanity check (forcing `process.platform = "win32"`): 20
  concurrent writes serialized, final value valid, zero `.tmp` leftovers.
- `prettier --check` and `git diff --check` pass.

### Remaining limitations

- The Windows queue path cannot be executed natively on this Linux host; final
  proof requires the Windows CI run.
- Serialization is in-process only. Cross-process writers (for example a second
  Lato instance) still rely on `Flock` in `kv.tsx` plus the bounded retry.
- If an external handle denies deletion for longer than the bounded retry
  window, the write still fails and the previous preference file is preserved.

## Files changed

- `packages/opencode/script/build.ts` — added `--target <name>` selector.
- `.github/workflows/cross-platform-build.yml` — per-target matrix, runner-arch
  assertion, native/docker/Rosetta/none verification, archive packaging.
- `install.sh` — correct platform token, extensions, baseline selection.
- `install.ps1` — `windows` token, baseline selection.
- `packages/tui/src/util/persistence.ts` — Windows per-destination write queue
  plus the bounded transient-rename retry.
- `packages/tui/test/prompt/persistence.test.ts` — concurrent reader/writer
  regression coverage.
- `LATO_CROSS_PLATFORM_CI_REPORT.md` — this report.
