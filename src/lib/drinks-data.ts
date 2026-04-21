import fs from "node:fs/promises";
import { resolve } from "node:path";
import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import {
  buildIngredientDisplayMap,
  buildIngredientFilterOptions
} from "@/lib/ingredient-filters";
import { prisma } from "@/lib/prisma";

const galleryDrinkSelect = {
  id: true,
  slug: true,
  name: true,
  curiosity: true,
  imagePath: true,
  imageCardPath: true,
  imageSourceLowRes: true,
  frontBg: true,
  baseSpirit: true,
  season: true,
  alcoholInfo: true
} satisfies Prisma.DrinkSelect;

const activeDrinkSelect = {
  slug: true,
  name: true,
  curiosity: true,
  imagePath: true,
  imageCardPath: true,
  imageSourceLowRes: true,
  frontBg: true,
  baseSpirit: true,
  season: true,
  alcoholInfo: true,
  ingredients: {
    select: {
      id: true,
      amount: true,
      unit: true,
      note: true,
      ingredient: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      sortOrder: "asc"
    }
  },
  steps: {
    select: {
      id: true,
      sortOrder: true,
      text: true
    },
    orderBy: {
      sortOrder: "asc"
    }
  }
} satisfies Prisma.DrinkSelect;

export type GalleryDrink = Prisma.DrinkGetPayload<{
  select: typeof galleryDrinkSelect;
}>;

export type IngredientFilterOption = ReturnType<
  typeof buildIngredientFilterOptions
>[number];

export type ActiveDrink = Prisma.DrinkGetPayload<{
  select: typeof activeDrinkSelect;
}>;

type SeedIngredient = {
  name: string;
};

type SeedDrink = {
  ingredients?: SeedIngredient[];
};

const getSeedIngredientSources = unstable_cache(
  async () => {
    const seedPath = resolve(process.cwd(), "prisma/drinksSeed.json");
    const raw = await fs.readFile(seedPath, "utf8");
    const seed = JSON.parse(raw) as SeedDrink[];

    return seed.flatMap((drink, drinkIndex) =>
      (drink.ingredients ?? []).map((ingredient, ingredientIndex) => ({
        id: `${drinkIndex}-${ingredientIndex}-${ingredient.name}`,
        slug: ingredient.name
          .toLowerCase()
          .trim()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, ""),
        name: ingredient.name
      }))
    );
  },
  ["seed-ingredient-sources"],
  {
    revalidate: 60 * 60
  }
);

const getIngredientFilterGroups = unstable_cache(
  async () => {
    const ingredients = await getSeedIngredientSources();
    return buildIngredientFilterOptions(ingredients);
  },
  ["ingredient-filter-groups"],
  {
    revalidate: 60 * 60
  }
);

const getIngredientDisplayMap = unstable_cache(
  async () => {
    const ingredients = await getSeedIngredientSources();
    return buildIngredientDisplayMap(ingredients);
  },
  ["ingredient-display-map"],
  {
    revalidate: 60 * 60
  }
);

export const getGalleryMetadata = unstable_cache(
  async () => {
    const [tags, ingredients, totalDrinks] = await Promise.all([
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
      getIngredientFilterGroups(),
      prisma.drink.count()
    ]);

    return { tags, ingredients, totalDrinks };
  },
  ["gallery-metadata"],
  {
    revalidate: 60 * 60
  }
);

const getFilteredDrinksCached = unstable_cache(
  async (
    q: string,
    sortedTagSlugs: string[],
    ingredientSlugGroups: string[][]
  ) =>
    prisma.drink.findMany({
      where: {
        ...(q
          ? {
              name: {
                contains: q
              }
            }
          : {}),
        ...(sortedTagSlugs.length
          ? {
              tags: {
                some: {
                  tag: {
                    slug: { in: sortedTagSlugs }
                  }
                }
              }
            }
          : {}),
        ...(ingredientSlugGroups.length
          ? {
              AND: ingredientSlugGroups.map((ingredientSlugs) => ({
                ingredients: {
                  some: {
                    ingredient: {
                      slug: { in: ingredientSlugs }
                    }
                  }
                }
              }))
            }
          : {})
      },
      orderBy: { name: "asc" },
      select: galleryDrinkSelect
    }),
  ["filtered-drinks"],
  {
    revalidate: 5 * 60
  }
);

export async function getFilteredDrinks(
  q: string,
  tagSlugs: string[],
  ingredientSlugs: string[]
) {
  const sortedIngredientSlugs = [...ingredientSlugs].sort();
  const ingredientGroups = sortedIngredientSlugs.length
    ? await getIngredientFilterGroups()
    : [];
  const ingredientSlugMap = new Map(
    ingredientGroups.map((group) => [group.slug, group.sourceSlugs])
  );

  return getFilteredDrinksCached(
    q.trim(),
    [...tagSlugs].sort(),
    sortedIngredientSlugs.map((slug) => ingredientSlugMap.get(slug) ?? [slug])
  );
}

const getDrinkBySlugCached = unstable_cache(
  async (slug: string) =>
    prisma.drink.findUnique({
      where: { slug },
      select: activeDrinkSelect
    }),
  ["drink-by-slug"],
  {
    revalidate: 60 * 60
  }
);

export async function getDrinkBySlug(slug: string) {
  if (!slug) return null;
  const drink = await getDrinkBySlugCached(slug);
  if (!drink) return null;

  const ingredientNameMap = await getIngredientDisplayMap();

  return {
    ...drink,
    ingredients: drink.ingredients.map((ingredient) => ({
      ...ingredient,
      ingredient: {
        ...ingredient.ingredient,
        name:
          ingredientNameMap.get(ingredient.ingredient.name) ??
          ingredient.ingredient.name
      }
    }))
  };
}
