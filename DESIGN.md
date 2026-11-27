---
version: alpha
name: Discover Pluto
description: A small, plain-spoken guide to the dwarf planet Pluto, set in the reader's own system font in one white reading column between a night-sky header and footer, with NASA photographs and a single violet accent. It doubles as a fixed practice target for accessibility scanners, so some of its flaws are deliberate.

# Names map onto src/styles/tokens.css under the site's own names: colors.x is --x (space-black is
# --space-black). A role name with no token of its own (primary, secondary) must equal one color
# token's value, named first in its comment: it is that token's role. The site has no type, spacing
# or radius tokens yet (those values are written out in global.css), so typography is not checked
# against tokens.css and there is no rounded or spacing section; the prose gives those values.
# /design-system and gate-style-library.mjs fail when this file and tokens.css disagree.
colors:
  primary: "#6b4fd6"        # = --accent. The brand's one accent
  secondary: "#0b0c1a"      # = --space-black. The night-sky header and footer
  space-black: "#0b0c1a"    # the header and footer bands, and the deep end of the home page's hero
  space-deep: "#14162b"     # the hero's lighter end, and a dropdown link on hover or focus
  space-panel: "#1d2040"    # the dropdown panels, and the fill behind a header link on hover or focus
  ink: "#1a1a1a"            # body text and headings on white
  paper: "#ffffff"          # the page, and the text on the dark bands
  accent: "#6b4fd6"         # the rule down a callout's left edge, and the newsletter's sign-up button
  accent-ink: "#2f1f73"     # the skip link's ground, and the years in a timeline
  link: "#1a4fd6"           # text links in the copy, underlined

typography:
  h1:  # page titles, and the home page's hero title in white
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 1.6
  h2:  # section headings
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 1.6
  h3:  # subheads within a section
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: 18.72px
    fontWeight: 700
    lineHeight: 1.6
  body:  # body copy, lists, tables and the header's menu
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  wordmark:  # the site's name in the header
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: 22.4px
    fontWeight: 700
    lineHeight: 1.6
  tagline:  # the welcome line under the hero's title
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: 17.6px
    fontWeight: 400
    lineHeight: 1.6
  caption:  # figure captions and the footer's credits
    fontFamily: "Segoe UI, system-ui, -apple-system, sans-serif"
    fontSize: 14.4px
    fontWeight: 400
    lineHeight: 1.6

# The color pairs the site's own pages draw. The light tints, the gray caption and the lavender lines
# on the dark bands are written out in global.css with no token of their own, so their pairs name the
# value. The three fixture grays (a light gray, a lighter gray and a pale lavender, each under 2:1 on
# purpose) are left out: they are test fixtures, not part of the palette.
components:
  body-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.link}"
  header:
    backgroundColor: "{colors.space-black}"
    textColor: "{colors.paper}"
  header-link-hover:
    backgroundColor: "{colors.space-panel}"
    textColor: "{colors.paper}"
  dropdown-link-hover:
    backgroundColor: "{colors.space-deep}"
    textColor: "{colors.paper}"
  hero-title:
    backgroundColor: "{colors.space-deep}"
    textColor: "{colors.paper}"
  hero-tagline:
    backgroundColor: "{colors.space-deep}"
    textColor: "#d4d8f0"
  footer:
    backgroundColor: "{colors.space-black}"
    textColor: "#cfd2e6"
  footer-link:
    backgroundColor: "{colors.space-black}"
    textColor: "{colors.paper}"
  skip-link:
    backgroundColor: "{colors.accent-ink}"
    textColor: "{colors.paper}"
  timeline-year:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.accent-ink}"
  callout:
    backgroundColor: "#f4f2fc"
    textColor: "{colors.ink}"
  caption:
    backgroundColor: "{colors.paper}"
    textColor: "#555555"
  table-header:
    backgroundColor: "#eef0f8"
    textColor: "{colors.ink}"
  message-success-title:
    backgroundColor: "#eaf7ee"
    textColor: "#14502c"
  message-info:
    backgroundColor: "#eef2fb"
    textColor: "{colors.ink}"
---

# Discover Pluto

## Overview

Discover Pluto is a small, friendly guide to the dwarf planet at the edge of the Solar System: what
Pluto is, how it was found, why it stopped being a planet, its strange orbit, its moons and its
surface, and the New Horizons flyby that finally showed it up close. It is written for curious
readers of any age, in short plain paragraphs that read like a good museum placard, with British
spelling.

A page reads as a night sky over white paper. A near-black header carries the site's name and its
menu. Below it, one centered white column holds a title, short sections under bold headings, NASA
photographs with captions, and the occasional table, timeline or callout. A footer band that matches
the header closes every page. The home page alone opens on a full-width hero: a deep blue-black
gradient with the title, a one-line welcome and a portrait of Pluto.

The site has a second job. It is a fixed practice target for automated accessibility scanners, so
its pages carry a known set of deliberate accessibility failures: images without descriptions,
skipped heading levels, text too faint to read, invalid menu markup, a scrolling marquee, an untitled
video frame and a few more. They are test fixtures, not design. Each is listed in the site's issues
list, and none changes unless that list changes with it. Changing the look is the owner's call.

