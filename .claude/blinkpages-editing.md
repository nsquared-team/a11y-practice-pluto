<!-- GENERATED — do not edit. Source of truth: managed-skills/EDIT-METHODOLOGY.md (blinkpages-platform).
     Regenerate with: node scripts/sync-tenant-skills.mjs --regen -->

# AI edit — editing methodology

This is the **single source of truth** for *how* to make a BlinkPages change well. It applies to
**every** change to a tenant site, whether or not any skill was invoked — a site owner who simply says
"add a Black Friday banner" gets exactly these conventions, because this file is stamped into their repo
at `.claude/blinkpages-editing.md` and their `CLAUDE.md` points at it. It is shared verbatim by:

- the tenant site itself — stamped to `<repo>/.claude/blinkpages-editing.md`, ambient guidance for any
  change made in that repo, command or no command;
- the **tenant** command (`managed-skills/blinkpages/`, `/blinkpages`) — works that one site's queued
  "Edit with AI" and content jobs, in place;
- the **operator** profile — BlinkPages' own tooling (never present in a tenant repo) that drains the
  queue across all tenants, clones each repo, writes status back to KV.

Each *wrapper* owns only how a job is discovered, claimed and reported. None of them re-states the craft
below — they all point here. When the way we edit changes, change it **here**. The tenant copy is composed
at stamp time, so it needs nothing; re-run `scripts/sync-tenant-skills.mjs --regen` to refresh the
operator profile's copy.

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
   pattern when the site already has one — see **Build with the site's design system** below before adding
   any section, component or CSS.

3. **Place and finish any uploaded images.** Uploaded replacements arrive on disk (the wrapper pulls them).
   Put them in the right place, wire them into the page, and crop / size / optimize as the layout needs.

4. **Respect `writableRoots`.** Every tenant declares the roots you may write to (usually `src/` and
   `public/`). Never write outside them. Read the tenant's config for the authoritative list.

5. **One logical concern per commit.** If the prompt bundles two unrelated changes, make two commits. Keep
   each commit message short and concrete: `blinkpages-ai: <what changed>`.

---

## Build with the site's design system, not beside it

Every BlinkPages site carries a **style library** — the design system made explicit when the site was built.
It is per-site (names and token prefixes differ from one site to the next), so find it rather than assume it:

- `src/styles/tokens.css` — every colour, type size, spacing value and radius, as CSS custom properties;
- `src/styles/global.css` — the reset, heading scale, `.btn` / `.container` / `.prose` primitives built on those tokens;
- `src/components/` — shared components at the root (`Hero`, `CTABand`, `Testimonial`, `FAQ`, `PricingTier`,
  `Header`, `Footer` are common names), page-specific ones under `src/components/<page>/`;
- the **`/style-library` page** (usually `src/pages/style-library.astro`) — renders every token, type style,
  layout primitive and component variant, so a person can review the system in one place.

The point of the system is that it **compounds**: every page composed from existing pieces makes the next page
cheaper and keeps the site looking like one site rather than a stack of one-offs. So when a request needs a
new section, page, or visual treatment, work down this ladder and stop at the first rung that fits:

1. **Look before you build.** Read `tokens.css`, open the style-library page, and grep `src/components/` for
   something that already does the job. *Grep first, write second.*
2. **Reuse a fitting component as-is.** Compose the page from what exists; new content, not new markup.
3. **Need a variation? Extend, don't fork.** Add a typed variant prop with a sane default —
   `background?: "navy" | "white"`, `align?: "left" | "center"` — so both uses share one component and every
   page that already uses it is unchanged. Never restyle a shared component globally to suit one page, and
   never paste a near-identical copy beside it. *Within reason*: if the variation would turn the component into
   a maze of conditionals, that is a genuinely new component — make it, and say why in a one-line comment.
4. **New component only when nothing fits.** Put it under `src/components/<page>/` to start; it graduates to
   the `src/components/` root the moment a second page uses it. Build it from the tokens and primitives, not
   from hardcoded values.
5. **Values come from tokens.** No raw `#1e3a5f` or `font-size: 26px` in a page or component — use the
   variable, and if the value genuinely doesn't exist yet, add it to `tokens.css` first. Every new variant or
   primitive is shown on the style-library page (if the site has populated one), so the system stays honest.

The test at the end: could the *next* section like this one be built from what now exists, with no new CSS?
If yes, the design system grew. If you wrote a one-off, it didn't.

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

### What the owner means

Owners speak in *site* words. Each maps to exactly one mechanic — the editor's own label is in quotes so you can
point at the button when that is the better answer:

