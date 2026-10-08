const state = {
  user: null,
  page: "orders",
  orders: [],
  summary: null,
  categories: [],
  products: [],
  users: [],
  selectedId: null,
  timer: null,
  filters: { search: "", status: "", today: true, date: "" },
};

let draft = null;
let pendingImage = null;

const COLUMNS = [
  { status: "NEW", title: "New", action: "accept", actionLabel: "Accept Order" },
  { status: "ACCEPTED", title: "Accepted", action: "preparing", actionLabel: "Start Preparing" },
  { status: "PREPARING", title: "Preparing", action: "ready", actionLabel: "Mark Ready" },
  { status: "READY", title: "Ready", action: "complete", actionLabel: "Complete Order" },
  { status: "COMPLETED", title: "Completed", action: null, actionLabel: "" },
];

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function money(value) {
  const amount = Number(value || 0);
  return `৳${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

function formatWhen(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toast(message) {
  const el = document.getElementById("toast");
  el.hidden = false;
  el.textContent = message;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    el.hidden = true;
  }, 3200);
}

async function api(path, { method = "GET", body, form } = {}) {
  const headers = new Headers();
  const token = localStorage.getItem("cafemate_access");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const init = { method, headers };
  if (form) {
    init.body = form;
  } else if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    init.body = JSON.stringify(body);
  }
  const response = await fetch(path, init);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (_error) {
      data = { detail: "Unable to load data. Please try again." };
    }
  }
  if (response.status === 401 && path !== "/api/auth/login") {
    localStorage.removeItem("cafemate_access");
    localStorage.removeItem("cafemate_user");
    state.user = null;
    clearInterval(state.timer);
    renderLogin("Please sign in again.");
    throw new Error("Please sign in again.");
  }
  if (!response.ok) {
    throw new Error((data && data.detail) || "Unable to load data. Please try again.");
  }
  return data;
}

function itemLine(item) {
  const custom = (item.customizations || [])
    .map((entry) => `${entry.option_name}: ${entry.option_value}`)
    .join(", ");
  const note = item.special_instruction ? ` Note: ${item.special_instruction}` : "";
  return `${item.quantity} × ${item.product_name}${custom ? " — " + custom : ""}${note}`;
}

function renderLogin(message = "") {
  document.getElementById("app").innerHTML = `
    <main class="login">
      <section class="login-card">
        <p class="mark">CafeMate</p>
        <h1>Staff dashboard</h1>
        <p class="muted">Accept orders, prepare them, and keep the menu up to date.</p>
        <p class="error" id="login-error">${esc(message)}</p>
        <form id="login-form">
          <label>Username<input name="username" autocomplete="username" required /></label>
          <label>Password<input name="password" type="password" autocomplete="current-password" required /></label>
          <button class="btn" type="submit">Sign in</button>
        </form>
        <p class="hint">Staff demo: staff / staff123<br />Admin demo: admin / admin123</p>
      </section>
    </main>`;
  document.getElementById("login-form").addEventListener("submit", onLogin);
}

async function onLogin(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const error = document.getElementById("login-error");
  error.textContent = "";
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: { username: String(form.get("username") || "").trim(), password: form.get("password") },
    });
    if (!["staff", "admin"].includes(data.user.role)) {
      error.textContent = "This dashboard is for cafe staff and admins.";
      return;
    }
    localStorage.setItem("cafemate_access", data.access);
    localStorage.setItem("cafemate_user", JSON.stringify(data.user));
    state.user = data.user;
    renderShell();
  } catch (err) {
    error.textContent = err.message;
  }
}

function renderShell() {
  const admin = state.user.role === "admin";
  document.getElementById("app").innerHTML = `
    <div class="shell">
      <aside class="side">
        <div>
          <p class="mark">CafeMate</p>
          <p class="side-sub">Cafe dashboard</p>
        </div>
        <nav>
          <button class="nav" data-page="orders" type="button">Orders</button>
          ${admin ? '<button class="nav" data-page="menu" type="button">Menu</button>' : ""}
          ${admin ? '<button class="nav" data-page="staff" type="button">Staff</button>' : ""}
        </nav>
        <div class="side-user">
          <strong>${esc(state.user.full_name)}</strong>
          <span>${esc(state.user.role)}</span>
          <button class="link" id="logout" type="button">Sign out</button>
        </div>
      </aside>
      <main id="main"></main>
    </div>`;
  document.querySelectorAll(".nav").forEach((button) => {
    button.addEventListener("click", () => {
      state.page = button.dataset.page;
      state.selectedId = null;
      showPage();
    });
  });
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("cafemate_access");
    localStorage.removeItem("cafemate_user");
    state.user = null;
    clearInterval(state.timer);
    renderLogin();
  });
  showPage();
}

function markNav() {
  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === state.page);
  });
}

async function showPage() {
  clearInterval(state.timer);
  markNav();
  const main = document.getElementById("main");
  if (state.page === "orders") {
    main.innerHTML = ordersShell();
    bindOrderFilters();
    await refreshOrders();
    state.timer = setInterval(() => refreshOrders(true), 15000);
    return;
  }
  if (state.page === "menu") {
    main.innerHTML = `
      <header class="page-head">
        <div><h1>Menu</h1><p>Products, prices, and customization options.</p></div>
        <button class="btn" id="add-product" type="button">Add product</button>
      </header>
      <section class="panel">
        <h2>Categories</h2>
        <form id="category-form" class="inline">
          <label>Name<input name="name" required /></label>
          <label>Emoji<input name="emoji" maxlength="8" /></label>
          <button class="btn small" type="submit">Add category</button>
        </form>
        <div id="category-list"></div>
      </section>
      <div id="menu-list" class="panel">Loading products...</div>
      <div id="editor"></div>`;
    document.getElementById("add-product").addEventListener("click", () => openEditor(null));
    document.getElementById("category-form").addEventListener("submit", addCategory);
    await loadMenu();
    return;
  }
  main.innerHTML = `
    <header class="page-head">
      <div><h1>Staff access</h1><p>Create staff and admin accounts for the cafe.</p></div>
    </header>
    <form id="staff-form" class="panel form-grid"></form>
    <div id="staff-list" class="panel">Loading...</div>`;
  renderStaffForm();
  await loadStaff();
}

function ordersShell() {
  return `
    <header class="page-head">
      <div>
        <h1>Orders</h1>
        <p>New orders appear here. The board refreshes every 15 seconds.</p>
      </div>
      <button class="btn secondary" id="refresh" type="button">Refresh</button>
    </header>
    <section id="summary" class="summary"></section>
    <section class="filters">
      <input id="search" placeholder="Search order number or customer" value="${esc(state.filters.search)}" />
      <select id="status">
        <option value="">All statuses</option>
        ${COLUMNS.map((column) => `<option value="${column.status}" ${state.filters.status === column.status ? "selected" : ""}>${column.title}</option>`).join("")}
      </select>
      <label class="check"><input id="today" type="checkbox" ${state.filters.today ? "checked" : ""} /> Today</label>
      <input id="date" type="date" value="${esc(state.filters.date)}" />
    </section>
    <section id="board" class="board"></section>
    <aside id="drawer" class="drawer" hidden></aside>`;
}

function bindOrderFilters() {
  const search = document.getElementById("search");
  let timer = null;
  search.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => refreshOrders(), 300);
  });
  document.getElementById("status").addEventListener("change", () => refreshOrders());
  document.getElementById("today").addEventListener("change", () => refreshOrders());
  document.getElementById("date").addEventListener("change", () => {
    document.getElementById("today").checked = false;
    refreshOrders();
  });
  document.getElementById("refresh").addEventListener("click", () => refreshOrders());
  document.getElementById("board").addEventListener("click", onBoardClick);
}

function readFilters() {
  const search = document.getElementById("search");
  if (!search) return;
  state.filters.search = search.value.trim();
  state.filters.status = document.getElementById("status").value;
  state.filters.today = document.getElementById("today").checked;
  state.filters.date = document.getElementById("date").value;
}

async function refreshOrders(silent) {
  readFilters();
  const params = new URLSearchParams();
  if (state.filters.search) params.set("search", state.filters.search);
  if (state.filters.status) params.set("status", state.filters.status);
  if (state.filters.today) params.set("today", "true");
  else if (state.filters.date) params.set("date", state.filters.date);
  try {
    const [orders, summary] = await Promise.all([
      api(`/api/dashboard/orders?${params.toString()}`),
      api("/api/dashboard/summary"),
    ]);
    state.orders = orders;
    state.summary = summary;
    renderSummary();
    renderBoard();
    if (state.selectedId) renderDrawer(state.orders.find((order) => order.id === state.selectedId));
  } catch (error) {
    if (!silent) toast(error.message);
  }
}

function renderSummary() {
  const summary = state.summary || {};
  const cards = [
    ["Today's orders", summary.today_total || 0],
    ["New", summary.new || 0],
    ["Accepted", summary.accepted || 0],
    ["Preparing", summary.preparing || 0],
    ["Ready", summary.ready || 0],
    ["Completed", summary.completed || 0],
  ];
  document.getElementById("summary").innerHTML = cards
    .map(([label, value]) => `<article class="stat"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderBoard() {
  const board = document.getElementById("board");
  if (!board) return;
  board.innerHTML = COLUMNS.map((column) => {
    const orders = state.orders.filter((order) => order.status === column.status);
    const cards = orders.length
      ? orders.map((order) => orderCard(order, column)).join("")
      : `<p class="muted">No orders</p>`;
    return `<section class="column"><h2>${column.title}</h2>${cards}</section>`;
  }).join("");
}

function orderCard(order, column) {
  const lines = order.items.map((item) => `<li>${esc(itemLine(item))}</li>`).join("");
  const button = column.action
    ? `<button class="btn small" type="button" data-action="${column.action}" data-id="${order.id}">${column.actionLabel}</button>`
    : "";
  return `
    <article class="card" data-id="${order.id}">
      <header><strong>${esc(order.order_number)}</strong><time>${esc(formatWhen(order.created_at))}</time></header>
      <p>${esc(order.customer_name)}</p>
      <ul>${lines}</ul>
      <p class="total">${money(order.total_amount)}</p>
      ${button}
    </article>`;
}

async function onBoardClick(event) {
  const action = event.target.closest("[data-action]");
  if (action) {
    await moveOrder(action.dataset.id, action.dataset.action);
    return;
  }
  const card = event.target.closest("[data-id]");
  if (card) openDrawer(Number(card.dataset.id));
}

async function moveOrder(id, action) {
  try {
    await api(`/api/dashboard/orders/${id}/${action}`, { method: "PUT" });
    await refreshOrders(true);
    toast("Order updated.");
  } catch (error) {
    toast(error.message);
  }
}

function openDrawer(id) {
  state.selectedId = id;
  renderDrawer(state.orders.find((order) => order.id === id));
}

function renderDrawer(order) {
  const drawer = document.getElementById("drawer");
  if (!drawer) return;
  if (!order) {
    drawer.hidden = true;
    return;
  }
  const column = COLUMNS.find((item) => item.status === order.status);
  const items = order.items
    .map((item) => {
      const custom = (item.customizations || [])
        .map((entry) => `<li>${esc(entry.option_name)}: ${esc(entry.option_value)}${Number(entry.extra_price) > 0 ? ` (+${money(entry.extra_price)})` : ""}</li>`)
        .join("");
      return `
        <section>
          <strong>${item.quantity} × ${esc(item.product_name)}</strong>
          <p class="meta">${money(item.total_price)}</p>
          <ul>${custom || "<li>No customization</li>"}</ul>
          ${item.special_instruction ? `<p>Note: ${esc(item.special_instruction)}</p>` : ""}
        </section>`;
    })
    .join("");
  drawer.hidden = false;
  drawer.innerHTML = `
    <div class="row-between">
      <h2>${esc(order.order_number)}</h2>
      <button class="btn secondary small" id="close-drawer" type="button">Close</button>
    </div>
    <p>${esc(order.customer_name)}</p>
    <p class="meta">${esc(formatWhen(order.created_at))}</p>
    <p><span class="tag ${order.status}">${esc(order.status)}</span></p>
    ${items}
    ${order.special_instruction ? `<p><strong>Order note:</strong> ${esc(order.special_instruction)}</p>` : ""}
    <p class="total">Total ${money(order.total_amount)}</p>
    ${column && column.action ? `<button class="btn" id="drawer-action" type="button">${column.actionLabel}</button>` : ""}`;
  document.getElementById("close-drawer").addEventListener("click", () => {
    state.selectedId = null;
    drawer.hidden = true;
  });
  const actionButton = document.getElementById("drawer-action");
  if (actionButton && column) {
    actionButton.addEventListener("click", () => moveOrder(order.id, column.action));
  }
}

async function loadMenu() {
  try {
    const [categories, products] = await Promise.all([
      api("/api/admin/categories"),
      api("/api/admin/products"),
    ]);
    state.categories = categories;
    state.products = products;
    renderCategories();
    renderProducts();
  } catch (error) {
    toast(error.message);
  }
}

function renderCategories() {
  const list = document.getElementById("category-list");
  if (!list) return;
  list.innerHTML = state.categories
    .map(
      (category) => `
      <div class="row-between" style="padding:8px 0;">
        <span>${esc(category.emoji)} ${esc(category.name)} <span class="meta">${category.product_count} products</span></span>
        <button class="btn secondary small" type="button" data-category="${category.id}" data-active="${category.is_active}">
          ${category.is_active ? "Disable" : "Enable"}
        </button>
      </div>`
    )
    .join("");
  list.querySelectorAll("[data-category]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/api/admin/categories/${button.dataset.category}`, {
          method: "PATCH",
          body: { is_active: button.dataset.active !== "true" },
        });
        await loadMenu();
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

async function addCategory(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  try {
    await api("/api/admin/categories", {
      method: "POST",
      body: { name: String(form.get("name")).trim(), emoji: String(form.get("emoji") || "").trim() },
    });
    event.target.reset();
    await loadMenu();
  } catch (error) {
    toast(error.message);
  }
}

function renderProducts() {
  const list = document.getElementById("menu-list");
  if (!list) return;
  if (!state.products.length) {
    list.innerHTML = "<p>No products yet.</p>";
    return;
  }
  list.innerHTML = state.products
    .map(
      (product) => `
      <div class="product-row">
        <div><strong>${esc(product.name)}</strong><div class="meta">${esc(product.category.name)} · ${product.preparation_time} min</div></div>
        <div>${money(product.price)}</div>
        <div>${product.is_active ? "Available" : "Hidden"}</div>
        <div>${product.is_featured ? "Popular" : ""}</div>
        <div class="inline">
          <button class="btn secondary small" type="button" data-edit="${product.id}">Edit</button>
          <button class="btn secondary small" type="button" data-toggle="${product.id}" data-active="${product.is_active}">
            ${product.is_active ? "Disable" : "Enable"}
          </button>
        </div>
      </div>`
    )
    .join("");
  list.querySelectorAll("[data-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      openEditor(state.products.find((product) => product.id === Number(button.dataset.edit)));
    });
  });
  list.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await api(`/api/admin/products/${button.dataset.toggle}`, {
          method: "PATCH",
          body: { is_active: button.dataset.active !== "true" },
        });
        await loadMenu();
      } catch (error) {
        toast(error.message);
      }
    });
  });
}

