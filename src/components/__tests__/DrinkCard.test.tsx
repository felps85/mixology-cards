import { render, screen } from "@testing-library/react";
import { DrinkCard } from "@/components/DrinkCard";
import type { GalleryDrink } from "@/lib/drinks-data";

describe("DrinkCard", () => {
  it("renders a gallery card with name and image", () => {
    const drink: GalleryDrink = {
      id: "1",
      slug: "mojito",
      name: "Mojito",
      curiosity: "A classic Cuban highball.",
      imagePath: "/drinks/detail/mojito.webp",
      imageCardPath: "/drinks/card/mojito.webp",
      imageSourceLowRes: false,
      frontBg: null,
      baseSpirit: "Rum",
      alcoholInfo: "10 – 15% Alcohol",
      season: "Summer"
    };

    render(
      <DrinkCard
        drink={drink}
        href="/?sel=mojito"
        selected={false}
        chips={["Rum", "10 – 15% Alcohol", "Summer"]}
      />
    );

    expect(screen.getByText("Mojito")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /mojito/i });
    expect(link).toHaveAttribute("href", "/?sel=mojito");

    const img = screen.getByRole("img", { name: "Mojito" });
    expect(img).toHaveAttribute("src", "/drinks/card/mojito.webp");
  });
});
