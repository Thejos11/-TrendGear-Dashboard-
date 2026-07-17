/* ============================================================
   TrendGear Dashboard — Fase III: Lógica de Programación
   Conecta con Firebase Realtime Database (o un JSON local de
   respaldo) y renderiza los datos dinámicamente en el DOM.
   ============================================================ */

// -----------------------------------------------------------
// 1. FETCH DE DATOS
// -----------------------------------------------------------
// Reemplaza esta constante por la URL real de tu Firebase Realtime
// Database (formato: https://TU-PROYECTO.firebaseio.com/customers.json).
// Si se deja vacía, el dashboard usa automáticamente el archivo
// JSON local en data/trendgear_dataset.json (mismo "shape" que
// devolvería Firebase: { customers: { "TG-0001": {...}, ... } }).
const FIREBASE_URL = ""; // <-- pega aquí tu URL de Firebase Realtime Database
const LOCAL_FALLBACK_URL = "data/trendgear_dataset.json";

let allCustomers = [];

async function fetchCustomers() {
  const statusEl = document.getElementById("connectionStatus");
  const statusText = document.getElementById("connectionText");
  const url = FIREBASE_URL || LOCAL_FALLBACK_URL;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al consultar ${url}`);
    }
    const json = await response.json();

    // Firebase Realtime Database entrega un objeto { id: {...} },
    // no un array. Lo convertimos con Object.values().
    const customersObj = json.customers || json; // soporta ambas formas
    allCustomers = Object.values(customersObj);

    statusEl.classList.add("ok");
    statusText.textContent = FIREBASE_URL
      ? `Conectado a Firebase · ${allCustomers.length} clientes`
      : `Datos sintéticos cargados · ${allCustomers.length} clientes`;

    renderAll();
  } catch (error) {
    // Protocolo de Depuración Asistida (ver guía, sección 4):
    // registrar el error completo en consola para poder copiarlo
    // junto con el fragmento de código y pedirle ayuda a la IA.
    console.error("[TrendGear] Error al cargar los datos:", error);
    statusEl.classList.add("error");
    statusText.textContent = "No se pudo conectar a la fuente de datos. Revisa la consola.";
  }
}

// -----------------------------------------------------------
// 2. KPIs
// -----------------------------------------------------------
function renderKPIs(customers) {
  const kpiGrid = document.getElementById("kpiGrid");
  const total = customers.length;
  const revenue = customers.reduce((sum, c) => sum + c["Amount Spent ($)"], 0);
  const avgAmount = total ? revenue / total : 0;
  const avgAge = total ? customers.reduce((s, c) => s + c.Age, 0) / total : 0;

  const kpis = [
    { label: "Clientes", value: total.toLocaleString("es-CO") },
    { label: "Ingresos totales", value: formatCurrency(revenue) },
    { label: "Ticket promedio", value: formatCurrency(avgAmount) },
    { label: "Edad promedio", value: `${avgAge.toFixed(1)} años` },
  ];

  kpiGrid.innerHTML = kpis
    .map(
      (k) => `
    <div class="kpi-card">
      <p class="kpi-label">${k.label}</p>
      <p class="kpi-value">${k.value}</p>
    </div>`
    )
    .join("");
}

// -----------------------------------------------------------
// 3. BARRAS: Membresía y Ciudades
// -----------------------------------------------------------
function renderBars(containerId, entries, total) {
  const container = document.getElementById(containerId);
  container.innerHTML = entries
    .map(([label, count]) => {
      const pct = total ? Math.round((count / total) * 100) : 0;
      return `
      <div class="bar-row">
        <span>${label}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
        <span class="bar-value">${count}</span>
      </div>`;
    })
    .join("");
}

function renderBreakdowns(customers) {
  const total = customers.length;

  const membershipOrder = ["Platinum", "Gold", "Silver", "Bronze"];
  const membershipCounts = membershipOrder.map((tier) => [
    tier,
    customers.filter((c) => c["Membership Status"] === tier).length,
  ]);
  renderBars("membershipBars", membershipCounts, total);

  const cityCounts = {};
  customers.forEach((c) => {
    cityCounts[c.City] = (cityCounts[c.City] || 0) + 1;
  });
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  renderBars("cityBars", topCities, total);
}

// -----------------------------------------------------------
// 4. LÓGICA DE RENDERIZADO — tarjetas de clientes (forEach + template literals)
// -----------------------------------------------------------
function renderCustomerCards(customers) {
  const container = document.getElementById("cardsContainer");
  const emptyState = document.getElementById("emptyState");
  const resultsCount = document.getElementById("resultsCount");

  resultsCount.textContent = `${customers.length} de ${allCustomers.length} clientes`;

  if (customers.length === 0) {
    container.innerHTML = "";
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  let html = "";
  customers.forEach((c) => {
    html += `
      <article class="client-card">
        <div class="client-card-top">
          <div>
            <p class="client-name">${escapeHtml(c.Name)}</p>
            <p class="client-email">${escapeHtml(c.Email)}</p>
          </div>
          <span class="badge badge-${c["Membership Status"]}">${c["Membership Status"]}</span>
        </div>

        <div class="client-detail"><span>Producto</span><strong>${escapeHtml(c["Product Purchased"])}</strong></div>
        <div class="client-detail"><span>Ciudad</span><strong>${escapeHtml(c.City)}</strong></div>
        <div class="client-detail"><span>Pago</span><strong>${escapeHtml(c["Payment Method"])}</strong></div>
        <div class="client-detail"><span>Compra</span><strong>${c["Purchase Date"]}</strong></div>
        <div class="client-detail"><span>Último acceso</span><strong>${c["Last Login Date"]}</strong></div>

        <p class="client-amount">${formatCurrency(c["Amount Spent ($)"])}</p>
      </article>`;
  });

  container.innerHTML = html;
}

// -----------------------------------------------------------
// 5. FILTROS, BÚSQUEDA Y ORDEN (elementos interactivos)
// -----------------------------------------------------------
function getFilteredCustomers() {
  const query = document.getElementById("searchInput").value.trim().toLowerCase();
  const membership = document.getElementById("membershipFilter").value;
  const sortBy = document.getElementById("sortSelect").value;

  let result = allCustomers.filter((c) => {
    const matchesQuery =
      !query ||
      c.Name.toLowerCase().includes(query) ||
      c.Email.toLowerCase().includes(query) ||
      c["Product Purchased"].toLowerCase().includes(query);
    const matchesMembership = !membership || c["Membership Status"] === membership;
    return matchesQuery && matchesMembership;
  });

  const sorters = {
    date_desc: (a, b) => new Date(b["Purchase Date"]) - new Date(a["Purchase Date"]),
    date_asc: (a, b) => new Date(a["Purchase Date"]) - new Date(b["Purchase Date"]),
    amount_desc: (a, b) => b["Amount Spent ($)"] - a["Amount Spent ($)"],
    amount_asc: (a, b) => a["Amount Spent ($)"] - b["Amount Spent ($)"],
  };
  result = result.sort(sorters[sortBy] || sorters.date_desc);

  return result;
}

function renderAll() {
  renderKPIs(allCustomers);
  renderBreakdowns(allCustomers);
  renderCustomerCards(getFilteredCustomers());
}

function applyFilters() {
  renderCustomerCards(getFilteredCustomers());
}

// -----------------------------------------------------------
// 6. UTILIDADES
// -----------------------------------------------------------
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// -----------------------------------------------------------
// 7. NAVEGACIÓN "HAMBURGUESA" RESPONSIVA
// -----------------------------------------------------------
function setupHamburger() {
  const btn = document.getElementById("hamburgerBtn");
  const nav = document.getElementById("mainNav");

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

// -----------------------------------------------------------
// INIT
// -----------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupHamburger();
  fetchCustomers();

  document.getElementById("searchInput").addEventListener("input", applyFilters);
  document.getElementById("membershipFilter").addEventListener("change", applyFilters);
  document.getElementById("sortSelect").addEventListener("change", applyFilters);
});
