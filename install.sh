#!/usr/bin/env bash
# Lato CLI installer for Linux and macOS developer-preview releases.
# Usage: curl -fsSL https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.sh | bash -s -- 0.1.0-preview.1

set -euo pipefail

REPO="lazyarjun2005-rgb/lato-tui"
VERSION=""
INSTALL_DIR="${XDG_BIN_HOME:-${HOME}/.local/bin}"
TEMP_DIR=""
TEMP_TARGET=""

cleanup() {
  if [ -n "${TEMP_TARGET}" ]; then rm -f "${TEMP_TARGET}"; fi
  if [ -n "${TEMP_DIR}" ]; then rm -rf "${TEMP_DIR}"; fi
}
trap cleanup EXIT

log() { printf '[lato] %s\n' "$*"; }
fail() { printf '[lato] error: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Usage: install.sh VERSION [--install-dir DIRECTORY]

VERSION must be an explicit Lato GitHub Release version, for example:
  install.sh 0.1.0-preview.1

The installer does not support an implicit latest channel yet.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --install-dir)
      [ "$#" -ge 2 ] || { usage >&2; exit 2; }
      INSTALL_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -* )
      usage >&2
      exit 2
      ;;
    *)
      [ -z "${VERSION}" ] || { usage >&2; exit 2; }
      VERSION="$1"
      shift
      ;;
  esac
done

[ -n "${VERSION}" ] || { usage >&2; exit 2; }
[[ "${VERSION}" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] || fail "invalid version: ${VERSION}"

detect_target() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"
  case "${os}" in
    Linux) OS=linux ;;
    Darwin) OS=darwin ;;
    *) fail "unsupported operating system: ${os}" ;;
  esac
  case "${arch}" in
    x86_64|amd64) ARCH=x64 ;;
    aarch64|arm64) ARCH=arm64 ;;
    *) fail "unsupported architecture: ${arch}; Lato supports x64 and arm64" ;;
  esac

  SUFFIX=""
  if [ "${ARCH}" = x64 ] && ! supports_avx2; then SUFFIX="-baseline"; fi
  if [ "${OS}" = linux ] && is_musl; then SUFFIX="${SUFFIX}-musl"; fi
  TARGET="lato-${OS}-${ARCH}${SUFFIX}"
  EXT=zip
  if [ "${OS}" = linux ]; then EXT=tar.gz; fi
}

supports_avx2() {
  [ "${ARCH}" = x64 ] || return 0
  if [ "${OS}" = linux ]; then
    grep -qiE '(^|[[:space:]])avx2([[:space:]]|$)' /proc/cpuinfo 2>/dev/null
    return
  fi
  [ "$(sysctl -n hw.optional.avx2_0 2>/dev/null || printf 0)" = 1 ]
}

is_musl() {
  [ -f /etc/alpine-release ] && return 0
  ldd --version 2>&1 | grep -qi musl
}

checksum_for() {
  local archive="$1" manifest="$2" name
  name="$(basename "${archive}")"
  awk -v name="${name}" '$2 == name { print $1; count++ } END { if (count != 1) exit 1 }' "${manifest}"
}

verify_checksum() {
  local archive="$1" manifest="$2" expected actual
  expected="$(checksum_for "${archive}" "${manifest}")" || fail "manifest has no unique entry for $(basename "${archive}")"
  if command -v sha256sum >/dev/null 2>&1; then
    actual="$(sha256sum "${archive}" | awk '{print $1}')"
  elif command -v shasum >/dev/null 2>&1; then
    actual="$(shasum -a 256 "${archive}" | awk '{print $1}')"
  else
    fail "sha256sum or shasum is required"
  fi
  [ "${actual}" = "${expected}" ] || fail "SHA-256 verification failed for $(basename "${archive}")"
}

extract_and_validate() {
  local archive="$1" staging="$2" listing
  mkdir "${staging}"
  if [ "${EXT}" = tar.gz ]; then
    listing="$(tar -tzf "${archive}")"
    [ "${listing}" = lato ] || fail "archive must contain only root-level lato"
    tar -xzf "${archive}" -C "${staging}"
  else
    listing="$(unzip -Z1 "${archive}")"
    [ "${listing}" = lato ] || fail "archive must contain only root-level lato"
    unzip -q "${archive}" -d "${staging}"
  fi
  [ -f "${staging}/lato" ] || fail "archive does not contain lato"
}

detect_target
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/lato-cli.XXXXXX")"
ARCHIVE="${TEMP_DIR}/${TARGET}.${EXT}"
MANIFEST="${TEMP_DIR}/SHA256SUMS"
STAGING="${TEMP_DIR}/staging"
BASE_URL="https://github.com/${REPO}/releases/download/v${VERSION}"

log "target: ${TARGET}"
log "downloading explicit release ${VERSION}"
curl --fail --location --silent --show-error "${BASE_URL}/${TARGET}.${EXT}" -o "${ARCHIVE}"
curl --fail --location --silent --show-error "${BASE_URL}/SHA256SUMS" -o "${MANIFEST}"
verify_checksum "${ARCHIVE}" "${MANIFEST}"
extract_and_validate "${ARCHIVE}" "${STAGING}"

mkdir -p "${INSTALL_DIR}"
chmod 755 "${STAGING}/lato"
TEMP_TARGET="${INSTALL_DIR}/.lato-cli.$$.tmp"
rm -f "${TEMP_TARGET}"
cp "${STAGING}/lato" "${TEMP_TARGET}"
chmod 755 "${TEMP_TARGET}"
mv -f "${TEMP_TARGET}" "${INSTALL_DIR}/lato-cli"
TEMP_TARGET=""

"${INSTALL_DIR}/lato-cli" --version
log "installed ${INSTALL_DIR}/lato-cli"
case ":${PATH}:" in
  *":${INSTALL_DIR}:"*) log "${INSTALL_DIR} is already on PATH" ;;
  *) log "add ${INSTALL_DIR} to PATH, then open a new terminal" ;;
esac
