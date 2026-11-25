(() => {
  const map = document.querySelector("[data-ruins-map]");
  if (!map) return;

  const buttons = Array.from(
    map.querySelectorAll('button[name="destination"]'),
  );
  const playerTile = map.querySelector("[data-player-tile]");
  if (!playerTile || !buttons.length) return;

  const focusableTiles = [playerTile, ...buttons];

  const position = Number(map.dataset.position);
  const size = Number(map.dataset.size);
  // Directions are relative to the player. The server renders buttons only
  // for legal steps, so a missing target means that direction is unavailable.
  const destinations = new Map([
    ["ArrowUp", position - size],
    ["ArrowDown", position + size],
    ["ArrowLeft", position - 1],
    ["ArrowRight", position + 1],
  ]);

  const instructions = document.getElementById("ruins-map-keys");
  instructions.textContent =
    "Use Tab or the arrow keys to choose a move. Press Enter or Space to move.";

  map.addEventListener("keydown", (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !focusableTiles.includes(event.target) ||
      !destinations.has(event.key)
    ) {
      return;
    }

    const destination = destinations.get(event.key);
    const button = buttons.find(
      (button) => Number(button.value) === destination,
    );
    if (!button) return;
    event.preventDefault();
    button.focus();
  });

  if (map.hasAttribute("data-restore-focus")) playerTile.focus();
})();
