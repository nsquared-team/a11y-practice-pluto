// design-drift.mjs — where DESIGN.md and tokens.css disagree. The ONE implementation:
// gate-style-library.mjs imports it from here, and the scaffold copies this file beside the site's
// design-system page (src/components/design-system/drift.mjs), whose alert and palette use the same
// mapping. So it stays plain ESM with no imports, and the copy on a site is never edited by hand.
//
// DESIGN.md's front matter restates tokens.css's values, as Google's design.md format requires; this
// is what keeps the two from drifting. Each entry finds its token by the first of these that
// tokens.css has (`tokenOf`), so a site keeps its own names (superbloomtalent's --plum, 2026-11-03):
//   a comment that starts with the token, `= --x` or `--x` (`plum: "#60032f"  # = --plum. Bands`);
//   colors.x: --color-x, --x; a name with none (a design.md role such as `primary`) must equal some
//     color token's value, var() followed (--color-* first, then any token whose value is a color),
//     and is that token's role;
//   rounded.x: --radius-x, --rounded-x, --x-radius, --x;   spacing.x: --x, --space-x, --spacing-x;
//   typography.x, each field when its token exists and resolves to a plain value (a clamp() or
//     calc() is not compared; a var() is followed):
//     fontSize: --text-x, --fs-x, --font-size-x;
//     lineHeight: --leading-x, --text-x--line-height, --text-x-lh, --lh-x, --line-height-x;
//     letterSpacing: --tracking-x, --text-x--letter-spacing, --letter-spacing-x;
//     fontWeight: --weight-x, --text-x--font-weight, --font-weight-x —
//     compared as lengths, so 1.5 against 24px at a 16px size is equal, and so is 0.125em against 2px;
//   with no weight token for the level, a fontWeight must be 400 or 700 (CSS's own `normal` and
//   `bold`, which need no token) or one of the site's --weight-* / --font-weight-* values (when it has
//   any), and a fontFamily's first family must head some --font-* family stack (when it has any): a
//   font swapped in tokens.css alone shows here.
// Every value is compared with its var() references followed, so `--color-primary: var(--color-accent)`
// is the accent's color. A color also matches a token that paints the same opaque color in another
// notation: an rgb()/hsl() at full opacity, with any var() inside it followed, or a bare `h,s%,l%`
// triplet, the form a Squarespace palette token takes (helloseo.com's --white-hsl: 28.57,100%,95.88%,
// painted as hsla(var(--white-hsl),1)), so `cream: "#fff4ea"  # = --white-hsl` agrees.
// `undocumented`: --color-* tokens no DESIGN.md color names or aliases (reported, never a failure).
// `colors`: how many colors the front matter declares. Pure.

const stripComments = (css) => String(css ?? "").replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * DESIGN.md's YAML front matter, for the subset its template uses: nested maps by indentation and
 * `key: value  # note` scalars (no lists, anchors or multi-line strings) → Map tree of
 * {value, comment} leaves. Pure.
 */
