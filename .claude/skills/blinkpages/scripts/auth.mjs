#!/usr/bin/env node
// auth.mjs — device-authorization login client + token cache for the tenant queue-drain flow.
//
// A tenant authorizes ONCE (single click, no copy/paste) against THEIR OWN site's worker, then drains
// their own AI-edit queue. The device flow runs entirely on the tenant's site origin (the
// /_blink injectRoutePrefix): start → print a one-click verifyUrl → poll → cache the bearer token.
// No BlinkPages secret is ever involved; the token only authorizes this tenant against this one worker.
//
// Worker contract (origin = this site):
//   POST {origin}/_blink/auth/start  → { deviceCode, userCode, verifyUrl, interval, expiresIn }  (503 if unconfigured)
//   POST {origin}/_blink/auth/poll   { deviceCode } → { status:"pending", interval }
//                                                    | { status:"approved", token, email, expiresAt }
//                                                    | { status:"expired" }
//
// CLI:
//   node auth.mjs login            # force the device flow, print status
//   node auth.mjs token            # print a valid token (cached or via the flow)
//   node auth.mjs <…> --origin <o> # override detectOrigin (skip the tenant-marker lookup)

import { existsSync, mkdirSync, readFileSync, writeFileSync, realpathSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const arg = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : undefined; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Math.floor(Date.now() / 1000);

// Tagged error so callers (queue.mjs / the skill) can detect "this worker has no queue yet" and fall back.
const queueUnavailable = (msg) => Object.assign(new Error(msg || "queue-unavailable"), { code: "QUEUE_UNAVAILABLE" });

// Find the single tenant marker in cwd and resolve THIS site's origin from it. Glob
// .migrate-to-astro/tenant.*.json. Refuse to guess if there's zero or more than one marker.
//
// ORIGIN = THE SITE'S PUBLIC HOME: productionDomain (custom domain) → productionSubdomain
// (<tenant>.blinkpages.site, ADR-031) → auth.productionHost → <tenantId>.blinkpages.ai. That order is
// deliberate. The device flow runs on the site origin, and the approve link is built from it
// (cli-auth.js uses `url.origin`), so it MUST land on the host the login actually returns to: the
// broker only ever 302s back to the tenant's REGISTRY productionHost and silently DROPS a mismatched
// ?return= — which takes the ?code= with it.
//
// Why not trust auth.productionHost first: this marker is a SCAFFOLD-TIME SNAPSHOT of the central
// config and it DRIFTS. Live example (2026-07-16) — convergence's marker still said
// auth.productionHost=convergence.blinkpages.ai months after its editor moved to www.convergence-us.org,
// so the approve link pointed at the .ai host, the broker dropped the return, and the CLI handshake
// silently never completed (the user just got a bare editor on the production domain). Its
// productionDomain, however, was correct — the canonical is the reliable field, so prefer it.
// (For a tenant with no canonical yet, auth.productionHost is still right. And a stale .ai value now
// self-heals anyway: the editor bounces a legacy <tenant>.blinkpages.ai home to the canonical carrying
// the query — but do not rely on that; resolve the right origin here.)
export function detectOrigin() {
  const dir = join(process.cwd(), ".migrate-to-astro");
  let files = [];
  if (existsSync(dir)) files = readdirSync(dir).filter((f) => /^tenant\..+\.json$/.test(f));
  if (files.length === 0) {
    throw new Error("no tenant marker (.migrate-to-astro/tenant.*.json) here — cd into your tenant repo and re-run");
  }
  if (files.length > 1) {
    throw new Error(`found ${files.length} tenant markers — cd into a single tenant repo and re-run (${files.join(", ")})`);
  }
  const cfg = JSON.parse(readFileSync(join(dir, files[0]), "utf8"));
  const host =
    cfg.productionDomain ||
    cfg.productionSubdomain ||
    (cfg.auth && cfg.auth.productionHost) ||
    (cfg.tenantId ? `${cfg.tenantId}.blinkpages.ai` : "");
  if (!host) throw new Error(`tenant marker ${files[0]} has no productionDomain/productionSubdomain/auth.productionHost or tenantId`);
  return `https://${host}`;
}

const hostFromOrigin = (origin) => { try { return new URL(origin).host; } catch { return String(origin).replace(/^https?:\/\//, ""); } };

export function cachePath(origin) {
  return join(homedir(), ".config", "blinkpages", `${hostFromOrigin(origin)}.json`);
}

// Return the cached token only if it's good for at least another 2 minutes; else null.
export function cachedToken(origin) {
  const p = cachePath(origin);
  if (!existsSync(p)) return null;
  let rec; try { rec = JSON.parse(readFileSync(p, "utf8")); } catch { return null; }
  if (!rec || !rec.token || !rec.expiresAt) return null;
  if (rec.expiresAt - now() <= 120) return null;
  return rec;
}

function writeCache(origin, rec) {
  const p = cachePath(origin);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, JSON.stringify(rec, null, 2), { mode: 0o600 });
  return p;
}

async function postJson(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  return r;
}

// Run the device-authorization flow against {origin}/_blink/auth and return { token, email, expiresAt }.
// Throws a QUEUE_UNAVAILABLE-tagged error if the worker has no device-auth endpoints (404/503).
async function deviceFlow(origin) {
  const base = `${origin}/_blink/auth`;
  const startRes = await postJson(`${base}/start`, {});
  if (startRes.status === 404 || startRes.status === 503) throw queueUnavailable();
  if (!startRes.ok) throw new Error(`auth start failed: HTTP ${startRes.status}`);
  const start = await startRes.json().catch(() => ({}));
  const { deviceCode, userCode, verifyUrl } = start;
  const interval = Math.max(1, Number(start.interval) || 3);
  const expiresIn = Math.max(interval, Number(start.expiresIn) || 600);
  if (!deviceCode || !verifyUrl) throw new Error("auth start returned an incomplete response");

  // One clickable line — make it obvious this is a single, no-copy/paste action.
  process.stderr.write(
    `\n  → Authorize once (one click): ${verifyUrl}\n` +
    `    Open it, confirm this code on the page: ${userCode}, then click Approve. Nothing to copy.\n\n`
  );

  const deadline = Date.now() + expiresIn * 1000;
  let wait = interval;
  while (Date.now() < deadline) {
    await sleep(wait * 1000);
    const pollRes = await postJson(`${base}/poll`, { deviceCode });
    if (pollRes.status === 404 || pollRes.status === 503) throw queueUnavailable();
    if (!pollRes.ok) throw new Error(`auth poll failed: HTTP ${pollRes.status}`);
    const poll = await pollRes.json().catch(() => ({}));
    if (poll.status === "approved") {
      if (!poll.token) throw new Error("auth approved but no token returned");
      return { token: poll.token, email: poll.email || null, expiresAt: Number(poll.expiresAt) || (now() + 3600) };
    }
    if (poll.status === "expired") throw new Error("authorization expired before approval — re-run to try again");
    // pending — the worker may bump the interval (e.g. slow_down)
    if (poll.interval) wait = Math.max(1, Number(poll.interval));
  }
  throw new Error("authorization timed out before approval — re-run to try again");
}

// Get a valid bearer token for {origin}: cached if still good, else run the device flow and cache it.
export async function getToken(origin, { interactive = true } = {}) {
  const cached = cachedToken(origin);
  if (cached) return cached.token;
  if (!interactive) throw new Error("not authorized and interactive=false — run `auth.mjs login` first");
  const rec = await deviceFlow(origin);
  writeCache(origin, rec);
  return rec.token;
}

async function main() {
  const cmd = process.argv[2];
  const origin = arg("--origin") || detectOrigin();
  if (cmd === "login") {
    const rec = await deviceFlow(origin);
    const p = writeCache(origin, rec);
    const exp = new Date(rec.expiresAt * 1000).toISOString();
    process.stderr.write(`Authorized ${rec.email || "(this site)"} — token cached at ${p} (expires ${exp}).\n`);
  } else if (cmd === "token") {
    process.stdout.write(await getToken(origin, { interactive: true }) + "\n");
  } else {
    process.stderr.write("usage: auth.mjs <login|token> [--origin <https://host>]\n");
    process.exit(1);
  }
}

// Resolve both sides to real filesystem paths so this works even if the bundle is reached through a
// symlink: otherwise import.meta.url (real target) never equals file://<symlink argv[1]>. (The bundle is
// committed, not symlinked, into tenant repos — kept for safety / parity with the operator scripts.)
if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    if (e && e.code === "QUEUE_UNAVAILABLE") {
      process.stderr.write("This site's worker doesn't have the auth/queue endpoints yet.\n");
      process.exit(0);
    }
    process.stderr.write(String((e && e.message) || e) + "\n");
    process.exit(1);
  });
}
