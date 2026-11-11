---
name: blinkpages
description: Work this site's BlinkPages queue start to finish without stopping to ask — "blinkpages", "work my queue", "process the queue", "work my queued edits", "apply the edits I queued", "anything waiting from the editor?", "drain the queue", "/blinkpages", "$blinkpages". One pass takes every queued "Edit with AI" request, admin-console "New <type> with AI" / import-from-a-link content job and update-from-the-live-site job in turn, delivers each as a previewable draft, and leaves anything that needs the owner's decision waiting in its draft with the questions written down. You do NOT need this to change the site — to make a change, just say what you want, no command. Run it from inside this site's repository, in whichever AI coding tool you use, at whatever model you've selected.
---

<!--
  CENTRALLY MANAGED — DO NOT EDIT THIS SKILL. BlinkPages owns it and overwrites it on every sync, so local
  changes are lost. It is stamped byte-identical to .claude/skills/blinkpages/ and .agents/skills/blinkpages/.
  Want different or extra behavior? Create your OWN skill in a new folder, .claude/skills/<your-skill>/
  (Claude Code) or .agents/skills/<your-skill>/ (Codex and other agentskills.io tools): never touched.
  Source of truth: nsquared-team/blinkpages-platform → managed-skills/blinkpages/
-->

# blinkpages — work this site's queue, start to finish

Type **`/blinkpages`** in Claude Code or **`$blinkpages`** in Codex (the CLI, the IDE extension or the ChatGPT
desktop app), or just say *"work my queue"*. If a slash spelling answers "Unrecognized command", use
`$blinkpages`.

This is a **one-shot, non-interactive queue drainer**. It works every job the owner queued (in-page **"Edit
with AI"** requests, the admin console's **"New <type> with AI"** and import-from-a-link jobs) start to finish,
never stopping to ask, then reports. That is its whole scope: it takes no arguments, and `--auto` changes
nothing. A change described in the invoking message is not a queue job: it is an ordinary request that needs
no command, so handle it as one.

It touches only this repo and this site's own `/_blink` worker (never another site, a shared queue or a
BlinkPages secret), pushes with **your** git identity, and runs at the model and effort you selected.

## Before you start

- **One site.** `ls .migrate-to-astro/tenant.*.json` must match exactly one file: read `tenantId` and
  `github.writableRoots` from it (absent → `["public/", "src/"]`). Zero or several → stop: this is not the
  root of one BlinkPages site; `cd` into it and re-run. You clone nothing and need no token.
- **The craft.** Read `.claude/blinkpages-editing.md` (plain Markdown, any tool can open it) before the first
  job. Every change follows it, and nothing loads it for you.
- **Network.** `node .blinkpages/queue.mjs` talks to this site over HTTPS and caches its login in
  `~/.config/blinkpages/`. In a sandbox (Codex by default: network off, writes limited to the workspace),
  `fetch failed`, `ECONNREFUSED` or `EACCES` means: run it outside the sandbox (approve the escalation) and
  retry. **A failure to reach the queue is never "nothing queued".**

## Decide without asking: assume or strand

Nobody watches a drain, so **never stop it to ask.** For each job:

- **Clear** → do it.
- **Unclear, but a reasonable, easily reversed reading exists** → take it and finish the job. Record the
  assumption where the owner will see it at review: the commit message body, a PR comment
  (`gh pr comment <branch>`) when there is a PR and `gh`, and the recap.
- **Can't proceed safely**: it needs something only the owner has (an image in neither the repo nor the media
  library, a required value), or the readings lead to materially different results → **strand it** (below).

**This overrides the loaded conventions:** wherever `.claude/blinkpages-editing.md`, `AGENTS.md` or
`.claude/blinkpages.md` say to stop and ask the owner, a queue job strands instead. Never invent an image, a
fact or a value to avoid a strand. Extending a shared building block so every existing use is unchanged is an
assumption, not a strand (the methodology says so). Work this repo cannot do at all (making a page private is
a BlinkPages setting) is `failed`, saying what to do instead.

## Work the queue

1. **Authorize and list.**

   ```bash
   node .blinkpages/queue.mjs list
   ```

   It prints a one-click link: the owner opens it, checks the code and clicks **Approve** (nothing to paste
   back). The login lasts **24 hours**, so this comes round about once a day: normal, not a fault. Empty →
   say so and stop; never invent work. Route each pending row by its tag: none → a page edit (steps 2–6);
   `✎ CONTENT` → **Content jobs**; `⟂ MERGE-CONFLICT` → **Update-from-the-live-site jobs** (both below; they
   claim, start and report the same way).
2. **Claim it.**

   ```bash
   node .blinkpages/queue.mjs claim --job <id> --by "$(git config user.email)"
   ```

   It returns `prompt`, `pageKey`, `targetBranch` and a `claimToken`: keep it, and pass
   `--claim-token <claimToken>` on every `set`.
3. **Check out its branch:** `git fetch origin && git checkout <targetBranch> && git pull --ff-only`.
   `targetBranch` is the owner's choice (the editor's "Save as a new draft" checkbox): honour it even when it
   is the live branch, and never re-route a job. The one exception is a strand (below). A missing branch
   means the owner discarded the draft: `failed --error "draft was discarded — nothing to write"`.
4. **Start.**

   ```bash
   node .blinkpages/queue.mjs set --job <id> --status running --claim-token <claimToken>
   node .blinkpages/queue.mjs pull-images --job <id> --dest .precision-images
   ```

