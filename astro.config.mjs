import { defineConfig } from 'astro/config';
import designSystem from './src/integrations/design-system.mjs';

// Astro site for accessibility-scanner practice.
// Pages intentionally contain seeded WCAG violations — see ISSUES.md.
export default defineConfig({
  // Astro 5's whitespace rules. Astro 7 defaults to compressHTML: "jsx", which drops the line break
  // between text and an inline element ("see\n<a>DEMO-RESET.md</a>" rendered "seeDEMO-RESET.md").
  // Pages, snapshots and editor edits are written to HTML's rules, not JSX's.
  compressHTML: true,
  site: 'https://a11y-practice-pluto.blinkpages.site',
  integrations: [
    // /design-system/ and its story pages, built in a pass of their own after the site's pages, so
    // they change no real page's CSS (style-library.md §3). Keep it last. The site's sitemap is the
    // hand-written public/sitemap, which lists neither route.
    designSystem(),
  ],
});
