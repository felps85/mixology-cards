# Drink image ingestion rule

This project serves only optimized WebP derivatives for drink images.

## Canonical source location

- Put original source images in `assets/drinks/originals/`
- Do not commit originals; that folder is gitignored
- Use the drink image basename as the stable identifier (example: `mojito.png` -> `mojito`)

## Generated output contract

For each drink, `npm run images:sync` generates:

- card asset: `public/drinks/card/<basename>.webp`
- detail asset: `public/drinks/detail/<basename>.webp`

The seed contract must be:

- `imagePath` -> `/drinks/detail/<basename>.webp`
- `imageCardPath` -> `/drinks/card/<basename>.webp`
- `imageSourceLowRes` -> `true` only when the source image is explicitly allowed below the minimum width

## Budgets and dimensions

- Minimum source width: `1280px`
- Card derivative: `960px` wide, WebP quality `88`, max `160 KB`
- Detail derivative: `1600px` wide, WebP quality `92`, max `400 KB`

## Workflow

1. Put the original file in `assets/drinks/originals/`
2. Run `npm run images:sync`
3. If the source image is below `1280px`, replace it or rerun with an explicit `--allow-low-res=<basename>` exception
4. Run `npm run images:check`
5. Commit only the updated seed and generated WebP derivatives

## Notes

- The app and the GitHub Pages mirror both read from the same generated image contract
- Low-resolution fallback styling is driven by `imageSourceLowRes`, not a hardcoded list
