#!/usr/bin/env node
// queue.mjs — worker-mediated queue client for the tenant queue-drain flow. Mirrors the operator
// job.mjs / list-queue.mjs CLI, but every call goes to THIS site's own worker (the /_blink prefix) over
// a bearer token from auth.mjs — never to a shared queue or any BlinkPages secret. Lists/claims/updates
// only this tenant's PRECISION jobs.
//
// Worker contract (origin = this site, Authorization: Bearer <token> from auth.mjs):
//   GET  {origin}/_blink/api/ai/queue [?all=1]                  → { tenantId, jobs:[ {jobId,status,stage,…} ] }
//   POST {origin}/_blink/api/ai/job/<id>/claim                  → { jobId,status,claimedBy,claimToken,… } | 409
//   POST {origin}/_blink/api/ai/job/<id>/status { status, … }   → { jobId,status,stage,commitSha } | 409
//   GET  {origin}/_blink/api/ai/job/<id>/attachment/<attId>     → raw attachment bytes (an uploaded image, or a
//                                                                 content job's import snapshot — same route)
//   403 → token bad/expired (re-auth). 404 on /ai/queue → worker has no queue endpoints (fall back).
//
// CLI (origin via detectOrigin or --origin; token via getToken):
//   node queue.mjs list [--all] [--json]
//   node queue.mjs claim --job <id> [--by <email>]
//   node queue.mjs set --job <id> --status <s> [--stage s] [--commit sha] [--error msg] [--claim-token t]
//   node queue.mjs pull-images --job <id> --dest <dir>
//   node queue.mjs pull-source --job <id> [--dest <dir>]        # content job: download its import snapshot

import { mkdirSync, writeFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getToken, detectOrigin } from "./auth.mjs";

const arg = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : undefined; };
const has = (f) => process.argv.includes(f);

const PREFIX = "/_blink/api/ai";
const queueUnavailable = (msg) => Object.assign(new Error(msg || "queue-unavailable"), { code: "QUEUE_UNAVAILABLE" });
const unauthorized = (msg) => Object.assign(new Error(msg || "token bad or expired — re-authorize"), { code: "UNAUTHORIZED" });

// One transport helper for the whole worker API: set bearer + content-type, parse JSON, raise on non-2xx
// with the server's error text. 403 → UNAUTHORIZED (re-auth); 404 on the queue → QUEUE_UNAVAILABLE.
async function api(origin, token, method, path, body) {
  const init = { method, headers: { Authorization: `Bearer ${token}` } };
  if (body !== undefined) { init.headers["Content-Type"] = "application/json"; init.body = JSON.stringify(body); }
  const r = await fetch(`${origin}${PREFIX}${path}`, init);
  if (r.status === 403) throw unauthorized();
  if (r.status === 404 && path === "/queue") throw queueUnavailable();
  const text = await r.text();
  let json; try { json = text ? JSON.parse(text) : {}; } catch { json = { error: text }; }
  if (!r.ok) throw new Error(`${method} ${path} failed: HTTP ${r.status} — ${(json && json.error) || text || "(no body)"}`);
  return json;
}

// GET this tenant's precision queue. Pending+claimed by default; ?all=1 includes terminal jobs.
export async function listQueue(origin, token, { all = false } = {}) {
  return api(origin, token, "GET", `/queue${all ? "?all=1" : ""}`);
}

export async function claimJob(origin, token, jobId, by) {
  return api(origin, token, "POST", `/job/${encodeURIComponent(jobId)}/claim`, by ? { by } : {});
}

export async function setStatus(origin, token, jobId, { status, stage, commitSha, error, claimToken } = {}) {
  const body = { status };
  if (stage !== undefined) body.stage = stage;
  if (commitSha !== undefined) body.commitSha = commitSha;
  if (error !== undefined) body.error = error;
  if (claimToken !== undefined) body.claimToken = claimToken;
  return api(origin, token, "POST", `/job/${encodeURIComponent(jobId)}/status`, body);
}

// Find one job in this site's queue (terminal jobs included) — for the pull-* commands when the caller
// didn't pass the record from list/claim.
async function findJob(origin, token, jobId) {
  const q = await listQueue(origin, token, { all: true });
  const job = (q.jobs || []).find((j) => j.jobId === jobId);
  if (!job) throw new Error(`job ${jobId} not found in this site's queue`);
  return job;
}

