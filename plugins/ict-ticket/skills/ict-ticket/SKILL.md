---
name: ict-ticket
description: Log an ICT ticket by driving the internal Jotform end-to-end via Playwright MCP. Use when the user says "log a ticket", "file an ICT ticket", "submit to the support form", or pastes ticket details (title, description, motivation, brand, impact, urgency).
---

# ICT Ticket Logger (Playwright MCP variant)

Drive `https://form.jotform.com/252693748083569` (a 4-page Jotform Cards form) end-to-end via Playwright MCP. There is no API path — submission must go through the live form.

## Prerequisites

- Playwright MCP server connected (tools prefixed `browser_*`: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_press_key`, `browser_take_screenshot`, `browser_wait_for`, `browser_evaluate`, `browser_resize`).
- A working Chromium (Playwright auto-installs on first run).

If `browser_*` tools aren't available, stop and tell the user to install Playwright MCP: `claude mcp add --scope user playwright -- npx -y @playwright/mcp@latest`, then restart Claude Code.

## End-to-end flow

### 1. Parse what the user gave you

Extract into this schema:
- submitter email (default `paul@asuer.co.za`)
- followers (Yes/No + up to 4 emails)
- brand (BBB / Asuer / both — multi-select)
- Asuer product (Insure / Connect — only when brand includes Asuer)
- ticket type (New Request / Fix / Recurring Task)
- person type (Employee / Sales Force Member / Customer)
- title (~80 char)
- application/device/product
- description (≥ 25 words)
- motivation (≥ 15 words)
- expected outcome (optional)
- impact 1–5
- urgency 1–5
- deadline DD-MM-YYYY (optional)
- effort 1–5 (optional)

### 2. Ask clarifying questions via AskUserQuestion

Common gaps:
- Brand, when not stated and no obvious pattern.
- Asuer product, when brand includes Asuer.
- Follower email addresses, when only names given.
- Recurrence schedule, when ticket type is Recurring Task.
- Description/motivation word counts — extend if too short.

Batch related questions into a single AskUserQuestion call.

### 3. Show a structured preview

Surface every field, including inferred defaults. Call out judgment calls explicitly (title trimming, where free-form notes were placed, default scoring). Wait for "go" / "submit" / "yes" before opening the browser.

### 4. Drive the form

#### Setup
- `browser_resize(width=1440, height=900)` — set a known viewport so any coordinate fallbacks are predictable.
- `browser_navigate(url="https://form.jotform.com/252693748083569")`.
- `browser_wait_for(time=2)` — let the first card render.
- `browser_snapshot()` — get accessibility refs for visible page.

#### Page 1 — Followers
- Type submitter email into the email field (use the ref from the snapshot).
- Click the followers Yes/No radio. Default No unless the user supplied followers.
- If Yes, type each follower email into the conditional fields (Follower 1 required).
- Click the visible Next button.
- `browser_wait_for(time=1)` for page transition.

#### Page 2 — Classification

The brand selector is rendered inside a cross-origin iframe (`customFieldFrame_85`). Try, in order:
1. **Frame snapshot first.** `browser_snapshot()` after the iframe loads — Playwright traverses frames natively and may surface the brand cards as clickable refs. If you see refs labelled BBB / Asuer, click them via `browser_click`. This is the preferred path.
2. **Coordinate fallback.** If the iframe interior isn't in the snapshot, take a screenshot and click by pixel coordinates. At a 1440×900 viewport with the brand cards centred near the top of Page 2, BBB and Asuer cards are roughly 170px apart horizontally. Always recompute from a fresh screenshot — do NOT hardcode coordinates from memory; viewport differences will break them.

After the brand:
- `browser_wait_for(time=1)`.
- If brand includes Asuer: tick the Insure and/or Connect checkboxes via the snapshot refs. Default both when the ticket is general; just Connect when it's mobile/network/billing-shaped.
- Click the Ticket Type radio matching one of: "New Request (Feature / Improvement)", "Fix", "Recurring Task".
- Click the Person Type radio matching one of: "Employee", "Sales Force Member", "Customer".
- Click the visible Next button.

#### Page 3 — Details
- `browser_snapshot()`.
- Type each text field using its ref:
  - title
  - application/device/product
  - description
  - motivation
  - expected outcome (skip if empty)
- Click the visible Next button.

#### Page 4 — Scoring
- `browser_snapshot()`.
- Click the Impact radio matching the integer value 1–5.
- Click the Urgency radio matching the integer value 1–5.
- If a deadline was given: focus the date input, type DD-MM-YYYY, press Tab. The date widget has separate D/M/Y sub-inputs that don't persist when set individually — type into the master input only.
- If effort was given: click the matching Effort radio.

### 5. Verify before submit

`browser_evaluate(function="() => Array.from(document.querySelectorAll('input[type=radio]:checked')).map(r => ({ name: r.name, value: r.value }))")` — confirm Impact and Urgency are set. Submission silently fails when they aren't.

`browser_take_screenshot()` — show the bottom of Page 4 to the user.

### 6. Pause and confirm

Ask the user explicitly: "Ready to submit?" Do **not** click Submit until they say yes. This is non-negotiable.

### 7. Submit and verify

- Click the Submit button.
- `browser_wait_for(time=8)`.
- Check the URL/title — success looks like a redirect to `submit.jotform.com` with title "Thank You". Take a screenshot to confirm.
- If the page is blank or hangs, close the browser and report failure. Don't retry on a frozen tab.

## Defaults for paul@asuer.co.za

Unless the user overrides:
- Submitter: paul@asuer.co.za
- Person type: Employee
- Ticket type: New Request
- Effort: blank
- Asuer product: Insure + Connect when brand is Asuer and ticket is general; Connect for mobile/network/billing tickets
- Brand: always ask if not stated, except follow-on Access Rights tickets ("same as before")

## Failure modes to watch

- Iframe brand picker clicks not registering → fresh screenshot, recompute coordinates, retry once. If still failing, fall back to `browser_evaluate` targeting the frame.
- Submit appears to do nothing → 99% of the time Impact or Urgency isn't actually set. Re-verify via `browser_evaluate` and re-click.
- Tab freezes after Submit → close, don't retry on the frozen tab.
- More than 4 followers → drop the lowest-priority and tell the user.

## Don't

- Submit without explicit user confirmation.
- Hardcode coordinates from a previous run.
- Assume the progress bar in the screenshot reflects internal state — verify with `browser_evaluate`.
