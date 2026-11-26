(() => {
  const formatter = new Intl.NumberFormat("en-US");
  const availableGold = Number(
    document.getElementById("player-gold").dataset.gold,
  );

  function updateCart(form, totalDisplay, { maxTotal, limitMessage }) {
    let total = 0;
    let hasSelection = false;
    for (const field of form.querySelectorAll("[data-price]")) {
      const quantity = Number(field.value);
      const valid =
        field.validity.valid &&
        (field.value === "" || /^\d+$/.test(field.value)) &&
        Number.isSafeInteger(quantity);
      if (!valid) {
        totalDisplay.textContent = "—";
        return {
          canSubmit: false,
          error: "Enter whole quantities within the allowed range.",
        };
      }
      hasSelection ||= quantity > 0;
      total += quantity * Number(field.dataset.price);
    }

    const supported = Number.isSafeInteger(total);
    totalDisplay.textContent = supported ? formatter.format(total) : "—";
    if (!supported) {
      return {
        canSubmit: false,
        error: "This total exceeds the supported gold limit.",
      };
    }
    if (total > maxTotal) return { canSubmit: false, error: limitMessage };
    return { canSubmit: hasSelection, error: "" };
  }

  function connectCart(formId, totalId, messageId, limits) {
    const form = document.getElementById(formId);
    const totalDisplay = document.getElementById(totalId);
    const message = document.getElementById(messageId);
    if (!totalDisplay) return;

    const submitButton = form.querySelector('button[type="submit"]');
    totalDisplay.parentElement.hidden = false;

    function update() {
      const { canSubmit, error } = updateCart(form, totalDisplay, limits);
      if (message.textContent !== error) message.textContent = error;
      submitButton.disabled = !canSubmit;
    }

    form.addEventListener("input", update);
    form.addEventListener("submit", (event) => {
      update();
      if (submitButton.disabled) event.preventDefault();
    });
    update();
    window.addEventListener("pageshow", update);
  }

  connectCart("purchase-form", "total-gold", "purchase-message", {
    maxTotal: availableGold,
    limitMessage: "You do not have enough gold.",
  });
  connectCart("sell-form", "sell-total", "sell-message", {
    maxTotal: Number.MAX_SAFE_INTEGER - availableGold,
    limitMessage: "This sale would exceed the supported gold limit.",
  });
})();
