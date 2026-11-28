# Drevan documentation

Use this index to find the guide that owns the information you need. The [project README](../README.md) introduces the game. [Repository instructions](../AGENTS.md) govern coding-agent work.

## Develop Drevan

- [Run Drevan locally](development/getting-started.md) for installation, setup, and a first account.
- [Application architecture](development/architecture.md) to find where requests, game rules, rendering, and tests live.
- [Contributor workflow](development/workflow.md) for coding, formatting, validation, hooks, dependency updates, and documentation maintenance.
- [Database development](development/database.md) for migrations, catalog changes, inspection, and recovery.
- [Deploy Drevan to DigitalOcean](development/deployment.md) for a first private alpha deployment, manual updates, automation, and recovery.

## Work on the game

- [Gameplay rules](gameplay/README.md) routes character, combat, economy, and activity changes to the relevant reference.
- [Design system](design/design-system.md) defines visual intent and reusable interface patterns.
- [Accessibility guide](design/accessibility.md) covers requirements, browser checks, and manual verification.
- [Lore](world/lore.md) records fictional canon and intentional mysteries.
- [Writing guide](world/writing-guide.md) covers narrative and functional copy. [Terminology](world/terminology.md) records approved names, capitalization, and gameplay vocabulary.

## Plan and verify

- [Gameplay philosophy](planning/gameplay-philosophy.md) defines the durable vision, design principles, and progression pillars.
- [Gameplay roadmap](planning/roadmap.md) owns priorities, milestone status, and dependencies.
- [Open design questions](planning/open-questions.md) records unresolved choices and provisional ideas.
- [Gameplay playtesting](planning/playtesting.md) explains how to run comparable simulations and full sessions.
- [Launch architecture](planning/launch-architecture.md) owns alpha access, service and data design, and the future public configuration.
- [Accessibility audit, November 24, 2026](audits/2026-11-24-accessibility.md) records the audited revisions, findings, and verification limits.
- [Balance playtest results](audits/balance-playtests.md) preserves previous measurements and their test conditions.

## Information ownership

[Package scripts](../package.json) and tool configuration define commands. The [schema](../src/db/schema.ts) and [migrations](../drizzle/) define storage. Source and tests show what the game implements. Gameplay references record implemented behavior and established rules. Sass defines implemented tokens and styles. The design and accessibility guides define interface expectations. Lore owns canon and terminology owns naming. The gameplay philosophy owns durable design direction; roadmap entries own commitments and status. Open questions and audits record design candidates and evidence, respectively.

When these sources disagree, inspect the implementing code, tests, and documented intent. Record the discrepancy and identify the decision needed before changing an approved requirement.
