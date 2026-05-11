#!/bin/bash
# -----------------------------------------------------------------
#  add-license-header.sh
#  Adds the AGPLv3 copyright notice to .ts and .tsx files in src/
#  Skips execution if NODE_ENV is "development"
# -----------------------------------------------------------------

set -euo pipefail

if [ "${NODE_ENV:-development}" = "development" ]; then
  echo "DEV environment – skipping license header injection"
  exit 0
fi

NOTICE=$(cat <<'EOT'
/*
 * Copyright (C) 2026 BookFlow
 * This file is part of BookFlow, licensed under AGPLv3.
 * See the LICENSE file at the root of this repository for details.
 */

EOT
)

# Find all TypeScript source files
mapfile -t FILES < <(find pages lib components src -type f \( -name "*.ts" -o -name "*.tsx" \))

for FILE in "${FILES[@]}"; do
  # Only add if the notice is not already present
  if ! grep -q "Copyright (C) 2026 BookFlow" "$FILE"; then
    # Prepend the notice (preserving the original content)
    echo "$NOTICE" | cat - "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
    echo "✓ Added header to $FILE"
  fi
done

echo "Done – added AGPLv3 headers to all TypeScript files"