# Database development

Drevan stores its local game data in a SQLite file at `data/game.sqlite`. Drizzle Kit manages changes to the tables, and Drevan's seed script loads the item catalog.

Run commands from the repository root after `nvm use`. Drizzle Kit reads `DATABASE_URL` from the environment, and Drevan opens `./data/game.sqlite` relative to its working directory. Keep both pointed at the same file for local development.

## Set up a fresh local database

Complete the environment setup in [Run Drevan locally](getting-started.md). Then run the following commands.

```sh
mkdir -p data
yarn db:migrate
yarn db:seed
```

The migrations build the tables. The seed loads the starter catalog and prints `Database seeded!` on success.

## Add a column or change a table

1. Edit [src/db/schema.ts](../../src/db/schema.ts). For example, `defense: integer("defense").notNull().default(0)` makes defense required and gives existing users a starting value of zero when the column is added.
2. Run `yarn db:generate`. It compares your schema (the table definitions in TypeScript) with the last saved snapshot. It writes a migration (a SQL file with instructions for changing the tables) in `drizzle/` and updates the metadata in `drizzle/meta/`. The snapshot describes the resulting tables, and the journal lists the migrations in order.
3. Review the generated SQL, snapshot, and journal together. For a new column, look for `ALTER TABLE ... ADD` and check that the column type and default match your intent.
4. Run `yarn db:migrate`. This runs the migrations your database has yet to apply and records each one in the database.
5. Commit the schema change, the SQL migration, and the generated snapshot and journal changes together.

### Migrate existing player names

The unique name index compares names without regard to ASCII capitalization. Existing names retain their spelling and capitalization. If the migration reports a uniqueness error, find the conflicting names with this read-only query.

```sql
SELECT lower(name) AS player_name, count(*) AS matches
FROM users
GROUP BY lower(name)
HAVING count(*) > 1;
```

Resolve each conflict with the affected players before rerunning `yarn db:migrate`.

## Add an item to the catalog

1. Open [src/db/seed.ts](../../src/db/seed.ts) and add an entry to the appropriate catalog list. The current seed includes potions, weapons, armor, fish, [Ruins materials and equipment](../../src/db/ruins-loot-catalog.ts), and the Recall Beacon. Copy a similar entry to see which fields it uses.
2. Run `yarn db:seed`. It inserts new item names and updates existing items with matching names. For example, changing the price of `Rusted Sword` updates that row. Changing its name creates a new row and leaves the original in place.

An item is a row in the existing table, so adding one only needs the seed script. If the item needs a new database column, apply the migration first and then run the seed.

## Review existing player data

Treat schema upgrades and catalog refreshes separately. After pulling catalog changes, apply pending migrations first, then seed. The seed preserves IDs on matching item names, so existing ownership and equipment use any updated bonuses. The Driftwater and The Ruins rely on seeded items.

Test migrations on a disposable database first when possible. Before a destructive operation or data reset, get maintainer approval. Take a consistent backup before repairing migration history or changing important existing data.

These migrations illustrate adjustments that preserved character progress.

- [0011](../../drizzle/0011_fortitude.sql) preserves spent HP points as Fortitude allocations.
- [0012](../../drizzle/0012_fortitude_health.sql) converts legacy base health and Fortitude to the nearest nonnegative base Fortitude, keeps allocated points, and clamps HP when the new cap is lower.
- [0013](../../drizzle/0013_character_class_and_speed.sql) keeps Agility and allocated Agility, initializes independent Speed from their sum, and converts the old weapon and armor Strength effect to Attack Power in place.

The November 25 Ruins changes use migration 0014 for discovery persistence and the seed for equipment, materials, and shop prices. A database already on 0014 only needs `yarn db:seed` to pick up catalog changes.

### Persistent Ruins population migration

[Migration 0015](../../drizzle/0015_eager_peter_quill.sql) adds JSON columns for an expedition's enemy instances and explored tile IDs. New expeditions fill both columns on entry. An active expedition from an older version retains its position, rewards, discoveries, and revision. It resumes with its current square treated as explored and an empty legacy population; the next successful in-expedition action saves that compatibility state, while leaving clears it with the rest of the expedition. Its next expedition receives the normal randomized population. Apply the migration before starting the updated app.

### Ruins expedition summary migration

[Migration 0016](../../drizzle/0016_ruins_expedition_summary.sql) adds JSON columns for active expedition counters and the latest finalized summary. Existing active expeditions keep their map and character state. They start recording newly completed events after migration; existing explored tile IDs remain the source for their final unique-tile count. No earlier rewards or resource use are inferred. Starting a new expedition initializes a complete counter record, and completing it replaces the player's previous summary. Apply the migration before starting the updated app.

### Randomized Ruins discovery migration

