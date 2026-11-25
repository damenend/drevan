# Contributor workflow

Run commands from the repository root with the pinned Node version. [Package scripts](../../package.json) and repository configuration define the current tooling.

## Write and review changes

- Follow existing route, service, and view patterns. Use strict TypeScript and keep game state and report data typed. The [TypeScript configuration](../../tsconfig.json) uses NodeNext semantics.
- Use [Node's test runner](../../tests/) and strict assertions for tests in `tests/*.test.ts`. Use controlled rolls in combat tests. Prefer coverage that exercises the feature's normal entry point. `tsconfig.test.json` checks test types separately.
- Use TSDoc for functions whose contracts need explanation. Describe rules, prerequisites, side effects, and return values when they help callers. Add `@param` or `@returns` where the purpose is unclear. A short comment is enough for a simple route label.
- Use two-space indentation for EJS. The workspace recommends EJS Beautify. Prettier excludes EJS, generated CSS, migration metadata, and the lockfile.

## Validate and build

| Command                         | What it does                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `yarn format`                   | Formats supported repository files. Review the diff for unrelated edits.                                                        |
| `yarn check`                    | Runs formatting checks, Oxlint, TypeScript checks, and tests.                                                                   |
| `yarn test` / `yarn test:watch` | Runs tests once or reruns them as files change.                                                                                 |
| `yarn test:a11y`                | Runs separate Chromium and axe checks for UI changes. Follow the [browser setup and manual checks](../design/accessibility.md). |
| `yarn sass:build`               | Rebuilds tracked CSS and its source map. Include both when changing Sass.                                                       |
| `yarn build`                    | Compiles TypeScript to `dist/` and rebuilds Sass.                                                                               |
| `yarn start`                    | Runs `dist/app.js` after a build. Keep `src/views/` and `public/` available.                                                    |

## Git hooks and commits

Run `yarn hooks:install` once per clone. The installer preserves existing hook configurations. Vault Radar runs the executable [pre-commit hook](../../.husky/pre-commit) directly. For another hook setup, configure it to invoke that hook or run `yarn check` before committing. The hook checks staged whitespace and runs the check suite. Leave secret scanning enabled.

Use short Conventional Commit subjects such as `feat: apply equipped item stat modifiers`. Add a body when it explains why behavior changed or what someone needs to do after pulling.

## Update Node or dependencies

- `yarn node:update` installs the latest Node LTS through nvm and updates `.nvmrc`. Run `nvm use` in your shell afterward and follow [Corepack setup](getting-started.md#run-drevan-locally) if needed.
- `yarn deps:update` updates direct dependencies and dev dependencies to the registry's latest releases and installs them. `yarn deps:refresh` also reinstalls from a clean `node_modules/` directory and runs `yarn check`.
- Review manifest and lockfile changes before committing. Latest releases can include breaking upgrades. If checks fail, inspect the manifest diff and use a command such as `yarn up 'package-name@^2.4.0'` to restore a known range, then recheck.
- `yarn clean` deletes and reinstalls `node_modules/`. If Yarn cannot find the dependency state file, run `yarn install` directly.

## Maintain documentation

Use the [ownership map](../README.md#information-ownership) when gameplay, architecture, or contributor workflows change. Keep one descriptive H1, sentence-case headings, relative repository links, and language identifiers on code fences. Introduce procedures with prerequisites and put irreversible consequences before the command. Keep historical measurements tied to their tested revision or fixtures.

Run `yarn docs:audit` for an on-demand Codex review of staged, unstaged, and relevant unignored new files. It uses the project-local CLI and its [audit prompt](../../scripts/docs-audit.txt). Authenticate with `yarn codex login` if needed. Review all resulting edits with `git status --short` and `git diff`, including any newly created documents. The audit leaves staging and committing to the contributor. `yarn docs:agents` is a compatibility alias.
