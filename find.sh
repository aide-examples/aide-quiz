#!/usr/bin/env bash

# Search for a string in all relevant project files
# Excludes: vendor/, node_modules/, .git/, build/, dist/, logs/

set -euo pipefail

# ---- USAGE ----
usage() {
  cat <<EOF
Usage: $0 [OPTIONS] <searchstring>

Search for a string in all relevant project artifacts.

Options:
  -i          Case-insensitive search (default: case-sensitive)
  -c NUM      Show NUM lines of context around each match (default: 0)
  -h, --help  Show this help message

Examples:
  $0 "fetchWithErrorHandling"       # Case-sensitive search
  $0 -i "todo"                      # Case-insensitive search
  $0 -c 3 "createSession"           # Show 3 lines context
  $0 -i -c 2 "qrcode"               # Combined options
EOF
  exit "${1:-0}"
}

# ---- DEFAULTS ----
CASE_INSENSITIVE=""
CONTEXT_LINES=""

# ---- PARSE OPTIONS ----
while [[ $# -gt 0 ]]; do
  case "$1" in
    -i)
      CASE_INSENSITIVE="-i"
      shift
      ;;
    -c)
      if [[ -z "${2:-}" || ! "$2" =~ ^[0-9]+$ ]]; then
        echo "Error: -c requires a numeric argument"
        exit 1
      fi
      CONTEXT_LINES="-C $2"
      shift 2
      ;;
    -h|--help)
      usage 0
      ;;
    -*)
      echo "Unknown option: $1"
      usage 1
      ;;
    *)
      break
      ;;
  esac
done

# Check for search string
if [[ $# -lt 1 ]]; then
  echo "Error: No search string provided"
  usage 1
fi

SEARCH="$1"

# ---- CONFIGURATION ----

# File types to search
FILE_TYPES=(
  "*.js"
  "*.css"
  "*.html"
  "*.md"
  "*.json"
)

# Directories to ignore (relative, name only!)
IGNORE_DIRS=(
  ".git"
  "node_modules"
  "vendor"
  "build"
  "dist"
  "logs"
)

# -----------------------

# Build find arguments for ignored directories
FIND_PRUNE=()
for dir in "${IGNORE_DIRS[@]}"; do
  FIND_PRUNE+=( -name "$dir" -prune -o )
done

# Build find arguments for file types
FIND_TYPES=()
for type in "${FILE_TYPES[@]}"; do
  FIND_TYPES+=( -name "$type" -o )
done
# Remove last -o
unset 'FIND_TYPES[${#FIND_TYPES[@]}-1]'

# Build grep options
GREP_OPTS=(-nH --color=auto)
[[ -n "$CASE_INSENSITIVE" ]] && GREP_OPTS+=("$CASE_INSENSITIVE")
[[ -n "$CONTEXT_LINES" ]] && GREP_OPTS+=($CONTEXT_LINES)

# Execute find + grep
find . \
  "${FIND_PRUNE[@]}" \
  -type f \( "${FIND_TYPES[@]}" \) -print0 \
| xargs -0 grep "${GREP_OPTS[@]}" "$SEARCH" 2>/dev/null || true
