# Mixology Cards Design System

This document is the behavior contract for both app surfaces:

- Next app in `/Users/eldorado/Documents/Codex/drinks/src`
- GitHub Pages mirror in `/Users/eldorado/Documents/Codex/drinks/docs`

If a component changes in one surface, the same interaction should be reflected in the other unless we explicitly document an exception.

## Foundations

- Theme: dark speakeasy
- Background: solid black stage
- Primary text: warm off-white
- Accent: amber/gold from each drink card where available
- Surfaces: translucent charcoal with soft borders and blur
- Radius: rounded cards and rounded full-height panels

## Layout rules

### Gallery shell

- Desktop:
  - top bar sits in the page flow
  - gallery grid fills the page width
  - selecting a drink opens a fullscreen overlay
- Mobile:
  - top bar is fixed
  - search and the filter trigger share the first row
  - page content adds enough top padding so cards never sit under the fixed bar
  - the header mark lives inside the search field as a drink emoji
  - there is no title/subtitle text in the top bar

### Filter dropdowns

- Only one filter sheet can be open at a time
- Clicking outside closes the open filter sheet
- Pressing `Escape` closes the open filter sheet
- The top bar exposes a single icon-only filter trigger with a selected-count badge
- The filter sheet uses category tabs so only one of these sections is shown at a time:
  - Spirits
  - Ingredients
  - Tags
  - Alcohol %
- Search input focus closes the filter sheet
- Filter options are stacked list rows inside each tab, not checkbox rows
- Selected rows change color instead of showing a checkmark
- `Clear all` lives inside the filter sheet, not in a separate chip row
- `Spirits`, `Tags`, and `Ingredients` are mutually exclusive filter categories
- Spirit filters come from the shared card-tag taxonomy, not from loose ingredient-name matching
- Ingredient filter options are normalized so case variants and a few obvious garnish/plural aliases collapse into one filter
- Canonical ingredient names should prefer human-friendly casing in both filters and recipe ingredient lists

### Drink cards

- Cards use image-first presentation with a content-only lower overlay
- Low-resolution images must not be stretched aggressively
- When a source image is low-resolution, prefer:
  - contained foreground image
  - blurred backdrop fill
- Pills should stay compact and readable over the overlay only
- Ingestion and optimization rules live in `/Users/eldorado/Documents/Codex/drinks/docs/drink-image-ingestion.md`

### Fullscreen drink modal

- Desktop:
  - split layout
  - image on the left
  - recipe content on the right
  - right column can scroll internally
- Mobile:
  - whole panel scrolls as one sheet
  - image scrolls with the content
  - close button stays sticky at the top
  - desktop inline close button is hidden

## Component contracts

### `FiltersBar`

- Search placeholder includes the drink count
- Search field includes the `🍸` mark inside the input shell
- The only filter control in the bar is the single icon-only trigger
- Support button placement:
  - desktop: right side of top bar
  - mobile: bottom-left floating button
- Active filter count appears on the filter trigger

### `DrinkCard`

- Hover motion only on non-touch layouts
- Selected state must stay visually distinct
- Overlay should only cover the reading area, not the whole image

### `GalleryDrinkPanel`

- Supports `Escape` to close
- Clicking the backdrop closes the modal
- Tag and ABV pills inside the modal navigate back to filtered gallery state

## Release checklist

Before deploying UI changes:

1. Check `/Users/eldorado/Documents/Codex/drinks/src/components/FiltersBar.tsx`
2. Check `/Users/eldorado/Documents/Codex/drinks/src/components/GalleryDrinkPanel.tsx`
3. Mirror any matching interaction changes in:
   - `/Users/eldorado/Documents/Codex/drinks/docs/index.html`
   - `/Users/eldorado/Documents/Codex/drinks/docs/styles.css`
   - `/Users/eldorado/Documents/Codex/drinks/docs/app.js`
4. Run:
   - `node --check /Users/eldorado/Documents/Codex/drinks/docs/app.js`
   - `DATABASE_URL='file:./dev.db' NEXTAUTH_SECRET='dev-secret' npm run check`
