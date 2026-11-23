#!/usr/bin/env bash
set -e

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Yarn runs scripts in a child shell, where the nvm shell function may be absent.
if [ -z "${NVM_DIR:-}" ]; then
  if [ -n "${XDG_CONFIG_HOME:-}" ]; then
    NVM_DIR="$XDG_CONFIG_HOME/nvm"
  else
    NVM_DIR="$HOME/.nvm"
  fi
fi
export NVM_DIR

if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  printf 'Could not find nvm.sh in %s. Set NVM_DIR to your nvm installation directory.\n' "$NVM_DIR" >&2
  exit 1
fi

source "$NVM_DIR/nvm.sh" --no-use
nvm install --lts
# Yarn can put a temporary Node shim ahead of nvm's binaries on PATH.
node_bin="$NVM_BIN"
export PATH="$node_bin:$PATH"
node_version="$(node -p 'process.versions.node')"

if [ ! -x "$node_bin/corepack" ]; then
  npm install --global corepack
fi
"$node_bin/corepack" enable --install-directory "$node_bin" yarn

"$node_bin/yarn" up '*' '@*/*'
printf '%s\n' "$node_version" > .nvmrc
"$node_bin/yarn" check
