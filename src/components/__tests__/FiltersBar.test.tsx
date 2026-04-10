import { render, screen, waitFor } from "@testing-library/react";
import { FiltersBar } from "@/components/FiltersBar";
import type { Ingredient, Tag } from "@prisma/client";
import userEvent from "@testing-library/user-event";
import { beforeEach, vi } from "vitest";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({ replace: replaceMock }),
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams("")
  };
});

describe("FiltersBar", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("splits ingredient filters into Alcohol vs Ingredients and auto-applies", async () => {
    const tags: Tag[] = [];
    const ingredients: Ingredient[] = [
      { id: "1", name: "Vodka", slug: "vodka" },
      { id: "2", name: "Lime juice", slug: "lime-juice" }
    ];

    const user = userEvent.setup();
    render(
      <FiltersBar
        q=""
        tags={tags}
        ingredients={ingredients}
        selectedTagSlugs={[]}
        selectedIngredientSlugs={[]}
        selectedAbvMax={null}
      />
    );

    expect(screen.getByRole("button", { name: "Alcohol" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ingredients" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Alcohol" }));

    // Toggle Vodka (alcohol) -> should immediately call router.replace
    const vodkaOption = screen.getByRole("button", { name: "Vodka" });
    await user.click(vodkaOption);

    expect(replaceMock).toHaveBeenCalled();
    const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("ing=vodka");
  });

  it("opens one dropdown at a time and applies search text without submit", async () => {
    const user = userEvent.setup();
    const tags: Tag[] = [{ id: "t1", name: "Summer", slug: "summer" }];
    const ingredients: Ingredient[] = [
      { id: "1", name: "Vodka", slug: "vodka" },
      { id: "2", name: "Lime juice", slug: "lime-juice" }
    ];

    render(
      <FiltersBar
        q=""
        tags={tags}
        ingredients={ingredients}
        selectedTagSlugs={[]}
        selectedIngredientSlugs={[]}
        selectedAbvMax={null}
      />
    );

    await user.click(screen.getByRole("button", { name: "Ingredients" }));
    expect(screen.getByPlaceholderText("Search ingredients…")).toBeInTheDocument();
    expect(screen.getByText("Non-alcohol ingredients used in the drinks.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(screen.queryByPlaceholderText("Search ingredients…")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search tags…")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search drinks…"), "moj");

    await waitFor(() => {
      const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("q=moj");
    });
  });

  it("renders active filter chips and removes them without reopening dropdowns", async () => {
    const user = userEvent.setup();
    const tags: Tag[] = [{ id: "t1", name: "Summer", slug: "summer" }];
    const ingredients: Ingredient[] = [
      { id: "1", name: "Vodka", slug: "vodka" }
    ];

    render(
      <FiltersBar
        q="mojito"
        tags={tags}
        ingredients={ingredients}
        selectedTagSlugs={["summer"]}
        selectedIngredientSlugs={["vodka"]}
        selectedAbvMax={15}
      />
    );

    await user.click(screen.getByRole("button", { name: "Summer ×" }));

    const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).not.toContain("tag=summer");
    expect(screen.getByRole("button", { name: /Clear all/i })).toBeInTheDocument();
  });

  it("reflects selected filters on the dropdown trigger and inside the menu", async () => {
    const user = userEvent.setup();
    const tags: Tag[] = [
      { id: "t1", name: "Summer", slug: "summer" },
      { id: "t2", name: "Citrus", slug: "citrus" }
    ];
    const ingredients: Ingredient[] = [
      { id: "1", name: "Vodka", slug: "vodka" },
      { id: "2", name: "Lime juice", slug: "lime-juice" }
    ];

    render(
      <FiltersBar
        q=""
        tags={tags}
        ingredients={ingredients}
        selectedTagSlugs={["summer", "citrus"]}
        selectedIngredientSlugs={["vodka"]}
        selectedAbvMax={10}
      />
    );

    expect(screen.getByRole("button", { name: "Tags 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alcohol 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "% 1" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Tags/i }));

    expect(screen.getAllByText("Summer")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "Summer" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "Citrus" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("keeps tags and alcohol percentage in separate dropdowns with expected options", async () => {
    const user = userEvent.setup();
    const tags: Tag[] = [
      { id: "t1", name: "Summer", slug: "summer" },
      { id: "t2", name: "15% ABV", slug: "15-abv" }
    ];

    render(
      <FiltersBar
        q=""
        tags={tags}
        ingredients={[]}
        selectedTagSlugs={[]}
        selectedIngredientSlugs={[]}
        selectedAbvMax={null}
      />
    );

    await user.click(screen.getByRole("button", { name: "Tags" }));
    expect(screen.getByRole("button", { name: "Summer" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "15% ABV" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "%" }));
    expect(screen.getByText("Choose a maximum ABV in 5% increments.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Up to 0%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Up to 5%" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Up to 60%" })).toBeInTheDocument();
  });

  it("lets the ABV filter change and clear after selection", async () => {
    const user = userEvent.setup();

    render(
      <FiltersBar
        q=""
        tags={[]}
        ingredients={[]}
        selectedTagSlugs={[]}
        selectedIngredientSlugs={[]}
        selectedAbvMax={15}
      />
    );

    await user.click(screen.getByRole("button", { name: "% 1" }));
    await user.click(screen.getByRole("button", { name: "Up to 20%" }));

    let lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("abvMax=20");

    await user.click(screen.getByRole("button", { name: "% 1" }));
    await user.click(screen.getByRole("button", { name: "Any %" }));

    lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).not.toContain("abvMax=");
  });
});
