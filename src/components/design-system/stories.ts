// stories.ts — the stories of the design system's component explorer (/design-system/#explorer).
// CURATED by the style-library agent (oneshot/briefs/style-library.md §4); explorer.ts, beside it,
// is generated and reads this file. gate-style-library.mjs counts a component listed here as shown.
//
// One entry per component, shown one story at a time, framed at a device width:
//   { group: "Atoms",                  // the explorer's sidebar group, in the order a page composes them
//     component: "Button.astro",       // its path under src/components/
//     description: "…",                // what it is and when to use it, for a designer
//     args: { label: "Learn more" },   // every story's starting props: sample copy, never a page's real copy
//     slot: "Sample copy",             // its children, if it takes any (HTML)
//     layout: "centered",              // "centered" (an atom), "padded", or "fullscreen" (a band: shown at a device size)
//     stories: [{ name: "Primary" }, { name: "On dark", args: { tone: "dark" }, background: "#0b1f2a", note: "…" }] }
// A component's enum and boolean props become controls by themselves, read from its `interface Props`
// or `type Props = …` (a comment on a member is its description in the props table). A named union
// counts, declared in the component or in a .ts file it imports from by a relative path.
//
// A class-based atom has no component: give its markup with {{arg}} placeholders, and the controls:
//   { group: "Atoms", title: "Button",
//     html: '<a class="btn {{variant}} {{hover}}" href="#">{{label}}</a>',
//     controls: { variant: { type: "select", options: { Filled: "", Outline: "btn-outline" } },
//                 hover: { type: "boolean", on: "is-hover" }, label: { type: "text" } },
//     args: { variant: "", label: "Learn more" },
//     stories: [{ name: "Filled" }, { name: "Outline", args: { variant: "btn-outline" } }] }
//
// A component that only looks right inside a parent (a card in a grid column, a block that reads a
// parent's custom properties) gets a wrapper, outermost first, on the entry or on one story:
//     wrap: [{ class: "grid grid-3" }, { class: "col", style: "--card-accent: #c00" }]
// The story page puts that markup around the component; it is not part of the component.
// What every story page needs goes in StoryDefs.astro beside this file (optional): the layout's SVG
// filters and <defs> in its markup, and in its frontmatter any stylesheet the stories need that the
// layout doesn't load (`import "../../styles/contact.css";`). Story pages already carry the layout's
// stylesheets and every component's CSS.
export type Layout = "centered" | "padded" | "fullscreen";
export type Control =
  | { type: "text" }
  | { type: "select"; options: Record<string, string> }
  | { type: "boolean"; on: string; off?: string };
export type Wrap = { class?: string; style?: string; tag?: string };
export type Story = { name: string; args?: Record<string, unknown>; slot?: string; background?: string; layout?: Layout; note?: string; wrap?: Wrap | Wrap[] };
export type StoryEntry = {
  group: string;
  title?: string;
  description?: string;
  component?: string;
  html?: string;
  controls?: Record<string, Control>;
  args?: Record<string, unknown>;
  slot?: string;
  layout?: Layout;
  wrap?: Wrap | Wrap[];
  stories?: Story[];
};

/* Discover Pluto's stories. The site has one shared component (the header, Nav.astro); everything else
   on its pages is markup plus global.css classes, so most entries are HTML stories with sample copy.
   A block that sits in the reading column is wrapped in a <main>, which is the column on a real page
   (global.css styles the element, not a class). The deliberately failing fixture classes
   (.muted-fail, .callout-fail, .year-fail) are left out of every story: they are test fixtures, not
   variants, and the appendix's Global classes lists them. */
const column: Wrap = { tag: "main" };