function openEditor(product) {
  pendingImage = null;
  if (product) {
    draft = {
      id: product.id,
      category_id: product.category.id,
      name: product.name,
      description: product.description || "",
      ingredients: product.ingredients || "",
      price: product.price,
      preparation_time: product.preparation_time,
      image_url: product.image_url || "",
      is_active: product.is_active,
      is_featured: product.is_featured,
      groups: (product.groups || []).map((group) => ({
        name: group.name,
        input_type: group.input_type,
        is_required: group.is_required,
        options: group.options.map((option) => ({
          value: option.value,
          extra_price: option.extra_price,
        })),
      })),
    };
  } else {
    draft = {
      id: null,
      category_id: state.categories[0] ? state.categories[0].id : "",
      name: "",
      description: "",
      ingredients: "",
      price: "",
      preparation_time: 5,
      image_url: "",
      is_active: true,
      is_featured: false,
      groups: [],
    };
  }
  renderEditor();
}

function readDraft() {
  if (!draft || !document.getElementById("p-name")) return draft;
  draft.category_id = Number(document.getElementById("p-category").value);
  draft.name = document.getElementById("p-name").value;
  draft.description = document.getElementById("p-description").value;
  draft.ingredients = document.getElementById("p-ingredients").value;
  draft.price = document.getElementById("p-price").value;
  draft.preparation_time = Number(document.getElementById("p-prep").value || 5);
  draft.image_url = document.getElementById("p-image-url").value;
  draft.is_active = document.getElementById("p-active").checked;
  draft.is_featured = document.getElementById("p-featured").checked;
  draft.groups = [...document.querySelectorAll("[data-group-index]")].map((node) => ({
    name: node.querySelector(".g-name").value,
    input_type: node.querySelector(".g-type").value,
    is_required: node.querySelector(".g-required").checked,
    options: [...node.querySelectorAll("[data-option-index]")].map((option) => ({
      value: option.querySelector(".o-value").value,
      extra_price: option.querySelector(".o-price").value || "0",
    })),
  }));
  return draft;
}

