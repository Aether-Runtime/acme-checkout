#!/usr/bin/env bash
# Applies (or reverts) one of the known demo regressions. Used for demos and
# agent evaluation runs; main stays green, bugs are injected on demand.
set -euo pipefail

usage() {
  echo "usage: scripts/inject-bug.sh [--revert] <name>" >&2
  echo "names: retry-null-cart, double-charge-webhook, flaky-auth-test" >&2
  exit 1
}

revert=0
if [[ "${1:-}" == "--revert" ]]; then
  revert=1
  shift
fi

name="${1:-}"
[[ -n "$name" ]] || usage

patch="demo/bugs/${name}.patch"
if [[ ! -f "$patch" ]]; then
  echo "unknown bug: ${name}" >&2
  usage
fi

cd "$(dirname "$0")/.."
if [[ "$revert" == 1 ]]; then
  git apply --reverse "$patch"
  echo "reverted ${name}"
else
  git apply "$patch"
  echo "injected ${name} (ticket: demo/tickets/${name}.md)"
fi
