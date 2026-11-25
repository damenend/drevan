import assert from "node:assert/strict";
import { once } from "node:events";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";
import Database from "better-sqlite3";
import { sql } from "drizzle-orm";
import {
  getBaseAttackPower,
  maximumHp,
  MAX_ATTACK_POWER,
} from "../src/services/character-stats";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { materials, ruinsEquipment } from "../src/db/ruins-loot-catalog";
import type { RuinsDiscovery } from "../src/services/ruins-discoveries";
import { getRuinsEncounter } from "../src/services/ruins-map";
import { DAILY_CAST_LIMIT, getFishingDate } from "../src/services/fishing";

const originalDirectory = process.cwd();
const testDirectory = mkdtempSync(path.join(tmpdir(), "drevan-routes-"));
let sqlite: Database.Database;
let server: Server;
let baseUrl: string;
let cookie: string;
const firstMaterialId = 20;
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
           (2, 'Rusted Sword', 'Test sword', 100, 'weapon', 'attack_power', 1),
           (3, 'Murkfin', 'Test fish', NULL, 'fish', NULL, NULL),
           (4, 'Recall Beacon', 'Test utility', NULL, 'utility', NULL, NULL);
    UPDATE items SET sell_price = 50 WHERE id = 2;
    UPDATE items SET sell_price = 1 WHERE id = 3;
  `);

  const insertMaterial = sqlite.prepare(`
    INSERT INTO items (id, name, description, type, sell_price, image)
    VALUES (?, ?, ?, 'material', ?, '/images/material-placeholder.webp')
  `);
  for (const [index, item] of materials.entries()) {
    insertMaterial.run(
      firstMaterialId + index,
      item.name,
      item.description,
      item.sellPrice,
    );
  }

  const insertEquipment = sqlite.prepare(`
    INSERT INTO items (name, description, type, effect, effect_value, sell_price, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of ruinsEquipment) {
    insertEquipment.run(
      item.name,
      item.description,
      item.type,
      item.effect,
      item.effectValue,
      item.sellPrice,
      item.price,
    );
  }

  const { app } = await import("../src/app.js");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  const signup = await post("/signup", account, "");
  assert.equal(signup.headers.get("location"), "/game");
  assert.equal(player().gold, 125);
  assert.equal(player().hp, 25);
  assert.deepEqual(
    sqlite
      .prepare(
        "SELECT fortitude, fortitude_points, character_class FROM users WHERE email = ?",
      )
      .get(account.email),
    { fortitude: 5, fortitude_points: 0, character_class: "unaligned" },
  );
  assert.deepEqual(ownedItems(), [{ item_id: 1, quantity: 3 }]);
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
    UPDATE users SET gold = 100, hp = 25, strength = 5, character_class = 'unaligned',
      speed = 5, agility = 5, defense = 0, equipped_weapon_id = NULL, equipped_armor_id = NULL,
      intellect = 0, fortitude = 5, intellect_points = 0,
      exp = 0, strength_points = 0, agility_points = 0, fortitude_points = 0,
      fishing_casts_used = 0, fishing_cast_date = NULL,
      ruins_tile = NULL, ruins_revision = 0, ruins_enemy_pending = 0, recall_date = NULL,
      ruins_discoveries = NULL, ruins_gold_claim_date = NULL;
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

/** Follows a gameplay action's result page as the signed-in player. */
async function followAction(response: Awaited<ReturnType<typeof post>>) {
  assert.equal(response.status, 303);
  const location = response.headers.get("location");
  assert.ok(location);
  assert.ok(location.startsWith("/game/"));
  return request(location, { headers: { cookie } });
}

function player() {
  const row = sqlite
    .prepare<
      [string],
      {
        gold: number;
        hp: number;
        equipped_weapon_id: number | null;
        fishing_casts_used: number;
      }
    >(
      `SELECT gold, hp, equipped_weapon_id, fishing_casts_used
       FROM users WHERE email = ?`,
    )
    .get(account.email);
  assert.ok(row);
  return row;
}

function ownedItems() {
  return sqlite
    .prepare<[], { item_id: number; quantity: number }>(
      "SELECT item_id, quantity FROM inventory ORDER BY item_id",
    )
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

test("homepage renders only the requested authentication form", async () => {
  const login = await request("/");
  assert.equal(login.status, 200);
  assert.match(login.html, /action="\/login"/);
  assert.doesNotMatch(login.html, /action="\/signup"/);

  const signup = await request("/?view=register");
  assert.equal(signup.status, 200);
  assert.match(signup.html, /href="\/\?view=register" aria-current="page"/);
  assert.match(signup.html, /action="\/signup"/);
  assert.doesNotMatch(signup.html, /action="\/login"/);
  assert.match(signup.html, /value="male"[^>]* checked/);
});

test("signup errors restore safe values and identify the affected field", async () => {
  const signup = await post(
    "/signup",
    new URLSearchParams({ ...account, passwordConfirmation: "different" }),
    "",
  );
  assert.equal(signup.status, 400);
  assert.match(signup.html, /action="\/signup"/);
  assert.match(
    signup.html,
    /id="signup-passwordConfirmation"[^>]*aria-invalid="true"/,
  );
  assert.match(signup.html, /Passwords must match/);
  assert.match(signup.html, /value="female"[^>]* checked/);
  assert.ok(signup.html.includes(`value="${account.name}"`));
  assert.ok(signup.html.includes(`value="${account.email}"`));
  assert.ok(!signup.html.includes(account.password));
});

test("an incorrect password does not create an authenticated session", async () => {
  const login = await post(
    "/login",
    { ...account, password: "wrong password" },
    "",
  );
  assert.equal(login.status, 401);
  assert.match(login.html, /action="\/login"/);
  assert.match(login.html, /Invalid email or password/);
  assert.ok(!login.html.includes("wrong password"));
  assert.equal(login.headers.get("set-cookie"), null);
});

test("signup rolls back the account when starter potions cannot be saved", async (t) => {
  const email = "failed-signup@example.test";
  t.mock.method(console, "error", () => {});
  sqlite.exec(`
    CREATE TRIGGER fail_starter_potions BEFORE INSERT ON inventory
    BEGIN
      SELECT RAISE(ABORT, 'Test starter potion write failure');
    END;
  `);

  try {
    const signup = await post(
      "/signup",
      { ...account, name: "New Adventurer", email },
      "",
    );
    assert.equal(signup.status, 500);
    assert.equal(signup.headers.get("set-cookie"), null);
    assert.equal(
      sqlite.prepare("SELECT id FROM users WHERE email = ?").get(email),
      undefined,
    );
  } finally {
    sqlite.exec("DROP TRIGGER fail_starter_potions;");
  }
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
    assert.match(location.html, new RegExp(`<h1[^>]*>${name}</h1>`));
  }
});

test("Admin rejects malformed or overflowing Fortitude", async () => {
  const initial = player();
  for (const fortitude of ["", Number.MAX_SAFE_INTEGER]) {
    const invalid = await post("/game/admin", {
      stats: { gold: 1, fortitude },
    });
    assert.equal(invalid.headers.get("location"), "/game/admin?message=err");
    assert.deepEqual(player(), initial);
  }
});

test("Changing base Fortitude in Admin refills HP without changing spent points", async () => {
  sqlite.exec("UPDATE users SET hp = 0, exp = 210, fortitude_points = 2");
  const headers = { cookie };
  assert.match(
    (await request("/game", { headers })).html,
    /id="quarters-hp" min="0" max="31" value="0"/,
  );

  const saved = await post(
    "/game/admin",
    new URLSearchParams({ "stats[fortitude]": "3" }),
  );
  assert.equal(saved.headers.get("location"), "/game/admin?message=success");
  assert.match(
    (await request("/game", { headers })).html,
    /id="quarters-hp" min="0" max="25" value="25"/,
  );
  const admin = await request("/game/admin", { headers });
  assert.match(admin.html, /Max HP: <strong>25<\/strong>/);
  assert.doesNotMatch(admin.html, /name="stats\[(hp|baseHp)\]"/);
  assert.equal(ruinsState().fortitude_points, 2);

  sqlite.exec("UPDATE users SET hp = 7");
  await post("/game/admin", { stats: { fortitude: 3, gold: 101, hp: 99 } });
  assert.equal(player().gold, 101);
  assert.equal(player().hp, 7);
  await post("/game/admin", { stats: { fortitude: 4 } });
  assert.equal(player().hp, 28);
});

