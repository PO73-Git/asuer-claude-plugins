#!/bin/bash
# Asuer PDF skill installer (Terminal / Linux). No GitHub, no account needed.
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="$HOME/.claude/skills/asuer-pdf"
mkdir -p "$HOME/.claude/skills"
rm -rf "$DEST"
cp -R "$HERE/skill" "$DEST"
echo "Asuer PDF skill installed to $DEST"
command -v node >/dev/null 2>&1 && echo "node $(node --version)" || echo "WARNING: install Node.js 22+ (https://nodejs.org)"
echo "Restart Claude Code, then ask it to make a document or PDF."
