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

type DropdownKey = "ingredients" | "alcohol" | "tags" | "abv";

function FilterButton({
  label,
  open,
  onClick,
  activeCount,
  buttonRef
}: {
  label: string;
  open: boolean;
  onClick: () => void;
  activeCount?: number;
  buttonRef?: RefObject<HTMLButtonElement>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={activeCount ? `${label} ${activeCount}` : label}
      className={[
        "pointer-events-auto flex min-h-[42px] items-center gap-[8px] rounded-full px-3.5 py-2 text-[12px] font-medium uppercase leading-[18px] tracking-[0.12em] transition",
        open
          ? "bg-[linear-gradient(135deg,#e7b15a,#9d6d31)] text-[#1b120d] shadow-[0_16px_32px_rgba(0,0,0,0.28)]"
          : activeCount
            ? "bg-[#161014] text-white hover:bg-[#21171c]"
            : "bg-[#120d10] text-white hover:bg-[#181114]"
      ].join(" ")}
    >
      <div className="min-w-0 text-left">{label}</div>
      {activeCount ? (
        <span className="ml-auto rounded-full bg-black/20 px-1.5 text-[10px] leading-[16px] text-white">
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
  selectedAbvMax
}: {
  q: string;
  tags: Tag[];
  ingredients: Ingredient[];
  selectedTagSlugs: string[];
  selectedIngredientSlugs: string[];
  selectedAbvMax: number | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [openKey, setOpenKey] = useState<DropdownKey | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = {
    ingredients: useRef<HTMLButtonElement>(null),
    alcohol: useRef<HTMLButtonElement>(null),
    tags: useRef<HTMLButtonElement>(null),
    abv: useRef<HTMLButtonElement>(null)
  };

  useEffect(() => {
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenKey(null);
    }

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, []);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (controlsRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpenKey(null);
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

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

  function panelWidthForKey(key: DropdownKey) {
    switch (key) {
      case "abv":
        return 340;
      case "tags":
        return 520;
      case "alcohol":
        return 680;
      case "ingredients":
      default:
        return 760;
    }
  }

  function togglePanel(key: DropdownKey) {
    if (openKey === key) {
      setOpenKey(null);
      return;
    }

    const controlsRect = controlsRef.current?.getBoundingClientRect();
    const triggerRect = triggerRefs[key].current?.getBoundingClientRect();
    const panelWidth = panelWidthForKey(key);

    if (controlsRect && triggerRect) {
      const relativeLeft = triggerRect.left - controlsRect.left;
      const minLeft = -controlsRect.left + 24;
      const maxLeft = window.innerWidth - controlsRect.left - panelWidth - 24;
      setPanelLeft(Math.max(minLeft, Math.min(relativeLeft, maxLeft)));
    } else {
      setPanelLeft(0);
    }

    setOpenKey(key);
  }

  return (
    <div className="pointer-events-auto relative z-[60] flex w-full flex-col gap-4 text-[#f7edd8]">
      <div className="flex w-full flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 pr-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[linear-gradient(180deg,#21181c,#0f0a0c)] shadow-[0_12px_28px_rgba(0,0,0,0.34)]">
            <Image src="/ui/logo.svg" alt="Sipsmith" width={24} height={24} />
          </div>
          <div className="leading-none">
            <div className="text-[13px] font-semibold tracking-[0.2em] text-white">
              Sipsmith
            </div>
            <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/70">
              Speakeasy Index
            </div>
          </div>
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-h-[46px] min-w-[260px] flex-1 items-center gap-3 rounded-full bg-[#120d10] px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_14px_28px_rgba(0,0,0,0.26)]">
            <input
              key={q}
              type="search"
              defaultValue={q}
              placeholder="Search drinks…"
              onChange={(e) => {
                const nextQ = e.target.value;
                if (debouncedTimer.current) window.clearTimeout(debouncedTimer.current);
                debouncedTimer.current = window.setTimeout(() => {
                  replaceUrl({ nextQ });
                }, 200);
              }}
              className="pointer-events-auto min-w-0 flex-1 bg-transparent text-[13px] leading-[20px] text-white placeholder:text-white/45 outline-none"
            />
          </label>

          <div
            ref={controlsRef}
            className="relative flex flex-wrap items-center gap-2 rounded-full bg-[#0d090b]/70 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_16px_30px_rgba(0,0,0,0.24)]"
          >
            <FilterButton
              label="Ingredients"
              open={openKey === "ingredients"}
              onClick={() => togglePanel("ingredients")}
              activeCount={ingredientSlugsInOther.length}
              buttonRef={triggerRefs.ingredients}
            />
            <FilterButton
              label="Alcohol"
              open={openKey === "alcohol"}
              onClick={() => togglePanel("alcohol")}
              activeCount={ingredientSlugsInAlcohol.length}
              buttonRef={triggerRefs.alcohol}
            />
            <FilterButton
              label="Tags"
              open={openKey === "tags"}
              onClick={() => togglePanel("tags")}
              activeCount={selectedTagSlugs.length}
              buttonRef={triggerRefs.tags}
            />
            <FilterButton
              label="%"
              open={openKey === "abv"}
              onClick={() => togglePanel("abv")}
              activeCount={selectedAbvMax !== null ? 1 : 0}
              buttonRef={triggerRefs.abv}
            />
            {openKey ? (
              <div
                ref={panelRef}
                role="dialog"
                aria-label={`${openKey} filters`}
                className="absolute top-[calc(100%+8px)] z-[70] max-w-[calc(100vw-48px)] rounded-[24px] border border-[#e1ad58]/16 bg-[rgba(17,12,14,0.98)] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                style={{
                  left: panelLeft,
                  width: `${panelWidthForKey(openKey)}px`
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
      </div>

      {activeFilterCount ? (
        <div className="flex w-full flex-wrap items-center gap-2 pt-1">
          {q.trim() ? (
            <button
              type="button"
              onClick={() => {
                replaceUrl({ nextQ: "" });
              }}
              className="rounded-full border border-[#e1ad58]/18 bg-[#171115] px-3 py-1 text-[11px] font-medium leading-[18px] text-[#f7edd8]"
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
              className="rounded-full border border-[#e1ad58]/18 bg-[#171115] px-3 py-1 text-[11px] font-medium leading-[18px] text-[#f7edd8]"
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
              className="rounded-full border border-[#e1ad58]/18 bg-[#171115] px-3 py-1 text-[11px] font-medium leading-[18px] text-[#f7edd8]"
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
              className="rounded-full border border-[#e1ad58]/18 bg-[#171115] px-3 py-1 text-[11px] font-medium leading-[18px] text-[#f7edd8]"
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
            className="rounded-full border border-white/10 bg-transparent px-3 py-1 text-[11px] font-medium leading-[18px] text-[#ae9a79] hover:border-[#e1ad58]/22 hover:text-[#f7edd8]"
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
        <div className="text-[13px] font-semibold uppercase leading-[20px] tracking-[0.14em] text-[#f3ddb2]">
          {title}
        </div>
        <div className="text-[12px] leading-[18px] text-[#a89270]">
          {description}
        </div>
      </div>
      <input
        autoFocus
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={searchPlaceholder}
        className="w-full rounded-[14px] border border-white/8 bg-[#120d10] px-3 py-2.5 text-[12px] text-[#f7edd8] outline-none placeholder:text-[#8b7a60]"
      />
      <div className="mt-3 grid max-h-72 gap-2 overflow-auto pr-1 text-[12px] text-[#f7edd8] sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((item) => (
          <label
            key={item.id}
            className={[
              "flex cursor-pointer items-center gap-2 rounded-[14px] border px-3 py-2.5 transition",
              selected.includes(item.slug)
                ? "border-[#e1ad58]/34 bg-[rgba(227,170,76,0.18)] text-[#fff5df]"
                : "border-white/8 bg-[#171115] hover:border-[#e1ad58]/18 hover:bg-[#1b1418]"
            ].join(" ")}
          >
            <input
              type="checkbox"
              value={item.slug}
              checked={selected.includes(item.slug)}
              onChange={() => onToggle(item.slug)}
              className="h-4 w-4 rounded border-[#78664d] bg-transparent text-[#d8a857] focus:ring-[#d8a857]/40"
            />
            <span>{item.name}</span>
          </label>
        ))}
        {!filteredItems.length ? (
          <div className="px-2 py-6 text-[#a89270]">No matches</div>
        ) : null}
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
        <div className="text-[13px] font-semibold uppercase leading-[20px] tracking-[0.14em] text-[#f3ddb2]">
          {title}
        </div>
        <div className="text-[12px] leading-[18px] text-[#a89270]">
          {description}
        </div>
      </div>
      <div className="grid max-h-72 gap-2 overflow-auto pr-1 text-[12px] text-[#f7edd8] sm:grid-cols-2 lg:grid-cols-3">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={[
          "rounded-[14px] border px-3 py-2.5 text-left transition",
          selected === null
            ? "border-[#e1ad58]/34 bg-[rgba(227,170,76,0.18)] text-[#fff5df]"
            : "border-white/8 bg-[#171115] hover:border-[#e1ad58]/18 hover:bg-[#1b1418]"
        ].join(" ")}
      >
        Any %
      </button>
      {options.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onSelect(n)}
          className={[
            "rounded-[14px] border px-3 py-2.5 text-left transition",
            selected === n
              ? "border-[#e1ad58]/34 bg-[rgba(227,170,76,0.18)] text-[#fff5df]"
              : "border-white/8 bg-[#171115] hover:border-[#e1ad58]/18 hover:bg-[#1b1418]"
          ].join(" ")}
        >
          Up to {n}%
        </button>
      ))}
      </div>
    </div>
  );
}
