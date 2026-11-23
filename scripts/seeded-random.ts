/** Resets the random stream so each loadout faces the same rolls for a seed. */
export function seededRandom(seed: number) {
  let state = Math.imul(seed, 0x9e3779b9);

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    // Mulberry32 mixes the state before converting it to a roll in [0, 1).
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}
