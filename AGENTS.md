# Drevan — Project Instructions

## Project overview

Drevan is a browser-based, text-driven RPG inspired by early-2000s web games, particularly Alien Adoption Agency. Its world combines high fantasy and science fiction.

- World: Drevan
- Tagline: "The old world is gone. The unknown awaits."
- Design goal: approachable, nostalgic early-2000s browser RPG, not a modern glossy dashboard.

## Technology

- Node.js (pinned in `.nvmrc`), TypeScript, Express 5, EJS templates
- SQLite using better-sqlite3 and Drizzle ORM / Drizzle Kit
- Yarn 4 (Corepack), Sass / SCSS
- Environment variables loaded with dotenv
- TypeScript uses NodeNext module and module resolution, strict mode

Inspect `package.json`, `tsconfig.json`, and existing source files for exact versions, scripts, and current behavior. Do not assume this document is more current than the code.

From the repository root, run `nvm use` to select the Node version pinned in
`.nvmrc`. On a new machine, run `nvm install` first. If the selected Node
version has no Corepack executable at `$NVM_BIN/corepack`, run
`npm install --global corepack`. Then run `"$NVM_BIN/corepack" enable yarn`
and `yarn install`.

### Updating Node

1. From the repository root, run `yarn node:update`. It installs the latest
   Node LTS through nvm, activates it for the script, and pins the installed
   version in `.nvmrc`.
2. Run `nvm use` in your terminal to switch that shell to the new pin. If the
   new version needs a Yarn shim, follow the Corepack setup above.

### Updating dependencies

1. From the repository root, run `yarn deps:refresh`. Yarn resolves the
   registry's `latest` releases for direct dependencies and dev dependencies,
   updates `package.json` and `yarn.lock`, reinstalls into a fresh
   `node_modules/` directory, and runs `yarn check`.
2. Review the manifest and lockfile changes before committing. A refresh can
   include major upgrades. If checks fail, use `git diff -- package.json` to
   identify the version changes. Restore a problematic package's previous range
   with a command such as `yarn up 'package-name@^2.4.0'`, then run `yarn check`
   again.

Use `yarn deps:update` to update and install dependencies without a clean
reinstall or the check suite.

## Project structure

Expected locations (verify before editing):

- `src/app.ts`: Express setup, middleware, session, routing
- `src/db/schema.ts`: Drizzle tables, constraints, and foreign keys
- `src/db/index.ts`: SQLite / Drizzle connection
- `src/db/seed.ts`: item catalog, including starter gear, fish, and the Recall Beacon. Inserts new item names and updates matching rows.
- `src/middleware/auth.ts`: load the signed-in player and protect game routes
- `src/routes/`: public and authentication routes. The homepage and auth
  error responses share `src/views/index.ejs`, which selects the login or
  signup form from `src/views/login/`.
- `src/routes/game/`: signed-in gameplay routes and the expedition access guard in `index.ts`. The inventory router handles consumable use and equipment. The Quarters and its inventory redirects share category parsing from `quarters-inventory.ts`, which also formats item effects for display.
- `src/services/` holds game rules and transactions. Route handlers validate
  requests, call the appropriate service, and handle reports and redirects.
- `src/services/battle.ts` simulates combat without opening SQLite.
  `src/services/player-battle.ts` loads owned equipment through the caller's
  transaction, runs the simulator, and calculates the changes to save.
  `src/services/training.ts` applies those changes for Dominion training.
- `src/services/character-stats.ts`: primary attribute totals, base Attack Power,
  spent attribute points, and the shared SQL expression for maximum HP. The
  schema exposes the calculated cap, and Admin and progression use the
  expression to check proposed stats.
- `src/services/equipment.ts`: combines allocated attributes with bonuses from
  owned gear in the matching slots. Its combat stats include the player's
  stored Speed, effective Attack Power, and effective Defense.
- `src/services/fishing.ts`: catch rolls and the daily cast limit shared by The
  Driftwater and Admin. `src/services/fishing-cast.ts` spends casts and saves
  catches in one transaction. The roll tests can import the fishing rules
  without opening SQLite.
- `src/services/emporium.ts` reads the catalog and handles purchases and
  sales. The store route parses the quantity fields and renders the result.
- `src/services/ruins.ts`: expedition actions and supplies. The fixed map and
  enemy definitions live in `src/services/ruins-map.ts`, which the playtest can
  import without opening SQLite.
