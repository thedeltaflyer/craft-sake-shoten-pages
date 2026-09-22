import sharp from "sharp";
for (const [file, size] of [
  ["favicon.png", 64],
  ["apple-touch-icon.png", 180],
])
  await sharp("src/assets/brand/logo.png")
    .resize(size, size)
    .png()
    .toFile(`public/${file}`);
for (const [name, file] of [
  ["home", "sake.webp"],
  ["yokohama", "yokohama-shop.webp"],
  ["kawasaki", "kawasaki-shop.webp"],
])
  await sharp(`src/assets/photos/${file}`)
    .resize(1200, 630, { fit: "cover" })
    .jpeg({ quality: 85 })
    .toFile(`public/og-${name}.jpg`);
