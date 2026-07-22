---
name: blinkpages-site-edit
description: Make a deep, high-quality AI edit to THIS BlinkPages site — the same edit engine the BlinkPages team runs, scoped to the one site you cloned. Reads the page, makes the multi-file / layout / image change you describe, respects the site's writable roots, and delivers it as a previewable draft by default (straight to live only when you explicitly confirm), pushing on your own git identity. Run it from inside your tenant repo (desktop or cloud Claude Code). Runs at whatever model and reasoning effort you've selected. Default is interactive; `--auto` makes reasonable assumptions without pausing. Triggers — "ai edit", "site edit", "edit this site with AI", "/blinkpages-site-edit", "make this layout/image/multi-page change".
argument-hint: "[describe the change | --auto] — edits THIS site, in place"
---

<!--
  ════════════════════════════════════════════════════════════════════════════════════════════════
  CENTRALLY MANAGED — DO NOT EDIT THIS SKILL.
  It is owned by the BlinkPages platform and force-overwritten on every update; local changes here
  will be lost on the next sync. Want different or extra behavior? Create your OWN skill in a NEW
  directory under .claude/skills/<your-skill-name>/ — those are yours and are never touched.
  Source of truth: nsquared-team/blinkpages-platform → managed-skills/blinkpages-site-edit/
  ════════════════════════════════════════════════════════════════════════════════════════════════
-->

# /blinkpages-site-edit — deep AI edit of THIS site

This is the **AI edit** engine BlinkPages runs — for layout, multi-page, image, or otherwise hard changes. The
BlinkPages team runs it centrally across every site; **this copy is scoped to the one site you're inside.** It
edits the working tree you have checked out, in place, and pushes with **your** git identity.

**Model & effort are yours.** This runs at whatever model and reasoning effort you've selected in Claude Code —
nothing here forces a specific one. Pick what fits the task: a big layout or multi-page change is worth a
stronger model and higher effort; a quick copy fix doesn't need it.

It is **not** the editor, and it never reaches any other tenant, any shared queue, or any BlinkPages secret —
it only touches this repo. It can either apply a change you describe here or pick up the edits you queued from
the in-page **"Edit with AI"** card — see **How to invoke** just below.

## How to invoke

**Interactive is the default** — ask a follow-up question whenever the request is genuinely ambiguous. Route on
the argument:

- **No argument** → look for queued "Edit with AI" requests (**Drain your queued requests**, at the bottom) and
  work through any that are pending. If the queue is empty (or the worker has no queue endpoints yet), ask what
  you'd like to change instead.
- **`queue`** (or `drain` / `list`) → go straight to draining the queue.
- **A change description** → make that change interactively (steps 1–4 below).
- **`--auto`** → run non-interactively: make a reasonable assumption instead of asking, and hard-stop only on a
  true blocker (see [`docs/EDIT-METHODOLOGY.md`](docs/EDIT-METHODOLOGY.md)). Combines with any of the above.

The long `node …/queue.mjs list` command is just the mechanism — you don't have to remember it. Invoking the
skill with no argument (or `queue`) runs the whole drain flow for you.

## 1. Confirm you're inside one tenant repo

Find the single tenant marker and read your identity from it:

```bash
ls .migrate-to-astro/tenant.*.json
```

- **Exactly one match** → read it. Take `tenantId` and `github.writableRoots` (the roots you may write to,
  usually `public/` and `src/`). If the marker is missing, fall back to `wrangler.jsonc` for the worker name,
  but `writableRoots` then defaults to `["public/", "src/"]`.
- **Zero or many matches** → **stop.** You're not at the root of a single BlinkPages tenant repo. `cd` into
  the site you want to edit and re-run.

You do **not** clone anything and you do **not** need any token — you're already in the repo, authenticated
to push to it as yourself.

## 2. Understand the change

In interactive mode, the change is whatever you describe (in your message, or as the argument to the skill).
If you queued an edit request from the in-page **Edit with AI** card and want to apply it here, paste that
prompt. Read it carefully; if it's genuinely ambiguous, ask before editing (in `--auto`, make a reasonable
assumption instead — see the methodology doc).

## 3. Make the edit

Follow **[`docs/EDIT-METHODOLOGY.md`](docs/EDIT-METHODOLOGY.md)** — the shared editing craft: read the page
first, make the multi-file / layout / image edits, place/crop/optimize any images, and **stay inside
`writableRoots`**. Keep **one logical concern per commit**.

**Draft by default — protect the live site.** A *draft* is a `draft-<slug>/v1` branch + a regular **open** PR off
the live branch — never a GitHub draft-status PR (no `--draft`, ever; PRs stay ready to merge). A
*variation/option* is a sibling draft in the same `draft-<slug>/…` group, its PR **also off `main`** — never a
sub-PR off another draft. If the owner references an existing draft or option, commit on that branch. Everything
else is about the live site and becomes a **new draft** by default — even small text fixes. Commit straight to
the live branch only when the owner has explicitly confirmed they want to skip the preview (recommend the draft
first). Full rule, recipe, and how to build options: [`docs/EDIT-METHODOLOGY.md`](docs/EDIT-METHODOLOGY.md) →
**Draft by default**, **The draft loop**, and **Multiple options**.

**Asked for multiple options ("a few variations", "three versions to choose from")?** Follow
**[`docs/EDIT-METHODOLOGY.md`](docs/EDIT-METHODOLOGY.md) → "Multiple options: sibling drafts in a group"**: build
them as **flat siblings** in one `draft-<slug>/…` group — `draft-<slug>/v1`, `/v2`, … each a PR **`--base main`**
(`git checkout -b draft-<slug>/vN draft-<slug>/v1`, push, `gh pr create --base main`), never a sub-PR off another
draft. Each becomes its own preview in the editor's drafts list + compare view, clustered by folder; publishing
any one goes live and discards the rest. If you're on `main`, create `…/v1` first — don't pile options onto the
live branch.

