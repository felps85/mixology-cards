import { render, screen } from "@testing-library/react";
import { DrinkCard } from "@/components/DrinkCard";
import type { Drink } from "@prisma/client";

describe("DrinkCard", () => {
  it("renders a gallery card with name and image", () => {
    const drink: Drink = {
      id: "1",
      slug: "mojito",
      name: "Mojito",
      curiosity: "A classic Cuban highball.",
      imagePath: "/drinks/mojito.png",
      blurb: null,
      frontBg: null,
      baseSpirit: "Rum",
      season: "Summer",
      alcoholInfo: "10 – 15% Alcohol",
      variations: null,
      createdAt: new Date(),
      updatedAt: new Date()
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
    expect(img).toHaveAttribute("src", "/drinks/thumbs/mojito.jpg");
  });
});
