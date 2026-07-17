#!/bin/bash
# Asuer PDF skill — installer. Double-click to install. No GitHub, no account needed.
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.claude/skills/asuer-pdf"

echo "======================================"
echo "  Installing the Asuer PDF skill"
echo "======================================"
mkdir -p "$HOME/.claude/skills"
rm -rf "$DEST"
cp -R "$HERE/skill" "$DEST"
echo "Installed to: $DEST"
echo ""

# Environment checks (needed to render PDFs)
if command -v node >/dev/null 2>&1; then
  echo "OK  Node.js $(node --version)"
else
  echo "!!  Node.js not found. Install Node 22+ from https://nodejs.org"
fi
if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Chromium.app" ]; then
  echo "OK  Chrome/Chromium found"
else
  echo "!!  Google Chrome not found. Install it so PDFs can render."
fi

echo ""
echo "Done. Quit and reopen Claude Code, then just ask it to make a document or a PDF."
echo "You can close this window."
