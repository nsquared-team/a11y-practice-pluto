<!-- GENERATED — do not edit. Source of truth: managed-skills/EDIT-METHODOLOGY.md (blinkpages-platform).
     Regenerate with: node scripts/sync-tenant-skills.mjs --regen -->

# AI edit — editing methodology

This is the **single source of truth** for *how* to make a BlinkPages AI edit well. It is shared,
verbatim, by both surfaces of the skill:

- the **operator** profile (`.claude/skills/blinkpages-site-edit/`) — drains the queue across all
  tenants, clones each repo, writes status back to KV;
- the **tenant** bundle (`managed-skills/blinkpages-site-edit/`, stamped into each tenant repo) —
  edits the one site it's run inside, in place.

Each surface owns its *wrapper* (how a job is discovered, claimed, and reported). Neither one re-states the
craft below — they point here. When the way we edit changes, change it **here**, then re-run
`scripts/sync-tenant-skills.mjs --regen` so both generated copies stay byte-identical.

---

## Do the change

Work interactively in the Claude Code session (unless an `--auto` mode says otherwise), at whatever model and
reasoning effort is selected — pick what fits the task. The job carries a `prompt`, a `pageKey` (the page the
request came from — may be empty), and optional uploaded `images`.

1. **Read the page first — and default to it.** Resolve `pageKey` to the source file(s) that render it and
   read them before touching anything. Treat `pageKey` as the **default scope**: make the change on *that*
   page (and the components/props/data it renders) only. Go site-wide or cross-page **only** when the
   request clearly asks for it ("on every page…", "across the site…", "the footer everywhere…"). This is the
   deep AI edit — layout, multi-page, image, or otherwise hard changes — so understand the surrounding
   components, props, and data modules, not just the line the prompt names. Reason about structure, not just
   a line-level string swap.

2. **Make the edit the prompt actually asks for.** Multi-file, layout, and component changes are in scope.
   Match the surrounding code: its naming, its component patterns, its design tokens. Don't invent a new
   pattern when the site already has one.

3. **Place and finish any uploaded images.** Uploaded replacements arrive on disk (the wrapper pulls them).
   Put them in the right place, wire them into the page, and crop / size / optimize as the layout needs.

4. **Respect `writableRoots`.** Every tenant declares the roots you may write to (usually `src/` and
   `public/`). Never write outside them. Read the tenant's config for the authoritative list.

5. **One logical concern per commit.** If the prompt bundles two unrelated changes, make two commits. Keep
   each commit message short and concrete: `blinkpages-ai: <what changed>`.

---

## Draft by default — protect the live site

The live branch (`main`) is what visitors see. **Protect it.** Every change lands as a **draft** the owner can
preview before it goes live — never a straight commit to the live branch unless the owner has explicitly asked
for that.

First, the words — **"draft" and "variation" are BlinkPages language, not GitHub language.** A *draft* is a
`draft-<slug>/v1` branch plus a regular **open** PR off `main`. A *variation* (or *option*) is a sibling take
in the **same group** — another `draft-<slug>/vN` branch whose PR is **also off `main`** (see **Multiple
options** below), never a sub-PR off another draft. The `/vN` **folder** (the part before the last `/`) is
what groups options together; every draft is foldered from the start (a lone draft is just `…/v1`) so options
can be added later. When the owner says "draft" or "variation", they mean one of those.

> **"Draft" is a friendly name, never a literal GitHub draft PR.** GitHub draft-status PRs are unmergeable
> (every merge attempt 405s, however long you wait), so a literal draft silently breaks Publish. So:
> **`gh pr create` must never pass `--draft`**, and any PR opened via the API sets `draft: false`. The editor
> is defensive too — if it ever meets a GitHub-draft PR on publish, it marks it *ready for review* and then
> merges, in one action — but the rule is that we never create one in the first place.

Route the request:

- **The owner references an existing draft or variation** ("the holiday draft", "that punchier-hero version") →
  find its open PR (`gh pr list --state open` — drafts are the `draft-*` head branches; match on the PR title,
  which is the name the owner sees), check out that branch, and commit there. Its preview refreshes on push.
- **Anything else is about the live site** → base the work on `main`, but deliver it as a **new draft** (see
  **The draft loop** below). This is the default for *every* change, including small text fixes — "small" is not
  a reason to skip the preview. A draft is cheap and reversible, and it lets the owner see the change on their
  real site before any visitor does.
