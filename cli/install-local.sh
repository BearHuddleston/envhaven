#!/bin/bash
#
# Haven CLI - Local Install Script
# Builds from source and installs to ~/.local/bin
#
# Usage: ./install-local.sh
#
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

main() {
  echo "Installing Haven CLI from source..."
  echo

  if ! command -v bun &> /dev/null; then
    echo "Error: bun is required to build Haven CLI"
    echo "Install it: curl -fsSL https://bun.sh/install | bash"
    exit 1
  fi

  cd "$SCRIPT_DIR"

  echo "Installing dependencies..."
  bun install --frozen-lockfile

  echo "Building..."
  bun run build

  mkdir -p "$INSTALL_DIR"
  cp dist/haven "$INSTALL_DIR/haven"
  chmod +x "$INSTALL_DIR/haven"

  echo
  echo "✓ Haven CLI installed to ${INSTALL_DIR}/haven"
  echo

  if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
    echo "Add this to your shell profile (~/.bashrc, ~/.zshrc, etc.):"
    echo
    echo "  export PATH=\"\$PATH:$INSTALL_DIR\""
    echo
  fi

  echo "Get started:"
  echo "  haven connect ."
  echo
}

main "$@"
