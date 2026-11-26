# Drevan design system

Drevan is a text-driven browser RPG with an early-2000s web aesthetic and a high-fantasy science-fiction setting. Its interface uses compact typography, dark surfaces, gold actions, and illustrated locations. Players should be able to read the game state and take the next action quickly, whether they are comparing prices or deciding to retreat from The Ruins.

Use this reference when designing a new screen, extending a component, or briefing an agent. The Sass and EJS files define the shipped implementation. The [writing guide](../world/writing-guide.md) governs player-facing copy, the [lore reference](../world/lore.md) governs setting details, and the [roadmap](../planning/roadmap.md) governs planned gameplay.

## Design principles

- **Put the decision first.** Show the relevant state, cost, and consequence close to the action. A player deciding whether to enter an unexplored Ruins square needs current HP and the risk of a hidden mandatory encounter within easy reach.
- **Use a clear hierarchy.** Let headings, spacing, and plain labels organize the screen. Reserve strong accents for actions, active states, and meaningful feedback.
- **Keep the world visible.** Use location art, item icons, and short observations to express the setting. Use concise language for rules, rewards, and recovery steps.
- **Build on native controls.** Use semantic links, buttons, forms, tables, and headings. Add JavaScript for behavior such as live totals and directional map focus while preserving the underlying forms.

## Foundations

### Color and spacing tokens

Shared design tokens are Sass variables in [`src/scss/abstracts/_vars.scss`](../../src/scss/abstracts/_vars.scss). Use the semantic token for the element’s role. Actions and links use muted gold, player and positive combat values use blue, and errors and critical health use red. The spacing scale below uses quarter-rem steps.

| Token       | Value     | Common application                           |
| ----------- | --------- | -------------------------------------------- |
| `$space-1`  | `0.25rem` | Field labels, notes, and stat breakdowns     |
| `$space-2`  | `0.5rem`  | Control padding and grouped actions          |
| `$space-3`  | `0.75rem` | Heading margins and item figure gaps         |
| `$space-4`  | `1rem`    | Container gutters and form groups            |
| `$space-5`  | `1.25rem` | Authentication navigation spacing            |
| `$space-6`  | `1.5rem`  | Section spacing and stacked activity regions |
| `$space-8`  | `2rem`    | Activity and character column gutters        |
| `$space-10` | `2.5rem`  | Wide homepage column gutter                  |

The page shell uses a centered `1320px` container with `1rem` inline padding. The activity grid caps at `60rem` with location and map columns up to `30rem` and `28rem`. Wide tables scroll in their own wrappers, which also contain positioned accessibility labels. The default stat grid fits as many columns as it can at a `140px` minimum. Compact grids opt into explicit column variants.

| Breakpoint                         | Layout transition                                                            |
| ---------------------------------- | ---------------------------------------------------------------------------- |
| `$breakpoint-equipment` at `36rem` | Equipment slots sit side by side                                             |
| `$breakpoint-columns` at `44rem`   | Activities and character overview gain columns                               |
| `$breakpoint-wide` at `60rem`      | Homepage uses a two-column layout, and the attributes grid fits four columns |

Use range syntax such as `@media (width >= vars.$breakpoint-columns)`. Keep component geometry, such as the map tile aspect ratio and meter track height, separate from ordinary spacing.

Use `$radius-small` (`3px`) for controls, portraits, battle summaries, and map tiles. Use `$radius-panel` (`4px`) for location images and stat groups. The standard border is 1px, and selection and heading rules use 2px. Notices use a 3px leading rule. Standard keyboard focus uses a light 2px outline at a 2px offset. The Ruins uses inset outlines with different colors for available moves and the player tile. Available moves have a brighter border for contrast against the tinted tile, with dedicated borders for map markers.

### Typography

Use Roboto for body text and Rajdhani for headings and buttons. Follow the shared type styles for size, weight, and heading hierarchy. [Typography styles](../../src/scss/base/_typography.scss)

### Imagery

