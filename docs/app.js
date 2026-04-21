const DATA_URL = "./drinksSeed.json";
const ALIASES_URL = "./ingredientAliases.json";
const PAGES_ASSET_BASE = "./drinks";
const PLACEHOLDER_IMAGE = `${PAGES_ASSET_BASE}/placeholder.svg`;
const FILTER_PANEL_WIDTH = 860;
const FILTER_TABS = [
  {
    id: "alcohol",
    label: "Spirits",
    description: "Spirits, liqueurs, bitters, and wine-based ingredients."
  },
  {
    id: "ingredients",
    label: "Ingredients",
    description: "Non-alcohol ingredients used in the drinks."
  },
  {
    id: "tags",
    label: "Tags",
    description: "Flavor, season, and style tags from the drink cards."
  },
  {
    id: "abv",
    label: "Alcohol %",
    description: "Choose a maximum ABV in 5% increments."
  }
];

const searchInput = document.getElementById("searchInput");
const searchDock = document.getElementById("searchDock");
const filterButton = document.getElementById("filterButton");
const dropdownPanel = document.getElementById("dropdownPanel");
const grid = document.getElementById("grid");

const dialog = document.getElementById("drinkDialog");
const closeDialogButtons = document.querySelectorAll("[data-close-dialog]");
const dialogImage = document.getElementById("dialogImage");
const dialogImageBackdrop = document.getElementById("dialogImageBackdrop");
const dialogAccentBar = document.getElementById("dialogAccentBar");
const dialogTitle = document.getElementById("dialogTitle");
const dialogMeta = document.getElementById("dialogMeta");
const dialogCuriosity = document.getElementById("dialogCuriosity");
const dialogIngredientCount = document.getElementById("dialogIngredientCount");
const dialogIngredients = document.getElementById("dialogIngredients");
const dialogSteps = document.getElementById("dialogSteps");
const dialogPanel = document.querySelector(".drink-dialog__panel");
let previousFocusedElement = null;

const state = {
  query: "",
  ingredientSlugs: [],
  tagSlugs: [],
  abvMax: null,
  selectedSlug: null,
  openPanel: false,
  activeTab: "alcohol"
};

const store = {
  drinks: [],
  ingredients: [],
  alcoholIngredients: [],
  otherIngredients: [],
  tags: [],
  ingredientAliases: {}
};

function parseStateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  return {
    query: params.get("q") ?? "",
    ingredientSlugs: params.getAll("ing"),
    tagSlugs: params.getAll("tag"),
    abvMax:
      params.get("abvMax") && /^\d+$/.test(params.get("abvMax"))
        ? Number(params.get("abvMax"))
        : null,
    selectedSlug: params.get("sel"),
    openPanel: false,
    activeTab: "alcohol"
  };
}

