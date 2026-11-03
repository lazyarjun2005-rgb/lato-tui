#!/usr/bin/env bash

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lato-installer-fixtures.XXXXXX")"
trap 'rm -rf "${TEMP_DIR}"' EXIT

FIXTURE="${TEMP_DIR}/fixture"
FAKE_BIN="${TEMP_DIR}/fake-bin"
HOME_DIR="${TEMP_DIR}/home"
INSTALL_DIR="${HOME_DIR}/.local/bin"
mkdir -p "${FIXTURE}/bin" "${FAKE_BIN}" "${HOME_DIR}"
TARGET_SUFFIX=""
if ! grep -qiE '(^|[[:space:]])avx2([[:space:]]|$)' /proc/cpuinfo 2>/dev/null; then TARGET_SUFFIX="-baseline"; fi
if [ -f /etc/alpine-release ] || ldd --version 2>&1 | grep -qi musl; then TARGET_SUFFIX="${TARGET_SUFFIX}-musl"; fi
FIXTURE_ARCHIVE="lato-linux-x64${TARGET_SUFFIX}.tar.gz"

make_archive() {
  local content="$1" output="$2"
  printf '#!/usr/bin/env bash\nprintf "%s\\n" "${content}"\n' "${content}" > "${FIXTURE}/bin/lato"
  chmod +x "${FIXTURE}/bin/lato"
  tar -czf "${FIXTURE}/${output}" -C "${FIXTURE}/bin" lato
}

make_unexpected_archive() {
  printf 'fixture-v2\n' > "${FIXTURE}/bin/lato"
  printf 'unexpected\n' > "${FIXTURE}/bin/extra"
  tar -czf "${FIXTURE}/unexpected.tar.gz" -C "${FIXTURE}/bin" lato extra
}

make_archive "fixture-v1" "${FIXTURE_ARCHIVE}"
make_unexpected_archive
printf 'not an archive\n' > "${FIXTURE}/corrupt.tar.gz"

write_manifest() {
  local archive="$1" manifest="$2"
  sha256sum "${FIXTURE}/${archive}" | awk -v name="${archive}" '{print $1 "  " name}' >> "${manifest}"
}

: > "${FIXTURE}/SHA256SUMS"
write_manifest "${FIXTURE_ARCHIVE}" "${FIXTURE}/SHA256SUMS"

cat > "${FAKE_BIN}/curl" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
output=""
url=""
while [ "$#" -gt 0 ]; do
  case "$1" in
    -o) output="$2"; shift 2 ;;
    http*) url="$1"; shift ;;
    *) shift ;;
  esac
done
name="${url##*/}"
scenario="${LATO_FIXTURE_SCENARIO:-valid}"
case "${scenario}:${name}" in
  missing-manifest:SHA256SUMS) exit 22 ;;
  missing-entry:SHA256SUMS) : > "${output}" ;;
  bad-checksum:SHA256SUMS) printf '%064d  %s\n' 0 "${name}" > "${output}" ;;
  corrupt:SHA256SUMS) sha256sum "${LATO_FIXTURE_ROOT}/corrupt.tar.gz" | awk -v name="${name}" '{print $1 "  " name}' > "${output}" ;;
  unexpected:SHA256SUMS) sha256sum "${LATO_FIXTURE_ROOT}/unexpected.tar.gz" | awk -v name="${name}" '{print $1 "  " name}' > "${output}" ;;
  *)
    case "${scenario}" in
      corrupt) source="${LATO_FIXTURE_ROOT}/corrupt.tar.gz" ;;
      unexpected) source="${LATO_FIXTURE_ROOT}/unexpected.tar.gz" ;;
      *) source="${LATO_FIXTURE_ROOT}/${name}" ;;
    esac
    [ -f "${source}" ] || exit 22
    cp "${source}" "${output}"
    ;;
esac
EOF
chmod +x "${FAKE_BIN}/curl"

cat > "${FAKE_BIN}/uname" <<'EOF'
#!/usr/bin/env bash
case "${LATO_FIXTURE_SCENARIO:-valid}" in
  darwin)
    case "$1" in
      -s) printf 'Darwin\n' ;;
      -m) printf 'arm64\n' ;;
    esac
    ;;
  *) exec /usr/bin/uname "$@" ;;
esac
EOF
chmod +x "${FAKE_BIN}/uname"

run_installer() {
  PATH="${FAKE_BIN}:${PATH}" HOME="${HOME_DIR}" XDG_BIN_HOME="${INSTALL_DIR}" \
    LATO_FIXTURE_ROOT="${FIXTURE}" LATO_FIXTURE_SCENARIO="${1}" \
    bash "${ROOT}/install.sh" 0.1.0-preview.1
}

expect_failure_preserves_binary() {
  local scenario="$1"
  printf '#!/usr/bin/env bash\nprintf "fixture-v2\\n"\n' > "${INSTALL_DIR}/lato-cli"
  chmod +x "${INSTALL_DIR}/lato-cli"
  if run_installer "${scenario}" >/dev/null 2>&1; then
    printf 'expected installer failure for %s\n' "${scenario}" >&2
    exit 1
  fi
  [ "$("${INSTALL_DIR}/lato-cli" --version)" = "fixture-v2" ] || {
    printf 'existing binary changed for %s\n' "${scenario}" >&2
    exit 1
  }
  if compgen -G "${INSTALL_DIR}/.lato-cli.*.tmp" >/dev/null; then
    printf 'temporary target remained for %s\n' "${scenario}" >&2
    exit 1
  fi
}

if bash "${ROOT}/install.sh" >/dev/null 2>&1; then exit 1; fi
if bash "${ROOT}/install.sh" bad-version >/dev/null 2>&1; then exit 1; fi
run_installer valid >/dev/null
[ "$("${INSTALL_DIR}/lato-cli" --version)" = "fixture-v1" ] || exit 1

make_archive "fixture-v2" "${FIXTURE_ARCHIVE}"
: > "${FIXTURE}/SHA256SUMS"
write_manifest "${FIXTURE_ARCHIVE}" "${FIXTURE}/SHA256SUMS"
run_installer valid >/dev/null
[ "$("${INSTALL_DIR}/lato-cli" --version)" = "fixture-v2" ] || exit 1

for scenario in missing-manifest missing-entry bad-checksum corrupt unexpected; do
  expect_failure_preserves_binary "${scenario}"
done

printf '#!/usr/bin/env bash\nprintf "fixture-darwin\\n"\n' > "${FIXTURE}/bin/lato"
zip -q -j "${FIXTURE}/lato-darwin-arm64.zip" "${FIXTURE}/bin/lato"
write_manifest "lato-darwin-arm64.zip" "${FIXTURE}/SHA256SUMS"
run_installer darwin >/dev/null
[ "$("${INSTALL_DIR}/lato-cli" --version)" = "fixture-darwin" ] || exit 1

echo "installer fixture validation passed: version guards, upgrade, checksum/archive failures, preservation, cleanup, and darwin zip target selection"
