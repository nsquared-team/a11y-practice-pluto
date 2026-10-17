#!/usr/bin/env node
// wait-deploy.mjs — confirm a draft's preview is LIVE before its link goes to the owner.
//
// A preview address is predictable the moment a branch is named, but it only works once BlinkPages has
// built and bound that commit — usually about a minute after the pull request opens or the push lands.
// Hand it over earlier and the owner clicks into Cloudflare's bare "There is nothing here yet" page.
// `gh pr checks --watch` cannot tell you when it is ready: the build runs centrally (blinkpages-platform
// tenant-deploy.yml), so this repo has no checks at all and `--watch` answers "no checks reported" at once.
//
// What it waits on, in order:
//   1. The GitHub Deployment the central build writes into THIS repo for the branch's pushed commit
//      (environment "preview"): in_progress → success | failure | error. It is the signal the editor's
//      drafts list waits on (blinkpages-editor src/worker/github.js deploymentStatus), and the only one
//      that proves THIS commit is live rather than an older build of the same draft.
//   2. The address itself, unauthenticated. A live preview answers 302 to the site login; an address with
//      nothing bound yet answers Cloudflare's 404 (x-preview-user-error) or the preview proxy's
//      "still building" 503 (X-Blink-Preview-State: building).
// Then it prints the address from the pull request's sticky "🔍 Open Preview" comment.
//
// Needs `gh`, signed in — the same as opening the pull request. No BlinkPages token, no secrets.
//
// CLI:
//   node .blinkpages/wait-deploy.mjs [<branch>] [--timeout <seconds>] [--json]
//     <branch>    the draft branch (default: the one checked out)
//     --timeout   how long to wait for the build, in seconds (default 600)
//     --json      print { url, branch, sha, pr, deployment, probe } instead of the bare address
//
// Exit codes — each means something different to tell the owner:
//   0  live: stdout is the address to hand over
//   1  the build FAILED, or previews are switched off: there is no preview — do not send a link
//   2  timed out: the draft is saved but its preview is still building — re-run before sending a link
//   3  could not check: no `gh` / not signed in, no open pull request, or this is the live branch

import { execFileSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { readTenantMarker } from "./auth.mjs";

const arg = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : undefined; };
const has = (f) => process.argv.includes(f);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const firstLine = (s) => String(s || "").trim().split("\n")[0];
const short = (sha) => (sha ? String(sha).slice(0, 7) : "?");

export const EXIT = { LIVE: 0, FAILED: 1, TIMEOUT: 2, CANNOT_CHECK: 3 };
const POLL_MS = 5000;
const PROGRESS_MS = 30000;
const PROBE_WINDOW_MS = 60000;
const PROBE_EVERY_MS = 3000;
const PROBE_REQUEST_MS = 10000;
// astro-site-ops scripts/branch-alias.mjs MAX_ALIAS — a longer slug gets a hash only the PR comment knows.
const MAX_ALIAS = 37;

const fail = (exitCode, msg) => Object.assign(new Error(msg), { exitCode });

