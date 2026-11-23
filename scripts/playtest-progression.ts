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

const firstPointBonuses = {
  save: { attackPower: 0, speed: 0, hp: 0 },
  strength: { attackPower: 1, speed: 0, hp: 0 },
  speed: { attackPower: 0, speed: 1, hp: 0 },
  hp: { attackPower: 0, speed: 0, hp: 3 },
};
type Plan = {
  xpRule: "flat" | "scaled";
  level: number;
  equipped: boolean;
  nextDummyLevel: number;
  firstPoint: keyof typeof firstPointBonuses;
};

const plans: Plan[] = [
  ...(["flat", "scaled"] as const).flatMap((xpRule) =>
    matchups.map(({ level, equipped }) => ({
      xpRule,
      level,
      equipped,
      nextDummyLevel: level,
      firstPoint: "save" as const,
    })),
  ),
  {
    xpRule: "scaled",
    level: 3,
    equipped: true,
    nextDummyLevel: 3,
    firstPoint: "save",
  },
  ...[false, true].flatMap((equipped) =>
    (["save", "strength", "speed", "hp"] as const).map((firstPoint) => ({
      xpRule: "scaled" as const,
      level: 3,
      equipped,
      nextDummyLevel: 4,
      firstPoint,
    })),
  ),
];

console.log(
  "xp_rule,dummy_level,equipped,sessions,character_level,reached,mean_fights_on_reach,stopped_for_healing,next_dummy_level,first_point",
);

for (const { xpRule, level, equipped, nextDummyLevel, firstPoint } of plans) {
  const firstDummy = createTrainingDummy(level);
  const nextDummy = createTrainingDummy(nextDummyLevel);
  const starter = {
    name: "Starter",
    hp: 25,
    attackPower: equipped ? 6 : 5,
    speed: 5,
    defense: equipped ? 3 : 0,
  };
  const bonus = firstPointBonuses[firstPoint];
  const trained = {
    ...starter,
    hp: starter.hp + bonus.hp,
    attackPower: starter.attackPower + bonus.attackPower,
    speed: starter.speed + bonus.speed,
  };
  const checkpoints = thresholds.map((xp) => ({ xp, reached: 0, fights: 0 }));
  let stoppedForHealing = 0;

  for (let seed = 1; seed <= sessions; seed++) {
    const random = seededRandom(seed);
    let gold = 100;
    let xp = 0;
    let next = 0;

    for (let fight = 1; fight <= fightLimit; fight++) {
      const dummy = next === 0 ? firstDummy : nextDummy;
      const dummyLevel = next === 0 ? level : nextDummyLevel;
      const player = next === 0 ? starter : trained;
      const result = simulateBattle(player, dummy, dummyLevel * 10, { random });
      if (result.enemyHp === 0) xp += xpRule === "flat" ? 30 : 10 * dummyLevel;
      while (next < checkpoints.length && xp >= checkpoints[next].xp) {
        checkpoints[next].reached++;
        checkpoints[next].fights += fight;
        next++;
      }
      if (next === checkpoints.length) break;

      // Spending on max HP raises the healing target without restoring current HP.
      const maxHp = next === 0 ? starter.hp : trained.hp;
      gold += result.goldEarned - (maxHp - result.playerHp);
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
        nextDummyLevel,
        firstPoint,
      ].join(","),
    );
  }
}