test("each other primary attribute still spends exactly one point", async () => {
  sqlite.exec("UPDATE users SET exp = 480");
  for (const [index, stat] of ["strength", "agility", "intellect"].entries()) {
    const spent = await post("/game/progression", { stat });
    assert.match(spent.headers.get("location") ?? "", /Point%20spent/);
    const { html } = await request("/game", { headers: { cookie } });
    assert.match(
      html,
      new RegExp(`<dt>Attack Power</dt>\\s*<dd>\\s*${11 + index}\\s*</dd>`),
    );
    assert.match(html, /<dt>Speed<\/dt>\s*<dd>5<\/dd>/);
  }
  const home = await request("/game", { headers: { cookie } });
  assert.match(home.html, /<dt>Strength<\/dt>\s*<dd>6<\/dd>/);
  assert.match(home.html, /<dt>Agility<\/dt>\s*<dd>6<\/dd>/);
  assert.match(home.html, /<dt>Intellect<\/dt>\s*<dd>1<\/dd>/);
  assert.match(home.html, /0 unspent attribute points/);
});

test("equal offensive totals yield equal Attack Power regardless of Fortitude", () => {
  for (const [strength, agility, intellect, fortitude] of [
    [5, 5, 0, 5],
    [0, 5, 5, 6],
    [0, 0, 10, 7],
  ]) {
    const attributes = { strength, agility, intellect, fortitude };
    assert.equal(getBaseAttackPower(attributes), 10);
  }
});

test("extreme attributes and equipped bonuses respect the Attack Power cap", async () => {
  sqlite
    .prepare(
      "UPDATE users SET strength = ?, agility = 2, equipped_weapon_id = 2",
    )
    .run(Number.MAX_SAFE_INTEGER);
  sqlite.exec(
    "INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 2, 1 FROM users",
  );
  const admin = await request("/game/admin", { headers: { cookie } });
  assert.match(
    admin.html,
    new RegExp(
      `Attack Power: <strong>${MAX_ATTACK_POWER.toLocaleString("en-US")}</strong>`,
    ),
  );
});

test("class identifiers are constrained and Admin leaves the class read-only", async () => {
  for (const characterClass of ["melee", "ranged", "caster", "unaligned"]) {
    sqlite.prepare("UPDATE users SET character_class = ?").run(characterClass);
  }
  assert.throws(
    () => sqlite.exec("UPDATE users SET character_class = 'invalid'"),
    /CHECK constraint failed/,
  );
  await post("/game/admin", {
    stats: { characterClass: "melee", intellect: 2 },
  });
  const headers = { cookie };
  const home = await request("/game", { headers });
  assert.match(home.html, /Level 1 · Unaligned/);
  const admin = await request("/game/admin", { headers });
  assert.match(admin.html, /Class: <strong>Unaligned<\/strong>/);
  assert.match(admin.html, /Attack Power: <strong>12<\/strong>/);
  assert.doesNotMatch(admin.html, /name="stats\[characterClass\]"/);
});

test("Dominion and The Ruins use the same calculated player Attack Power", async (t) => {
  sqlite.exec(`
    UPDATE users SET strength = 0, agility = 0, intellect = 10, intellect_points = 1,
      equipped_weapon_id = 2, character_class = 'melee';
    INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 2, 1 FROM users;
  `);
  t.mock.method(Math, "random", () => 0.1);
  const playerHit =
    /battle-log-entry--player">\s*<span class="battle-actor--player">[^<]+<\/span>\s*attacks\s*<span class="battle-actor--enemy">[^<]+<\/span>\s*for\s*<strong>6<\/strong>\s*damage\./;
  assert.match(
    (await followAction(await post("/game/training", { level: 1 }))).html,
    playerHit,
  );
  await reachScavenger();
  await explore("engage");
  assert.match((await viewRuins()).html, playerHit);
});

function copyLegacyMigrations(firstPendingTag: string) {
  const migrationsFolder = path.resolve(__dirname, "../drizzle");
  const legacyFolder = path.join(testDirectory, firstPendingTag);
  mkdirSync(path.join(legacyFolder, "meta"), { recursive: true });
  const journal = JSON.parse(
    readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf8"),
  ) as {
    entries: { tag: string }[];
  };
  const firstPending = journal.entries.findIndex(
    ({ tag }) => tag === firstPendingTag,
  );
  assert.ok(firstPending > 0);
  journal.entries = journal.entries.slice(0, firstPending);
  for (const entry of journal.entries) {
    const migration = entry.tag + ".sql";
    copyFileSync(
      path.join(migrationsFolder, migration),
      path.join(legacyFolder, migration),
    );
  }
  writeFileSync(
    path.join(legacyFolder, "meta/_journal.json"),
    JSON.stringify(journal),
  );

  return { migrationsFolder, legacyFolder };
}

