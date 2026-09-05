---
name: blinkpages-site-edit
description: Renamed — to work your queued changes use /blinkpages-process-queue; to change the site, just say what you want, no command needed. Kept temporarily so older instructions keep working. Triggers — "/blinkpages-site-edit".
argument-hint: "[anything] — forwards to /blinkpages-process-queue"
---

<!--
  ════════════════════════════════════════════════════════════════════════════════════════════════
  CENTRALLY MANAGED — DO NOT EDIT THIS SKILL.
  It is a temporary forwarding stub and will be REMOVED by a future platform update.
  Source of truth: nsquared-team/blinkpages-platform → managed-skills/blinkpages-site-edit-alias/
  ════════════════════════════════════════════════════════════════════════════════════════════════
-->

# /blinkpages-site-edit → renamed

This command was split in two, because most of what it did never needed a command at all.

**If the owner described a change** ("add a Black Friday banner"), just make it. Follow
[`.claude/blinkpages.md`](../../blinkpages.md) and [`.claude/blinkpages-editing.md`](../../blinkpages-editing.md)
— draft by default, end with the preview link. Do not send them to a slash command.

**If they want the changes they queued** from the in-page "Edit with AI" card or the admin console — or gave no
argument at all, which is what the old editor toast tells people to do — read
[`../blinkpages-process-queue/SKILL.md`](../blinkpages-process-queue/SKILL.md) and follow it exactly. That is
the queue drain, and it is now `/blinkpages-process-queue`.

Either way, mention the change once, in one short sentence — the command for queued work is now
`/blinkpages-process-queue`, and a direct change needs no command — then get on with what they asked for. Do
not stop, and do not ask them to re-run anything.
