"use client";

import type { Ingredient, Tag } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Ref } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildGalleryHref,
  parseGalleryQueryFromSearchParams
} from "@/lib/gallery-query";
import { FILTER_PANEL_WIDTH, SUPPORT_LINK } from "@/lib/ui-system";

function isAlcoholIngredientName(name: string) {
  const n = name.toLowerCase();

  const keywords = [
    "vodka",
    "gin",
    "rum",
    "tequila",
    "whisky",
    "whiskey",
    "bourbon",
    "scotch",
    "brandy",
    "cognac",
    "vermouth",
    "prosecco",
    "champagne",
    "wine",
    "sherry",
    "aperol",
    "amaretto",
    "cointreau",
    "triple sec",
    "curaçao",
    "curacao",
    "liqueur",
    "bitters"
  ];

  return keywords.some((keyword) => n.includes(keyword));
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 7h16" />
      <path d="M7 12h10" />
      <path d="M10 17h4" />
    </svg>
  );
}

function FilterTrigger({
  open,
  activeCount,
  onClick,
  buttonRef
}: {
  open: boolean;
  activeCount: number;
  onClick: () => void;
  buttonRef: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      id="gallery-filter-trigger"
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls="gallery-filter-panel"
      aria-label={activeCount ? `Filters ${activeCount}` : "Filters"}
      className={[
        "pointer-events-auto inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-medium uppercase tracking-[0.12em] transition",
        open
          ? "border-[rgba(255,199,92,0.35)] bg-[rgba(255,199,92,0.16)] text-[#ffe4ae]"
          : activeCount
            ? "border-white/16 bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.1)]"
            : "border-white/10 bg-[rgba(255,255,255,0.03)] text-white/90 hover:border-white/16 hover:bg-[rgba(255,255,255,0.06)]"
      ].join(" ")}
    >
      <FilterIcon />
      <span>Filters</span>
      {activeCount ? (
        <span className="rounded-full bg-black/35 px-1.5 text-[10px] leading-[16px] text-white/92">
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}

function sectionClasses(tone: "ingredients" | "alcohol" | "tags" | "abv", selected: boolean) {
  const base =
    "rounded-full border px-3.5 py-2 text-left text-[13px] transition";

  if (!selected) {
    return `${base} border-white/10 bg-[rgba(255,255,255,0.04)] text-white/84 hover:border-white/18 hover:bg-[rgba(255,255,255,0.08)]`;
  }

  if (tone === "ingredients") {
    return `${base} border-[rgba(114,214,170,0.34)] bg-[rgba(114,214,170,0.2)] text-[#eafff5]`;
  }

  if (tone === "tags") {
    return `${base} border-[rgba(179,148,255,0.34)] bg-[rgba(179,148,255,0.2)] text-[#f2ebff]`;
  }

  if (tone === "abv") {
    return `${base} border-[rgba(255,157,94,0.34)] bg-[rgba(255,157,94,0.2)] text-[#fff1e5]`;
  }

  return `${base} border-[rgba(255,199,92,0.34)] bg-[rgba(255,199,92,0.2)] text-[#fff5df]`;
}

function FilterSection({
  title,
  description,
  tone,
  items,
  selected,
  onToggle
}: {
  title: string;
  description: string;
  tone: "ingredients" | "alcohol" | "tags";
  items: Array<{ id: string; name: string; slug: string }>;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <div className="text-[12px] font-semibold uppercase leading-[20px] tracking-[0.14em] text-[#f3ddb2]">
          {title}
        </div>
        <div className="text-[12px] leading-[18px] text-white/56">
          {description}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => {
          const isSelected = selected.includes(item.slug);
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(item.slug)}
              className={sectionClasses(tone, isSelected)}
            >
              {item.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function AbvSection({
  selected,
  onSelect
}: {
  selected: number | null;
  onSelect: (value: number | null) => void;
}) {
  const options = useMemo(() => {
    const values: number[] = [];
    for (let value = 0; value <= 60; value += 5) values.push(value);
    return values;
  }, []);

  return (
    <section className="space-y-3">
      <div>
        <div className="text-[12px] font-semibold uppercase leading-[20px] tracking-[0.14em] text-[#f3ddb2]">
          Alcohol %
        </div>
        <div className="text-[12px] leading-[18px] text-white/56">
          Choose a maximum ABV in 5% increments.
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
          className={sectionClasses("abv", selected === null)}
        >
          Any %
        </button>
        {options.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={selected === value}
            onClick={() => onSelect(value)}
            className={sectionClasses("abv", selected === value)}
          >
            Up to {value}%
          </button>
        ))}
      </div>
    </section>
  );
}

export function FiltersBar({
  q,
  tags,
  ingredients,
  selectedTagSlugs,
  selectedIngredientSlugs,
  selectedAbvMax,
  searchPlaceholder = "Search drinks…"
}: {
  q: string;
  tags: Tag[];
  ingredients: Ingredient[];
  selectedTagSlugs: string[];
  selectedIngredientSlugs: string[];
  selectedAbvMax: number | null;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelLeft, setPanelLeft] = useState(0);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!panelOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (dockRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setPanelOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPanelOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  useEffect(() => {
    return () => {
      if (debouncedTimer.current) {
        window.clearTimeout(debouncedTimer.current);
      }
    };
  }, []);

  const alcoholIngredients = ingredients.filter((ingredient) =>
    isAlcoholIngredientName(ingredient.name)
  );
  const otherIngredients = ingredients.filter(
    (ingredient) => !isAlcoholIngredientName(ingredient.name)
  );

  const percentTagRegex = useMemo(() => /\b\d+\s*%|\bAlcohol\b/i, []);
  const nonPercentTags = useMemo(
    () => tags.filter((tag) => !percentTagRegex.test(tag.name)),
    [tags, percentTagRegex]
  );

  const alcoholSlugSet = useMemo(
    () => new Set(alcoholIngredients.map((ingredient) => ingredient.slug)),
    [alcoholIngredients]
  );
  const otherSlugSet = useMemo(
    () => new Set(otherIngredients.map((ingredient) => ingredient.slug)),
    [otherIngredients]
  );

  const ingredientSlugsInAlcohol = selectedIngredientSlugs.filter((slug) =>
    alcoholSlugSet.has(slug)
  );
  const ingredientSlugsInOther = selectedIngredientSlugs.filter((slug) =>
    otherSlugSet.has(slug)
  );

  const activeFilterCount =
    selectedTagSlugs.length +
    selectedIngredientSlugs.length +
    Number(selectedAbvMax !== null);

  function replaceUrl(next: {
    nextQ?: string;
    nextTagSlugs?: string[];
    nextIngredientSlugs?: string[];
    nextAbvMax?: number | null;
  }) {
    const currentQuery = parseGalleryQueryFromSearchParams(
      new URLSearchParams(searchParams.toString())
    );
    const url = buildGalleryHref(
      currentQuery,
      {
        q: next.nextQ ?? q,
        tag: next.nextTagSlugs ?? selectedTagSlugs,
        ing: next.nextIngredientSlugs ?? selectedIngredientSlugs,
        abvMax: Object.prototype.hasOwnProperty.call(next, "nextAbvMax")
          ? next.nextAbvMax ?? null
          : selectedAbvMax
      },
      pathname
    );
    router.replace(url, { scroll: false });
  }

  function toggleSlug(list: string[], slug: string) {
    return list.includes(slug) ? list.filter((value) => value !== slug) : [...list, slug];
  }

  function positionPanel() {
    const dockRect = dockRef.current?.getBoundingClientRect();
    const buttonRect = filterButtonRef.current?.getBoundingClientRect();

    if (!dockRect || !buttonRect) {
      setPanelLeft(0);
      return;
    }

    const relativeLeft = buttonRect.right - dockRect.left - FILTER_PANEL_WIDTH;
    const minLeft = 0;
    const maxLeft = Math.max(0, dockRect.width - FILTER_PANEL_WIDTH);
    setPanelLeft(Math.max(minLeft, Math.min(relativeLeft, maxLeft)));
  }

  function togglePanel() {
    if (panelOpen) {
      setPanelOpen(false);
      return;
    }

    positionPanel();
    setPanelOpen(true);
  }

  function clearFilters() {
    replaceUrl({
      nextTagSlugs: [],
      nextIngredientSlugs: [],
      nextAbvMax: null
    });
  }

  return (
    <div className="pointer-events-auto relative z-[60] flex w-full flex-col gap-3 overflow-visible text-[#f7edd8]">
      <div className="flex items-center gap-3 overflow-visible md:gap-4">
        <div
          ref={dockRef}
          className="relative min-w-0 flex-1 overflow-visible bg-black/95 py-1 md:py-2"
        >
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <label className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 text-white/64">
              <span aria-hidden="true" className="text-[18px] leading-none text-[#f1d38e]">
                🍸
              </span>
              <span className="sr-only">Search drinks</span>
              <input
                ref={searchInputRef}
                key={q}
                type="search"
                defaultValue={q}
                aria-label="Search drinks"
                placeholder={searchPlaceholder}
                onFocus={() => setPanelOpen(false)}
                onClick={() => setPanelOpen(false)}
                onChange={(event) => {
                  const nextQ = event.target.value;
                  if (debouncedTimer.current) {
                    window.clearTimeout(debouncedTimer.current);
                  }
                  debouncedTimer.current = window.setTimeout(() => {
                    replaceUrl({ nextQ });
                  }, 200);
                }}
                className="pointer-events-auto min-w-0 flex-1 bg-transparent text-[15px] font-medium leading-[22px] text-white placeholder:text-white/56 outline-none"
              />
            </label>

            <FilterTrigger
              open={panelOpen}
              activeCount={activeFilterCount}
              onClick={togglePanel}
              buttonRef={filterButtonRef}
            />
          </div>

          {panelOpen ? (
            <div
              id="gallery-filter-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="false"
              aria-labelledby="gallery-filter-trigger"
              aria-label="All filters"
              className="absolute left-0 top-[calc(100%+10px)] z-[70] max-w-[calc(100vw-32px)] rounded-[24px] border border-white/10 bg-[rgba(0,0,0,0.96)] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.45)] backdrop-blur-[16px]"
              style={{
                left: panelLeft,
                width: `min(${FILTER_PANEL_WIDTH}px, calc(100vw - 32px))`
              }}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[12px] font-semibold uppercase leading-[20px] tracking-[0.14em] text-[#f3ddb2]">
                    All filters
                  </div>
                  <div className="text-[12px] leading-[18px] text-white/56">
                    Refine the gallery by alcohol, ingredients, tags, or ABV.
                  </div>
                </div>
                {activeFilterCount ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-white/10 bg-transparent px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/62 transition hover:border-white/18 hover:text-white"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>

              <div className="max-h-[min(68vh,640px)] space-y-5 overflow-auto pr-1">
                <FilterSection
                  title="Alcohol"
                  description="Spirits, liqueurs, bitters, and wine-based ingredients."
                  tone="alcohol"
                  items={alcoholIngredients}
                  selected={ingredientSlugsInAlcohol}
                  onToggle={(slug) =>
                    replaceUrl({
                      nextIngredientSlugs: toggleSlug(selectedIngredientSlugs, slug)
                    })
                  }
                />

                <FilterSection
                  title="Ingredients"
                  description="Non-alcohol ingredients used in the drinks."
                  tone="ingredients"
                  items={otherIngredients}
                  selected={ingredientSlugsInOther}
                  onToggle={(slug) =>
                    replaceUrl({
                      nextIngredientSlugs: toggleSlug(selectedIngredientSlugs, slug)
                    })
                  }
                />

                <FilterSection
                  title="Tags"
                  description="Flavor, season, and style tags from the drink cards."
                  tone="tags"
                  items={nonPercentTags}
                  selected={selectedTagSlugs}
                  onToggle={(slug) =>
                    replaceUrl({
                      nextTagSlugs: toggleSlug(selectedTagSlugs, slug)
                    })
                  }
                />

                <AbvSection
                  selected={selectedAbvMax}
                  onSelect={(value) => replaceUrl({ nextAbvMax: value })}
                />
              </div>
            </div>
          ) : null}
        </div>

        <a
          href={SUPPORT_LINK}
          target="_blank"
          rel="noreferrer"
          className="hidden min-h-[48px] shrink-0 items-center justify-center rounded-full border border-white/12 bg-[rgba(255,255,255,0.03)] px-4 py-2 text-[14px] font-semibold text-white transition hover:-translate-y-[1px] hover:border-white/22 hover:bg-[rgba(255,255,255,0.07)] lg:inline-flex"
        >
          Buy me a drink!
        </a>
      </div>

      <a
        href={SUPPORT_LINK}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-[max(14px,env(safe-area-inset-bottom))] left-4 z-40 inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/12 bg-[rgba(0,0,0,0.96)] px-3 py-2 text-[14px] font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.24)] transition hover:-translate-y-[1px] hover:border-white/22 hover:bg-[rgba(255,255,255,0.07)] md:hidden"
      >
        Buy me a drink!
      </a>
    </div>
  );
}
