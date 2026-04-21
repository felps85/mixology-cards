import {
  buildIngredientDisplayMap,
  buildIngredientFilterOptions
} from "@/lib/ingredient-filters";
import { describe, expect, it } from "vitest";

describe("ingredient filter normalization", () => {
  it("prefers human-friendly display casing for canonical options", () => {
    const options = buildIngredientFilterOptions([
      { id: "1", slug: "vodka", name: "vodka" },
      { id: "2", slug: "vodka-alt", name: "Vodka" },
      { id: "3", slug: "lime-juice", name: "lime juice" },
      { id: "4", slug: "lime-juice-alt", name: "Lime juice" }
    ]);

    expect(options.find((option) => option.slug === "vodka")?.name).toBe("Vodka");
    expect(options.find((option) => option.slug === "lime-juice")?.name).toBe(
      "Lime juice"
    );
  });

  it("maps obvious garnish and plural variants to one canonical recipe label", () => {
    const nameMap = buildIngredientDisplayMap([
      { id: "1", slug: "orange-slice", name: "orange slice" },
      { id: "2", slug: "orange", name: "Orange" },
      { id: "3", slug: "mint-leaves", name: "mint leaves" },
      { id: "4", slug: "mint", name: "Mint" }
    ]);

    expect(nameMap.get("orange slice")).toBe("Orange");
    expect(nameMap.get("Orange")).toBe("Orange");
    expect(nameMap.get("mint leaves")).toBe("Mint");
    expect(nameMap.get("Mint")).toBe("Mint");
  });
});