**Images:** edit / replace / crop / restyle only — there is no image generator. If the change truly needs a
brand-new photo or raster, **stop** and add the image to the repo yourself (e.g. under `public/`), then
re-run referencing it. Never fabricate an image as a substitute. (Full rule: `docs/EDIT-METHODOLOGY.md`.)

## 4. Deliver it: commit → push → PR → preview link

Stage only files inside `writableRoots`, one logical concern per commit. Then route by where you are:

- **On a `draft-*` branch** (the editor pre-created it, or the owner pointed you at an existing draft/variation)
  → commit and push; the draft's open PR rebuilds its preview:

  ```bash
  git add <changed paths within writableRoots>
  git commit -m "blinkpages-ai: <short summary of the change>"
  git push
  ```

  If the branch somehow has **no open PR**, open one now (`gh pr create --base main` — every draft and option
  bases on `main`; a regular open PR, never `--draft`): without it there is no preview and the owner can't see
  the draft.

- **On the live branch (`main`)** → do **not** just push. Run **the draft loop** (full version with caveats:
  [`docs/EDIT-METHODOLOGY.md`](docs/EDIT-METHODOLOGY.md) → **The draft loop**):

  ```bash
  git fetch origin && git checkout -b draft-<slug>/v1 origin/main   # foldered from birth (keep <slug> short)
  git add <changed paths> && git commit -m "blinkpages-ai: <what changed>"
  git push -u origin draft-<slug>/v1
  gh pr create --base main --head draft-<slug>/v1 \
    --title "<short human title — names the draft in the owner's editor>" \
    --body "<one-line plain-language summary>"      # a regular open PR — NEVER --draft
  gh pr checks draft-<slug>/v1 --watch
  gh pr view draft-<slug>/v1 --json comments \
    --jq '[.comments[].body | select(contains("pr-preview-summary"))] | last'
  ```

- **The owner explicitly confirmed a live edit** → commit and push on `main`; that triggers the production
  deploy. Tell the owner it's live.

For drafts, the loop isn't done until the owner has the **preview link** — the URL in the PR's sticky
"🔍 Open Preview" comment (fallback: `https://<alias>--<tenantId>.blinkpages.dev`, where `<alias>` is the branch
with every non-alphanumeric run collapsed to `-`, e.g. `draft-holiday/v2` → `draft-holiday-v2`). Hand it over in their
language — draft / preview / publish, not branch / commit / PR. There's still no status to report anywhere and
no queue to update in interactive mode.

## 5. Make it your own (but not this file)

This skill is centrally managed and will be overwritten when the BlinkPages team ships an update — **don't
edit it.** If you want different behavior, extra steps, or a site-specific workflow, create a **new** skill in
its own directory under `.claude/skills/<your-skill-name>/`. Anything outside
`.claude/skills/blinkpages-site-edit/` is yours and is never touched by the platform sync.

---

## Drain your queued "Edit with AI" requests

Instead of pasting a prompt, you can pick up the edits you queued from the in-page **Edit with AI**
card. This talks **only to your own site's worker** (the `/_blink` endpoints) — no shared queue, no BlinkPages
secret. You authorize once, then list → claim → edit → push → report status, and the in-page progress card
resolves on its own.

1. **Authorize once (single click).** Run:

   ```bash
   node .claude/skills/blinkpages-site-edit/scripts/queue.mjs list
   ```

   The first time, it prints a one-click link — open it, confirm the shown code, click **Approve**. Nothing to
   copy or paste back. The token is cached locally (cloud Claude Code sessions re-auth once per session). The
   command then lists your pending edits.

2. **Pick a job, claim it, pull its images.** Take a `<id>` from the list:

   ```bash
   node .claude/skills/blinkpages-site-edit/scripts/queue.mjs claim --job <id> --by "$(git config user.email)"
   node .claude/skills/blinkpages-site-edit/scripts/queue.mjs pull-images --job <id> --dest .precision-images
   ```

   The claim returns the job's `prompt`, `pageKey`, `targetBranch`, and a `claimToken` (keep it for status
   writes). Make sure you're on `targetBranch` before editing. The job's `targetBranch` is the owner's explicit
   choice, made on the editor's "Save as a new draft" checkbox — honor it even when it's the live branch; don't
   re-route a queued job into a new draft.

3. **Mark it running, then make the edit.** Set status `running`, then do the change exactly as in steps 3–4
   above — follow [`docs/EDIT-METHODOLOGY.md`](docs/EDIT-METHODOLOGY.md), stay inside `writableRoots`, place
   the pulled images, and commit + push on **your** identity (one logical concern per commit):

   ```bash
   node .claude/skills/blinkpages-site-edit/scripts/queue.mjs set --job <id> --status running
   ```

4. **Report status back.** After the push lands, write the outcome so the in-page card resolves:

   ```bash
   node .claude/skills/blinkpages-site-edit/scripts/queue.mjs set --job <id> --status done --commit <sha>
   # or, if it didn't work out:
   node .claude/skills/blinkpages-site-edit/scripts/queue.mjs set --job <id> --status failed --error "what went wrong"
   ```

If your site's worker doesn't have the queue endpoints yet, the script says so and exits cleanly — fall back
to **interactive mode** (describe / paste the prompt, per the steps above) and edit in place.
