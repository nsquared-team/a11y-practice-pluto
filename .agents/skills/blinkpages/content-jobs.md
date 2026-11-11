# Content jobs — new entries from the admin console

The full procedure for a queue row tagged `✎ CONTENT` (`kind:"content"`): the admin console's
"New <type> with AI" briefs and import-from-a-link conversions. [SKILL.md](SKILL.md), next to this file, is the
drain around it (claim, check-out, `running`, the final status write, and **assume or strand**); nothing here
changes those. Read this file before every content job, including after a compaction: unlike SKILL.md, it is
not re-attached.

Contents
- What a content job is, and how it shows in `list`
- The record (`entry`, `importSource`)
- Procedure: 1 check out, 2 learn the collection, 3 the file and its frontmatter, 4 the source (imports),
  5 the body (briefs), 6 validate, 7 commit, push, report
- When it doesn't work out: `failed`, or a strand

## What a content job is

The admin console's **New <type>** flows queue a different kind of job: not a change to an existing page but a
**new entry in one of the site's content collections** — "New Post with AI", or "New Post" with a link to
import (a Google Doc, a public Claude artifact, a web page). The console has already done every deterministic
step: the draft branch and its PR exist (`targetBranch`), the entry's address is decided, and — when the
collection's schema allows it — a stub file with valid frontmatter is already on the branch. What's left for you
is the *content*.

## How they appear in `list`

Tagged `✎ CONTENT`, plus `import <host>` when a link was snapshotted and `⚠ <warning>` when that snapshot is
suspect; the second line names the file and its address, the third is the first line of the prompt:

```
  • d_9f1…  pending/queued-for-precision ✎ CONTENT import docs.google.com  ·  4m old
      posts → src/content/posts/q3-launch-recap.md  (/q3-launch-recap/)
      Import the linked Google Doc into a new Post "Q3 launch recap".
```

`[no stub — create the file]` on the second line means the console could **not** write a stub (the schema
needs values no template can guess) — you create the file.

## The record

From `claim`, or `list --json`, it adds to the usual shape:

```jsonc
{ "kind": "content", "source": "content-console", "targetBranch": "draft-q3-launch-recap/v1",
  "entry": { "type": "posts", "collection": "posts", "path": "src/content/posts/q3-launch-recap.md",
             "url": "/q3-launch-recap/", "stub": true, "required": ["title", "date", "slug"],
             "dir": "src/content/posts", "ext": ".md" },
  "importSource": { "url": "https://docs.google.com/document/d/…/edit", "finalUrl": "…/export?format=html",
                    "kind": "google-doc", "attachmentId": "a_…", "contentType": "text/html", "bytes": 48213,
                    "title": "Q3 launch recap", "warning": null },   // absent for a brief-only job
  "prompt": "…" }   // written by the console: the brief (if any), the import facts, the entry's path/URL/required keys
```

## Procedure

This replaces SKILL.md → **Work the queue** step 5. Claim, check-out, `running` and the final status write are
its steps 2–4 and 6, unchanged.

1. **Check out the target branch.** `git fetch origin && git checkout <targetBranch> && git pull --ff-only`.
   It's the console's fresh draft (its PR is already open) — commit there; never re-route a content job to
   another branch. If the branch is gone (the owner discarded the draft before you got here), set `failed` with
   `--error "draft was discarded — nothing to write"` and take the next job.
2. **Learn the collection.** Read `src/content.config.ts` (or `src/content/config.ts`) for the collection's
   schema, then open one or two **sibling entries** in `entry.dir` — they show the frontmatter keys actually
   used, the date format, how images are referenced, and the body conventions (MD vs MDX, components, callouts).
3. **Make sure the file exists with valid frontmatter.**
   - `entry.stub === true` → `entry.path` is already on the branch with valid frontmatter. Its body is a notice
     block ("Importing from …" / "AI is drafting this") and, for an import, a plain-text first pass under a
     `---` rule. **Replace the whole body.** Keep the frontmatter's `title`, `date` and `draft` exactly as the
     console wrote them unless the brief says otherwise — the owner chose the title, and `draft: false` is
     deliberate (the *branch* is the draft; publishing the branch is what makes it live).
   - `entry.stub === false` → create `entry.path` yourself. Every key in `entry.required` must be present and
     valid per the schema: copy a sibling's frontmatter shape and fill it honestly (a real category from the
     enum, the `slug` from `entry.url`, today's date in the sibling's format, `draft: false` where the field
     exists). Never invent a value you can't know (a required headshot, a `canonical` URL): **strand** the job
     (SKILL.md → **Strand a job**). Write the entry with everything else, make the value an open question in
     `.blinkpages/questions/<jobId>.md`, and say there if the entry can't build until it's answered.
