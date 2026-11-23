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

### Updating dependencies and Node

1. From the repository root, run `yarn deps:update`. You can also run
   `bash scripts/update-dependencies.sh` if Yarn is unavailable in your shell.
   The script installs and uses the latest Node LTS release through nvm,
   enables Corepack's Yarn shim for that Node version, upgrades direct
   dependencies and dev dependencies through Yarn, and runs `yarn check`
   under the new runtime. Node and dependency updates can include major upgrades.
2. Review the changes to `.nvmrc`, `package.json`, and `yarn.lock` before
   committing. Run `nvm use` in your terminal to activate the updated pin there.

## Project structure

Expected locations (verify before editing):

- `src/app.ts`: Express setup, middleware, session, routing
- `src/db/schema.ts`: Drizzle tables, constraints, and foreign keys
- `src/db/index.ts`: SQLite / Drizzle connection
- `src/db/seed.ts`: starter item and fish catalog. Inserts new item names and updates matching rows.
- `src/middleware/auth.ts`: load the signed-in player and protect game routes
- `src/routes/`: public and authentication routes
- `src/routes/game/`: arena, training, hospital, store, admin, and inventory routes. The inventory router handles consumable use and equipment.
- `src/services/`: battle simulation and item effects shared by route handlers
- `src/services/fishing.ts`: catch rolls, the daily cast limit, and the Central
  calendar date shared by The Driftwater and Admin
- `src/utils/format-number.ts`: shared display-number formatter
- `src/views/`: EJS layouts, partials, and pages
- `src/scss/main.scss`: Sass entry point. Shared variables live in `src/scss/_vars.scss`.
- `public/`: static assets, including images and compiled CSS
- `drizzle/`: database migration history
- `drizzle.config.ts`: migration configuration

The SQLite database is local runtime data, not a source-controlled artifact.

## Established gameplay concepts

- Signup names use 3–24 characters drawn from ASCII letters, digits, spaces, underscores, and hyphens. Spaces are allowed only inside the name. Enforce case-insensitive uniqueness with the SQLite name index. Use `formatPlayerName` for title case in player-facing text and keep the submitted spelling in storage.
- Signup stores the selected avatar model (`male` or `female`) on the player. The default is `male`, including for existing accounts. Use the shared player-avatar partial on Home and player profiles.

- Player attributes include gold, strength, speed, Defense, HP, maximum HP, and experience. Defense defaults to 0 for new and existing players, appears on Home, and reduces incoming damage in training.
- Equipment includes weapons and armor. Equipping stores the item ID on the user. Home and training calculate effective Strength and Defense from base stats plus bonuses from owned gear in the matching slots. Equipment changes preserve stored base stats. The Rusted Sword grants +1 Strength and Worn Leather Armor grants +3 Defense.
- Inventory has one row per player and item. Equipping and consuming require positive owned quantity. Save each purchase in one transaction so the gold deduction and inventory update either both succeed or both roll back. Use the same approach for healing and item consumption.
- Seeded healing items are Lesser Potion (10 HP), Potion (50 HP), and Greater Potion (100 HP). Healing is capped at the player's missing HP. See `src/db/seed.ts` for item values.
- The hospital, called **Sanctum**, heals missing HP at a cost of one gold per HP restored, with insufficient-funds handling.
- The store is called **Curious Emporium**.
- The item catalog includes items obtained outside the store. A null price
  means the Emporium does not list or sell the item.
- The arena is called **Dominion**.
- The dashboard is **Home**.
- **Nexaris** is the signed-in location directory at `/game/nexaris`. Add new destinations there and keep the main navigation focused on Home, Nexaris, Admin, and Logout.
- **The Reliquary** is Drevan's lore library at `/game/reliquary`.
- **The Registry** is Drevan's player directory at `/game/users`.
- At The Driftwater, each cast has an 80% chance of a bite. Only a bite rolls
  for the fish type (70% Murkfin, 25% Glassscale, 5% Astral Koi).
- Players can cast 50 times per day at The Driftwater, including empty casts.
  The allowance resets at midnight in `America/Chicago`.
- A successful catch adds one fish to inventory in the same transaction that
  spends the cast.

### Combat

- Combat is turn-based and produces a structured battle log suitable for EJS rendering.
- Strength influences a bounded random damage range; minimum damage should scale with strength rather than always being 1.
- Roll for the first attacker once per battle. Each combatant's chance is its share of the combined speed, treating speeds below 1 as 1. Subsequent attack frequency follows the speed-based intervals.
- Critical hits have a baseline 5% chance and are identified in the battle log.
- Apply Defense after the critical-hit bonus. With nonnegative Defense, the
  reduction is `0.6 * defense / (defense + 10)`. Round final damage to the
  nearest integer and enforce a minimum of 1.
