const LOW_RES_IMAGES = [
  "/drinks/aperol-and-limoncello.jpg",
  "/drinks/apple-and-elderflower-gin.jpg",
  "/drinks/appleberry-mulled-wine.jpg",
  "/drinks/bitter-orange-and-cardamom-martinis.jpg",
  "/drinks/bramble.jpg",
  "/drinks/chocolate-orange.jpg",
  "/drinks/claridge-s-sazerac.jpg",
  "/drinks/coco-fizz.jpg",
  "/drinks/courgette-martini.jpg",
  "/drinks/dark-and-stormy-coffee.jpg",
  "/drinks/elderflower-and-cucumber-g-and-ts.jpg",
  "/drinks/elderflower-and-herb-cooler.jpg",
  "/drinks/gimlet.jpg",
  "/drinks/gooseberry-and-elderflower-fizz.jpg",
  "/drinks/grasshopper.jpg",
  "/drinks/hibiscus-and-prosecco.jpg",
  "/drinks/hurricane.jpg",
  "/drinks/mango-and-pineapple-mojito.jpg",
  "/drinks/mezcalita-verde.jpg",
  "/drinks/mulled-gin.jpg",
  "/drinks/mulled-orange-wine.jpg",
  "/drinks/non-alcoholic-punch.jpg",
  "/drinks/orange-blossom-bellinis.jpg",
  "/drinks/passion-fruit-martini.jpg",
  "/drinks/peach-punch.jpg",
  "/drinks/pink-gin-iced-tea.jpg",
  "/drinks/prosecco-and-elderflower.jpg",
  "/drinks/rhubarb-and-custard.jpg",
  "/drinks/rhubarb-gin.jpg",
  "/drinks/salted-caramel-pecan-sour.jpg",
  "/drinks/sloe-gin.jpg",
  "/drinks/snowball.jpg",
  "/drinks/sparkling-mint-and-lemon-juleps.jpg",
  "/drinks/spiced-apple-strudel-and-brandy.jpg",
  "/drinks/strawberry-daiquiri.jpg",
  "/drinks/summer-punch.jpg",
  "/drinks/sweet-manhattan.jpg",
  "/drinks/toffee-apple-sour.jpg",
  "/drinks/vodka-and-cranberry-blush.jpg",
  "/drinks/watermelon-gin-spritzer.jpg",
  "/drinks/white-rabbit.jpg",
  "/drinks/winter-spritz.jpg",
  "/drinks/woo-woo.jpg",
  "/drinks/zombie.jpg",
] as const;

const LOW_RES_IMAGE_SET = new Set<string>(LOW_RES_IMAGES);

export function isLowResImage(imagePath: string) {
  return LOW_RES_IMAGE_SET.has(imagePath);
}

export { LOW_RES_IMAGES };
