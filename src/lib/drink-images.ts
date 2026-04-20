export function isLowResDrink(
  drink: boolean | { imageSourceLowRes?: boolean | null } | null | undefined
) {
  if (typeof drink === "boolean") return drink;
  return Boolean(drink?.imageSourceLowRes);
}