- `src/utils/game-date.ts`: Central calendar date used by fishing and the Recall Beacon
- `src/utils/format-number.ts`: shared display-number formatter
- `src/views/`: EJS layouts, partials, and pages
- `public/js/page-accessibility.js`: shared focus for server-rendered results
  and keyboard access to overflowing tables. The main layout loads it on every page.
- `src/scss/main.scss`: Sass entry point. Shared tokens live in `src/scss/abstracts/_vars.scss`. Modules are grouped by base, layout, component, page, and utility responsibilities.
- `public/`: static assets, including images and compiled CSS
- `drizzle/`: database migration history
- `drizzle.config.ts`: migration configuration

The SQLite database is local runtime data, not a source-controlled artifact.

## Established gameplay concepts

- Signup names use 3–24 characters drawn from ASCII letters, digits, spaces, underscores, and hyphens. Spaces are allowed only inside the name. Enforce case-insensitive uniqueness with the SQLite name index. Use `formatPlayerName` for title case in player-facing text and keep the submitted spelling in storage.
- Signup stores the selected avatar model (`male` or `female`) on the player. The default is `male`, including for existing accounts. Use the shared player-avatar partial in The Quarters and player profiles.

- Player state includes gold, experience, current HP, Defense, and the primary
  attributes Strength, Agility, Intellect, and Fortitude. Strength, Agility,
  and Intellect each add one Attack Power per point, including allocated
  points. New characters start with 5 Strength, 5 Agility, and 0 Intellect,
  giving them 10 base Attack Power. Fortitude determines maximum HP. Speed
  is stored independently, starts at 5 for new characters, and controls
  initiative and attack frequency. Base Defense defaults to 0. The Quarters
  shows effective Defense, which reduces incoming combat damage.
  Base and effective Attack Power cap at half of JavaScript’s maximum safe
  integer, rounded down, so critical-hit damage stays in the exact integer
  range. The cap also applies to existing characters with extreme attributes.
- The player class identifier defaults to `unaligned`. SQLite also accepts the reserved values `melee`, `ranged`, and `caster`. The Quarters and Admin display the class. Class selection and bonuses are future work.
- New accounts start with 125 gold and three Lesser Potions. Signup requires
  the seeded Lesser Potion and saves the account and its potions together.
- Equipment includes weapons and armor. Equipping stores the item ID on the user. The Quarters, Admin, Dominion, and The Ruins calculate effective Attack Power and Defense from base stats plus bonuses from owned gear in the matching slots. Equipment changes preserve stored base stats. The Rusted Sword grants +1 Attack Power and Worn Leather Armor grants +3 Defense.
- Inventory has one row per player and item. Equipping and consuming require positive owned quantity. Save each purchase in one transaction so the gold deduction and inventory update either both succeed or both roll back. Use the same approach for healing and item consumption.
- Seeded healing items are Lesser Potion (10 HP), Potion (50 HP), and Greater Potion (100 HP). Healing is capped at the player's missing HP. Potions require positive HP. See `src/db/seed.ts` for item values.
- The hospital, called **Sanctum**, heals missing HP at a cost of one gold per HP restored, with insufficient-funds handling.
- The store is called **Curious Emporium**.
- The Emporium reads catalog prices and owned quantities inside the purchase
  transaction. It rejects carts whose total cost or resulting inventory counts
  exceed JavaScript's safe integer range. A blank quantity means zero.
  Purchase submissions redirect back to the Emporium with confirmation or
  an error message.
- The item catalog includes items obtained outside the store. A null price
  means the Emporium does not list or sell the item.
- Emporium buyback uses a separate catalog sell price. Players can sell owned
  weapons, armor, and fish with a positive sell price. An equipped slot reserves
  one copy. The Quarters shows that copy under Equipment and lists spare copies in
  Inventory. The Emporium buys spare copies while the equipped copy stays in use.
  Selling checks current ownership, equipped slots, and the gold limit in one
  transaction, then reduces all selected stacks and credits the combined payout.
- The Quarters filters available inventory through the `category` query
  parameter. Missing or unknown categories show all items. Use, Equip, and
  Unequip preserve the selected category when redirecting back to The Quarters.
- The arena is called **Dominion**.
- The dashboard is **The Quarters** at `/game`.
- **Nexaris** is the signed-in location directory at `/game/nexaris`. Add new destinations there and keep the main navigation focused on The Quarters, Nexaris, Admin, and Logout.
- **The Reliquary** is Drevan's lore library at `/game/reliquary`.
- **The Registry** is Drevan's player directory at `/game/users`.
- At The Driftwater, each cast has an 80% chance of a bite. Only a bite rolls
  for the fish type (70% Murkfin, 25% Glassscale, 5% Astral Koi).