Location images are generally WebP, displayed in a figure with a caption. The standard illustration is capped at `30rem` and a banner can span its container. Location artwork normally follows the page heading. Inside The Ruins, the interior art follows the gameplay controls and report. Item icons are `3 × 3rem` and sit beside the item name. Player portraits display at `10rem` wide with a `2:3` crop. Provide meaningful alt text when the image conveys information. Use empty alt text when the image is decorative or the adjacent text supplies its identity. [Image styles](../../src/scss/components/_images.scss)

## Components

| Component                       | Structure and states                                                                                                                                                                                                                 | Implementation                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site navigation                 | A wrapping row of links with current-page, hover, and keyboard-focus states. The current page uses gold, heavier type, and `aria-current="page"`. Log out is a form button styled as a link.                                         | [Navigation partial](../../src/views/partials/navigation.ejs) and [navigation styles](../../src/scss/components/_navigation.scss)                                                  |
| Link                            | Navigates to a location or next step. Inline links are underlined. Use the location name in directories and an action plus destination when guiding recovery, such as **Revive at Sanctum**.                                         | [Typography styles](../../src/scss/base/_typography.scss)                                                                                                                          |
| Button                          | Submits a form or performs an action. Default treatment is gold with dark text. Hover lightens the background, keyboard focus adds an outline, and disabled controls use reduced opacity. Name the action in sentence case.          | [Form styles](../../src/scss/components/_forms.scss)                                                                                                                               |
| Form field                      | Inputs are full width by default. Use compact controls for quantity cells. Quantity controls use `.item-quantity` with a `5rem` maximum. Keep instructions and validation feedback near the field.                                   | [Signup example](../../src/views/login/register.ejs) and [Emporium example](../../src/views/game/store.ejs)                                                                        |
| Choice card                     | Wrap a native radio in `.choice-card` when the full illustrated or descriptive surface should select it. Checked, focused, and disabled states remain visible; `.choice-card--compact` reduces padding and radius for small choices. | [Choice card styles](../../src/scss/components/_choice-card.scss), [signup avatars](../../src/views/login/register.ejs), and [Conclave classes](../../src/views/game/conclave.ejs) |
| Data table                      | Put `.table` inside `.table-responsive`. The table uses gold headers, striped rows, and a hover treatment.                                                                                                                           | [Table styles](../../src/scss/components/_table.scss)                                                                                                                              |
| Location figure                 | Renders an image and caption, with a banner variant for wide location artwork.                                                                                                                                                       | [Location image partial](../../src/views/partials/location-image.ejs)                                                                                                              |
| Item figure and player portrait | Item figures keep the item name visible even when an image is absent. Player portraits use the selected avatar model and an accessible description.                                                                                  | [Item figure](../../src/views/partials/item-figure.ejs) and [player avatar](../../src/views/partials/player-avatar.ejs)                                                            |
| Character stats and gold        | Use a description list for label and value pairs. Show the effective stat first and add the base value and signed modifier when it differs. Reuse the shared gold display.                                                           | [The Quarters](../../src/views/game/index.ejs), [stat total](../../src/views/partials/stat-total.ejs), and [player gold](../../src/views/partials/player-gold.ejs)                 |
| Combat readiness                | Keep current level, HP, XP toward the next level, and effective combat stats together before a combat action. Give HP more prominence than XP and use exact values alongside both meters.                                            | [Player status](../../src/views/partials/player-status.ejs) and [Dominion](../../src/views/game/arena.ejs)                                                                         |
| Battle report                   | Shows the outcome summary before an expandable attack log. Blue and red identify actors alongside their names. Critical hits have an explicit label. The summary shows the outcome, HP change, and any awarded gold, XP, or loot.    | [Battle log partial](../../src/views/partials/battle-log.ejs) and [battle styles](../../src/scss/components/_battle.scss)                                                          |
| Status message and error page   | Place contextual feedback near the action or at the top of the relevant view. Use the shared error page for HTTP errors and include a safe recovery link.                                                                            | [Ruins notices](../../src/views/game/ruins.ejs) and [error page](../../src/views/error.ejs)                                                                                        |

