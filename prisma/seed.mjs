import { PrismaClient } from "@prisma/client";
import fs from "node:fs/promises";

const prisma = new PrismaClient();

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function loadSeed() {
  const url = new URL("./drinksSeed.json", import.meta.url);
  const raw = await fs.readFile(url, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const drinksSeed = await loadSeed();

  for (const drink of drinksSeed) {
    const slug = drink.slug ?? slugify(drink.name);

    const scalarData = {
      name: drink.name,
      curiosity: drink.curiosity,
      blurb: drink.blurb ?? null,
      imagePath: drink.imagePath,
      imageCardPath: drink.imageCardPath,
      imageSourceLowRes: Boolean(drink.imageSourceLowRes),
      frontBg: drink.frontBg ?? null,
      baseSpirit: drink.baseSpirit ?? null,
      season: drink.season ?? null,
      alcoholInfo: drink.alcoholInfo ?? null,
      variations: drink.variations ?? null
    };

    try {
      await prisma.$transaction(async (tx) => {
        const drinkRow = await tx.drink.upsert({
          where: { slug },
          update: scalarData,
          create: { slug, ...scalarData },
          select: { id: true }
        });

        await tx.drinkTag.deleteMany({ where: { drinkId: drinkRow.id } });
        await tx.drinkIngredient.deleteMany({ where: { drinkId: drinkRow.id } });
        await tx.recipeStep.deleteMany({ where: { drinkId: drinkRow.id } });

        for (const tagName of drink.tags ?? []) {
          const tagSlug = slugify(tagName);
          const tagRow =
            (await tx.tag.findUnique({
              where: { name: tagName },
              select: { id: true }
            })) ??
            (await tx.tag.findUnique({
              where: { slug: tagSlug },
              select: { id: true }
            })) ??
            (await tx.tag.create({
              data: { name: tagName, slug: tagSlug },
              select: { id: true }
            }));

          await tx.drinkTag.create({
            data: { drinkId: drinkRow.id, tagId: tagRow.id }
          });
        }

        for (const [idx, ing] of (drink.ingredients ?? []).entries()) {
          const ingredientSlug = slugify(ing.name);
          const ingredientRow =
            (await tx.ingredient.findUnique({
              where: { name: ing.name },
              select: { id: true }
            })) ??
            (await tx.ingredient.findUnique({
              where: { slug: ingredientSlug },
              select: { id: true }
            })) ??
            (await tx.ingredient.create({
              data: { name: ing.name, slug: ingredientSlug },
              select: { id: true }
            }));

          await tx.drinkIngredient.create({
            data: {
              drinkId: drinkRow.id,
              ingredientId: ingredientRow.id,
              sortOrder: idx,
              amount: ing.amount ?? null,
              unit: ing.unit ?? null,
              note: ing.note ?? null,
              isGarnish: Boolean(ing.isGarnish)
            }
          });
        }

        for (const [idx, text] of (drink.steps ?? []).entries()) {
          await tx.recipeStep.create({
            data: { drinkId: drinkRow.id, sortOrder: idx, text }
          });
        }
      });
    } catch (err) {
      console.error("Seed failed for drink:", { name: drink.name, slug });
      throw err;
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
