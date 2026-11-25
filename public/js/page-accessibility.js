(() => {
  // Results rendered after a navigation are already present when scripts run.
  // Focus the result so assistive technology can discover it immediately.
  const result = document.querySelector("[data-result-focus]");
  if (result && document.activeElement === document.body) result.focus();

  const tables = document.querySelectorAll("[data-scroll-label]");
  if (!tables.length) return;

  /** Gives each overflowing table wrapper a named region and a Tab stop. */
  function updateScrollStops() {
    for (const table of tables) {
      if (table.scrollWidth > table.clientWidth) {
        table.tabIndex = 0;
        table.setAttribute("role", "region");
        table.setAttribute("aria-label", table.dataset.scrollLabel);
      } else {
        table.removeAttribute("tabindex");
        table.removeAttribute("role");
        table.removeAttribute("aria-label");
      }
    }
  }

  updateScrollStops();
  const observer = new ResizeObserver(updateScrollStops);
  for (const table of tables) {
    observer.observe(table);
    observer.observe(table.querySelector("table"));
  }
})();
