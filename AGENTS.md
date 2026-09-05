<!-- BEGIN blinkpages-managed (AGENTS) v1 -->
> ⚠️ **Everything between the two `blinkpages-managed (AGENTS)` markers is maintained by BlinkPages and is
> replaced whenever the platform updates.** Edits inside it are lost. Your own notes go *below* the closing
> marker, or in the `reference/` folder — both are yours and are never touched.
>
> Don't want it here at all? Put the line `<!-- blinkpages-managed (AGENTS): off -->` **below the closing
> marker** and BlinkPages will never write to this file again. Your AI assistant then loses these instructions, so the
> drafts it makes may skip the preview step and go straight at your live site.

# This repository is a live website on BlinkPages

Changing a file here changes a real, published site: **https://www.discoverpluto.site**. Treat every request as a change to
that site, not to a codebase.

**Who you are helping.** The site's owner. They think in terms of their *site* and their *business* — pages,
copy, images, brand — not code, git or pull requests. Speak their language: *draft, preview, publish, live*.
Never hand back "I committed to a branch"; hand back a link they can click.

**Read `reference/` before you write anything.** That folder holds the owner's own notes on their voice and
tone, their business, their customers and their marketing. It is **not published** — it exists so your edits
sound like *them*. Match its wording, tone, claims and audience. If a file there is still an unfilled
skeleton, skip it.

**If the owner asks you to “process the queue”, “apply the edits I queued” or “is anything
waiting?”** — that is a specific thing with its own steps: see **Working the queue** at the end of this file.

## The rules that matter most

- **Draft by default.** Never commit a change straight to the live branch (`main`) unless the
  owner has explicitly said to publish it. Everything else — including small fixes — becomes a *draft* the
  owner can look at first. A draft is cheap and reversible; going straight to live is neither.
- **A draft is a branch named `draft-<slug>/v1` plus an ordinary open pull request against
  `main`.** Both halves are required. A pushed branch with **no open pull request** gets no
  preview and never appears in the owner's drafts list — it is invisible to them. Never open a *GitHub
  draft-status* PR (never `--draft`): the Publish button cannot merge one.
- **Keep `<slug>` short and distinctive** — it becomes the preview web address, and if it collides with
  another open draft's, yours gets no preview at all (see **The preview address**).
- **Only edit inside `public/` and `src/`.** Nothing outside those folders. One logical change per commit.
- **Never invent an image.** You may crop, replace, restyle or re-lay-out imagery that already exists in the
  repository. You may not generate or fabricate a new photograph. If the change genuinely needs a new image,
  stop and ask the owner to upload one.
