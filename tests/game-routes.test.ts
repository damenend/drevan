import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getFishingDate } from "../src/services/fishing";

const originalDirectory = process.cwd();
const testDirectory = mkdtempSync(path.join(tmpdir(), "drevan-routes-"));
let sqlite: Database.Database;
let server: Server;
let baseUrl: string;
let cookie: string;
const account = {
  name: "test-adventurer",
  email: "test@example.test",
  password: "test password",
  passwordConfirmation: "test password",
  avatarModel: "female",
};

before(async () => {
  // The app opens ./data/game.sqlite on import. Use a private working directory
  // so these HTTP tests exercise the real routes without touching local saves.
  mkdirSync(path.join(testDirectory, "data"));
  process.chdir(testDirectory);
  process.env.SESSION_SECRET = "drevan-route-test-secret";

  sqlite = new Database("data/game.sqlite");
  sqlite.pragma("foreign_keys = ON");
  migrate(drizzle(sqlite), {
    migrationsFolder: path.resolve(__dirname, "../drizzle"),
  });
  sqlite.exec(`
    INSERT INTO items (id, name, description, price, type, effect, effect_value)
    VALUES (1, 'Lesser Potion', 'Test potion', 5, 'consumable', 'heal', 10),
           (2, 'Rusted Sword', 'Test sword', 100, 'weapon', 'strength', 1),
           (3, 'Murkfin', 'Test fish', NULL, 'fish', NULL, NULL);
    UPDATE items SET sell_price = 50 WHERE id = 2;
    UPDATE items SET sell_price = 1 WHERE id = 3;
  `);

  const { app } = await import("../src/app.js");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const signup = await post("/signup", account, "");
  assert.equal(signup.headers.get("location"), "/game");
  cookie = sessionCookie(signup);
});

after(async () => {
  if (server?.listening) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  sqlite?.close();
  process.chdir(originalDirectory);
  rmSync(testDirectory, { recursive: true, force: true });
});

beforeEach(() => {
  sqlite.exec(`
    DELETE FROM inventory;
    UPDATE users SET gold = 100, hp = 25, max_hp = 25, strength = 5,
      speed = 5, defense = 0, equipped_weapon_id = NULL, equipped_armor_id = NULL,
      exp = 0, strength_points = 0, speed_points = 0, max_hp_points = 0,
      fishing_casts_used = 0, fishing_cast_date = NULL;
  `);
});

function sessionCookie(response: Pick<Response, "headers">) {
  const header = response.headers.get("set-cookie");
  assert.ok(header);
  return header.split(";")[0];
}

/** Returns the rendered HTML and leaves redirects for the caller to inspect. */
async function request(route: string, options: RequestInit = {}) {
  const response = await fetch(baseUrl + route, {
    redirect: "manual",
    ...options,
  });
  const html = await response.text();
  return { status: response.status, headers: response.headers, html };
}

/** Posts as the signed-in player by default. Pass an empty cookie for guests. */
function post(
  route: string,
  body: object | URLSearchParams = {},
  session = cookie,
) {
  const form = body instanceof URLSearchParams;
  return request(route, {
    method: "POST",
    headers: {
      cookie: session,
      "content-type": form
        ? "application/x-www-form-urlencoded"
        : "application/json",
    },
    body: form ? body : JSON.stringify(body),
  });
}

function player() {
  const row = sqlite
    .prepare<
      [string],
      {
        gold: number;
        hp: number;
        max_hp: number;
        equipped_weapon_id: number | null;
        fishing_casts_used: number;
      }
    >(
      `SELECT gold, hp, max_hp, equipped_weapon_id, fishing_casts_used
       FROM users WHERE email = ?`,
    )
    .get(account.email);
  assert.ok(row);
  return row;
}

function ownedItems() {
  return sqlite
    .prepare("SELECT item_id, quantity FROM inventory ORDER BY item_id")
    .all();
}

test("game routes require sign-in and sign-in replaces the session", async () => {
  const guest = await request("/game/users");
  assert.equal(guest.headers.get("location"), "/");
  assert.equal(
    (await post("/game/admin", { stats: { gold: 0 } }, "")).headers.get(
      "location",
    ),
    "/",
  );
  const duplicate = await post(
    "/signup",
    {
      ...account,
      name: account.name.toUpperCase(),
      email: "other@example.test",
    },
    "",
  );
  assert.equal(duplicate.status, 409);

  const login = await post("/login", account);
  const newCookie = sessionCookie(login);
  assert.notEqual(newCookie, cookie);
  assert.equal((await request("/game", { headers: { cookie } })).status, 302);
  cookie = newCookie;

  const home = await request("/game", { headers: { cookie } });
  assert.equal(home.status, 200);
  assert.match(home.html, /Test-Adventurer/);
  assert.match(home.html, /drevan-avatar-female\.webp/);
  assert.equal(
    (await request("/game/users/1", { headers: { cookie } })).status,
    200,
  );
  const missingProfile = await request("/game/users/999", {
    headers: { cookie },
  });
  assert.equal(missingProfile.status, 404);
  assert.ok(
    missingProfile.html.includes(
      '<a href="/game/users">Back to The Registry</a>',
    ),
  );
});

