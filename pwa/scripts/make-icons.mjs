// Renders the PWA icon set in public/icons/ from the source mark at the repo root.
// Run with `npm run icons` after changing the mark or the brand color. Overwrites the
// generated files, so it is safe to run repeatedly.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "public", "icons");
const BRAND = "#9A6F00";
const GLYPH = "#FFFFFF";

const mark = readFileSync(join(here, "..", "..", "thistle-mark.svg"), "utf8");
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

// `scale` is the share of the canvas the 24px glyph box fills.
function iconSvg(size, { scale = 0.72, radius = 0.22 } = {}) {
  const box = size * scale;
  const offset = (size - box) / 2;
  const r = size * radius;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="${BRAND}"/>
  <g transform="translate(${offset} ${offset}) scale(${box / 24})" fill="none" stroke="${GLYPH}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${inner}</g>
</svg>`;
}

mkdirSync(out, { recursive: true });
const render = (svg, file) => sharp(Buffer.from(svg)).png().toFile(join(out, file));

const jobs = [16, 32, 64, 128, 192, 256, 512, 1024].map((s) => render(iconSvg(s), `icon-${s}.png`));
// Maskable icons are cropped to a circle by some launchers, so: full-bleed and a smaller glyph.
jobs.push(render(iconSvg(512, { scale: 0.5, radius: 0 }), "icon-maskable.png"));
// iOS rounds the corners itself.
jobs.push(render(iconSvg(180, { radius: 0 }), "apple-touch-icon.png"));
jobs.push(render(iconSvg(64), "favicon.png"));
writeFileSync(join(out, "mark.svg"), iconSvg(512));

await Promise.all(jobs);
console.log(`Wrote ${jobs.length + 1} icons to ${out}`);
