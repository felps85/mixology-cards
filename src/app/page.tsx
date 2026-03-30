import { prisma } from "@/lib/prisma";
import { FiltersBar } from "@/components/FiltersBar";
import { DrinkCard } from "@/components/DrinkCard";
import { GalleryDrinkPanel } from "@/components/GalleryDrinkPanel";
import { buildGalleryHref, parseGalleryQuery } from "@/lib/gallery-query";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const galleryQuery = parseGalleryQuery(params);
  const q = galleryQuery.q;
  const tagSlugs = galleryQuery.tag;
  const ingredientSlugs = galleryQuery.ing;
  const selectedSlug = galleryQuery.sel ?? "";
  const selectedAbvMax = galleryQuery.abvMax;

  const [tags, ingredients, totalDrinks, drinks, selectedDrink] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.drink.count(),
    prisma.drink.findMany({
      where: {
        ...(q
          ? {
              name: {
                contains: q
              }
            }
          : {}),
        ...(tagSlugs.length
          ? {
              tags: {
                some: {
                  tag: {
                    slug: { in: tagSlugs }
                  }
                }
              }
            }
          : {}),
        ...(ingredientSlugs.length
          ? {
              ingredients: {
                some: {
                  ingredient: {
                    slug: { in: ingredientSlugs }
                  }
                }
              }
            }
          : {})
      },
      orderBy: { name: "asc" }
    }),
    selectedSlug
      ? prisma.drink.findUnique({
          where: { slug: selectedSlug },
          include: {
            tags: { include: { tag: true } },
            ingredients: {
              include: { ingredient: true },
              orderBy: { sortOrder: "asc" }
            },
            steps: { orderBy: { sortOrder: "asc" } }
          }
        })
      : Promise.resolve(null)
  ]);

  function parseAlcoholMax(info: string | null): number | null {
    if (!info) return null;
    const nums = info.match(/\d+/g)?.map((n) => Number(n)).filter(Number.isFinite);
    if (!nums?.length) return null;
    return Math.max(...nums);
  }

  const filteredDrinks =
    selectedAbvMax === null
      ? drinks
      : drinks.filter((d) => {
          const max = parseAlcoholMax(d.alcoholInfo);
          return max === null ? true : max <= selectedAbvMax;
        });
  const activeDrink =
    selectedDrink && filteredDrinks.some((drink) => drink.slug === selectedDrink.slug)
      ? selectedDrink
      : null;

  function metaChipsForDrink(drink: {
    baseSpirit: string | null;
    alcoholInfo: string | null;
    season: string | null;
  }) {
    return [drink.baseSpirit, drink.alcoholInfo, drink.season].filter(
      Boolean
    ) as string[];
  }

  return (
    <div className="speakeasy-stage min-h-screen overflow-hidden bg-black text-[#f7edd8]">
      <main className="relative z-10 mx-auto w-full max-w-[1680px] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <div className="flex flex-col gap-6">
          <section className="relative z-50 isolate">
            <FiltersBar
              q={q}
              tags={tags}
              ingredients={ingredients}
              selectedTagSlugs={tagSlugs}
              selectedIngredientSlugs={ingredientSlugs}
              selectedAbvMax={selectedAbvMax}
              searchPlaceholder={`Search ${totalDrinks} drinks…`}
            />
          </section>

          <section className="speakeasy-grid relative">
            <div className="relative grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 sm:gap-5 xl:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
              {filteredDrinks.map((drink) => (
                <DrinkCard
                  key={drink.id}
                  drink={drink}
                  href={buildGalleryHref(galleryQuery, { sel: drink.slug })}
                  selected={drink.slug === selectedSlug}
                  chips={metaChipsForDrink(drink)}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      {activeDrink ? (
        <div className="fixed inset-0 z-[90] bg-[rgba(4,2,4,0.76)] p-3 backdrop-blur-md sm:p-5 lg:p-6">
          <div className="mx-auto h-full max-w-[1700px]">
            <GalleryDrinkPanel
              drink={activeDrink}
              galleryQuery={galleryQuery}
              fullscreen
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