test("Fortitude migration preserves spent HP points and current health", () => {
  const { migrationsFolder, legacyFolder } =
    copyLegacyMigrations("0011_fortitude");
  const legacy = new Database(":memory:");
  try {
    const database = drizzle(legacy);
    migrate(database, { migrationsFolder: legacyFolder });
    legacy.pragma("foreign_keys = ON");
    legacy.exec(`
      INSERT INTO users (name, email, password_hash, hp, max_hp, max_hp_points, speed, speed_points, exp)
      VALUES ('Legacy', 'legacy@example.test', 'fixture', 12, 25, 2, 7, 1, 480),
             ('Custom', 'custom@example.test', 'fixture', 29, 23, 2, 5, 0, 210);
      INSERT INTO items (name, description, type, effect, effect_value)
      VALUES ('Test item', 'Fixture', 'weapon', 'strength', 1);
      UPDATE users SET equipped_weapon_id = 1 WHERE id = 1;
      INSERT INTO inventory (user_id, item_id, quantity) VALUES (1, 1, 3);
    `);
    migrate(database, { migrationsFolder });
    const migrated =
      database.all(sql`SELECT hp, fortitude, fortitude_points, agility, agility_points, speed, character_class,
      exp, ${maximumHp(sql.raw("(fortitude + fortitude_points)"))} as cap FROM users ORDER BY id`);
    assert.deepEqual(migrated, [
      {
        hp: 12,
        fortitude: 5,
        fortitude_points: 2,
        agility: 7,
        agility_points: 1,
        speed: 8,
        character_class: "unaligned",
        exp: 480,
        cap: 31,
      },
      {
        hp: 28,
        fortitude: 4,
        fortitude_points: 2,
        agility: 5,
        agility_points: 0,
        speed: 5,
        character_class: "unaligned",
        exp: 210,
        cap: 28,
      },
    ]);
    assert.deepEqual(
      legacy.prepare("SELECT user_id, item_id, quantity FROM inventory").all(),
      [{ user_id: 1, item_id: 1, quantity: 3 }],
    );
    assert.deepEqual(
      legacy
        .prepare(
          "SELECT equipped_weapon_id, effect, effect_value FROM users JOIN items ON items.id = users.equipped_weapon_id",
        )
        .get(),
      { equipped_weapon_id: 1, effect: "attack_power", effect_value: 1 },
    );
    assert.deepEqual(legacy.pragma("foreign_key_check"), []);
  } finally {
    legacy.close();
  }
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
    '<section aria-labelledby="inventory-heading"',
  );
  assert.match(equipment, /Unequip Rusted Sword/);
  const swordRow = bag
    .split("<tr>")
    .find((row) => row.includes("Rusted Sword"));
  assert.ok(swordRow);
  assert.match(swordRow, /<td class="quarters-quantity">\s*1\s*<\/td>/);
  assert.doesNotMatch(swordRow, /Equip Rusted Sword/);
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
  assert.equal(sale.headers.get("location"), "/game/store?sold=1#sale-result");
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

test("The Quarters filters materials and Emporium sells them at the direct catalog price", async (t) => {
  const field = `item-${firstMaterialId}`;
  const sale = (quantity: number) =>
    post("/game/store/sell", { items: { [field]: quantity }, sellPrice: 999 });
  assert.equal((await sale(1)).status, 409);
  assert.equal(player().gold, 100);
  assert.deepEqual(ownedItems(), []);

  sqlite.exec(`
    INSERT INTO inventory (user_id, item_id, quantity)
    SELECT id, ${firstMaterialId}, 3 FROM users
    UNION ALL SELECT id, 1, 1 FROM users;
  `);
  const bag = await request("/game?category=materials", {
    headers: { cookie },
  });
  assert.match(
    bag.html,
    /category=materials#inventory-heading" aria-current="page"/,
  );
  assert.match(bag.html, /material-placeholder\.webp/);
  assert.match(bag.html, /Metal Scraps/);
  assert.match(bag.html, /Twisted remnants of machinery/);
  assert.match(bag.html, /Sells for 2 gold each/);
  assert.match(bag.html, /quarters-quantity">\s*3\s*</);
  assert.doesNotMatch(bag.html, /Lesser Potion|action="\/game\/inventory\//);

  const store = await request("/game/store", { headers: { cookie } });
  const [buy, sell] = store.html.split('<section id="sell"');
  assert.doesNotMatch(buy, /Metal Scraps/);
  assert.match(
    sell,
    new RegExp(`id="sell-${firstMaterialId}"[^>]*max="3"[^>]*data-price="2"`),
  );

  assert.equal(
    (await post("/game/store", { items: { [field]: 1 } })).headers.get(
      "location",
    ),
    "/game/store?err=invalid",
  );
  const owned = ownedItems();
  for (const [quantity, status] of [
    [-1, 400],
    [0, 400],
    [1.5, 400],
    [4, 409],
  ]) {
    assert.equal((await sale(quantity)).status, status);
    assert.deepEqual(ownedItems(), owned);
    assert.equal(player().gold, 100);
  }

  t.mock.method(console, "error", () => {});
  sqlite.exec(`
    CREATE TRIGGER fail_material_sale BEFORE UPDATE OF gold ON users
    BEGIN
      SELECT RAISE(ABORT, 'Test material sale failure');
    END;
  `);
  try {
    assert.equal((await sale(2)).status, 500);
    assert.deepEqual(ownedItems(), owned);
    assert.equal(player().gold, 100);
  } finally {
    sqlite.exec("DROP TRIGGER fail_material_sale");
  }

  assert.equal(
    (await sale(2)).headers.get("location"),
    "/game/store?sold=1#sale-result",
  );
  assert.equal(player().gold, 104);
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: 1 },
    { item_id: firstMaterialId, quantity: 1 },
  ]);
  assert.equal((await sale(1)).status, 303);
  assert.equal(player().gold, 106);
  const empty = await request("/game?category=materials", {
    headers: { cookie },
  });
  assert.match(empty.html, /No items in this category/);
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

test("The Quarters filters available items and retains the category after actions", async () => {
  const view = (query = "") =>
    request(`/game${query}`, { headers: { cookie } });
  const empty = await view();
  assert.match(empty.html, /Your inventory is empty/);
  assert.match(empty.html, /No weapon equipped/);
  assert.match(empty.html, /No armor equipped/);
  assert.match(empty.html, /id="quarters-hp" min="0" max="25" value="25"/);

  sqlite.exec(`
    UPDATE users SET hp = 3, exp = 60;
    INSERT INTO inventory (user_id, item_id, quantity)
    SELECT users.id, items.id, CASE items.id WHEN 3 THEN 9007199254740991 ELSE 1 END
    FROM users CROSS JOIN items WHERE items.id BETWEEN 1 AND 4;
  `);
  const all = await view("?category=unknown");
  assert.match(all.html, /aria-current="page">All items/);
  assert.match(
    all.html,
    /value="3" class="resource-meter__track resource-meter__track--critical"/,
  );
  assert.match(all.html, /<dt>Lifetime XP<\/dt>\s*<dd>60<\/dd>/);

  const fish = await view("?category=fish");
  assert.match(fish.html, /aria-current="page">Fish/);
  assert.match(fish.html, /Murkfin/);
  assert.match(fish.html, /9,007,199,254,740,991/);
  assert.doesNotMatch(fish.html, /Rusted Sword|Lesser Potion|Recall Beacon/);
  assert.match((await view("?category=other")).html, /Recall Beacon/);

  const consumables = await view("?category=consumables");
  assert.match(consumables.html, /Restores 10 HP/);
  assert.match(
    consumables.html,
    /action="\/game\/inventory\/use\?category=consumables"/,
  );

  const use = await post("/game/inventory/use?category=consumables", {
    itemId: 1,
  });
  const useLocation = use.headers.get("location") ?? "";
  assert.match(useLocation, /category=consumables/);
  const healed = await request(useLocation, { headers: { cookie } });
  assert.match(healed.html, /value="13" class="resource-meter__track"/);
  assert.match(healed.html, /No items in this category/);

  const equip = await post("/game/inventory/equip?category=equipment", {
    itemId: 2,
  });
  const equipLocation = equip.headers.get("location") ?? "";
  assert.match(equipLocation, /category=equipment/);
  const equipped = await request(equipLocation, { headers: { cookie } });
  assert.match(equipped.html, /\+1 Attack Power/);
  assert.match(equipped.html, /No items in this category/);
  const unequip = await post("/game/inventory/unequip?category=equipment", {
    itemId: 2,
  });
  const unequipLocation = unequip.headers.get("location") ?? "";
  assert.match(unequipLocation, /category=equipment/);
  const unequipped = await request(unequipLocation, { headers: { cookie } });
  assert.match(unequipped.html, /aria-label="Equip Rusted Sword"/);
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
    equipped_weapon_id: null,
    fishing_casts_used: 0,
  });

  await post("/game/admin", { stats: { gold: 100 } });
  await post("/game/store", { items: { "item-2": 1 } });
  await post("/game/inventory/equip", { itemId: 2 });
  sqlite.exec(`
    INSERT INTO items (id, name, description, type, effect, effect_value)
    VALUES (5, 'Worn Leather Armor', 'Test armor', 'armor', 'defense', 3);
    INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 5, 2 FROM users;
  `);
  await post("/game/inventory/equip", { itemId: 5 });
  const home = await request("/game", { headers: { cookie } });
  assert.match(home.html, /<dt>Attack Power<\/dt>\s*<dd>\s*11\s*<span/);
  assert.match(home.html, /<dt>Defense<\/dt>\s*<dd>\s*3\s*<span/);
  await post("/game/inventory/unequip", { itemId: 2 });
  assert.equal(player().equipped_weapon_id, null);
});

test("at zero HP, potions and training are blocked and Sanctum requires enough gold", async () => {
  await post("/game/store", { items: { "item-1": 1 } });
  sqlite.exec("UPDATE users SET hp = 0, gold = 24;");
  const initial = player();

  await post("/game/inventory/use", { itemId: 1 });
  const training = await followAction(
    await post("/game/training", { level: 1 }),
  );
  assert.equal(training.status, 200);
  assert.match(training.html, /Heal at Sanctum/);
  assert.equal(
    (await post("/game/hospital")).headers.get("location"),
    "/game/hospital?err=gold",
  );
  assert.deepEqual(player(), initial);
  assert.deepEqual(ownedItems(), [{ item_id: 1, quantity: 1 }]);

  sqlite.exec("UPDATE users SET gold = 25;");
  assert.equal(
    (await post("/game/hospital")).headers.get("location"),
    "/game/hospital?healed=25",
  );
  assert.equal(player().hp, 25);
  assert.equal(player().gold, 0);
});

test("a failed healing write leaves the potion in inventory", async (t) => {
  await post("/game/store", { items: { "item-1": 1 } });
  sqlite.exec("UPDATE users SET hp = 5;");
  const initial = player();
  t.mock.method(console, "error", () => {});
  sqlite.exec(`
    CREATE TRIGGER fail_heal BEFORE UPDATE OF hp ON users
    BEGIN
      SELECT RAISE(ABORT, 'Test healing write failure');
    END;
  `);

  try {
    assert.equal(
      (await post("/game/inventory/use", { itemId: 1 })).status,
      500,
    );
    assert.deepEqual(player(), initial);
    assert.deepEqual(ownedItems(), [{ item_id: 1, quantity: 1 }]);
  } finally {
    sqlite.exec("DROP TRIGGER fail_heal;");
  }
});

