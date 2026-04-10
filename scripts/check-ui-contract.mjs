import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function assertIncludes(content, pattern, message) {
  if (!content.includes(pattern)) {
    throw new Error(message);
  }
}

function assertMatches(content, regex, message) {
  if (!regex.test(content)) {
    throw new Error(message);
  }
}

const uiSystem = read("src/lib/ui-system.ts");
const docsIndex = read("docs/index.html");
const docsStyles = read("docs/styles.css");
const docsApp = read("docs/app.js");

assertIncludes(
  uiSystem,
  'export const SUPPORT_LINK = "https://buymeacoffee.com/agorafodeuy";',
  "UI system support link is missing or changed unexpectedly."
);

for (const [key, value] of Object.entries({
  ingredients: 760,
  alcohol: 680,
  tags: 520,
  abv: 340
})) {
  assertIncludes(
    uiSystem,
    `${key}: ${value}`,
    `UI system is missing filter panel width for ${key}.`
  );
  assertIncludes(
    docsApp,
    `${key}: ${value}`,
    `Pages app is missing filter panel width for ${key}.`
  );
}

assertMatches(
  docsIndex,
  /data-close-dialog/g,
  "Pages dialog close controls are missing."
);

assertIncludes(
  docsStyles,
  ".dialog-mobile-close",
  "Pages styles are missing the mobile sticky close container."
);
assertIncludes(
  docsStyles,
  ".dialog-close--mobile",
  "Pages styles are missing the mobile close button rule."
);
assertIncludes(
  docsStyles,
  "@media (max-width: 840px)",
  "Pages styles are missing the mobile breakpoint contract."
);
assertIncludes(
  docsStyles,
  "position: fixed;",
  "Pages styles are missing the fixed mobile top bar contract."
);
assertIncludes(
  docsStyles,
  "padding-top: 176px;",
  "Pages styles are missing the page offset for the fixed mobile top bar."
);
assertIncludes(
  docsStyles,
  "overflow-y: auto;",
  "Pages styles are missing the scrollable mobile dialog panel."
);
assertIncludes(
  docsStyles,
  "overflow: visible;",
  "Pages styles are missing the mobile dialog body flow."
);

console.log("UI contract check passed.");
