import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const seedPath = path.join(projectRoot, "prisma", "drinksSeed.json");

const BBC_ORIGIN = "https://www.bbcgoodfood.com";
const COLLECTION_PAGES = [1, 2, 3, 4, 5, 6];
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36";

const MANUAL_FACTS = new Map([
  [
    normalizeName("Between the sheets"),
    "Between the Sheets is usually credited to Harry MacElhone at Harry’s New York Bar in Paris in the 1930s, where it emerged as a rum-and-cognac riff on the Sidecar."
  ],
  [
    normalizeName("Dark & stormy coffee cocktail"),
    "This coffee-spiked serve riffs on the Dark 'n' Stormy, one of the few cocktails whose name is trademarked and strongly tied to Bermuda and Goslings rum."
  ],
  [
    normalizeName("Frozen margarita"),
    "Frozen margaritas became a modern bar icon after Dallas restaurateur Mariano Martinez adapted a soft-serve machine into the first frozen margarita machine in 1971."
  ],
  [
    normalizeName("Garibaldi cocktail"),
    "The Garibaldi is named after Giuseppe Garibaldi, and its classic Campari-and-orange pairing is often read as a symbol of northern and southern Italy coming together."
  ],
  [
    normalizeName("Gibson cocktail"),
    "The Gibson’s identity was already being defined in print by 1908, and the cocktail became famous for swapping the martini’s olive for a pickled onion."
  ],
  [
    normalizeName("Gimlet cocktail"),
    "The Gimlet has long been linked to British naval lime rations and is often associated—though not definitively—with surgeon Sir Thomas Gimlette."
  ],
  [
    normalizeName("Hugo cocktail"),
    "The Hugo is a relatively young classic: it was created in South Tyrol in 2005 by bartender Roland Gruber as an alternative to the Spritz Veneziano."
  ],
  [
    normalizeName("Hurricane cocktail"),
    "The New Orleans Hurricane is closely tied to Pat O’Brien’s, where the drink is said to have been popularized in hurricane-lamp-shaped glasses during the rum-heavy 1940s."
  ],
  [
    normalizeName("Passion fruit martini"),
    "Passion fruit martini is a modern London classic created by Douglas Ankrah in the early 2000s, originally under the more provocative Porn Star Martini name."
  ],
  [
    normalizeName("Pimm's"),
    "Pimm’s traces back to James Pimm’s 1820s London oyster bar, where his No. 1 Cup was first served as a house digestive before becoming a summer staple."
  ],
  [
    normalizeName("Ramos gin fizz"),
    "Henry C. Ramos created the Ramos Gin Fizz in New Orleans in 1888, and its famously long shake once required teams of 'shaker boys' during Carnival."
  ],
  [
    normalizeName("Whisky mac"),
    "The Whisky Mac is generally attributed to Colonel Hector 'Fighting Mac' MacDonald, who is said to have mixed Scotch with ginger wine while serving in British India."
  ],
  [
    normalizeName("Bahama mama"),
    "Bahama Mama is usually treated as a midcentury Bahamas classic, and one popular origin story links its name to Nassau performer Dottie Lee Anderson, who was known on stage as 'Bahama Mama.'"
  ],
  [
    normalizeName("Claridge’s sazerac"),
    "Claridge’s version still nods to the 19th-century Sazerac of New Orleans, a drink closely associated with Peychaud’s bitters, rye whiskey and the city’s cocktail heritage."
  ],
  [
    normalizeName("Easy sangria"),
    "Sangria takes its name from the Spanish word for 'bloodletting' and grew out of Spain’s long tradition of wine-and-fruit punches before taking off internationally in the 20th century."
  ],
  [
    normalizeName("Frozen caipirinha"),
    "Even in frozen form, this drink points back to Brazil’s national cocktail: the caipirinha became so culturally central that it was later recognized as Brazilian cultural heritage."
  ],
  [
    normalizeName("Midori sour"),
    "The Midori Sour became a neon emblem of late-1970s and ’80s cocktail culture after Midori’s U.S. debut at New York’s Studio 54 in 1978."
  ],
  [
    normalizeName("Picante"),
    "Picante is a modern club-era classic: Soho House traces it back to a spicier Miami Margarita that was streamlined in 2012 into the now-famous Picante de la Casa."
  ],
  [
    normalizeName("Shirley temple"),
    "The Shirley Temple is usually linked to Hollywood’s Chasen’s restaurant, where bartenders are said to have mixed it for the child star—who later fought commercial uses of her name."
  ],
  [
    normalizeName("Sloe gin cocktail"),
    "Sloe gin has been a bar-book ingredient since at least Harry Johnson’s 1900 Bartenders Manual, so even newer serves like this one lean on a much older British liqueur tradition."
  ],
  [
    normalizeName("Snowball cocktail"),
    "The Snowball dates back to the 1940s but became a full-on British Christmas icon in the 1970s, when advocaat-and-lemonade drinks turned into festive party shorthand."
  ],
  [
    normalizeName("Strawberry daiquiri"),
    "Strawberry Daiquiris piggyback on the older Cuban daiquiri tradition, but the fruit-blended version really took off once bar blenders and frozen cocktails boomed in the 20th century."
  ]
]);