## Interaction patterns

### Location pages and navigation

Nexaris is the directory for signed-in gameplay destinations. The main navigation outside an expedition shows The Quarters, Nexaris, Admin, and Log out. Inside The Ruins it shows The Ruins and Log out. Keep destination links on the directory and place gameplay actions on their location pages.

A typical location page uses a heading, an illustration and caption, brief setting text, and the location’s primary controls. A repeatable activity can prioritize the map, form, or result over the artwork. Keep the most likely next action near any status or recovery message.

The Driftwater places the location figure and description beside the fishing controls at widths of `44rem` and above. On narrower screens the controls and result come first, matching the reading order. A native meter pairs the available count and maximum with a visible reset time. The result panel sits below the action, uses a minimum height, and can grow with its content. Caught fish use the shared item icon styling at `5.5rem` with the result text beside the image. [Driftwater template](../../src/views/game/fishing.ejs) · [Driftwater styles](../../src/scss/pages/_driftwater.scss)

### Public homepage and authentication

The homepage pairs the world illustration and introduction with a form capped at `28rem`. Below `60rem`, the introduction comes first, followed by the form and artwork. Use ordinary links with `aria-current="page"` for the authentication choices. The URL selects the form, so registration can be linked directly and browser history can switch between views. [Homepage template](../../src/views/index.ejs) · [Homepage styles](../../src/scss/pages/_homepage.scss)

Use a labeled fieldset for illustrated radio choices. The portrait and visible label share a click target, and the radio indicator shows the selection alongside the gold border. Keep muted instructions next to the input and associate them and any field error with `aria-describedby`. Signup links from its error notice to the relevant input and restores the player name, email, and valid avatar selection. [Signup form](../../src/views/login/register.ejs)

### Character management

The Quarters uses a compact location figure alongside its introduction on wide screens. The character overview pairs a portrait, name, level, and class with grouped stat tiles. Put HP first, group gold and XP separately from combat stats, and place available attribute points by the allocation controls. The Quarters and The Ruins share a labeled HP meter with a red fill and a Critical label below 25%, alongside current and maximum HP. [The Quarters](../../src/views/game/index.ejs) · [Health meter](../../src/views/partials/health-meter.ejs)

Equipment shows supported slots with an item, its signed modifier, and a secondary outlined Unequip button, or a short empty-state message. Inventory groups each thumbnail, name, and description in the row header and summarizes numerical effects in a single column. Inventory and Emporium purchase filters use URL parameters and mark the current category with `aria-current`. The inventory and both Emporium tables share a responsive table partial with a row template for each context. At narrow widths, the inventory retains native table layout and scrolls inside its labeled wrapper when needed. [Quarters styles](../../src/scss/pages/_quarters.scss)

### Forms and results

- **Before submission.** Put the current balance, limits, and expected units beside the decision. The Emporium shows the purchase total in the purchase button and uses a labeled `output` for the manual sale total. Cart validation feedback uses a polite status region.
- **On submission.** The server validates eligibility, prices, and rewards. Browser validation and live calculation help the player make a choice.
- **After submission.** Show what changed. Training, fishing, Emporium, and Ruins actions redirect to a page after saving so a refresh does not submit the action again. Render outcome and reward text from the saved result.
- **Unavailable actions.** Give the reason and a way forward when one exists. At zero HP, Dominion and The Ruins link to revival at Sanctum. The Emporium directs players to unequip gear when the equipped copy is all they have available.
- **Empty states.** State what is absent in context, such as “You have no healing potions.” Give the next action when the player can take one.

### Ruins map

Group the map and Surroundings on the left at wide widths. Place the interior art and expedition resources beside them. At narrow widths place the HP meter before the map and the interior art after the Recall Beacon. Preserve the keyboard order at both widths. Keep the floor and coordinates above the map, and the legend and instructions below it.

