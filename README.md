# Discover Pluto — Accessibility Scanner Practice Site

A small [Astro](https://astro.build) site (12 content pages, plus `/subscribe`
and `/search` form-result pages) about the dwarf planet **Pluto**, built for one
specific purpose: to be a **stable test target for an automated accessibility
scanner**.

The site has two intentional goals:

1. **Real content** — accurate information about Pluto's general characteristics,
   its discovery, its years as the ninth planet and 2006 demotion, its unusual
   orbit, interesting facts, its moons and geology, and its exploration
   (telescopes and the 2015 New Horizons flyby).
2. **Seeded accessibility issues** — a known, documented set of WCAG violations
   so a scanner can be validated against a consistent expected result.

> 👉 **Every seeded issue is catalogued in [ISSUES.md](./ISSUES.md)** — 45 seeded
> issues across 22 rule types, with the page, element, and WCAG criterion for each,
> a verified axe-core baseline, and notes on why counts vary between scanners.

## Pages

`/` Home · `/about` · `/discovery` · `/planet-status` · `/demotion` · `/orbit` ·
`/facts` · `/moons` · `/geology` · `/exploration` · `/new-horizons` · `/contact`

Plus two form-result pages: `/subscribe` (newsletter confirmation) and `/search`
(search results placeholder), reached by submitting the forms on `/contact`.

## Getting started

```bash
npm install
npm run dev        # dev server, http://localhost:4321
npm run build      # production build to ./dist
npm run preview    # serve the production build
```

## Images

All images are NASA / public-domain works retrieved from Wikimedia Commons and
stored under [`public/images/`](./public/images). They are referenced with plain
`<img>` tags (not Astro's `<Image>` component) so that missing/empty `alt`
attributes can be seeded as intended.

## ⚠️ Do not "fix" this site

The accessibility problems here are **deliberate**. If you run a linter or
auto-fixer, you will erase the test fixtures. See [ISSUES.md](./ISSUES.md) before
changing any markup, and update that manifest if you intentionally alter a
seeded issue.
