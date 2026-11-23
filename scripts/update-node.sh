#!/usr/bin/env bash
set -e

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Yarn starts a child shell, so load the nvm function explicitly.
export NVM_DIR="${NVM_DIR:-${XDG_CONFIG_HOME:+$XDG_CONFIG_HOME/nvm}}"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ ! -s "$NVM_DIR/nvm.sh" ]; then
  printf 'Could not find nvm.sh in %s. Set NVM_DIR to your nvm installation directory.\n' "$NVM_DIR" >&2
  exit 1
fi
source "$NVM_DIR/nvm.sh" --no-use

nvm install --lts
nvm use --lts
node_version="$("$NVM_BIN/node" -p 'process.versions.node')"
printf '%s\n' "$node_version" > .nvmrc
printf 'Pinned Node %s in .nvmrc. Run nvm use in your current shell to switch to it.\n' "$node_version"
