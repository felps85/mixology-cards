import aliases from "@/data/ingredient-filter-aliases.json";

const aliasMap = aliases as Record<string, string>;

export type IngredientFilterSource = {
  id: string;
  slug: string;
  name: string;
};

export type IngredientFilterOption = {
  id: string;
  slug: string;
  name: string;
  sourceSlugs: string[];
};

type IngredientCanonicalGroup = {
  slug: string;
  aliasDisplay: string | null;
  displayCounts: Map<string, number>;
  sourceSlugs: Set<string>;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function canonicalDescriptor(name: string) {
  const raw = name.trim();
  const lower = raw.toLowerCase();
  const alias = aliasMap[lower];
  return {
    key: alias ? alias.toLowerCase() : lower,
    aliasDisplay: alias ?? null
  };
}

export function buildIngredientFilterOptions(
  ingredients: IngredientFilterSource[]
): IngredientFilterOption[] {
  return [...buildIngredientCanonicalGroups(ingredients).entries()]
    .map(([slug, group]) => {
      const displayCandidates = pickDisplayCandidates(group);

      return {
        id: slug,
        slug,
        name: group.aliasDisplay ?? displayCandidates[0]?.[0] ?? slug,
        sourceSlugs: [...group.sourceSlugs].sort()
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buildIngredientDisplayMap(
  ingredients: IngredientFilterSource[]
): Map<string, string> {
  const groups = buildIngredientCanonicalGroups(ingredients);
  const nameMap = new Map<string, string>();

  for (const [, group] of groups) {
    const displayCandidates = pickDisplayCandidates(group);
    const canonicalName = group.aliasDisplay ?? displayCandidates[0]?.[0];
    if (!canonicalName) continue;

    for (const [displayName] of group.displayCounts) {
      nameMap.set(displayName, canonicalName);
    }
  }

  return nameMap;
}

function buildIngredientCanonicalGroups(ingredients: IngredientFilterSource[]) {
  const groups = new Map<string, IngredientCanonicalGroup>();

  for (const ingredient of ingredients) {
    const canonical = canonicalDescriptor(ingredient.name);
    const canonicalSlug = slugify(canonical.key);
    const displayName = ingredient.name.trim();

    const group =
      groups.get(canonicalSlug) ??
      (() => {
        const next = {
          slug: canonicalSlug,
          aliasDisplay: canonical.aliasDisplay,
          displayCounts: new Map<string, number>(),
          sourceSlugs: new Set<string>()
        };
        groups.set(canonicalSlug, next);
        return next;
      })();

    if (!group.aliasDisplay && canonical.aliasDisplay) {
      group.aliasDisplay = canonical.aliasDisplay;
    }
    group.displayCounts.set(
      displayName,
      (group.displayCounts.get(displayName) ?? 0) + 1
    );
    group.sourceSlugs.add(ingredient.slug);
  }

  return groups;
}

function pickDisplayCandidates(group: IngredientCanonicalGroup) {
  return [...group.displayCounts.entries()].sort((a, b) => {
    const aScore = displayNameScore(a[0]);
    const bScore = displayNameScore(b[0]);
    if (bScore !== aScore) return bScore - aScore;
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
}

function displayNameScore(name: string) {
  let score = 0;
  if (/^[A-ZÀ-ÖØ-Þ]/.test(name)) score += 3;
  if (name !== name.toLowerCase()) score += 2;
  if (/\b[A-ZÀ-ÖØ-Þ][a-zà-öø-ÿ]+ [A-ZÀ-ÖØ-Þ]/.test(name)) score += 1;
  return score;
}