function renderEditor() {
  const host = document.getElementById("editor");
  if (!host || !draft) return;
  const categories = state.categories
    .map(
      (category) =>
        `<option value="${category.id}" ${Number(draft.category_id) === category.id ? "selected" : ""}>${esc(category.name)}</option>`
    )
    .join("");
  host.innerHTML = `
    <div class="editor">
      <form class="editor-card" id="product-form">
        <div class="row-between"><h2>${draft.id ? "Edit product" : "Add product"}</h2><button class="btn secondary small" id="close-editor" type="button">Close</button></div>
        <div class="form-grid">
          <label>Category<select id="p-category">${categories}</select></label>
          <label>Name<input id="p-name" value="${esc(draft.name)}" required /></label>
          <label>Price<input id="p-price" type="number" min="0" step="0.01" value="${esc(draft.price)}" required /></label>
          <label>Preparation time (minutes)<input id="p-prep" type="number" min="1" max="180" value="${esc(draft.preparation_time)}" /></label>
          <label>Description<textarea id="p-description">${esc(draft.description)}</textarea></label>
          <label>Ingredients<textarea id="p-ingredients">${esc(draft.ingredients)}</textarea></label>
          <label>Image URL<input id="p-image-url" value="${esc(draft.image_url)}" placeholder="https://" /></label>
          <label>Upload image<input id="p-file" type="file" accept="image/*" /></label>
          <div class="checks">
            <label class="check"><input id="p-active" type="checkbox" ${draft.is_active ? "checked" : ""} /> Available</label>
            <label class="check"><input id="p-featured" type="checkbox" ${draft.is_featured ? "checked" : ""} /> Popular</label>
          </div>
          <div id="groups">${draft.groups.map((group, index) => groupEditor(group, index)).join("")}</div>
          <button class="btn secondary" id="add-group" type="button">Add customization group</button>
          <button class="btn" type="submit">Save product</button>
        </div>
      </form>
    </div>`;
  document.getElementById("close-editor").addEventListener("click", () => {
    host.innerHTML = "";
    draft = null;
    pendingImage = null;
  });
  document.getElementById("p-file").addEventListener("change", (event) => {
    pendingImage = event.target.files[0] || null;
  });
  document.getElementById("add-group").addEventListener("click", () => {
    readDraft();
    draft.groups.push({
      name: "",
      input_type: "single",
      is_required: true,
      options: [{ value: "", extra_price: "0" }],
    });
    renderEditor();
  });
  host.querySelectorAll("[data-remove-group]").forEach((button) => {
    button.addEventListener("click", () => {
      readDraft();
      draft.groups.splice(Number(button.dataset.removeGroup), 1);
      renderEditor();
    });
  });
  host.querySelectorAll("[data-add-option]").forEach((button) => {
    button.addEventListener("click", () => {
      readDraft();
      draft.groups[Number(button.dataset.addOption)].options.push({ value: "", extra_price: "0" });
      renderEditor();
    });
  });
  host.querySelectorAll("[data-remove-option]").forEach((button) => {
    button.addEventListener("click", () => {
      readDraft();
      const [groupIndex, optionIndex] = button.dataset.removeOption.split("-").map(Number);
      draft.groups[groupIndex].options.splice(optionIndex, 1);
      renderEditor();
    });
  });
  document.getElementById("product-form").addEventListener("submit", saveProduct);
}

