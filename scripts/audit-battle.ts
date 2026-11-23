import {
  createTrainingDummy,
  simulateBattle,
  type Combatant,
} from "../src/services/battle";
import { seededRandom } from "./seeded-random";

const starter = {
  name: "starter",
  hp: 25,
  attackPower: 5,
  speed: 5,
  defense: 0,
};
// Each mixed build spends four hypothetical points. One point buys +3 HP
// or +1 to another stat, except in the explicit +2 Defense trial.
const mixedBuilds: Combatant[] = [
  { name: "mixed-defense", hp: 28, attackPower: 6, speed: 6, defense: 1 },
  {
    name: "mixed-double-defense",
    hp: 28,
    attackPower: 6,
    speed: 6,
    defense: 2,
  },
  { name: "mixed-strength", hp: 28, attackPower: 7, speed: 6, defense: 0 },
  { name: "mixed-speed", hp: 28, attackPower: 6, speed: 7, defense: 0 },
  { name: "mixed-hp", hp: 31, attackPower: 6, speed: 6, defense: 0 },
];

const builds: Combatant[] = [
  starter,
  { ...starter, name: "strength-1", attackPower: 6 },
  { ...starter, name: "speed-1", speed: 6 },
  { ...starter, name: "defense-1", defense: 1 },
  { ...starter, name: "defense-2", defense: 2 },
  { ...starter, name: "defense-3", defense: 3 },
  { ...starter, name: "hp-1", hp: 26 },
  { ...starter, name: "hp-2", hp: 27 },
  { ...starter, name: "hp-3", hp: 28 },
  { ...starter, name: "strength-4", attackPower: 9 },
  { ...starter, name: "speed-4", speed: 9 },
  { ...starter, name: "defense-4", defense: 4 },
  { ...starter, name: "hp-4", hp: 29 },
  { ...starter, name: "hp-8", hp: 33 },
  { ...starter, name: "hp-12", hp: 37 },
  { name: "balanced-4", hp: 26, attackPower: 6, speed: 6, defense: 1 },
  ...mixedBuilds,
  ...mixedBuilds.map((build) => ({
    ...build,
    name: `armored-${build.name}`,
    defense: build.defense + 3,
  })),
  ...mixedBuilds.map((build) => ({
    ...build,
    name: `equipped-${build.name}`,
    attackPower: build.attackPower + 1,
    defense: build.defense + 3,
  })),
  { ...starter, name: "equipped", attackPower: 6, defense: 3 },
];

const opponents: (Combatant & { trainingLevel?: number })[] = [
  ...[1, 2, 3, 4, 5, 6].map((level) => ({
    ...createTrainingDummy(level),
    name: `dummy-${level}`,
    trainingLevel: level,
  })),
  { ...starter, name: "mirror" },
  { name: "heavy", hp: 30, attackPower: 8, speed: 3, defense: 3 },
  { name: "quick", hp: 20, attackPower: 4, speed: 9, defense: 0 },
];

const fights = 5000;
const rules = [
  { name: "player-first" },
  { name: "no-crits", criticalChance: 0 },
  { name: "speed-curve", speedCurve: true },
  { name: "random-ties", randomTies: true },
  { name: "random-ties-speed-curve", randomTies: true, speedCurve: true },
];

/** Applies the roadmap's candidate Speed curve to initiative and attack intervals. */
function withSpeedCurve(fighter: Combatant): Combatant {
  return {
    ...fighter,
    speed: fighter.speed > 5 ? 5 * Math.sqrt(fighter.speed / 5) : fighter.speed,
  };
}

console.log(
  "rule,build,opponent,build_slot,fights,wins,losses,draws,mean_hp_on_wins,mean_attacks,mean_elapsed_time,mean_build_attacks,mean_opponent_attacks,mean_build_damage,mean_opponent_damage,mean_build_crits,mean_opponent_crits,mean_training_reward,mean_sanctum_cost,mean_gold_after_healing",
);

for (const rule of rules) {
  for (const build of builds) {
    for (const opponent of opponents) {
      for (const slot of ["player", "enemy"] as const) {
        const [player, enemy] =
          slot === "player" ? [build, opponent] : [opponent, build];
        const fighters = rule.speedCurve
          ? ([withSpeedCurve(player), withSpeedCurve(enemy)] as const)
          : ([player, enemy] as const);
        // Model the training route only when the tested build is the player.
        const trainingLevel =
          slot === "player" ? opponent.trainingLevel : undefined;
        const goldReward = (trainingLevel ?? 0) * 10;
        let trainingRewards = 0;
        let healingCosts = 0;
        let wins = 0;
        let losses = 0;
        let hpOnWins = 0;
        let elapsedTime = 0;
        const buildTotals = { attacks: 0, damage: 0, crits: 0 };
        const opponentTotals = { attacks: 0, damage: 0, crits: 0 };

        for (let seed = 1; seed <= fights; seed++) {
          const result = simulateBattle(...fighters, goldReward, {
            random: seededRandom(seed),
            criticalChance: rule.criticalChance,
            rollTimingTie: rule.randomTies ? seededRandom(seed + fights) : null,
          });
          const [buildHp, opponentHp] =
            slot === "player"
              ? [result.playerHp, result.enemyHp]
              : [result.enemyHp, result.playerHp];
          if (trainingLevel !== undefined) {
            trainingRewards += result.goldEarned;
            healingCosts += build.hp - buildHp;
          }
          if (opponentHp === 0) {
            wins++;
            hpOnWins += buildHp;
          } else if (buildHp === 0) {
            losses++;
          }

          elapsedTime += result.elapsedTime;
          for (const entry of result.battleLog) {
            if (entry.type !== "attack") continue;
            const totals = entry.actor === slot ? buildTotals : opponentTotals;
            totals.attacks++;
            totals.damage += entry.damage;
            totals.crits += Number(entry.critical);
          }
        }

        const draws = fights - wins - losses;
        const mean = (total: number) => (total / fights).toFixed(2);
        console.log(
          [
            rule.name,
            build.name,
            opponent.name,
            slot,
            fights,
            wins,
            losses,
            draws,
            wins ? (hpOnWins / wins).toFixed(2) : "",
            mean(buildTotals.attacks + opponentTotals.attacks),
            mean(elapsedTime),
            mean(buildTotals.attacks),
            mean(opponentTotals.attacks),
            mean(buildTotals.damage),
            mean(opponentTotals.damage),
            mean(buildTotals.crits),
            mean(opponentTotals.crits),
            trainingLevel === undefined ? "" : mean(trainingRewards),
            trainingLevel === undefined ? "" : mean(healingCosts),
            trainingLevel === undefined
              ? ""
              : mean(trainingRewards - healingCosts),
          ].join(","),
        );
      }
    }
  }
}