function syncLocation() {
  const params = new URLSearchParams();
  if (state.query.trim()) params.set("q", state.query.trim());
  for (const slug of state.tagSlugs) params.append("tag", slug);
  for (const slug of state.ingredientSlugs) params.append("ing", slug);
  if (state.abvMax !== null) params.set("abvMax", String(state.abvMax));
  if (state.selectedSlug) params.set("sel", state.selectedSlug);
  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  const currentUrl = `${window.location.pathname}${window.location.search}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState({}, "", nextUrl);
  }
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function ingredientCanonicalDescriptor(name) {
  const raw = name.trim();
  const lower = raw.toLowerCase();
  const alias = store.ingredientAliases[lower];

  return {
    key: alias ? alias.toLowerCase() : lower,
    aliasDisplay: alias ?? null
  };
}

function parseAbv(value) {
  if (!value) return null;
  const nums = value.match(/\d+/g)?.map(Number) ?? [];
  return nums.length ? Math.max(...nums) : null;
}

function isAlcoholIngredientName(name) {
  const n = name.toLowerCase();
  return [
    "vodka",
    "gin",
    "rum",
    "tequila",
    "whisky",
    "whiskey",
    "bourbon",
    "scotch",
    "brandy",
    "cognac",
    "vermouth",
    "prosecco",
    "champagne",
    "wine",
    "sherry",
    "aperol",
    "amaretto",
    "cointreau",
    "triple sec",
    "curaçao",
    "curacao",
    "liqueur",
    "bitters"
  ].some((keyword) => n.includes(keyword));
}

function fullImageSrc(path) {
  if (/^\/drinks\/.+\.(webp|png|jpe?g|svg)$/i.test(path)) {
    return `.${path}`;
  }

  return path;
}

function normalizeDrink(drink) {
  const slug = drink.slug ?? slugify(drink.name);
  const tags = (drink.tags ?? []).map((tag) => ({
    name: tag,
    slug: slugify(tag)
  }));
  const ingredients = (drink.ingredients ?? []).map((ingredient, index) => ({
    id: `${slug}-ingredient-${index}`,
    name: ingredient.name,
    slug: slugify(ingredient.name),
    amount: ingredient.amount ?? null,
    unit: ingredient.unit ?? null,
    note: ingredient.note ?? null
  }));
  const steps = (drink.steps ?? []).map((text, index) => ({
    id: `${slug}-step-${index}`,
    sortOrder: index,
    text
  }));

  return {
    ...drink,
    slug,
    tags,
    tagSlugs: tags.map((tag) => tag.slug),
    ingredients,
    ingredientSlugs: ingredients.map((ingredient) => ingredient.slug),
    filterIngredientSlugs: Array.from(
      new Set(
        ingredients.map((ingredient) =>
          slugify(ingredientCanonicalDescriptor(ingredient.name).key)
        )
      )
    ),
    steps,
    abv: parseAbv(drink.alcoholInfo),
    imageCardUrl: fullImageSrc(drink.imageCardPath ?? drink.imagePath),
    imageFullUrl: fullImageSrc(drink.imagePath),
    imageSourceLowRes: Boolean(drink.imageSourceLowRes)
  };
}

function uniqueBySlug(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function buildCatalog(drinks) {
  const ingredientGroups = new Map();

  for (const ingredient of drinks.flatMap((drink) => drink.ingredients)) {
    const canonical = ingredientCanonicalDescriptor(ingredient.name);
    const canonicalSlug = slugify(canonical.key);
    const group =
      ingredientGroups.get(canonicalSlug) ??
      (() => {
        const next = {
          id: canonicalSlug,
          slug: canonicalSlug,
          name: canonical.aliasDisplay,
          displayCounts: new Map(),
          sourceSlugs: new Set()
        };
        ingredientGroups.set(canonicalSlug, next);
        return next;
      })();

    if (!group.name && canonical.aliasDisplay) {
      group.name = canonical.aliasDisplay;
    }
    group.displayCounts.set(
      ingredient.name,
      (group.displayCounts.get(ingredient.name) ?? 0) + 1
    );
    group.sourceSlugs.add(ingredient.slug);
  }

  const ingredients = [...ingredientGroups.values()]
    .map((group) => {
      const displayCandidates = [...group.displayCounts.entries()].sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        const aLower = a[0] === a[0].toLowerCase();
        const bLower = b[0] === b[0].toLowerCase();
        if (aLower !== bLower) return aLower ? -1 : 1;
        return a[0].localeCompare(b[0]);
      });

      return {
        id: group.id,
        slug: group.slug,
        name: group.name ?? displayCandidates[0]?.[0] ?? group.slug,
        sourceSlugs: [...group.sourceSlugs].sort()
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const ingredientNameMap = new Map();
  for (const group of ingredients) {
    for (const sourceSlug of group.sourceSlugs) {
      ingredientNameMap.set(sourceSlug, group.name);
    }
  }

  const normalizedDrinks = drinks.map((drink) => ({
    ...drink,
    ingredients: drink.ingredients.map((ingredient) => ({
      ...ingredient,
      name: ingredientNameMap.get(ingredient.slug) ?? ingredient.name
    }))
  }));

  const tags = uniqueBySlug(
    normalizedDrinks
      .flatMap((drink) => drink.tags)
      .filter((tag) => !/\b\d+\s*%|\balcohol\b/i.test(tag.name))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  store.drinks = normalizedDrinks;
  store.ingredients = ingredients;
  store.alcoholIngredients = ingredients.filter((item) =>
    isAlcoholIngredientName(item.name)
  );
  store.otherIngredients = ingredients.filter(
    (item) => !isAlcoholIngredientName(item.name)
  );
  store.tags = tags;
}

function filteredDrinks() {
  const query = state.query.trim().toLowerCase();

  return store.drinks.filter((drink) => {
    const matchesQuery =
      !query ||
      drink.name.toLowerCase().includes(query) ||
      drink.curiosity.toLowerCase().includes(query);
    const matchesIngredients =
      !state.ingredientSlugs.length ||
      state.ingredientSlugs.every((slug) => drink.filterIngredientSlugs.includes(slug));
    const matchesTags =
      !state.tagSlugs.length ||
      state.tagSlugs.every((slug) => drink.tagSlugs.includes(slug));
    const matchesAbv =
      state.abvMax === null || drink.abv === null || drink.abv <= state.abvMax;

    return matchesQuery && matchesIngredients && matchesTags && matchesAbv;
  });
}

function activeDrinkFrom(items) {
  return state.selectedSlug
    ? items.find((drink) => drink.slug === state.selectedSlug) ?? null
    : null;
}

function renderMetaPills(chips, accent, interactive = false) {
  return chips
    .filter(Boolean)
    .map((chip) => {
      const attrs = interactive
        ? `type="button" class="dialog-meta__pill" data-action="modal-chip" data-chip="${escapeHtml(
            chip
          )}"`
        : `class="dialog-meta__pill"`;
      return `<button ${attrs} style="border-color:${accent}80;background-color:${accent}26;">${escapeHtml(
        chip
      )}</button>`;
    })
    .join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function updateFilterButtons() {
  const count =
    state.ingredientSlugs.length +
    state.tagSlugs.length +
    (state.abvMax !== null ? 1 : 0);

  filterButton.classList.toggle("is-open", state.openPanel);
  filterButton.classList.toggle("is-active", count > 0);
  filterButton.setAttribute("aria-expanded", state.openPanel ? "true" : "false");
  filterButton.setAttribute(
    "aria-label",
    count ? `Open filters, ${count} selected` : "Open filters"
  );

  const countNode = filterButton.querySelector('[data-count-for="filters"]');
  if (countNode) {
    countNode.textContent = count ? String(count) : "";
    countNode.classList.toggle("has-value", count > 0);
  }
}