export function parseDesignMd(src) {
  const root = new Map();
  const stack = [{ indent: -1, node: root }];
  for (const line of (/^---\r?\n([\s\S]*?)\r?\n---/.exec(String(src ?? ""))?.[1] ?? "").split(/\r?\n/)) {
    const m = /^([\w.-]+):\s*(.*)$/.exec(line.trim());
    if (!m || line.trim().startsWith("#")) continue;
    const indent = line.length - line.trimStart().length;
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1].node;
    const [, key, rest] = m;
    if (!rest || rest.startsWith("#")) {
      const child = new Map();
      parent.set(key, child);
      stack.push({ indent, node: child });
      continue;
    }
    const q = /^"((?:[^"\\]|\\.)*)"\s*(?:#\s*(.*))?$/.exec(rest) ?? /^'([^']*)'\s*(?:#\s*(.*))?$/.exec(rest);
    const hash = rest.search(/\s#/);
    parent.set(key, q ? { value: q[1], comment: q[2]?.trim() } : hash === -1 ? { value: rest.trim() } : { value: rest.slice(0, hash).trim(), comment: rest.slice(hash).replace(/^\s#\s*/, "").trim() });
  }
  return root;
}

/** Every custom property with its first (base) value. Pure. */
export function tokenValues(css) {
  const out = new Map();
  for (const m of stripComments(css).matchAll(/(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+);/g)) if (!out.has(m[1])) out.set(m[1], m[2].trim());
  return out;
}

const normValue = (v) => String(v ?? "").toLowerCase().replace(/\s+/g, "").replace(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/, "#$1$1$2$2$3$3");
const leaves = (root, key) => [...(root.get(key) instanceof Map ? root.get(key) : new Map())].filter(([, v]) => !(v instanceof Map));

/** A value with its var() references followed (a var()'s fallback when the token is missing). Pure. */
export function resolve(live, v, depth = 0) {
  const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*(.*))?\)$/.exec(String(v ?? "").trim());
  if (!m || depth > 8) return String(v ?? "").trim();
  return live.has(m[1]) ? resolve(live, live.get(m[1]), depth + 1) : String(m[2] ?? "").trim();
}

const COLOR = /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|color|color-mix)\(.*\))$/i;
const HSL_TRIPLET = /^-?[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%$/;

/** A value with every var() inside it followed, not only a value that is one (`hsla(var(--x-hsl),1)`). Pure. */
export function expand(live, v, depth = 0) {
  const s = String(v ?? "").trim();
  if (depth > 8 || !s.includes("var(")) return s;
  const out = s.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_, k, fb) => (live.has(k) ? expand(live, live.get(k), depth + 1) : String(fb ?? "").trim()));
  return out === s ? s : expand(live, out, depth + 1);
}