- **Straight-to-live only on explicit confirmation.** If the owner asks you to change the live site directly,
  recommend the draft anyway — *"I can put this straight on the live site, but I'd recommend a quick draft so
  you can preview it first — want the draft?"* — and commit to `main` only after they explicitly confirm.
- **Target already chosen?** If you're on a branch the editor pre-created (the owner chose "Save as a new
  draft"), or a queued Edit-with-AI job carries a `targetBranch`, that **is** the owner's explicit choice —
  commit there, even when the target is the live branch. The routing above applies only to requests that arrive
  without a pre-chosen target.

One rule with no exceptions: **a draft only exists once its PR is open.** Previews build only for pull requests —
a pushed branch with no open PR gets no preview URL and never appears in the owner's drafts list. Never stop at
`git push`.

---

## The draft loop — branch → PR → preview link

The standard delivery for any change (**Multiple options** below builds on it):

```bash
# 1. Branch off the up-to-date live branch. Every draft is FOLDERED from birth as draft-<slug>/v1
#    (keep <slug> short + distinctive — it becomes the preview host label; see the URL note below).
git fetch origin && git checkout -b draft-<slug>/v1 origin/main

# 2. Make the edit (inside writableRoots), one logical concern per commit
git add <changed paths> && git commit -m "blinkpages-ai: <what changed>"

# 3. Push AND open the PR — the open PR is what makes it a draft with a preview. ALWAYS --base main.
git push -u origin draft-<slug>/v1
gh pr create --base main --head draft-<slug>/v1 \
  --title "<short human title — this names the draft in the owner's editor>" \
  --body "<one-line plain-language summary>"        # a regular open PR — NEVER --draft

# 4. Wait for the preview build (the PR's checks)
gh pr checks draft-<slug>/v1 --watch

# 5. Read the preview URL from the sticky "🔍 Open Preview" comment
gh pr view draft-<slug>/v1 --json comments \
  --jq '[.comments[].body | select(contains("pr-preview-summary"))] | last'
```

- The deploy workflow posts (and keeps updating) a sticky PR comment marked `pr-preview-summary`; its "🔍 Open
  Preview" headline link is the preview URL to hand the owner. That link is an HTML `<a href="…">` anchor, not a
  markdown link — extract the `href` (and find the comment by its `pr-preview-summary` marker, as above). If the
  comment is slow to appear, the URL is deterministic: `https://<alias>--<tenantId>.blinkpages.dev`, where
  `<alias>` is the branch name with every non-alphanumeric run collapsed to a single `-` — so a foldered branch
  `draft-holiday/v2` becomes the alias `draft-holiday-v2` (the `/` is NOT preserved in the host). `tenantId` is
  in `.migrate-to-astro/tenant.*.json`.
- `gh pr checks --watch` may report "no checks reported" for a few seconds right after the PR opens — retry
  briefly. It exits non-zero when a check fails: read the failing run and fix it before handing the owner a URL.
- **Tell the owner in their language** — draft / preview / publish / live, never branch / commit / merge / PR:
  *"I've created a draft called '<title>'. Preview it here: <url> — you'll be asked to sign in with your site
  login. When you're happy, hit Publish in the editor, or tell me and I'll publish it."*
- **Publish only when the owner explicitly says so:** `gh pr merge draft-<slug>/v1 --squash` — the same
  squash-merge the editor's Publish button does. Production deploys from `main` automatically; confirm to the
  owner once it's live. Never auto-publish a draft. **If the draft is one option in a group** (its `/vN` folder
  has other open options), publishing it in the editor auto-discards the rest; when you publish from the CLI
  you must do that yourself — close the other options' PRs (`gh pr close <n>`) after the merge — and do **not**
  `--delete-branch` any of them, so a discarded option stays reopenable.

---

## Multiple options: sibling drafts in a group

Sometimes the request isn't one change — it's *several takes to choose between*: "make three variations of the
home page", "give me a couple of different hero treatments", "try a few directions for this section". BlinkPages
models that as a **variation group**: **flat sibling drafts sharing one `/vN` folder**, every one a PR **off the
live branch** so any of them can be published directly.

- **Group folder** — all the options live under one `draft-<slug>/…` folder (e.g. `draft-hero/v1`, `/v2`, `/v3`).
  The folder (the part before the last `/`) is what clusters them together in the owner's drafts list and compare
  view. Publishing **any** option merges it to the live site and **auto-discards the others** in the folder.