test("training rejects malformed levels and saves the fight result", async (t) => {
  const initial = player();
  const invalid = await post("/game/training", { level: true });
  assert.equal(invalid.headers.get("location"), "/game/arena");
  assert.deepEqual(player(), initial);

  t.mock.method(Math, "random", () => 0.25);
  const fight = await followAction(
    await post("/game/training", new URLSearchParams({ level: "1" })),
  );
  assert.equal(fight.status, 200);
  assert.match(fight.html, /Training Dummy/);
  assert.doesNotMatch(fight.html, /Loot:/);
  assert.deepEqual(ownedItems(), []);
  const refresh = await request("/game/training", { headers: { cookie } });
  assert.equal(refresh.headers.get("location"), "/game/arena");
  assert.deepEqual(player(), {
    gold: 110,
    hp: 24,
    equipped_weapon_id: null,
    fishing_casts_used: 0,
  });
});

test("training unlocks a point and concurrent spends can only use it once", async (t) => {
  t.mock.method(Math, "random", () => 0.25);
  const headers = { cookie };
  for (let win = 0; win < 2; win++) {
    const fight = await followAction(
      await post("/game/training", { level: 3 }),
    );
    assert.equal(fight.status, 200);
    assert.match(fight.html, /30 XP/);
    if (win === 1) {
      assert.match(
        fight.html,
        /You reached level 2\. <a href="\/game#character-heading">Spend attribute points in The Quarters<\/a>/,
      );
    }
    await post("/game/hospital");
  }

  const home = await request("/game", { headers });
  assert.match(home.html, /id="character-heading"/);
  assert.match(
    home.html,
    /<dt>XP toward next level<\/dt>\s*<dd>0 \/ 150<\/dd>/,
  );
  assert.match(home.html, /1 unspent attribute point<\/p>/);
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
    post("/game/progression", { stat: "fortitude", amount: 999 }),
    post("/game/progression", { stat: "fortitude" }),
  ]);
  assert.equal(
    spends.filter((spend) =>
      spend.headers.get("location")?.includes("Point%20spent"),
    ).length,
    1,
  );
  assert.equal(player().hp, 25);
  const healed = await post("/game/hospital");
  assert.equal(healed.headers.get("location"), "/game/hospital?healed=3");
  assert.equal(player().hp, 28);
  assert.match(
    (await request("/game", { headers })).html,
    /0 unspent attribute points/,
  );
  const nextFight = await followAction(
    await post("/game/training", { level: 1 }),
  );
  assert.match(nextFight.html, /HP changed from 28 to 27/);
  assert.equal(player().hp, 27);
});