function selectedTabFallback() {
  if (
    state.ingredientSlugs.some((slug) =>
      store.alcoholIngredients.some((item) => item.slug === slug)
    )
  ) {
    return "alcohol";
  }

  if (
    state.ingredientSlugs.some((slug) =>
      store.otherIngredients.some((item) => item.slug === slug)
    )
  ) {
    return "ingredients";
  }

  if (state.tagSlugs.length) return "tags";
  if (state.abvMax !== null) return "abv";
  return "alcohol";
}

function optionClass(tone, selected) {
  const base =
    "option-card";

  if (!selected) return base;
  if (tone === "ingredients") return `${base} is-selected is-selected--ingredients`;
  if (tone === "tags") return `${base} is-selected is-selected--tags`;
  if (tone === "abv") return `${base} is-selected is-selected--abv`;
  return `${base} is-selected`;
}

function renderFilterSection({ title, description, items, selected, kind, tone }) {
  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div class="panel-title">${title}</div>
        <div class="panel-description">${description}</div>
      </div>
      <div class="option-grid">
        ${items
          .map(
            (item) => `
              <button
                type="button"
                class="${optionClass(tone, selected.includes(item.slug))}"
                aria-pressed="${selected.includes(item.slug) ? "true" : "false"}"
                data-action="toggle-option"
                data-kind="${kind}"
                data-slug="${item.slug}"
              >
                <span>${escapeHtml(item.name)}</span>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderAbvSection() {
  const options = Array.from({ length: 13 }, (_, index) => index * 5);

  return `
    <section class="panel-section">
      <div class="panel-heading">
        <div class="panel-title">Alcohol %</div>
        <div class="panel-description">Choose a maximum ABV in 5% increments.</div>
      </div>
      <div class="option-grid">
        <button type="button" class="${optionClass("abv", state.abvMax === null)}" aria-pressed="${state.abvMax === null ? "true" : "false"}" data-action="set-abv" data-value="">
          <span>Any %</span>
        </button>
        ${options
          .map(
            (value) => `
              <button
                type="button"
                class="${optionClass("abv", state.abvMax === value)}"
                aria-pressed="${state.abvMax === value ? "true" : "false"}"
                data-action="set-abv"
                data-value="${value}"
              >
                <span>Up to ${value}%</span>
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderPanel() {
  updateFilterButtons();

  if (!state.openPanel) {
    dropdownPanel.classList.add("is-hidden");
    dropdownPanel.removeAttribute("aria-labelledby");
    dropdownPanel.innerHTML = "";
    return;
  }

  const dockRect = searchDock.getBoundingClientRect();
  const buttonRect = filterButton.getBoundingClientRect();
  const relativeLeft = buttonRect.right - dockRect.left - FILTER_PANEL_WIDTH;
  const minLeft = 0;
  const maxLeft = Math.max(0, dockRect.width - FILTER_PANEL_WIDTH);
  const left = Math.max(minLeft, Math.min(relativeLeft, maxLeft));

  dropdownPanel.style.left = `${left}px`;
  dropdownPanel.style.width = `${FILTER_PANEL_WIDTH}px`;
  dropdownPanel.setAttribute("aria-labelledby", filterButton.id);
  dropdownPanel.classList.remove("is-hidden");

  const activeTab = FILTER_TABS.find((tab) => tab.id === state.activeTab) ?? FILTER_TABS[0];
  let panelBody = "";

  if (activeTab.id === "alcohol") {
    panelBody = renderFilterSection({
      title: activeTab.label,
      description: activeTab.description,
      items: store.alcoholIngredients,
      selected: state.ingredientSlugs,
      kind: "ingredient",
      tone: "alcohol"
    });
  } else if (activeTab.id === "ingredients") {
    panelBody = renderFilterSection({
      title: activeTab.label,
      description: activeTab.description,
      items: store.otherIngredients,
      selected: state.ingredientSlugs,
      kind: "ingredient",
      tone: "ingredients"
    });
  } else if (activeTab.id === "tags") {
    panelBody = renderFilterSection({
      title: activeTab.label,
      description: activeTab.description,
      items: store.tags,
      selected: state.tagSlugs,
      kind: "tag",
      tone: "tags"
    });
  } else {
    panelBody = renderAbvSection();
  }

  dropdownPanel.innerHTML = `
    <div class="panel-topbar">
      <div class="panel-tabs" role="tablist" aria-label="Filter categories">
        ${FILTER_TABS.map(
          (tab) => `
            <button
              type="button"
              id="tab-${tab.id}"
              class="panel-tab ${state.activeTab === tab.id ? "is-active" : ""}"
              role="tab"
              aria-selected="${state.activeTab === tab.id ? "true" : "false"}"
              aria-controls="panel-${tab.id}"
              tabindex="${state.activeTab === tab.id ? "0" : "-1"}"
              data-action="set-tab"
              data-tab="${tab.id}"
            >
              ${tab.label}
            </button>
          `
        ).join("")}
      </div>
      ${
        state.ingredientSlugs.length || state.tagSlugs.length || state.abvMax !== null
          ? '<button type="button" class="panel-clear" data-action="clear-filters">Clear all</button>'
          : ""
      }
    </div>
    <div class="panel-sections" id="panel-${activeTab.id}" role="tabpanel" aria-labelledby="tab-${activeTab.id}">
      ${panelBody}
    </div>
  `;
}

function renderGrid(items) {
  if (!items.length) {
    grid.innerHTML =
      '<div class="empty-state">No drinks matched that search. Try clearing one of the filters.</div>';
    return;
  }

  grid.innerHTML = items
    .map((drink) => {
      const accent = drink.frontBg ?? "#dfa74f";
      const chips = [drink.baseSpirit, drink.alcoholInfo, drink.season].filter(Boolean);
      const lowResClass = drink.imageSourceLowRes ? "is-low-res" : "";
      return `
        <button class="drink-card ${state.selectedSlug === drink.slug ? "is-selected" : ""} ${lowResClass}" type="button" data-action="open-drink" data-slug="${drink.slug}">
          <div class="drink-card__image-backdrop" style="background-image:url('${drink.imageCardUrl}')"></div>
          <img src="${drink.imageCardUrl}" alt="${escapeHtml(
            drink.name
          )}" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'" />
          <div class="drink-card__overlay" style="background:radial-gradient(circle at bottom left, ${accent}40, transparent 34%), linear-gradient(180deg, rgba(7,5,7,0) 0%, rgba(7,5,7,0.08) 18%, rgba(7,5,7,0.42) 52%, rgba(7,5,7,0.94) 100%);"></div>
          <div class="drink-card__body">
            <div class="pill-row">
              ${chips
                .map(
                  (chip) => `
                    <span class="pill" style="border:1px solid ${accent}70;background:${accent}26;">${escapeHtml(
                      chip
                    )}</span>
                  `
                )
                .join("")}
            </div>
            <h3>${escapeHtml(drink.name)}</h3>
            <p>${escapeHtml(drink.curiosity)}</p>
          </div>
        </button>
      `;
    })
    .join("");
}

function syncDialog(items) {
  const drink = activeDrinkFrom(items);

  if (!drink) {
    dialog.classList.add("is-hidden");
    dialog.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    previousFocusedElement?.focus?.();
    previousFocusedElement = null;
    return;
  }

  const accent = drink.frontBg ?? "#FFE86C";
  dialog
    .querySelector(".drink-dialog__image-wrap")
    ?.classList.toggle("is-low-res", drink.imageSourceLowRes);
  if (dialogImageBackdrop) {
    dialogImageBackdrop.style.backgroundImage = `url('${drink.imageFullUrl}')`;
  }
  dialogImage.src = drink.imageFullUrl;
  dialogImage.alt = drink.name;
  dialogImage.onerror = () => {
    dialogImage.onerror = null;
    dialogImage.src = PLACEHOLDER_IMAGE;
  };
  dialogAccentBar.style.backgroundColor = accent;
  dialogTitle.textContent = drink.name;
  dialogCuriosity.textContent = drink.curiosity;
  dialogIngredientCount.textContent = `${drink.ingredients.length} item${
    drink.ingredients.length === 1 ? "" : "s"
  }`;

  dialogMeta.innerHTML = renderMetaPills(
    [drink.baseSpirit, drink.alcoholInfo, drink.season],
    accent,
    true
  );

  dialogIngredients.innerHTML = drink.ingredients
    .map((ingredient) => {
      const qty = [ingredient.amount, ingredient.unit].filter(Boolean).join("");
      const detail = [qty || null, ingredient.note || null].filter(Boolean).join(" · ");
      return `
        <li>
          <span class="ingredient-list__dot" style="background:${accent};"></span>
          <div>
            <div class="ingredient-list__name">${escapeHtml(ingredient.name)}</div>
            <div class="ingredient-list__detail">${escapeHtml(detail || "To taste")}</div>
          </div>
        </li>
      `;
    })
    .join("");

  dialogSteps.innerHTML = drink.steps
    .map(
      (step) => `
        <li>
          <div class="step-list__index" style="background:${accent}38;">${step.sortOrder + 1}</div>
          <div>
            <div class="step-list__title">Step ${step.sortOrder + 1}</div>
            <p>${escapeHtml(step.text)}</p>
          </div>
        </li>
      `
    )
    .join("");

  dialog.classList.remove("is-hidden");
  dialog.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (!previousFocusedElement && document.activeElement instanceof HTMLElement) {
    previousFocusedElement = document.activeElement;
  }
  const closeTarget =
    window.matchMedia("(max-width: 840px)").matches
      ? document.getElementById("closeDialogMobile")
      : document.getElementById("closeDialog");
  closeTarget?.focus();
}

function render() {
  const items = filteredDrinks();
  searchInput.value = state.query;
  syncLocation();
  renderPanel();
  renderGrid(items);
  syncDialog(items);
}

function togglePanel() {
  if (!state.openPanel) {
    state.activeTab = selectedTabFallback();
  }
  state.openPanel = !state.openPanel;
  renderPanel();
}

function toggleValue(list, slug) {
  return list.includes(slug)
    ? list.filter((entry) => entry !== slug)
    : [...list, slug];
}

function applyModalChip(chip) {
  const tagSlug = slugify(chip);
  if (/%/.test(chip)) {
    state.abvMax = parseAbv(chip);
  } else if (store.tags.some((tag) => tag.slug === tagSlug)) {
    state.tagSlugs = Array.from(new Set([...state.tagSlugs, tagSlug]));
  }
  state.selectedSlug = null;
  render();
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

searchInput.addEventListener("focus", () => {
  if (!state.openPanel) return;
  state.openPanel = false;
  renderPanel();
});

filterButton.addEventListener("click", () => {
  togglePanel();
});

dropdownPanel.addEventListener("click", (event) => {
  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) return;

  if (actionNode.dataset.action === "set-tab") {
    state.activeTab = actionNode.dataset.tab;
    renderPanel();
    return;
  }

  if (actionNode.dataset.action === "toggle-option") {
    const slug = actionNode.dataset.slug;
    if (actionNode.dataset.kind === "tag") {
      state.tagSlugs = toggleValue(state.tagSlugs, slug);
    } else {
      state.ingredientSlugs = toggleValue(state.ingredientSlugs, slug);
    }
    render();
    return;
  }

  if (actionNode.dataset.action === "set-abv") {
    state.abvMax = actionNode.dataset.value ? Number(actionNode.dataset.value) : null;
    render();
    return;
  }

  if (actionNode.dataset.action === "clear-filters") {
      state.ingredientSlugs = [];
      state.tagSlugs = [];
      state.abvMax = null;
      render();
  }
});

grid.addEventListener("click", (event) => {
  const card = event.target.closest('[data-action="open-drink"]');
  if (!card) return;
  state.selectedSlug = card.dataset.slug;
  render();
});

dialogMeta.addEventListener("click", (event) => {
  const chip = event.target.closest('[data-action="modal-chip"]');
  if (!chip) return;
  applyModalChip(chip.dataset.chip);
});

closeDialogButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.selectedSlug = null;
    render();
  });
});

dialog.addEventListener("click", (event) => {
  if (!dialogPanel.contains(event.target)) {
    state.selectedSlug = null;
    render();
  }
});

document.addEventListener("pointerdown", (event) => {
  if (!state.openPanel) return;
  if (searchDock.contains(event.target)) return;
  state.openPanel = false;
  renderPanel();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;

  if (!dialog.classList.contains("is-hidden")) {
    state.selectedSlug = null;
    render();
    return;
  }

  if (state.openPanel) {
    state.openPanel = false;
    renderPanel();
  }
});

window.addEventListener("resize", () => {
  if (state.openPanel) renderPanel();
});

window.addEventListener("popstate", () => {
  const next = parseStateFromLocation();
  state.query = next.query;
  state.ingredientSlugs = next.ingredientSlugs;
  state.tagSlugs = next.tagSlugs;
  state.abvMax = next.abvMax;
  state.selectedSlug = next.selectedSlug;
  state.openPanel = false;
  render();
});

async function loadDrinks() {
  try {
    grid.innerHTML = '<div class="loading">Loading drinks…</div>';
    const [drinksResponse, aliasesResponse] = await Promise.all([
      fetch(DATA_URL),
      fetch(ALIASES_URL)
    ]);
    if (!drinksResponse.ok) throw new Error("Could not load drink data.");
    if (!aliasesResponse.ok) throw new Error("Could not load ingredient aliases.");
    const [json, aliases] = await Promise.all([
      drinksResponse.json(),
      aliasesResponse.json()
    ]);
    store.ingredientAliases = aliases;
    const drinks = json.map(normalizeDrink);
    buildCatalog(drinks);
    searchInput.placeholder = `Search ${store.drinks.length} drinks...`;
    const next = parseStateFromLocation();
    state.query = next.query;
    state.ingredientSlugs = next.ingredientSlugs;
    state.tagSlugs = next.tagSlugs;
    state.abvMax = next.abvMax;
    state.selectedSlug = next.selectedSlug;
    render();
  } catch (error) {
    searchInput.placeholder = "Search drinks...";
    grid.innerHTML = `<div class="error-state">${
      error instanceof Error ? error.message : "Something went wrong."
    }</div>`;
  }
}

loadDrinks();
