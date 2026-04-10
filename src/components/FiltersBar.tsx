"use client";

import type { Ingredient, Tag } from "@prisma/client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildGalleryHref,
  parseGalleryQueryFromSearchParams
} from "@/lib/gallery-query";
import {
  getFilterPanelWidth,
  SUPPORT_LINK,
  type FilterPanelKey
} from "@/lib/ui-system";

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

  return keywords.some((k) => n.includes(k));
}

type DropdownKey = FilterPanelKey;

function FilterButton({
  label,
  open,
  onClick,
  activeCount,
  buttonRef,
  buttonId
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  activeCount?: number;
  buttonRef?: RefObject<HTMLButtonElement>;
  buttonId: string;
}) {
  return (
    <button
      id={buttonId}
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-controls="gallery-filter-panel"
      aria-label={activeCount ? `${label} ${activeCount}` : label}
      className={[
        "pointer-events-auto flex min-h-[48px] w-full items-center justify-between gap-[8px] rounded-full border px-4 py-2 text-[11px] font-medium uppercase leading-[18px] tracking-[0.12em] transition sm:text-[12px] lg:w-auto lg:justify-start",
        open
          ? "border-[rgba(255,199,92,0.35)] bg-[rgba(255,199,92,0.16)] text-[#ffe4ae]"
          : activeCount
            ? "border-white/14 bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.1)]"
            : "border-white/10 bg-[rgba(255,255,255,0.03)] text-white/90 hover:border-white/16 hover:bg-[rgba(255,255,255,0.06)]"
      ].join(" ")}
    >
      <div className="min-w-0 text-left">{label}</div>
      {activeCount ? (
        <span className="ml-auto rounded-full bg-black/35 px-1.5 text-[10px] leading-[16px] text-white/92">
          {activeCount}
        </span>
      ) : null}
      <Image
        src="/ui/caret-down.svg"
        alt=""
        width={6}
        height={4}
        className={["pointer-events-none", open ? "" : "invert opacity-100"].join(" ")}
      />
    </button>
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

  const [openKey, setOpenKey] = useState<DropdownKey | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const dockRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const triggerRefs = {
    ingredients: useRef<HTMLButtonElement>(null),
    alcohol: useRef<HTMLButtonElement>(null),
    tags: useRef<HTMLButtonElement>(null),
    abv: useRef<HTMLButtonElement>(null)
  };
  const triggerIds: Record<DropdownKey, string> = {
    ingredients: "gallery-filter-trigger-ingredients",
    alcohol: "gallery-filter-trigger-alcohol",
    tags: "gallery-filter-trigger-tags",
    abv: "gallery-filter-trigger-abv"
  };

  useEffect(() => {
    if (!openKey) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (dockRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpenKey(null);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenKey(null);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openKey]);

  useEffect(() => {
    return () => {
      if (debouncedTimer.current) window.clearTimeout(debouncedTimer.current);
    };
  }, []);

  const alcoholIngredients = ingredients.filter((i) =>
    isAlcoholIngredientName(i.name)
  );
  const otherIngredients = ingredients.filter(
    (i) => !isAlcoholIngredientName(i.name)
  );

  const percentTagRegex = useMemo(() => /\b\d+\s*%|\bAlcohol\b/i, []);
  const nonPercentTags = useMemo(
    () => tags.filter((t) => !percentTagRegex.test(t.name)),
    [tags, percentTagRegex]
  );

  const alcoholSlugSet = useMemo(
    () => new Set(alcoholIngredients.map((i) => i.slug)),
    [alcoholIngredients]
  );
  const otherSlugSet = useMemo(
    () => new Set(otherIngredients.map((i) => i.slug)),
    [otherIngredients]
  );

  const ingredientSlugsInAlcohol = selectedIngredientSlugs.filter((s) =>
    alcoholSlugSet.has(s)
  );
  const ingredientSlugsInOther = selectedIngredientSlugs.filter((s) =>
    otherSlugSet.has(s)
  );
  const ingredientNameBySlug = useMemo(
    () => new Map(ingredients.map((ingredient) => [ingredient.slug, ingredient.name])),
    [ingredients]
  );
  const tagNameBySlug = useMemo(
    () => new Map(tags.map((tag) => [tag.slug, tag.name])),
    [tags]
  );
  const activeFilterCount =
    Number(Boolean(q.trim())) +
    selectedTagSlugs.length +
    selectedIngredientSlugs.length +
    Number(selectedAbvMax !== null);

  const debouncedTimer = useRef<number | null>(null);

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
    return list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug];
  }

  function togglePanel(key: DropdownKey) {
    if (openKey === key) {
      setOpenKey(null);
      return;
    }

    const dockRect = dockRef.current?.getBoundingClientRect();
    const triggerRect = triggerRefs[key].current?.getBoundingClientRect();
    const panelWidth = getFilterPanelWidth(key);

    if (dockRect && triggerRect) {
      const relativeLeft = triggerRect.left - dockRect.left;
      const minLeft = 0;
      const maxLeft = Math.max(0, dockRect.width - panelWidth);
      setPanelLeft(Math.max(minLeft, Math.min(relativeLeft, maxLeft)));
    } else {
      setPanelLeft(0);
    }

    setOpenKey(key);
  }

  return (
    <div className="pointer-events-auto relative z-[60] flex w-full flex-col gap-4 overflow-visible text-[#f7edd8]">
      <div className="flex items-center gap-3 overflow-visible md:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-visible bg-black/95 py-1 md:gap-4 md:py-2 lg:flex-row lg:items-center">
          <div className="flex min-w-0 w-full items-center gap-3 lg:flex-1">
            <button
              type="button"
              onClick={() => {
                searchInputRef.current?.focus();
              }}
              aria-label="Focus drink search"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/12 bg-[rgba(255,255,255,0.03)] text-[18px] text-[#f1d38e] transition hover:border-white/22 hover:bg-[rgba(255,255,255,0.07)]"
            >
              <span aria-hidden="true">🍸</span>
            </button>
            <label className="flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-[rgba(255,255,255,0.03)] px-4 text-white/64">
                <span className="sr-only">Search drinks</span>
                <input
                  ref={searchInputRef}
                  key={q}
                  type="search"
                  defaultValue={q}
                  aria-label="Search drinks"
                  placeholder={searchPlaceholder}
                  onFocus={() => setOpenKey(null)}
                  onClick={() => setOpenKey(null)}
                  onChange={(e) => {
                    const nextQ = e.target.value;
                    if (debouncedTimer.current) window.clearTimeout(debouncedTimer.current);
                    debouncedTimer.current = window.setTimeout(() => {
                      replaceUrl({ nextQ });
                    }, 200);
                  }}
                  className="pointer-events-auto min-w-0 flex-1 bg-transparent text-[15px] font-medium leading-[22px] text-white placeholder:text-white/56 outline-none"
                />
            </label>
          </div>

          <div ref={dockRef} className="relative min-w-0 w-full overflow-visible lg:w-auto">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:flex lg:min-w-max lg:items-center lg:gap-2">
              <div className="relative flex items-center justify-center">
                <FilterButton
                  buttonId={triggerIds.ingredients}
                  label="Ingredients"
                  open={openKey === "ingredients"}
                  onClick={() => togglePanel("ingredients")}
                  activeCount={ingredientSlugsInOther.length}
                  buttonRef={triggerRefs.ingredients}
                />
              </div>
              <div className="relative flex items-center justify-center">
                <FilterButton
                  buttonId={triggerIds.alcohol}
                  label="Alcohol"
                  open={openKey === "alcohol"}
                  onClick={() => togglePanel("alcohol")}
                  activeCount={ingredientSlugsInAlcohol.length}
                  buttonRef={triggerRefs.alcohol}
                />
              </div>
              <div className="relative flex items-center justify-center">
                <FilterButton
                  buttonId={triggerIds.tags}
                  label="Tags"
                  open={openKey === "tags"}
                  onClick={() => togglePanel("tags")}
                  activeCount={selectedTagSlugs.length}
                  buttonRef={triggerRefs.tags}
                />
              </div>
              <div className="relative flex items-center justify-center">
                <FilterButton
                  buttonId={triggerIds.abv}
                  label="%"
                  open={openKey === "abv"}
                  onClick={() => togglePanel("abv")}
                  activeCount={selectedAbvMax !== null ? 1 : 0}
                  buttonRef={triggerRefs.abv}
                />
              </div>
            </div>

            {openKey ? (
              <div
                id="gallery-filter-panel"
                ref={panelRef}
                role="dialog"
                aria-modal="false"
                aria-labelledby={triggerIds[openKey]}
                aria-label={`${openKey} filters`}
                className="absolute left-0 top-[calc(100%+10px)] z-[70] max-w-[calc(100vw-32px)] rounded-[24px] border border-white/10 bg-[rgba(0,0,0,0.96)] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.45)] backdrop-blur-[16px]"
                style={{
                  left: panelLeft,
                  width: `min(${getFilterPanelWidth(openKey)}px, calc(100vw - 32px))`
                }}
              >
                {openKey === "ingredients" ? (
                  <MultiSelectPanel
                    items={otherIngredients}
                    selected={ingredientSlugsInOther}
                    searchPlaceholder="Search ingredients…"
                    title="Ingredients"
                    description="Non-alcohol ingredients used in the drinks."
                    onToggle={(slug) => {
                      const next = toggleSlug(selectedIngredientSlugs, slug);
                      replaceUrl({ nextIngredientSlugs: next });
                    }}
                  />
                ) : null}
                {openKey === "alcohol" ? (
                  <MultiSelectPanel
                    items={alcoholIngredients}
                    selected={ingredientSlugsInAlcohol}
                    searchPlaceholder="Search alcohol…"
                    title="Alcohol"
                    description="Spirits, liqueurs, bitters, and wine-based ingredients."
                    onToggle={(slug) => {
                      const next = toggleSlug(selectedIngredientSlugs, slug);
                      replaceUrl({ nextIngredientSlugs: next });
                    }}
                  />
                ) : null}
                {openKey === "tags" ? (
                  <MultiSelectPanel
                    items={nonPercentTags}
                    selected={selectedTagSlugs}
                    searchPlaceholder="Search tags…"
                    title="Tags"
                    description="Flavor, season, and style tags from the drink cards."
                    onToggle={(slug) => {
                      const next = toggleSlug(selectedTagSlugs, slug);
                      replaceUrl({ nextTagSlugs: next });
                    }}
                  />
                ) : null}
                {openKey === "abv" ? (
                  <AbvPanel
                    selected={selectedAbvMax}
                    title="Alcohol %"
                    description="Choose a maximum ABV in 5% increments."
                    onSelect={(next) => {
                      replaceUrl({ nextAbvMax: next });
                      setOpenKey(null);
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
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

      {activeFilterCount ? (
        <div className="hidden w-full flex-wrap items-center gap-2 pt-1 md:flex">
          {q.trim() ? (
            <button
              type="button"
              onClick={() => {
                replaceUrl({ nextQ: "" });
              }}
              className="rounded-[14px] border border-white/12 bg-white/[0.04] px-4 py-2 text-[14px] font-semibold text-white/84"
            >
              Search: {q.trim()} ×
            </button>
          ) : null}

          {selectedIngredientSlugs.map((slug) => (
            <button
              key={`ing:${slug}`}
              type="button"
              onClick={() => {
                const next = selectedIngredientSlugs.filter((value) => value !== slug);
                replaceUrl({ nextIngredientSlugs: next });
              }}
              className="rounded-[14px] border border-white/12 bg-white/[0.04] px-4 py-2 text-[14px] font-semibold text-white/84"
            >
              {ingredientNameBySlug.get(slug) ?? slug} ×
            </button>
          ))}

          {selectedTagSlugs.map((slug) => (
            <button
              key={`tag:${slug}`}
              type="button"
              onClick={() => {
                const next = selectedTagSlugs.filter((value) => value !== slug);
                replaceUrl({ nextTagSlugs: next });
              }}
              className="rounded-[14px] border border-white/12 bg-white/[0.04] px-4 py-2 text-[14px] font-semibold text-white/84"
            >
              {tagNameBySlug.get(slug) ?? slug} ×
            </button>
          ))}

          {selectedAbvMax !== null ? (
            <button
              type="button"
              onClick={() => {
                replaceUrl({ nextAbvMax: null });
              }}
              className="rounded-[14px] border border-white/12 bg-white/[0.04] px-4 py-2 text-[14px] font-semibold text-white/84"
            >
              Up to {selectedAbvMax}% ×
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              replaceUrl({
                nextQ: "",
                nextTagSlugs: [],
                nextIngredientSlugs: [],
                nextAbvMax: null
              });
            }}
            className="rounded-[14px] border border-white/12 bg-transparent px-4 py-2 text-[14px] font-semibold text-white/58 hover:border-white/18 hover:text-white"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MultiSelectPanel({
  items,
  selected,
  searchPlaceholder,
  title,
  description,
  onToggle
}: {
  items: Array<{ id: string; name: string; slug: string }>;
  selected: string[];
  searchPlaceholder: string;
  title: string;
  description: string;
  onToggle: (slug: string) => void;
}) {
  const [filter, setFilter] = useState("");

  const filteredItems = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return items;
    return items.filter((item) => item.name.toLowerCase().includes(f));
  }, [filter, items]);

  return (
    <div>
      <div className="mb-3">
        <div className="text-[12px] font-semibold uppercase leading-[20px] tracking-[0.14em] text-[#f3ddb2]">
          {title}
        </div>
        <div className="text-[12px] leading-[18px] text-white/56">
          {description}
        </div>
      </div>
      <input
        autoFocus
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        aria-label={searchPlaceholder}
        placeholder={searchPlaceholder}
        className="w-full rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[14px] text-[#f7edd8] outline-none placeholder:text-white/42"
      />
      <div className="mt-3 flex max-h-72 flex-wrap gap-2 overflow-auto pr-1 text-[13px] text-[#f7edd8]">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={selected.includes(item.slug)}
            onClick={() => onToggle(item.slug)}
            className={[
              "rounded-full border px-3.5 py-2 text-left transition",
              selected.includes(item.slug)
                ? "border-[rgba(255,199,92,0.34)] bg-[rgba(255,199,92,0.2)] text-[#fff5df]"
                : "border-white/10 bg-[rgba(255,255,255,0.04)] text-white/84 hover:border-white/18 hover:bg-[rgba(255,255,255,0.08)]"
            ].join(" ")}
          >
            <span>{item.name}</span>
          </button>
        ))}
        {!filteredItems.length ? <div className="px-2 py-6 text-white/48">No matches</div> : null}
      </div>
    </div>
  );
}

function AbvPanel({
  selected,
  title,
  description,
  onSelect
}: {
  selected: number | null;
  title: string;
  description: string;
  onSelect: (n: number | null) => void;
}) {
  const options = useMemo(() => {
    const values: number[] = [];
    for (let i = 0; i <= 60; i += 5) values.push(i);
    return values;
  }, []);

  return (
    <div>
      <div className="mb-3">
        <div className="text-[12px] font-semibold uppercase leading-[20px] tracking-[0.14em] text-[#f3ddb2]">
          {title}
        </div>
        <div className="text-[12px] leading-[18px] text-white/56">
          {description}
        </div>
      </div>
      <div className="flex max-h-72 flex-wrap gap-2 overflow-auto pr-1 text-[13px] text-[#f7edd8]">
        <button
          type="button"
          aria-pressed={selected === null}
          onClick={() => onSelect(null)}
          className={[
            "rounded-full border px-3.5 py-2 text-left transition",
            selected === null
              ? "border-[rgba(255,199,92,0.34)] bg-[rgba(255,199,92,0.2)] text-[#fff5df]"
              : "border-white/10 bg-[rgba(255,255,255,0.04)] text-white/84 hover:border-white/18 hover:bg-[rgba(255,255,255,0.08)]"
          ].join(" ")}
        >
          Any %
        </button>
        {options.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={selected === n}
            onClick={() => onSelect(n)}
            className={[
              "rounded-full border px-3.5 py-2 text-left transition",
              selected === n
                ? "border-[rgba(255,199,92,0.34)] bg-[rgba(255,199,92,0.2)] text-[#fff5df]"
                : "border-white/10 bg-[rgba(255,255,255,0.04)] text-white/84 hover:border-white/18 hover:bg-[rgba(255,255,255,0.08)]"
            ].join(" ")}
          >
            Up to {n}%
          </button>
        ))}
      </div>
    </div>
  );
}
