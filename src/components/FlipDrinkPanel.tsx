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

export function FlipDrinkPanel({ drink }: { drink: DrinkDetail }) {
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
      className="w-full max-w-6xl text-left"
      onClick={() => setFlipped((v) => !v)}
      aria-label={flipped ? "Show drink image" : "Show recipe"}
    >
      <div className="relative h-[560px] w-full" style={{ perspective: "1400px" }}>
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)"
          }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/10 shadow-2xl"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div
              className="h-full w-full"
              style={{ backgroundColor: drink.frontBg ?? "#47F4DF" }}
            >
              <div className="grid h-full grid-rows-[1fr_240px] lg:grid-cols-[1fr_420px] lg:grid-rows-1">
                <div className="flex h-full flex-col justify-between p-8 text-[#0A0F20]">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <h1 className="text-5xl font-semibold leading-tight tracking-tight">
                        {drink.name}
                      </h1>
                      {drink.baseSpirit ? (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#0A0F20] text-[11px] font-semibold text-white">
                          {drink.baseSpirit}
                        </div>
                      ) : null}
                    </div>

                    <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#0A0F20]/80">
                      {drink.curiosity}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {drink.tags.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-full bg-[#0A0F20] px-3 py-1 text-xs font-semibold text-white"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="relative h-full w-full">
                  <Image
                    src={drink.imagePath}
                    alt={drink.name}
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 420px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-black/25 via-black/0 to-black/0" />
                </div>
              </div>
            </div>
          </div>

          <div
            className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/10 shadow-2xl"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden"
            }}
          >
            <div className="h-full w-full bg-cardNavy p-8 text-white">
              <div className="grid h-full gap-8 lg:grid-cols-2">
                <section>
                  <div className="text-sm font-semibold tracking-wide text-fuchsia-300">
                    Ingredients
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-6 text-sm text-white/90 sm:grid-cols-2">
                    <div className="space-y-2">
                      {mainIngredients.map((i) => (
                        <div key={`${i.name}:${i.amount ?? ""}`}>
                          {formatIngredient(i)}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 text-white/70">
                      {garnish.length ? (
                        <>
                          <div className="font-semibold text-white/85">
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

                <section className="flex h-full flex-col justify-between">
                  <div className="space-y-5">
                    {drink.steps.map((text, idx) => (
                      <div key={`${idx}:${text}`}>
                        <div className="text-sm font-semibold tracking-wide text-fuchsia-300">
                          Step {idx + 1}
                        </div>
                        <div className="mt-2 text-sm leading-relaxed text-white/85">
                          {text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {drink.variations ? (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-sm text-fuchsia-200">
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
      </div>
    </button>
  );
}
