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

export const slStories: StoryEntry[] = [];
