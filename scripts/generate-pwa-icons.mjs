// Script to generate PWA icons from logo
// Run: node scripts/generate-pwa-icons.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ICONS_DIR = join(ROOT, "public", "icons");

if (!existsSync(ICONS_DIR)) {
  mkdirSync(ICONS_DIR, { recursive: true });
}

async function generateIcons() {
  try {
    const sharp = (await import("sharp")).default;
    const source = join(ROOT, "public", "logo-golden-yellow-on-black.png");

    const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

    for (const size of sizes) {
      await sharp(source)
        .resize(size, size, { fit: "contain", background: { r: 31, g: 41, b: 55, alpha: 1 } })
        .png()
        .toFile(join(ICONS_DIR, `icon-${size}x${size}.png`));
      console.log(`Generated icon-${size}x${size}.png`);
    }

    // Generate Apple touch icon (180x180)
    await sharp(source)
      .resize(180, 180, { fit: "contain", background: { r: 31, g: 41, b: 55, alpha: 1 } })
      .png()
      .toFile(join(ROOT, "public", "apple-touch-icon.png"));
    console.log("Generated apple-touch-icon.png");

    console.log("\nAll PWA icons generated successfully!");
  } catch (err) {
    if (err.code === "ERR_MODULE_NOT_FOUND" || err.message?.includes("sharp")) {
      console.log("sharp not found. Installing...");
      const { execSync } = await import("child_process");
      execSync("pnpm add -D sharp", { cwd: ROOT, stdio: "inherit" });
      console.log("sharp installed. Please run this script again.");
    } else {
      throw err;
    }
  }
}

generateIcons();
