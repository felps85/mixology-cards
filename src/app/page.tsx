import { FiltersBar } from "@/components/FiltersBar";
import { DrinkCard } from "@/components/DrinkCard";
import { GalleryDrinkPanel } from "@/components/GalleryDrinkPanel";
import { buildGalleryHref, parseGalleryQuery } from "@/lib/gallery-query";
import {
  getDrinkBySlug,
  getFilteredDrinks,
  getGalleryMetadata
} from "@/lib/drinks-data";

export const revalidate = 300;

function parseAlcoholMax(info: string | null): number | null {
  if (!info) return null;
  const nums = info.match(/\d+/g)?.map((n) => Number(n)).filter(Number.isFinite);
  if (!nums?.length) return null;
  return Math.max(...nums);
}

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

  const [{ spirits, tags, ingredients, totalDrinks }, drinks, selectedDrink] = await Promise.all([
    getGalleryMetadata(),
    getFilteredDrinks(q, tagSlugs, ingredientSlugs),
    getDrinkBySlug(selectedSlug)
  ]);

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
    <div className="speakeasy-stage min-h-screen bg-black text-[#f7edd8]">
      <main className="relative z-10 mx-auto w-full max-w-[1680px] px-4 pb-5 pt-[140px] sm:px-6 sm:pb-6 sm:pt-[152px] lg:px-10 lg:py-8">
        <div className="flex flex-col gap-6">
          <section className="fixed inset-x-0 top-0 z-50 isolate px-4 pt-[max(12px,env(safe-area-inset-top))] sm:px-6 lg:static lg:px-0 lg:pt-0">
            <div className="mx-auto w-full max-w-[1680px]">
              <FiltersBar
                q={q}
                spirits={spirits}
                tags={tags}
                ingredients={ingredients}
                selectedTagSlugs={tagSlugs}
                selectedIngredientSlugs={ingredientSlugs}
                selectedAbvMax={selectedAbvMax}
                searchPlaceholder={`Search ${totalDrinks} drinks…`}
              />
            </div>
          </section>

          <section className="speakeasy-grid relative">
            <div className="relative grid grid-cols-[repeat(auto-fill,minmax(198px,1fr))] gap-4 sm:gap-5 xl:grid-cols-[repeat(auto-fill,minmax(216px,1fr))]">
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
