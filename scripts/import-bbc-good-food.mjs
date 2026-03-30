import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const seedPath = path.join(projectRoot, "prisma", "drinksSeed.json");
const drinksDir = path.join(projectRoot, "public", "drinks");
const thumbsDir = path.join(drinksDir, "thumbs");

const COLLECTION_PAGES = [1, 2, 3, 4, 5, 6];
const BBC_ORIGIN = "https://www.bbcgoodfood.com";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36";

const EXISTING_EQUIVALENTS = new Map([
  ["bloody mary", "bloody mary"],
  ["mojito", "mojito"],
  ["white russian", "white russian"],
  ["black russian", "black russian"],
  ["sex on the beach", "sex on the beach"],
  ["pina colada", "pina colada"],
  ["sangria", "sangria"],
  ["bellini", "bellini"],
  ["aperol spritz", "aperol spritz"],
  ["cuba libre", "cuba libre"],
  ["sidecar", "sidecar"],
  ["tequila sunrise", "tequila sunrise"],
  ["mudslide", "mudslide"],
  ["vodka martini", "martini"]
]);

const ALCOHOL_RULES = [
  { label: "Rum", keywords: ["dark rum", "white rum", "spiced rum", "rum"], abv: 40, accent: "#6CFFE2" },
  { label: "Vodka", keywords: ["vodka"], abv: 40, accent: "#D0FF6C" },
  { label: "Gin", keywords: ["sloe gin", "pink gin", "gin"], abv: 40, accent: "#F580FF" },
  { label: "Tequila", keywords: ["tequila"], abv: 38, accent: "#FF6C6C" },
  { label: "Mezcal", keywords: ["mezcal"], abv: 40, accent: "#FF6C6C" },
  { label: "Whisky", keywords: ["whisky", "whiskey", "bourbon", "scotch", "rye"], abv: 40, accent: "#C399F9" },
  { label: "Cognac", keywords: ["cognac", "armagnac", "brandy", "calvados"], abv: 40, accent: "#6CB0FF" },
  { label: "Cachaça", keywords: ["cachaca", "cachaça"], abv: 40, accent: "#6CFFA7" },
  { label: "Amaretto", keywords: ["amaretto"], abv: 28, accent: "#FFE86C" },
  { label: "Aperol", keywords: ["aperol"], abv: 11, accent: "#FFBC6C" },
  { label: "Campari", keywords: ["campari"], abv: 25, accent: "#FF6C6C" },
  { label: "Midori", keywords: ["midori"], abv: 20, accent: "#6CFFE2" },
  { label: "Pimm's", keywords: ["pimm"], abv: 25, accent: "#FFBC6C" },
  { label: "Prosecco", keywords: ["prosecco", "cava", "cremant", "crémant"], abv: 11, accent: "#FFBC6C" },
  { label: "Champagne", keywords: ["champagne"], abv: 12, accent: "#8085FF" },
  { label: "Wine", keywords: ["red wine", "white wine", "rose", "rosé", "wine", "port"], abv: 12, accent: "#F999C7" },
  { label: "Vermouth", keywords: ["vermouth"], abv: 18, accent: "#F580FF" },
  { label: "Limoncello", keywords: ["limoncello"], abv: 25, accent: "#FFE86C" },
  { label: "Liqueur", keywords: ["triple sec", "cointreau", "curaçao", "curacao", "liqueur", "schnapps", "kirsch", "advocaat", "baileys"], abv: 22, accent: "#FFE86C" },
  { label: "Bitters", keywords: ["bitters"], abv: 44, accent: "#FFE86C" }
];

function slugify(input) {
  return normalizeForCompare(input)
    .replace(/and/g, "and")
    .replace(/\s+/g, "-");
}

