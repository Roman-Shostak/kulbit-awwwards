#!/usr/bin/env bash
# SessionStart hook.
# 1. Makes sure the font pipeline (`pnpm fonts` → scripts/build-fonts.py) can run: installs
#    fonttools + brotli for the user when they are missing (quiet, never blocks).
# 2. Tells Claude which environment it is in (local machine vs the cloud sandbox, where
#    www.figma.com is blocked and Playwright is installed globally) — see CLAUDE.md § Environment.
#
# Output: JSON with hookSpecificOutput.additionalContext

set -u

notes=""

if command -v python3 >/dev/null 2>&1; then
  if ! python3 -c "import fontTools, brotli" >/dev/null 2>&1; then
    if python3 -m pip install --user --quiet fonttools brotli >/dev/null 2>&1 \
      || python3 -m pip install --user --quiet --break-system-packages fonttools brotli >/dev/null 2>&1; then
      notes="$notes FONTS: fonttools + brotli were installed for the user; pnpm fonts is ready."
    else
      notes="$notes FONTS: fonttools/brotli could not be installed automatically; before pnpm fonts run: python3 -m pip install --user fonttools brotli."
    fi
  fi
else
  notes="$notes FONTS: python3 is not available, pnpm fonts (TTF → subset WOFF2) will not work here."
fi

if [ -d /opt/pw-browsers ] || [ -d /opt/node22/lib/node_modules/playwright ]; then
  notes="$notes ENVIRONMENT: cloud sandbox. www.figma.com is blocked (download_assets and get_screenshot links return 403) and the astro-docs MCP needs auth: use the fallbacks in CLAUDE.md § Environment (SVG via use_figma exportAsync, screenshots with enableBase64Response, rasters as TODO for the client, docs at https://docs.astro.build). Playwright: /opt/node22/lib/node_modules/playwright, browsers in /opt/pw-browsers (pnpm shot works)."
else
  notes="$notes ENVIRONMENT: local machine; Figma MCP downloads and astro-docs MCP are expected to work."
fi

esc=$(printf '%s' "${notes# }" | sed 's/\\/\\\\/g; s/"/\\"/g')
printf '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$esc"
exit 0
