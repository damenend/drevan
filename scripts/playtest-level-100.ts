import { createTrainingDummy, simulateBattle } from "../src/services/battle";
import { getProgression, MAX_PLAYER_LEVEL } from "../src/services/progression";
import { seededRandom } from "./seeded-random";

const checkpointLevels = [10, 25, 50, 75, MAX_PLAYER_LEVEL];
const boutsPerMatchup = 1000;
const sustainabilityBouts = 250;

function lifetimeXpForLevel(targetLevel: number) {
  let xp = 0;
  while (getProgression(xp).level < targetLevel) {
    const nextLevelXp = getProgression(xp).nextLevelXp;
    if (nextLevelXp === null) break;
    xp += nextLevelXp;
  }
  return xp;
}

console.log("XP curve checkpoints");
console.log("character_level,lifetime_xp,next_level_xp");
for (const level of checkpointLevels) {
  const xp = lifetimeXpForLevel(level);
  console.log([level, xp, getProgression(xp).nextLevelXp ?? ""].join(","));
}

const trainingPolicies = [
  { name: "fixed-dummy-4", dummyLevel: () => 4 },
  {
    name: "half-character-level-min-4",
    dummyLevel: (level: number) => Math.max(4, Math.ceil(level / 2)),
  },
  { name: "same-as-character-level", dummyLevel: (level: number) => level },
];

console.log("\nWinning-bout pacing with XP carryover");
console.log("policy,character_level,bouts,lifetime_xp,xp_past_checkpoint");
for (const policy of trainingPolicies) {
  let xp = 0;
  let bouts = 0;
  let checkpointIndex = 0;

  while (getProgression(xp).level < MAX_PLAYER_LEVEL) {
    const characterLevel = getProgression(xp).level;
    xp += policy.dummyLevel(characterLevel) * 10;
    bouts++;

    while (
      checkpointIndex < checkpointLevels.length &&
      getProgression(xp).level >= checkpointLevels[checkpointIndex]
    ) {
      const checkpoint = checkpointLevels[checkpointIndex++];
      console.log(
        [
          policy.name,
          checkpoint,
          bouts,
          xp,
          xp - lifetimeXpForLevel(checkpoint),
        ].join(","),
      );
    }
  }
}

const allocationPlans = [
  {
    name: "all-offense",
    allocate: (points: number) => ({ offense: points, fortitude: 0 }),
  },
  {
    name: "balanced",
    allocate: (points: number) => ({
      offense: Math.ceil(points / 2),
      fortitude: Math.floor(points / 2),
    }),
  },
  {
    name: "all-fortitude",
    allocate: (points: number) => ({ offense: 0, fortitude: points }),
  },
];

console.log("\nCombat and healing economy snapshots");
console.log(
  "allocation,character_level,dummy_level,bouts,win_rate,draw_rate,mean_remaining_hp,mean_attacks,mean_net_gold",
);
for (const characterLevel of checkpointLevels) {
  const points = characterLevel - 1;
  const dummyLevels = [
    ...new Set([
      4,
      Math.max(4, Math.round(characterLevel / 4)),
      Math.max(4, Math.round(characterLevel / 2)),
      characterLevel,
    ]),
  ];

  for (const plan of allocationPlans) {
    const allocation = plan.allocate(points);
    const player = {
      name: `${characterLevel} ${plan.name}`,
      hp: 25 + allocation.fortitude * 3,
      attackPower: 11 + allocation.offense,
      speed: 5,
      defense: 3,
    };

    for (const dummyLevel of dummyLevels) {
      let wins = 0;
      let draws = 0;
      let remainingHp = 0;
      let attacks = 0;
      let netGold = 0;

      for (let seed = 1; seed <= boutsPerMatchup; seed++) {
        const result = simulateBattle(
          player,
          createTrainingDummy(dummyLevel),
          dummyLevel * 10,
          { random: seededRandom(seed) },
        );
        wins += Number(result.outcome === "win");
        draws += Number(result.outcome === "draw");
        remainingHp += result.playerHp;
        attacks += result.battleLog.filter(
          ({ type }) => type === "attack",
        ).length;
        netGold += result.goldEarned - (player.hp - result.playerHp);
      }

      console.log(
        [
          plan.name,
          characterLevel,
          dummyLevel,
          boutsPerMatchup,
          (wins / boutsPerMatchup).toFixed(3),
          (draws / boutsPerMatchup).toFixed(3),
          (remainingHp / boutsPerMatchup).toFixed(2),
          (attacks / boutsPerMatchup).toFixed(2),
          (netGold / boutsPerMatchup).toFixed(2),
        ].join(","),
      );
    }
  }
}

console.log("\nHighest sustainable training dummy");
console.log(
  "allocation,character_level,dummy_level,bouts,win_rate,mean_net_gold",
);
for (const characterLevel of checkpointLevels) {
  const points = characterLevel - 1;

  for (const plan of allocationPlans) {
    const allocation = plan.allocate(points);
    const player = {
      name: `${characterLevel} ${plan.name}`,
      hp: 25 + allocation.fortitude * 3,
      attackPower: 11 + allocation.offense,
      speed: 5,
      defense: 3,
    };
    let sustainable:
      { dummyLevel: number; winRate: number; meanNetGold: number } | undefined;

    for (let dummyLevel = 1; dummyLevel <= MAX_PLAYER_LEVEL; dummyLevel++) {
      let wins = 0;
      let netGold = 0;
      for (let seed = 1; seed <= sustainabilityBouts; seed++) {
        const result = simulateBattle(
          player,
          createTrainingDummy(dummyLevel),
          dummyLevel * 10,
          { random: seededRandom(seed) },
        );
        wins += Number(result.outcome === "win");
        netGold += result.goldEarned - (player.hp - result.playerHp);
      }

      const winRate = wins / sustainabilityBouts;
      const meanNetGold = netGold / sustainabilityBouts;
      if (winRate >= 0.9 && meanNetGold >= 0) {
        sustainable = { dummyLevel, winRate, meanNetGold };
      }
    }

    console.log(
      [
        plan.name,
        characterLevel,
        sustainable?.dummyLevel ?? "",
        sustainabilityBouts,
        sustainable?.winRate.toFixed(3) ?? "",
        sustainable?.meanNetGold.toFixed(2) ?? "",
      ].join(","),
    );
  }
}
