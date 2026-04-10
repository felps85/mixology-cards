export type FilterPanelKey = "ingredients" | "alcohol" | "tags" | "abv";

export const SUPPORT_LINK = "https://buymeacoffee.com/agorafodeuy";

export const FILTER_PANEL_WIDTHS: Record<FilterPanelKey, number> = {
  ingredients: 760,
  alcohol: 680,
  tags: 520,
  abv: 340
};

export function getFilterPanelWidth(key: FilterPanelKey) {
  return FILTER_PANEL_WIDTHS[key];
}