function normalizeForCompare(input) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/’/g, "'")
    .replace(/&/g, " and ")
    .replace(/\brecipe\b/g, " ")
    .replace(/\bcocktail\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanTitle(title) {
  return title
    .replace(/\s*\.?\s*This is a premium piece of content.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&ndash;/g, "–")
    .replace(/&mdash;/g, "—")
    .replace(/&rsquo;/g, "’")
    .replace(/&lsquo;/g, "‘")
    .replace(/&eacute;/g, "é");
}

function stripHtml(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function cleanStepText(text) {
  return text
    .replace(/\b\d+\s+TWISTS?\b[\s\S]*$/i, "")
    .replace(/\bTWISTS?\b[\s\S]*$/i, "")
    .replace(/\bPARTNERED CONTENT\b[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractJsonScript(html, id) {
  const startToken = `<script type="application/json" id="${id}">`;
  const start = html.indexOf(startToken);
  if (start === -1) {
    throw new Error(`Could not find ${id} JSON block`);
  }

  const end = html.indexOf("</script>", start);
  if (end === -1) {
    throw new Error(`Could not find closing script tag for ${id}`);
  }

  return JSON.parse(html.slice(start + startToken.length, end));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url, {
    headers: { "user-agent": USER_AGENT }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch asset ${url}: ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

function absoluteUrl(url) {
  return url.startsWith("http") ? url : `${BBC_ORIGIN}${url}`;
}

function amountText(ingredient) {
  if (ingredient.quantityText) return String(ingredient.quantityText).trim();
  if (ingredient.metricQuantity && ingredient.metricUnit) {
    return `${ingredient.metricQuantity}${ingredient.metricUnit}`;
  }
  if (ingredient.metricQuantity) return String(ingredient.metricQuantity);
  return null;
}

function looksLikeGarnish(ingredient, heading) {
  const combined = `${ingredient.ingredientText ?? ""} ${ingredient.note ?? ""} ${heading ?? ""}`.toLowerCase();
  return /garnish|to serve|to garnish|sliced|slice|wedge|sprig|twist|ribbon|halved|skewer|rim/i.test(
    combined
  );
}

function mergeDuplicateIngredients(ingredients) {
  const merged = new Map();

  for (const ingredient of ingredients) {
    const key = `${ingredient.name.toLowerCase()}::${ingredient.isGarnish ? "g" : "m"}`;
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...ingredient });
      continue;
    }

    const amounts = [existing.amount, ingredient.amount].filter(Boolean);
    const notes = [existing.note, ingredient.note].filter(Boolean);

    existing.amount = [...new Set(amounts)].join(" + ") || null;
    existing.note = [...new Set(notes)].join(" · ") || null;
    existing.isGarnish = existing.isGarnish || ingredient.isGarnish;
  }

  return [...merged.values()];
}

function flattenIngredients(groups = []) {
  const flattened = groups.flatMap((group) => {
    const heading = group.heading ? stripHtml(group.heading) : null;

    return (group.ingredients ?? []).map((ingredient) => {
      const notes = [];
      if (ingredient.note) notes.push(stripHtml(ingredient.note));
      if (heading && !/^main$/i.test(heading)) {
        notes.push(/^to garnish$/i.test(heading) ? "garnish" : heading);
      }

      return {
        name: ingredient.term?.display ?? ingredient.ingredientText ?? "Ingredient",
        amount: amountText(ingredient),
        unit: null,
        note: notes.length ? notes.join(" · ") : null,
        isGarnish: Boolean((heading && /garnish/i.test(heading)) || looksLikeGarnish(ingredient, heading))
      };
    });
  });

  return mergeDuplicateIngredients(flattened);
}

function flattenSteps(methodSteps = []) {
  const steps = methodSteps
    .filter((step) => step.type === "step")
    .map((step) =>
      cleanStepText(
        (step.content ?? [])
        .map((part) => stripHtml(part?.data?.value ?? ""))
        .filter(Boolean)
        .join(" ")
      )
    )
    .filter(Boolean);

  return steps;
}

function estimateVolumeMl(ingredient) {
  const unit = (ingredient.metricUnit ?? "").toLowerCase();
  const quantity = Number(ingredient.metricQuantity ?? 0);
  const name = (ingredient.ingredientText ?? ingredient.term?.display ?? "").toLowerCase();
  const note = (ingredient.note ?? "").toLowerCase();
  const quantityText = String(ingredient.quantityText ?? "").toLowerCase();

  if (quantity && unit === "ml") return quantity;
  if (quantity && unit === "l") return quantity * 1000;
  if (quantity && unit === "tsp") return quantity * 5;
  if (quantity && unit === "tbsp") return quantity * 15;
  if (quantity && /dash/.test(unit)) return quantity;

  const mlMatch = quantityText.match(/(\d+(?:\.\d+)?)\s*ml/);
  if (mlMatch) return Number(mlMatch[1]);

  const tspMatch = quantityText.match(/(\d+(?:\.\d+)?)\s*tsp/);
  if (tspMatch) return Number(tspMatch[1]) * 5;

  const tbspMatch = quantityText.match(/(\d+(?:\.\d+)?)\s*tbsp/);
  if (tbspMatch) return Number(tbspMatch[1]) * 15;

  const countMatch = quantityText.match(/(\d+(?:\.\d+)?)/);
  const count = countMatch ? Number(countMatch[1]) : 1;

  if (/lime|lemon/.test(name) && /juice|juiced/.test(`${name} ${note}`)) return count * 25;
  if (/orange|grapefruit/.test(name) && /juice|juiced/.test(`${name} ${note}`)) return count * 50;
  if (/clementine/.test(name) && /juice|juiced/.test(`${name} ${note}`)) return count * 25;
  if (/passion fruit/.test(name)) return count * 15;
  if (/juice/.test(name)) return count * 50;
  if (/soda water|tonic|cola|lemonade|ginger beer|ginger ale/.test(name)) return 100;
  if (/egg white|mint|salt|sugar|cherry|slice|wedge|zest|sprig|ice/.test(name)) return 0;

  return 0;
}

function inferProfile(rawIngredients, title, description) {
  const scores = new Map();
  let totalVolume = 0;
  let alcoholVolume = 0;

  for (const group of rawIngredients ?? []) {
    for (const ingredient of group.ingredients ?? []) {
      const name = `${ingredient.ingredientText ?? ""} ${ingredient.note ?? ""}`.toLowerCase();
      const volume = estimateVolumeMl(ingredient);
      totalVolume += volume;

      for (const rule of ALCOHOL_RULES) {
        if (rule.keywords.some((keyword) => name.includes(keyword))) {
          const effectiveVolume = volume || 25;
          scores.set(rule.label, (scores.get(rule.label) ?? 0) + effectiveVolume * rule.abv);
          alcoholVolume += effectiveVolume * (rule.abv / 100);
          break;
        }
      }
    }
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  const baseSpirit = sorted[0]?.[0] ?? inferNonAlcoholicBase(title, description);
  const accent =
    ALCOHOL_RULES.find((rule) => rule.label === baseSpirit)?.accent ?? "#8085FF";

  const keywordText = `${title} ${description}`.toLowerCase();
  const adjustedTotal =
    totalVolume +
    (/\b(shake|shaken|frozen|mojito|mule|collins|spritz|fizz|punch)\b/.test(keywordText)
      ? 60
      : 0) +
    (/\b(martini|manhattan|old fashioned|negroni|sazerac|gibson)\b/.test(keywordText)
      ? 10
      : 0);

  const abv = adjustedTotal > 0 ? (alcoholVolume / adjustedTotal) * 100 : baseSpirit === "Mocktail" ? 0 : 18;

  return {
    baseSpirit,
    frontBg: accent,
    alcoholInfo: formatAlcoholInfo(abv),
    season: inferSeason(title, description)
  };
}

function inferNonAlcoholicBase(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  if (/mocktail|non-alcoholic|shirley temple|punch/.test(text)) return "Mocktail";
  return "Cocktail";
}

function formatAlcoholInfo(abv) {
  if (abv <= 0.5) return "0% Alcohol";
  if (abv <= 5) return "0 – 5% Alcohol";
  if (abv <= 10) return "5 – 10% Alcohol";
  if (abv <= 15) return "10 – 15% Alcohol";
  if (abv <= 20) return "15 – 20% Alcohol";
  if (abv <= 25) return "20 – 25% Alcohol";
  if (abv <= 30) return "25 – 30% Alcohol";
  if (abv <= 35) return "30 – 35% Alcohol";
  return "35 – 40% Alcohol";
}

function inferSeason(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  if (/mulled|winter|snowball|festive|christmas|cranberry|clementine|spiced/.test(text)) {
    return "Winter";
  }

  if (/espresso|chocolate|custard|toffee|caramel|pecan|strudel|banana|dessert/.test(text)) {
    return "Dessert";
  }

  if (/bloody mary|bellini|sharley temple|shirley temple|brunch/.test(text)) {
    return "Brunch";
  }

  if (/martini|manhattan|old fashioned|negroni|gibson|sazerac|bourbon|scotch|whisky/.test(text)) {
    return "Dinner";
  }

  if (/punch|party|sharing/.test(text)) {
    return "Party";
  }

  return "Summer";
}

function buildCuriosity(name, ingredients, profile) {
  const standout = ingredients
    .map((ingredient) => ingredient.name)
    .filter(
      (name) =>
        !/ice|water|sugar syrup|sugar|mint|salt|olive|cherry|slice|wedge|zest|sprig/i.test(name)
    )
    .slice(0, 3);

  const flavorText =
    standout.length === 0
      ? "a clean, bar-ready build"
      : standout.length === 1
        ? standout[0].toLowerCase()
        : `${standout.slice(0, -1).map((item) => item.toLowerCase()).join(", ")} and ${standout.at(-1).toLowerCase()}`;

  const mood =
    profile.season === "Winter"
      ? "warming"
      : profile.season === "Dessert"
        ? "indulgent"
        : profile.season === "Dinner"
          ? "spirit-forward"
          : profile.season === "Brunch"
            ? "bright"
            : "refreshing";

  if (profile.baseSpirit === "Mocktail") {
    return `${name} keeps things ${mood} with ${flavorText} in a booze-free serve.`;
  }

  return `${name} is a ${mood} ${profile.baseSpirit.toLowerCase()} pour built around ${flavorText}.`;
}

function toDrinkRecord(item, data) {
  const title = cleanTitle(data.title ?? item.title);
  const slug = slugify(title);
  const description = stripHtml(data.description ?? item.description ?? "");
  const ingredients = flattenIngredients(data.ingredients);
  const steps = flattenSteps(data.methodSteps);
  const profile = inferProfile(data.ingredients, title, description);

  return {
    name: title,
    imagePath: `/drinks/${slug}.jpg`,
    frontBg: profile.frontBg,
    curiosity: buildCuriosity(title, ingredients, profile),
    tags: [profile.baseSpirit, profile.season, profile.alcoholInfo],
    baseSpirit: profile.baseSpirit,
    season: profile.season,
    alcoholInfo: profile.alcoholInfo,
    ingredients,
    steps
  };
}

async function downloadImageVariants(imageUrl, slug) {
  const fullUrl = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}quality=86&resize=1200,1200`;
  const thumbUrl = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}quality=78&resize=720,720`;

  const [full, thumb] = await Promise.all([fetchBuffer(fullUrl), fetchBuffer(thumbUrl)]);
  await Promise.all([
    fs.writeFile(path.join(drinksDir, `${slug}.jpg`), full),
    fs.writeFile(path.join(thumbsDir, `${slug}.jpg`), thumb)
  ]);
}

async function fetchCollectionItems() {
  const items = [];

  for (const page of COLLECTION_PAGES) {
    const url =
      page === 1
        ? `${BBC_ORIGIN}/recipes/collection/cocktail-recipes`
        : `${BBC_ORIGIN}/recipes/collection/cocktail-recipes?page=${page}`;

    const html = await fetchText(url);
    const data = extractJsonScript(html, "__POST_CONTENT__");

    for (const item of data.items ?? []) {
      items.push({
        title: cleanTitle(item.title ?? ""),
        url: absoluteUrl(item.url),
        description: stripHtml(item.description ?? ""),
        imageUrl: item.image?.url ?? null,
        isPremium: Boolean(item.isPremium)
      });
    }
  }

  return items;
}

async function main() {
  await fs.mkdir(drinksDir, { recursive: true });
  await fs.mkdir(thumbsDir, { recursive: true });

  const existingSeed = JSON.parse(await fs.readFile(seedPath, "utf8"));
  const existingNames = new Set(existingSeed.map((drink) => normalizeForCompare(drink.name)));
  const seenTitles = new Set();
  const seenRecordNames = new Set(existingNames);
  const additions = [];
  const skipped = [];

  const collectionItems = await fetchCollectionItems();

  for (const item of collectionItems) {
    const normalizedTitle = normalizeForCompare(item.title);
    const existingMatch = EXISTING_EQUIVALENTS.get(normalizedTitle) ?? normalizedTitle;

    if (existingNames.has(existingMatch) || seenTitles.has(normalizedTitle)) {
      continue;
    }

    seenTitles.add(normalizedTitle);

    try {
      const html = await fetchText(item.url);
      const data = extractJsonScript(html, "__POST_CONTENT__");
      const record = toDrinkRecord(item, data);
      const normalizedRecordName = normalizeForCompare(record.name);

      if (seenRecordNames.has(normalizedRecordName)) {
        continue;
      }

      if (!record.ingredients.length || !record.steps.length || !data.image?.url) {
        skipped.push({ title: item.title, reason: "missing recipe data" });
        continue;
      }

      seenRecordNames.add(normalizedRecordName);
      const slug = slugify(record.name);
      await downloadImageVariants(data.image.url, slug);
      additions.push(record);
    } catch (error) {
      skipped.push({
        title: item.title,
        reason: error instanceof Error ? error.message : "unknown error"
      });
    }
  }

  const nextSeed = [...existingSeed, ...additions].sort((a, b) =>
    a.name.localeCompare(b.name, "en", { sensitivity: "base" })
  );

  await fs.writeFile(seedPath, JSON.stringify(nextSeed, null, 2) + "\n");

  console.log(
    JSON.stringify(
      {
        added: additions.length,
        skipped,
        total: nextSeed.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
