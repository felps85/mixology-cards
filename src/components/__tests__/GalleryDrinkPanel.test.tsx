import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GalleryDrinkPanel } from "@/components/GalleryDrinkPanel";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => {
  return {
    useRouter: () => ({ replace: replaceMock })
  };
});

describe("GalleryDrinkPanel", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("closes the fullscreen drink view on Escape", async () => {
    const user = userEvent.setup();

    render(
      <GalleryDrinkPanel
        fullscreen
        galleryQuery={{
          q: "mojito",
          tag: ["summer"],
          ing: ["lime-juice"],
          sel: "mojito",
          abvMax: 15
        }}
        drink={{
          slug: "mojito",
          name: "Mojito",
          imagePath: "/drinks/mojito.png",
          curiosity: "A classic Cuban highball.",
          frontBg: "#D8FF58",
          baseSpirit: "Rum",
          alcoholInfo: "13%",
          season: "Summer",
          ingredients: [
            {
              id: "i1",
              amount: "50",
              unit: "ml",
              note: null,
              ingredient: { name: "White rum" }
            }
          ],
          steps: [{ id: "s1", sortOrder: 0, text: "Build over ice and stir." }]
        }}
      />
    );

    await user.keyboard("{Escape}");

    expect(replaceMock).toHaveBeenCalledWith(
      "/?q=mojito&tag=summer&ing=lime-juice&abvMax=15",
      { scroll: false }
    );
  });
});