function normalizeName(input) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/’/g, "'")
    .replace(/\brecipe\b/g, " ")
    .replace(/\bcocktail\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function stripHtml(html = "") {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function extractJsonScript(html, id) {
  const startToken = `<script type="application/json" id="${id}">`;
  const start = html.indexOf(startToken);
  if (start === -1) throw new Error(`Missing ${id}`);
  const end = html.indexOf("</script>", start);
  if (end === -1) throw new Error(`Missing closing ${id}`);
  return JSON.parse(html.slice(start + startToken.length, end));
}

function shortTitle(title) {
  return title.replace(/\s+cocktail$/i, "");
}

function standoutIngredients(drink) {
  const ignore = [
    "ice",
    "soda water",
    "sparkling water",
    "tonic water",
    "sugar syrup",
    "simple syrup",
    "agave syrup",
    "honey",
    "caster sugar",
    "golden caster sugar",
    "granulated sugar",
    "salt",
    "water"
  ];

  const names = [];

  for (const ingredient of drink.ingredients ?? []) {
    const name = ingredient.name.toLowerCase();
    if (ignore.includes(name)) continue;
    if (ingredient.isGarnish && names.length >= 2) continue;
    if (!names.includes(name)) names.push(name);
    if (names.length === 3) break;
  }

  return names;
}

function joinIngredients(names) {
  if (names.length === 0) return "a few well-chosen ingredients";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names[0]}, ${names[1]} and ${names[2]}`;
}

function ingredientDrivenCuriosity(title, drink, tone = "general") {
  const base = shortTitle(title);
  const ingredients = joinIngredients(standoutIngredients(drink));

  switch (tone) {
    case "winter":
      return `${base} gives the cocktail format a colder-weather turn, with ${ingredients} shaping the flavour more than sheer strength.`;
    case "summer":
      return `${base} leans warm-weather and easygoing, with ${ingredients} doing most of the character work in the glass.`;
    case "party":
      return `${base} is built like a crowd-pleaser, with ${ingredients} giving it most of its personality.`;
    case "mocktail":
      return `${base} proves a booze-free serve can still feel layered and bar-worthy, especially with ${ingredients} in the mix.`;
    default:
      return `${base} stands out for the way it brings together ${ingredients}.`;
  }
}

function curiosityFromDescription(title, description, drink) {
  const clean = stripHtml(description);
  const lower = clean.toLowerCase();
  const base = shortTitle(title);
  const manual = MANUAL_FACTS.get(normalizeName(title));

  if (manual) return manual;

  if (!clean) return drink.curiosity;

  if (/sugar cube.*bubbles upward/.test(lower)) {
    return `A classic champagne cocktail gets a little table-side theatre from the sugar cube at the bottom of the flute, which helps drive the bubbles upward.`;
  }

  if (/drinkable for up to a year/.test(lower)) {
    return `${base} doubles as a bottle-worthy homemade liqueur — once made, it keeps surprisingly well for months.`;
  }

  if (/corpse reviver no\.?1/.test(lower)) {
    return `${base} is the brighter, more citrus-led relative of Corpse Reviver No. 1, with absinthe giving it its extra edge.`;
  }

  if (/valentine/.test(lower)) {
    return `${base} became an easy Valentine's Day riff on the classic, turning blush-toned with pink gin and Aperol.`;
  }

  if (/edible flower ice cubes/.test(lower)) {
    return `${base} stands out for its edible flower ice cubes, leaning into a more decorative spritz style than a standard prosecco serve.`;
  }

  if (/tiny umbrella/.test(lower)) {
    return `${base} keeps the playful party-cocktail energy alive — lime wedge, peach schnapps and even the option of a tiny umbrella.`;
  }

  if (/halloween|spooky|ghoulish|cauldron/.test(lower)) {
    if (/bright green/.test(lower)) {
      return `${base} earned Halloween status thanks to its bright green colour and minty, dessert-like profile.`;
    }

    if (/blood-red|blood curdling|blood-curdling/.test(lower)) {
      return `${base} leans into Halloween theatre with its blood-red look, making the colour as much a talking point as the flavour.`;
    }

    if (/purple/.test(lower)) {
      return `${base} is built for Halloween theatrics, with a dramatic purple hue that does almost as much work as the spirit mix.`;
    }

    return `${base} has become a Halloween-friendly serve, picked as much for its dramatic look as for the drink itself.`;
  }

  if (/christmas|festive|winter|bonfire night/.test(lower)) {
    return ingredientDrivenCuriosity(title, drink, "winter");
  }

  if (/summer|warmer days|balmy|al fresco/.test(lower)) {
    return ingredientDrivenCuriosity(title, drink, "summer");
  }

  if (/party started|party cocktail|party season|party guests/.test(lower)) {
    return ingredientDrivenCuriosity(title, drink, "party");
  }

  if (/twist on the classic/.test(lower) || /tropical twist/.test(lower)) {
    return `${base} works as a riff on a familiar classic, changing the mood with a fruit-forward twist rather than rebuilding the structure from scratch.`;
  }

  if (/non-alcoholic|mocktail/.test(lower)) {
    return ingredientDrivenCuriosity(title, drink, "mocktail");
  }

  if (/easy to make/.test(lower)) {
    return ingredientDrivenCuriosity(title, drink, "party");
  }

  if (/garnish with/.test(lower)) {
    const garnish = clean.match(/garnish with ([^.]+)/i)?.[1];
    if (garnish) {
      return `${base} is often remembered as much for its garnish as for the mix itself — ${garnish.trim()}.`;
    }
  }

  if (/made with/.test(lower)) {
    const match = clean.match(/made with ([^.]+)/i)?.[1];
    if (match) {
      return `${base} stands out for the way it layers ${match.trim()} into a more memorable serve.`;
    }
  }

  if (/combine /.test(lower) || /mix /.test(lower) || /blend /.test(lower)) {
    return ingredientDrivenCuriosity(title, drink);
  }

  return ingredientDrivenCuriosity(title, drink);
}