- Combat is capped at 1,000 attacks to avoid runaway battles.
- Training rejects players with zero HP and accepts dummy levels 1 through `MAX_TRAINING_LEVEL` (currently 100). Use that constant for both the server limit and the form.
- Training dummies scale by selected level:
  - HP = `10 + (level - 1) * 5`
  - Strength = `2 + (level - 1)`
  - Speed = `2 + (level - 1)`
  - Defense = `Math.floor(level / 4)`
- Training saves the player's remaining HP. Wins award `level * 10` gold, with the training route as the source of truth.
- Preserve the distinction between training combat and future player-versus-player combat.

## Visual and UX conventions

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
- Keep forms and buttons restrained, readable, and accessible.
- Use `.table` inside `.table-responsive` for UI tables. Use scoped column headers and row headers where a cell identifies the row.
- Keep dynamic text escaped in EJS with `<%=`. Use unescaped output for trusted rendered markup such as partials and the layout body.
- Reuse existing SCSS classes and import shared styles with `@use "vars"` and the `vars.` namespace.
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

- Use the shared error page for HTTP errors. Render expected route errors with `renderError` from `src/middleware/errors.ts`. Keep error copy safe for players to see.

- `/game` and its child routes use the shared `requireAuth` middleware. The homepage and authentication endpoints are public. The Registry and player profiles at `/game/users/:id` require sign-in. The player pages expose game IDs, names, and levels. They display level 1 until XP progression is implemented.
- The Admin page lets signed-in players edit only these stats on their own
  account: gold, strength, speed, maximum HP, Defense, and today's fishing casts
  used (0 through the daily cast limit). It has no separate admin role check.
  Keep it out of authorization decisions for other features.

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
  fish in the seeded catalog. The seed preserves item IDs, so owned and equipped
  copies use any updated bonuses.
- For schema changes, use `yarn db:generate` and review the SQL, snapshot, and journal together before applying the migration. Test on a disposable database when possible. If a database already has changes from `db:push`, check its migration history before running `db:migrate`.
- See the [Drizzle cheatsheet](docs/drizzle-cheatsheet.md) for migration, seeding, and troubleshooting steps.

## Current development direction

The [gameplay roadmap](docs/roadmap.md) records the completed starter equipment
playtest and basic fishing. The next milestone is Emporium buyback for equipment
and fish. Follow the [battle playtest guide](docs/battle-playtesting.md)
to rerun seeded matchups and record balance decisions. The playtest script at
`scripts/playtest-battle.ts` runs the shared simulator with fixed loadouts and
writes CSV results without opening the local database.

When adding combat modes, reuse the effective-stat calculation in
`src/services/equipment.ts` and resolve fights automatically with the shared
simulator in `src/services/battle.ts`. Each encounter mode decides which
results to save and which rewards to grant.

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
- Run `yarn test` to run the unit tests once or `yarn test:watch` to rerun them as files change.
- Put unit tests in `tests/*.test.ts`. Use Node's built-in `node:test` and strict assertions. The existing `tsx` loader runs TypeScript directly, and `tsconfig.test.json` checks the tests separately from the production build.
- Use controlled random rolls in combat tests so balance changes produce repeatable results. The combat and item-effect tests run without a server or local database.
- Run `yarn check` for the Prettier check, Oxlint, TypeScript checking, and unit tests.
- Run `yarn build` to compile TypeScript and rebuild the Sass stylesheet.
- Run `yarn clean` to remove `dist/`, `node_modules/`, and Yarn's local
  install state. Run `yarn install --immutable` to reinstall from the lockfile,
  then `yarn build` to regenerate the build output.
- Run `yarn dev` to watch the server and Sass sources together. `yarn start` runs `dist/app.js` with the views under `src/views` and assets under `public`.
- Run `yarn hooks:install` once per clone to set up the repository hook. The
  installer preserves existing Git hooks. Vault Radar runs the executable
  `.husky/pre-commit` hook directly. For other existing hook setups, configure
  them to run `.husky/pre-commit` or run `yarn check` manually before committing.
- The pre-commit hook checks staged whitespace and runs `yarn check`. Run
  `yarn docs:agents` separately when reviewing gameplay, architecture, or
  workflow changes. Review and stage any edits it proposes before committing.
