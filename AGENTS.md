# Drevan — Project Instructions

## Project overview

Drevan is a browser-based, text-driven RPG inspired by early-2000s web games, particularly Alien Adoption Agency. Its world combines high fantasy and science fiction.

- World: Drevan
- Tagline: "The old world is gone. The unknown awaits."
- Design goal: approachable, nostalgic early-2000s browser RPG, not a modern glossy dashboard.

## Technology

- Node.js 24, TypeScript, Express 5, EJS templates
- SQLite using better-sqlite3 and Drizzle ORM / Drizzle Kit
- Yarn 4 (Corepack), Sass / SCSS
- Environment variables loaded with dotenv
- TypeScript uses NodeNext module and module resolution, strict mode

Inspect `package.json`, `tsconfig.json`, and existing source files for exact versions, scripts, and current behavior. Do not assume this document is more current than the code.

From the repository root, run `nvm use` to select the Node version pinned in
`.nvmrc`. On a new machine, run `nvm install` first, then `corepack enable` and
`yarn install`.

## Project structure

Expected locations (verify before editing):

- `src/app.ts`: Express setup, middleware, session, routing
- `src/db/schema.ts`: Drizzle tables, constraints, and foreign keys
- `src/db/index.ts`: SQLite / Drizzle connection
- `src/db/seed.ts`: starter item catalog. Inserts new item names and updates matching rows.
- `src/middleware/auth.ts`: load the signed-in player and protect game routes
- `src/routes/`: public and authentication routes
- `src/routes/game/`: arena, training, hospital, store, admin, and inventory routes. The inventory router handles consumable use and equipment.
- `src/services/`: battle simulation and item effects shared by route handlers
- `src/utils/format-number.ts`: shared display-number formatter
- `src/views/`: EJS layouts, partials, and pages
- `src/scss/main.scss`: Sass entry point. Shared variables live in `src/scss/_vars.scss`.
- `public/`: static assets, including images and compiled CSS
- `drizzle/`: database migration history
- `drizzle.config.ts`: migration configuration

The SQLite database is local runtime data, not a source-controlled artifact.

## Established gameplay concepts

- Player attributes include gold, strength, speed, Defense, HP, maximum HP, and experience. Defense defaults to 0 for new and existing players, appears on Home, and reduces incoming damage in training.
- Equipment includes weapons and armor. Equipping stores the item ID on the user. Training currently uses the player's base stats.
- Inventory has one row per player and item. Equipping and consuming require positive owned quantity. Save each purchase in one transaction so the gold deduction and inventory update either both succeed or both roll back. Use the same approach for healing and item consumption.
- Seeded healing items are Lesser Potion (10 HP), Potion (50 HP), and Greater Potion (100 HP). Healing is capped at the player's missing HP. See `src/db/seed.ts` for item values.
- The hospital, called **Sanctum**, heals missing HP at a cost of one gold per HP restored, with insufficient-funds handling.
- The store is called **Curious Emporium**.
- The arena is called **Dominion**.
- The dashboard is **Home**.

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
- Main container maximum width: 960px.
- Typeface: Roboto for body text and Rajdhani for headings and buttons.
- Use the shared `formatNumber` helper for server-rendered gameplay numbers and the same `en-US` locale for live browser totals. Keep form values and data attributes used in calculations numeric and ungrouped.
- Established SCSS palette:
  - Background: `#171717`
  - Surface: `#242424`
  - Primary: `#b58b4c`
  - Text: `#e5e5e5`
  - Muted: `#999999`
  - Enemy: `#ff5454`
  - Player: `#54bdff`
- Use the shared location-image partial beneath section headings. Reuse the item-figure and player-gold partials where those elements recur.
- Keep forms and buttons restrained, readable, and accessible.
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

- `/game` and its child routes use the shared `requireAuth` middleware. The homepage, authentication endpoints, and `/users` listing are public.
- The Admin page lets signed-in players edit only the following stats on their own account (gold, strength, speed, maximum HP, and Defense) and has no separate admin role check. Keep it out of authorization decisions for other features.

## Git, environment, and safety

- Never commit `.env`, secret values, local SQLite databases, or dependency directories.
- Keep `.env.example` updated when environment variables change; do not put real secrets in it.
- Keep `yarn.lock` and Drizzle migrations version-controlled.
- Do not bypass secret-scanning hooks or disable security checks.
- Ask before destructive database operations, resetting data, force-pushing, or rewriting Git history.
- Check existing Yarn scripts before running build, migration, or test commands.

### Local database workflow

- Run commands from the repository root. The app and seed script open `./data/game.sqlite`. Drizzle Kit reads `DATABASE_URL`, so point it at the same file for local development. Use `.env.example` as the starting point and supply a local `SESSION_SECRET`. `PORT` defaults to 3000.
- For a fresh local database, create the `data/` directory, run `yarn db:migrate`, and run `yarn db:seed` to load the starter catalog. Rerunning the seed updates catalog entries by name.
- For schema changes, use `yarn db:generate` and review the SQL, snapshot, and journal together before applying the migration. Test on a disposable database when possible. If a database already has changes from `db:push`, check its migration history before running `db:migrate`.
- See the [Drizzle cheatsheet](docs/drizzle-cheatsheet.md) for migration, seeding, and troubleshooting steps.

## Current development direction

The [gameplay roadmap](docs/roadmap.md) identifies equipment stat modifiers as the next combat milestone. Review the schema, equipment queries, and combat calculation paths before implementing. Reuse the effective-stat calculation for Home and combat, and preserve stored base stats when equipment changes.

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
- Run `yarn check` for the Prettier check, Oxlint, and TypeScript checking.
- Run `yarn build` to compile TypeScript and rebuild the Sass stylesheet.
- Run `yarn dev` to watch the server and Sass sources together. `yarn start` runs `dist/app.js` with the views under `src/views` and assets under `public`.
- Run `yarn hooks:install` once per clone to set up the repository hook. The
  installer preserves existing Git hooks. Vault Radar runs the executable
  `.husky/pre-commit` hook directly. For other existing hook setups, configure
  them to run `.husky/pre-commit` or run `yarn check` manually before committing.
- The pre-commit hook checks staged whitespace and runs `yarn check`. Run
  `yarn docs:agents` separately when reviewing gameplay, architecture, or
  workflow changes. Review and stage any edits it proposes before committing.
