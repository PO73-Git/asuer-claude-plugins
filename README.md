# Asuer Claude Code plugins

Internal Claude Code marketplace for Asuer & BBB. Add it once, then anyone on the team
can install the plugins below from inside Claude Code.

## Plugins

| Plugin | What it does |
|---|---|
| **asuer-pdf** | Generate on-brand Asuer PDF documents (policy/legal, business letter, internal memo, meeting agenda/minutes, specification/report) from HTML, rendered to A4 with the Asuer letterhead, Poppins, brand blue and a repeating branded footer. Cover and no-cover variants. |
| **ict-ticket** | Log an ICT ticket by driving the internal Jotform end-to-end via Playwright. |

## Install (each team member, once)

From any Claude Code session:

```
/plugin marketplace add <this repo's git URL>
/plugin install asuer-pdf@asuer-plugins
/plugin install ict-ticket@asuer-plugins
```

- If the repo is shared as a **git URL** (recommended for the whole org), use that URL.
- If you have the repo **cloned locally**, you can instead point at the folder:
  `/plugin marketplace add /path/to/asuer-claude-plugins`.

After installing, restart Claude Code (or reload) so the skills register.

## Using asuer-pdf

Just ask, e.g.:

- "Make an Asuer privacy policy PDF from this text."
- "Draft an Asuer business letter to … and render it to PDF, with a cover page."
- "Turn these meeting notes into Asuer minutes with an action-item table."
- "Regenerate the Asuer policy pack (Privacy, T&Cs, PAIA, Complaint, Conflict) with the new spacing."

Claude will pick the right template, drop in your content, render the PDF with Chrome,
and open it. The full design system and rules live in
`plugins/asuer-pdf/skills/asuer-pdf/SKILL.md`.

**Requirements on the machine that renders:** Google Chrome (or Chromium) installed, and
Node 22+ (for the built-in DevTools renderer — no npm install needed). Internet access at
render time so the Poppins web font loads.

## Publishing / updating (maintainer)

This repo is the single source of truth for the design system and templates.

1. Edit the skill under `plugins/asuer-pdf/skills/asuer-pdf/` (styles, templates, render).
2. Bump `version` in `plugins/asuer-pdf/.claude-plugin/plugin.json`.
3. Commit and push.
4. Team members run `/plugin marketplace update asuer-plugins` then reinstall/upgrade.

To distribute org-wide, push this repo to the shared Asuer GitHub org and share the URL.
