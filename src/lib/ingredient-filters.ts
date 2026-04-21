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
  const groups = new Map<
    string,
    {
      slug: string;
      aliasDisplay: string | null;
      displayCounts: Map<string, number>;
      sourceSlugs: Set<string>;
    }
  >();

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

  return [...groups.entries()]
    .map(([slug, group]) => {
      const displayCandidates = [...group.displayCounts.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        const aLower = a[0] === a[0].toLowerCase();
        const bLower = b[0] === b[0].toLowerCase();
        if (aLower !== bLower) return aLower ? -1 : 1;
        return a[0].localeCompare(b[0]);
      });

      return {
        id: slug,
        slug,
        name: group.aliasDisplay ?? displayCandidates[0]?.[0] ?? slug,
        sourceSlugs: [...group.sourceSlugs].sort()
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