Put discovery feedback and exit or stair actions in Surroundings. Mandatory encounters resolve on movement; place their victory report after the tile actions. Give unexplored squares a dark surface and explored or cleared squares a subtle blue tint without encoding enemy information. Keep HP, attribute allocation, potions in strength order, and Recall status easy to find. Use an outlined Recall action. The entrance illustration and action introduce the expedition. At zero HP, guide the player to Sanctum.

On completion, replace exploration with the expedition summary. Lead with a text-labeled outcome, emphasize gold and XP, then show grouped item figures, compact definition lists for exploration and resource statistics, and next actions. Outcome borders may use semantic color but the heading must carry the meaning. Keep the summary as a readable single-column report rather than a dashboard; its native progress element supplements the numeric explored-tile fraction.

See [The Ruins](../gameplay/ruins.md) for event visibility and [keyboard and reporting requirements](accessibility.md#maps-and-combat-reports) for accessible interaction.

## Accessibility

Use the [accessibility guide](accessibility.md) for semantics, focus, contrast, reflow, and verification requirements.

## Sass architecture and naming

`main.scss` loads base, layout, components, pages, and utilities in that order. All modules access shared tokens directly through `@use "../abstracts/vars"`. Base defines box sizing, focus, and typography. Layout owns the shell and shared activity grid. Components own reusable controls and their variants. Pages own location-specific composition and sizing. Utilities apply small, explicit treatments such as `.text-muted` and `.visually-hidden`.

Use descriptive kebab-case for new classes, `__element` for a named component part, and `--modifier` for a variant. Keep established names when they remain clear. Use page prefixes such as `.quarters-` for local composition. Prefer native states such as `:disabled`, `:checked`, `[open]`, and `[aria-current="page"]`. Use a stable ID or data attribute for behavior, such as `data-ruins-map`, and keep styling independent of accessible names. Group declarations by layout, dimensions, spacing, typography, appearance, and interaction when that order preserves the cascade.

### Shared variants

- Apply `.button--secondary` for an outlined action, `.button--link` for a form action shown as a link, and `.button--full` for a full-width action. Use `.form-group` for ordinary label and field spacing and `.form-note` for nearby instructions or validation.
- Use `.link-nav` with its site, auth, or filter modifier. Selection remains tied to the current URL with `aria-current="page"`.
- Pass an ID, visible label, value, and maximum to the resource meter partial. Optional arguments cover critical fill, value units, associated instructions, and custom visible or accessible value text for states that a numeric fraction cannot explain. The HP partial supplies the existing critical threshold. The meter uses one CSS custom property to change the fill in both native browser treatments. [Resource meter](../../src/views/partials/resource-meter.ejs)
- Use the location figure’s banner, flush, and compact options for wide artwork, parent-owned spacing, and the compact introduction. Item icons support compact and featured variants. Use `.equipment-slot` to group an equipment heading, item, modifier, and action or empty state.
- Use `.text-error` for validation and errors and `.text-muted` for secondary guidance. Keep result and availability text close to the relevant controls. Use the battle partials for reports and their actor and critical-hit treatments.

## Implementation and handoff

1. Identify the nearest existing page or component pattern and adapt it. Reuse the nearest component and token first. Add a variant for a recurring difference with the same semantic structure. Keep one-off geometry local and explain it if its purpose is unclear.
2. Extract an EJS partial when the same logical component occurs in multiple views and has a clear input contract.
3. Keep local composition in the page module. Check heading order, existing type and spacing roles, color meaning, keyboard focus, disabled and empty states, and narrow reflow before adding CSS.
4. Review the rendered screen at narrow and wide widths. Follow the [contributor workflow](../development/workflow.md#validate-and-build) for validation and generated assets.
5. Update this reference when shared tokens or component conventions change. Use the roadmap for proposed gameplay and [The Ruins](../gameplay/ruins.md) for expedition rules.

The [Sass entry point](../../src/scss/main.scss) imports the style modules. The [shared EJS layout](../../src/views/layouts/main.ejs) provides the page shell, and [EJS partials](../../src/views/partials/) provide the reusable markup.