- Players can cast 50 times per day at The Driftwater, including empty casts.
  The allowance resets at midnight in `America/Chicago`.
- A successful catch adds one fish to inventory in the same transaction that
  spends the cast. If that stack is full, the cast still counts and the fish
  is released. Fishing and Ruins discoveries share the same stack-limit check.

### The Ruins

- The Ruins opens from Nexaris at `/game/ruins`. Entering and fighting require positive HP. Floor 1 is a fixed 7×7 grid with cardinal movement and the entrance and exit at (0, 0). The map shows the player and exit. Gold, item, and enemy squares are marked during manual playtesting. Remove those event markers afterward. During manual playtesting, the sealed Floor 2 entrance is marked at (2, 0). After playtesting, hide the marker until the player stands on that square. Fixed discoveries and optional enemy offers repeat on arrival.
- On the map, arrow keys focus the available square in that direction from the
  player's position. Enter or Space submits the focused move. The player
  square is the map's initial Tab stop and receives focus on entry and after
  each move. All
  legal moves remain in the Tab order. The player square describes its tile
  feedback, and the Map markers disclosure lists the other visible markers.
- The player row stores the current tile (null outside), whether an enemy is available on that visit, and the form revision. Each successful expedition action increments the revision. Movement, discovery rewards, combat results, and exits commit with their corresponding state in one transaction.
- The shared simulator uses equipped bonuses and allocated stats. A win awards a random amount of gold within the enemy’s inclusive range and fixed XP, and preserves exploration. The [Ruins design brief](docs/ruins-design-brief.md#floor-1-reference) lists each payout. Defeat and draw save remaining HP, grant no fight reward, and return the player to Nexaris.
- A Vault Scavenger win has a provisional 20% chance to add one Lesser
  Potion in the same transaction as the combat rewards. The battle report
  lists the potion when it was added to inventory.
- The session carries the battle report to the next page. Show it once in The
  Ruins after victory or in Nexaris after defeat or a draw.
- The first entry grants a seeded Recall Beacon through normal inventory. It stays owned and returns the player to Nexaris once per Central calendar day from any square. Use the same date helper as fishing.
- The game router redirects other gameplay routes to The Ruins while the player is inside. The existing inventory-use and progression endpoints allow healing potions and attribute point allocation. Equipment changes require leaving the expedition. Login resumes the stored position.

### Combat

- Combat is turn-based and produces a structured battle log suitable for EJS rendering.
- Attack Power sets the random damage range from half its value rounded up through its full value, with a minimum of 1.
- Roll for the first attacker once per battle. Each combatant's chance is its share of the combined speed, treating speeds below 1 as 1. Subsequent attack frequency follows the speed-based intervals. For later attacks due at the same time, roll evenly for which fighter attacks first. The second fighter attacks if they survive.
- Critical hits have a baseline 5% chance and are identified in the battle log.
- Apply Defense after the critical-hit bonus. With nonnegative Defense, the
  reduction is `0.6 * defense / (defense + 10)`. Round final damage to the
  nearest integer and enforce a minimum of 1.
- Combat is capped at 1,000 attacks. If both fighters survive, the fight is a draw. Training keeps the player’s remaining HP and awards zero gold on a draw. Future progression rewards should require a qualifying win.
- Training rejects players with zero HP and accepts dummy levels 1 through `MAX_TRAINING_LEVEL` (currently 100). Use that constant for both the server limit and the form.
- Dominion defaults the training form to level 1 when the requested level is
  missing or invalid.
- Training dummies scale by selected level:
  - HP = `10 + (level - 1) * 5`
  - Attack Power = `2 + (level - 1)`
  - Speed = `2 + (level - 1)`
  - Defense = `Math.floor(level / 4)`
- Training and fishing redirect after saving an action. The next result page
  reads and clears the report from the session, so refreshing the result does
  not repeat the action.
- Training saves remaining HP and awards `dummy level * 10` gold and XP on a
  win in one transaction. Each reward is capped by how much fits in its
  balance, up to JavaScript’s maximum safe integer. Losses and draws grant
  zero rewards.
- Character levels 2 through 10 cost 60, 150, 270, 420, 600, 810, 1,050,
  1,320, and 1,620 XP per level-up. The Quarters shows XP earned toward the
  next level. Excess XP carries over, and the database stores lifetime XP.
  Each level-up grants one point, up to nine. Level 10 starts at 6,300
  lifetime XP. The Quarters shows lifetime XP at every level, and it continues
  to accumulate at the cap.
- Players spend one attribute point (AP) on +1 Strength, Agility, Intellect, or Fortitude. Store allocated points separately from base attributes. Each Fortitude adds 3 max HP, and new characters start with 5 Fortitude and 25 current HP. Both The Quarters and The Ruins allow allocation without refilling current HP.
- Use the shared effective HP expression for healing and stat validation. The cap is 10 plus 3 HP per total Fortitude. Migration `0011_fortitude` preserves spent HP points as Fortitude allocations. Migration `0012_fortitude_health` converts legacy base health and base Fortitude into the nearest nonnegative base Fortitude, then removes the stored base HP column. It preserves allocated points and clamps current HP only when the new cap is lower.
- Migration `0013_character_class_and_speed` keeps the old Agility values and
  allocations under `agility` and `agility_points`. It initializes each existing
  player's independent Speed to their sum. It converts the `strength` effect
  on catalog weapons and armor to `attack_power` in place, preserving item IDs
  and ownership.
- Preserve the distinction between training combat and future player-versus-player combat.

## Visual and UX conventions

Use the [design system](docs/design-system.md) for shared UI foundations,
components, interaction patterns, and accessibility review.
Run `yarn test:a11y` for user-facing UI changes alongside `yarn check`. Use
[the accessibility verification guide](docs/accessibility.md) for browser setup,
rendered HTML checks, and manual workflow verification.

Consult the [writing guide](docs/writing-guide.md) and [lore reference](docs/lore.md) whenever adding or revising player-facing copy. The [roadmap](docs/roadmap.md) remains the source of truth for development planning.

- Early-2000s web aesthetic with high-fantasy / sci-fi artwork; avoid glossy or chrome-like UI.
- Main container maximum width: 1320px.
- Typeface: Roboto for body text and Rajdhani for headings and buttons.
- Use the shared `formatNumber` helper for server-rendered gameplay numbers and the same `en-US` locale for live browser totals. Keep form values and data attributes used in calculations numeric and ungrouped.
- Established SCSS palette:
  - Background: `#171717`
  - Surface: `#242424`
  - Primary: `#b58b4c`
  - Text: `#e5e5e5`
  - Muted: `#999999`
  - Red (`$color-red`): `#ff5454`
  - Blue (`$color-blue`): `#54bdff`
- Use the shared location-image partial beneath section headings. Reuse the item-figure and player-gold partials where those elements recur.
- Use the `resource-meter` partial for bounded values such as daily casts
  remaining at The Driftwater. The Quarters and The Ruins use the `health-meter`
  wrapper, which supplies HP values and marks health below 25% as critical.
  The Quarters uses the `item-effect` partial for both inventory and equipped gear.
- Keep forms and buttons restrained, readable, and accessible.
- Use the location name for links in directories or prose. Include the action
  and destination when a link is a next step, such as “Return to Dominion.”
  Underline links in paragraphs so players can identify them without color.
- Use `.table` inside `.table-responsive` for UI tables. Preserve native table
  layout at narrow widths and set `data-scroll-label` on the wrapper so it
  becomes a named keyboard stop when the table overflows. Use scoped column
  headers and row headers where a cell identifies the row.
- Use one page `h1` and the shared layout's focusable main landmark as the skip
  target. For a server-rendered form result, mark one concise result with
  `tabindex="-1"` and `data-result-focus`. The Ruins movement script handles
  focus restoration on the player square.
- Keep dynamic text escaped in EJS with `<%=`. Use unescaped output for trusted rendered markup such as partials and the layout body.
- Reuse existing SCSS classes and import shared tokens with `@use "../abstracts/vars"` and the `vars.` namespace.
- Use stable IDs or data attributes for browser behavior. The Ruins map script
  uses `data-ruins-map` to find the movement form.
- Existing images are generally stored as WebP under `public/images/`.

## Coding and collaboration preferences

The maintainer primarily works in frontend development. Assume junior-level
familiarity with database design, APIs, backend architecture, and especially game
design. Whenever a change touches these areas, explain what changed, why you
chose that approach, and any trade-offs that matter for Drevan. Use plain
language and define unfamiliar terms as they come up. Apply the same standard
to code comments and documentation, using short examples when they help explain
a rule or decision.

Make documentation easy to scan for a junior developer. Use descriptive
headings, group related information, and put the common workflow first. Use
numbered steps and command blocks for procedures. Explain what a command does
and what success looks like when it helps the reader check their work.

Use TSDoc-style block comments for functions and methods when callers need
context about a game rule, input requirement, return value, or side effect.
Explain the behavior that the signature leaves unclear. Add tags such as
`@param` and `@returns` when they clarify that contract. A short line comment
is enough for a simple route label. Skip comments that repeat the name or code.
When changing behavior, review nearby comments for accuracy.

1. First inspect the relevant routes, templates, schema, and helpers. Follow existing patterns instead of introducing a new architecture unnecessarily.
2. Prefer small, focused, incremental changes. Explain the reasoning briefly and show which files are affected.
3. Keep game rules and calculations on the server; never trust browser-submitted prices, rewards, or stats.
4. Validate and constrain user input. Use Drizzle query helpers and parameterized database operations.
5. Preserve login/session and authorization checks on protected routes.
6. Keep routes readable and modular. Reuse existing game logic rather than duplicating it.
7. Use TypeScript types for game state, combatants, and structured battle logs.
8. When changing the database schema, consider migrations, existing data, seed scripts, and the corresponding player-data queries.
9. Avoid adding dependencies or broad refactors without a clear reason.
10. Prefer explaining a change and its tradeoffs so the developer can learn, rather than making unexplained large edits.
11. Do not modify unrelated files, secrets, or generated assets without a clear need.
12. When uncertain about an existing rule or implementation, ask or inspect the source rather than inventing behavior.

### Route boundaries

- Use `renderError` from `src/middleware/errors.ts` for the shared HTTP error
  page. This includes the signup 503 when the starter catalog is unavailable.
  Keep error copy safe for players to see.
- The public homepage shows login by default. Use `/?view=register` to link
  directly to signup. Render login validation and credential errors and signup
  validation and duplicate-account errors with the corresponding form and HTTP
  status. Login restores the submitted email. Signup restores the submitted
  player name, email, and valid avatar choice. Passwords are entered again
  after a form error.
- Login and signup create a fresh session and save the signed-in player ID
  before redirecting to The Quarters or resuming an active expedition in The Ruins.
- Use `parseFormInteger` from `src/utils/parse-form-integer.ts` for nonnegative
  whole numbers submitted to game routes. It accepts digit-only text and safe
  JSON integers. Apply each route's own bounds after parsing.

- `/game` and its child routes use the shared `requireAuth` middleware. The homepage and authentication endpoints are public. The Registry and player profiles at `/game/users/:id` require sign-in. The player pages expose game IDs, names, and levels. Levels are derived from lifetime XP.
- The Admin page lets signed-in players edit their own base primary attributes,
  gold, base Defense, and today's fishing casts used (0 through the daily cast
  limit). Current and maximum HP, class, Speed, and effective Attack Power are
  read-only. Changing base Fortitude
  refills current HP to its new cap, including allocated Fortitude. Saving
  other changes preserves current HP. Admin has no separate role check. Keep
  it out of authorization decisions for other features.

