const DATA_URL = "./drinksSeed.json";
const PAGES_ASSET_BASE = "./drinks";
const RAW_PUBLIC_BASE =
  "https://raw.githubusercontent.com/felps85/mixology-cards/main/public";
const PLACEHOLDER_IMAGE = `${PAGES_ASSET_BASE}/placeholder.svg`;
const LOW_RES_IMAGES = new Set([
  "/drinks/white-russian.png",
]);
const FILTER_PANEL_WIDTHS = {
  ingredients: 760,
  alcohol: 680,
  tags: 520,
  abv: 340
};

const searchInput = document.getElementById("searchInput");
const searchDock = document.getElementById("searchDock");
const filterCluster = document.getElementById("filterCluster");
const dropdownPanel = document.getElementById("dropdownPanel");
const activeFilters = document.getElementById("activeFilters");
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

const filterButtons = Object.fromEntries(
  Array.from(document.querySelectorAll("[data-filter-button]")).map((button) => [
    button.dataset.filterButton,
    button
  ])
);

const state = {
  query: "",
  ingredientSlugs: [],
  tagSlugs: [],
  abvMax: null,
  selectedSlug: null,
  openPanel: null,
  panelSearch: {
    ingredients: "",
    alcohol: "",
    tags: ""
  }
};

const store = {
  drinks: [],
  ingredients: [],
  alcoholIngredients: [],
  otherIngredients: [],
  tags: []
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
    openPanel: null
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

function galleryImageSrc(path) {
  return fullImageSrc(path);
}

function fullImageSrc(path) {
  if (/^\/drinks\/.+\.(png|jpe?g|svg)$/i.test(path)) {
    return `.${path}`;
  }

  return path.startsWith("http") ? path : `${RAW_PUBLIC_BASE}${path}`;
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
    steps,
    abv: parseAbv(drink.alcoholInfo),
    imageThumbUrl: galleryImageSrc(drink.imagePath),
    imageFullUrl: fullImageSrc(drink.imagePath)
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
  const ingredients = uniqueBySlug(
    drinks.flatMap((drink) => drink.ingredients).sort((a, b) => a.name.localeCompare(b.name))
  );
  const tags = uniqueBySlug(
    drinks
      .flatMap((drink) => drink.tags)
      .filter((tag) => !/\b\d+\s*%|\balcohol\b/i.test(tag.name))
      .sort((a, b) => a.name.localeCompare(b.name))
  );

  store.drinks = drinks;
  store.ingredients = ingredients;
  store.alcoholIngredients = ingredients.filter((item) =>
    isAlcoholIngredientName(item.name)
  );
  store.otherIngredients = ingredients.filter(
    (item) => !isAlcoholIngredientName(item.name)
  );
  store.tags = tags;
}

function panelWidthForKey(key) {
  return FILTER_PANEL_WIDTHS[key] ?? FILTER_PANEL_WIDTHS.ingredients;
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
      state.ingredientSlugs.every((slug) => drink.ingredientSlugs.includes(slug));
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
  const counts = {
    ingredients: state.ingredientSlugs.filter((slug) =>
      store.otherIngredients.some((item) => item.slug === slug)
    ).length,
    alcohol: state.ingredientSlugs.filter((slug) =>
      store.alcoholIngredients.some((item) => item.slug === slug)
    ).length,
    tags: state.tagSlugs.length,
    abv: state.abvMax !== null ? 1 : 0
  };

  for (const [key, button] of Object.entries(filterButtons)) {
    const count = counts[key] ?? 0;
    button.classList.toggle("is-open", state.openPanel === key);
    button.classList.toggle("is-active", count > 0);
    const countNode = button.querySelector(`[data-count-for="${key}"]`);
    if (countNode) {
      countNode.textContent = count ? String(count) : "";
      countNode.classList.toggle("has-value", count > 0);
    }
  }
}

function renderActiveFilters() {
  activeFilters.replaceChildren();

  function appendChip(label, action, { slug = null, clear = false } = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = clear ? "chip-btn chip-btn--clear" : "chip-btn";
    button.dataset.action = action;
    if (slug) {
      button.dataset.slug = slug;
    }
    button.textContent = label;
    activeFilters.append(button);
  }

  if (state.query.trim()) {
    appendChip(`Search: ${state.query.trim()} ×`, "clear-query");
  }

  for (const slug of state.ingredientSlugs) {
    const item = store.ingredients.find((entry) => entry.slug === slug);
    appendChip(`${item?.name ?? slug} ×`, "remove-ingredient", { slug });
  }

  for (const slug of state.tagSlugs) {
    const item = store.tags.find((entry) => entry.slug === slug);
    appendChip(`${item?.name ?? slug} ×`, "remove-tag", { slug });
  }

  if (state.abvMax !== null) {
    appendChip(`Up to ${state.abvMax}% ×`, "clear-abv");
  }

  const hasChips = activeFilters.childElementCount > 0;
  if (hasChips) {
    appendChip("Clear all", "clear-all", { clear: true });
  }

  activeFilters.classList.toggle("is-hidden", !hasChips);
}

function renderPanel() {
  updateFilterButtons();

  if (!state.openPanel) {
    dropdownPanel.classList.add("is-hidden");
    dropdownPanel.innerHTML = "";
    return;
  }

  const button = filterButtons[state.openPanel];
  const dockRect = searchDock.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  const panelWidth = panelWidthForKey(state.openPanel);
  const relativeLeft = buttonRect.left - dockRect.left;
  const minLeft = 0;
  const maxLeft = Math.max(0, dockRect.width - panelWidth);
  const left = Math.max(minLeft, Math.min(relativeLeft, maxLeft));

  dropdownPanel.style.left = `${left}px`;
  dropdownPanel.style.width = `${panelWidth}px`;
  dropdownPanel.classList.remove("is-hidden");

  if (state.openPanel === "abv") {
    const options = Array.from({ length: 13 }, (_, index) => index * 5);
    dropdownPanel.innerHTML = `
      <div class="panel-heading">
        <div class="panel-title">Alcohol %</div>
        <div class="panel-description">Choose a maximum ABV in 5% increments.</div>
      </div>
      <div class="option-grid option-grid--compact">
        <button type="button" class="option-card ${state.abvMax === null ? "is-selected" : ""}" data-action="set-abv" data-value="">
          <span>Any %</span>
        </button>
        ${options
          .map(
            (value) => `
              <button
                type="button"
                class="option-card ${state.abvMax === value ? "is-selected" : ""}"
                data-action="set-abv"
                data-value="${value}"
              >
                <span>Up to ${value}%</span>
              </button>
            `
          )
          .join("")}
      </div>
    `;
    return;
  }

  const config =
    state.openPanel === "ingredients"
      ? {
          title: "Ingredients",
          description: "Non-alcohol ingredients used in the drinks.",
          placeholder: "Search ingredients…",
          items: store.otherIngredients,
          selected: state.ingredientSlugs
        }
      : state.openPanel === "alcohol"
        ? {
            title: "Alcohol",
            description: "Spirits, liqueurs, bitters, and wine-based ingredients.",
            placeholder: "Search alcohol…",
            items: store.alcoholIngredients,
            selected: state.ingredientSlugs
          }
        : {
            title: "Tags",
            description: "Flavor, season, and style tags from the drink cards.",
            placeholder: "Search tags…",
            items: store.tags,
            selected: state.tagSlugs
          };

  const filter = state.panelSearch[state.openPanel] ?? "";
  const filteredItems = config.items.filter((item) =>
    item.name.toLowerCase().includes(filter.trim().toLowerCase())
  );

  dropdownPanel.innerHTML = `
    <div class="panel-heading">
      <div class="panel-title">${config.title}</div>
      <div class="panel-description">${config.description}</div>
    </div>
    <input
      id="panelSearch"
      class="panel-search"
      type="search"
      placeholder="${config.placeholder}"
      value="${escapeHtml(filter)}"
    />
    <div class="option-grid ${state.openPanel === "tags" ? "option-grid--compact" : ""}">
      ${
        filteredItems.length
          ? filteredItems
              .map(
                (item) => `
                  <button
                    type="button"
                    class="option-card ${config.selected.includes(item.slug) ? "is-selected" : ""}"
                    aria-pressed="${config.selected.includes(item.slug) ? "true" : "false"}"
                    data-action="toggle-option"
                    data-kind="${state.openPanel === "tags" ? "tag" : "ingredient"}"
                    data-slug="${item.slug}"
                  >
                    <span>${escapeHtml(item.name)}</span>
                  </button>
                `
              )
              .join("")
          : `<div class="option-card"><span>No matches</span></div>`
      }
    </div>
  `;

  const panelSearch = dropdownPanel.querySelector("#panelSearch");
  if (panelSearch) {
    panelSearch.focus();
    panelSearch.addEventListener("input", (event) => {
      state.panelSearch[state.openPanel] = event.target.value;
      renderPanel();
    });
  }
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
      const lowResClass = LOW_RES_IMAGES.has(drink.imagePath) ? "is-low-res" : "";
      return `
        <button class="drink-card ${state.selectedSlug === drink.slug ? "is-selected" : ""} ${lowResClass}" type="button" data-action="open-drink" data-slug="${drink.slug}">
          <div class="drink-card__image-backdrop" style="background-image:url('${drink.imageThumbUrl}')"></div>
          <img src="${drink.imageThumbUrl}" alt="${escapeHtml(
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
    return;
  }

  const accent = drink.frontBg ?? "#FFE86C";
  dialog
    .querySelector(".drink-dialog__image-wrap")
    ?.classList.toggle("is-low-res", LOW_RES_IMAGES.has(drink.imagePath));
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
}

function render() {
  const items = filteredDrinks();
  searchInput.value = state.query;
  syncLocation();
  renderActiveFilters();
  renderPanel();
  renderGrid(items);
  syncDialog(items);
}

function openPanel(key) {
  state.openPanel = state.openPanel === key ? null : key;
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
  state.openPanel = null;
  renderPanel();
});

filterCluster.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter-button]");
  if (filterButton) {
    openPanel(filterButton.dataset.filterButton);
    return;
  }

  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) return;

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
    state.openPanel = null;
    render();
  }
});

activeFilters.addEventListener("click", (event) => {
  const actionNode = event.target.closest("[data-action]");
  if (!actionNode) return;

  switch (actionNode.dataset.action) {
    case "clear-query":
      state.query = "";
      searchInput.value = "";
      break;
    case "remove-ingredient":
      state.ingredientSlugs = state.ingredientSlugs.filter(
        (slug) => slug !== actionNode.dataset.slug
      );
      break;
    case "remove-tag":
      state.tagSlugs = state.tagSlugs.filter((slug) => slug !== actionNode.dataset.slug);
      break;
    case "clear-abv":
      state.abvMax = null;
      break;
    case "clear-all":
      state.query = "";
      searchInput.value = "";
      state.ingredientSlugs = [];
      state.tagSlugs = [];
      state.abvMax = null;
      break;
    default:
      break;
  }

  render();
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
  state.openPanel = null;
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
    state.openPanel = null;
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
  state.openPanel = null;
  render();
});

async function loadDrinks() {
  try {
    grid.innerHTML = '<div class="loading">Loading drinks…</div>';
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Could not load drink data.");
    const json = await response.json();
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