4. **Get the source (imports only).** Pull the snapshot the console took when the job was created:

   ```bash
   node .blinkpages/queue.mjs pull-source --job <id> --dest .precision-source
   ```

   It writes `.precision-source/<id>.html` (or `.txt`) and prints `importSource.warning`. `null` → the snapshot
   *is* the document; convert it. Any other value means the snapshot is not trustworthy — fetch the link
   yourself (`importSource.url`, or `finalUrl`):
   - `not-public` — a Google Doc that isn't shared **"Anyone with the link"**; the snapshot is a sign-in page.
     If you can't reach it either, set `failed` with
     `--error "the Google Doc isn't shared publicly — set Share → Anyone with the link → Viewer, then re-create the post"`.
     That text is what the requester reads on the in-page card.
   - `shell-only` — a Claude artifact whose HTML is an app shell with no content in it. Open the URL in a
     browser-capable tool (a headless browser or a fetch tool that renders JavaScript) and read the rendered page.
     An artifact that is an app with no prose to import is a strand: the question is what the page should say.
   - `not-html` — the link returned something other than HTML (a PDF, a JSON API, …). Open it yourself and
     convert whatever it actually is; if you can't read it, `failed` with an error naming the type.
   - `too-large` — the snapshot was cut at 2 MB. Fetch the full document yourself.
   - `timeout` — the fetch didn't finish in 10 s; the snapshot may be empty or partial. Fetch it yourself.

   Then **convert** it to the collection's conventions per
   `.claude/blinkpages-editing.md` → **Importing a document into a content entry** —
   headings, links, lists, tables, footnotes — and **download every image into the site's media convention**
   (look at how siblings reference images, e.g. files under `public/assets/media/blog/<slug>/` referenced as
   `/assets/media/blog/<slug>/<name>.png`). **Never leave a `googleusercontent.com`, `docs.google.com`,
   `claude.ai` or other remote image URL in the entry** — those links expire or 403 for visitors.
   Before you download anything, run `node .blinkpages/queue.mjs media --q <term>` (SKILL.md → **Work the
   queue**, step 5; full rule: `.claude/blinkpages-editing.md` → **Image scope**) — the site may already have the
   picture, including in the media bucket where `ls` cannot see it.
5. **Draft the body (when the prompt carries a brief).** Write it in the site's voice: read `reference/`
   (voice-and-tone, about-the-company, customers-and-personas), the site's design spec (`DESIGN.md` at the repo
   root) and its design-system page (`src/pages/design-system.astro`; `style-library.astro` on older sites; some
   keep a `brand.astro`), and match the
   length, heading rhythm and tone of the best sibling entries. Brief **and** import → convert first, then apply
   the brief to the converted text (restructure, tighten, add what's asked) rather than writing from scratch.
   A fact you don't have is never invented: if the entry reads complete without it, leave `<!-- TODO: … -->`
   and record it as an assumption; if it doesn't, strand.
6. **Validate.** `npm run build` (or `npx astro check`, when the site has it) must pass — a schema error here
   means the frontmatter is wrong; fix the entry, never loosen the schema. Confirm the entry was emitted at
   `entry.url` under `dist/`.
7. **Commit and push, then report.** One commit, the entry plus the images you added:

   ```bash
   git add <entry.path> <public/… images you added>
   git commit -m 'blinkpages-ai: import "<title>"'     # or: blinkpages-ai: create "<title>"
   git push
   node .blinkpages/queue.mjs set --job <id> --status done --commit "$(git rev-parse HEAD)" --claim-token <claimToken>
   ```

   The draft's preview rebuilds and the owner lands on the new page. **Don't publish** — the branch is the
   draft; the owner reviews it and hits Publish.

## When it doesn't work out

It is either `failed` (nothing to decide in this draft) or a strand (SKILL.md → **Strand a job**). For `failed`,
`set --job <id> --status failed --error "<message>" --claim-token <claimToken>`. The `error` is shown to the
requester on the in-page card, so write it for *them* — what happened and what to do next:
- source unreachable → `failed`: `"the Google Doc isn't shared publicly — set Share → Anyone with the link → Viewer, then re-create the post"`,
  or `"couldn't read <url> (<what happened>) — paste the text into the brief instead"`;
- a required field only the owner can supply → **strand**; the card text is SKILL.md's `Needs your decision (1): …`
  template;
- the draft is gone → `failed`: `"draft was discarded — nothing to write"`;
- the brief needs an image that doesn't exist → **strand** (write the entry without it; the question is which
  image, or to provide one); never fabricate one.