| The owner says… | It means — and what you do |
|---|---|
| "draft", "save this as a draft" | A `draft-<slug>/v1` branch + **open** PR off the live branch ("Drafts" → "+ Create Draft" in the editor). If your work already touched the live branch, move it onto a draft branch first (`git stash` → `git checkout -b draft-<slug>/v1 origin/main` → `git stash pop`) — never commit it to live. |
| "preview", "show me", "let me see it" | The draft's preview link — the PR's sticky "🔍 Open Preview" comment (fallback: the alias URL below). For an *existing* draft, find its PR (`gh pr list --state open`, `draft-*` heads, match the title) and hand back that link. A "preview of the live site" is the live site itself. |
| "publish", "take it live", "go live", "make it live" | Squash-merge the draft's PR into the live branch — exactly what "✅ Publish" does. Only when they explicitly ask; if several drafts are open, ask which; if it is one option in a group, close the sibling PRs afterwards (`gh pr close <n>`, never `--delete-branch`); confirm once the deploy has finished. |
| "another version", "a variation", "an option", "two takes" | A sibling in the same group: `draft-<slug>/v2` + its own PR off the live branch ("+ Create Variation" / "Save as a new variation"). Start it from `v1` when it should build on that work, from live when it should not. Never stack one on another — see **Multiple options**. |
| "compare them", "side by side" | The editor's "Compare" view — drafts and the live site as columns, PR titles as the labels. Point them there; nothing to build. |
| "undo", "revert", "put it back" | "Undo the last change on this version" in the editor; from the CLI, `git revert HEAD` and push **on the same branch**. On the live branch this redeploys production immediately — confirm before doing it there. |
| "delete / remove / throw away this draft" | "Remove this draft" = close the PR and **keep** the branch (`gh pr close <n>`, no `--delete-branch`), so it can be reopened later. |
| "what drafts do I have?", "which ones are open?" | `gh pr list --state open` filtered to `draft-*` heads — or "open Drafts in your editor". Answer in draft **names** (the PR titles), never branch names. |
| "mark this post as a draft", "unpublish this post" | Astro's `draft: true` frontmatter on a content entry (the site's own code hides it from the build) — **not** a BlinkPages draft. Ask which they mean if unclear; the change itself still ships as a BlinkPages draft. |
| "make it private" | A platform setting (`protectedPaths`), not a code change — see the end of this file. Keep an already-gated prefix out of the sitemap. |
| "is my edit done yet?" (something they queued) | Queued work waits for someone to run `/blinkpages` (Claude) or **Working the queue** (`AGENTS.md`); the in-page progress card and "Activity" resolve when the job reports back. |

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
  `<alias>` is the branch name **lowercased**, with every non-alphanumeric run collapsed to a single `-` — so a
  foldered branch `draft-holiday/v2` becomes the alias `draft-holiday-v2` (the `/` is NOT preserved in the host).
  That arithmetic holds only while the slug is **37 characters or fewer**; past that BlinkPages keeps a prefix
  and appends a short hash, so for a long name trust the PR comment, not your own derivation. `tenantId` is in
  `.migrate-to-astro/tenant.*.json`. Previews ask for the site login the first time they are opened — say so
  when you hand over the link, or the sign-in screen reads as a broken URL.
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

## Importing a document into a content entry — conversion rules

