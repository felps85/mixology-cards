"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type DrinkDetail = {
  slug: string;
  name: string;
  curiosity: string;
  blurb?: string | null;
  imagePath: string;
  frontBg?: string | null;
  baseSpirit?: string | null;
  season?: string | null;
  alcoholInfo?: string | null;
  variations?: string | null;
  tags: string[];
  ingredients: Array<{
    name: string;
    amount?: string | null;
    unit?: string | null;
    note?: string | null;
    isGarnish?: boolean;
  }>;
  steps: string[];
};

function formatIngredient(i: DrinkDetail["ingredients"][number]) {
  const qty = [i.amount, i.unit].filter(Boolean).join("");
  const left = [i.name, qty ? ` ${qty}` : ""].join("");
  return `${left}${i.note ? ` — ${i.note}` : ""}`.trim();
}

export function FlipDrinkCard({ drink }: { drink: DrinkDetail }) {
  const [flipped, setFlipped] = useState(false);
  const garnish = useMemo(
    () => drink.ingredients.filter((i) => i.isGarnish),
    [drink.ingredients]
  );
  const mainIngredients = useMemo(
    () => drink.ingredients.filter((i) => !i.isGarnish),
    [drink.ingredients]
  );

  return (
    <button
      type="button"
      className="group"
      onClick={() => setFlipped((v) => !v)}
      aria-label={flipped ? "Show drink front" : "Show recipe"}
    >
      <div
        className="relative h-[406px] w-[298px]"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/10 shadow-2xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              className="relative h-full w-full text-ink"
              style={{ backgroundColor: drink.frontBg ?? "#47F4DF" }}
            >
              <div className="absolute left-10 top-7 right-20">
                <div className="text-[44px] font-semibold leading-[1.05] tracking-tight">
                  {drink.name}
                </div>
              </div>

              {drink.baseSpirit ? (
                <div className="absolute right-10 top-8 grid h-8 w-8 place-items-center rounded-full bg-ink text-[10px] font-semibold text-white">
                  {drink.baseSpirit}
                </div>
              ) : null}

              <div className="absolute left-10 top-[92px] w-[170px] text-[10px] leading-[1.45] text-ink/80">
                {drink.curiosity}
              </div>

              <div className="absolute right-[-86px] top-[94px] h-[290px] w-[290px] overflow-hidden rounded-full bg-black/10">
                <Image
                  src={drink.imagePath}
                  alt={drink.name}
                  fill
                  className="object-cover"
                  sizes="290px"
                />
              </div>

              <div className="absolute left-10 bottom-9 space-y-2">
                {drink.tags.slice(0, 3).map((t) => (
                  <div
                    key={t}
                    className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-[10px] font-semibold text-white"
                  >
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 overflow-hidden rounded-[28px] border border-white/10 shadow-2xl"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden"
            }}
          >
            <div className="h-full w-full bg-cardNavy px-10 py-10 text-white">
              <div className="grid gap-5">
                <section>
                  <div className="text-[11px] font-semibold tracking-wide text-fuchsia-300">
                    Ingredients
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-[10px] text-white/90">
                    <div className="space-y-2">
                      {mainIngredients.map((i) => (
                        <div key={`${i.name}:${i.amount ?? ""}`}>
                          {formatIngredient(i)}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 text-white/70">
                      {garnish.length ? (
                        <>
                          <div className="font-semibold text-white/80">
                            Garnish (optional)
                          </div>
                          {garnish.map((i) => (
                            <div key={`${i.name}:${i.note ?? ""}`}>
                              {formatIngredient(i)}
                            </div>
                          ))}
                        </>
                      ) : null}
                    </div>
                  </div>
                </section>

                {drink.steps.length ? (
                  <section className="space-y-3">
                    {drink.steps.map((text, idx) => (
                      <div key={`${idx}:${text}`}>
                        <div className="text-[11px] font-semibold tracking-wide text-fuchsia-300">
                          Step {idx + 1}
                        </div>
                        <div className="mt-2 text-[10px] leading-[1.5] text-white/85">
                          {text}
                        </div>
                      </div>
                    ))}
                  </section>
                ) : null}

                {drink.variations ? (
                  <section className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[10px] text-fuchsia-200">
                      Variations:{" "}
                      <span className="text-white/75">{drink.variations}</span>
                    </div>
                  </section>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
