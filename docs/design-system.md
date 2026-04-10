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
  - search sits on the first row
  - filters sit on the second row
  - page content adds enough top padding so cards never sit under the fixed bar
  - the header mark uses a drink emoji instead of a logo asset
  - there is no title/subtitle text in the top bar

### Filter dropdowns

- Only one dropdown can be open at a time
- Clicking outside closes the open dropdown
- Pressing `Escape` closes the open dropdown
- On desktop, dropdowns anchor under the clicked filter
- On mobile, dropdowns use the full available toolbar width and float over the page
- Search input focus closes any open dropdown
- Filter options are pills, not checkbox rows
- Selected pills change color instead of showing a checkmark

### Drink cards

- Cards use image-first presentation with a content-only lower overlay
- Low-resolution images must not be stretched aggressively
- When a source image is low-resolution, prefer:
  - contained foreground image
  - blurred backdrop fill
- Pills should stay compact and readable over the overlay only

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
- Support button placement:
  - desktop: right side of top bar
  - mobile: bottom-left floating button
- Active filter chips:
  - shown on desktop
  - hidden on mobile to preserve space

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
