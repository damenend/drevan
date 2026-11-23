import { createTrainingDummy, simulateBattle } from "../src/services/battle";
import { seededRandom } from "./seeded-random";

const sessions = 1000;
const fightLimit = 30;
const thresholds = [60, 150, 270];
const matchups = [
  { level: 1, equipped: false },
  { level: 2, equipped: false },
  { level: 3, equipped: false },
  { level: 4, equipped: false },
  { level: 4, equipped: true },
];

console.log(
  "xp_rule,dummy_level,equipped,sessions,character_level,reached,mean_fights_on_reach,stopped_for_healing",
);

for (const xpRule of ["flat", "scaled"]) {
  for (const { level, equipped } of matchups) {
    const dummy = createTrainingDummy(level);
    const player = {
      name: "Starter",
      hp: 25,
      strength: equipped ? 6 : 5,
      speed: 5,
      defense: equipped ? 3 : 0,
    };
    const xpPerWin = xpRule === "flat" ? 30 : 10 * level;
    const checkpoints = thresholds.map((xp) => ({ xp, reached: 0, fights: 0 }));
    let stoppedForHealing = 0;

    for (let seed = 1; seed <= sessions; seed++) {
      const random = seededRandom(seed);
      let gold = 100;
      let xp = 0;
      let next = 0;

      for (let fight = 1; fight <= fightLimit; fight++) {
        const result = simulateBattle(player, dummy, level * 10, { random });
        if (result.enemyHp === 0) xp += xpPerWin;
        while (next < checkpoints.length && xp >= checkpoints[next].xp) {
          checkpoints[next].reached++;
          checkpoints[next].fights += fight;
          next++;
        }
        if (next === checkpoints.length) break;

        // Sanctum restores the missing HP for one gold per point.
        gold += result.goldEarned - (player.hp - result.playerHp);
        if (gold < 0) {
          stoppedForHealing++;
          break;
        }
      }
    }

    for (const [index, { reached, fights }] of checkpoints.entries()) {
      console.log(
        [
          xpRule,
          level,
          equipped,
          sessions,
          index + 2,
          reached,
          reached ? (fights / reached).toFixed(2) : "",
          stoppedForHealing,
        ].join(","),
      );
    }
  }
}