[Migration 0014](../../drizzle/0014_randomized_ruins_discoveries.sql) adds nullable columns for the expedition's discovery records and the last Central gold claim date. Active expeditions retain their position, pending enemy, and earned rewards. The former repeatable caches had no claim history to backfill, so these expeditions receive no caches until their next entry. The first expedition started under the new rules generates fresh caches and starts tracking claims. Apply the migration before starting the updated app.

## Troubleshooting

Start with the command that failed and its first error message. Run the checks below from the project root. The inspection examples use the `sqlite3` command-line tool. They use `-readonly` so a typo in the database path cannot create a new file.

### SQLite cannot open the database, or a command uses the wrong file

- For `unable to open database file`, check that `data/` exists and is writable. On a fresh checkout, run `mkdir -p data` before migrating.
- If migration succeeds but the app or seed reports `no such table` or `no such column`, check the path first. Drizzle Kit uses `DATABASE_URL`, while the app and seed open `./data/game.sqlite` relative to the working directory. An exported `DATABASE_URL` can override the value in `.env`. To target Drevan's local file explicitly, run `DATABASE_URL=./data/game.sqlite yarn db:migrate`.

### The SQLite driver fails to load

If the error mentions a missing or incompatible `better-sqlite3` native module, check your Node version. The SQLite driver includes compiled code that must match the Node version it runs under. If installation needs to compile it, follow the build tool requirements in the installer error for your platform. Run `nvm use` and `yarn install` from the project root, then retry the failed command.

### SQLite says the database is locked

For `SQLITE_BUSY` or `database is locked`, stop the dev server and close any database tools or other terminals that are still writing to the file. Retry the command once those writes have finished. Restart the server after the migration or seed completes.

### You see a `db:push` warning

Use `db:generate` and `db:migrate` for schema changes you want to keep in project history. `db:push` applies changes directly to the database without recording them as migrations. Mixing the two workflows on the same database can cause `db:migrate` to try adding a column that already exists.

If `db:push` reports potential data loss, cancel the prompt. Review the generated SQL and apply it through `db:migrate` when your database's migration history matches its schema.

### A new column is missing

1. Check that your schema change is saved in `src/db/schema.ts`. If `yarn db:generate` reports no changes, look in `drizzle/` for a migration that already adds the column. The generator compares the schema with the last snapshot, so a migration can exist even when the database still needs it.
2. Check that `DATABASE_URL` points to `./data/game.sqlite`, then run `yarn db:migrate`. To see the columns SQLite actually has, run the following command. Replace `users` with your table name if needed.

   ```sh
   sqlite3 -readonly data/game.sqlite "PRAGMA table_info(users);"
   ```

3. If the migration reports a duplicate column, compare the failing migration with the columns SQLite lists. A previous `db:push` may have applied the change without recording it. Back up the database before repairing its migration history. If the local data is disposable, you can instead rebuild it using the fresh database steps above after stopping the dev server and moving the old database to a backup location. The fresh database starts without the old users or their progress.

### A migration fails with a constraint error

A constraint is a rule the database enforces on stored data. A migration can fail if the existing rows would break a new rule.

- For `NOT NULL`, check what value existing rows should get. When adding a required column, use a database default if one value makes sense for all existing rows. If values need to vary, plan a migration that fills in the existing rows before enforcing the constraint.
- For `UNIQUE constraint failed`, check for duplicate values in the existing rows before adding a unique constraint. For `FOREIGN KEY constraint failed`, check that each ID points to an existing row in the related table. For example, an inventory row needs an existing user and item. Fix the underlying data or adjust the migration based on the intended rule.

### A migration file is missing after switching branches

Check that the SQL file, snapshot, and journal came from the same change. Restore the missing files from Git or switch back to the branch that contains them. Test schema changes on a separate local database if you switch frequently between branches with different schemas.

### A new item is missing or has the wrong values

1. Check that you added the entry to the appropriate catalog list in `src/db/seed.ts`. Confirm the exact item name and the fields you edited. The seed matches rows by name, so a renamed item will appear alongside the original.
2. Run `yarn db:seed` and check for `Database seeded!`. If the error mentions a missing table or column, run the pending migrations first, then rerun the seed. For other errors, read the first error message and check the field it names against a working item.
3. Check what was saved. Replace `Rusted Sword` with the item you added or edited.

   ```sh
   sqlite3 -readonly data/game.sqlite "SELECT name, price, type FROM items WHERE name = 'Rusted Sword';"
   ```

   If no row is returned, check the spelling and confirm the seed ran from the project root. If the row is correct, check its intended source. A null purchase price keeps an item out of the Emporium purchase list. Reload the relevant game page after seeding. If the page still looks wrong after a local database rebuild, restart the dev server so it opens the current database file.
