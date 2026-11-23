(() => {
  const formatter = new Intl.NumberFormat("en-US");
  const availableGold = Number(
    document.getElementById("player-gold").dataset.gold,
  );

  function updateCart(
    form,
    output,
    { maxTotal, limitMessage, requireSelection },
  ) {
    let total = 0;
    for (const field of form.querySelectorAll("[data-price]")) {
      const quantity = Number(field.value);
      const valid =
        field.validity.valid &&
        (field.value === "" || /^\d+$/.test(field.value)) &&
        Number.isSafeInteger(quantity);
      if (!valid) {
        output.value = "—";
        return "Enter whole quantities within the allowed range.";
      }
      total += quantity * Number(field.dataset.price);
    }

    const supported = Number.isSafeInteger(total);
    output.value = supported ? formatter.format(total) : "—";
    if (!supported) return "This total exceeds the supported gold limit.";
    if (total > maxTotal) return limitMessage;
    if (requireSelection && total === 0) return "Enter a quantity to sell.";
    return "";
  }

  function connectCart(formId, outputId, messageId, limits) {
    const form = document.getElementById(formId);
    const output = document.getElementById(outputId);
    const message = document.getElementById(messageId);
    if (!output) return;

    function update() {
      const error = updateCart(form, output, limits);
      if (message.textContent.trim() !== error) message.textContent = error;
      return error;
    }

    form.addEventListener("input", update);
    form.addEventListener("submit", (event) => {
      if (update()) event.preventDefault();
    });
  }

  connectCart("purchase-form", "total-gold", "purchase-message", {
    maxTotal: availableGold,
    limitMessage: "You do not have enough gold.",
  });
  connectCart("sell-form", "sell-total", "sell-message", {
    maxTotal: Number.MAX_SAFE_INTEGER - availableGold,
    limitMessage: "This sale would exceed the supported gold limit.",
    requireSelection: true,
  });
})();