- **Stay on the page you were asked about.** If the request is about one page, change that page and the
  components and data it uses. Go site-wide only when the request clearly says so ("on every page…", "the
  footer everywhere…").
- **"Make this page private" is not something you can build.** Restricting who may *view* a page is a
  BlinkPages account setting, not a code change, and it cannot be shipped from this repository. Never
  substitute a password page, a hidden/unlisted URL, a `noindex` tag, or a JavaScript "login" — none of those
  restrict access, and shipping one *looks* like the job was done. Explain what BlinkPages can do and tell the
  owner to ask the BlinkPages team.

## Delivering a draft

Pick the route that matches what you can actually do right now.

### Route A — you can reach the network

Use this only if you can genuinely run network commands (a local terminal with `git` and `gh` signed in).

```bash
git fetch origin
git checkout -b draft-<slug>/v1 origin/main
# ...make the edits...
git add -A && git commit -m "<what changed>"
git push -u origin draft-<slug>/v1
gh pr create --base main --head draft-<slug>/v1 --title "<short, human title>"
```

Then wait for the pull request's checks to finish and read the preview address from its sticky
**"🔍 Open Preview"** comment. If a check fails, fix it before handing anything to the owner.

**If `gh` is missing or not signed in** — common in a local Codex/CLI setup that has `git` but no GitHub
CLI — push the branch anyway, then stop and tell the owner to press **"Create PR"**, exactly as in Route
B. Do **not** hand back a pushed branch as though it were a draft: without an open pull request it gets
no preview and never appears in their drafts list. Working the queue is unaffected — those jobs already
have their branch and pull request, so they only need `git push`.

### Route B — you have no network access

This is the normal case in ChatGPT/Codex cloud, where the working phase runs offline. **Do not try to push
or create a pull request** — those commands will fail. Do this instead, start to finish:

1. Create the branch from where the repository already is — do **not** fetch first:
   `git checkout -b draft-<slug>/v1`
2. Make the edits, then `git add -A` and `git commit -m "<what changed>"`. Stop there.
3. Tell the owner, in plain words, what you changed and that **they need to press "Create PR"** to turn it
   into a draft they can preview. Be explicit that you have *not* created it yet — you cannot.
4. Give them the address the preview *will* have once that pull request is open (see below), and say plainly
   that it only starts working after they press Create PR and the build finishes — usually a minute or two.

Never claim you opened a pull request, and never present the preview address as if it were already live.

## The preview address

**The authoritative link is the one BlinkPages posts on the pull request**, in its sticky
**"🔍 Open Preview"** comment. Use that whenever you can read the pull request.

When you cannot — Route B — you can work the address out offline:

```
https://<alias>--a11y-practice-pluto.blinkpages.dev
```

`<alias>` is the branch name **lowercased**, with every run of characters that aren't a letter or digit
collapsed to a single `-`, and leading and trailing `-` removed. The `/` is not kept — so
`draft-holiday/v1` becomes `draft-holiday-v1`, giving
`https://draft-holiday-v1--a11y-practice-pluto.blinkpages.dev`.

**That arithmetic only holds while the slug is 37 characters or fewer.** Past that, BlinkPages replaces
the tail with a short hash derived from the whole name — you cannot work that out by hand, so do not try
and do not guess: say the address will be on the pull request, and leave it there. It is one more reason
to keep `<slug>` short.

Hand that over as where the preview **will** appear once the build finishes — never as somewhere you have
checked. You cannot see from here whether the build succeeded, and if it failed there is no preview at all.

**Two branch names that reduce to the same alias collide** — `draft-holiday/v1` and `draft-holiday-v1`
both become `draft-holiday-v1`. BlinkPages will not hand your build an address another open draft already
owns: the build **fails with an error naming the branch that holds it**, and there is no preview until one
of them is renamed. Choose a short, distinctive `<slug>` for every new draft, and never reuse one that an
open draft already has.

Previews for this site are private: the first time the owner opens one they are asked to sign in with their site login. Say so when you hand over the address — otherwise the sign-in screen reads as a broken link.

## Handing it back

Finish every draft with a message in the owner's language containing (a) what you changed, (b) the preview
address, and (c) how to publish. Adapt the wording; keep all three parts. For Route B, also say clearly that
they must press Create PR first.

> "I've drafted a new pricing page. Press **Create PR** to turn it into a draft, then preview it at
> `https://draft-pricing-v1--a11y-practice-pluto.blinkpages.dev` — it'll be ready about a minute after that.
> If that address doesn't open, the pull request itself will have the exact link on it.
> When you're happy with it, open your site editor and hit **Publish**."

Never end with "the changes are committed" and nothing else. A change the owner cannot see has not been
delivered.

## Publishing

The owner publishes. Their site editor is at **https://www.discoverpluto.site/_blink/admin** — it lists every open draft, lets them
compare drafts side by side, and has the **Publish** button. Publishing puts the draft live on
https://www.discoverpluto.site and the site redeploys on its own.

Publish on their behalf **only** when they explicitly ask you to, and only if you have network access.

## Offering options

When the owner asks for several versions of something — "three takes on the homepage" — that means **three
options in total**, built as *siblings*:

- `draft-<slug>/v1`, `draft-<slug>/v2`, `draft-<slug>/v3`
- **each one its own pull request against `main`** — never one stacked on top of another
- the shared `draft-<slug>/` prefix is what groups them together in the owner's editor and compare view
- give each a short, human pull-request title — that title labels its column when they compare
- hand back **every** option's preview address, and tell them that publishing one puts it live and discards
  the others

Never put competing options on the live branch.

## If you are asked to work on an existing draft

If the owner names a draft or an option that already exists, check out **that** branch and commit there — do
not start a new one. Its preview refreshes when you push. Only start a new draft when the request is about
the live site.
## Working the queue

The owner can ask for a change from inside their own site — the in-page **"Edit with AI"** card, and the
admin console's **"New <type> with AI"** and import-from-a-link buttons. Those requests go into this site's
own queue and **sit there until an agent works them**. Nothing applies them automatically. When the owner
says *"process my queue"*, *"apply the edits I queued"* or *"is anything waiting?"*, this is what they mean.

The queue client ships with this repository at **`.blinkpages/queue.mjs`**. It needs Node and **network
access**, and it talks only to this site's own address — never to a shared queue, never to another site,
and never to a BlinkPages secret.

### If you cannot reach the network

This is the normal case in ChatGPT/Codex cloud, where the working phase runs offline. **You cannot read the
queue.** Say so plainly and ask the owner to paste the text of the request they queued — then treat it as an
ordinary change and deliver it as a draft (Route B above).

Never report the queue as empty when you were unable to reach it. "There's nothing waiting" and "I couldn't
look" are different answers, and only one of them is true.

### If you can reach the network

**1. Authorize once.** Run:

```bash
node .blinkpages/queue.mjs list
```

The first time, it prints a link. The **owner** opens it, checks the code shown matches, and clicks
**Approve** — there is nothing to copy back. The token is cached, and the command then lists what's pending.
If it reports that this site has no queue endpoints yet, stop and use the paste-the-request route above.

**2. Take one job.** Each row has an id:

```bash
node .blinkpages/queue.mjs claim --job <id> --by "$(git config user.email)"
node .blinkpages/queue.mjs pull-images --job <id> --dest .precision-images
node .blinkpages/queue.mjs set --job <id> --status running
```

`claim` returns the request's `prompt`, the page it came from, and its **`targetBranch`**. Check that branch
out and commit there — it is the owner's own choice, made on the editor's "save as a new draft" checkbox, so
honour it even when it is the live branch. Do not re-route a queued job onto a branch of your own.

**3. Make the change** exactly as described earlier in this file, and push. Stage only the site files you
actually changed - the pulled attachments land in a scratch folder (`.precision-images/`,
`.precision-source/`) that must **not** be committed. An image the change needs belongs in the site's own
media folder, copied there deliberately.

**4. Report the outcome** — the owner is watching a progress card on their site, and it only resolves when
you write back:

```bash
node .blinkpages/queue.mjs set --job <id> --status done --commit "$(git rev-parse HEAD)"
# or, if you could not do it:
node .blinkpages/queue.mjs set --job <id> --status failed --error "what went wrong and what they should do"
```

The `error` text is shown to the owner, so write it for them — what happened, and what would unblock it.
Then take the next job. When the queue is empty, say so and stop; never invent work to fill it.

### Rows tagged `✎ CONTENT`

These are not edits to an existing page — they are a **new entry in one of the site's content collections**
("New Post with AI", or a link to import). Their draft branch and pull request already exist, the entry's
address is already decided, and often a placeholder file is already on the branch. What is missing is the
content. Claim them the same way, then:

1. Check out the job's `targetBranch`. If it is gone, the owner discarded the draft — set `failed` with
   `--error "draft was discarded — nothing to write"` and stop.
2. Read the collection's schema (`src/content.config.ts` or `src/content/config.ts`) **and one or two
   existing entries beside it** — they show the frontmatter that is actually used, the date format, and how
   images are referenced. Copy that shape; never loosen the schema to make something fit.
3. For an import, fetch the source with
   `node .blinkpages/queue.mjs pull-source --job <id> --dest .precision-source`. If it reports a warning,
   the snapshot is not trustworthy — open the original link yourself.
4. Replace the placeholder's **body**, keeping the title and date the console already wrote.
   **Download every image into the site's own media folder** — never leave a `googleusercontent.com`,
   `docs.google.com` or `claude.ai` image URL in the entry; those links expire or break for visitors.
5. Build the site before you report done. A schema error here means the frontmatter is wrong.
<!-- END blinkpages-managed (AGENTS) v1 -->

## Notes about this site

This part of the file is yours — BlinkPages never changes anything below the marker above. Add anything an
AI assistant should know about this site.

For your brand voice, business background and customer notes, prefer the `reference/` folder: every
BlinkPages tool reads it before making an edit, so notes there apply everywhere, not just here.
