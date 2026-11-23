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
  assert.equal(
    (await request("/game/users/999", { headers: { cookie } })).status,
    404,
  );
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