/** An opaque color as #rrggbb: a hex, an rgb()/rgba() or hsl()/hsla() at alpha 1, or a bare HSL triplet; else null. Pure. */
export function hexOf(v) {
  let s = String(v ?? "").trim().toLowerCase();
  if (HSL_TRIPLET.test(s)) s = `hsl(${s})`;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) return normValue(s);
  const m = /^(rgba?|hsla?)\(\s*([^()]*)\)$/.exec(s);
  if (!m) return null;
  const parts = m[2].split(/\s*[,/]\s*|\s+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return null;
  if (parts[3] !== undefined && !(parts[3].endsWith("%") ? parseFloat(parts[3]) === 100 : parseFloat(parts[3]) === 1)) return null;
  let rgb;
  if (m[1].startsWith("rgb")) rgb = parts.slice(0, 3).map((x) => (x.endsWith("%") ? parseFloat(x) * 2.55 : parseFloat(x)));
  else {
    const h = (((parseFloat(parts[0]) % 360) + 360) % 360) / 360, sat = parseFloat(parts[1]) / 100, l = parseFloat(parts[2]) / 100;
    const q = l < 0.5 ? l * (1 + sat) : l + sat - l * sat, p = 2 * l - q;
    const ch = (t) => { t = ((t % 1) + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    rgb = [ch(h + 1 / 3), ch(h), ch(h - 1 / 3)].map((x) => x * 255);
  }
  if (rgb.some((x) => !Number.isFinite(x))) return null;
  return `#${rgb.map((x) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, "0")).join("")}`;
}

/* a DESIGN.md color and a token's resolved value are one color: equal as written, or the same opaque #rrggbb */
const sameColor = (live, want, css) => normValue(css) === normValue(want) || (hexOf(want) != null && hexOf(want) === hexOf(expand(live, css)));
/** The token a DESIGN.md comment names first (`= --x. note` or `--x note`), if tokens.css has it. Pure. */
const commentToken = (live, comment) => {
  const m = /^=?\s*(--[\w-]+)/.exec(String(comment ?? "").trim());
  return m && live.has(m[1]) ? m[1] : undefined;
};
const NAMES = {
  colors: (n) => [`--color-${n}`, `--${n}`],
  rounded: (n) => [`--radius-${n}`, `--rounded-${n}`, `--${n}-radius`, `--${n}`],
  spacing: (n) => [`--${n}`, `--space-${n}`, `--spacing-${n}`],
  /* the site-first forms (--x-font-size, --type-x-size, --fw-x, --ls-x…) are what the fleet's ports
     write: go. law sites, soundharborinsurance.com, nsquared.io, theloop.fm (2026-11-15) */
  fontSize: (n) => [`--text-${n}`, `--fs-${n}`, `--font-size-${n}`, `--fs-${n}-desktop`, `--type-${n}-size`, `--${n}-font-size`, `--${n}-size`],
  lineHeight: (n) => [`--leading-${n}`, `--text-${n}--line-height`, `--text-${n}-lh`, `--lh-${n}`, `--line-height-${n}`, `--type-${n}-leading`, `--${n}-line-height`, `--${n}-leading`],
  letterSpacing: (n) => [`--tracking-${n}`, `--text-${n}--letter-spacing`, `--letter-spacing-${n}`, `--ls-${n}`, `--type-${n}-tracking`, `--${n}-letter-spacing`, `--${n}-tracking`],
  fontWeight: (n) => [`--weight-${n}`, `--text-${n}--font-weight`, `--font-weight-${n}`, `--fw-${n}`, `--type-${n}-weight`, `--${n}-font-weight`, `--${n}-weight`],
};
/** The names an entry of `section` may take in tokens.css, in the order tried (the message's list). Pure. */
export const tokenNames = (section, n) => (NAMES[section] ?? (() => []))(n);

/**
 * The token a DESIGN.md entry maps to (see the header), or undefined: `live` is tokenValues(), `section`
 * one of colors / rounded / spacing / fontSize / lineHeight / letterSpacing / fontWeight. A color with
 * no token of its own name aliases the token with its value. Pure.
 */
export function tokenOf(live, section, n, { value, comment } = {}) {
  const named = commentToken(live, comment) ?? tokenNames(section, n).find((k) => live.has(k));
  if (named || section !== "colors" || value == null) return named;
  const want = resolve(live, value);
  const same = ([, v]) => { const r = resolve(live, v); return (COLOR.test(r) || HSL_TRIPLET.test(r)) && sameColor(live, want, r); };
  return ([...live].find(([k, v]) => k.startsWith("--color-") && same([k, v])) ?? [...live].find(same))?.[0];
}

/* a plain length or number in px; em and (for a line height) a bare number scale by the size; CSS's
   weight keywords are their numbers */
function px(v, sizePx, bareIsEm) {
  const s = String(v ?? "").trim().toLowerCase();
  if (s === "normal" && !bareIsEm) return 400;
  if (s === "bold") return 700;
  const m = /^(-?[\d.]+)(px|rem|em|%)?$/.exec(s);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (m[2] === "px") return n;
  /* a line height's percentage scales the size, as em does (160%: lyrablake.com and others); a font
     size's percentage is of its parent, which DESIGN.md can't say, so it is not compared */
  if (m[2] === "%") return !bareIsEm || sizePx == null ? null : (n / 100) * sizePx;
  if (m[2] === "rem") return n * 16;
  if (m[2] === "em" || (!m[2] && bareIsEm)) return sizePx == null ? null : n * sizePx;
  return n; // a bare number: a weight, or a line height with no size to scale it
}

/* the first family of a stack, unquoted and lowercased (a stack that starts with a var() is followed) */
const firstFamily = (live, stack) => resolve(live, String(stack ?? "").split(",")[0]).split(",")[0].replace(/["']/g, "").trim().toLowerCase();

export function designDrift(designSrc, tokensCss) {
  const design = parseDesignMd(designSrc);
  const live = tokenValues(tokensCss);
  const drift = [];
  const covered = new Set();
  const colors = leaves(design, "colors");
  for (const [n, entry] of colors) {
    const prop = tokenOf(live, "colors", n, entry);
    if (!prop) { drift.push(`colors.${n} (${entry.value}) has no ${tokenNames("colors", n).join(" or ")} and matches no color token's value`); continue; }
    covered.add(prop);
    const css = resolve(live, live.get(prop));
    if (!sameColor(live, resolve(live, entry.value), css)) drift.push(`colors.${n} is ${entry.value}, ${prop} is ${css}`);
  }
  for (const section of ["rounded", "spacing"]) {
    for (const [n, entry] of leaves(design, section)) {
      const prop = tokenOf(live, section, n, entry);
      if (!prop) { drift.push(`${section}.${n} has no ${tokenNames(section, n).join(" or ")} in tokens.css`); continue; }
      const css = resolve(live, live.get(prop));
      /* 0 and 0px are one length (the design.md linter rejects a unitless 0: paravelle.com) */
      const same = normValue(css) === normValue(entry.value) || (px(css) != null && px(css) === px(entry.value) && /\d/.test(String(entry.value)));
      if (!same) drift.push(`${section}.${n} is ${entry.value}, ${prop} is ${css}`);
    }
  }
  /* the site's weights and family stacks, for a level with no token of its own */
  const weights = [...new Set([...live].filter(([k]) => /^--(font-)?weight-/.test(k)).map(([, v]) => px(resolve(live, v))).filter((w) => w != null))];
  /* a family stack is a --font-* token whose value is not a number or a length: advisorevolved.com's
     --font-scale-responsive: 0.15vw was the only "stack", and a fleet site's
     --font-primary-line-height: 120% was one too. *-font-family tokens are NOT read: on a Squarespace
     port they are the theme's stacks, not what renders (electriccollab.com's Vogue failed against them) */
  const families = [...live].filter(([k, v]) => k.startsWith("--font-") && !/^--font-(size|weight|feature|variation|style|scale)/.test(k) && !/^-?[\d.]+[a-z%]*$/i.test(resolve(live, v).trim())).map(([k, v]) => [k, firstFamily(live, v)]);
  const type = design.get("typography") instanceof Map ? design.get("typography") : new Map();
  for (const [n, level] of type) {
    if (!(level instanceof Map)) continue;
    const field = (k) => level.get(k)?.value;
    const sizeProp = tokenOf(live, "fontSize", n, { comment: level.get("fontSize")?.comment });
    const sizePx = px(field("fontSize"), null, false) ?? px(sizeProp && resolve(live, live.get(sizeProp)), null, false);
    for (const k of ["fontSize", "lineHeight", "letterSpacing", "fontWeight"]) {
      const want = field(k);
      /* a field's own comment may name its token (`lineHeight: 1.2  # = --lh-heading`), as colors do */
      const prop = tokenOf(live, k, n, { comment: level.get(k)?.comment });
      if (!want || !prop) continue;
      const css = resolve(live, live.get(prop));
      const a = px(want, sizePx, k === "lineHeight"), b = px(css, sizePx, k === "lineHeight");
      if (a != null && b != null && Math.abs(a - b) > 0.05) drift.push(`typography.${n}.${k} is ${want}, ${prop} is ${css}`);
    }
    const w = field("fontWeight");
    if (w && px(w) != null && !tokenOf(live, "fontWeight", n, { comment: level.get("fontWeight")?.comment }) && weights.length && ![400, 700, ...weights].includes(px(w))) drift.push(`typography.${n}.fontWeight ${w} is not 400, 700 or one of the site's weights (--weight-*: ${weights.join(", ")})`);
    const fam = field("fontFamily");
    if (fam && families.length) {
      const f = String(fam).split(",")[0].replace(/["']/g, "").trim();
      if (!families.some(([, h]) => h === f.toLowerCase())) drift.push(`typography.${n}.fontFamily ${f} heads no --font-* stack (${families.map(([k, h]) => `${k}: ${h}`).join(", ")})`);
    }
  }
  const undocumented = [...live.keys()].filter((k) => k.startsWith("--color-") && !covered.has(k));
  return { colors: colors.length, drift, undocumented };
}
