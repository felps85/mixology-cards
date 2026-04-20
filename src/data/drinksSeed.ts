export type DrinksSeed = Array<{
  slug?: string;
  name: string;
  curiosity: string;
  blurb?: string;
  imagePath: string;
  imageCardPath: string;
  imageSourceLowRes?: boolean;
  frontBg?: string;
  baseSpirit?: string;
  season?: string;
  alcoholInfo?: string;
  tags?: string[];
  ingredients?: Array<{
    name: string;
    amount?: string;
    unit?: string;
    note?: string;
    isGarnish?: boolean;
  }>;
  steps?: string[];
  variations?: string;
}>;

export const drinksSeed: DrinksSeed = [
  {
    name: "Mojito",
    imagePath: "/drinks/detail/mojito.webp",
    imageCardPath: "/drinks/card/mojito.webp",
    frontBg: "#6CFFE2",
    curiosity:
      "Mojito comes from mojar, Spanish for “to wet”, and mojo, a Cuban culinary preparation made from lime.",
    tags: ["Rum", "Summer", "10 – 15% Alcohol"],
    baseSpirit: "Rum",
    season: "Summer",
    alcoholInfo: "10 – 15% Alcohol",
    ingredients: [
      { name: "White rum", amount: "50", unit: "ml" },
      { name: "Lime juice", amount: "25", unit: "ml" },
      { name: "Sugar", amount: "2", unit: "tsp" },
      { name: "Soda water", note: "Top up" },
      { name: "Mint leaves", note: "Muddle", isGarnish: true },
      { name: "Lime", note: "Wedge", isGarnish: true }
    ],
    steps: [
      "Muddle mint with sugar and lime juice in a glass.",
      "Add rum and fill with ice.",
      "Top with soda water and gently stir.",
      "Garnish with mint and lime."
    ]
  },
  {
    name: "Amaretto Sour",
    imagePath: "/drinks/detail/amaretto-sour.webp",
    imageCardPath: "/drinks/card/amaretto-sour.webp",
    frontBg: "#FFE86C",
    curiosity:
      "Legend has it that Leonardo da Vinci's student Bernardino Luini was gifted a drink made from apricot kernels soaked in brandy by a young, widowed innkeeper.",
    tags: ["Amaretto", "Digestif", "10 – 15% Alcohol"],
    baseSpirit: "Amaretto",
    season: "Digestif",
    alcoholInfo: "10 – 15% Alcohol",
    ingredients: [
      { name: "Amaretto", amount: "50", unit: "ml" },
      { name: "Lemon juice", amount: "25", unit: "ml" },
      { name: "Simple syrup", amount: "10", unit: "ml" },
      { name: "Egg white", note: "Optional" },
      { name: "Lemon", note: "Twist", isGarnish: true }
    ],
    steps: [
      "Shake all ingredients (dry shake first if using egg white).",
      "Add ice and shake again until chilled.",
      "Strain into a rocks glass over ice.",
      "Garnish with lemon."
    ]
  },
  {
    name: "Gin & Tonic",
    imagePath: "/drinks/detail/gin-and-tonic.webp",
    imageCardPath: "/drinks/card/gin-and-tonic.webp",
    frontBg: "#F580FF",
    curiosity:
      "Officers in India in the early 19th century mixed gin with quinine tonic to make it more palatable, and the gin and tonic was born.",
    tags: ["Gin", "Summer", "35 – 40% Alcohol"],
    baseSpirit: "Gin",
    season: "Summer",
    alcoholInfo: "35 – 40% Alcohol",
    ingredients: [
      { name: "Gin", amount: "50", unit: "ml" },
      { name: "Tonic water", amount: "150", unit: "ml" },
      { name: "Cucumber", note: "Thin slices", isGarnish: true },
      { name: "Lime", note: "Wedge", isGarnish: true }
    ],
    steps: ["Mix all ingredients in a glass filled with cubed ice."]
  }
];