5. **Make the change** per `.claude/blinkpages-editing.md`, inside `writableRoots`, one concern per commit
   (`blinkpages-ai: <what changed>`), placing the pulled images. Before adding any image, check what the site
   has: `node .blinkpages/queue.mjs media --q <term>` (`--kind image|video|audio|doc`, `--all` for everything).
   `ls` misses bucket-only files, which have no local copy:
   reference them by their `/assets/media/…` path, never `import` one. **Never commit `.precision-images/` or
   `.precision-source/`.** A queued "give me three versions" builds sibling drafts (the methodology's
   **Multiple options**) and reports `done` once, on this job, with the first option's commit.
6. **Push and report.**

   ```bash
   git push
   node .blinkpages/queue.mjs set --job <id> --status done --commit "$(git rev-parse HEAD)" --claim-token <claimToken>
   # or, when it can't be done and isn't a strand:
   node .blinkpages/queue.mjs set --job <id> --status failed --error "<what happened, what to do next>" --claim-token <claimToken>
   ```

   The owner reads `error` on the in-page card: write it for them. Then take the next job.
7. **Recap**, once the queue is done, in the owner's words (draft, preview, publish; never branch, commit,
   PR): each job done, done on an assumption (say which), stranded (the question, and where it waits) or
   failed. Hand over a preview link only after `node .blinkpages/wait-deploy.mjs <branch>` prints it (run it
   per pushed draft now). Exit **1** = the build failed: fix, push, re-run; no link. **2** = still building:
   say it is on its way, re-run before linking. **3** = can't check (no `gh`, no PR, or the live branch,
   where the job is simply live). Never publish.

## Strand a job

1. If `targetBranch` is the live branch, never commit there: `git checkout -b draft-<slug>/v1` off it.
2. Do everything that does not depend on the open question; leave the dependent part undone.
3. Write `.blinkpages/questions/<jobId>.md`, the single exception to `writableRoots`. BlinkPages manages that
   folder and every platform sync of the live branch wipes and re-stamps it, so the file can never linger on
   the live site.

   ```markdown
   # Open questions: job <jobId> (<kind>)
   Request (verbatim): <the job's prompt>
   Done so far: <what you changed>
   1. <question>. Options: <a> / <b>. Recommended: <a>, because <why>. Changes with the answer: <what>.
   How to finish: make the remaining change, delete this file in the same commit, push,
   run `node .blinkpages/wait-deploy.mjs <branch>`, then hand over the preview link.
   ```

4. Commit (`blinkpages-ai: <what was done> — needs decisions`) and push. A draft from step 1 gets a regular
   PR: `gh pr create --base <live> --head draft-<slug>/v1 --title "<short human title>" --body "<one line>"`,
   never `--draft`. With `gh`, also post a PR comment summarising the questions and pointing at the file.
5. Report it `failed` (a stand-in until the editor has a status for this). The owner reads the text on the
   card; without `gh` (so no PR), name the pushed branch instead of the draft:
   `--error "Needs your decision (2): <first question, short>. It's waiting in the draft '<PR title>' — open that draft in Claude Code or Codex and say 'answer the open questions'."`
6. Take the next job.

## If you can't push or reach the network

- **No `gh`, or not signed in:** queued jobs need only `git push` (their branch and PR exist). Without the
  check, an address you work out is only where the preview *will* be: say so.
- **No network at all** (a cloud task): you can't read the queue or push. Say you could not look, and stop.
- **`list` says this site's worker has no queue endpoints yet:** say so and stop.

## Other kinds of job

### Update-from-the-live-site jobs (`kind:"merge-conflict"`)

Tagged `⟂ MERGE-CONFLICT`: the live site moved past a draft and it could not be brought up to date
automatically. **The job's `prompt` is the whole procedure** (merge policy, intent brief, report shape):
follow it. Merge the live branch INTO the draft with a real merge commit (`git config merge.conflictStyle
zdiff3` first; never rebase, never force-push, never `-X ours|theirs` over the whole merge), headline
`Merge branch '<base>' into <draft>`, push, then report what you decided:

```bash
node .blinkpages/queue.mjs set --job <id> --status done --commit <sha> --claim-token <claimToken> \
  --report report.json --draft-before <sha> --live-before <sha> --merge-base <sha> --resolved-by ai
```

The owner sees each decision with a one-tap way to use the other version, so follow the policy rather than
strand.

### Content jobs

A row tagged **`✎ CONTENT`** (plus `import <host>` for a snapshotted link, `⚠ <warning>` when that snapshot is
suspect) is a **new entry in a content collection**, queued from the admin console: "New <type> with AI", a
link to import, or both. The console already made the draft branch and its PR, chose the address and usually
wrote a stub. **Before touching one, read [content-jobs.md](content-jobs.md)**, next to this file (in
`.agents/skills/blinkpages/` or `.claude/skills/blinkpages/`, identical copies), every time, including after a
compaction: it is not re-attached. Even without it, these hold:

- Commit on `targetBranch`; gone → `failed --error "draft was discarded — nothing to write"`.
- Copy a sibling entry's frontmatter; never loosen the schema; keep the console's `title`, `date` and `draft`.
- Imports: `node .blinkpages/queue.mjs pull-source --job <id> --dest .precision-source`; any
  `importSource.warning` → fetch the link yourself.
- Download every image into the site's media folder; never leave a remote image URL in the entry.
- The site must build before `done`. Never publish.