// The real `gh`: stdout as a string. A missing binary is "could not check"; any other failure is thrown
// with gh's own stderr so the caller can decide (a missing pull request vs a transient API error).
function ghCli(args) {
  try {
    return execFileSync("gh", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    if (e && e.code === "ENOENT") {
      throw fail(EXIT.CANNOT_CHECK, "`gh` (the GitHub CLI) isn't installed here, so the preview can't be checked. " +
        "Don't present the address as working — say it will be ready about a minute after the pull request opens.");
    }
    throw new Error(firstLine((e && e.stderr) || (e && e.message) || e));
  }
}
const ghJson = (gh, args) => JSON.parse(gh(args) || "null");

// Branch → preview alias, for the fallback only (astro-site-ops scripts/branch-alias.mjs is canonical):
// ASCII-lowercase, every non-alphanumeric run → "-", trimmed. An empty slug becomes `pr-<n>`, as the
// deploy does; an over-budget one returns null, because only the PR comment knows its hashed form. Pure.
export function aliasFor(branch, prNumber) {
  const s = String(branch == null ? "" : branch)
    .replace(/[A-Z]/g, (c) => c.toLowerCase())
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  if (!s) return prNumber ? `pr-${prNumber}` : null;
  return s.length <= MAX_ALIAS ? s : null;
}

// The "🔍 Open Preview" address in the sticky comment: the first https URL whose host is
// `<alias>--<tenantId>.<previewBase>`. Matches a markdown link or an HTML anchor alike. Pure.
export function previewUrlFromComment(body, { tenantId, previewBase = "blinkpages.dev" } = {}) {
  const suffix = `.${previewBase}`;
  for (const m of String(body || "").matchAll(/https:\/\/[^\s)"'<>\]]+/g)) {
    let u; try { u = new URL(m[0]); } catch { continue; }
    if (!u.hostname.endsWith(suffix)) continue;
    const label = u.hostname.slice(0, -suffix.length);
    const i = label.indexOf("--");
    if (label.includes(".") || i < 1) continue;
    if (tenantId && label.slice(i + 2) !== tenantId) continue;
    return u.origin;
  }
  return null;
}

const at = (x) => Date.parse((x && x.created_at) || "") || 0;

// The newest deployment of a list. GitHub returns newest first, but don't lean on it: a re-deploy of the
// same commit makes a NEW deployment, and if that one is still building we are pending, not done. Pure.
export function newestDeployment(list) {
  return (Array.isArray(list) ? list : [])
    .filter((d) => d && d.id)
    .sort((a, b) => at(b) - at(a) || b.id - a.id)[0] || null;
}

// A deployment's statuses → { state, description, logUrl }. A terminal success/failure/error outranks a
// later `inactive`: every draft shares the one "preview" environment, so GitHub marks this deploy inactive
// the moment ANOTHER draft's preview succeeds — that says nothing about whether this one worked. Pure.
export function deploymentVerdict(statuses) {
  const sts = (Array.isArray(statuses) ? statuses : []).slice().sort((a, b) => at(b) - at(a) || b.id - a.id);
  const s = sts.find((x) => x.state === "success" || x.state === "failure" || x.state === "error") || sts[0];
  return { state: (s && s.state) || "pending", description: (s && s.description) || null, logUrl: (s && s.log_url) || null };
}

// What an unauthenticated GET of the preview address says. `headers` is a Headers or a plain object. Pure.
//   live      2xx/3xx — a bound preview answers 302 to the site login
//   building  nothing is bound to the address yet (Cloudflare's 404, or the proxy's 503 building page)
//   refused   403 — previews are switched off for this site
//   error     anything else
export function classifyProbe(status, headers) {
  const h = (k) => String((headers && (typeof headers.get === "function" ? headers.get(k) : headers[k])) || "");
  if (status === 404 && h("x-preview-user-error")) return "building";
  if (status === 503 && /building/i.test(h("x-blink-preview-state"))) return "building";
  if (status >= 200 && status < 400) return "live";
  if (status === 403) return "refused";
  return "error";
}

// Wait until `branch`'s preview is built and answering; resolve { url, branch, sha, pr, deployment, probe }.
// Throws an Error carrying `exitCode` (EXIT.*) otherwise. Every side effect is injectable for the tests.
export async function waitForPreview({
  branch, timeoutMs = 600000, localSha = null, marker,
  gh = ghCli, fetchImpl = globalThis.fetch, sleepImpl = sleep, now = Date.now,
  log = (s) => process.stderr.write(s + "\n"),
} = {}) {
  const cfg = marker || readTenantMarker().cfg;
  const gcfg = cfg.github || {};
  const previewBase = cfg.previewBase || "blinkpages.dev";
  let nwo = gcfg.owner && gcfg.repo ? `${gcfg.owner}/${gcfg.repo}` : null;
  if (!nwo) {
    try { nwo = gh(["repo", "view", "--json", "nameWithOwner", "--jq", ".nameWithOwner"]).trim(); }
    catch (e) { throw e.exitCode !== undefined ? e : fail(EXIT.CANNOT_CHECK, `couldn't tell which GitHub repository this is: ${e.message}`); }
  }
  if (!branch) throw fail(EXIT.CANNOT_CHECK, "no branch given and none is checked out — pass the draft branch name");
  if (branch === (gcfg.branch || "main")) {
    throw fail(EXIT.CANNOT_CHECK, `${branch} is the live branch — it has no preview. This checks draft branches only.`);
  }

  // The open pull request is what makes a preview exist at all.
  let pr;
  try {
    pr = ghJson(gh, ["pr", "view", branch, "--repo", nwo, "--json", "number,state,url"]);
  } catch (e) {
    if (e.exitCode !== undefined) throw e;
    throw fail(EXIT.CANNOT_CHECK, `couldn't find a pull request for ${branch} (${e.message}). ` +
      "Without an open pull request there is no preview — open one (gh pr create), or ask the owner to press Create PR.");
  }
  if (!pr || pr.state !== "OPEN") {
    throw fail(EXIT.CANNOT_CHECK, `the pull request for ${branch} is ${pr ? String(pr.state).toLowerCase() : "missing"} — only an open pull request has a preview.`);
  }

  // 1. The Deployment for the branch's pushed head. Re-read the head every poll: a later push supersedes
  //    the commit we started on, and the build that matters is the newest one.
  const ref = branch.split("/").map(encodeURIComponent).join("/");
  const started = now();
  let sha = null, depId = null, verdict = { state: "waiting" }, ghErrors = 0, lastProgress = started, warnedLocal = false;
  for (;;) {
    try {
      const head = gh(["api", `repos/${nwo}/git/ref/heads/${ref}`, "--jq", ".object.sha"]).trim();
      if (head && head !== sha) {
        if (sha) log(`a newer commit (${short(head)}) landed on ${branch} — waiting for that build instead`);
        sha = head;
        depId = null;
      }
      if (localSha && !warnedLocal && localSha !== sha) {
        log(`note: your local ${branch} is at ${short(localSha)} but GitHub has ${short(sha)} — push first if your latest commit should be in the preview`);
        warnedLocal = true;
      }
      const dep = newestDeployment(ghJson(gh, ["api", `repos/${nwo}/deployments?sha=${sha}&environment=preview&per_page=20`]));
      if (dep) {
        depId = dep.id;
        verdict = deploymentVerdict(ghJson(gh, ["api", `repos/${nwo}/deployments/${dep.id}/statuses?per_page=10`]));
      } else {
        verdict = { state: "waiting" };
      }
      ghErrors = 0;
    } catch (e) {
      if (e.exitCode !== undefined) throw e;
      if (++ghErrors >= 5) throw fail(EXIT.CANNOT_CHECK, `couldn't read the preview's build status from GitHub: ${e.message}`);
    }
    if (verdict.state === "success") break;
    if (verdict.state === "failure" || verdict.state === "error") {
      throw fail(EXIT.FAILED, `the preview build for ${short(sha)} failed${verdict.description ? ` (${verdict.description})` : ""} — ` +
        `there is no preview to send. Fix the draft and push again.${verdict.logUrl ? ` Build log: ${verdict.logUrl}` : ""}`);
    }
    const elapsed = Math.round((now() - started) / 1000);
    if (now() - started >= timeoutMs) {
      throw fail(EXIT.TIMEOUT, verdict.state === "waiting"
        ? `no preview build has started for ${short(sha)} after ${elapsed}s — BlinkPages may not have picked the pull request up. ` +
          `Check it at ${pr.url}; don't send the owner a preview address yet.`
        : `the preview build for ${short(sha)} is still running after ${elapsed}s (${verdict.state}) — the draft is saved, ` +
          "but don't send the address yet. Re-run this in a few minutes.");
    }
    if (now() - lastProgress >= PROGRESS_MS) {
      log(verdict.state === "waiting"
        ? `waiting for the preview build of ${short(sha)} to start… (${elapsed}s)`
        : `preview build of ${short(sha)} is ${verdict.state}… (${elapsed}s)`);
      lastProgress = now();
    }
    await sleepImpl(POLL_MS);
  }

  // 2. The address: the sticky comment's link, else the computed alias (short branch names only).
  let url = null;
  try {
    const bodies = gh(["api", "--paginate", `repos/${nwo}/issues/${pr.number}/comments?per_page=100`,
      "--jq", '.[] | select(.body | contains("pr-preview-summary")) | .body']);
    url = previewUrlFromComment(bodies, { tenantId: cfg.tenantId, previewBase });
  } catch { /* fall back to the computed address */ }
  if (!url) {
    const alias = aliasFor(branch, pr.number);
    if (alias && cfg.tenantId) url = `https://${alias}--${cfg.tenantId}.${previewBase}`;
  }
  if (!url) {
    throw fail(EXIT.CANNOT_CHECK, `the preview is built, but its address couldn't be read — send the owner the pull request instead: ${pr.url}`);
  }

  // 3. Prove the address answers. A just-bound alias can lag the Deployment by a few seconds.
  const probeDeadline = now() + PROBE_WINDOW_MS;
  let probe, status = null;
  for (;;) {
    try {
      const signal = typeof AbortSignal !== "undefined" && AbortSignal.timeout ? AbortSignal.timeout(PROBE_REQUEST_MS) : undefined;
      const r = await fetchImpl(url, { method: "GET", redirect: "manual", signal });
      status = r.status;
      probe = classifyProbe(r.status, r.headers);
      try { if (r.body && r.body.cancel) await r.body.cancel(); } catch { /* nothing to release */ }
    } catch {
      probe = "unreachable";
    }
    if (probe === "live") break;
    if (probe === "unreachable") {
      log(`couldn't reach ${url} from here to double-check it — the build itself reported success`);
      break;
    }
    if (probe === "refused") {
      throw fail(EXIT.FAILED, `${url} answered 403 — previews are switched off for this site. Don't send the link; check with the BlinkPages team.`);
    }
    if (now() >= probeDeadline) {
      throw fail(EXIT.TIMEOUT, `the build finished but ${url} isn't answering yet (HTTP ${status}) — wait a minute and re-run before sending it.`);
    }
    await sleepImpl(PROBE_EVERY_MS);
  }
  return { url, branch, sha, pr: pr.number, deployment: depId, probe };
}

function git(args) {
  try { return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
  catch { return null; }
}

async function main() {
  const rest = process.argv.slice(2);
  const branchArg = rest.find((a, i) => !a.startsWith("--") && rest[i - 1] !== "--timeout");
  const checkedOut = git(["rev-parse", "--abbrev-ref", "HEAD"]);
  const branch = branchArg || (checkedOut && checkedOut !== "HEAD" ? checkedOut : null);
  const timeoutMs = Math.max(1, Number(arg("--timeout")) || 600) * 1000;
  const res = await waitForPreview({ branch, timeoutMs, localSha: branch ? git(["rev-parse", "--verify", "--quiet", `refs/heads/${branch}`]) : null });
  if (has("--json")) console.log(JSON.stringify(res, null, 2));
  else console.log(res.url);
}

// Resolve both sides to real filesystem paths so this works even if the bundle is reached through a
// symlink: otherwise import.meta.url (real target) never equals file://<symlink argv[1]>. (The bundle is
// committed, not symlinked, into tenant repos — kept for safety / parity with the operator scripts.)
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    process.stderr.write(String((e && e.message) || e) + "\n");
    // Anything unexpected (no tenant marker, a crash) is "could not check" — never "the build failed".
    process.exit(e && e.exitCode !== undefined ? e.exitCode : EXIT.CANNOT_CHECK);
  });
}
