import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import Image from "next/image";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

export default async function DrinkPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const drink = await prisma.drink.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: true } },
      ingredients: {
        include: { ingredient: true },
        orderBy: { sortOrder: "asc" }
      },
      steps: { orderBy: { sortOrder: "asc" } }
    }
  });

  if (!drink) notFound();

  const ingredients = drink.ingredients.map((i) => ({
    name: i.ingredient.name,
    amount: i.amount,
    unit: i.unit,
    note: i.note,
    isGarnish: i.isGarnish
  }));

  const mainIngredients = ingredients.filter((i) => !i.isGarnish);
  const garnish = ingredients.filter((i) => i.isGarnish);

  function formatIngredient(i: (typeof ingredients)[number]) {
    const qty = [i.amount, i.unit].filter(Boolean).join("");
    const left = [i.name, qty ? ` ${qty}` : ""].join("");
    return `${left}${i.note ? ` — ${i.note}` : ""}`.trim();
  }

  const accent = drink.frontBg || "#6CFFE2";
  const chips = [drink.baseSpirit, drink.alcoholInfo, drink.season].filter(
    Boolean
  ) as string[];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl p-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Back to all drinks
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl">
          <div className="grid lg:grid-cols-[460px_1fr]">
            <div className="relative min-h-[360px] bg-black/10">
              <Image
                src={drink.imagePath}
                alt={drink.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 460px"
                priority
              />
              <div
                className="absolute inset-0"
                aria-hidden="true"
                style={{
                  background: `linear-gradient(140deg, ${accent}33, transparent 55%)`
                }}
              />
              <div
                className="absolute left-0 top-0 h-full w-2"
                aria-hidden="true"
                style={{ backgroundColor: accent }}
              />
            </div>

            <div className="p-6 lg:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold tracking-tight">
                  {drink.name}
                </h1>
              </div>
            </div>

              {chips.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {chips.map((chip) => {
                    const isPercent = /%/.test(chip);
                    const href = isPercent
                      ? (() => {
                          const nums = chip.match(/\d+/g)?.map(Number) ?? [];
                          const max = nums.length ? Math.max(...nums) : 0;
                          return `/?abvMax=${encodeURIComponent(String(max))}`;
                        })()
                      : `/?tag=${encodeURIComponent(slugify(chip))}`;

                    return (
                      <Link
                        key={chip}
                        href={href}
                        className="rounded-[8px] px-[8px] py-[2px] text-[10px] leading-[16px]"
                        style={{
                          backgroundColor: accent,
                          color: "rgba(0,0,0,0.7)"
                        }}
                      >
                        {chip}
                      </Link>
                    );
                  })}
                </div>
              ) : null}

              <p className="mt-5 text-sm leading-relaxed text-white/80">
                {drink.curiosity}
              </p>

              <div className="mt-8 grid gap-8 lg:grid-cols-2">
                <section>
                  <div
                    className="text-sm font-semibold tracking-wide"
                    style={{ color: accent }}
                  >
                    Ingredients
                  </div>
                  <div className="mt-4 grid gap-x-8 gap-y-2 text-sm text-white/85 sm:grid-cols-2">
                    {mainIngredients.map((i) => (
                      <div
                        key={`${i.name}:${i.amount ?? ""}:${i.unit ?? ""}:${i.note ?? ""}`}
                        className="flex items-start gap-2"
                      >
                        <div
                          className="mt-1.5 size-1.5 shrink-0 rounded-full"
                          aria-hidden="true"
                          style={{ backgroundColor: accent }}
                        />
                        <div>{formatIngredient(i)}</div>
                      </div>
                    ))}
                  </div>

                  {garnish.length ? (
                    <div className="mt-6">
                      <div
                        className="text-sm font-semibold tracking-wide"
                        style={{ color: accent }}
                      >
                        Garnish (optional)
                      </div>
                      <div className="mt-4 space-y-2 text-sm text-white/70">
                        {garnish.map((i) => (
                          <div key={`${i.name}:${i.note ?? ""}`}>
                            {formatIngredient(i)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>

                <section>
                  <div
                    className="text-sm font-semibold tracking-wide"
                    style={{ color: accent }}
                  >
                    Steps
                  </div>
                  <div className="mt-4 space-y-5">
                    {drink.steps.map((s) => (
                      <div key={s.id} className="rounded-2xl bg-black/10 p-4">
                        <div className="text-xs font-semibold text-white/60">
                          Step {s.sortOrder + 1}
                        </div>
                        <div className="mt-2 text-sm leading-relaxed text-white/85">
                          {s.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {drink.variations ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 px-4 py-3">
                      <div className="text-sm" style={{ color: accent }}>
                        Variations:{" "}
                        <span className="text-white/75">
                          {drink.variations}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