## Git, environment, and safety

- After completing repository changes, draft a suggested commit message based on the final diff. Use a short Conventional Commit subject, such as `feat: apply equipped item stat modifiers`. Add a brief body when it helps explain why the change was made, what behavior changed, or what a contributor needs to do after pulling.
- Include the suggested message in the handoff. When the user asks for a commit, use the staged diff to draft the message and include the final subject and commit hash in the handoff.
- Never commit `.env`, secret values, local SQLite databases, or dependency directories.
- Keep `.env.example` updated when environment variables change; do not put real secrets in it.
- Keep `yarn.lock` and Drizzle migrations version-controlled.
- Do not bypass secret-scanning hooks or disable security checks.
- Ask before destructive database operations, resetting data, force-pushing, or rewriting Git history.
- Check existing Yarn scripts before running build, migration, or test commands.

### Local database workflow

- Run commands from the repository root. The app and seed script open `./data/game.sqlite`. Drizzle Kit reads `DATABASE_URL`, so point it at the same file for local development. Use `.env.example` as the starting point and supply a local `SESSION_SECRET`. `PORT` defaults to 3000.
- For a fresh local database, create the `data/` directory, run `yarn db:migrate`, and run `yarn db:seed` to load the starter catalog. Rerunning the seed updates catalog entries by name.
- After pulling item catalog changes, apply any new migrations before running
  `yarn db:seed` on your existing local database. The Driftwater looks up caught
  fish in the seeded catalog, and The Ruins uses it to grant the Recall Beacon. The seed preserves item IDs, so owned and equipped
  copies use any updated bonuses.
