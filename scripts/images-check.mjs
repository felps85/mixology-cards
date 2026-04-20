import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'prisma', 'drinksSeed.json');
const ORIGINALS_DIR = path.join(ROOT, 'assets', 'drinks', 'originals');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CARD_MAX_BYTES = 160 * 1024;
const DETAIL_MAX_BYTES = 400 * 1024;
const MIN_SOURCE_WIDTH = 1280;
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

function basenameFromPathname(imagePath) {
  return path.basename(imagePath, path.extname(imagePath));
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findOriginal(basename) {
  for (const ext of VALID_EXTENSIONS) {
    const candidate = path.join(ORIGINALS_DIR, `${basename}${ext}`);
    if (await fileExists(candidate)) return candidate;
  }
  return null;
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

async function main() {
  const seed = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'));
  const errors = [];

  for (const drink of seed) {
    assert(
      /^\/drinks\/detail\/[^/]+\.webp$/.test(drink.imagePath),
      `${drink.name}: imagePath must point to /drinks/detail/<basename>.webp`,
      errors
    );
    assert(
      /^\/drinks\/card\/[^/]+\.webp$/.test(drink.imageCardPath),
      `${drink.name}: imageCardPath must point to /drinks/card/<basename>.webp`,
      errors
    );

    const detailFile = path.join(PUBLIC_DIR, drink.imagePath.replace(/^\//, ''));
    const cardFile = path.join(PUBLIC_DIR, drink.imageCardPath.replace(/^\//, ''));
    const detailBase = basenameFromPathname(drink.imagePath);
    const cardBase = basenameFromPathname(drink.imageCardPath);

    assert(detailBase === cardBase, `${drink.name}: card/detail basenames must match`, errors);
    assert(await fileExists(detailFile), `${drink.name}: missing detail asset ${drink.imagePath}`, errors);
    assert(await fileExists(cardFile), `${drink.name}: missing card asset ${drink.imageCardPath}`, errors);

    if (await fileExists(detailFile)) {
      const stats = await fs.stat(detailFile);
      assert(stats.size <= DETAIL_MAX_BYTES, `${drink.name}: detail asset exceeds 400 KB (${stats.size} bytes)`, errors);
    }

    if (await fileExists(cardFile)) {
      const stats = await fs.stat(cardFile);
      assert(stats.size <= CARD_MAX_BYTES, `${drink.name}: card asset exceeds 160 KB (${stats.size} bytes)`, errors);
    }

    const original = await findOriginal(detailBase);
    assert(Boolean(original), `${drink.name}: missing original source in assets/drinks/originals`, errors);

    if (original) {
      const metadata = await sharp(original).metadata();
      const width = metadata.width ?? 0;
      if (width > 0 && width < MIN_SOURCE_WIDTH) {
        assert(
          drink.imageSourceLowRes === true,
          `${drink.name}: imageSourceLowRes must be true for a source width of ${width}px`,
          errors
        );
      }
    }
  }

  if (errors.length) {
    console.error('images-check failed:\n');
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`images-check passed for ${seed.length} drinks.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
