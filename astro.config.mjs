import { defineConfig } from 'astro/config';

// Astro site for accessibility-scanner practice.
// Pages intentionally contain seeded WCAG violations — see ISSUES.md.
export default defineConfig({
  // Astro 5's whitespace rules. Astro 7 defaults to compressHTML: "jsx", which drops the line break
  // between text and an inline element ("see\n<a>DEMO-RESET.md</a>" rendered "seeDEMO-RESET.md").
  // Pages, snapshots and editor edits are written to HTML's rules, not JSX's.
  compressHTML: true,
  site: 'https://a11y-practice-pluto.blinkpages.site',
});