## Logo

The site has no logo and no icon of its own. Its name, Discover Pluto, set in bold white on the
night-sky header, is its only mark, and the browser tab shows the browser's default icon.

## Colors

The palette is a night sky and white paper, with one violet accent.

- **Space black #0b0c1a** is the brand's ground: the header and footer bands, and the deep end of
  the home page's hero.
- **Space deep #14162b** is the hero's lighter end, where its gradient starts, and a dropdown link
  on hover or focus.
- **Space panel #1d2040** is the dropdown panels, and the soft fill behind a header link on hover
  or focus.
- **Paper #ffffff** is the page, and the color of everything written on the dark bands.
- **Ink #1a1a1a** sets body text and headings on white.
- **Link blue #1a4fd6** colors every text link in the copy, always underlined.
- **Violet #6b4fd6** is the one accent, and the brand's primary color. It is used sparingly: the
  rule down the left of a callout, and the newsletter's sign-up button. It is never a band or body
  text.
- **Deep violet #2f1f73** is the skip link's ground and the years in a timeline.
- **Light tints and grays** sit outside the palette: a pale violet #f4f2fc behind callouts, a pale
  blue-gray #eef0f8 for table headers, a gray #555555 for captions, a soft lavender #cfd2e6 for the
  footer's credits and #d4d8f0 for the hero's welcome line, and the pale green and pale blue of the
  sign-up confirmation and the search page's notice.
- **Three fixture colors** exist only to fail: a light gray #b9b9b9 for faint paragraphs, captions,
  quotes and figures, a lighter gray #c2c2c2 for the years on the planet-years timeline, and a pale
  lavender #b3aede for the text of two callouts. Each falls under 2:1 against its ground, far below
  the WCAG AA guideline, on purpose. They are not part of the palette.

Every pair the palette itself draws meets WCAG AA.

## Typography

- The site loads no web font. Everything is set in the reader's own interface face: Segoe UI on
  Windows, and the system font elsewhere, such as San Francisco on Apple devices.
- Body copy is regular at the browser's own size, with a generous line height that every level
  shares.
- Headings are bold and keep the browser's own scale: a page title is twice the body size, a section
  heading one and a half times, a subhead a little larger than the body.
- The site's name in the header is bold, between a subhead and a section heading in size. Captions
  and the footer's credits are a step smaller than the body, and the hero's welcome line a step
  larger.
- A heading's level follows the page's outline, never its look. The pages that jump a level do so on
  purpose, as fixtures.

## Layout

- One centered reading column, at most 820 pixels wide with 24 pixels of padding on each side, holds
  every page's content. It never splits into columns.
- The header and footer run the full width of the window, with 24 pixels of side padding. On a phone
  the header's menu wraps onto a second line rather than folding behind a menu button.
- Photographs sit at their own size up to the column's width, and scale down with it.
- There are no breakpoints: the layout is fluid at every width.

## Elevation & Depth

The site is flat. The one shadow is under an open dropdown panel, a soft black shadow that lifts it
over the page. Otherwise depth comes from the dark bands against the white page, and from the hero's
gradient.

## Shapes

- Corners are small and soft: 4 pixels on header links and menu buttons, 6 pixels on photographs,
  dropdown panels and callouts, and 8 pixels on the sign-up confirmation and the search page's notice.
- A strong left edge marks anything set apart from the text: the violet rule down a callout, whose
  left corners stay square, and the darker colored edge of a confirmation or notice box.
- The sign-up confirmation's badge is a green disc with a white check mark.

## Components

- **The header** carries the site's name and the menu: Home, three groups that open dropdown panels
  on hover or keyboard focus (About, History and Exploration), and Stay Updated. Its menu buttons and
  panels carry two of the deliberate markup errors, so copy its look, never its markup.
- **The footer** is the header's dark band at the foot of every page: one centered line of credits in
  soft lavender, with white links.
- **The skip link** waits off-screen until a keyboard user tabs to it, then appears at the top left,
  white on deep violet.
- **The hero** opens the home page only: the gradient band with a white title, a lavender welcome
  line and a photograph.
- **Callouts** set a fact or an aside apart, on pale violet with the violet rule.
- **Message boxes** confirm a newsletter sign-up (pale green, with the badge and a dark green title)
  or explain the search page (pale blue).
- **The timeline** lists dated events, each year in bold deep violet, with a hairline between them.
- **Figures** are a photograph with softly rounded corners and a small gray caption.
- **Tables** run the column's full width, with gray hairline borders and a pale blue-gray header row.
- The site has no shared button or form style. Its few buttons and fields are the browser's own, or
  styled in place on their page.

## Do's and Don'ts

- Do keep every page to the one white reading column between the dark header and footer.
- Do use the violet as an accent only: a rule or a single button, never a band or body text.
- Do set links in link blue and underlined, other text in ink on white, and white on the night-sky
  bands.
- Don't use the three fixture colors, or copy any of the deliberate failures, in new content.
- Don't repair a deliberate failure on an existing page: each is a test fixture, and the issues
  list has to change with it.
- Don't add a web font or a second accent color without the owner: the brand is the reader's own
  system face and one violet.