A **content job** (queued by the admin console's *New <type>* flows) hands you a document — a Google Doc export,
a public Claude artifact, a web page — to become **one entry in a content collection**, or a brief to draft one
from. The wrapper pulls the snapshot and names the file and the collection; these are the rules for turning the
document into that entry. The target is always *the collection's own conventions*: open two sibling entries
first and match them (MD vs MDX, frontmatter keys, how images and callouts are written).

**Frontmatter.** Keep what the console wrote in the stub (`title`, `date`, `draft`) unless the brief says
otherwise. Fill `description` / `excerpt` from the document's lede — one or two sentences, plain text, no
markdown. Categories, tags and other enums only from the values the schema or its siblings already use; never
invent a taxonomy value. `slug` stays what the console chose — it's the address the owner was shown.

**Body.**
- **Headings** — the entry's title is the H1 (the layout renders it from frontmatter); the document's own title
  goes nowhere. Start body headings at `##` and keep the document's hierarchy one level down from where it was
  (`H1`→`##`, `H2`→`###`, …). Drop empty headings and "Untitled" placeholders.
- **Paragraphs** — one blank line between them; unwrap hard line breaks inside a paragraph. Keep bold and
  italic; drop font, colour and size styling entirely. Quotes and apostrophes as the siblings write them.
- **Lists** — `-` bullets and `1.` numbers, nested by two spaces. A Google Doc "list" that is really a run of
  paragraphs with typed numbers becomes a numbered list.
- **Links** — `[text](https://…)` with the *real* destination: unwrap Google's redirector
  (`https://www.google.com/url?q=<target>&…` → `<target>`, URL-decoded) and strip parameters you can see are
  tracking (`utm_*`). A link to the site itself becomes a root-relative path (`/pricing/`). Bare URLs in the
  text stay as autolinks.
- **Images** — **download every one** into the site's media convention (whatever the siblings do — e.g. files
  under `public/assets/media/blog/<slug>/`, referenced as `/assets/media/blog/<slug>/<descriptive-name>.png`).
  Name files for their content, never `image1.png`. Write real alt text from the surrounding context. When the
  stub left `featuredImage` (or the schema's equivalent) empty, the first image usually is it. **Never leave a
  `googleusercontent.com`, `docs.google.com`, `lh3.google…`, `claude.ai` or other remote image URL in the
  entry** — they expire or 403 for visitors. If an image can't be fetched, leave a `<!-- TODO: image … -->`
  comment where it belongs and say so in your hand-off; don't fabricate a substitute.
- **Tables** — a simple grid (no merged cells, short cells, up to ~6 columns) becomes a Markdown table with a
  header row. Anything more — merged cells, multi-paragraph cells, nested lists — stays an HTML `<table>`,
  which is legal in `.md` and `.mdx` alike, with the same cleanup (no inline styles, no widths, no `<font>`).
- **Footnotes** — Markdown footnotes (`[^1]` in the text, `[^1]: note` at the end) when the site's renderer
  supports them (a sibling uses them, or `remark-gfm`/`remark-footnotes` is configured); otherwise a "Notes"
  section at the end with numbered items and superscript markers in the text.
- **Code** — fenced blocks with a language; inline code in backticks. Google Docs "code" is usually a
  monospace paragraph — recognise it by the font and convert it.
- **Callouts / notes / quotes** — `>` blockquotes, or the site's own callout component when the siblings use
  one (MDX). Don't introduce a component the collection doesn't already use.
- **Embeds** (YouTube, tweets, forms) — keep the URL as a link, or use the site's existing embed component;
  never paste raw `<iframe>` markup from the source.
- **Cruft** — drop comments, suggestions, revision markers, page numbers, running headers/footers, "Table of
  contents" blocks, trailing empty paragraphs, and the "Importing from …" / "AI is drafting this" notice the
  console left in the stub. Keep every substantive sentence — conversion is not editing; rewrite only where the
  brief asks you to.
- **MDX** — escape `{`, `}` and a literal `<` in prose that isn't JSX; import any component you use at the top
  of the file, exactly as a sibling does.

**Claude artifacts** are often an *app*, not a document — buttons, tabs, state. Import the *content* (the text,
the tables, the reference material), not the interactivity; if the artifact is a tool with no prose to speak of,
stop and ask what the owner wants the page to say.

**Drafting from a brief** (no document, or a brief on top of an import): write in the site's voice — read the
`reference/` folder and the site's style library or brand page if it has one (usually
`src/pages/style-library.astro`) — at the length and structure of the best sibling entries. Facts you don't have are questions, not inventions: leave a `<!-- TODO: … -->` and say
so in the hand-off.

**Finish** with a build (`npm run build`, or `npx astro check`) — a schema error means the frontmatter is wrong,
never that the schema should be loosened — and one commit: `blinkpages-ai: import "<title>"` or
`blinkpages-ai: create "<title>"`.

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

**"Make this page/section private" is one of those blockers.** Gating a URL prefix is a **platform config**
change — `protectedPaths` in the tenant's central config — which opens a prefix (and every subpath under it)
to a named view audience: exact emails, a whole domain, or, only on tenants that bring their own Cloudflare
Access, a Google Workspace group matched on the group's **email** (`marketing-team@nsquared.io`), never
Google's numeric group id. It is not inside `writableRoots` and cannot be shipped from the repo, so **STOP**:
never substitute a password page, an unlisted URL, a `noindex` tag, or a JS "login" — none of them gate
anything, and shipping one *looks* like the request was fulfilled. Say what the platform can do and hand the
request over (in `--auto`, record it as the blocker rather than improvising). The one repo-side chore that
does belong to a gated prefix: keep it out of the sitemap.