test("a capped training draw saves HP loss and awards no gold", async (t) => {
  sqlite.exec(
    "UPDATE users SET hp = 100000, fortitude = 33330, strength = 1, agility = 0, speed = 101;",
  );
  t.mock.method(Math, "random", () => 0.5);

  const fight = await followAction(
    await post("/game/training", { level: 100 }),
  );

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

test("the Driftwater shows full availability and reports consecutive catches", async (t) => {
  sqlite.exec(`
    INSERT INTO items (id, name, description, type, image)
    VALUES (103, 'Glassscale', 'Test fish', 'fish', '/images/glassscale.webp'),
           (104, 'Astral Koi', 'Test fish', 'fish', '/images/astral-koi.webp');
    UPDATE items SET image = '/images/murkfin.webp' WHERE id = 3;
  `);

  const initial = await request("/game/fishing", { headers: { cookie } });
  assert.match(initial.html, /Last cast/);
  assert.match(initial.html, /Cast your line into the shallows/);
  assert.match(
    initial.html,
    new RegExp(`max="${DAILY_CAST_LIMIT}" value="${DAILY_CAST_LIMIT}"`),
  );

  const rolls = [0.25, 0.25, 0.25, 0.8, 0.25, 0.98];
  t.mock.method(Math, "random", () => rolls.shift() ?? 0.9);

  const catches = [
    ["Murkfin", "murkfin"],
    ["Glassscale", "glassscale"],
    ["Astral Koi", "astral-koi"],
  ];

  for (const [index, [name, image]] of catches.entries()) {
    const { html, status } = await followAction(await post("/game/fishing"));
    assert.equal(status, 200);
    assert.ok(html.includes(`You reel in a ${name}.`));
    assert.ok(
      html.includes(
        `src="/images/${image}.webp" alt="" width="88" height="88"`,
      ),
    );
    assert.ok(
      html.includes(
        `max="${DAILY_CAST_LIMIT}" value="${DAILY_CAST_LIMIT - index - 1}"`,
      ),
    );
  }

  assert.deepEqual(ownedItems(), [
    { item_id: 3, quantity: 1 },
    { item_id: 103, quantity: 1 },
    { item_id: 104, quantity: 1 },
  ]);
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
  const pages = await Promise.all(results.map(followAction));
  assert.equal(
    pages.filter(({ html }) => /You reel in a/.test(html)).length,
    1,
  );
  for (const { html } of pages) {
    assert.match(
      html,
      /value="0" class="resource-meter__track" aria-describedby="driftwater-cast-meter-value driftwater-reset"/,
    );
    assert.match(
      html,
      /<button class="button--full" type="submit" disabled>Cast line<\/button>/,
    );
    assert.match(html, /You've used all your casts for today/);
  }
  assert.deepEqual(ownedItems(), [{ item_id: 3, quantity: 1 }]);
  assert.equal(player().fishing_casts_used, 50);
  const refresh = await request("/game/fishing?cast=1", {
    headers: { cookie },
  });
  assert.doesNotMatch(refresh.html, /You reel in a/);
  assert.equal(player().fishing_casts_used, 50);
});

test("discovery migration preserves an active expedition and its earned rewards", () => {
  const { migrationsFolder, legacyFolder } = copyLegacyMigrations(
    "0014_randomized_ruins_discoveries",
  );
  const legacy = new Database(":memory:");
  try {
    const database = drizzle(legacy);
    migrate(database, { migrationsFolder: legacyFolder });
    legacy.exec(`
      INSERT INTO users (id, name, email, password_hash, gold, hp, exp, ruins_tile, ruins_revision, ruins_enemy_pending, recall_date)
      VALUES (1, 'Legacy', 'legacy@example.test', 'unused', 168, 21, 30, 9, 12, 1, '2026-07-02');
      INSERT INTO items (id, name, description) VALUES (1, 'Lesser Potion', 'Test potion');
      INSERT INTO inventory (user_id, item_id, quantity) VALUES (1, 1, 4);
    `);
    const readState = () =>
      legacy
        .prepare(
          "SELECT gold, hp, exp, ruins_tile, ruins_revision, ruins_enemy_pending, recall_date FROM users",
        )
        .get();
    const before = readState();
    migrate(database, { migrationsFolder });
    assert.deepEqual(readState(), before);
    assert.deepEqual(legacy.prepare("SELECT quantity FROM inventory").get(), {
      quantity: 4,
    });
    assert.deepEqual(
      legacy
        .prepare("SELECT ruins_discoveries, ruins_gold_claim_date FROM users")
        .get(),
      { ruins_discoveries: null, ruins_gold_claim_date: null },
    );
  } finally {
    legacy.close();
  }
});

const ruinsPage = "/game/ruins";

function ruinsState() {
  return sqlite
    .prepare<
      [],
      {
        ruins_tile: number | null;
        ruins_revision: number;
        ruins_enemy_pending: number;
        recall_date: string | null;
        ruins_discoveries: string | null;
        ruins_gold_claim_date: string | null;
        exp: number;
        fortitude_points: number;
      }
    >(
      "SELECT ruins_tile, ruins_revision, ruins_enemy_pending, recall_date, ruins_discoveries, ruins_gold_claim_date, exp, fortitude_points FROM users WHERE email = 'test@example.test'",
    )
    .get()!;
}

/** Submits the current form revision by default. Pass an older revision to test a replay. */
function explore(
  action: string,
  destination?: number,
  revision = ruinsState().ruins_revision,
) {
  return post(ruinsPage + "/action", { action, destination, revision });
}

function viewRuins(session = cookie) {
  return request(ruinsPage, { headers: { cookie: session } });
}

function placedCaches(): RuinsDiscovery[] | null {
  const { ruins_discoveries: json } = ruinsState();
  return json ? JSON.parse(json) : null;
}

async function enterWithFixtureCaches() {
  await explore("enter");
  assert.equal(ruinsState().ruins_tile, 0);
  sqlite.prepare("UPDATE users SET ruins_discoveries = ?").run(
    JSON.stringify([
      { id: "gold-cache", tile: 1, claimed: false },
      { id: "potion-cache", tile: 14, claimed: false },
    ]),
  );
}

async function reachScavenger() {
  await enterWithFixtureCaches();
  for (const tile of [1, 2, 9]) await explore("move", tile);
  assert.equal(ruinsState().ruins_tile, 9);
}

test("Ruins entrance, adjacency, discoveries, replay protection, and normal exit", async (t) => {
  const rolls = [0, 0.24];
  const random = t.mock.method(Math, "random", () => rolls.shift() ?? 0.99);
  assert.equal((await request(ruinsPage)).headers.get("location"), "/");
  assert.match(
    (await request("/game/nexaris", { headers: { cookie } })).html,
    /href="\/game\/ruins"/,
  );
  assert.match((await viewRuins()).html, /Enter The Ruins/);
  await explore("enter");
  const start = await viewRuins();
  assert.equal(start.status, 200);
  assert.match(start.html, /Position \(0, 0\)/);
  assert.match(
    start.html,
    /class="ruins-map" data-ruins-map data-position="0" data-size="7" action=/,
  );
  assert.match(
    start.html,
    /data-player-tile role="img" aria-label="Your position \(0, 0\), entrance and exit"/,
  );
  assert.match(start.html, /src="\/js\/ruins-map\.js" defer/);
  assert.match(start.html, /aria-label="Move east to \(1, 0\)">·</);
  assert.doesNotMatch(
    start.html,
    /gold discovery|item discovery|gold-cache|potion-cache|ruins-tile--gold|ruins-tile--item|loose slab|cracked supply case/i,
  );
  const originalCaches = placedCaches();
  assert.deepEqual(originalCaches, [
    { id: "gold-cache", tile: 1, claimed: false },
    { id: "potion-cache", tile: 14, claimed: false },
  ]);
  await explore("enter", undefined, 0);
  assert.deepEqual(placedCaches(), originalCaches);
  assert.equal(random.mock.callCount(), 2);
  assert.equal(
    (start.html.match(/ruins-tile--enemy" aria-hidden="true">X</g) ?? [])
      .length,
    3,
  );
  assert.equal((start.html.match(/class="ruins-tile/g) ?? []).length, 49);
  assert.equal((start.html.match(/name="destination"/g) ?? []).length, 2);
  assert.deepEqual(ownedItems(), [{ item_id: 4, quantity: 1 }]);

  for (const invalid of [-1, 2, 8, 49]) {
    await explore("move", invalid);
    assert.equal(ruinsState().ruins_tile, 0);
  }

  const revision = ruinsState().ruins_revision;
  const moves = await Promise.all([
    explore("move", 1, revision),
    explore("move", 1, revision),
  ]);
  assert.equal(
    moves.filter((r) => r.headers.get("location")?.includes("collect")).length,
    1,
  );
  const goldLocation = moves
    .map((move) => move.headers.get("location") ?? "")
    .find((location) => location.includes("collect"));
  assert.ok(goldLocation);
  const goldPage = await request(goldLocation, { headers: { cookie } });
  assert.match(
    goldPage.html,
    /data-position="1" data-size="7" data-restore-focus/,
  );
  assert.match(
    goldPage.html,
    /ruins-notice--discovery[\s\S]*You collect 8 gold/,
  );
  assert.equal(player().gold, 108);
  assert.deepEqual(ownedItems(), [{ item_id: 4, quantity: 1 }]);
  assert.doesNotMatch(goldPage.html, /cracked supply case|potion-cache/);
  const refreshed = (await viewRuins()).html;
  assert.match(refreshed, /Position \(1, 0\)/);
  assert.match(refreshed, /You already collected this cache/);
  assert.equal(placedCaches()?.[0].claimed, true);
  await explore("exit");
  assert.equal(ruinsState().ruins_tile, 1);

  await explore("move", 0);
  await explore("move", 7);
  assert.match(
    (await viewRuins()).html,
    /ruins-empty[^>]*>There’s nothing to do here/,
  );
  const discovery = await explore("move", 14);
  const itemLocation = discovery.headers.get("location");
  assert.ok(itemLocation);
  const itemPage = await request(itemLocation, { headers: { cookie } });
  assert.match(
    itemPage.html,
    /ruins-notice--discovery[\s\S]*You collect 1 × Lesser Potion/,
  );
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: 1 },
    { item_id: 4, quantity: 1 },
  ]);
  for (const tile of [7, 0]) await explore("move", tile);
  assert.equal(
    (await explore("exit")).headers.get("location"),
    "/game/nexaris",
  );
  assert.equal(ruinsState().ruins_tile, null);
  assert.equal(placedCaches(), null);
  await explore("enter");
  assert.notDeepEqual(placedCaches(), originalCaches);
  assert.equal(ruinsState().ruins_tile, 0);
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: 1 },
    { item_id: 4, quantity: 1 },
  ]);
});

test("Ruins location survives logout and login, and other gameplay is blocked", async () => {
  sqlite.exec(
    "INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 2, 1 FROM users",
  );
  await post("/game/inventory/equip", { itemId: 2 });
  await enterWithFixtureCaches();
  await explore("move", 7);
  const beforeLogout = placedCaches();
  const logout = await post("/logout");
  assert.equal(logout.headers.get("location"), "/");
  assert.equal((await viewRuins()).headers.get("location"), "/");
  const login = await post("/login", account, "");
  assert.equal(login.headers.get("location"), ruinsPage);
  cookie = sessionCookie(login);
  assert.deepEqual(placedCaches(), beforeLogout);
  assert.match((await viewRuins()).html, /Position \(0, 1\)/);

  for (const path of [
    "/game",
    "/game/nexaris",
    "/game/store",
    "/game/hospital",
    "/game/admin",
    "/game/fishing",
    "/game/arena",
  ]) {
    const blocked = await request(path, { headers: { cookie } });
    assert.match(
      blocked.headers.get("location") ?? "",
      /^\/game\/ruins\?message=/,
    );
  }

  for (const [path, body] of [
    ["/game/hospital", {}],
    ["/game/training", { level: 1 }],
    ["/game/store", { quantities: { 1: 1 } }],
    ["/game/store/sell", {}],
    ["/game/inventory/equip", { itemId: 2 }],
    ["/game/inventory/unequip", { itemId: 2 }],
    ["/game/admin", { stats: { gold: 999 } }],
    ["/game/fishing", {}],
  ] as const) {
    assert.match(
      (await post(path, body)).headers.get("location") ?? "",
      /^\/game\/ruins\?message=/,
    );
  }
  assert.equal(player().equipped_weapon_id, 2);
  assert.equal(player().gold, 100);
  assert.equal(player().hp, 25);
});

test("Ruins Recall Beacon is permanent and resets at midnight Central time", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-07-03T04:59:59Z"),
  });
  await enterWithFixtureCaches();
  await explore("move", 1);
  assert.match(
    (await explore("recall")).headers.get("location") ?? "",
    /^\/game\/nexaris/,
  );
  assert.equal(ruinsState().ruins_tile, null);
  assert.equal(ruinsState().recall_date, "2026-07-02");
  assert.equal(player().gold, 108);
  assert.deepEqual(ownedItems(), [{ item_id: 4, quantity: 1 }]);

  await enterWithFixtureCaches();
  assert.match((await viewRuins()).html, /on cooldown/);
  await explore("recall");
  assert.equal(ruinsState().ruins_tile, 0);

  t.mock.timers.tick(1000);
  assert.match((await viewRuins()).html, /Recall Beacon available/);
  await explore("recall");
  assert.equal(ruinsState().ruins_tile, null);
  assert.equal(ruinsState().recall_date, "2026-07-03");
});

