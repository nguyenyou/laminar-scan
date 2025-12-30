#!/bin/bash
# Build script to combine all devtools modules into a single file.
# Usage: ./devtools/build.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/../devtools.js"

echo "Building devtools.js..."

# Start with IIFE wrapper
cat > "$OUTPUT_FILE" << 'EOF'
(function () {
  "use strict";

EOF

# Concatenate all module files in order (sorted numerically)
for file in $(ls "$SCRIPT_DIR"/*.js 2>/dev/null | grep -E '/[0-9]+-' | sort -t'-' -k1 -V); do
  if [ -f "$file" ]; then
    echo "  Adding $(basename "$file")..."
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
  fi
done

# Close IIFE wrapper
echo "})();" >> "$OUTPUT_FILE"

echo "Done! Created: $OUTPUT_FILE"
echo "Lines: $(wc -l < "$OUTPUT_FILE")"

