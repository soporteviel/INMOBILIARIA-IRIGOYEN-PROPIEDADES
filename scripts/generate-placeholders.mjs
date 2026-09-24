import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "images");

function noiseFilter(id, opacity) {
  return `
    <filter id="${id}" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="4" result="n"/>
      <feColorMatrix type="saturate" values="0" in="n" result="g"/>
      <feComponentTransfer in="g" result="a">
        <feFuncA type="table" tableValues="0 ${opacity}"/>
      </feComponentTransfer>
      <feBlend in="SourceGraphic" in2="a" mode="multiply"/>
    </filter>
  `;
}

function heroSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1200" viewBox="0 0 1920 1200">
  <defs>
    ${noiseFilter("grain", 0.12)}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#16352f"/>
      <stop offset="55%" stop-color="#0c241f"/>
      <stop offset="100%" stop-color="#081512"/>
    </linearGradient>
    <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d7c4a3" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#d7c4a3" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0e2a24"/>
      <stop offset="100%" stop-color="#071411"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1200" fill="url(#sky)"/>
  <rect width="1920" height="1200" fill="url(#warm)"/>
  <ellipse cx="1420" cy="260" rx="280" ry="90" fill="#e8d7b8" opacity="0.08"/>
  <circle cx="1480" cy="210" r="42" fill="#f0e2c4" opacity="0.2"/>
  <g opacity="0.35" fill="none" stroke="#1f6b5d" stroke-width="2">
    <circle cx="430" cy="620" r="320"/>
    <circle cx="430" cy="620" r="220"/>
  </g>
  <rect x="0" y="820" width="1920" height="380" fill="url(#ground)"/>
  <g transform="translate(980 430)">
    <polygon points="0,210 90,110 250,110 250,70 310,70 310,110 430,110 520,210" fill="#0a1f1b"/>
    <rect x="90" y="210" width="340" height="230" fill="#102924"/>
    <rect x="250" y="70" width="60" height="140" fill="#14332d"/>
    <rect x="130" y="250" width="70" height="90" fill="#c9a36a" opacity="0.72"/>
    <rect x="230" y="250" width="70" height="90" fill="#c9a36a" opacity="0.55"/>
    <rect x="330" y="250" width="70" height="90" fill="#c9a36a" opacity="0.8"/>
    <rect x="385" y="210" width="18" height="230" fill="#155547"/>
  </g>
  <g transform="translate(620 560)">
    <rect x="0" y="80" width="220" height="180" fill="#12332c"/>
    <polygon points="-20,80 110,-10 240,80" fill="#0b211c"/>
    <rect x="30" y="120" width="48" height="64" fill="#c9a36a" opacity="0.45"/>
    <rect x="140" y="120" width="48" height="64" fill="#c9a36a" opacity="0.6"/>
  </g>
  <rect width="1920" height="1200" filter="url(#grain)" opacity="0.55"/>
</svg>`;
}

function propertySvg({ sky, wall, roof, glow, accent, trees }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="980" viewBox="0 0 1400 980">
  <defs>
    ${noiseFilter("grain", 0.08)}
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${sky[0]}"/>
      <stop offset="100%" stop-color="${sky[1]}"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="980" fill="url(#sky)"/>
  <ellipse cx="1080" cy="160" rx="260" ry="90" fill="#ffffff" opacity="0.35"/>
  <rect x="0" y="700" width="1400" height="280" fill="${accent}"/>
  <ellipse cx="220" cy="720" rx="70" ry="110" fill="${trees}" opacity="0.55"/>
  <ellipse cx="1180" cy="700" rx="90" ry="150" fill="${trees}" opacity="0.45"/>
  <ellipse cx="1280" cy="730" rx="60" ry="100" fill="${trees}" opacity="0.35"/>
  <g transform="translate(360 240)">
    <polygon points="40,180 340,28 640,180" fill="${roof}"/>
    <rect x="90" y="180" width="500" height="360" fill="${wall}"/>
    <rect x="90" y="180" width="500" height="18" fill="${roof}" opacity="0.35"/>
    <rect x="140" y="240" width="110" height="150" fill="${glow}"/>
    <rect x="290" y="240" width="110" height="150" fill="${glow}" opacity="0.72"/>
    <rect x="440" y="240" width="110" height="150" fill="${glow}" opacity="0.88"/>
    <rect x="305" y="420" width="90" height="120" fill="${roof}"/>
  </g>
  <rect width="1400" height="980" filter="url(#grain)" opacity="0.35"/>
</svg>`;
}

async function rasterize(svg, file, width, height) {
  const buffer = await sharp(Buffer.from(svg))
    .resize(width, height, { fit: "cover" })
    .jpeg({ quality: 88 })
    .toBuffer();
  await writeFile(path.join(outDir, file), buffer);
}

await mkdir(outDir, { recursive: true });

await rasterize(heroSvg(), "hero.jpg", 1920, 1200);

await rasterize(
  propertySvg({
    sky: ["#eef4f0", "#c5d4c8"],
    wall: "#fbfaf7",
    roof: "#155547",
    glow: "#ead9b6",
    accent: "#b7c8be",
    trees: "#1a6b62",
  }),
  "propiedad-1.jpg",
  1400,
  980,
);

await rasterize(
  propertySvg({
    sky: ["#e4eee8", "#9fb6ab"],
    wall: "#f4f0e6",
    roof: "#0f3f38",
    glow: "#dcc49a",
    accent: "#8aa399",
    trees: "#155547",
  }),
  "propiedad-2.jpg",
  1400,
  980,
);

await rasterize(
  propertySvg({
    sky: ["#f7f4ee", "#d7e2db"],
    wall: "#fffcf7",
    roof: "#1a6b62",
    glow: "#f0e2c4",
    accent: "#c5d4c8",
    trees: "#0f3f38",
  }),
  "propiedad-3.jpg",
  1400,
  980,
);

await rasterize(
  propertySvg({
    sky: ["#e8f0ec", "#b7cbbf"],
    wall: "#f7f3ea",
    roof: "#12332c",
    glow: "#e2c9a0",
    accent: "#97b3a6",
    trees: "#0c332e",
  }),
  "propiedad-4.jpg",
  1400,
  980,
);

await rasterize(
  propertySvg({
    sky: ["#f3efe8", "#c9d6ce"],
    wall: "#fffaf2",
    roof: "#155547",
    glow: "#f3e0bc",
    accent: "#a9bfb4",
    trees: "#1a6b62",
  }),
  "propiedad-5.jpg",
  1400,
  980,
);

await rasterize(
  propertySvg({
    sky: ["#e6eeea", "#8fa89d"],
    wall: "#f1ece2",
    roof: "#081f1c",
    glow: "#d4b98c",
    accent: "#7d978c",
    trees: "#0f3f38",
  }),
  "propiedad-6.jpg",
  1400,
  980,
);

console.log("Placeholders generated");
