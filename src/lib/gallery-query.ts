export type GalleryQueryState = {
  q: string;
  tag: string[];
  ing: string[];
  sel: string | null;
  abvMax: number | null;
};

export type GalleryQueryPatch = Partial<GalleryQueryState>;

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function parseGalleryQuery(
  params: Record<string, string | string[] | undefined>
): GalleryQueryState {
  const q = typeof params.q === "string" ? params.q : "";
  const tag = toArray(params.tag);
  const ing = toArray(params.ing);
  const sel = typeof params.sel === "string" ? params.sel : null;
  const abvMax =
    typeof params.abvMax === "string" && /^\d+$/.test(params.abvMax)
      ? Number(params.abvMax)
      : null;

  return { q, tag, ing, sel, abvMax };
}

export function parseGalleryQueryFromSearchParams(
  params: URLSearchParams
): GalleryQueryState {
  return {
    q: params.get("q") ?? "",
    tag: params.getAll("tag"),
    ing: params.getAll("ing"),
    sel: params.get("sel"),
    abvMax:
      params.get("abvMax") && /^\d+$/.test(params.get("abvMax") as string)
        ? Number(params.get("abvMax"))
        : null
  };
}

export function buildGalleryHref(
  state: GalleryQueryState,
  patch: GalleryQueryPatch = {},
  pathname = "/"
) {
  const next: GalleryQueryState = {
    ...state,
    ...patch
  };

  const params = new URLSearchParams();
  if (next.q.trim()) params.set("q", next.q.trim());
  for (const slug of next.tag) params.append("tag", slug);
  for (const slug of next.ing) params.append("ing", slug);
  if (next.abvMax !== null) params.set("abvMax", String(next.abvMax));
  if (next.sel) params.set("sel", next.sel);

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

