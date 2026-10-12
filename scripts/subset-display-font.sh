#!/usr/bin/env bash
# Rebuilds public/fonts/bricolage-grotesque-display.woff2: the display face cut
# down to the characters the headings actually use (131 KB -> ~78 KB).
# Needs fonttools: pip install fonttools brotli
# If you add text with new characters to a heading, add them to UNICODES here
# and to the unicode-range in src/styles/global.css, then re-run.
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=node_modules/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2
UNICODES="U+0020-007E,U+00A0,U+00B7,U+00E4,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2026,U+2190"
pyftsubset "$SRC" \
  --unicodes="$UNICODES" \
  --layout-features='kern,liga,calt,ccmp,locl,mark,mkmk' \
  --flavor=woff2 \
  --output-file=public/fonts/bricolage-grotesque-display.woff2
ls -l public/fonts/bricolage-grotesque-display.woff2
