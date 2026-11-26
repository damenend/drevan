import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import axe from "axe-core";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { chromium } from "playwright-core";

const require = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");
const directory = mkdtempSync(path.join(tmpdir(), "drevan-accessibility-"));
const htmlDirectory = process.env.DREVAN_A11Y_HTML_DIR
  ? path.resolve(process.env.DREVAN_A11Y_HTML_DIR)
  : null;
let server;
let browser;
let applicationDatabase;

try {
  mkdirSync(path.join(directory, "data"));
  if (htmlDirectory) mkdirSync(htmlDirectory, { recursive: true });
  process.chdir(directory);
  process.env.SESSION_SECRET = "disposable-accessibility-test";
  const database = new Database("data/game.sqlite");
  try {
    migrate(drizzle(database), {
      migrationsFolder: path.join(root, "drizzle"),
    });
  } finally {
    database.close();
  }
  // Seed the disposable database with the same catalog used by players.
  require("../src/db/seed.ts");
  applicationDatabase = require("../src/db/index.ts").db.$client;
  const { app } = require("../src/app.ts");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.DREVAN_CHROMIUM,
  });
  console.log(`Chromium ${browser.version()}, axe-core ${axe.version}`);

  const context = await browser.newContext({
    viewport: { width: 320, height: 768 },
  });
  // Keep the test independent of external font requests.
  await context.route("https://fonts.googleapis.com/**", (route) =>
    route.abort(),
  );
  await context.addInitScript({ content: axe.source });
  const page = await context.newPage();
  let documentResponse;
  page.on("response", (response) => {
    if (
      response.request().resourceType() === "document" &&
      !response.headers().location
    ) {
      documentResponse = response;
    }
  });

  const violations = [];
  /** Scans the current page or the given route and optionally saves the raw response HTML. */
  async function scan(name, route) {
    if (route) await page.goto(base + route);
    await page.waitForLoadState();
    const result = await page.evaluate(async () => {
      const results = await window.axe.run({
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
      });
      return {
        violations: results.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map(({ target }) => target.join(" ")),
          summaries: nodes.map(({ failureSummary }) => failureSummary),
        })),
        width: document.documentElement.scrollWidth,
      };
    });
    if (result.violations.length) violations.push({ name, ...result });
    assert.ok(
      result.width <= page.viewportSize().width,
      `${name} overflows the page`,
    );
    if (htmlDirectory) {
      writeFileSync(
        path.join(htmlDirectory, `${name}.html`),
        await documentResponse.text(),
      );
    }
  }

  await scan("login", "/");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.locator(":focus").innerText(),
    "Skip to main content",
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.locator(":focus").getAttribute("id"), "main-content");

  await scan("signup", "/?view=register");
  const female = page.getByRole("radio", { name: "Female" });
  await page.getByRole("radio", { name: "Male", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  assert.equal(await female.isChecked(), true);

  const form = {
    name: "Audit player",
    email: "audit@example.test",
    password: "disposable test password",
    passwordConfirmation: "disposable test password",
    avatarModel: "female",
  };
  const guest = await context.newPage();
  await guest.goto(base + "/?view=register");
  await guest.getByLabel("Player name").fill(form.name);
  await guest.getByLabel("Email").fill(form.email);
  await guest.getByLabel("Password", { exact: true }).fill(form.password);
  const confirmation = guest.getByLabel("Confirm password");
  await confirmation.fill("mismatch");
  await guest.getByRole("button", { name: "Create account" }).click();
  assert.equal(await confirmation.getAttribute("aria-invalid"), "true");
  assert.equal(
    await guest.locator(":focus").getAttribute("id"),
    "signup-passwordConfirmation",
  );
  await guest.close();

  await page.getByLabel("Player name").fill(form.name);
  await page.getByLabel("Email").fill(form.email);
  await page.getByLabel("Password", { exact: true }).fill(form.password);
  await page.getByLabel("Confirm password").fill(form.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/game");
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL(base + "/");
  await page.getByLabel("Email").fill(form.email);
  await page.getByLabel("Password", { exact: true }).fill("wrong password");
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/login");
  await scan("login-error");
  assert.equal(
    await page.locator(":focus").innerText(),
    "Invalid email or password.",
  );
  assert.equal(await page.getByLabel("Email").inputValue(), form.email);
  await page.getByLabel("Password", { exact: true }).fill(form.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL("**/game");
  const signup = await context.request.post(base + "/signup", {
    form: { ...form, email: "duplicate@example.test" },
  });
  assert.equal(signup.status(), 409);
  for (const [name, route] of Object.entries({
    quarters: "/game",
    inventory: "/game?category=consumables",
    nexaris: "/game/nexaris",
    dominion: "/game/arena",
    sanctum: "/game/hospital",
    emporium: "/game/store",
    reliquary: "/game/reliquary",
    registry: "/game/users",
    profile: "/game/users/1",
    driftwater: "/game/fishing",
    ruins: "/game/ruins",
    admin: "/game/admin",
    error: "/game/users/999",
  })) {
    await scan(name, route);
  }

  await page.goto(base + "/game");
  assert.equal(
    await page.getByRole("button", { name: "Use Lesser Potion" }).count(),
    1,
  );
  await page.goto(base + "/game/store");
  const buy = page.getByRole("region", { name: "Items for purchase" });
  await buy.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(
    () =>
      document.querySelector("[data-scroll-label='Items for purchase']")
        .scrollLeft > 0,
  );
  assert.equal(
    await page
      .getByRole("button", { name: "Purchase for 0 gold" })
      .isDisabled(),
    true,
  );
  await page.getByLabel("Quantity of Lesser Potion").fill("1");
  const swordQuantity = page.getByLabel("Quantity of Rusted Sword");
  await swordQuantity.fill("10");
  assert.equal(
    await page
      .getByRole("button", { name: "Purchase for 1,005 gold" })
      .isDisabled(),
    true,
  );
  await page
    .getByText("You do not have enough gold.", { exact: true })
    .waitFor();
  await swordQuantity.fill("1");
  await page.getByRole("button", { name: "Purchase for 105 gold" }).click();
  await page.waitForURL("**/game/store?purchased=1");
  await scan("purchase-result");
  assert.equal(await page.locator(":focus").innerText(), "Purchase complete.");

  const purchaseFilters = page.getByRole("navigation", {
    name: "Purchase categories",
  });
  const weaponsFilter = purchaseFilters.getByRole("link", {
    name: "Weapons",
    exact: true,
  });
  await weaponsFilter.focus();
  await page.keyboard.press("Enter");
  await page.waitForURL("**/game/store?category=weapon#buy-heading");
  assert.equal(await weaponsFilter.getAttribute("aria-current"), "page");
  assert.equal(await page.getByLabel("Quantity of Lesser Potion").count(), 0);
  await page.getByLabel("Quantity of Rusted Sword", { exact: true }).waitFor();
  await scan("purchase-weapons");

  await page.goto(base + "/game");
  await page.getByRole("link", { name: "Equipment", exact: true }).click();
  await page.getByRole("button", { name: "Equip Rusted Sword" }).click();
  await page.getByRole("button", { name: "Unequip Rusted Sword" }).waitFor();
  await scan("equipped");
  await page.getByRole("button", { name: "Unequip Rusted Sword" }).click();
  await page.getByRole("button", { name: "Equip Rusted Sword" }).waitFor();
  await page.goto(base + "/game/store");
  const sell = page.getByRole("button", { name: "Sell", exact: true });
  const sellQuantity = page.getByLabel("Quantity of Rusted Sword to sell");
  assert.equal(await sell.isDisabled(), true);
  await sellQuantity.fill("1");
  assert.equal(await sell.isEnabled(), true);
  await sellQuantity.clear();
  assert.equal(await sell.isDisabled(), true);
  await sellQuantity.fill("1");
  await sell.click();
  await page.waitForURL("**/game/store?sold=1#sale-result");
  await scan("sale-result");
  assert.equal(await page.locator(":focus").innerText(), "Sale complete.");

  // Stage a wounded level-two player in the disposable database.
  applicationDatabase.exec("UPDATE users SET hp = 1, exp = 60");
  await scan("critical-health", "/game");
  assert.match(
    await page.locator("#quarters-hp-value").innerText(),
    /Critical/,
  );
  await page
    .getByRole("button", { name: /spend one attribute point.*$/ })
    .first()
    .click();
  await page.getByText(/Point spent/).waitFor();
  await page.getByRole("button", { name: "Use Lesser Potion" }).click();
  await page.getByText(/restored.*HP/i).waitFor();
  await page.goto(base + "/game/hospital");
  await page.getByRole("button", { name: "Heal", exact: true }).click();
  await page.waitForURL("**/game/hospital?healed=*");
  await scan("healing-result");

  await page.goto(base + "/game/fishing");
  await page.getByRole("button", { name: "Cast line" }).click();
  await page.waitForURL("**/game/fishing?cast=1");
  await scan("cast-result");
  assert.equal(
    await page.locator(":focus").getAttribute("id"),
    "driftwater-last-cast",
  );

  await page.getByRole("button", { name: "Cast net" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("heading", { name: "Net result" }).waitFor();
  await scan("net-result");
  assert.equal(await page.locator(":focus").innerText(), "Net result");
  assert.ok(await page.getByRole("button", { name: "Cast net" }).isDisabled());
  assert.ok(await page.getByRole("button", { name: "Cast line" }).isDisabled());

  // These stats guarantee a training win in one attack regardless of initiative.
  await context.request.post(base + "/game/admin", {
    form: { "stats[strength]": "100", "stats[fortitude]": "100" },
  });
  await page.goto(base + "/game/arena");
  await page.getByRole("button", { name: "Fight training dummy" }).click();
  await page.waitForURL("**/game/training");
  await scan("training-result");
  assert.equal(
    await page.getByRole("heading", { name: "Combat readiness" }).count(),
    1,
  );
  assert.match(
    await page.locator("#dominion-status-hp-value").innerText(),
    /\d+ \/ \d+/,
  );
  assert.match(
    await page.locator("#dominion-status-xp-value").innerText(),
    /\d+ \/ \d+/,
  );
  assert.equal(await page.locator(":focus").innerText(), "Battle summary");
  await page.getByText("Battle log", { exact: true }).focus();
  await page.keyboard.press("Space");
  assert.ok((await page.locator("details[open] .battle-log li").count()) > 0);
  await page.setViewportSize({ width: 1280, height: 800 });
  await scan("training-result-wide");
  await page.setViewportSize({ width: 320, height: 768 });

  await page.goto(base + "/game/ruins");
  const originalRandom = Math.random;
  const playerTile = page.locator("[data-player-tile]");
  try {
    Math.random = () => 0;
    await page.getByRole("button", { name: "Enter The Ruins" }).click();
    await playerTile.waitFor();
  } finally {
    Math.random = originalRandom;
  }
  applicationDatabase.exec(`
    UPDATE users
    SET ruins_discoveries = '[{"id":"gold-cache","tile":1,"claimed":false},{"id":"potion-cache","tile":14,"claimed":false}]',
        ruins_enemies = '[{"enemyId":"vault-scavenger","tile":9}]',
        ruins_explored_tiles = '[0]'
    WHERE email = 'audit@example.test'
  `);
  assert.equal(
    await page
      .getByRole("button", { name: "Move east to (1, 0)", exact: true })
      .count(),
    1,
  );
  assert.doesNotMatch(
    await page.locator("[data-ruins-map]").innerHTML(),
    /gold-cache|potion-cache|gold discovery|item discovery/,
  );
  await scan("expedition");
  for (
    let step = 0;
    step < 12 && !(await page.locator("[data-player-tile]:focus").count());
    step++
  ) {
    await page.keyboard.press("Tab");
  }
  assert.equal(await page.locator("[data-player-tile]:focus").count(), 1);
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator("[data-player-tile]:focus").count(), 1);
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator(":focus").getAttribute("value"), "1");
  await page.keyboard.press("Enter");
  await page.locator('[data-position="1"]').waitFor();
  await scan("discovery");
  await page.getByText(/You collect 8 gold/).waitFor();
  assert.equal(await page.locator("[data-player-tile]:focus").count(), 1);
  await page.keyboard.press("Tab");
  assert.equal(
    await page.locator(":focus").getAttribute("name"),
    "destination",
  );
  await page.getByText("Map markers", { exact: true }).focus();
  await page.keyboard.press("Space");
  assert.match(
    await page.locator("details[open]").innerText(),
    /entrance and exit/,
  );

  await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
  // Inspect system-color boundaries directly. Axe's contrast checker compares
  // forced text colors with authored backgrounds in this browser mode.
  assert.equal(
    await page.evaluate(() => matchMedia("(forced-colors: active)").matches),
    true,
  );
  await playerTile.focus();
  await page.keyboard.press("ArrowRight");
  const forcedTile = page.locator("button.ruins-tile:focus");
  assert.equal(await forcedTile.count(), 1);
  assert.equal(
    await forcedTile.evaluate((tile) => getComputedStyle(tile).outlineStyle),
    "solid",
  );
  await page.emulateMedia({ forcedColors: "none" });
  await page.addStyleTag({
    content:
      "* {line-height:1.5 !important; letter-spacing:.12em !important; word-spacing:.16em !important} p {margin-block-end:2em !important}",
  });
  await scan("expedition-text-spacing");
  applicationDatabase.exec("UPDATE users SET strength = 100, speed = 100");
  await page.locator('button[name="destination"][value="2"]').click();
  await page.locator('[data-position="2"]').waitFor();
  try {
    Math.random = () => 0;
    await page.locator('button[name="destination"][value="9"]').click();
    await page.locator('[data-position="9"]').waitFor();
    await page.getByText(/Loot: Lesser Potion ×1, Metal Scraps ×1/).waitFor();
  } finally {
    Math.random = originalRandom;
  }
  await page.getByText(/Wooden Axe ×1, Wooden Shield ×1/).waitFor();
  await scan("victory-loot");
  assert.equal(await page.locator(":focus").innerText(), "Battle summary");

  await page.setViewportSize({ width: 1280, height: 800 });
  await scan("expedition-wide");
  await page.getByRole("button", { name: "Activate Recall Beacon" }).click();
  assert.match(page.url(), /\/game\/ruins\/summary$/);
  await page.getByRole("heading", { name: "Emergency extraction" }).waitFor();
  assert.equal(
    await page.locator(":focus").getAttribute("data-result-focus"),
    "",
  );
  await scan("expedition-summary-wide");

  await page.setViewportSize({ width: 320, height: 768 });
  await scan("expedition-summary");
  await page.getByRole("button", { name: "Return to Nexaris" }).click();
  assert.match(page.url(), /\/game\/nexaris\??$/);
  await page.goto(base + "/game");
  for (const [filter, gear] of [
    ["Weapons", "Wooden Axe"],
    ["Armor", "Wooden Shield"],
  ]) {
    const link = page.getByRole("link", { name: filter, exact: true });
    await link.click();
    assert.equal(await link.getAttribute("aria-current"), "page");
    await page.getByRole("button", { name: `Equip ${gear}` }).waitFor();
    await scan(`inventory-${filter.toLowerCase()}`);
  }
  const materialsLink = page.getByRole("link", {
    name: "Materials",
    exact: true,
  });
  await materialsLink.click();
  assert.equal(await materialsLink.getAttribute("aria-current"), "page");
  await page.getByRole("rowheader", { name: /Metal Scraps/ }).waitFor();
  await scan("materials-inventory");
  await scan("material-buyback", "/game/store");
  await page
    .getByRole("button", { name: /^Sell all for [\d,]+ gold$/ })
    .click();
  await page.waitForURL("**/game/store?sold=1#sale-result");
  assert.equal(await page.locator(":focus").innerText(), "Sale complete.");

  const nativeContext = await browser.newContext({
    storageState: await context.storageState(),
    javaScriptEnabled: false,
  });
  const nativePage = await nativeContext.newPage();
  await nativePage.goto(base + "/game/store?category=consumables");
  await nativePage.getByLabel("Quantity of Lesser Potion").fill("1");
  await nativePage
    .getByRole("button", { name: "Purchase", exact: true })
    .click();
  await nativePage.getByText("Purchase complete.", { exact: true }).waitFor();

  await nativePage.goto(base + "/game/ruins");
  await nativePage.getByRole("button", { name: "Enter The Ruins" }).click();
  await nativePage.locator("[data-player-tile]").waitFor();
  await nativePage.locator("[data-player-tile]").focus();
  await nativePage.keyboard.press("Tab");
  assert.equal(await nativePage.locator(":focus").getAttribute("value"), "1");
  await nativePage.keyboard.press("Space");
  await nativePage.locator('[data-position="1"]').waitFor();
  await nativeContext.close();

  assert.deepEqual(violations, []);
  console.log("Accessibility scans and browser interaction checks passed.");
} finally {
  await browser?.close();
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  applicationDatabase?.close();
  process.chdir(root);
  rmSync(directory, { recursive: true, force: true });
}
