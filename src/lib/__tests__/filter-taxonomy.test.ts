import { describe, expect, it } from "vitest";
import {
  formatFilterLabel,
  isAlcoholIngredientOption,
  isSpiritTagSlug,
  splitIngredientFilterOptions,
  splitTagFilterOptions
} from "@/lib/filter-taxonomy";

describe("filter taxonomy", () => {
  it("splits spirit tags from style tags and drops percent tags", () => {
    const { spiritTags, styleTags } = splitTagFilterOptions([
      { id: "1", slug: "vodka", name: "Vodka" },
      { id: "5", slug: "pimm-s", name: "Pimm's" },
      { id: "2", slug: "summer", name: "Summer" },
      { id: "3", slug: "mocktail", name: "Mocktail" },
      { id: "4", slug: "10-15-alcohol", name: "10 – 15% Alcohol" }
    ]);

    expect(spiritTags.map((item) => item.slug)).toEqual(["pimm-s", "vodka"]);
    expect(styleTags.map((item) => item.slug)).toEqual(["mocktail", "summer"]);
  });

  it("keeps obvious non-alcohol ingredients out of spirits and catches spirit false negatives", () => {
    const { spiritIngredients, otherIngredients } = splitIngredientFilterOptions([
      { id: "1", slug: "campari", name: "Campari", sourceSlugs: ["campari"] },
      { id: "0", slug: "cacha-a", name: "Cachaça", sourceSlugs: ["cacha-a"] },
      { id: "2", slug: "ginger-beer", name: "ginger beer", sourceSlugs: ["ginger-beer"] },
      {
        id: "3",
        slug: "sherry-vinegar",
        name: "Sherry vinegar",
        sourceSlugs: ["sherry-vinegar"]
      },
      {
        id: "4",
        slug: "creme-de-violette",
        name: "crème de violette",
        sourceSlugs: ["creme-de-violette"]
      }
    ]);

    expect(spiritIngredients.map((item) => item.slug)).toEqual([
      "cacha-a",
      "campari",
      "creme-de-violette"
    ]);
    expect(otherIngredients.map((item) => item.slug)).toEqual([
      "ginger-beer",
      "sherry-vinegar"
    ]);
  });

  it("formats filter labels consistently", () => {
    expect(formatFilterLabel("elderflower cordial")).toBe("Elderflower Cordial");
    expect(formatFilterLabel("crème de violette")).toBe("Crème de Violette");
    expect(formatFilterLabel("pimm's")).toBe("Pimm's");
  });

  it("uses the shared spirit taxonomy helpers", () => {
    expect(isSpiritTagSlug("vodka")).toBe(true);
    expect(isSpiritTagSlug("mocktail")).toBe(false);
    expect(
      isAlcoholIngredientOption({
        slug: "ginger",
        sourceSlugs: ["ginger"]
      })
    ).toBe(false);
    expect(
      isAlcoholIngredientOption({
        slug: "shortcross-gin",
        sourceSlugs: ["shortcross-gin"]
      })
    ).toBe(true);
  });
});
