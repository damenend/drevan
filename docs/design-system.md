# Drevan design system

Drevan is a text-driven browser RPG with an early-2000s web aesthetic and a high-fantasy science-fiction setting. Its interface uses compact typography, dark surfaces, gold actions, and illustrated locations. Players should be able to read the game state and take the next action quickly, whether they are comparing prices or deciding to retreat from The Ruins.

Use this reference when designing a new screen, extending a component, or briefing an agent. The Sass and EJS files define the shipped implementation. The [writing guide](writing-guide.md) governs player-facing copy, the [lore reference](lore.md) governs setting details, and the [roadmap](roadmap.md) governs planned gameplay.

## Design principles

- **Put the decision first.** Show the relevant state, cost, and consequence close to the action. A player deciding whether to fight needs current HP and encounter context within easy reach.
- **Use a clear hierarchy.** Let headings, spacing, and plain labels organize the screen. Reserve strong accents for actions, active states, and meaningful feedback.
- **Keep the world visible.** Use location art, item icons, and short observations to express the setting. Use concise language for rules, rewards, and recovery steps.
- **Build on native controls.** Use semantic links, buttons, forms, tables, and headings. Add JavaScript for behavior such as live totals and directional map focus while preserving the underlying forms.

## Foundations

### Color tokens

Shared design tokens are Sass variables in [`src/scss/_vars.scss`](../src/scss/_vars.scss). Use the role of the token to choose it.

| Token                   | Value                                | Role and current use                                               |
| ----------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| `$color-background`     | `#171717`                            | Page canvas and dark text on gold buttons and the player tile.     |
| `$color-surface`        | `#242424`                            | Header, footer, inputs, table headers, and game panels.            |
| `$color-primary`        | `#b58b4c`                            | Links, primary actions, current navigation, and discovery accents. |
| `$color-text`           | `#e5e5e5`                            | Primary text and standard button focus outline.                    |
| `$color-muted`          | `#999999`                            | Secondary text, captions, placeholders, and input borders.         |
| `$color-red`            | `#ff5454`                            | Errors, enemies, and stat penalties.                               |
| `$color-blue`           | `#54bdff`                            | Player combat cues, stat bonuses, and the Ruins stairs marker.     |
| `$color-surface-border` | Surface lightness increased by `12%` | Dividers and panel or tile boundaries.                             |
| `$color-row-stripe`     | White at `2.5%` opacity              | Alternating table rows.                                            |

Component-specific colors include the Ruins exit border (`#719270`), a gold tint on available move tiles, and a white overlay at 5% opacity for hovered table rows. Gold has several roles. The label, placement, and element type tell the player whether they are looking at an action, a discovery, or the current page.

### Typography

Roboto is the body face. Rajdhani is the display face for headings and standard buttons. Both use a sans-serif fallback. Use semantic heading levels to express the page outline. [Typography styles](../src/scss/_typography.scss) · [Form styles](../src/scss/_forms.scss)

| Role                     | Typeface | Size       | Weight   | Line height |
| ------------------------ | -------- | ---------- | -------- | ----------- |
| Site title, `h1`         | Rajdhani | `2.75rem`  | 700      | 1.2         |
| Page heading, `h2`       | Rajdhani | `2.125rem` | 600      | 1.2         |
| Section heading, `h3`    | Rajdhani | `1.625rem` | 600      | 1.2         |
| Subsection heading, `h4` | Rajdhani | `1.25rem`  | 700      | 1.2         |
| Body                     | Roboto   | `1rem`     | 400      | 1.5         |
| Standard button          | Rajdhani | `1.125rem` | 600      | 1.2         |
| Supporting text          | Roboto   | `0.875rem` | Inherits | Contextual  |
| Character stat value     | Roboto   | `1.5rem`   | 500      | 1.2         |

Headings use `0.01em` letter spacing and `0.75rem` bottom margin by default. The site title is gold and subsection headings have a gold leading rule. Captions are muted and italic. Use the shared number formatter for displayed gameplay values and keep submitted quantities or calculation data ungrouped.

### Spacing, layout, and shape

Spacing is defined in component styles. These recurring values describe the current rhythm.

| Value     | Common application                                                                       |
| --------- | ---------------------------------------------------------------------------------------- |
| `0.25rem` | Ruins map tile gap and stat breakdown offset.                                            |
| `0.5rem`  | Vertical control padding and small text or label separation.                             |
| `0.75rem` | Heading margin, horizontal input padding, and item icon gap.                             |
| `1rem`    | Container gutters, paragraph and form-group spacing, panel padding, and navigation gaps. |
| `2rem`    | Horizontal gap between the Ruins map and controls on wide screens.                       |