export const slStories: StoryEntry[] = [
  /* ---- Atoms ---- */
  { group: "Atoms", title: "Text link",
    description: "A link inside the copy: link blue and underlined, the site's one shared link style.",
    html: '<p>Sample copy with <a href="#">{{label}}</a> inside it.</p>',
    controls: { label: { type: "text" } },
    args: { label: "a text link" },
    layout: "padded",
    stories: [{ name: "In the copy" }] },
  { group: "Atoms", title: "Skip link",
    description: "The first thing a keyboard user reaches: it waits off-screen until it is focused, then shows at the top left of the page.",
    html: '<a class="skip-link" href="#" style="left:0">{{label}}</a>',
    controls: { label: { type: "text" } },
    args: { label: "Skip to main content" },
    layout: "padded",
    wrap: { style: "position:relative;min-height:2.75rem" },
    stories: [{ name: "Focused", note: "Shown as it looks on keyboard focus: on a page it sits off-screen until then." }] },

  /* ---- Site chrome ---- */
  { group: "Site chrome", component: "Nav.astro",
    description: "The header on every page: the site's name, then Home, three groups that open a dropdown panel on hover or keyboard focus, and Stay Updated. Its menu buttons and panels carry two of the site's deliberate markup errors, shown here as they are.",
    layout: "fullscreen",
    stories: [{ name: "Header", note: "Hover or tab to About, History or Exploration to open its panel." }] },
  { group: "Site chrome", title: "Footer",
    description: "The dark band at the foot of every page: one centered line of credits with white links.",
    html: '<footer class="site-footer"><p>{{text}} <a href="#">Sample link</a> / <a href="#">Another link</a> (sample note).</p></footer>',
    controls: { text: { type: "text" } },
    args: { text: "Sample credit line for the foot of every page." },
    layout: "fullscreen",
    stories: [{ name: "Credits" }] },

  /* ---- Page intro ---- */
  { group: "Page intro", title: "Hero",
    description: "The home page's opening band: a deep night-sky gradient with a white title, a one-line welcome and a photograph.",
    html: '<div class="page-hero"><h1>{{title}}</h1><p class="hero-tagline">{{tagline}}</p><img src="/images/pluto-true-color-360w.webp" width="360" height="360" class="content-img" alt="Pluto in natural color: a pale cream globe with a bright heart-shaped plain and a dark reddish region." /></div>',
    controls: { title: { type: "text" }, tagline: { type: "text" } },
    args: { title: "Page Title", tagline: "A one-line welcome in sample copy." },
    layout: "fullscreen",
    stories: [{ name: "With a photograph" }] },

  /* ---- Content: blocks in the reading column ---- */
  { group: "Content", title: "Callout",
    description: "A fact or an aside set apart from the text, on pale violet with the violet rule down its left edge.",
    html: '<aside class="callout"><strong>{{label}}</strong> {{text}}</aside>',
    controls: { label: { type: "text" }, text: { type: "text" } },
    args: { label: "Sample label:", text: "Sample copy for a fact or an aside that the page sets apart from its text." },
    layout: "padded", wrap: column,
    stories: [{ name: "Fact" }] },
  { group: "Content", title: "Figure",
    description: "A photograph with softly rounded corners and a small gray caption under it.",
    html: '<figure><img src="/images/charon-true-color.jpg" width="360" class="content-img" alt="Charon, a gray cratered globe with a dark reddish patch at its pole." /><figcaption>{{caption}}</figcaption></figure>',
    controls: { caption: { type: "text" } },
    args: { caption: "Sample caption for a photograph." },
    layout: "padded", wrap: column,
    stories: [{ name: "Photograph with caption" }] },
  { group: "Content", title: "Data table",
    description: "A table across the column's full width, with hairline borders and a pale blue-gray header row.",
    html: '<table><caption>{{caption}}</caption><thead><tr><th scope="col">Property</th><th scope="col">Value</th></tr></thead><tbody><tr><td>Sample row</td><td>Sample value</td></tr><tr><td>Another row</td><td>Another value</td></tr><tr><td>A third row</td><td>A third value</td></tr></tbody></table>',
    controls: { caption: { type: "text" } },
    args: { caption: "Sample table caption" },
    layout: "padded", wrap: column,
    stories: [{ name: "Two columns" }] },
  { group: "Content", title: "Timeline",
    description: "Dated events in order, each year in bold deep violet, with a hairline between them.",
    html: '<ul class="timeline"><li><span class="year">1900</span> Sample event copy.</li><li><span class="year">1950</span> Another sample event, a little longer, to show how a line wraps under its year.</li><li><span class="year">2000</span> A third sample event.</li></ul>',
    layout: "padded", wrap: column,
    stories: [{ name: "Three events" }] },

  /* ---- Messages: the form-result pages ---- */
  { group: "Messages", title: "Confirmation",
    description: "The box that confirms a newsletter sign-up: pale green, with the success badge and a dark green title.",
    html: '<div class="message-box success"><span class="success-badge" aria-hidden="true"></span><h1>{{title}}</h1><p>Sample copy confirming what just happened, and what comes next.</p></div>',
    controls: { title: { type: "text" } },
    args: { title: "Sample confirmation" },
    layout: "padded", wrap: column,
    stories: [{ name: "Signed up" }] },
  { group: "Messages", title: "Notice",
    description: "The box that explains the search page: pale blue, with a plain notice in it.",
    html: '<div class="message-box info"><p><strong>{{label}}</strong> sample copy for a notice the reader should see before anything else on the page.</p></div>',
    controls: { label: { type: "text" } },
    args: { label: "Sample notice:" },
    layout: "padded", wrap: column,
    stories: [{ name: "Information" }] },
];
