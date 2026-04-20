"use client";

import { buildGalleryHref, type GalleryQueryState } from "@/lib/gallery-query";
import { isLowResDrink } from "@/lib/drink-images";
import { slugify } from "@/lib/slugify";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef } from "react";

type ActiveDrink = {
  slug: string;
  name: string;
  imagePath: string;
  imageCardPath: string;
  imageSourceLowRes: boolean;
  curiosity: string;
  frontBg: string | null;
  baseSpirit: string | null;
  alcoholInfo: string | null;
  season: string | null;
  ingredients: Array<{
    id: string;
    amount: string | null;
    unit: string | null;
    note: string | null;
    ingredient: {
      name: string;
    };
  }>;
  steps: Array<{
    id: string;
    sortOrder: number;
    text: string;
  }>;
};

function metaChipsForDrink(drink: Pick<ActiveDrink, "baseSpirit" | "alcoholInfo" | "season">) {
  return [drink.baseSpirit, drink.alcoholInfo, drink.season].filter(
    Boolean
  ) as string[];
}

export function GalleryDrinkPanel({
  drink,
  galleryQuery,
  fullscreen = false
}: {
  drink: ActiveDrink;
  galleryQuery: GalleryQueryState;
  fullscreen?: boolean;
}) {
  const router = useRouter();
  const titleId = useId();
  const accent = drink.frontBg ?? "#FFE86C";
  const ingredientCount = drink.ingredients.length;
  const lowRes = isLowResDrink(drink);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const mobileCloseRef = useRef<HTMLAnchorElement | null>(null);
  const desktopCloseRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (!fullscreen) return;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const isDesktop =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(min-width: 768px)").matches
        : false;
    const closeTarget =
      isDesktop ? desktopCloseRef.current : mobileCloseRef.current;
    closeTarget?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      router.replace(buildGalleryHref(galleryQuery, { sel: null }), {
        scroll: false
      });
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [fullscreen, galleryQuery, router]);

  return (
    <div
      role={fullscreen ? "dialog" : undefined}
      aria-modal={fullscreen ? "true" : undefined}
      aria-labelledby={fullscreen ? titleId : undefined}
      className={[
        fullscreen ? "overflow-y-auto md:overflow-hidden" : "overflow-hidden",
        fullscreen
          ? "h-full w-full rounded-[32px] border border-[#e0ac59]/12 bg-[rgba(12,8,10,0.96)] shadow-[0_40px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          : "rounded-[28px] border border-[#e0ac59]/12 bg-[rgba(12,8,10,0.96)] shadow-[0_24px_60px_rgba(0,0,0,0.4)]"
      ].join(" ")}
    >
      {fullscreen ? (
        <div className="sticky top-0 z-20 flex justify-end p-4 md:hidden">
          <Link
            ref={mobileCloseRef}
            href={buildGalleryHref(galleryQuery, { sel: null })}
            className="rounded-full border border-[#d8a857]/24 bg-[rgba(20,15,18,0.92)] p-3 text-[#f8ead0] shadow-[0_10px_24px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-[#d8a857]/45 hover:bg-[#191115]"
            aria-label="Close"
          >
            <Image src="/ui/close.svg" alt="" width={20} height={20} className="invert" />
          </Link>
        </div>
      ) : null}

      <div
        className={[
          "grid grid-cols-1 lg:grid-cols-[minmax(320px,0.84fr)_minmax(0,1.16fr)]",
          fullscreen ? "md:h-full md:min-h-full" : "lg:min-h-[780px]"
        ].join(" ")}
      >
        <div
          className={[
            "relative min-h-[320px] overflow-hidden",
            fullscreen ? "lg:h-full" : "lg:min-h-[780px]"
          ].join(" ")}
        >
          {lowRes ? (
            <div
              className="absolute inset-0 scale-[1.06] bg-cover bg-center blur-3xl opacity-45"
              aria-hidden="true"
              style={{ backgroundImage: `url(${drink.imagePath})` }}
            />
          ) : null}
          <Image
            src={drink.imagePath}
            alt={drink.name}
            fill
            unoptimized
            className={[
              "object-center",
              lowRes ? "object-contain p-6" : "object-cover scale-[1.02]"
            ].join(" ")}
            sizes="(max-width: 1024px) 100vw, 36vw"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,5,7,0.1),rgba(8,5,7,0.32)_40%,rgba(8,5,7,0.84)_100%)]" />
          <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top,rgba(226,174,86,0.25),transparent_66%)]" />
          <div
            className="absolute inset-y-0 left-0 w-2"
            aria-hidden="true"
            style={{ backgroundColor: accent }}
          />
        </div>

        <div
          className={[
            "flex min-h-0 flex-col bg-[linear-gradient(180deg,rgba(226,174,86,0.07),transparent_22%)]",
            fullscreen ? "md:h-full" : ""
          ].join(" ")}
        >
          <div className="flex min-h-0 flex-1 flex-col p-6 md:overflow-y-auto md:p-8 lg:p-10">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] uppercase tracking-[0.28em] text-[#d8a857]">
                  Speakeasy Recipe Card
                </div>
                <h2 id={titleId} className="mt-3 min-w-0 text-[36px] font-semibold leading-[1.02] tracking-[-0.06em] text-[#fff4de] md:text-[52px]">
                  {drink.name}
                </h2>
              </div>
              <Link
                ref={desktopCloseRef}
                href={buildGalleryHref(galleryQuery, { sel: null })}
                className="mt-1 hidden shrink-0 rounded-full border border-[#d8a857]/24 bg-[#140f12] p-3 text-[#f8ead0] transition hover:border-[#d8a857]/45 hover:bg-[#191115] md:inline-flex"
                aria-label="Close"
              >
                <Image src="/ui/close.svg" alt="" width={20} height={20} className="invert" />
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {metaChipsForDrink(drink).map((chip) => {
                const isPercent = /%/.test(chip);
                const href = isPercent
                  ? (() => {
                      const nums = chip.match(/\d+/g)?.map(Number) ?? [];
                      const max = nums.length ? Math.max(...nums) : null;
                      return buildGalleryHref(galleryQuery, {
                        sel: null,
                        abvMax: max
                      });
                    })()
                  : buildGalleryHref(galleryQuery, {
                      sel: null,
                      tag: Array.from(new Set([...galleryQuery.tag, slugify(chip)]))
                    });

                return (
                  <Link
                    key={chip}
                    href={href}
                    className="rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#fff1d6] transition hover:-translate-y-[1px]"
                    style={{
                      borderColor: `${accent}80`,
                      backgroundColor: `${accent}26`
                    }}
                  >
                    {chip}
                  </Link>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-[#d8a857]/14 bg-[rgba(18,12,15,0.86)] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.28)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8a857]">
                Curiosity
              </div>
              <p className="mt-3 text-[15px] leading-[27px] text-[#f4ead7]/76">
                {drink.curiosity}
              </p>
            </div>

            <div className="mt-7 space-y-5 text-[14px] text-[#f7edd8]">
              <section className="rounded-[26px] border border-white/8 bg-[rgba(16,11,13,0.92)] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
                <div className="flex items-end justify-between gap-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8a857]">
                    Ingredients
                  </div>
                  <div className="text-[12px] text-[#f4ead7]/45">
                    {ingredientCount} item{ingredientCount === 1 ? "" : "s"}
                  </div>
                </div>
                <ul className="mt-[16px] grid gap-3 md:grid-cols-2">
                  {drink.ingredients.map((ingredient) => {
                    const qty = [ingredient.amount, ingredient.unit]
                      .filter(Boolean)
                      .join("");
                    return (
                      <li
                        key={ingredient.id}
                        className="flex items-start gap-3 rounded-[18px] border border-white/6 bg-white/[0.02] px-4 py-3"
                      >
                        <span
                          className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        <div className="min-w-0">
                          <div className="font-medium leading-[20px] text-[#fff4df]">
                            {ingredient.ingredient.name}
                          </div>
                          <div className="text-[13px] leading-[20px] text-[#f4ead7]/58">
                            {[qty || null, ingredient.note || null]
                              .filter(Boolean)
                              .join(" · ") || "To taste"}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="rounded-[26px] border border-white/8 bg-[rgba(16,11,13,0.92)] p-5 shadow-[0_18px_42px_rgba(0,0,0,0.28)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d8a857]">
                  Method
                </div>
                <div className="mt-[16px] space-y-[16px]">
                  {drink.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-4 rounded-[18px] border border-white/6 bg-white/[0.02] px-4 py-4"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                        style={{ backgroundColor: `${accent}38`, color: "#fff2d7" }}
                      >
                        {step.sortOrder + 1}
                      </div>
                      <div className="space-y-[4px]">
                        <div className="font-semibold leading-[20px] tracking-[0.2px] text-[#fff5df]">
                          Step {step.sortOrder + 1}
                        </div>
                        <p className="leading-[22.75px] text-[#f4ead7]/72">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
