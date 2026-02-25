import sharp from 'sharp';

// Remove the checkerboard/light background from the logo
// The checkerboard pattern uses white (#FFFFFF) and light gray (#CCCCCC) pixels
// We'll make any pixel that's close to white or light gray fully transparent

const input = './public/SynergySquadLogo.png';
const output = './public/SynergySquadLogo_clean.png';

const image = sharp(input);
const { width, height } = await image.metadata();

const { data, info } = await image
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const pixels = Buffer.from(data);

for (let i = 0; i < pixels.length; i += 4) {
  const r = pixels[i];
  const g = pixels[i + 1];
  const b = pixels[i + 2];
  const a = pixels[i + 3];

  // Check if pixel is part of the checkerboard pattern
  // Checkerboard uses white (255,255,255) and light gray (~204,204,204)
  const isWhiteish = r > 190 && g > 190 && b > 190 && Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
  
  if (isWhiteish) {
    pixels[i + 3] = 0; // Make transparent
  }
}

await sharp(pixels, {
  raw: {
    width: info.width,
    height: info.height,
    channels: 4,
  },
})
  .png()
  .toFile(output);

console.log(`Done! Saved clean logo to ${output}`);
