import taxonomy from "@/data/filter-taxonomy.json";

type FilterOption = {
  id: string;
  slug: string;
  name: string;
};

const spiritTagSlugSet = new Set(taxonomy.spiritTagSlugs.map(normalizeSlug));
const blockedAlcoholIngredientSlugSet = new Set(
  taxonomy.blockedAlcoholIngredientSlugs.map(normalizeSlug)
);
const alcoholIngredientTokenSet = new Set(
  taxonomy.alcoholIngredientTokenSlugs.map(normalizeSlug)
);
const alcoholIngredientPhraseSet = new Set(
  taxonomy.alcoholIngredientPhraseSlugs.map(normalizeSlug)
);
const titleCaseLowerWordSet = new Set(
  taxonomy.titleCaseLowerWords.map((word) => word.toLowerCase())
);

export function splitTagFilterOptions<T extends FilterOption>(tags: T[]) {
  const spiritTags: T[] = [];
  const styleTags: T[] = [];

  for (const tag of tags) {
    if (isPercentTag(tag.name)) continue;

    const formattedTag = {
      ...tag,
      name: formatFilterLabel(tag.name)
    };

    if (isSpiritTagSlug(tag.slug) || isSpiritTagSlug(tag.name)) {
      spiritTags.push(formattedTag);
      continue;
    }

    styleTags.push(formattedTag);
  }

  return {
    spiritTags: sortFilterOptions(spiritTags),
    styleTags: sortFilterOptions(styleTags)
  };
}

export function splitIngredientFilterOptions<T extends FilterOption & { sourceSlugs?: string[] }>(
  ingredients: T[]
) {
  const spiritIngredients: T[] = [];
  const otherIngredients: T[] = [];

  for (const ingredient of ingredients) {
    const formattedIngredient = {
      ...ingredient,
      name: formatFilterLabel(ingredient.name)
    };

    if (isAlcoholIngredientOption(ingredient)) {
      spiritIngredients.push(formattedIngredient);
      continue;
    }

    otherIngredients.push(formattedIngredient);
  }

  return {
    spiritIngredients: sortFilterOptions(spiritIngredients),
    otherIngredients: sortFilterOptions(otherIngredients)
  };
}

export function isSpiritTagSlug(slug: string) {
  return spiritTagSlugSet.has(normalizeSlug(slug));
}

export function isAlcoholIngredientOption(option: {
  slug: string;
  name?: string;
  sourceSlugs?: string[];
}) {
  const candidates = [option.slug, option.name ?? "", ...(option.sourceSlugs ?? [])]
    .map(normalizeSlug)
    .filter(Boolean);

  return candidates.some(isAlcoholIngredientSlug);
}

export function formatFilterLabel(value: string) {
  const compact = value.trim().replace(/\s+/g, " ");
  if (!compact) return compact;

  return compact
    .toLocaleLowerCase()
    .replace(
      /\b([a-zà-öø-ÿ])([a-zà-öø-ÿ'’]*)/giu,
      (match, first, rest, offset) => {
        const lowerWord = `${first}${rest}`;
        if (offset !== 0 && titleCaseLowerWordSet.has(lowerWord)) {
          return lowerWord;
        }

        return `${first.toLocaleUpperCase()}${rest}`;
      }
    );
}

function isPercentTag(name: string) {
  return /\b\d+\s*%|\balcohol\b/i.test(name);
}

function isAlcoholIngredientSlug(slug: string) {
  if (!slug || blockedAlcoholIngredientSlugSet.has(slug)) {
    return false;
  }

  const tokens = slug.split("-").filter(Boolean);
  if (!tokens.length) return false;

  if (tokens.some((token) => alcoholIngredientTokenSet.has(token))) {
    return true;
  }

  for (let size = 2; size <= Math.min(4, tokens.length); size += 1) {
    for (let index = 0; index <= tokens.length - size; index += 1) {
      const phrase = tokens.slice(index, index + size).join("-");
      if (alcoholIngredientPhraseSet.has(phrase)) {
        return true;
      }
    }
  }

  return false;
}

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function sortFilterOptions<T extends FilterOption>(items: T[]) {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}
