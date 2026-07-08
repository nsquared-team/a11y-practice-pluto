# Seeded Accessibility Issues — Manifest

This site is an **intentionally inaccessible** educational demo. Each page below
contains deliberately seeded WCAG violations so an automated accessibility
scanner can be tested for a **consistent, repeatable** result count.

The issues were chosen to be **scanner-agnostic** — they are well-known
violations that axe-core, Lighthouse, WAVE, Pa11y / HTML_CodeSniffer, and
similar tools all detect. Rule IDs below use **axe-core** naming because it is
the most widely shared vocabulary; other scanners report the same problems under
their own labels.

> The shared layout, footer, and (layout) skip link are **intentionally clean**.
> The **navigation is deliberately seeded** — see "Site-wide navigation seeds"
> below — so its two issues repeat on every page. Everything else lives inside
> page content (or, for the home page, in its deliberately broken document shell).

**Seeded issues: 43 page-content issues + 2 site-wide navigation issues**,
spanning **22 distinct rule types**. There are **14 pages**: 12 content pages plus
two clean form-result pages (`/subscribe`, `/search`) that carry only the shared
nav seeds. Because the nav is a shared component, its two seeds appear on all 14
pages (3 nodes each per page).

---

## ✅ Verified baseline (axe-core 4.12.1, default ruleset incl. best-practice)

Every page was scanned with axe-core. These are the **definite violation** counts
(seeds were tuned to produce hard violations, not "incomplete / needs review"
items). Each page total **includes the 2 shared navigation seeds** (`+2` rules /
`+6` nodes per page). Use these as the regression baseline:

| Page | rule-violations | nodes |
|---|---:|---:|
| `/` | 10 | 15 |
| `/about` | 6 | 11 |
| `/discovery` | 5 | 9 |
| `/planet-status` | 5 | 13 |
| `/demotion` | 5 | 9 |
| `/orbit` | 5 | 9 |
| `/facts` | 5 | 9 |
| `/moons` | 5 | 9 |
| `/geology` | 5 | 9 |
| `/exploration` | 5 | 9 |
| `/new-horizons` | 4 | 14 |
| `/contact` | 7 | 11 |
| `/subscribe` | 2 | 6 |
| `/search` | 2 | 6 |
| **Site total** | **71** | **139** |

Notes on the totals:
- **`/subscribe` and `/search`** are clean form-result pages (the newsletter and
  search forms submit to them via GET). They contain **no seeded content issues** —
  their 2 rules / 6 nodes are entirely the shared nav seeds.
- **Nav contribution:** `aria-required-children` (3 menus) + `aria-valid-attr-value`
  (3 toggles) = +2 rules / +6 nodes on **every** page.
- **`/new-horizons` shows 4 rules, not 5:** its own `aria-valid-attr-value` seed
  (the `aria-expanded="open"` button) **merges** with the 3 nav toggles into a
  single rule with **4 nodes** — a good example of why node counts and rule counts
  diverge.
- **`/` (home):** the single "no `<main>`" problem is reported as **two** rules
  (`landmark-one-main` + `region`).
- **Incomplete (needs-review) items**, reported separately from violations and not
  counted above: `/` has 1 (`color-contrast` over the gradient hero — inherent to
  the hero design) and `/exploration` has 1 (`frame-tested` — axe can't see into
  the cross-origin video iframe). These are stable and expected.

---

## ⚠️ Read this before comparing scan counts

Automated scanners do **not** all count the same way. Expect the headline number
to differ between tools — what should stay *consistent is the same tool's count
run against this site over time*. Specifically:

1. **Node count vs. rule count.** axe-core reports one *violation* per rule and
   lists every matching element as a "node" underneath it. WAVE counts each
   element. So 8 `color-contrast` rule-violations may be reported as 8 (rule
   count) or as ~15+ (node count, because some pages style several elements).
2. **Best-practice rules.** `heading-order`, `region`, `landmark-one-main`, and
   `tabindex` are **best-practice** rules in axe, not strict WCAG failures. Tools
   run in "WCAG-only" mode will skip these (~10 findings). Tools with
   best-practice enabled will include them. The per-issue table marks these.
3. **The missing-`<main>` home page.** With no landmark wrapping the content, the
   `region` rule flags **each** top-level content block as "not contained in a
   landmark." In axe-core 4.12 this home page reports `region` as **3 nodes** plus
   `landmark-one-main` once — so the home page's node count exceeds its rule count.
4. **Deprecated rules.** `marquee` and `duplicate-id-aria` exist in current
   axe-core but some forks/older versions handle them differently.
5. **`color-contrast` needs rendering.** Tools that don't compute CSS (pure
   static HTML linters) will miss all 8 contrast failures. All 8 sit on **solid**
   backgrounds (white, or the `#f4f2fc` callout) — never on a gradient or image —
   so scanners return a definite violation rather than an "incomplete / needs
   review" result.