test("a failed Ruins move rolls back the discovery and allows a retry", async (t) => {
  await enterWithFixtureCaches();
  await explore("move", 7);
  assert.equal(ruinsState().ruins_tile, 7);
  const initial = ruinsState();
  const supplies = ownedItems();
  t.mock.method(console, "error", () => {});
  sqlite.exec(`
    CREATE TRIGGER fail_discovery BEFORE UPDATE OF ruins_tile ON users
    BEGIN
      SELECT RAISE(ABORT, 'Test movement write failure');
    END;
  `);

  try {
    assert.equal((await explore("move", 14)).status, 500);
    assert.deepEqual(ruinsState(), initial);
    assert.deepEqual(ownedItems(), supplies);
  } finally {
    sqlite.exec("DROP TRIGGER fail_discovery;");
  }

  assert.equal((await explore("move", 14, initial.ruins_revision)).status, 303);
  assert.equal(ruinsState().ruins_tile, 14);
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: 1 },
    { item_id: 4, quantity: 1 },
  ]);
});

test("cache claims survive revisits and gold is available again at Central midnight", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-07-03T04:59:59Z"),
  });
  await enterWithFixtureCaches();
  for (const tile of [1, 0, 1, 0, 7, 14, 7, 14, 7, 0])
    await explore("move", tile);
  assert.equal(player().gold, 108);
  assert.equal(ownedItems()[0].quantity, 1);
  assert.ok(placedCaches()?.every(({ claimed }) => claimed));
  await explore("exit");

  await enterWithFixtureCaches();
  const blocked = await followAction(await explore("move", 1));
  assert.match(blocked.html, /after midnight Central time/);
  assert.equal(player().gold, 108);
  assert.equal(placedCaches()?.[0].claimed, false);

  t.mock.timers.tick(1000);
  for (const tile of [0, 1, 0, 7, 14]) await explore("move", tile);
  assert.equal(player().gold, 116);
  assert.equal(ruinsState().ruins_gold_claim_date, "2026-07-03");
  assert.equal(ownedItems()[0].quantity, 2);
  await explore("recall");
  assert.equal(placedCaches(), null);
  assert.equal(ruinsState().ruins_gold_claim_date, "2026-07-03");

  await enterWithFixtureCaches();
  await explore("move", 1);
  assert.equal(player().gold, 116);
});

test("capped gold and full inventory leave caches available for retry", async () => {
  await enterWithFixtureCaches();
  sqlite.prepare("UPDATE users SET gold = ?").run(Number.MAX_SAFE_INTEGER);
  sqlite
    .prepare(
      "INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 1, ? FROM users",
    )
    .run(Number.MAX_SAFE_INTEGER);
  assert.match(
    (await followAction(await explore("move", 1))).html,
    /cannot carry any more gold/,
  );
  assert.equal(ruinsState().ruins_gold_claim_date, null);
  for (const tile of [0, 7]) await explore("move", tile);
  assert.match(
    (await followAction(await explore("move", 14))).html,
    /cannot carry any more of this item/,
  );
  assert.ok(placedCaches()?.every(({ claimed }) => !claimed));

  sqlite.prepare("UPDATE users SET gold = ?").run(Number.MAX_SAFE_INTEGER - 3);
  sqlite
    .prepare("UPDATE inventory SET quantity = ? WHERE item_id = 1")
    .run(Number.MAX_SAFE_INTEGER - 1);
  for (const tile of [7, 14, 7, 0]) await explore("move", tile);
  assert.match(
    (await followAction(await explore("move", 1))).html,
    /You collect 3 gold/,
  );
  assert.equal(player().gold, Number.MAX_SAFE_INTEGER);
  assert.equal(ownedItems()[0].quantity, Number.MAX_SAFE_INTEGER);
  assert.ok(placedCaches()?.every(({ claimed }) => claimed));
});

test("an expedition already underway before migration receives no caches until re-entry", async () => {
  sqlite.exec(
    "UPDATE users SET ruins_tile = 0, ruins_revision = 5, gold = 116",
  );
  for (const tile of [1, 0, 7, 14, 7, 0]) await explore("move", tile);
  assert.equal(player().gold, 116);
  assert.deepEqual(ownedItems(), []);
  assert.equal(placedCaches(), null);
  await explore("exit");
  await explore("enter");
  assert.equal(placedCaches()?.length, 2);
});

test("Ruins fights are optional and a victory applies HP, XP and gold once", async (t) => {
  sqlite.exec("UPDATE users SET strength = 100, speed = 100, exp = 30");
  const random = t.mock.method(Math, "random", () => 0);
  await reachScavenger();
  assert.equal(player().hp, 25);
  assert.equal(ruinsState().exp, 30);
  const sighting = (await viewRuins()).html;
  assert.match(
    sighting,
    /ruins-map[\s\S]*Surroundings[\s\S]*ruins-notice--encounter[\s\S]*Enemy sighted[\s\S]*Vault Scavenger/,
  );

  await explore("ignore");
  assert.deepEqual(ownedItems(), [{ item_id: 4, quantity: 1 }]);
  assert.doesNotMatch((await viewRuins()).html, /Vault Scavenger/);
  await explore("engage");
  assert.equal(ruinsState().exp, 30);
  await explore("move", 2);
  await explore("move", 9);

  random.mock.mockImplementation(() => 0.99);
  const beforeFight = placedCaches();
  const revision = ruinsState().ruins_revision;
  await Promise.all([
    explore("engage", undefined, revision),
    explore("engage", undefined, revision),
  ]);
  assert.equal(ruinsState().ruins_tile, 9);
  assert.deepEqual(placedCaches(), beforeFight);
  assert.equal(ruinsState().exp, 60);
  // The route to the Scavenger collects 8 gold before the maximum 35-gold win.
  assert.equal(player().gold, 100 + 8 + 35);
  assert.equal(player().hp, 21);
  const report = (await viewRuins()).html;
  assert.match(report, /wins\./);
  assert.doesNotMatch(report, /Loot:/);
  assert.match(
    report,
    /Surroundings[\s\S]*Reward: 35 gold, 30 XP[\s\S]*<details class="battle-details">/,
  );
  assert.match(report, /max="25" value="21"/);
  assert.doesNotMatch((await viewRuins()).html, /wins\./);
});

function equipmentId(name: (typeof ruinsEquipment)[number]["name"]) {
  return sqlite
    .prepare<[string], { id: number }>("SELECT id FROM items WHERE name = ?")
    .get(name)!.id;
}