- For schema changes, use `yarn db:generate` and review the SQL, snapshot, and journal together before applying the migration. Test on a disposable database when possible. If a database already has changes from `db:push`, check its migration history before running `db:migrate`.
- See the [Drizzle cheatsheet](docs/drizzle-cheatsheet.md) for migration, seeding, and troubleshooting steps.

## Current development direction

The [gameplay roadmap](docs/roadmap.md) records the completed starter systems,
level 10 progression prototype, playable Ruins MVP, and first victory drop.
The next Ruins milestone continues with full-expedition playtesting before
expanding victory loot and adding material drops. Follow the
[battle playtest guide](docs/battle-playtesting.md) to run seeded matchups and
record balance decisions. The Ruins playtest uses the live enemy definitions
and runs without opening the local database. By default it uses player builds
with the current Attack Power and Speed rules. Both modes use each Ruins
enemy’s average gold payout to compare combat on identical seeds. Pass
`--historical` to reproduce the original Floor 1 comparison with the earlier
player builds.

When adding an encounter that saves a player's combat result, use
`resolvePlayerBattle` inside the encounter's transaction. The encounter
supplies its reward amounts and saves the returned HP, gold, and XP changes
alongside its own state. Playtests that supply their own combatants can call
`simulateBattle` directly.

Balance player-versus-environment (PvE) encounters first. Use repeatable
matchups with controlled random rolls to measure the effect of one rule change
at a time. Use practice PvP results to decide whether a mode-specific balance
rule is warranted.