To get a stable baseline, fix the scanner, its version, and its ruleset, then
record what *this* site returns.

---

## Per-page issue table

Legend: **BP** = axe best-practice rule (may be skipped in WCAG-only mode).

### `/` — Home (`src/pages/index.astro`)
This page deliberately bypasses the clean layout to seed document-level issues.

| # | Rule (axe ID) | WCAG | Where |
|---|---|---|---|
| 1 | `html-has-lang` | 3.1.1 | `<html>` has no `lang` attribute |
| 2 | `document-title` | 2.4.2 | Page has no `<title>` element |
| 3 | `landmark-one-main` *(BP)* / `region` *(BP)* | 1.3.1 | No `<main>`; content sits in bare `<div>`s |
| 4 | `heading-order` *(BP)* | 1.3.1 | Heading jumps `<h1>` → `<h3>` (no `h2`) |
| 5 | `image-alt` | 1.1.1 | Hero image `pluto-true-color.jpg` has no `alt` |
| 6 | `color-contrast` | 1.4.3 | `.muted-fail` lead paragraph (#b9b9b9 on solid white) |
| 7 | `link-name` | 2.4.4 / 4.1.2 | "Featured topic" link wraps an `alt=""` image only |

### `/about` — About Pluto (`src/pages/about.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 8 | `image-alt` | 1.1.1 | `pluto-true-color.jpg` figure has no `alt` |
| 9 | `empty-table-header` | 1.3.1 | "Pluto at a glance" table has an empty `<th></th>` |
| 10 | `heading-order` *(BP)* | 1.3.1 | Heading jumps `<h2>` → `<h4>` |
| 11 | `color-contrast` | 1.4.3 | `.callout-fail` fast-fact box |

### `/discovery` — Discovery (`src/pages/discovery.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 12 | `image-alt` | 1.1.1 | `pluto-discovery-plates.png` has no `alt` |
| 13 | `aria-allowed-attr` | 4.1.2 | Link carries `aria-pressed`, which is not allowed on a link |
| 14 | `link-name` | 2.4.4 / 4.1.2 | Empty "share" link (styled box, no text) |

### `/planet-status` — Planet Years (`src/pages/planet-status.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 15 | `list` | 1.3.1 | `<ul class="timeline">` contains `<div>` children, not `<li>` |
| 16 | `color-contrast` | 1.4.3 | `.year-fail` year labels |
| 17 | `heading-order` *(BP)* | 1.3.1 | Heading jumps `<h1>` → `<h3>` |

### `/demotion` — Demotion (`src/pages/demotion.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 18 | `tabindex` *(BP)* | 2.4.3 | Callout box has `tabindex="5"` (positive) |
| 19 | `image-alt` | 1.1.1 | `charon-true-color.jpg` has no `alt` |
| 20 | `color-contrast` | 1.4.3 | `.muted-fail` blockquote |

### `/orbit` — Orbit (`src/pages/orbit.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 21 | `svg-img-alt` | 1.1.1 | `<svg role="img">` orbit diagram has no title/`aria-label` |
| 22 | `heading-order` *(BP)* | 1.3.1 | Heading jumps `<h1>` → `<h3>` |
| 23 | `image-alt` | 1.1.1 | `pluto-blue-haze.jpg` figure has no `alt` |

### `/facts` — Facts (`src/pages/facts.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 24 | `color-contrast` | 1.4.3 | `.muted-fail` intro paragraph |
| 25 | `marquee` | 2.2.2 | Deprecated `<marquee>` scrolling element |
| 26 | `definition-list` | 1.3.1 | `<dl>` contains a stray `<p>` child |

### `/moons` — Moons (`src/pages/moons.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 27 | `image-alt` | 1.1.1 | `pluto-charon-system.gif` has no `alt` |
| 28 | `color-contrast` | 1.4.3 | `.muted-fail` figure caption |
| 29 | `empty-table-header` | 1.3.1 | Moons table has an empty `<th></th>` |

### `/geology` — Geology (`src/pages/geology.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 30 | `image-alt` | 1.1.1 | `pluto-sputnik-planitia.jpg` has no `alt` |
| 31 | `heading-order` *(BP)* | 1.3.1 | Heading jumps `<h2>` → `<h4>` |
| 32 | `color-contrast` | 1.4.3 | `.callout-fail` haze aside |

### `/exploration` — Exploration (`src/pages/exploration.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 33 | `frame-title` | 4.1.2 | Embedded `<iframe>` has no `title` |
| 34 | `image-alt` | 1.1.1 | `pluto-true-color.jpg` figure has no `alt` |
| 35 | `link-name` | 2.4.4 / 4.1.2 | Thumbnail link wraps an `alt=""` image only |

### `/new-horizons` — New Horizons (`src/pages/new-horizons.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 36 | `image-alt` | 1.1.1 | `new-horizons-spacecraft.png` has no `alt` |
| 37 | `color-contrast` | 1.4.3 | `.muted-fail` statistic figures (several spans) |
| 38 | `aria-valid-attr-value` | 4.1.2 | Button has invalid `aria-expanded="open"` |

### `/contact` — Stay Updated (`src/pages/contact.astro`)
| # | Rule | WCAG | Where |
|---|---|---|---|
| 39 | `input-image-alt` | 1.1.1 | Search `<input type="image">` has no `alt` |
| 40 | `label` | 1.3.1 / 4.1.2 | "name" text input has no label, placeholder, or ARIA name |
| 41 | `autocomplete-valid` | 1.3.5 | Email input has `autocomplete="yes-please"` |
| 42 | `select-name` | 4.1.2 | Interest `<select>` has no label/accessible name |
| 43 | `button-name` | 4.1.2 | Submit `<button>` has no text content |

---

## Site-wide navigation seeds (every page)

The grouped dropdown navigation (`src/components/Nav.astro`) is rendered on all 12
pages, so these two seeds appear on every page. The top nav has five items —
**Home**, **About ▾**, **History ▾**, **Exploration ▾**, **Stay Updated** — with
three dropdown menus.

| # | Rule | WCAG | Where | Nodes/page |
|---|---|---|---|---:|
| N1 | `aria-valid-attr-value` | 4.1.2 | Each dropdown toggle has `aria-expanded="closed"` — invalid (must be `true`/`false`) | 3 |
| N2 | `aria-required-children` | 1.3.1 | Each dropdown panel uses `role="menu"` but its children are plain links, not `role="menuitem"` | 3 |

Implementation notes (to keep these scannable and avoid *unintended* findings):
- Menu `<li>`s carry `role="none"` so they don't trip the `listitem` rule.
- Closed menus are clipped (not `display:none`), so they stay in the accessibility
  tree and the `role="menu"` seed remains detectable.
- The caret is a CSS border-triangle (no text node), so it doesn't add
  `color-contrast` "needs review" noise.
- **Deliberately *not* seeded here** (automated scanners can't reliably detect
  them): "div instead of `<button>`", missing-`aria-expanded`, and no-keyboard
  support. They're classic dropdown problems but need manual / AT testing.

---

## Summary by rule type

| Rule (axe ID) | Count | Best-practice? |
|---|---|---|
| `image-alt` | 9 | no |
| `color-contrast` | 8 | no |
| `heading-order` | 5 | **yes** |
| `link-name` | 3 | no |
| `empty-table-header` | 2 | no |
| `html-has-lang` | 1 | no |
| `document-title` | 1 | no |
| `landmark-one-main` / `region` | 1 | **yes** |
| `aria-allowed-attr` | 1 | no |
| `list` | 1 | no |
| `tabindex` | 1 | **yes** |
| `svg-img-alt` | 1 | no |
| `marquee` | 1 | no |
| `definition-list` | 1 | no |
| `frame-title` | 1 | no |
| `aria-valid-attr-value` | 2 † | no |
| `aria-required-children` | 1 † | no |
| `input-image-alt` | 1 | no |
| `label` | 1 | no |
| `select-name` | 1 | no |
| `button-name` | 1 | no |
| `autocomplete-valid` | 1 | no |
| **Total** | **45** | 7 are best-practice |

The "Count" column counts **authored** seeds (one per intentional issue). †The two
navigation seeds are authored once but render on **all 12 pages** (3 nodes each),
and `aria-valid-attr-value` also has one page-level seed on `/new-horizons` — so
its authored count is 2. The **Verified baseline** table above has the real
per-page scan numbers (**67** rule-violations / **127** nodes site-wide).

**WCAG-only expectation:** disabling best-practice rules drops `heading-order`
(5 instances), `tabindex` (1), and `landmark-one-main` + `region` (2) — about
**8 rule-violations / 9 nodes** — leaving roughly **63** rule-violations
site-wide. The nav seeds are strict-WCAG (4.1.2, 1.3.1) and remain.

---

## How to scan

```bash
npm install
npm run build && npm run preview   # serves the production build (default :4321)
# or: npm run dev
```

Then point your scanner at each route (`/`, `/about`, `/discovery`,
`/planet-status`, `/demotion`, `/orbit`, `/facts`, `/moons`, `/geology`,
`/exploration`, `/new-horizons`, `/contact`, plus the two form-result pages
`/subscribe` and `/search`).

> **Maintenance note:** if you add, remove, or change a seeded issue, update this
> manifest so the expected count stays trustworthy.
