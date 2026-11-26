# Drevan accessibility guide

Build and evaluate player-facing flows against WCAG 2.2 Level AA. Use the [design system](design-system.md) for visual and component patterns. The [November 24 audit](../audits/2026-11-24-accessibility.md) records earlier findings, remediation, and evidence gaps. Automated checks cover part of the target. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Structure, names, and focus

- Use one descriptive page `h1`, a descriptive document title, a main landmark, and the shared skip link to focus main. Name navigation landmarks by purpose when a page has more than one.
- Start with native links, buttons, fields, tables, headings, and disclosures. Use ARIA for missing context and preserve visible action words in accessible names. Label fields and group related choices with a fieldset and legend. Connect instructions and errors using `aria-describedby`.
- Keep DOM order aligned with reading and keyboard order. Check Tab, Shift+Tab, Enter, and Space. Provide visible focus that stays in view. Distinguish states with text, symbols, underlines, or native indicators alongside color.
- Provide meaningful text alternatives for informative images and empty alt text for decorative images or when adjacent text provides the equivalent. Use captions for added context.

## Forms, feedback, tables, and meters

Explain errors in words near the affected control and preserve safe input where the existing flow supports it. Give a recovery action when one exists. Mark a concise server-rendered result with `tabindex="-1"` and `data-result-focus`. The [shared page script](../../public/js/page-accessibility.js) focuses that result. Use a polite status region for relevant in-page updates, such as live cart validation. Verify repeated updates with a screen reader.

Keep native table layout and scoped row and column headers at all widths. Put wide tables in a local scroll wrapper with `data-scroll-label`. The shared script gives only overflowing wrappers a named region and a keyboard stop.

Use the [native resource meter](../../src/views/partials/resource-meter.ejs) for bounded values. Supply a visible label and exact count, and use native value and maximum attributes. Show low HP with a Critical label alongside the changed fill.

## Maps and combat reports

In The Ruins, focus the player square on entry and after successful movement. It describes the current tile and feedback. Arrow keys focus destinations relative to that square. Enter or Space submits the focused move. All legal moves stay in the native Tab order, and without JavaScript the adjacent buttons remain usable directly. The Map markers disclosure exposes only explored landmarks and coordinates. Cache and enemy data stay out of unexplored tile markup and accessible names. Arriving at a cache adds its result to the focused tile's feedback; arriving at an enemy resolves combat and focuses the existing battle summary. [Ruins view](../../src/views/game/ruins.ejs) · [Map script](../../public/js/ruins-map.js)

Show outcome, current HP, and earned rewards before the expandable battle log. Identify actors and critical hits in text. Keep the full attack sequence available in order. [Battle log](../../src/views/partials/battle-log.ejs)

## Contrast, reflow, and user preferences

- Check 4.5:1 contrast for normal text, 3:1 for large text, and 3:1 for required control and state indicators, subject to the WCAG exceptions. Test actual color pairs in each relevant state. [Text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) · [Non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html)
- Check 24 × 24 CSS pixel target size or the applicable spacing and other exceptions. Keep page content usable at 320 CSS pixels, 200% text size, and 400% browser zoom. Wide tables can scroll locally. [Target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- Check custom text spacing, forced colors, reduced motion, and touch in both orientations. Keep boundaries, focus, and selected states visible when user preferences override the palette.

## Regression procedure

1. From the repository root, select the pinned Node with `nvm use`, install dependencies, and run `yarn build` and `yarn check`.
2. Run `yarn playwright-core install chromium` once, then `yarn test:a11y`. To use an installed Chromium-based browser, set `DREVAN_CHROMIUM` to its executable. The tests open a loopback server and use a temporary database. The suite fails for detected axe violations, document overflow, or a failed interaction assertion.
3. To validate raw server HTML, set `DREVAN_A11Y_HTML_DIR` to an empty output directory when running the suite. Pass the captured files to a local Nu installation.

   ```sh
   DREVAN_A11Y_HTML_DIR=/tmp/drevan-html yarn test:a11y
   java -jar /path/to/vnu.jar --errors-only /tmp/drevan-html/*.html
   ```

4. Verify complete flows on a disposable local game. With keyboard alone, register, log in, correct an error, allocate a point, equip and consume items, buy and sell, heal, train, fish through the daily limit, and explore through a discovery, fight, and recall or exit. Check both focus direction and whether each result explains the next step.
5. Repeat with NVDA/Firefox on Windows and VoiceOver/Safari on macOS. Use heading, landmark, forms, and table navigation. In The Ruins, start in reading mode, find current position and its tile feedback, open Map markers, Tab to a direction, and move. Compare discoveries, available moves, hidden-enemy behavior, and battle feedback with the rendered map. Check status announcements for repeated casts, cart validation, battle rewards, and error focus.
6. At 200% text sizing and 400% browser zoom, check that ordinary content fits the viewport. Verify local table scrolling and focus indicators. Apply line height 1.5, paragraph spacing 2em, letter spacing 0.12em, and word spacing 0.16em. Repeat with Windows High Contrast, reduced motion, and a touch device in both orientations. Confirm selected states, move boundaries, target spacing, and meter values remain distinguishable. Add VoiceOver/iOS or TalkBack/Chrome for touch screen reader coverage.

Record any untested platforms or flows. The November 24 audit left native screen reader output (including map feedback and meter values), Windows High Contrast, real browser zoom, touch, and cross-browser checks open. Include these when checking the affected flow.