The page shell has a header, main landmark, and footer. The shared container is centered with a `1320px` maximum width and `1rem` inline padding. Most gameplay pages follow the document flow. The character stat grid fits as many columns as it can at a `140px` minimum. The Ruins stacks its expedition content below `44rem`. At wider widths the exploration and resources sit side by side, with a map column up to `28rem`. Wide tables scroll within their own wrapper. These are component-specific breakpoints and dimensions. [Page shell](../src/scss/main.scss) · [Character stats](../src/scss/_home.scss) · [Ruins layout](../src/scss/_ruins.scss)

Use `$radius-small` (`3px`) for controls, portraits, battle summaries, and map tiles. Use `$radius-panel` (`4px`) for location images and the character stat group. Thin borders and changes in surface color give the interface its flat, compact appearance.

### Imagery

Location images are generally WebP, displayed in a figure with a caption. The standard illustration is capped at `480px` and a banner can span its container. Location artwork normally follows the page heading. Inside The Ruins, the interior art follows the gameplay controls and report. Item icons are `48 × 48px` and sit beside the item name. Player portraits display at `10rem` wide with a `2:3` crop. Provide meaningful alt text when the image conveys information. Use empty alt text when the image is decorative or the adjacent text supplies its identity. [Image styles](../src/scss/_images.scss)

## Components

| Component                       | Structure and states                                                                                                                                                                                                                                                | Implementation                                                                                                                                            |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site navigation                 | A wrapping row of links with current-page, hover, and keyboard-focus states. The current page uses gold, heavier type, and `aria-current="page"`. Log out is a form button styled as a link.                                                                        | [Navigation partial](../src/views/partials/navigation.ejs) and [navigation styles](../src/scss/_nav.scss)                                                 |
| Link                            | Navigates to a location or next step. Inline links are underlined. Use the location name in directories and an action plus destination when guiding recovery, such as **Heal at Sanctum**.                                                                          | [Typography styles](../src/scss/_typography.scss)                                                                                                         |
| Button                          | Submits a form or performs an action. Default treatment is gold with dark text. Hover lightens the background, keyboard focus adds an outline, and disabled controls use reduced opacity. Name the action in sentence case.                                         | [Form styles](../src/scss/_forms.scss)                                                                                                                    |
| Form field                      | Use a visible label where practical and an accessible label for compact contexts such as a quantity cell. Inputs are full width by default. Quantity controls use `.item-quantity` with a `5rem` maximum. Keep instructions and validation feedback near the field. | [Signup example](../src/views/login/index.ejs) and [Emporium example](../src/views/game/store.ejs)                                                        |
| Data table                      | Put `.table` inside `.table-responsive`. Use column headers with `scope="col"` and row headers with `scope="row"` when a cell names the row. The table uses gold headers, striped rows, and a hover treatment.                                                      | [Table styles](../src/scss/_table.scss)                                                                                                                   |
| Location figure                 | Renders an image and caption, with a banner variant for wide location artwork.                                                                                                                                                                                      | [Location image partial](../src/views/partials/location-image.ejs)                                                                                        |
| Item figure and player portrait | Item figures keep the item name visible even when an image is absent. Player portraits use the selected avatar model and an accessible description.                                                                                                                 | [Item figure](../src/views/partials/item-figure.ejs) and [player avatar](../src/views/partials/player-avatar.ejs)                                         |
| Character stats and gold        | Use a description list for label and value pairs. Show the effective stat first and add the base value and signed modifier when it differs. Reuse the shared gold display.                                                                                          | [The Quarters](../src/views/game/index.ejs), [stat total](../src/views/partials/stat-total.ejs), and [player gold](../src/views/partials/player-gold.ejs) |
| Battle report                   | Shows an encounter, attack log, and summary. Blue and red identify actors alongside their names. Critical hits have an explicit label. The summary shows the outcome, HP change, and any awarded gold, XP, or loot.                                                 | [Battle log partial](../src/views/partials/battle-log.ejs) and [battle styles](../src/scss/_battle.scss)                                                  |
| Status message and error page   | Place contextual feedback near the action or at the top of the relevant view. Use `role="status"` for nonurgent updates where appropriate. Use the shared error page for HTTP errors and include a safe recovery link.                                              | [Ruins notices](../src/views/game/ruins.ejs) and [error page](../src/views/error.ejs)                                                                     |

