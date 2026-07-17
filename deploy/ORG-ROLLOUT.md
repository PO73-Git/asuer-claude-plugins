# Org rollout — Asuer Claude Code plugins (managed settings)

Goal: every Asuer/BBB machine gets the `asuer-pdf` (and `ict-ticket`) plugin
automatically, with no per-user action. Claude Code **managed settings** enforce this.

## How it works

Claude Code reads a system-level `managed-settings.json` that IT deploys. It takes
precedence over user settings and cannot be turned off by the user. Ours declares the
`asuer-plugins` marketplace (pointing at the GitHub repo) and enables the plugins. On next
launch, every user's Claude Code fetches the marketplace and activates the plugins.

## Step 1 — Publish the repo (once, maintainer)

The marketplace must be a git URL every machine can reach (a local folder will not resolve
on other laptops). Create and push this repo:

```bash
cd ~/asuer-claude-plugins
gh repo create PO73-Git/asuer-claude-plugins --private --source=. --remote=origin --push
```

Or with plain git (after creating the empty repo on GitHub):

```bash
cd ~/asuer-claude-plugins
git remote add origin git@github.com:PO73-Git/asuer-claude-plugins.git
git push -u origin main
```

If you publish under an Asuer GitHub **org** instead of a personal account, use that
owner (e.g. `asuer/claude-plugins`) and update `repo` in `managed-settings.json` to match.

## Step 2 — Deploy managed-settings.json (IT / MDM)

Push [`managed-settings.json`](./managed-settings.json) (in this folder) to the managed
path on every machine:

| OS | Path |
|---|---|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\ProgramData\ClaudeCode\managed-settings.json` |

Deploy it with your MDM (Jamf / Intune / Kandji) as a managed file at that path. No user
action is required; it applies on the next Claude Code launch.

## Private-repo access

Because the repo is **private**, each machine's Claude Code must be able to read it from
GitHub. Options:
- Ensure users are signed in to GitHub (`gh auth login`) or have a credential helper, OR
- Deploy a read-only deploy key / token via MDM, OR
- If you prefer zero-auth fetching and are comfortable with the templates being public,
  create the repo `--public` instead and skip this section.

## Step 3 — Verify

On a test machine after deployment:
1. Launch Claude Code.
2. Ask: "Make an Asuer privacy policy PDF from this text …".
3. Confirm the `asuer-pdf` skill activates and a branded PDF is produced.

## Updating later

1. Edit the skill under `plugins/asuer-pdf/skills/asuer-pdf/`.
2. Bump `version` in `plugins/asuer-pdf/.claude-plugin/plugin.json`.
3. Commit and push. Machines pick up the update on the next marketplace refresh.