function groupEditor(group, index) {
  const options = group.options
    .map(
      (option, optionIndex) => `
      <div class="option-row" data-option-index="${optionIndex}">
        <input class="o-value" placeholder="Option" value="${esc(option.value)}" />
        <input class="o-price" type="number" min="0" step="0.01" placeholder="Extra price" value="${esc(option.extra_price)}" />
        <button class="btn secondary small" type="button" data-remove-option="${index}-${optionIndex}">Remove</button>
      </div>`
    )
    .join("");
  return `
    <section class="group-box" data-group-index="${index}">
      <div class="row-between">
        <strong>Customization group</strong>
        <button class="btn secondary small" type="button" data-remove-group="${index}">Remove group</button>
      </div>
      <input class="g-name" placeholder="Group name, for example Sugar" value="${esc(group.name)}" />
      <select class="g-type">
        <option value="single" ${group.input_type === "single" ? "selected" : ""}>Choose one</option>
        <option value="multiple" ${group.input_type === "multiple" ? "selected" : ""}>Choose many</option>
      </select>
      <label class="check"><input class="g-required" type="checkbox" ${group.is_required ? "checked" : ""} /> Required</label>
      ${options}
      <button class="btn secondary small" type="button" data-add-option="${index}">Add option</button>
    </section>`;
}

