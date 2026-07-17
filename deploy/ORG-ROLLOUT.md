# Org rollout — Asuer PDF skill

Goal: everyone on the team has the `asuer-pdf` skill, so Claude produces on-brand PDFs
whenever they ask for a document or PDF. Below, in order of how hands-off they are.

A Claude Code "skill" is a folder in `~/.claude/skills/`, or it ships inside a plugin.
Claude auto-discovers it and auto-triggers it from its description. Rollout is just:
get it onto each machine. Pick the method that fits your setup.

## Method A — Server-managed settings (recommended; Teams/Enterprise, zero touch)

Fully automatic, cloud-pushed by the admin, no MDM, no installer, no per-user action.
Requires a Claude for Teams / Enterprise plan (admin console).

1. **Publish the marketplace as a public repo** (one time):
   ```bash
   cd ~/asuer-claude-plugins
   gh repo create PO73-Git/asuer-claude-plugins --public --source=. --remote=origin --push
   ```
   Public means every machine fetches it with no GitHub account and no auth.
2. **In the Claude admin console, open Server-managed settings** and save:
   ```json
   {
     "extraKnownMarketplaces": {
       "asuer-plugins": { "source": { "source": "github", "repo": "PO73-Git/asuer-claude-plugins" } }
     },
     "enabledPlugins": {
       "asuer-pdf@asuer-plugins": true,
       "ict-ticket@asuer-plugins": true
     }
   }
   ```
3. Done. Settings reach every teammate's Claude Code at their next login and refresh hourly.
   Nothing for them to install or enable.

Docs: https://code.claude.com/docs/en/server-managed-settings

## Method B — Shared-drive installer (no admin infrastructure)

If you are not using the admin console, share [`dist/asuer-pdf-skill.zip`](../dist/asuer-pdf-skill.zip)
on your drive (Google Drive / SharePoint). Each teammate unzips and double-clicks
`install.command` (first time on macOS: right-click, Open, Open). Reopen Claude Code. Done.
Terminal/Linux: `bash install.sh`.

## Method C — MDM (Jamf / Intune / Kandji; private, zero touch)

If you manage the laptops and want it private:
- Deploy `managed-settings.json` (in this folder) to the managed path:
  macOS `/Library/Application Support/ClaudeCode/managed-settings.json`,
  Linux `/etc/claude-code/managed-settings.json`,
  Windows `C:\Program Files\ClaudeCode\managed-settings.json`.
- Deploy the plugin folder to a local path and set the marketplace `source` to
  `{ "source": "directory", "path": "/opt/asuer-claude-plugins" }` instead of GitHub.
No GitHub, no user action.

## Requirements (any method)

Each machine needs **Google Chrome** (or Chromium) installed and **Node.js 22+** (the
renderer uses Node's built-in DevTools client, so no `npm install`). Internet at first
render for the Poppins font.

## Verify

Ask Claude: *"Make an Asuer privacy policy PDF from this text …"*. Confirm a branded PDF
is produced. On a managed machine, `/status` shows `Enterprise managed settings`.

## Updating later

1. Edit files under `plugins/asuer-pdf/skills/asuer-pdf/` (the source of truth).
2. Bump `version` in `plugins/asuer-pdf/.claude-plugin/plugin.json`, commit and push.
3. Rebuild the installer bundle if you use Method B (copy that folder to
   `dist/asuer-pdf-skill/skill/` and re-zip). Machines pick up changes on the next refresh.