// One GET of a job attachment through the worker — uploaded images and a content job's import snapshot
// share the route. 403 → UNAUTHORIZED (re-auth); any other non-2xx comes back as { ok:false, status } so
// the caller decides whether to skip it (pull-images) or stop (pull-source).
async function fetchAttachment(origin, token, jobId, attId) {
  const r = await fetch(`${origin}${PREFIX}/job/${encodeURIComponent(jobId)}/attachment/${encodeURIComponent(attId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 403) throw unauthorized();
  if (!r.ok) return { ok: false, status: r.status };
  return { ok: true, status: r.status, bytes: Buffer.from(await r.arrayBuffer()), contentType: r.headers.get("content-type") || null };
}

// Pull every image attachment referenced by a job into <dest>. We only have attIds (no original names),
// so each file is named for its attId. Pass the job's images[] in (from list/claim) to avoid a re-fetch.
export async function pullImages(origin, token, jobId, dest, images) {
  let ids = images;
  if (!Array.isArray(ids)) {
    const job = await findJob(origin, token, jobId);
    ids = Array.isArray(job.images) ? job.images : [];
  }
  if (!ids.length) return [];
  mkdirSync(dest, { recursive: true });
  const written = [];
  for (const attId of ids) {
    const got = await fetchAttachment(origin, token, jobId, attId);
    if (!got.ok) { written.push({ attId, error: `HTTP ${got.status}` }); continue; }
    const safe = String(attId).replace(/[^A-Za-z0-9._-]/g, "_") || "attachment";
    const out = join(dest, safe);
    writeFileSync(out, got.bytes);
    written.push({ attId, path: out, bytes: got.bytes.length, contentType: got.contentType });
  }
  return written;
}

// File name for a content job's import snapshot: <jobId>.html when the snapshot is HTML (a Google Doc
// export, a web page, a Claude artifact), .txt for anything else (a text/plain or markdown fetch). Pure.
export function sourceFileName(jobId, contentType) {
  const safe = String(jobId || "").replace(/[^A-Za-z0-9._-]/g, "_") || "source";
  return `${safe}${/html/i.test(String(contentType || "")) ? ".html" : ".txt"}`;
}

// What each importSource.warning means for the person draining the job (printed after pull-source; the
// full procedure is SKILL.md → "Content jobs").
export const SOURCE_WARNING_HINT = {
  "not-public": "the link isn't shared publicly (a Google Doc needs \"Anyone with the link\") — the snapshot is probably a sign-in page; ask the requester to share it, or fetch it yourself",
  "shell-only": "the page is an app shell with no content in its HTML (a Claude artifact) — open the URL in a browser-capable tool and read the rendered page",
  "not-html": "the link didn't return HTML — open the URL yourself and convert whatever it actually is",
  "too-large": "the snapshot was cut at 2 MB — fetch the link yourself to get the whole document",
  "timeout": "the fetch timed out — the snapshot may be partial or empty; fetch the link yourself",
};

// Download a content job's import snapshot (importSource.attachmentId, served by the same attachment
// route as images) to <dest>/<jobId>.html (or .txt by content type). Pass the job in (from list/claim)
// to skip a re-fetch. Returns the path plus the importSource facts you need next (url, kind, warning).
export async function pullSource(origin, token, jobId, dest, job) {
  const rec = job || await findJob(origin, token, jobId);
  const src = rec.importSource;
  if (!src || !src.attachmentId) {
    throw new Error(`job ${jobId} has no import snapshot` + (rec.kind === "content" ? " (a brief-only content job — nothing to pull)" : ""));
  }
  const got = await fetchAttachment(origin, token, jobId, src.attachmentId);
  if (!got.ok) {
    throw new Error(got.status === 404
      ? `snapshot for job ${jobId} is gone (expired?) — fetch the link yourself: ${src.finalUrl || src.url}`
      : `snapshot download failed: HTTP ${got.status}`);
  }
  mkdirSync(dest, { recursive: true });
  const contentType = got.contentType || src.contentType || null;
  const out = join(dest, sourceFileName(jobId, contentType));
  writeFileSync(out, got.bytes);
  return {
    jobId, attachmentId: src.attachmentId, path: out, bytes: got.bytes.length, contentType,
    kind: src.kind || null, url: src.url || null, finalUrl: src.finalUrl || null, title: src.title || null,
    warning: src.warning || null,
  };
}

// --- pretty-print (mirrors list-queue.mjs's grouped format) -------------------------------------------
const hostOf = (u) => { try { return new URL(u).host; } catch { return ""; } };

// Content jobs (kind:"content" — queued by the admin console's "New <type>" / "New with AI" / import flows)
// are tagged CONTENT, plus `import <host>` when a link was snapshotted and its warning when that snapshot is
// suspect. They run the content procedure (SKILL.md → "Content jobs"), not the page-edit one. Pure.
export function contentTag(rec) {
  if (!rec || rec.kind !== "content") return "";
  const src = rec.importSource;
  if (!src) return " ✎ CONTENT";
  const host = hostOf(src.finalUrl || src.url);
  return ` ✎ CONTENT import${host ? ` ${host}` : ""}${src.warning ? ` ⚠ ${src.warning}` : ""}`;
}

// A content job's detail line: the file to write and the address it will have. `[no stub]` means the
// editor could not write a stub (its schema can't be satisfied by template) — you create the file. Pure.
export function contentDetail(rec) {
  const e = rec && rec.entry;
  if (!e) return "(entry details not in this listing — claim the job to see them)";
  const label = e.type || e.collection || "entry";
  return `${label} → ${e.path || "?"}${e.url ? `  (${e.url})` : ""}${e.stub === false ? "  [no stub — create the file]" : ""}`;
}

export function fmt(rec) {
  const age = rec.createdAt ? Math.round((Date.now() - rec.createdAt) / 60000) + "m" : "?";
  const first = String(rec.prompt || "").split("\n")[0].slice(0, 70);
  const esc = rec.escalatedFrom ? " (escalated from a Smart edit)" : rec.source === "image-editor" ? " (image edit)" : "";
  const kindTag = rec.kind === "merge-conflict" ? " ⟂ MERGE-CONFLICT" : contentTag(rec);
  const claim = rec.status === "claimed" && rec.claimedBy ? ` [claimed by ${rec.claimedBy}]` : "";
  const tenant = rec.tenantId ? `[${rec.tenantId}] ` : "";
  const head = `  • ${tenant}${rec.jobId}  ${rec.status}/${rec.stage}${kindTag}  ·  ${age} old${claim}${esc}`;
  if (rec.kind === "merge-conflict") return `${head}\n      (merge-conflict — see SKILL.md)`;
  if (rec.kind === "content") return `${head}\n      ${contentDetail(rec)}${first ? `\n      ${first}` : ""}`;
  return `${head}\n      ${first}`;
}

function printQueue(q) {
  const jobs = q.jobs || [];
  if (!jobs.length) { console.log("No pending edits for this site. 🎉"); return; }
  const pending = jobs.filter((j) => j.status === "pending");
  const claimed = jobs.filter((j) => j.status === "claimed");
  const other = jobs.filter((j) => j.status !== "pending" && j.status !== "claimed");
  console.log(`Edit queue for ${q.tenantId || "this site"} — ${jobs.length} job(s):\n`);
  if (pending.length) { console.log("PENDING:"); pending.forEach((j) => console.log(fmt(j))); console.log(""); }
  if (claimed.length) { console.log("CLAIMED (in progress):"); claimed.forEach((j) => console.log(fmt(j))); console.log(""); }
  if (other.length) { console.log("OTHER:"); other.forEach((j) => console.log(fmt(j))); }
}

async function main() {
  const cmd = process.argv[2];
  const origin = arg("--origin") || detectOrigin();
  const token = await getToken(origin, { interactive: true });

  if (cmd === "list") {
    const q = await listQueue(origin, token, { all: has("--all") });
    if (has("--json")) console.log(JSON.stringify(q, null, 2));
    else printQueue(q);
  } else if (cmd === "claim") {
    const rec = await claimJob(origin, token, arg("--job"), arg("--by"));
    console.log(JSON.stringify(rec, null, 2));
  } else if (cmd === "set") {
    const rec = await setStatus(origin, token, arg("--job"), {
      status: arg("--status"), stage: arg("--stage"), commitSha: arg("--commit"),
      error: arg("--error"), claimToken: arg("--claim-token"),
    });
    console.log(JSON.stringify({ jobId: rec.jobId, status: rec.status, stage: rec.stage, commitSha: rec.commitSha || null }, null, 2));
  } else if (cmd === "pull-images") {
    console.log(JSON.stringify(await pullImages(origin, token, arg("--job"), arg("--dest") || ".", undefined), null, 2));
  } else if (cmd === "pull-source") {
    const res = await pullSource(origin, token, arg("--job"), arg("--dest") || ".", undefined);
    console.log(JSON.stringify(res, null, 2));
    if (res.warning) process.stderr.write(`⚠ importSource.warning = ${res.warning}: ${SOURCE_WARNING_HINT[res.warning] || "see SKILL.md → Content jobs"}\n`);
  } else {
    process.stderr.write("usage: queue.mjs <list|claim|set|pull-images|pull-source> [--all] [--json] [--job <id>] [--by <email>] [--status <s>] [--stage <s>] [--commit <sha>] [--error <msg>] [--claim-token <t>] [--dest <dir>] [--origin <https://host>]\n");
    process.exit(1);
  }
}

// Resolve both sides to real filesystem paths so this works even if the bundle is reached through a
// symlink: otherwise import.meta.url (real target) never equals file://<symlink argv[1]>. (The bundle is
// committed, not symlinked, into tenant repos — kept for safety / parity with the operator scripts.)
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    if (e && e.code === "QUEUE_UNAVAILABLE") {
      process.stderr.write("This site's worker doesn't have the queue endpoints yet — falling back to interactive mode (paste the prompt).\n");
      process.exit(0); // graceful Phase-1 fallback, not an error
    }
    process.stderr.write(String((e && e.message) || e) + "\n");
    process.exit(1);
  });
}
