import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'prisma', 'drinksSeed.json');
const ORIGINALS_DIR = path.join(ROOT, 'assets', 'drinks', 'originals');
const PUBLIC_DRINKS_DIR = path.join(ROOT, 'public', 'drinks');
const CARD_DIR = path.join(PUBLIC_DRINKS_DIR, 'card');
const DETAIL_DIR = path.join(PUBLIC_DRINKS_DIR, 'detail');

const CARD_WIDTH = 960;
const DETAIL_WIDTH = 1600;
const CARD_QUALITY = 88;
const DETAIL_QUALITY = 92;
const MIN_SOURCE_WIDTH = 1280;
const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];

function basenameFromImagePath(imagePath, fallbackName) {
  const candidate = imagePath ? path.basename(imagePath, path.extname(imagePath)) : '';
  if (candidate) return candidate;
  return fallbackName
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function parseArgs(argv) {
  const allowedLowRes = new Set();
  const args = [...argv];

  while (args.length) {
    const arg = args.shift();
    if (!arg) continue;

    if (arg === '--allow-low-res') {
      const value = args.shift();
      if (!value) throw new Error('--allow-low-res requires a comma-separated value');
      for (const entry of value.split(',')) {
        const trimmed = entry.trim();
        if (trimmed) allowedLowRes.add(trimmed);
      }
      continue;
    }

    if (arg.startsWith('--allow-low-res=')) {
      for (const entry of arg.slice('--allow-low-res='.length).split(',')) {
        const trimmed = entry.trim();
        if (trimmed) allowedLowRes.add(trimmed);
      }
      continue;
    }

    if (arg === '--allow-low-res-file') {
      const filePath = args.shift();
      if (!filePath) throw new Error('--allow-low-res-file requires a path');
      allowedLowRes.filePath = filePath;
      continue;
    }

    if (arg.startsWith('--allow-low-res-file=')) {
      allowedLowRes.filePath = arg.slice('--allow-low-res-file='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return allowedLowRes;
}

async function loadAllowLowResSet(argv) {
  const parsed = parseArgs(argv);
  const allowed = new Set([...parsed]);

  if (parsed.filePath) {
    const raw = await fs.readFile(path.resolve(parsed.filePath), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      allowed.add(trimmed);
    }
  }

  return allowed;
}

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findOriginalForDrink(drink, basename) {
  for (const ext of VALID_EXTENSIONS) {
    const candidate = path.join(ORIGINALS_DIR, `${basename}${ext}`);
    if (await fileExists(candidate)) return candidate;
  }

  const legacyImagePath = typeof drink.imagePath === 'string' ? drink.imagePath : '';
  if (
    legacyImagePath &&
    legacyImagePath.startsWith('/drinks/') &&
    !legacyImagePath.startsWith('/drinks/card/') &&
    !legacyImagePath.startsWith('/drinks/detail/')
  ) {
    const legacyFile = path.join(PUBLIC_DRINKS_DIR, path.basename(legacyImagePath));
    if (await fileExists(legacyFile)) {
      const ext = path.extname(legacyFile).toLowerCase();
      const destination = path.join(ORIGINALS_DIR, `${basename}${ext}`);
      await fs.copyFile(legacyFile, destination);
      return destination;
    }
  }

  return null;
}

async function buffersEqual(filePath, nextBuffer) {
  if (!(await fileExists(filePath))) return false;
  const current = await fs.readFile(filePath);
  return current.equals(nextBuffer);
}

async function writeIfChanged(targetPath, nextBuffer) {
  if (await buffersEqual(targetPath, nextBuffer)) return false;
  await fs.writeFile(targetPath, nextBuffer);
  return true;
}

async function generateDerivative(sourcePath, width, quality) {
  return sharp(sourcePath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toBuffer();
}

async function main() {
  const allowLowRes = await loadAllowLowResSet(process.argv.slice(2));
  await fs.mkdir(ORIGINALS_DIR, { recursive: true });
  await fs.mkdir(CARD_DIR, { recursive: true });
  await fs.mkdir(DETAIL_DIR, { recursive: true });

  const seed = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'));
  let updatedSeed = false;
  let copiedOriginals = 0;
  let writtenCards = 0;
  let writtenDetails = 0;

  for (const drink of seed) {
    const basename = basenameFromImagePath(drink.imagePath ?? drink.imageCardPath ?? '', drink.name);
    const sourcePath = await findOriginalForDrink(drink, basename);

    if (!sourcePath) {
      throw new Error(`Missing source original for ${drink.name} (${basename}) in assets/drinks/originals`);
    }

    if (sourcePath.startsWith(ORIGINALS_DIR)) {
      const legacyFile = typeof drink.imagePath === 'string' ? path.join(PUBLIC_DRINKS_DIR, path.basename(drink.imagePath)) : '';
      if (legacyFile && (await fileExists(legacyFile))) copiedOriginals += 1;
    }

    const metadata = await sharp(sourcePath).metadata();
    const width = metadata.width ?? 0;
    const isLowRes = width > 0 && width < MIN_SOURCE_WIDTH;

    if (isLowRes && !allowLowRes.has(basename)) {
      throw new Error(
        `Source image for ${drink.name} is below ${MIN_SOURCE_WIDTH}px wide (${width}px). Re-run with --allow-low-res=${basename}`
      );
    }

    const nextCardPath = `/drinks/card/${basename}.webp`;
    const nextDetailPath = `/drinks/detail/${basename}.webp`;
    const cardOutputPath = path.join(CARD_DIR, `${basename}.webp`);
    const detailOutputPath = path.join(DETAIL_DIR, `${basename}.webp`);

    const [cardBuffer, detailBuffer] = await Promise.all([
      generateDerivative(sourcePath, CARD_WIDTH, CARD_QUALITY),
      generateDerivative(sourcePath, DETAIL_WIDTH, DETAIL_QUALITY)
    ]);

    if (await writeIfChanged(cardOutputPath, cardBuffer)) writtenCards += 1;
    if (await writeIfChanged(detailOutputPath, detailBuffer)) writtenDetails += 1;

    if (drink.imageCardPath !== nextCardPath) {
      drink.imageCardPath = nextCardPath;
      updatedSeed = true;
    }

    if (drink.imagePath !== nextDetailPath) {
      drink.imagePath = nextDetailPath;
      updatedSeed = true;
    }

    if (Boolean(drink.imageSourceLowRes) !== isLowRes) {
      drink.imageSourceLowRes = isLowRes;
      updatedSeed = true;
    }
  }

  if (updatedSeed) {
    await fs.writeFile(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`);
  }

  console.log(
    `images-sync complete: ${seed.length} drinks, ${writtenCards} card updates, ${writtenDetails} detail updates, originals ready in ${ORIGINALS_DIR}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