test("a Scavenger victory stacks and reports multiple drops once even if replayed", async (t) => {
  const axe = equipmentId("Wooden Axe");
  const shield = equipmentId("Wooden Shield");
  sqlite.exec(`
    UPDATE users SET strength = 100, speed = 100;
    INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 1, 2 FROM users
    UNION ALL SELECT id, ${firstMaterialId}, 2 FROM users
    UNION ALL SELECT id, ${axe}, 1 FROM users;
  `);
  t.mock.method(Math, "random", () => 0);
  await reachScavenger();
  const revision = ruinsState().ruins_revision;

  await explore("engage", undefined, revision);
  await explore("engage", undefined, revision);
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: 3 },
    { item_id: 4, quantity: 1 },
    ...materials.slice(0, 8).map((_, index) => ({
      item_id: firstMaterialId + index,
      quantity: index === 0 ? 3 : 1,
    })),
    { item_id: axe, quantity: 2 },
    { item_id: equipmentId("Reinforced Sword"), quantity: 1 },
    { item_id: shield, quantity: 1 },
    { item_id: equipmentId("Reinforced Bracers"), quantity: 1 },
  ]);
  assert.equal(player().gold, 100 + 8 + 25);
  assert.equal(ruinsState().exp, 30);
  const report = (await viewRuins()).html;
  assert.match(report, /Reward: 25 gold, 30 XP/);
  assert.match(
    report,
    /Loot: Lesser Potion ×1, Metal Scraps ×1, Frayed Circuitry ×1/,
  );
  assert.match(report, /Wooden Axe ×1, Wooden Shield ×1/);
  assert.doesNotMatch((await viewRuins()).html, /Lesser Potion ×/);

  assert.match(
    (await post("/game/inventory/equip", { itemId: axe })).headers.get(
      "location",
    ) ?? "",
    /^\/game\/ruins/,
  );
  await explore("recall");
  const weapons = (
    await request("/game?category=weapon", { headers: { cookie } })
  ).html;
  assert.match(weapons, /Equip Wooden Axe/);
  assert.doesNotMatch(weapons, /Equip Wooden Shield/);
  const armor = (await request("/game?category=armor", { headers: { cookie } }))
    .html;
  assert.match(armor, /Equip Wooden Shield/);
  assert.doesNotMatch(armor, /Equip Wooden Axe/);

  const { getEffectiveStats } = await import("../src/services/equipment.js");
  const { db } = await import("../src/db/index.js");
  const { users } = await import("../src/db/schema.js");
  const readStats = () => getEffectiveStats(db.select().from(users).get()!);
  const base = readStats();
  await post("/game/inventory/equip?category=weapon", { itemId: axe });
  await post("/game/inventory/equip?category=armor", { itemId: shield });
  assert.deepEqual(readStats(), {
    ...base,
    attackPower: base.attackPower + 2,
    defense: base.defense + 4,
  });
  const gold = player().gold;
  assert.equal(
    (await post("/game/store/sell", { items: { [`item-${axe}`]: 2 } })).status,
    409,
  );
  assert.equal(
    (await post("/game/store/sell", { items: { [`item-${axe}`]: 1 } })).status,
    303,
  );
  assert.equal(player().gold, gold + 15);
  await post("/game/inventory/unequip?category=weapon", { itemId: axe });
  await post("/game/inventory/unequip?category=armor", { itemId: shield });
  assert.deepEqual(readStats(), base);
});

test("a Scavenger loot roll at the cutoff grants no potion", async (t) => {
  sqlite.exec("UPDATE users SET strength = 100, speed = 100;");
  t.mock.method(Math, "random", () => 0.2);
  await reachScavenger();

  await explore("engage");
  assert.equal(ruinsState().exp, 30);
  assert.deepEqual(ownedItems(), [
    { item_id: 4, quantity: 1 },
    { item_id: firstMaterialId, quantity: 1 },
    { item_id: firstMaterialId + 1, quantity: 1 },
  ]);
  assert.doesNotMatch((await viewRuins()).html, /Lesser Potion ×/);
});

test("a full potion stack leaves the Scavenger victory and other loot intact", async (t) => {
  sqlite.exec("UPDATE users SET strength = 100, speed = 100;");
  sqlite
    .prepare(
      "INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 1, ? FROM users",
    )
    .run(Number.MAX_SAFE_INTEGER);
  t.mock.method(Math, "random", () => 0.1);
  await reachScavenger();

  await explore("engage");
  assert.equal(ruinsState().exp, 30);
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: Number.MAX_SAFE_INTEGER },
    { item_id: 4, quantity: 1 },
    { item_id: firstMaterialId, quantity: 1 },
    { item_id: firstMaterialId + 1, quantity: 1 },
    { item_id: firstMaterialId + 2, quantity: 1 },
  ]);
  assert.doesNotMatch((await viewRuins()).html, /Lesser Potion ×/);
});

test("a failed Ruins reward write rolls back loot and leaves the encounter pending", async (t) => {
  sqlite.exec("UPDATE users SET strength = 100, speed = 100");
  t.mock.method(Math, "random", () => 0);
  t.mock.method(console, "error", () => {});
  await reachScavenger();
  const initial = player();
  const expedition = ruinsState();
  const owned = ownedItems();
  sqlite.exec(`
    CREATE TRIGGER fail_ruins_reward BEFORE UPDATE OF exp ON users
    BEGIN
      SELECT RAISE(ABORT, 'Test Ruins reward write failure');
    END;
  `);
  try {
    assert.equal((await explore("engage")).status, 500);
    assert.deepEqual(player(), initial);
    assert.deepEqual(ruinsState(), expedition);
    assert.deepEqual(ownedItems(), owned);
    assert.doesNotMatch((await viewRuins()).html, /Loot:/);
  } finally {
    sqlite.exec("DROP TRIGGER fail_ruins_reward");
  }
  assert.equal((await explore("engage")).status, 303);
  assert.equal(ruinsState().exp, 30);
  assert.match((await viewRuins()).html, /Metal Scraps ×1/);
});

test("Ruins defeat preserves earlier rewards, returns to Nexaris, and requires healing", async (t) => {
  sqlite.exec("UPDATE users SET hp = 1, speed = 1");
  t.mock.method(Math, "random", () => 0);
  await reachScavenger();
  const fight = await explore("engage");
  assert.equal(fight.headers.get("location"), "/game/nexaris");
  assert.equal(ruinsState().ruins_tile, null);
  assert.equal(placedCaches(), null);
  assert.ok(ruinsState().ruins_gold_claim_date);
  assert.equal(ruinsState().exp, 0);
  assert.equal(player().hp, 0);
  assert.equal(player().gold, 108);
  assert.deepEqual(ownedItems(), [{ item_id: 4, quantity: 1 }]);
  assert.match(
    (await request("/game/nexaris", { headers: { cookie } })).html,
    /was defeated/,
  );
  await explore("enter");
  assert.equal(ruinsState().ruins_tile, null);
  sqlite.exec(
    "INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 1, 1 FROM users",
  );
  await post("/game/inventory/use", { itemId: 1 });
  assert.equal(player().hp, 0);
  await post("/game/hospital");
  await explore("enter");
  assert.equal(ruinsState().ruins_tile, 0);
});

test("Ruins draw applies damage but ends the expedition without combat rewards", async (t) => {
  const encounter = getRuinsEncounter(9);
  assert.ok(encounter);
  const originalHp = encounter.enemy.hp;
  encounter.enemy.hp = 100000;
  t.after(() => {
    encounter.enemy.hp = originalHp;
  });
  sqlite.exec("UPDATE users SET hp = 100000, fortitude = 33330, strength = 1");
  t.mock.method(Math, "random", () => 0);

  await reachScavenger();
  assert.equal(
    (await explore("engage")).headers.get("location"),
    "/game/nexaris",
  );
  assert.equal(ruinsState().ruins_tile, null);
  assert.equal(player().gold, 108);
  assert.equal(placedCaches(), null);
  assert.ok(ruinsState().ruins_gold_claim_date);
  assert.equal(ruinsState().exp, 0);
  assert.ok(player().hp > 0 && player().hp < 100000);
  assert.deepEqual(ownedItems(), [{ item_id: 4, quantity: 1 }]);
  assert.match(
    (await request("/game/nexaris", { headers: { cookie } })).html,
    /ended in a draw/,
  );
});

test("Ruins use normal healing and attribute allocation without moving", async () => {
  sqlite.exec("UPDATE users SET hp = 20, exp = 60");
  sqlite.exec(
    "INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 1, 2 FROM users",
  );
  await enterWithFixtureCaches();
  await explore("move", 7);
  const before = await viewRuins();
  assert.match(
    before.html,
    /Quantity: 2[\s\S]*aria-label="Use Lesser Potion">Use/,
  );
  assert.match(before.html, /max="25" value="20"/);
  assert.match(before.html, /Unspent attribute points<\/dt>\s*<dd>1<\/dd>/);
  assert.match(
    (await post("/game/progression", { stat: "fortitude" })).headers.get(
      "location",
    ) ?? "",
    /^\/game\/ruins/,
  );
  assert.equal(ruinsState().fortitude_points, 1);
  assert.equal(player().hp, 20);
  assert.match(
    (await post("/game/inventory/use", { itemId: 1 })).headers.get(
      "location",
    ) ?? "",
    /Restored%208%20HP/,
  );
  assert.equal(player().hp, 28);
  assert.match((await viewRuins()).html, /max="28" value="28"/);
  assert.equal(ruinsState().ruins_tile, 7);
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: 1 },
    { item_id: 4, quantity: 1 },
  ]);

  sqlite.exec("UPDATE users SET hp = 0");
  await post("/game/inventory/use", { itemId: 1 });
  assert.equal(player().hp, 0);
  assert.deepEqual(ownedItems(), [
    { item_id: 1, quantity: 1 },
    { item_id: 4, quantity: 1 },
  ]);
});