test("Nexaris links to each location using its display name", async () => {
  const headers = { cookie };
  const nexaris = await request("/game/nexaris", { headers });
  assert.equal(nexaris.status, 200);

  for (const [route, name] of [
    ["/game", "The Quarters"],
    ["/game/arena", "Dominion"],
    ["/game/store", "Curious Emporium"],
    ["/game/hospital", "Sanctum"],
    ["/game/users", "The Registry"],
    ["/game/reliquary", "The Reliquary"],
    ["/game/fishing", "The Driftwater"],
  ]) {
    assert.ok(nexaris.html.includes(`href="${route}">${name}</a>`));
    const location = await request(route, { headers });
    assert.equal(location.status, 200, route);
    assert.ok(location.html.includes(`<title>${name} | Drevan</title>`));
    assert.match(location.html, /href="\/game"[^>]*>The Quarters<\/a>/);
    assert.match(
      location.html,
      new RegExp(`<h([23])[^>]*>(?:Welcome to )?${name}!?</h\\1>`),
    );
  }
});

test("Admin rejects malformed values and caps HP when maximum HP falls", async () => {
  const initial = player();
  const invalid = await post("/game/admin", { stats: { gold: 1, maxHp: "" } });
  assert.equal(invalid.headers.get("location"), "/game/admin?message=err");
  assert.deepEqual(player(), initial);

  await post("/game/admin", new URLSearchParams({ "stats[maxHp]": "10" }));
  assert.deepEqual(player(), {
    gold: 100,
    hp: 10,
    max_hp: 10,
    equipped_weapon_id: null,
    fishing_casts_used: 0,
  });
  await post("/game/admin", { stats: { maxHp: 25, hp: 1 } });
  assert.deepEqual(player(), {
    gold: 100,
    hp: 10,
    max_hp: 25,
    equipped_weapon_id: null,
    fishing_casts_used: 0,
  });
});

test("Emporium charges catalog prices and rejects invalid or unaffordable carts", async () => {
  const store = await request("/game/store", { headers: { cookie } });
  assert.equal(store.status, 200);
  assert.match(store.html, /Lesser Potion/);
  assert.doesNotMatch(store.html, /Murkfin/);

  const initial = player();
  for (const items of [
    { "item-1": [2] },
    { "item-1": 2, "item-3": 1 },
    { "1": 2 },
  ]) {
    await post("/game/store", { items });
    assert.deepEqual(player(), initial);
    assert.deepEqual(ownedItems(), []);
  }

  const tooExpensive = await post("/game/store", {
    items: { "item-1": 1, "item-2": 1 },
  });
  assert.equal(tooExpensive.headers.get("location"), "/game/store?err=gold");
  assert.deepEqual(player(), initial);
  assert.deepEqual(ownedItems(), []);

  await post(
    "/game/store",
    new URLSearchParams({ "items[item-1]": "2", price: "0" }),
  );
  await post("/game/store", { items: { "item-1": 1 } });
  assert.deepEqual(ownedItems(), [{ item_id: 1, quantity: 3 }]);
  assert.equal(player().gold, 85);
});

