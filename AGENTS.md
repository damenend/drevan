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

## Project structure

Expected locations (verify before editing):

- `src/app.ts`: Express setup, middleware, session, routing
- `src/db/schema.ts`: Drizzle tables and relations
- `src/db/index.ts`: SQLite / Drizzle connection
- `src/routes/`: public and authentication routes
- `src/routes/game/`: game routes such as arena, training, hospital, store, admin, and consumables
- `src/views/`: EJS layouts, partials, and pages
- `public/`: static assets, including images and compiled CSS
- `drizzle/`: database migration history
- `drizzle.config.ts`: migration configuration

The SQLite database is local runtime data, not a source-controlled artifact.

## Established gameplay concepts

- Player attributes include gold, strength, speed, HP, maximum HP, and experience.
- Equipment includes weapons and armor; equipped-item IDs are stored on users. Stat modifiers for equipment are an area of ongoing development; inspect the schema and implementation before choosing an approach.
- Inventory tracks item quantities per player; item purchases must be validated on the server.
- Consumables include a basic Potion that restores up to 10 HP, subject to current implementation.
- The hospital, called **Sanctum**, heals missing HP at a cost of one gold per HP restored, with insufficient-funds handling.
- The store is called **Curious Emporium**.
- The arena is called **Dominion**.
- The dashboard is **Home**.

### Combat

- Combat is turn-based and produces a structured battle log suitable for EJS rendering.
- Strength influences a bounded random damage range; minimum damage should scale with strength rather than always being 1.
- Speed influences initiative and relative turn frequency.
- Critical hits have a baseline 5% chance and are identified in the battle log.
- Combat has a maximum-turn safeguard to avoid runaway battles.
- Training dummies scale by selected level:
  - HP = `10 + (level - 1) * 5`
  - Strength = `2 + (level - 1)`
  - Speed = `2 + (level - 1)`
- Winning a training battle awards gold scaled by dummy level; use the existing formula from source.
- Preserve the distinction between training combat and future player-versus-player combat.

## Visual and UX conventions

- Early-2000s web aesthetic with high-fantasy / sci-fi artwork; avoid glossy or chrome-like UI.
- Main container maximum width: approximately 980px.
- Typeface: Roboto.
- Established SCSS palette:
  - Background: `#171717`
  - Surface: `#242424`
  - Primary: `#b58b4c`
  - Text: `#e5e5e5`
  - Muted: `#999999`
  - Enemy: `#ff5454`
  - Player: `#54bdff`
- Location artwork is displayed beneath section headings, generally within a figure with a caption.
- Keep forms and buttons restrained, readable, and accessible.
- Respect existing EJS partials, SCSS conventions, and class names.
- Existing images are generally stored as WebP under `public/images/`.

## Coding and collaboration preferences

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

## Git, environment, and safety

- Never commit `.env`, secret values, local SQLite databases, or dependency directories.
- Keep `.env.example` updated when environment variables change; do not put real secrets in it.
- Keep `yarn.lock` and Drizzle migrations version-controlled.
- Do not bypass secret-scanning hooks or disable security checks.
- Ask before destructive database operations, resetting data, force-pushing, or rewriting Git history.
- Check existing Yarn scripts before running build, migration, or test commands.

## Current development direction

The next planned area is weapon and armor stat modifiers, building on existing equippable items and player equipment fields. Before implementing, review the current schema, equipment queries, and combat calculation paths to avoid applying modifiers twice or changing base stats unintentionally.

Update this file when major architecture, mechanics, or project conventions change.

## Formatting, linting, and Git hooks

- Run `yarn format` to format supported source and config files. EJS templates,
  generated CSS, migration snapshots, and the Yarn lockfile are excluded.
- Run `yarn check` for the Prettier check, Oxlint, and TypeScript checking.
- Run `yarn hooks:install` once per clone to enable Husky. The installer preserves
  existing Git hooks, including pre-commit and pre-push secret scanners.
- The pre-commit hook checks staged whitespace and runs `yarn check`. It does
  not rewrite or stage files.
