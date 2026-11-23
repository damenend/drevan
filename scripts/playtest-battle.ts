import { createTrainingDummy, simulateBattle } from "../src/services/battle";

import { seededRandom } from "./seeded-random";

const fightsPerMatchup = 1000;
const rows = [
  "level,strength,defense,fights,wins,losses,draws,mean_attacks,mean_hp_on_wins,matched_incoming_hits,reduced_hits",
];

for (let level = 1; level <= 8; level++) {
  const dummy = createTrainingDummy(level);

  for (const strength of [5, 6]) {
    const baselineDamage: number[][] = [];

    for (const defense of [0, 1, 2, 3]) {
      let wins = 0;
      let draws = 0;
      let attacks = 0;
      let hpOnWins = 0;
      let matchedHits = 0;
      let reducedHits = 0;

      for (let fight = 0; fight < fightsPerMatchup; fight++) {
        const result = simulateBattle(
          { name: "Player", hp: 25, speed: 5, strength, defense },
          dummy,
          level * 10,
          { random: seededRandom(fight + 1) },
        );

        if (result.enemyHp === 0) {
          wins++;
          hpOnWins += result.playerHp;
        } else if (result.playerHp > 0) {
          draws++;
        }

        const incomingDamage: number[] = [];
        for (const entry of result.battleLog) {
          if (entry.type !== "attack") continue;
          attacks++;
          if (entry.actor === "enemy") incomingDamage.push(entry.damage);
        }

        if (defense === 0) {
          baselineDamage.push(incomingDamage);
        } else {
          const baseline = baselineDamage[fight];
          const sharedHits = Math.min(baseline.length, incomingDamage.length);
          matchedHits += sharedHits;
          for (let hit = 0; hit < sharedHits; hit++) {
            if (incomingDamage[hit] < baseline[hit]) reducedHits++;
          }
        }
      }

      rows.push(
        [
          level,
          strength,
          defense,
          fightsPerMatchup,
          wins,
          fightsPerMatchup - wins - draws,
          draws,
          (attacks / fightsPerMatchup).toFixed(2),
          wins ? (hpOnWins / wins).toFixed(2) : "",
          matchedHits,
          reducedHits,
        ].join(","),
      );
    }
  }
}

console.log(rows.join("\n"));