## Interaction patterns

### Location pages and navigation

Nexaris is the directory for signed-in gameplay destinations. The main navigation outside an expedition shows The Quarters, Nexaris, Admin, and Log out. Inside The Ruins it shows The Ruins and Log out. Keep destination links on the directory and place gameplay actions on their location pages.

A typical location page uses a heading, an illustration and caption, brief setting text, and the location’s primary controls. A repeatable activity can prioritize the map, form, or result over the artwork. Keep the most likely next action near any status or recovery message.

The Driftwater places the location figure and description beside the fishing controls at widths of `44rem` and above. On narrower screens the controls and result come first, matching the reading order. A native meter pairs the available count and maximum with a visible reset time. The result panel sits below the action, uses a minimum height, and can grow with its content. Caught fish use the shared item icon styling at `5.5rem` with the result text beside the image. [Driftwater template](../src/views/game/fishing.ejs) · [Driftwater styles](../src/scss/_driftwater.scss)

### Forms and results

- **Before submission.** Put the current balance, limits, and expected units beside the decision. The Emporium uses an `output` element for live gold totals and a polite live region for feedback.
- **On submission.** The server validates eligibility, prices, and rewards. Browser validation and live calculation help the player make a choice.
- **After submission.** Show what changed. Training, fishing, and Ruins actions redirect to a page after saving so a refresh does not submit the action again. Render outcome and reward text from the saved result.
- **Unavailable actions.** Give the reason and a way forward when one exists. At zero HP, Dominion and The Ruins link to Sanctum. The Emporium directs players to unequip gear when the equipped copy is all they have available.
- **Empty states.** State what is absent in context, such as “You have no healing potions.” Give the next action when the player can take one.

### Ruins map

The map is a 7×7 grid. Only adjacent destinations are buttons, and arrows change focus relative to the player’s square. Enter or Space activates the focused destination. Tab initially enters on the player square, and focus returns to the player’s new position after a move. Without JavaScript, Tab can reach the adjacent move buttons directly. Markers use text and a legend as well as color. Event and stair visibility rules, encounter states, and expedition UX questions are documented in the [Ruins design brief](ruins-design-brief.md).

## Accessibility and review

Use these checks when reviewing a new screen or an altered component.

- **Structure and names.** Verify landmark and heading order, the skip link, form labels, scoped table headers, and purposeful image alternatives.
- **Keyboard and focus.** Complete the flow with Tab, Shift+Tab, Enter, and Space. Check both focus visibility and where focus goes after navigation. In The Ruins, verify arrow direction, edge behavior, and focus restoration.
- **Color and contrast.** Pair color cues with text, symbols, or a state indicator. Use WCAG 2.2 AA as a review target. Check at least 4.5:1 for normal text, 3:1 for large text, and 3:1 for required control and state indicators against adjacent colors, subject to the criteria’s exceptions. Check each actual foreground and background pair, including focus treatments. [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- **Reflow and targets.** Check a narrow viewport and zoomed layout. Ensure tables scroll locally, labels remain readable, and tightly spaced controls can be selected reliably. Check WCAG’s 24 × 24 CSS pixel minimum target size or applicable spacing and other exceptions. [Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- **Feedback.** Check the default, empty, disabled, error, and success states relevant to the flow. Confirm that status text conveys the outcome without relying on color and that recovery links name their destination.

## Implementation and handoff

1. Identify the nearest existing page or component pattern and adapt it. Use Sass tokens through `@use "vars"` and the `vars.` namespace.
2. Use EJS partials for repeated markup. Escape dynamic text with `<%=` and use `<%-` for trusted rendered partials or the layout body. Keep gameplay rules and state changes on the server.
3. Describe any design proposal in terms of the affected screen, component, state, responsive behavior, and keyboard interaction. Identify rule changes explicitly so they can be reviewed alongside the UI.
4. Verify behavior with `yarn check` and rebuild the tracked stylesheet with `yarn sass:build` when Sass changes. Review the rendered screen at narrow and wide widths.
5. Update this reference when shared tokens or component conventions change. Use the roadmap for proposed gameplay and the Ruins brief for expedition-specific behavior.

The [Sass entry point](../src/scss/main.scss) imports the style modules. The [shared EJS layout](../src/views/layouts/main.ejs) provides the page shell, and [EJS partials](../src/views/partials/) provide the reusable markup.