async function fetchDescriptions() {
  const map = new Map();

  for (const page of COLLECTION_PAGES) {
    const url =
      page === 1
        ? `${BBC_ORIGIN}/recipes/collection/cocktail-recipes`
        : `${BBC_ORIGIN}/recipes/collection/cocktail-recipes?page=${page}`;

    const html = await fetchText(url);
    const data = extractJsonScript(html, "__POST_CONTENT__");

    for (const item of data.items ?? []) {
      map.set(normalizeName(item.title ?? ""), item.description ?? "");
    }
  }

  return map;
}

async function main() {
  const seed = JSON.parse(await fs.readFile(seedPath, "utf8"));
  const descriptions = await fetchDescriptions();

  let updated = 0;
  const nextSeed = seed.map((drink) => {
    if (!drink.imagePath.endsWith(".jpg")) {
      return drink;
    }

    const description = descriptions.get(normalizeName(drink.name));
    if (!description) {
      return drink;
    }

    const curiosity = curiosityFromDescription(drink.name, description, drink);
    if (curiosity && curiosity !== drink.curiosity) {
      updated += 1;
      return { ...drink, curiosity };
    }

    return drink;
  });

  await fs.writeFile(seedPath, JSON.stringify(nextSeed, null, 2) + "\n");
  console.log(JSON.stringify({ updated }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