async function saveProduct(event) {
  event.preventDefault();
  readDraft();
  const payload = {
    category_id: draft.category_id,
    name: draft.name.trim(),
    description: draft.description,
    ingredients: draft.ingredients,
    price: draft.price,
    preparation_time: draft.preparation_time,
    image_url: draft.image_url,
    is_active: draft.is_active,
    is_featured: draft.is_featured,
    groups: draft.groups
      .filter((group) => group.name.trim())
      .map((group) => ({
        name: group.name.trim(),
        input_type: group.input_type,
        is_required: group.is_required,
        options: group.options
          .filter((option) => option.value.trim())
          .map((option) => ({ value: option.value.trim(), extra_price: option.extra_price || 0 })),
      })),
  };
  try {
    const saved = await api(draft.id ? `/api/admin/products/${draft.id}` : "/api/admin/products", {
      method: draft.id ? "PATCH" : "POST",
      body: payload,
    });
    if (pendingImage) {
      const form = new FormData();
      form.append("image", pendingImage);
      await api(`/api/admin/products/${saved.id}/image`, { method: "POST", form });
    }
    document.getElementById("editor").innerHTML = "";
    draft = null;
    pendingImage = null;
    toast("Product saved.");
    await loadMenu();
  } catch (error) {
    toast(error.message);
  }
}

