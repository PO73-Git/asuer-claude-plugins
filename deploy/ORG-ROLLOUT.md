# Org rollout — Asuer PDF skill

Goal: everyone on the team has the `asuer-pdf` skill, so Claude produces on-brand PDFs
whenever they ask for a document or PDF. **No GitHub or account is required.**

A Claude Code "skill" is just a folder in `~/.claude/skills/`. Claude auto-discovers it and
auto-triggers it from its description. So distribution is simply: get the folder onto each
machine. Pick the method that fits how your team already receives files.

## Method A — Shared-drive installer (recommended, no GitHub)

1. Put [`dist/asuer-pdf-skill.zip`](../dist/asuer-pdf-skill.zip) on your shared drive
   (Google Drive / SharePoint) where the team can reach it.
2. Each teammate: download the zip, unzip it, and **double-click `install.command`**.
   - First time on macOS: if it's blocked, right-click the file, choose **Open**, then
     **Open** again. (Unsigned internal script; this is the standard one-time approval.)
   - Terminal/Linux alternative: `bash install.sh`.
3. Quit and reopen Claude Code. Done.

That copies the skill to `~/.claude/skills/asuer-pdf/`. From then on, asking Claude to
"make a doc" or "create a PDF" produces a branded Asuer document.

## Method B — Zero-touch via MDM (no GitHub, no user action)

If you have MDM (Jamf / Intune / Kandji), deploy the **`skill/`** folder (inside
`dist/asuer-pdf-skill/`) to this path on every machine:

```
~/.claude/skills/asuer-pdf/
```

Push it as a managed folder. No user action, no GitHub. Re-push to update.

## Method C — GitHub marketplace (optional, only if the team uses GitHub)

For teams comfortable with GitHub, the plugin can be installed from a marketplace repo, and
`deploy/managed-settings.json` can auto-provision it. This route **requires each machine to
reach the GitHub repo** (so skip it if anyone lacks GitHub access — use Method A or B).

- Publish: `gh repo create <owner>/asuer-claude-plugins --private --source=. --push`
- Managed settings path: macOS `/Library/Application Support/ClaudeCode/managed-settings.json`,
  Linux `/etc/claude-code/managed-settings.json`, Windows `C:\ProgramData\ClaudeCode\managed-settings.json`.
- Update `repo` in `managed-settings.json` to match the published repo.

## Requirements (any method)

Each machine needs **Google Chrome** (or Chromium) installed and **Node.js 22+** (the
renderer uses Node's built-in DevTools client, so no `npm install`). Internet at first
render for the Poppins font.

## Verify

Open Claude Code and ask: *"Make an Asuer privacy policy PDF from this text …"*. Confirm a
branded PDF is produced. Requirements warnings, if any, are printed by the installer.

## Updating the skill later

1. Edit files under `plugins/asuer-pdf/skills/asuer-pdf/` (the source of truth).
2. Rebuild the installer bundle: copy that folder to `dist/asuer-pdf-skill/skill/` and
   re-zip; re-share (Method A) or re-push (Method B/C).
