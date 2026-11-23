import { createTrainingDummy, simulateBattle } from "../src/services/battle";
import { getProgression, statAllocations } from "../src/services/progression";
import { seededRandom } from "./seeded-random";

const sessions = 1000;
const boutLimit = 250;
const checkpointLevels = [2, 4, 6, 8, 10];
const plans = [
  { name: "dummy-4-save", spendOnStrength: false, raiseDifficulty: false },
  { name: "dummy-4-strength", spendOnStrength: true, raiseDifficulty: false },
  {
    name: "rising-dummy-strength",
    spendOnStrength: true,
    raiseDifficulty: true,
  },
];

console.log(
  "plan,character_level,reached,mean_bouts,mean_defeats,mean_gold_after_healing,stopped_for_healing",
);

// Hold gear and recovery constant so the plans compare allocation and difficulty.
for (const plan of plans) {
  const totals = checkpointLevels.map((level) => ({
    level,
    reached: 0,
    bouts: 0,
    defeats: 0,
    gold: 0,
  }));
  let stoppedForHealing = 0;

  for (let seed = 1; seed <= sessions; seed++) {
    const random = seededRandom(seed);
    let xp = 0;
    let level = 1;
    let gold = 100;
    let defeats = 0;
    let nextCheckpoint = 0;

    for (let bout = 1; bout <= boutLimit; bout++) {
      const dummyLevel = plan.raiseDifficulty
        ? 4 + Math.floor((level - 1) / 2)
        : 4;
      const reward = dummyLevel * 10;
      const strengthPoints = plan.spendOnStrength ? level - 1 : 0;
      const player = {
        name: "Starter",
        hp: 25,
        strength: 6 + strengthPoints * statAllocations.strength.amount,
        speed: 5,
        defense: 3,
      };
      const result = simulateBattle(
        player,
        createTrainingDummy(dummyLevel),
        reward,
        { random },
      );
      if (result.enemyHp === 0) xp += reward;
      if (result.playerHp === 0) defeats++;
      level = getProgression(xp).level;

      gold += result.goldEarned;
      const healingCost = player.hp - result.playerHp;
      if (gold < healingCost) {
        stoppedForHealing++;
        break;
      }
      gold -= healingCost;

      while (
        nextCheckpoint < totals.length &&
        level >= totals[nextCheckpoint].level
      ) {
        const checkpoint = totals[nextCheckpoint++];
        checkpoint.reached++;
        checkpoint.bouts += bout;
        checkpoint.defeats += defeats;
        checkpoint.gold += gold;
      }
      if (nextCheckpoint === totals.length) break;
    }
  }

  for (const { level, reached, bouts, defeats, gold } of totals) {
    console.log(
      [
        plan.name,
        level,
        reached,
        ...[bouts, defeats, gold].map((total) =>
          reached ? (total / reached).toFixed(2) : "",
        ),
        stoppedForHealing,
      ].join(","),
    );
  }
}
