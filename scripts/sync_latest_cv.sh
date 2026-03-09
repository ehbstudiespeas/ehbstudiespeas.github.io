#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="${1:-$HOME/Library/CloudStorage/Dropbox/Curriculum Vitae}"
DEST_FILE="${2:-assets/Elias_H_Bloom_CV.pdf}"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "Source directory not found: $SOURCE_DIR" >&2
  exit 1
fi

latest_pdf="$(ls -t "$SOURCE_DIR"/*.pdf 2>/dev/null | head -n 1 || true)"

if [[ -z "$latest_pdf" ]]; then
  echo "No PDF files found in: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$(dirname "$DEST_FILE")"
cp "$latest_pdf" "$DEST_FILE"

echo "Synced latest CV:"
echo "  Source: $latest_pdf"
echo "  Dest:   $DEST_FILE"