function renderStaffForm() {
  document.getElementById("staff-form").innerHTML = `
    <h2>New staff account</h2>
    <div class="inline">
      <label>First name<input name="first_name" required /></label>
      <label>Last name<input name="last_name" /></label>
      <label>Username<input name="username" required /></label>
      <label>Password<input name="password" type="password" minlength="6" required /></label>
      <label>Role
        <select name="role">
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <button class="btn small" type="submit">Create</button>
    </div>`;
  document.getElementById("staff-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    try {
      await api("/api/admin/users", {
        method: "POST",
        body: {
          first_name: form.get("first_name"),
          last_name: form.get("last_name"),
          username: form.get("username"),
          password: form.get("password"),
          role: form.get("role"),
        },
      });
      event.target.reset();
      toast("Account created.");
      await loadStaff();
    } catch (error) {
      toast(error.message);
    }
  });
}

async function loadStaff() {
  try {
    state.users = await api("/api/admin/users");
    const list = document.getElementById("staff-list");
    list.innerHTML = state.users
      .map(
        (user) => `
        <div class="user-row">
          <div><strong>${esc(user.full_name)}</strong><div class="meta">@${esc(user.username)}</div></div>
          <div>${esc(user.role)}</div>
          <div>${user.is_active ? "Active" : "Disabled"}</div>
          <button class="btn secondary small" type="button" data-user="${user.id}" data-active="${user.is_active}" ${user.id === state.user.id ? "disabled" : ""}>
            ${user.is_active ? "Disable" : "Enable"}
          </button>
        </div>`
      )
      .join("");
    list.querySelectorAll("[data-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await api(`/api/admin/users/${button.dataset.user}`, {
            method: "PATCH",
            body: { is_active: button.dataset.active !== "true" },
          });
          await loadStaff();
        } catch (error) {
          toast(error.message);
        }
      });
    });
  } catch (error) {
    toast(error.message);
  }
}

async function boot() {
  const token = localStorage.getItem("cafemate_access");
  if (!token) {
    renderLogin();
    return;
  }
  try {
    state.user = await api("/api/auth/me");
    if (!["staff", "admin"].includes(state.user.role)) {
      localStorage.removeItem("cafemate_access");
      localStorage.removeItem("cafemate_user");
      renderLogin("This dashboard is for cafe staff and admins.");
      return;
    }
    renderShell();
  } catch (_error) {
    renderLogin();
  }
}

boot();
