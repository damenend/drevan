(() => {
  const formatter = new Intl.NumberFormat("en-US");

  function evaluateCart(fields, maxTotal, limitMessage) {
    let total = 0;
    let hasSelection = false;
    for (const field of fields) {
      const quantity = Number(field.value);
      if (
        !field.validity.valid ||
        (field.value !== "" && !/^\d+$/.test(field.value)) ||
        !Number.isSafeInteger(quantity)
      ) {
        return {
          total: null,
          canSubmit: false,
          error: "Enter whole quantities within the allowed range.",
        };
      }
      hasSelection ||= quantity > 0;
      total += quantity * Number(field.dataset.price);
    }

    if (!Number.isSafeInteger(total)) {
      return {
        total: null,
        canSubmit: false,
        error: "This total exceeds the supported gold limit.",
      };
    }
    if (total > maxTotal) {
      return { total, canSubmit: false, error: limitMessage };
    }
    return { total, canSubmit: hasSelection, error: "" };
  }

  function connectCart(form) {
    const fields = form.querySelectorAll("[data-price]");
    const summary = form.querySelector("[data-cart-summary]");
    const totalDisplay = summary.querySelector("[data-cart-total]");
    const message = form.querySelector("[data-cart-message]");
    const submitButton = form.querySelector('button[type="submit"]');
    const maxTotal = Number(form.dataset.cartMaxTotal);

    function update() {
      const { total, canSubmit, error } = evaluateCart(
        fields,
        maxTotal,
        form.dataset.cartLimitMessage,
      );
      totalDisplay.textContent = total === null ? "—" : formatter.format(total);
      if (message.textContent !== error) message.textContent = error;
      submitButton.disabled = !canSubmit;
    }

    form.addEventListener("input", update);
    form.addEventListener("submit", (event) => {
      update();
      if (submitButton.disabled) event.preventDefault();
    });
    window.addEventListener("pageshow", update);
    update();
    summary.hidden = false;
  }

  for (const form of document.querySelectorAll("form[data-cart-max-total]")) {
    connectCart(form);
  }
})();