test("Ruins marks the sealed Floor 2 entrance and shows descent only on the stairs", async () => {
  await explore("enter");
  const entrance = (await viewRuins()).html;
  assert.match(entrance, /ruins-tile--stairs" aria-hidden="true">2</);
  assert.doesNotMatch(entrance, /Descend to Floor 2/);

  await explore("move", 1);
  await explore("move", 2);
  const discovered = (await viewRuins()).html;
  assert.match(discovered, /Floor 2 entrance discovered/);
  assert.match(
    discovered,
    /ruins-tile--stairs ruins-tile--player" data-player-tile role="img" aria-label="Your position \(2, 0\), Floor 2 entrance"[^>]*>P2</,
  );
  assert.match(discovered, /id="ruins-floor">Floor 1</);
  assert.match(
    discovered,
    /<button type="button" disabled>Descend to Floor 2<\/button>/,
  );

  await explore("move", 1);
  const nearby = (await viewRuins()).html;
  assert.match(
    nearby,
    /aria-label="Move east to \(2, 0\), Floor 2 entrance">2</,
  );
  assert.doesNotMatch(nearby, /Descend to Floor 2/);
});

test("a Dominion win credits only the gold and XP that fit in their balances", async (t) => {
  sqlite
    .prepare("UPDATE users SET gold = ?, exp = ?")
    .run(Number.MAX_SAFE_INTEGER - 2, Number.MAX_SAFE_INTEGER - 3);
  t.mock.method(Math, "random", () => 0.25);

  const fight = await followAction(await post("/game/training", { level: 1 }));

  assert.equal(fight.status, 200);
  assert.match(fight.html, /Reward: 2 gold, 3 XP/);
  assert.equal(ruinsState().exp, Number.MAX_SAFE_INTEGER);
  assert.equal(player().gold, Number.MAX_SAFE_INTEGER);
});

test("an empty cast spends the first cast of the new Central day", async (t) => {
  t.mock.timers.enable({
    apis: ["Date"],
    now: new Date("2026-07-02T04:59:59Z"),
  });
  sqlite
    .prepare("UPDATE users SET fishing_casts_used = 50, fishing_cast_date = ?")
    .run(getFishingDate());
  t.mock.timers.tick(1000);
  t.mock.method(Math, "random", () => 0.9);

  const cast = await followAction(await post("/game/fishing"));
  assert.equal(cast.status, 200);
  assert.match(cast.html, /Your line comes back empty/);
  assert.match(
    cast.html,
    /value="49" class="resource-meter__track" aria-describedby="driftwater-cast-meter-value driftwater-reset"/,
  );
  assert.equal(player().fishing_casts_used, 1);
  assert.deepEqual(ownedItems(), []);
});

test("a failed catch write restores the fishing cast", async (t) => {
  t.mock.method(Math, "random", () => 0.25);
  t.mock.method(console, "error", () => {});
  sqlite.exec(`
    CREATE TRIGGER fail_catch BEFORE INSERT ON inventory
    BEGIN
      SELECT RAISE(ABORT, 'Test catch write failure');
    END;
  `);

  try {
    assert.equal((await post("/game/fishing")).status, 500);
    assert.equal(player().fishing_casts_used, 0);
    assert.deepEqual(ownedItems(), []);
  } finally {
    sqlite.exec("DROP TRIGGER fail_catch;");
  }

  const cast = await followAction(await post("/game/fishing"));
  assert.match(cast.html, /You reel in a Murkfin\./);
  assert.equal(player().fishing_casts_used, 1);
  assert.deepEqual(ownedItems(), [{ item_id: 3, quantity: 1 }]);
});

test("a catch at the stack limit still spends one fishing cast", async (t) => {
  sqlite
    .prepare(
      "INSERT INTO inventory (user_id, item_id, quantity) SELECT id, 3, ? FROM users WHERE email = ?",
    )
    .run(Number.MAX_SAFE_INTEGER, account.email);
  t.mock.method(Math, "random", () => 0.25);

  const cast = await followAction(await post("/game/fishing"));

  assert.equal(cast.status, 200);
  assert.match(cast.html, /You released the <strong>Murkfin<\/strong>/);
  assert.deepEqual(ownedItems(), [
    { item_id: 3, quantity: Number.MAX_SAFE_INTEGER },
  ]);
  assert.equal(player().fishing_casts_used, 1);
});

test("rendered pages expose a primary heading, main landmark, and skip target", async () => {
  for (const [route, session] of [
    ["/", ""],
    ["/?view=register", ""],
    ...[
      "/game",
      "/game/nexaris",
      "/game/arena",
      "/game/hospital",
      "/game/store",
      "/game/reliquary",
      "/game/users",
      "/game/users/1",
      "/game/fishing",
      "/game/ruins",
      "/game/admin",
      "/game/users/9999999",
    ].map((route) => [route, cookie]),
  ]) {
    const { html } = await request(route, { headers: { cookie: session } });
    assert.equal(html.match(/<h1\b/g)?.length, 1, route);
    assert.match(html, /<html lang="en">/, route);
    assert.match(html, /href="#main-content"/, route);
    assert.match(html, /<main id="main-content" tabindex="-1">/, route);

    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(ids.length, new Set(ids).size, route);
    for (const [, references] of html.matchAll(
      /\s(?:for|aria-labelledby|aria-describedby)="([^"]+)"/g,
    )) {
      for (const id of references.split(/\s+/)) {
        assert.ok(ids.includes(id), `${route} references missing ID ${id}`);
      }
    }
  }
});

test("Emporium gives explicit result feedback for purchase and empty selection", async () => {
  const empty = await followAction(await post("/game/store", { items: {} }));
  assert.match(empty.html, /data-result-focus>Enter a whole quantity/);

  const purchased = await followAction(
    await post("/game/store", { items: { "item-1": 1 } }),
  );
  assert.match(purchased.html, /data-result-focus>Purchase complete\./);
  assert.deepEqual(ownedItems(), [{ item_id: 1, quantity: 1 }]);
});

test("all new equipment is seeded with fixed modifiers and purchasable through Emporium", async () => {
  const removeEquipment = sqlite.prepare("DELETE FROM items WHERE name = ?");
  for (const { name } of ruinsEquipment) removeEquipment.run(name);
  await import("../src/db/seed.js");
  const stock = (await request("/game/store", { headers: { cookie } })).html;
  const cart: Record<string, number> = {};
  const purchased: { item_id: number; quantity: number }[] = [];
  let total = 0;
  for (const item of ruinsEquipment) {
    const id = equipmentId(item.name);
    assert.deepEqual(
      sqlite
        .prepare(
          "SELECT type, effect, effect_value, price, sell_price, description, image FROM items WHERE id = ?",
        )
        .get(id),
      {
        type: item.type,
        effect: item.effect,
        effect_value: item.effectValue,
        price: item.price,
        sell_price: item.sellPrice,
        description: item.description,
        image:
          item.type === "weapon"
            ? "/images/rusted-sword.webp"
            : "/images/worn-leather-armor.webp",
      },
    );
    assert.match(stock, new RegExp(`Quantity of ${item.name}`));
    cart[`item-${id}`] = 1;
    purchased.push({ item_id: id, quantity: 1 });
    total += item.price;
  }
  const tooExpensive = await post("/game/store", { items: cart });
  assert.equal(tooExpensive.headers.get("location"), "/game/store?err=gold");
  assert.deepEqual(ownedItems(), []);
  sqlite.exec("UPDATE users SET gold = 1000");
  const purchase = await post("/game/store", { items: cart });
  assert.equal(purchase.headers.get("location"), "/game/store?purchased=1");
  assert.equal(player().gold, 1000 - total);
  assert.deepEqual(ownedItems(), purchased);
  for (const category of ["weapon", "armor"] as const) {
    const inventory = await request(`/game?category=${category}`, {
      headers: { cookie },
    });
    for (const item of ruinsEquipment) {
      const action = new RegExp(`Equip ${item.name}`);
      if (item.type === category) assert.match(inventory.html, action);
      else assert.doesNotMatch(inventory.html, action);
    }
  }
});
