#!/usr/bin/env bash
# Lato CLI Installer for Linux and macOS
# Usage: curl -fsSL https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/lazyarjun2005-rgb/lato-tui/main/install.sh | bash

set -euo pipefail

REPO="lazyarjun2005-rgb/lato-tui"
INSTALL_DIR="${HOME}/.local/bin"
VERSION="${1:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

detect_platform() {
  local os arch
  os="$(uname -s | tr '[:upper:]' '[:lower:]')"
  arch="$(uname -m)"

  case "${os}" in
    linux)
      OS="linux"
      ;;
    darwin)
      OS="darwin"
      ;;
    *)
      log_error "Unsupported operating system: ${os}"
      exit 1
      ;;
  esac

  case "${arch}" in
    x86_64|amd64)
      ARCH="x64"
      ;;
    aarch64|arm64)
      ARCH="arm64"
      ;;
    armv7l|armhf)
      ARCH="arm"
      ;;
    *)
      log_error "Unsupported architecture: ${arch}"
      exit 1
      ;;
  esac

  # Detect musl libc on Linux
  if [ "${OS}" = "linux" ] && [ -f /etc/alpine-release ]; then
    LIBC="musl"
  elif [ "${OS}" = "linux" ] && ldd --version 2>&1 | grep -qi musl; then
    LIBC="musl"
  else
    LIBC="gnu"
  fi

  log_info "Detected platform: ${OS}/${ARCH}${LIBC:+/${LIBC}}"
}

get_latest_version() {
  if command -v gh >/dev/null 2>&1; then
    gh api "repos/${REPO}/releases/latest" --jq '.tag_name' 2>/dev/null | sed 's/^v//'
  else
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" 2>/dev/null | grep '"tag_name":' | head -1 | sed 's/.*"tag_name": "\([^"]*\)".*/\1/' | sed 's/^v//'
  fi
}

download_binary() {
  local version="$1"
  local asset_name="lato-${OS}-${ARCH}"
  if [ "${LIBC}" = "musl" ]; then
    asset_name="${asset_name}-musl"
  fi
  local extension="tar.gz"
  if [ "${OS}" = "win32" ]; then
    extension="zip"
  fi
  local url="https://github.com/${REPO}/releases/download/v${version}/${asset_name}.${extension}"

  log_info "Downloading ${asset_name} v${version}..."
  if ! curl -fLsS "${url}" -o "/tmp/lato-${version}.${extension}"; then
    log_error "Failed to download from ${url}"
    log_warn "This version/platform may not have a pre-built binary yet."
    log_warn "Try building from source or check available releases at:"
    log_warn "https://github.com/${REPO}/releases"
    exit 1
  fi
}

extract_binary() {
  local version="$1"
  local extension="tar.gz"
  if [ "${OS}" = "win32" ]; then
    extension="zip"
  fi

  log_info "Extracting binary..."
  mkdir -p "${INSTALL_DIR}"
  cd /tmp

  if [ "${extension}" = "tar.gz" ]; then
    tar -xzf "lato-${version}.${extension}" lato
  else
    unzip -o "lato-${version}.${extension}" "lato*"
  fi

  chmod +x lato
  mv lato "${INSTALL_DIR}/lato-cli"
}

verify_install() {
  if [ -x "${INSTALL_DIR}/lato-cli" ]; then
    local version_output
    version_output=$("${INSTALL_DIR}/lato-cli" --version 2>&1 || true)
    log_success "Installed: ${version_output}"
    return 0
  else
    log_error "Installation verification failed"
    return 1
  fi
}

update_path() {
  case ":${PATH}:" in
    *":${INSTALL_DIR}:"*)
      log_info "Install directory already in PATH"
      ;;
    *)
      log_warn "Install directory ${INSTALL_DIR} is not in your PATH."
      log_warn "Add the following to your shell configuration (.bashrc, .zshrc, etc.):"
      echo "  export PATH=\"${INSTALL_DIR}:\${PATH}\""
      ;;
  esac
}

main() {
  log_info "Lato CLI Installer"
  log_info "Repository: ${REPO}"

  detect_platform

  if [ "${VERSION}" = "latest" ]; then
    VERSION=$(get_latest_version)
    if [ -z "${VERSION}" ]; then
      log_error "Could not determine latest version"
      exit 1
    fi
    log_info "Latest version: ${VERSION}"
  fi

  download_binary "${VERSION}"
  extract_binary "${VERSION}"
  verify_install
  update_path

  log_success "Installation complete! Run 'lato-cli' to start."
  log_info "If 'lato-cli' is not found, restart your shell or run: export PATH=\"${INSTALL_DIR}:\${PATH}\""
}

main "$@"