test("Emporium buys owned fish at catalog prices and protects equipped gear", async () => {
  sqlite.exec(`
    INSERT INTO inventory (user_id, item_id, quantity)
    SELECT id, 2, 2 FROM users WHERE email = 'test@example.test'
    UNION ALL SELECT id, 3, 3 FROM users WHERE email = 'test@example.test';
    UPDATE users SET equipped_weapon_id = 2;
  `);

  const store = await request("/game/store", { headers: { cookie } });
  const [buySection, sellSection] = store.html.split('<section id="sell"');
  assert.doesNotMatch(buySection, /Murkfin/);
  assert.match(sellSection, /Murkfin/);
  assert.match(sellSection, /id="sell-2"[^>]*max="1"[^>]*data-price="50"/);
  assert.equal((sellSection.match(/type="submit"/g) ?? []).length, 1);
  assert.match(sellSection, /id="sell-total"/);

  const home = await request("/game", { headers: { cookie } });
  const [, equipmentAndInventory] = home.html.split('<section id="equipped"');
  const [equipment, bag] = equipmentAndInventory.split(
    'aria-labelledby="inventory-heading"',
  );
  assert.match(equipment, /Unequip Rusted Sword/);
  assert.match(bag, /Rusted Sword<\/figcaption>[\s\S]*?<td>1<\/td>/);
  assert.doesNotMatch(bag, /Unequip Rusted Sword/);

  const initial = player();
  const inventory = ownedItems();
  for (const [items, status] of [
    [{ "item-3": 1, "item-2": 2 }, 409],
    [{ "item-2": 1, "item-1": 1 }, 409],
    [{ "item-2": 1, "item-3": 4 }, 409],
    [{ "item-3": 0 }, 400],
    [{ "item-3": 1.5 }, 400],
    [{ "item-3": [1] }, 400],
  ]) {
    assert.equal((await post("/game/store/sell", { items })).status, status);
    assert.deepEqual(player(), initial);
    assert.deepEqual(ownedItems(), inventory);
  }

  const sale = await post(
    "/game/store/sell",
    new URLSearchParams({
      "items[item-2]": "1",
      "items[item-3]": "2",
      "items[item-1]": "",
      sellPrice: "1000",
    }),
  );
  assert.equal(sale.status, 303);
  assert.equal(sale.headers.get("location"), "/game/store?sold=1#sell");
  assert.equal(player().gold, 152);
  assert.equal(player().equipped_weapon_id, 2);
  assert.deepEqual(ownedItems(), [
    { item_id: 2, quantity: 1 },
    { item_id: 3, quantity: 1 },
  ]);
  const equippedSale = await post("/game/store/sell", {
    items: { "item-2": 1 },
  });
  assert.equal(equippedSale.status, 409);
  assert.ok(
    equippedSale.html.includes(
      '<a href="/game#equipped">Unequip in The Quarters</a>',
    ),
  );
  const afterSale = await request("/game/store", { headers: { cookie } });
  assert.match(afterSale.html, /Unequip in The Quarters/);

  await post("/game/inventory/unequip", { itemId: 2 });
  assert.equal(
    (await post("/game/store/sell", { items: { "item-2": 1 } })).status,
    303,
  );
  assert.equal(player().gold, 202);
  assert.deepEqual(ownedItems(), [{ item_id: 3, quantity: 1 }]);
});

test("Emporium preserves stock when crediting sale gold fails", async (t) => {
  const initial = player();
  t.mock.method(console, "error", () => {});
  sqlite.exec(`
    INSERT INTO inventory (user_id, item_id, quantity)
    SELECT id, 3, 1 FROM users WHERE email = 'test@example.test';
    CREATE TRIGGER fail_sale BEFORE UPDATE OF gold ON users
    BEGIN
      SELECT RAISE(ABORT, 'Test gold write failure');
    END;
  `);

  try {
    assert.equal(
      (await post("/game/store/sell", { items: { "item-3": 1 } })).status,
      500,
    );
    assert.deepEqual(player(), initial);
    assert.deepEqual(ownedItems(), [{ item_id: 3, quantity: 1 }]);
  } finally {
    sqlite.exec("DROP TRIGGER fail_sale;");
  }
});

test("an inventory write failure rolls back the Emporium gold deduction", async (t) => {
  const initial = player();
  const log = t.mock.method(console, "error", () => {});
  sqlite.exec(`
    CREATE TRIGGER fail_purchase BEFORE INSERT ON inventory
    BEGIN
      SELECT RAISE(ABORT, 'Test inventory write failure');
    END;
  `);

  try {
    const purchase = await post("/game/store", { items: { "item-1": 1 } });
    assert.equal(purchase.status, 500);
    assert.match(purchase.html, /Server error/);
    assert.equal(log.mock.callCount(), 1);
    assert.deepEqual(player(), initial);
    assert.deepEqual(ownedItems(), []);
  } finally {
    sqlite.exec("DROP TRIGGER fail_purchase;");
  }
});

test("consumption, gear and Sanctum use current player state", async () => {
  await post("/game/store", { items: { "item-1": 1 } });
  await post("/game/inventory/use", { itemId: 1 });
  assert.deepEqual(ownedItems(), [{ item_id: 1, quantity: 1 }]);
  sqlite.exec("UPDATE users SET hp = 3;");

  await post("/game/inventory/use", { itemId: true });
  assert.deepEqual(ownedItems(), [{ item_id: 1, quantity: 1 }]);
  await post("/game/inventory/use", { itemId: 1 });
  assert.deepEqual(ownedItems(), []);
  await post("/game/inventory/equip", { itemId: 2 });
  assert.equal(player().equipped_weapon_id, null);

  const healed = await post("/game/hospital");
  assert.equal(healed.headers.get("location"), "/game/hospital?healed=12");
  assert.deepEqual(player(), {
    gold: 83,
    hp: 25,
    max_hp: 25,
    equipped_weapon_id: null,
    fishing_casts_used: 0,
  });

  await post("/game/admin", { stats: { gold: 100 } });
  await post("/game/store", { items: { "item-2": 1 } });
  await post("/game/inventory/equip", { itemId: 2 });
  const home = await request("/game", { headers: { cookie } });
  assert.match(home.html, /<dt>Strength<\/dt>\s*<dd>\s*6\s*<span/);
  await post("/game/inventory/unequip", { itemId: 2 });
  assert.equal(player().equipped_weapon_id, null);
});

