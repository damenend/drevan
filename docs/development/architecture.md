# Application architecture

Drevan uses Express to render EJS pages, TypeScript services to apply game rules, and SQLite to save player state. Find the request entry point first, then follow the calls into rules, persistence, and rendering.

## Requests, authentication, and sessions

[`src/app.ts`](../../src/app.ts) configures parsing, static files, EJS, the shared layout, sessions, and error handlers. The [public router](../../src/routes/index.ts) mounts the homepage, account actions, and game routes. The homepage shows login by default. `/?view=register` opens signup. Validation and credential or duplicate-account errors render the relevant form and status, restoring the submitted email and, for signup, the name and valid avatar choice. Password fields remain blank. Signup with a missing starter catalog goes through the [shared error handler](../../src/middleware/errors.ts) with a 503.

The [authentication middleware](../../src/middleware/auth.ts) loads the player from the session's user ID. [Login and signup](../../src/routes/auth.ts) replace and save the session before redirecting. Login returns the player to a saved expedition when one exists. The [game router](../../src/routes/game/index.ts) requires authentication and controls which actions are available during expeditions. The Registry and player profiles expose game IDs, names, and levels to signed-in players. Profiles also show the chosen avatar.

Sessions use Express's in-memory store for login and pending reports. Restarting the process clears them. SQLite preserves characters, inventory, and expedition state. See the [launch proposal](../planning/launch-architecture.md) for production considerations.

## Rules and persistence

Route handlers parse input, call shared rules or persistence services, and render or redirect. The [database connection](../../src/db/index.ts) uses better-sqlite3 and Drizzle with foreign keys enabled. A transaction groups related writes so a failed inventory update can roll back the matching gold deduction, for example. Read current ownership and balances within the transaction when they control eligibility.

The [battle simulator](../../src/services/battle.ts) runs without SQLite and returns a structured log. Use [`resolvePlayerBattle`](../../src/services/player-battle.ts) inside the encounter's transaction when saving combat. It loads effective stats and computes changes. The encounter supplies rewards and saves HP, rewards, and any encounter-specific state. Playtests with explicit combatants can call `simulateBattle` directly. [Fishing rules](../../src/services/fishing.ts) and [Ruins encounter data](../../src/services/ruins-map.ts) also support use independently of SQLite.

The [Ruins loot tables](../../src/services/ruins-loot.ts) roll item names and quantities independently of combat and SQLite. The [reward service](../../src/services/ruins-rewards.ts) resolves those names to seeded item IDs and adds stacks within the fight transaction. A catalog row missing from an older seed is skipped. Run the [catalog refresh](database.md#review-existing-player-data) to enable the new drops.

The [Ruins discovery definitions and placement](../../src/services/ruins-discoveries.ts) are independent of the fixed map encounters. The [expedition service](../../src/services/ruins.ts) checks the submitted revision before applying an exploration action. On a move, it asks the reward service to resolve the destination's cache. It saves the resulting player changes and advances the revision in the same transaction as any item grant.

For training, fishing, and Ruins fights, a submission saves the action and redirects. The next eligible page reads and clears the session report. Refreshing that page does not repeat the action. Other routes can redirect with simple feedback in the URL, such as Emporium checkout.

The [inventory service](../../src/services/inventory.ts) provides stack grants for purchases, fishing, and Ruins rewards and handles item use and equipment writes. The [Quarters handler](../../src/routes/game/quarters.ts) and [Emporium service](../../src/services/emporium.ts) use the same [equipment rules](../../src/services/equipment.ts) to count spare copies. The Emporium shares catalog eligibility rules between its listings and checkout. Purchase and sale transactions check current prices, ownership, and gold before updating inventory and gold together. A purchase rolls back if any inventory grant fails to update a stack.

## Rendering and browser behavior

The [main layout](../../src/views/layouts/main.ejs) provides the shell and helpers exposed by Express. Views include [reusable partials](../../src/views/partials/) for figures, meters, and reports. [The Sass entry point](../../src/scss/main.scss) organizes shared tokens, base rules, layout, components, pages, and utilities. It builds to [tracked CSS and its source map](../../public/css/). [Static art](../../public/images/) is generally WebP.

[Browser scripts](../../public/js/) enhance native forms with cart feedback, keyboard map navigation, result focus, and accessible overflow handling. The [Emporium cart script](../../public/js/store.js) reads the gold limit from each form and the unit price from each [quantity field](../../src/views/partials/cart-quantity.ejs). The server owns game rules and final validation. See the [design system](../design/design-system.md) for patterns.

## Tests

[Unit tests](../../tests/) use Node's test runner with `tsx`. Battle, item, and fishing rules can be tested without a server. [HTTP integration tests](../../tests/game-routes.test.ts) migrate a disposable database in a temporary working directory before importing the app, then open a loopback listener. Importing the app does not start its normal listener. The [accessibility runner](../../scripts/test-accessibility.mjs) uses a separate disposable seeded database and a Chromium browser. It also exercises an Emporium purchase and a Ruins move with JavaScript disabled. See [validation commands](workflow.md#validate-and-build).