- **Option** — one `draft-<slug>/vN` branch + PR **off `main`**. Options are *siblings*, not stacked: never base
  one option's PR on another. A different copy, layout, or thematic direction — a real *direction* to choose from.

**Counting rule — "N variations" means N options *total*.** So "three variations of the home page" → **three
options** `…/v1 …/v2 …/v3` (compared alongside the live site). "A couple of options" → two options. Number them
`vN` in the branch; the human title (not the branch) is what labels each option's column in compare.

**How to build them:**

1. **Pick the group folder + build the first option.** If you're already on a `draft-<slug>/vN` branch (the editor
   pre-created one because the owner checked "Save as a new draft/variation"), its folder **is** the group — add
   the next option as a sibling under the same folder (see step 2). If you're on the live branch (`main`), **do
   not** commit onto `main`: create the first option exactly as in **The draft loop** above —
   `draft-<slug>/v1` off `origin/main`, PR `--base main`. Keep `<slug>` short + distinctive (it's the preview host
   label) and give the PR a plain, human-recognizable title (e.g. "Punchier hero headline"), never a raw copy of
   the prompt. **Reserve `/` in `draft-*` names for grouping** — the slug itself never contains a `/`. If the
   folder/branch already exists on the repo, suffix the slug (`draft-hero-2/v1`) so you start a genuinely new
   group rather than colliding.
2. **Each remaining option is a sibling in the SAME folder, its PR off `main`:**
   ```bash
   git checkout -b draft-<slug>/v2 draft-<slug>/v1   # start from the first option (the shared groundwork)…
   # …make a genuinely different take (different copy / layout / theme), staying inside writableRoots…
   git add -A && git commit -m "blinkpages-ai: <what this option tries>"
   git push -u origin draft-<slug>/v2
   gh pr create --base main --head draft-<slug>/v2 \            # ALWAYS --base main — a SIBLING, never a sub-PR
     --title "<short option title>" --body "Option in the draft-<slug> group."
   ```
   `--base main` is what makes every option directly publishable; the shared `draft-<slug>/…` folder is what
   groups them. Nothing else is needed — the editor's drafts list and compare view pick up every open PR and
   cluster them by folder, and each branch gets its own preview URL. Bump `vN` for each further option
   (`…/v3`, `…/v4`, …).
3. **Keep the options meaningfully distinct.** Different directions, not cosmetic tweaks — options exist so the
   owner can pick a *direction*. Give each PR a short, descriptive title; it labels that option's column in compare.
4. **Finish with every option's preview link.** Each PR gets its own sticky "🔍 Open Preview" comment (and its own
   `draft-…` alias URL) — hand the owner the full set, the same way as in **The draft loop**. Tell them that
   publishing any one option makes it live and discards the others.

> **Stacked sub-PR (advanced, deliberate — NOT for options).** `gh pr create --base <draftBranch>` still works
> for the rare case where a change genuinely merges *into* another draft (an increment built on top of it, not an
> alternative to it). **Never** use it for options: a stacked option "publishes" into its sibling instead of the
> live site, and picking a winner merges it nowhere useful. Options are always `--base main`.

Fanning out to multiple options is this AI edit's job — a multi-option request belongs here, not squeezed
into a single in-place edit.

---

## Image scope (important)

Claude **cannot synthesize a new photograph or raster image.** There is no image-generation provider
wired up. This path is scoped to **edit / replace / crop / restyle**:

- **Swap** in an uploaded replacement image.
- **Crop / border / padding / object-fit / layout** around an image — pure code/CSS edits.
- **Restyle** how an existing image is presented.

A request to **generate a brand-new image** → **STOP**. Do not hand-draw an SVG, do not invent a placeholder,
do not approximate. The wrapper decides what to do with the stop (the operator marks the job `failed` with
`error: "needs a real image — please upload one"`; the tenant is told to upload one and re-run). Either way,
**never** ship a fabricated image as a substitute.

---

## When to stop and ask (interactive mode)

Pause and ask the human when the prompt is genuinely ambiguous, when "the right answer" depends on intent you
can't infer from the page, or when the change would touch something outside `writableRoots`. In `--auto`
mode, make a **reasonable assumption** instead of asking, and only hard-stop on a true blocker (an ambiguous
request you'd have to guess wildly at, or a needs-a-real-image case) — recording the blocker rather than
guessing.
