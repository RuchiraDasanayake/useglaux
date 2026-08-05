/**
 * Renders the social card and square brand icons from inline SVG.
 *
 * Fonts are drawn as vector paths would require embedding Marcellus, so the
 * card uses generic serif/sans stacks that resolve on the rendering machine.
 * The output is committed, so it only has to render correctly once.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const HERE = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(HERE, "../public");

const WIDTH = 1200;
const HEIGHT = 630;

const owlMark = `
  <circle cx="10.5" cy="15.5" r="4.2" stroke="#dce6f4" stroke-width="1.5"/>
  <circle cx="21.5" cy="15.5" r="4.2" stroke="#dce6f4" stroke-width="1.5"/>
  <circle cx="10.5" cy="15.5" r="1.7" fill="#e9b45c"/>
  <circle cx="21.5" cy="15.5" r="1.7" fill="#e9b45c"/>
  <path d="M5.5 11.5 Q10.5 7 16 11.5 Q21.5 7 26.5 11.5" stroke="#dce6f4" stroke-width="1.5" stroke-linecap="round"/>`;

const socialSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="core" cx="50%" cy="34%" r="62%">
      <stop offset="0%" stop-color="#0d1626"/>
      <stop offset="100%" stop-color="#070b12"/>
    </radialGradient>
    <radialGradient id="gleam" cx="50%" cy="32%" r="50%">
      <stop offset="0%" stop-color="#e9b45c" stop-opacity="0.34"/>
      <stop offset="55%" stop-color="#e9b45c" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#e9b45c" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="20%" stop-color="#f4f8ff"/>
      <stop offset="100%" stop-color="#e9b45c"/>
    </linearGradient>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#core)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#gleam)"/>

  <g transform="translate(600 208)" fill="none" stroke="#e9b45c" opacity="0.34">
    <circle r="150" stroke-width="0.8"/>
    <circle r="136" stroke-width="2.2" stroke-dasharray="1 11" stroke-linecap="round"/>
    <circle r="104" stroke-width="0.8" stroke-dasharray="34 19"/>
  </g>

  <g transform="translate(600 208) scale(4.1) translate(-16 -16)" fill="none">
    ${owlMark}
  </g>

  <text x="600" y="452" text-anchor="middle" fill="url(#ink)"
        font-family="Marcellus, Georgia, 'Times New Roman', serif"
        font-size="112" letter-spacing="10">GLAUX</text>

  <text x="600" y="512" text-anchor="middle" fill="#8da0bc"
        font-family="'Schibsted Grotesk', 'Segoe UI', Helvetica, Arial, sans-serif"
        font-size="27">Risk-first intelligence. Calibrated, regime-aware, transparent.</text>

  <text x="600" y="572" text-anchor="middle" fill="#7a8faf"
        font-family="'Spline Sans Mono', Consolas, monospace"
        font-size="17" letter-spacing="4.6">USEGLAUX.COM</text>
</svg>`;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="68%">
      <stop offset="0%" stop-color="#141d2e"/>
      <stop offset="100%" stop-color="#070b12"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="178" fill="none" stroke="#e9b45c" stroke-opacity="0.34" stroke-width="2"/>
  <g transform="translate(256 256) scale(8.5) translate(-16 -16)" fill="none">
    ${owlMark}
  </g>
</svg>`;

await mkdir(PUBLIC, { recursive: true });

const outputs = [
  ["og-image.png", socialSvg, WIDTH, HEIGHT],
  ["brand-icon-512.png", iconSvg, 512, 512],
  ["apple-touch-icon.png", iconSvg, 180, 180],
];

for (const [name, source, width, height] of outputs) {
  const output = resolve(PUBLIC, name);
  const png = await sharp(Buffer.from(source))
    .resize(width, height)
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(output, png);
  console.log(`Wrote ${output} (${width}x${height}, ${(png.length / 1024).toFixed(1)} kB)`);
}
