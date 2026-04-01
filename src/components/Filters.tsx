import Link from "next/link";
import type { Ingredient, Tag } from "@prisma/client";

export function Filters({
  q,
  tags,
  ingredients,
  selectedTagSlugs,
  selectedIngredientSlugs
}: {
  q: string;
  tags: Tag[];
  ingredients: Ingredient[];
  selectedTagSlugs: string[];
  selectedIngredientSlugs: string[];
}) {
  return (
    <form className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <label className="block text-sm font-medium text-white/80">
        Search
      </label>
      <input
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Mojito, gin..."
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20"
      />

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-white/80">Tags</h2>
          <span className="text-xs text-white/50">{tags.length}</span>
        </div>
        <div className="mt-2 max-h-52 space-y-1 overflow-auto pr-1">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5"
            >
              <input
                type="checkbox"
                name="tag"
                value={tag.slug}
                defaultChecked={selectedTagSlugs.includes(tag.slug)}
              />
              <span className="text-sm">{tag.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-white/80">Ingredients</h2>
          <span className="text-xs text-white/50">{ingredients.length}</span>
        </div>
        <div className="mt-2 max-h-52 space-y-1 overflow-auto pr-1">
          {ingredients.map((ing) => (
            <label
              key={ing.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 hover:bg-white/5"
            >
              <input
                type="checkbox"
                name="ing"
                value={ing.slug}
                defaultChecked={selectedIngredientSlugs.includes(ing.slug)}
              />
              <span className="text-sm">{ing.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="submit"
          className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-white/90"
        >
          Apply
        </button>
        <Link
          href="/"
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80 hover:bg-white/5"
        >
          Reset
        </Link>
      </div>
    </form>
  );
}