test("training rejects malformed levels and saves the fight result", async (t) => {
  const initial = player();
  const invalid = await post("/game/training", { level: true });
  assert.equal(invalid.headers.get("location"), "/game/arena");
  assert.deepEqual(player(), initial);

  t.mock.method(Math, "random", () => 0.25);
  const fight = await post(
    "/game/training",
    new URLSearchParams({ level: "1" }),
  );
  assert.equal(fight.status, 200);
  assert.match(fight.html, /Training Dummy/);
  assert.deepEqual(player(), {
    gold: 110,
    hp: 23,
    max_hp: 25,
    equipped_weapon_id: null,
    fishing_casts_used: 0,
  });
});

test("training unlocks a point and concurrent spends can only use it once", async (t) => {
  t.mock.method(Math, "random", () => 0.25);
  const headers = { cookie };
  for (let win = 0; win < 2; win++) {
    const fight = await post("/game/training", { level: 3 });
    assert.equal(fight.status, 200);
    assert.match(fight.html, /30 XP/);
    if (win === 1) {
      assert.match(
        fight.html,
        /You reached level 2! <a href="\/game#character-heading">Spend stat points in The Quarters<\/a>/,
      );
    }
    await post("/game/hospital");
  }

  const home = await request("/game", { headers });
  assert.match(home.html, /id="character-heading"/);
  assert.match(home.html, /<dt>Experience<\/dt>\s*<dd>60 \/ 150<\/dd>/);
  assert.match(home.html, /Unspent stat points<\/dt>\s*<dd>1<\/dd>/);
  const registry = await request("/game/users", { headers });
  assert.match(registry.html, /<td>2<\/td>/);
  const profilePath = registry.html.match(/href="(\/game\/users\/\d+)"/)?.[1];
  assert.ok(profilePath);
  const profile = await request(profilePath, { headers });
  assert.match(profile.html, /<dt>Level<\/dt>\s*<dd>2<\/dd>/);

  const invalid = await post("/game/progression", {
    stat: "defense",
    points: 1,
  });
  assert.match(invalid.headers.get("location") ?? "", /Choose/);
  const spends = await Promise.all([
    post("/game/progression", { stat: "maxHp", amount: 999 }),
    post("/game/progression", { stat: "maxHp" }),
  ]);
  assert.equal(
    spends.filter((spend) =>
      spend.headers.get("location")?.includes("Point%20spent"),
    ).length,
    1,
  );
  assert.equal(player().hp, 25);
  assert.equal(player().max_hp, 25);
  const healed = await post("/game/hospital");
  assert.equal(healed.headers.get("location"), "/game/hospital?healed=3");
  assert.equal(player().hp, 28);
  assert.match(
    (await request("/game", { headers })).html,
    /Unspent stat points<\/dt>\s*<dd>0<\/dd>/,
  );
});

test("a capped training draw saves HP loss and awards no gold", async (t) => {
  sqlite.exec(
    "UPDATE users SET hp = 100000, max_hp = 100000, strength = 1, speed = 101;",
  );
  t.mock.method(Math, "random", () => 0.5);

  const fight = await post("/game/training", { level: 100 });

  assert.equal(fight.status, 200);
  assert.match(fight.html, /The battle ended in a draw/);
  assert.equal(player().hp, 62000);
  assert.equal(
    sqlite
      .prepare("SELECT exp FROM users WHERE email = ?")
      .pluck()
      .get(account.email),
    0,
  );
  assert.equal(player().gold, 100);
});

test("only one request spends the last fishing cast and awards a catch", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-07-02T12:00:00Z"),
  });
  sqlite
    .prepare("UPDATE users SET fishing_casts_used = 49, fishing_cast_date = ?")
    .run(getFishingDate());
  t.mock.method(Math, "random", () => 0.25);

  const results = await Promise.all([
    post("/game/fishing"),
    post("/game/fishing"),
  ]);
  assert.ok(results.every(({ status }) => status === 200));
  assert.equal(
    results.filter(({ html }) => /You caught a/.test(html)).length,
    1,
  );
  assert.deepEqual(ownedItems(), [{ item_id: 3, quantity: 1 }]);
  assert.equal(player().fishing_casts_used, 50);
});
