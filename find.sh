#!/usr/bin/env bash

# Abbruch, wenn kein Suchstring übergeben wurde
if [ $# -lt 1 ]; then
  echo "Usage: $0 <searchstring>"
  exit 1
fi

SEARCH="$1"

# ---- KONFIGURATION ----

# Dateitypen, die durchsucht werden sollen
FILE_TYPES=(
  "*.js"
  "*.css"
  "*.html"
  "*.md"
)

# Verzeichnisse, die ignoriert werden sollen (relativ, nur Name!)
IGNORE_DIRS=(
  ".git"
  "node_modules"
  "build"
  "dist"
  "logs"
)

# -----------------------

# find-Argumente für ignorierte Verzeichnisse bauen
FIND_PRUNE=()
for dir in "${IGNORE_DIRS[@]}"; do
  FIND_PRUNE+=( -name "$dir" -prune -o )
done

# find-Argumente für Dateitypen bauen
FIND_TYPES=()
for type in "${FILE_TYPES[@]}"; do
  FIND_TYPES+=( -name "$type" -o )
done
# letztes -o entfernen
unset 'FIND_TYPES[${#FIND_TYPES[@]}-1]'

# find + grep
find . \
  "${FIND_PRUNE[@]}" \
  -type f \( "${FIND_TYPES[@]}" \) -print \
| xargs grep -nH --color=auto "$SEARCH"