Before finishing a change, check whether it affects documented gameplay rules,
architecture, or contributor workflows such as build commands, environment setup,
or hooks. Correct outdated guidance and record new conventions that future
contributors should follow. Keep routine refactors and one-off details in the
code or commit history.

Run `yarn docs:agents` for an on-demand review after manual or agent-assisted
changes. The audit reviews staged and unstaged changes and relevant unignored
new files. It flags missing or stale function and method comments when they
would help a reader understand the code. It updates only `AGENTS.md` and
leaves staging to the contributor.
`yarn install` provides the project-local Codex CLI. Use
`yarn codex login` if the CLI needs authentication. Review any proposed edits
with `git diff -- AGENTS.md` before staging.

## Formatting, linting, and Git hooks

- Run `yarn format` to format supported source and config files. EJS templates,
  generated CSS, migration snapshots, and the Yarn lockfile are excluded.
- The VS Code workspace uses EJS Beautify with two-space indentation for EJS files.
- Run `yarn test` to run the tests once or `yarn test:watch` to rerun them as files change.
- Put unit and integration tests in `tests/*.test.ts`. Use Node's built-in `node:test` and strict assertions. The existing `tsx` loader runs TypeScript directly, and `tsconfig.test.json` checks the tests separately from the production build.
- Use controlled random rolls in combat tests so balance changes produce repeatable results. The combat and item-effect tests run without a server or local database.
  HTTP integration tests apply migrations in a temporary working directory
  before importing the Express app, which opens `./data/game.sqlite` on import.
  The tests start their own loopback listener. Running `src/app.ts` directly
  starts the normal listener.
- Run `yarn check` for the Prettier check, Oxlint, TypeScript checking, and the test suite.
- `yarn test:a11y` runs separately in Chromium with axe and keyboard checks.
  It starts a loopback server and uses a disposable, seeded database. Follow
  the accessibility verification guide for browser installation and manual checks.
- Run `yarn build` to compile TypeScript and rebuild the Sass stylesheet.
- For Sass changes, run `yarn sass:build` to rebuild the tracked stylesheet
  and source map. Keep both generated files together in the change.
- Run `yarn clean` to delete `node_modules/` and reinstall dependencies.
  If Yarn reports a missing `node_modules` state file before the script can
  start, run `yarn` directly to restore the installation.
- Run `yarn dev` to watch the server and Sass sources together. `yarn start` runs `dist/app.js` with the views under `src/views` and assets under `public`.
- Run `yarn hooks:install` once per clone to set up the repository hook. The
  installer preserves existing Git hooks. Vault Radar runs the executable
  `.husky/pre-commit` hook directly. For other existing hook setups, configure
  them to run `.husky/pre-commit` or run `yarn check` manually before committing.
- The pre-commit hook checks staged whitespace and runs `yarn check`. Run
  `yarn docs:agents` separately when reviewing gameplay, architecture, or
  workflow changes. Review and stage any edits it proposes before committing.
