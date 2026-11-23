import { createTrainingDummy, simulateBattle } from "../src/services/battle";
import { ruinsEnemies } from "../src/services/ruins-map";
import { seededRandom } from "./seeded-random";

const bouts = 1000;
// The historical fixtures reproduce the original Floor 1 comparison.
const historicalBuilds = [
  { name: "Fresh", hp: 25, speed: 5, attackPower: 5, defense: 0 },
  { name: "Starter gear", hp: 25, speed: 5, attackPower: 6, defense: 3 },
  {
    name: "Level 4 with gear and AP",
    hp: 28,
    speed: 6,
    attackPower: 7,
    defense: 3,
  },
];

// The live level 4 build spends two offensive points and one Fortitude point.
const builds = process.argv.includes("--historical")
  ? historicalBuilds
  : [
      { ...historicalBuilds[0], attackPower: 10 },
      { ...historicalBuilds[1], attackPower: 11 },
      { ...historicalBuilds[2], attackPower: 13, speed: 5 },
    ];

console.log(
  "build,opponent,training_level,bouts,wins,survived,mean_hp,mean_net_gold",
);
for (const build of builds) {
  for (const encounter of ruinsEnemies) {
    const { trainingLevel, reward } = encounter;
    for (const enemy of [encounter.enemy, createTrainingDummy(trainingLevel)]) {
      let wins = 0;
      let survived = 0;
      let hp = 0;
      let netGold = 0;
      for (let seed = 1; seed <= bouts; seed++) {
        const result = simulateBattle(build, enemy, reward, {
          random: seededRandom(seed),
        });
        wins += Number(result.enemyHp === 0);
        survived += Number(result.playerHp > 0);
        hp += result.playerHp;
        netGold += result.goldEarned - (build.hp - result.playerHp);
      }

      console.log(
        [
          build.name,
          enemy.name,
          trainingLevel,
          bouts,
          wins,
          survived,
          (hp / bouts).toFixed(2),
          (netGold / bouts).toFixed(2),
        ].join(","),
      );
    }
  }
}
