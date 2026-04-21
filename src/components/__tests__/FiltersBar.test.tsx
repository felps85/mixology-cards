import { render, screen, waitFor } from "@testing-library/react";
import { FiltersBar } from "@/components/FiltersBar";
import type { Tag } from "@prisma/client";
import type { IngredientFilterOption } from "@/lib/drinks-data";
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

  it("renders one filter trigger and opens a tabbed filter panel", async () => {
    const user = userEvent.setup();
    const tags: Tag[] = [{ id: "t1", name: "Summer", slug: "summer" }];
    const ingredients: IngredientFilterOption[] = [
      { id: "1", name: "Vodka", slug: "vodka", sourceSlugs: ["vodka"] },
      { id: "2", name: "Lime juice", slug: "lime-juice", sourceSlugs: ["lime-juice"] }
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

    expect(screen.getByRole("button", { name: "Open filters" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open filters" }));

    expect(screen.getByRole("tab", { name: "Spirits" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Ingredients" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Tags" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Alcohol %" })).toBeInTheDocument();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Spirits, liqueurs, bitters, and wine-based ingredients.");
    expect(screen.queryByRole("button", { name: "Lime juice" })).not.toBeInTheDocument();
  });

  it("shows the emoji inside the search shell and applies search without submit", async () => {
    const user = userEvent.setup();

    render(
      <FiltersBar
        q=""
        tags={[]}
        ingredients={[]}
        selectedTagSlugs={[]}
        selectedIngredientSlugs={[]}
        selectedAbvMax={null}
      />
    );

    expect(screen.getByText("🍸")).toBeInTheDocument();

    await user.type(screen.getByRole("searchbox", { name: "Search drinks" }), "moj");

    await waitFor(() => {
      const lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
      expect(lastCall).toContain("q=moj");
    });
  });

  it("toggles alcohol, ingredient, and tag pills from the grouped panel", async () => {
    const user = userEvent.setup();
    const tags: Tag[] = [{ id: "t1", name: "Summer", slug: "summer" }];
    const ingredients: IngredientFilterOption[] = [
      { id: "1", name: "Vodka", slug: "vodka", sourceSlugs: ["vodka"] },
      { id: "2", name: "Lime juice", slug: "lime-juice", sourceSlugs: ["lime-juice"] }
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

    await user.click(screen.getByRole("button", { name: "Open filters" }));
    await user.click(screen.getByRole("button", { name: "Vodka" }));

    let lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("ing=vodka");

    await user.click(screen.getByRole("tab", { name: "Ingredients" }));
    await user.click(screen.getByRole("button", { name: "Lime juice" }));
    lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("ing=lime-juice");

    await user.click(screen.getByRole("tab", { name: "Tags" }));
    await user.click(screen.getByRole("button", { name: "Summer" }));
    lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("tag=summer");
  });

  it("shows the selected filter count on the filter button but does not count search", async () => {
    render(
      <FiltersBar
        q="mojito"
        tags={[]}
        ingredients={[]}
        selectedTagSlugs={["summer", "citrus"]}
        selectedIngredientSlugs={["vodka"]}
        selectedAbvMax={15}
      />
    );

    expect(screen.getByRole("button", { name: "Open filters, 4 selected" })).toBeInTheDocument();
  });

  it("lets the tabbed panel change ABV and clear filters", async () => {
    const user = userEvent.setup();

    render(
      <FiltersBar
        q=""
        tags={[]}
        ingredients={[]}
        selectedTagSlugs={["summer"]}
        selectedIngredientSlugs={["vodka"]}
        selectedAbvMax={15}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open filters, 3 selected" }));
    await user.click(screen.getByRole("tab", { name: "Alcohol %" }));
    await user.click(screen.getByRole("button", { name: "Up to 20%" }));

    let lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toContain("abvMax=20");

    await user.click(screen.getByRole("button", { name: "Clear all" }));
    lastCall = replaceMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).not.toContain("tag=");
    expect(lastCall).not.toContain("ing=");
    expect(lastCall).not.toContain("abvMax=");
  });
});
