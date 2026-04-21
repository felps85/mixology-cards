# Components

This folder has two kinds of UI pieces:

- Active gallery components used by the current app shell
- Legacy/experimental components kept for reference so we do not break old routes by accident

## Active components

- `FiltersBar.tsx`
  - Main search + filter control surface
  - Mobile contract: fixed top bar with search and the single filter trigger on one row
  - Desktop contract: single unified toolbar row with one grouped filter sheet
- `DrinkCard.tsx`
  - Gallery card used in the main grid
  - Handles low-resolution image fallback behavior
- `GalleryDrinkPanel.tsx`
  - Fullscreen selected-drink experience
  - Desktop contract: split layout
  - Mobile contract: scrollable sheet with sticky close button
- `Header.tsx`
  - Shared detail-page header for `/drink/[slug]`

## Legacy components

- `Filters.tsx`
- `FlipDrinkCard.tsx`
- `FlipDrinkPanel.tsx`
- `SignInPanel.tsx`

These are not part of the current gallery flow. Keep them isolated unless we intentionally revive those patterns.

## Behavior source of truth

For future UI changes, update both:

- `/Users/eldorado/Documents/Codex/drinks/src/...` for the Next app
- `/Users/eldorado/Documents/Codex/drinks/docs/...` for the GitHub Pages build

And check `/Users/eldorado/Documents/Codex/drinks/docs/design-system.md` before changing layout or interaction rules.
