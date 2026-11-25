(() => {
  const map = document.querySelector("[data-ruins-map]");
  if (!map) return;

  const buttons = Array.from(
    map.querySelectorAll('button[name="destination"]'),
  );
  const playerTile = map.querySelector("[data-player-tile]");
  if (!playerTile || !buttons.length) return;

  // Keep one Tab stop inside the map. Without JavaScript the move buttons
  // stay in their native tab order.
  const focusableTiles = [playerTile, ...buttons];
  let tabStop = playerTile;
  playerTile.tabIndex = 0;
  for (const button of buttons) button.tabIndex = -1;

  map.addEventListener("focusin", (event) => {
    if (!focusableTiles.includes(event.target)) return;
    tabStop.tabIndex = -1;
    tabStop = event.target;
    tabStop.tabIndex = 0;
  });

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
  instructions.hidden = false;
  map.setAttribute("aria-describedby", instructions.id);

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

    event.preventDefault();
    const destination = destinations.get(event.key);
    buttons.find((button) => Number(button.value) === destination)?.focus();
  });

  if (map.hasAttribute("data-restore-focus")) playerTile.focus();
})();
