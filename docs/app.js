const DATA_URL =
  "https://raw.githubusercontent.com/felps85/mixology-cards/main/prisma/drinksSeed.json";
const IMAGE_BASE =
  "https://raw.githubusercontent.com/felps85/mixology-cards/main/public/drinks/thumbs";

const grid = document.getElementById("grid");
const resultCount = document.getElementById("resultCount");
const searchInput = document.getElementById("searchInput");
const spiritFilter = document.getElementById("spiritFilter");
const tagFilter = document.getElementById("tagFilter");
const abvFilter = document.getElementById("abvFilter");
const dialog = document.getElementById("drinkDialog");
const closeDialog = document.getElementById("closeDialog");

const dialogImage = document.getElementById("dialogImage");
const dialogTitle = document.getElementById("dialogTitle");
const dialogMeta = document.getElementById("dialogMeta");
const dialogCuriosity = document.getElementById("dialogCuriosity");
const dialogIngredients = document.getElementById("dialogIngredients");
const dialogSteps = document.getElementById("dialogSteps");

let drinks = [];

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

function normalizeDrink(drink) {
  const slug = drink.slug ?? slugify(drink.name);
  return {
    ...drink,
    slug,
    abv: parseAbv(drink.alcoholInfo),
    imageUrl: `${IMAGE_BASE}/${slug}.jpg`
  };
}

function populateFilters(items) {
  const spirits = Array.from(
    new Set(items.map((drink) => drink.baseSpirit).filter(Boolean))
  ).sort();
  const tags = Array.from(
    new Set(
      items
        .flatMap((drink) => drink.tags ?? [])
        .filter((tag) => tag && !/%/.test(tag))
    )
  ).sort();

  for (const spirit of spirits) {
    const option = document.createElement("option");
    option.value = spirit;
    option.textContent = spirit;
    spiritFilter.append(option);
  }

  for (const tag of tags) {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    tagFilter.append(option);
  }

  for (let value = 0; value <= 60; value += 5) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `Up to ${value}%`;
    abvFilter.append(option);
  }
}

function currentFilters() {
  return {
    query: searchInput.value.trim().toLowerCase(),
    spirit: spiritFilter.value,
    tag: tagFilter.value,
    abv: abvFilter.value ? Number(abvFilter.value) : null
  };
}

function filteredDrinks() {
  const { query, spirit, tag, abv } = currentFilters();

  return drinks.filter((drink) => {
    const matchesQuery =
      !query ||
      drink.name.toLowerCase().includes(query) ||
      drink.curiosity.toLowerCase().includes(query);
    const matchesSpirit = !spirit || drink.baseSpirit === spirit;
    const matchesTag = !tag || (drink.tags ?? []).includes(tag);
    const matchesAbv = abv === null || drink.abv === null || drink.abv <= abv;

    return matchesQuery && matchesSpirit && matchesTag && matchesAbv;
  });
}

function renderMetaPills(chips, accent) {
  return chips
    .filter(Boolean)
    .map(
      (chip) =>
        `<span class="pill" style="background:${accent}26; color:#fff6e3;">${chip}</span>`
    )
    .join("");
}

function renderGrid(items) {
  resultCount.textContent = `${items.length} drinks on file`;

  if (!items.length) {
    grid.innerHTML =
      '<div class="empty-state">No drinks matched that search. Try clearing one of the filters.</div>';
    return;
  }

  grid.innerHTML = items
    .map((drink) => {
      const accent = drink.frontBg ?? "#dfa74f";
      const chips = [drink.baseSpirit, drink.alcoholInfo, drink.season];
      return `
        <button class="drink-card" type="button" data-slug="${drink.slug}" style="--accent-color:${accent}">
          <img src="${drink.imageUrl}" alt="${drink.name}" loading="lazy" />
          <div class="drink-card__overlay"></div>
          <div class="drink-card__body">
            <div class="pill-row">${renderMetaPills(chips, accent)}</div>
            <h3>${drink.name}</h3>
            <p>${drink.curiosity}</p>
          </div>
        </button>
      `;
    })
    .join("");

  grid.querySelectorAll(".drink-card").forEach((button) => {
    button.addEventListener("click", () => {
      const selected = drinks.find((drink) => drink.slug === button.dataset.slug);
      if (selected) openDialog(selected);
    });
  });
}

function openDialog(drink) {
  dialogImage.src = drink.imageUrl;
  dialogImage.alt = drink.name;
  dialogTitle.textContent = drink.name;
  dialogCuriosity.textContent = drink.curiosity;

  dialogMeta.innerHTML = renderMetaPills(
    [drink.baseSpirit, drink.alcoholInfo, drink.season],
    drink.frontBg ?? "#dfa74f"
  );

  dialogIngredients.innerHTML = (drink.ingredients ?? [])
    .map((ingredient) => {
      const quantity = [ingredient.amount, ingredient.unit].filter(Boolean).join("");
      const detail = [quantity || null, ingredient.note || null]
        .filter(Boolean)
        .join(" · ");
      return `<li><strong>${ingredient.name}</strong>${detail || "To taste"}</li>`;
    })
    .join("");

  dialogSteps.innerHTML = (drink.steps ?? [])
    .map(
      (step, index) =>
        `<li><strong>Step ${index + 1}</strong><span>${step}</span></li>`
    )
    .join("");

  dialog.showModal();
}

async function loadDrinks() {
  try {
    grid.innerHTML = '<div class="loading">Loading drinks from the repository…</div>';
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error("Could not load drink data.");
    const json = await response.json();
    drinks = json.map(normalizeDrink);
    populateFilters(drinks);
    renderGrid(filteredDrinks());
  } catch (error) {
    resultCount.textContent = "Static showcase unavailable";
    grid.innerHTML = `<div class="error-state">${
      error instanceof Error ? error.message : "Something went wrong."
    }</div>`;
  }
}

searchInput.addEventListener("input", () => renderGrid(filteredDrinks()));
spiritFilter.addEventListener("change", () => renderGrid(filteredDrinks()));
tagFilter.addEventListener("change", () => renderGrid(filteredDrinks()));
abvFilter.addEventListener("change", () => renderGrid(filteredDrinks()));
closeDialog.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  const inside =
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom;
  if (!inside) dialog.close();
});

loadDrinks();
