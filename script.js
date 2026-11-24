const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const filterButtons = document.querySelectorAll(".filter-button");
const productCards = document.querySelectorAll(".product-card");
const visibleCount = document.querySelector("#visible-count");
const bagOverlay = document.querySelector(".bag-overlay");
const bagDrawer = document.querySelector(".bag-drawer");
const bagItems = document.querySelector(".bag-items");
const bagCountLabels = document.querySelectorAll(".bag-count");
const bagSubtotal = document.querySelector(".bag-subtotal strong");
const checkoutButton = document.querySelector(".checkout-button");
const toast = document.querySelector(".toast");
const cart = [];
let toastTimeout;
let lastFocusedElement;

function formatPrice(price) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function showToast(message) {
  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimeout = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function renderBag() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  bagCountLabels.forEach((label) => {
    label.textContent = String(count);
  });
  bagSubtotal.textContent = formatPrice(subtotal);
  checkoutButton.disabled = count === 0;

  if (cart.length === 0) {
    bagItems.innerHTML = '<p class="bag-empty">Your bag is taking a little breather.<br>Find a piece that feels like you.</p>';
    return;
  }

  bagItems.innerHTML = cart.map((item, index) => `
    <div class="bag-item">
      <div>
        <h3>${item.name}</h3>
        <p>Qty ${item.quantity}</p>
      </div>
      <div class="bag-item-price">
        <span>${formatPrice(item.price * item.quantity)}</span>
        <button class="remove-item" type="button" data-remove="${index}" aria-label="Remove ${item.name} from bag">Remove</button>
      </div>
    </div>
  `).join("");
}

function openBag() {
  lastFocusedElement = document.activeElement;
  bagOverlay.hidden = false;
  bagDrawer.focus();
}

function closeBag() {
  bagOverlay.hidden = true;
  if (lastFocusedElement instanceof HTMLElement) {
    lastFocusedElement.focus();
  }
}

function addToBag(card) {
  const name = card.dataset.product;
  const price = Number(card.dataset.price);

  if (!name || !Number.isFinite(price) || price < 0) {
    showToast("Sorry, this piece could not be added.");
    return;
  }

  const existingItem = cart.find((item) => item.name === name);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ name, price, quantity: 1 });
  }

  renderBag();
  showToast(`${name} added to your bag.`);
}

menuToggle.addEventListener("click", () => {
  const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isExpanded));
  menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation" : "Close navigation");
  primaryNav.classList.toggle("is-open", !isExpanded);
});

primaryNav.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    if (!filter) return;

    filterButtons.forEach((filterButton) => {
      const isActive = filterButton === button;
      filterButton.classList.toggle("is-active", isActive);
      filterButton.setAttribute("aria-pressed", String(isActive));
    });

    let count = 0;
    productCards.forEach((card) => {
      const isVisible = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !isVisible);
      if (isVisible) count += 1;
    });
    visibleCount.textContent = String(count).padStart(2, "0");
  });
});

document.querySelectorAll(".quick-add").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".product-card");
    if (card) addToBag(card);
  });
});

document.querySelector(".bag-button").addEventListener("click", openBag);
document.querySelector(".bag-close").addEventListener("click", closeBag);
document.querySelector(".bag-backdrop").addEventListener("click", closeBag);

bagItems.addEventListener("click", (event) => {
  if (!(event.target instanceof HTMLButtonElement)) return;
  const index = Number(event.target.dataset.remove);
  if (!Number.isInteger(index) || !cart[index]) return;

  const [removedItem] = cart.splice(index, 1);
  renderBag();
  showToast(`${removedItem.name} removed from your bag.`);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (!bagOverlay.hidden) closeBag();
    primaryNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
  }
});

document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return;

  const email = new FormData(form).get("email");
  if (typeof email !== "string" || !email.trim()) return;

  document.querySelector(".newsletter-message").textContent = "You're on the list. Keep an eye on your inbox ♡";
  form.reset();
});

document.querySelector(".checkout-button").addEventListener("click", () => {
  if (cart.length > 0) {
    showToast("Checkout is coming soon. Your bag is saved here for now.");
  }
});

function enableTilt(element, maxAngle = 5) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reducedMotion || !finePointer) return;

  element.addEventListener("pointermove", (event) => {
    const bounds = element.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const rotateY = (x - 0.5) * maxAngle * 2;
    const rotateX = (0.5 - y) * maxAngle * 2;
    element.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
  });

  element.addEventListener("pointerleave", () => {
    element.style.transform = "";
  });
}

document.querySelectorAll("[data-tilt]").forEach((element) => enableTilt(element, 4));
productCards.forEach((card) => enableTilt(card, 2.5));

renderBag();
