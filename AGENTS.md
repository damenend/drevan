# Drevan repository instructions

Drevan is a server-rendered, text-driven science-fantasy RPG with an early-2000s browser-game aesthetic. Work from the repository root and use the Node version in [`.nvmrc`](.nvmrc). Inspect [`package.json`](package.json), the relevant configuration, and the existing routes, services, schema, templates, and tests before editing.

## Implementation and data integrity

- Prefer small, focused changes. Reuse existing gameplay rules and UI patterns. Ask or inspect the source when an existing rule is unclear. Avoid unrelated files, dependencies, refactors, and generated changes.
- Validate and constrain inputs on the server. Use [`parseFormInteger`](src/utils/parse-form-integer.ts) for submitted nonnegative integers and apply route-specific bounds. Derive prices, rewards, ownership, and stats from trusted data. Use Drizzle's parameterized operations and transactions for changes that must succeed together.
- Preserve session and authorization boundaries, including the [game router's](src/routes/game/index.ts) sign-in and expedition guards. Admin is a self-editing playtest page and grants no authority for other features. Use [`renderError`](src/middleware/errors.ts) for shared HTTP errors and keep messages safe for players.
- Check migrations, seed data, existing rows, constraints, and dependent queries for schema changes. Keep migrations and Yarn's lockfile in Git. Keep secrets, local SQLite data, and dependencies out of commits. Update `.env.example` when configuration changes, using placeholders for secrets.
- Escape dynamic EJS output with `<%=`. Reserve `<%-` for trusted rendered markup. Use existing partials, semantic HTML, stable behavior hooks, and the shared number formatter for gameplay displays. Keep forms and calculation data numeric and ungrouped.
- Ask before destructive database operations, data resets, force-pushes, or history rewrites. Preserve Git hooks and secret scanning.

## Validation and collaboration

- Use [the contributor workflow](docs/development/workflow.md) for commands. Run `yarn check` and run `yarn test:a11y` for player-facing UI changes. Rebuild with `yarn sass:build` for Sass changes and keep the tracked stylesheet and map together.
- Explain backend, database, API, and game-design decisions in plain language for a frontend developer. Explain what changed, why, and which trade-offs matter. Use short examples and TSDoc where a function's signature leaves a rule, side effect, or contract unclear. Review nearby comments when behavior changes.
- Update the documentation that owns affected gameplay, architecture, design, or workflows. Use `yarn docs:audit` for an on-demand review of repository changes. Review proposed edits before staging.
- In the handoff, name affected files, summarize verification and limitations, and suggest a short Conventional Commit. When asked to commit, use the staged diff and report the actual subject and hash.

## Documentation by task

Open the references for the task at hand. The [documentation index](docs/README.md) maps the rest of the project.

| Task                                                          | Start here                                                                                |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Routes, sessions, services, rendering, or test infrastructure | [Architecture](docs/development/architecture.md)                                          |
| Schema, migrations, or catalog updates                        | [Database development](docs/development/database.md)                                      |
| Stats, progression, or battles                                | [Character progression](docs/gameplay/character.md) and [combat](docs/gameplay/combat.md) |
| Items, gear, trade, or healing                                | [Inventory and economy](docs/gameplay/economy.md)                                         |
| Fishing, expeditions, or other playable activities            | [Activities](docs/gameplay/activities.md) and [The Ruins](docs/gameplay/ruins.md)         |
| Components and styling                                        | [Design system](docs/design/design-system.md)                                             |
| Semantics, keyboard interaction, and browser checks           | [Accessibility](docs/design/accessibility.md)                                             |
| Player-facing copy                                            | [Writing guide](docs/world/writing-guide.md) and [terminology](docs/world/terminology.md) |
| Setting and fictional claims                                  | [Lore](docs/world/lore.md)                                                                |
| Feature scope, status, and dependencies                       | [Roadmap](docs/planning/roadmap.md) and [open questions](docs/planning/open-questions.md) |
