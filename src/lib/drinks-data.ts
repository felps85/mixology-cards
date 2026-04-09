import { unstable_cache } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const galleryDrinkSelect = {
  id: true,
  slug: true,
  name: true,
  curiosity: true,
  imagePath: true,
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

export type ActiveDrink = Prisma.DrinkGetPayload<{
  select: typeof activeDrinkSelect;
}>;

export const getGalleryMetadata = unstable_cache(
  async () => {
    const [tags, ingredients, totalDrinks] = await Promise.all([
      prisma.tag.findMany({ orderBy: { name: "asc" } }),
      prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
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
  async (q: string, sortedTagSlugs: string[], sortedIngredientSlugs: string[]) =>
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
        ...(sortedIngredientSlugs.length
          ? {
              ingredients: {
                some: {
                  ingredient: {
                    slug: { in: sortedIngredientSlugs }
                  }
                }
              }
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
  return getFilteredDrinksCached(
    q.trim(),
    [...tagSlugs].sort(),
    [...ingredientSlugs].sort()
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
  return getDrinkBySlugCached(slug);
}
