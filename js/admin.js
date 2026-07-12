// ToyzGuru Admin Dashboard & Inventory System

// ================= SUPABASE CLIENT INITIALIZATION =================
var supabaseUrl = 'https://lunwguzzguemtotsshjm.supabase.co';
var supabaseKey = 'sb_publishable_E9_XvSijoHdGk83Iv09wNg_DjO1B9EX';

if (window.supabase && typeof window.supabase.createClient === 'function') {
  window.supabaseLib = window.supabase;
}

var supabase = (function () {
  try {
    const lib = window.supabaseLib || window.supabase;
    if (lib && typeof lib.createClient === 'function') {
      return lib.createClient(supabaseUrl, supabaseKey);
    }
    return (window.supabaseClient || null);
  } catch (e) {
    console.warn("Failed to initialize Supabase client, using local mock fallback:", e);
    return null;
  }
})();
window.supabaseClient = supabase;


// State variables for admin
let adminCurrentPanel = "admin-home-panel";
let adminInventorySearchQuery = "";
let adminEditingProductId = null; // null if creating a new product
let adminAuthenticated = localStorage.getItem("toyzguru_admin_auth") === "true";
let adminMembersState = [];

// ── Pagination state (10 rows per page for all admin tables) ──
const ADMIN_PAGE_SIZE = 10;
const adminPaginationState = {
  products: 1, orders: 1, members: 1, feedback: 1,
  shipments: 1, printing: 1, logs: 1, coupons: 1, newsletter: 1
};

/** Injects a pagination bar directly after the <table> that owns tableBody. */
function renderAdminPagination(tableBody, totalItems, section) {
  const currentPage = adminPaginationState[section] || 1;
  const totalPages = Math.ceil(totalItems / ADMIN_PAGE_SIZE);
  const pgnId = `admin-pgn-${section}`;

  // Find or create the pagination container after the table
  let pgn = document.getElementById(pgnId);
  if (!pgn) {
    pgn = document.createElement('div');
    pgn.id = pgnId;
    const table = tableBody.closest('table');
    if (table && table.parentElement) {
      table.parentElement.insertBefore(pgn, table.nextSibling);
    }
  }

  if (totalPages <= 1) {
    const from = totalItems > 0 ? 1 : 0;
    pgn.innerHTML = totalItems > 0
      ? `<div class="admin-pagination"><span class="admin-pgn-info">Showing all <strong>${totalItems}</strong> entries</span></div>`
      : '';
    return;
  }

  const from = (currentPage - 1) * ADMIN_PAGE_SIZE + 1;
  const to = Math.min(currentPage * ADMIN_PAGE_SIZE, totalItems);

  // Build page buttons (max 7 visible with ellipsis)
  const maxBtns = 7;
  let startP = Math.max(1, currentPage - Math.floor(maxBtns / 2));
  let endP = Math.min(totalPages, startP + maxBtns - 1);
  startP = Math.max(1, endP - maxBtns + 1);

  let pageHtml = '';
  if (startP > 1) pageHtml += `<button class="admin-pgn-btn" onclick="adminGoToPage('${section}',1)">1</button><span class="admin-pgn-ellipsis">…</span>`;
  for (let p = startP; p <= endP; p++) {
    pageHtml += `<button class="admin-pgn-btn${p === currentPage ? ' active' : ''}" onclick="adminGoToPage('${section}',${p})">${p}</button>`;
  }
  if (endP < totalPages) pageHtml += `<span class="admin-pgn-ellipsis">…</span><button class="admin-pgn-btn" onclick="adminGoToPage('${section}',${totalPages})">${totalPages}</button>`;

  pgn.innerHTML = `
    <div class="admin-pagination">
      <span class="admin-pgn-info">Showing <strong>${from}–${to}</strong> of <strong>${totalItems}</strong> entries</span>
      <div class="admin-pgn-controls">
        <button class="admin-pgn-btn nav-btn" onclick="adminGoToPage('${section}',${currentPage - 1})" ${currentPage <= 1 ? 'disabled' : ''}>‹ Prev</button>
        ${pageHtml}
        <button class="admin-pgn-btn nav-btn" onclick="adminGoToPage('${section}',${currentPage + 1})" ${currentPage >= totalPages ? 'disabled' : ''}>Next ›</button>
      </div>
    </div>`;
}

/** Single page-change dispatcher for all admin sections. */
window.adminGoToPage = function(section, page) {
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(n, hi));
  // We don't know totalPages yet — each renderer self-clamps on next draw
  adminPaginationState[section] = clamp(page, 1, 9999);
  switch (section) {
    case 'products':    adminRenderInventoryTable(); break;
    case 'orders':      adminRenderOrdersQueue(); break;
    case 'members':     adminRenderMembersRegistry(); break;
    case 'feedback':    adminRenderFeedbackInbox(); break;
    case 'shipments':   adminRenderShipmentsTable(); break;
    case 'printing':    adminRenderPrintingTable(); break;
    case 'logs':        adminRenderLogsTable(); break;
    case 'coupons':     adminRenderCouponsTable(); break;
    case 'newsletter':  _adminRenderNewsletterRows(window._newsletterAllRows || []); break;
  }
};

// Initialize Admin View
function adminInit() {
  setupAdminNavigation();
  setupAdminEventListeners();
  updateAdminAuthView();
}

function updateAdminAuthView() {
  const loginWrapper = document.getElementById("admin-login-wrapper");
  const mainLayout = document.getElementById("admin-main-layout");

  if (adminAuthenticated) {
    if (loginWrapper) loginWrapper.style.display = "none";
    if (mainLayout) mainLayout.style.display = "grid";
    if (window._adminGoToPanel) {
      window._adminGoToPanel("admin-home-panel");
    } else {
      adminRenderDashboard();
    }
  } else {
    if (loginWrapper) {
      loginWrapper.style.display = "block";
      const loginForm = document.getElementById("admin-login-form");
      if (loginForm) {
        loginForm.reset();
      }
      const emailInput = document.getElementById("admin-login-email");
      const passwordInput = document.getElementById("admin-login-password");
      if (emailInput) emailInput.value = "";
      if (passwordInput) passwordInput.value = "";
    }
    if (mainLayout) mainLayout.style.display = "none";
  }
}

// Toast Helper
function adminShowToast(title, desc, type) {
  if (window.showToast) {
    window.showToast(title, desc, type);
  } else {
    console.log(`Toast: ${title} - ${desc} (${type})`);
  }
}

// Navigation between Admin Sub-Panels
function setupAdminNavigation() {
  window._adminGoToPanel = (panelId) => {
    const navBtns = document.querySelectorAll(".admin-nav-btn");
    navBtns.forEach(btn => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-panel") === panelId) {
        btn.classList.add("active");
      }
    });

    const panels = document.querySelectorAll(".admin-panel");
    panels.forEach(p => p.classList.remove("active"));

    // Show active panel
    const targetEl = document.getElementById(panelId);
    if (targetEl) {
      targetEl.classList.add("active");
      adminCurrentPanel = panelId;
    }

    // Re-render data for the panel
    if (adminCurrentPanel === "admin-dashboard-panel") {
      adminRenderDashboard();
    } else if (adminCurrentPanel === "admin-products-panel") {
      adminRenderInventoryTable();
    } else if (adminCurrentPanel === "admin-orders-panel") {
      adminRenderOrdersQueue();
    } else if (adminCurrentPanel === "admin-members-panel") {
      adminRenderMembersRegistry();
    } else if (adminCurrentPanel === "admin-feedback-panel") {
      adminRenderFeedbackInbox();
    } else if (adminCurrentPanel === "admin-delivery-panel") {
      adminRenderDeliveryPanel();
    } else if (adminCurrentPanel === "admin-coupons-panel") {
      adminRenderCouponsPanel();
    } else if (adminCurrentPanel === "admin-tax-panel") {
      adminRenderTaxPanel();
    } else if (adminCurrentPanel === "admin-newsletter-panel") {
      adminRenderNewsletterPanel();
    } else if (adminCurrentPanel === "admin-tickets-panel") {
      adminRenderTicketsPanel();
    }
  };

  const navBtns = document.querySelectorAll(".admin-nav-btn");
  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPanel = btn.getAttribute("data-panel");
      if (targetPanel) {
        window._adminGoToPanel(targetPanel);
      }
    });
  });
}

// ================= ANALYTICS DASHBOARD RENDERING =================
async function adminRenderDashboard() {
  if (!adminAuthenticated) return;
  let orders = [];
  let products = [];
  let profiles = [];

  if (supabase) {
    try {
      // Fetch all orders
      const { data: ords, error: ordersError } = await supabase.from('orders').select('*');
      if (ordersError) throw ordersError;
      orders = ords || [];

      // Fetch all products
      const { data: prods, error: productsError } = await supabase.from('products').select('*');
      if (productsError) throw productsError;
      products = prods || [];

      // Fetch all profiles from local registry
      profiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
    } catch (err) {
      console.warn("Failed to fetch dashboard data from Supabase, falling back to local storage:", err);
      orders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
      products = window.productsState || [];
      profiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
    }
  } else {
    orders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
    products = window.productsState || [];
    profiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
  }

  // Calculate stats
  const totalOrders = orders.length;
  const grossSales = orders.reduce((sum, ord) => sum + Number(ord.total), 0);
  const avgOrderValue = totalOrders > 0 ? (grossSales / totalOrders) : 0;
  const uniqueItemsCount = products.length;

  // Bind to DOM
  const salesEl = document.getElementById("admin-stat-sales");
  if (salesEl) salesEl.textContent = `₹${grossSales.toFixed(2)}`;

  const ordersEl = document.getElementById("admin-stat-orders");
  if (ordersEl) ordersEl.textContent = totalOrders;

  const avgEl = document.getElementById("admin-stat-avg-value");
  if (avgEl) avgEl.textContent = `₹${avgOrderValue.toFixed(2)}`;

  const itemsEl = document.getElementById("admin-stat-items");
  if (itemsEl) itemsEl.textContent = uniqueItemsCount;

  // Render weekly analytics trend chart
  adminRenderWeeklyTrendChart(orders);
}

function adminRenderWeeklyTrendChart(orders) {
  const chartContainer = document.getElementById("admin-weekly-chart");
  if (!chartContainer) return;

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const salesSum = [15000.00, 28000.00, 14000.00, 42000.00, 60000.00, 35000.00, 24500.00]; // baseline seed

  // Map database order totals dynamically onto their day of creation
  orders.forEach(ord => {
    const dayIdx = (new Date(ord.date).getDay() + 6) % 7; // Convert 0-6 (Sun-Sat) to Mon-Sun (0-6)
    salesSum[dayIdx] += Number(ord.total);
  });

  const maxVal = Math.max(...salesSum, 50000);

  chartContainer.innerHTML = daysOfWeek.map((day, idx) => {
    const val = salesSum[idx];
    const percentageHeight = (val / maxVal) * 80; // Scale to fit wrapper

    return `
      <div class="admin-chart-bar-wrap">
        <div style="font-size: 0.75rem; color: var(--color-brand); font-weight: 700; margin-bottom: 0.25rem;">₹${Math.round(val)}</div>
        <div class="admin-chart-bar" style="height: ${percentageHeight}%;" title="${day}: ₹${val.toFixed(2)}"></div>
        <div class="admin-chart-lbl">${day}</div>
      </div>
    `;
  }).join("");
}

// ================= PRODUCT INVENTORY MANAGEMENT (CRUD) =================
async function adminRenderInventoryTable() {
  const tableBody = document.getElementById("admin-products-table-body");
  if (!tableBody) return;

  let products = [];
  if (supabase) {
    try {
      const { data: prods, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      products = prods || [];
    } catch (err) {
      console.warn("Failed to fetch products from Supabase, falling back to local state:", err);
      products = window.productsState || [];
    }
  } else {
    products = window.productsState || [];
  }

  // Filter listings by search box
  const filtered = products.filter(p => {
    return p.title.toLowerCase().includes(adminInventorySearchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(adminInventorySearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(adminInventorySearchQuery.toLowerCase());
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          No matching products found in vault inventory.
        </td>
      </tr>
    `;
    renderAdminPagination(tableBody, 0, 'products');
    return;
  }

  // Clamp page to valid range
  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  adminPaginationState.products = Math.max(1, Math.min(adminPaginationState.products, totalPages));
  const pg = adminPaginationState.products;
  const pageData = filtered.slice((pg - 1) * ADMIN_PAGE_SIZE, pg * ADMIN_PAGE_SIZE);

  tableBody.innerHTML = pageData.map(prod => {
    const priceOriginal = prod.original_price ? `<span style="text-decoration:line-through; font-size:0.75rem; color:var(--text-muted);">₹${Number(prod.original_price).toFixed(2)}</span> ` : "";

    return `
      <tr id="admin-inventory-row-${prod.id}">
        <td style="font-family: monospace; font-size:0.8rem; color:var(--color-brand);">${prod.id}</td>
        <td>
          <img src="${prod.image}" alt="${prod.title}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px; border: 1px solid var(--glass-border);">
        </td>
        <td style="font-weight: 600; font-size:0.85rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${prod.title}</td>
        <td style="text-transform: uppercase; font-size: 0.75rem; font-weight: 700;">${prod.category.replace("-", " ")}</td>
        <td style="font-weight: 700;">
          ${priceOriginal}₹${Number(prod.price).toFixed(2)}
        </td>
        <td>
          <span style="font-weight:700; color: ${prod.stock <= 5 ? "var(--color-danger)" : "inherit"}">${prod.stock} units</span>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap: 0.15rem; color:var(--color-watches);">
            <i data-feather="star" style="width:12px; height:12px; fill:var(--color-watches);"></i>
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-secondary);">${Number(prod.rating).toFixed(1)}</span>
          </div>
        </td>
        <td>
          <div class="crud-btn-wrap">
            <button class="crud-btn crud-edit" onclick="adminEditProductTrigger('${prod.id}')" title="Edit Product Specs">
              <i data-feather="edit" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="crud-btn crud-delete" onclick="adminDeleteProductTrigger('${prod.id}')" title="Delete Product Cover">
              <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderAdminPagination(tableBody, filtered.length, 'products');
  feather.replace();
}

async function adminDeleteProductTrigger(productId) {
  const isConfirmed = await window.showCustomDialog("Delete Product", `Are you sure you want to delete product "${productId}"? This will immediately remove it from public catalog.`, "danger", true);
  
  if (isConfirmed) {
    if (supabase) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;

        // refresh table
        await adminRenderInventoryTable();

        // update global app state products
        if (window.initDatabase) await window.initDatabase();

        if (window.toyzToast) {
          window.toyzToast("Product Deleted", `Removed item ID: ${productId} from store lists.`, "danger");
        }
      } catch (err) {
        await window.showCustomDialog("Deletion Failed", err.message || "Failed to delete product.", "danger");
      }
    } else {
      // Local fallback / offline mode
      let products = window.productsState || [];
      const filteredProds = products.filter(p => p.id !== productId);
      window.productsState = filteredProds;
      localStorage.setItem("toyzguru_products", JSON.stringify(filteredProds));

      // refresh table
      await adminRenderInventoryTable();

      // update global app state products
      if (window.initDatabase) await window.initDatabase();

      if (window.toyzToast) {
        window.toyzToast("Product Deleted (Demo)", `Removed item ID: ${productId} locally.`, "danger");
      }
    }
  }
}

function adminPopulateProductTaxCategoryDropdown(selectedValue) {
  const selectEl = document.getElementById("admin-form-tax-category");
  if (!selectEl) return;
  
  const activeRates = taxRatesState.filter(r => r.is_active);
  selectEl.innerHTML = activeRates.map(r => `<option value="${r.id}">${r.name} (${r.total_tax_pct}%)</option>`).join("");
  
  if (selectedValue) {
    // Editing existing product — use its stored value
    selectEl.value = selectedValue;
  } else {
    // New product — default to GST 5%
    // Try to find by total_tax_pct=5 (works for both local fallback IDs and real Supabase UUIDs)
    const rate5 = activeRates.find(r => parseFloat(r.total_tax_pct) === 5);
    if (rate5) {
      selectEl.value = rate5.id;
    } else if (window.storeSettings && window.storeSettings.default_tax_category_id) {
      selectEl.value = window.storeSettings.default_tax_category_id;
    } else if (activeRates.length > 0) {
      selectEl.selectedIndex = 0;
    }
  }
}

function adminPopulateCategoryDropdown(selectedValue) {
  const catSelect = document.getElementById("admin-form-category");
  if (!catSelect) return;

  // Preserve core defaults
  const categoriesMap = new Map([
    ["anime", "Anime Figures"],
    ["toy-cars", "Premium Toy Cars"],
    ["watches", "Imported Watches"]
  ]);

  // Load all unique categories from productsState
  const products = window.productsState || [];
  products.forEach(p => {
    if (p.category) {
      const slug = p.category.trim();
      if (slug && !categoriesMap.has(slug)) {
        // Capitalize slug for display label
        const label = slug.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        categoriesMap.set(slug, label);
      }
    }
  });

  // Load custom categories from localStorage
  try {
    const savedCats = JSON.parse(localStorage.getItem("toyzguru_custom_categories") || "[]");
    savedCats.forEach(cat => {
      if (cat.value && !categoriesMap.has(cat.value)) {
        categoriesMap.set(cat.value, cat.label);
      }
    });
  } catch(ex) { /* ignore */ }

  // Re-build select options
  catSelect.innerHTML = "";
  categoriesMap.forEach((label, value) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    catSelect.appendChild(opt);
  });

  // Add selectedValue if it doesn't exist
  if (selectedValue && !categoriesMap.has(selectedValue)) {
    const label = selectedValue.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    const opt = document.createElement("option");
    opt.value = selectedValue;
    opt.textContent = label;
    catSelect.appendChild(opt);
  }

  // Set selected value if provided
  if (selectedValue) {
    catSelect.value = selectedValue;
  }

  // Update visibility of the delete category button
  adminUpdateDeleteCategoryButtonVisibility();
}

function adminUpdateDeleteCategoryButtonVisibility() {
  const catSelect = document.getElementById("admin-form-category");
  const deleteBtn = document.getElementById("admin-delete-category-btn");
  if (!catSelect || !deleteBtn) return;

  const selectedCat = catSelect.value;
  const defaults = ["anime", "toy-cars", "watches"];
  const isNewCatVisible = document.getElementById("admin-new-category-wrap")?.style.display === "block";

  if (!defaults.includes(selectedCat) && !isNewCatVisible) {
    deleteBtn.style.display = "inline-block";
  } else {
    deleteBtn.style.display = "none";
  }
}

async function adminDeleteCategoryTrigger() {
  const catSelect = document.getElementById("admin-form-category");
  if (!catSelect) return;

  const selectedCat = catSelect.value;
  const defaults = ["anime", "toy-cars", "watches"];
  if (defaults.includes(selectedCat)) {
    if (window.toyzToast) {
      window.toyzToast("Action Denied", "Default store categories cannot be deleted.", "warning");
    }
    return;
  }

  // Check if any products are using it
  const products = window.productsState || [];
  const activeProducts = products.filter(p => p.category === selectedCat);
  if (activeProducts.length > 0) {
    if (window.showCustomDialog) {
      await window.showCustomDialog(
        "Cannot Delete Category",
        `This category is currently assigned to ${activeProducts.length} active products in your inventory. Please change the category of these products before deleting this category.`,
        "warning"
      );
    } else {
      alert(`Cannot Delete Category: This category is currently assigned to ${activeProducts.length} active products.`);
    }
    return;
  }

  const catText = catSelect.options[catSelect.selectedIndex].text;
  let isConfirmed = false;
  if (window.showCustomDialog) {
    isConfirmed = await window.showCustomDialog(
      "Delete Category",
      `Are you sure you want to delete the category "${catText}"?`,
      "danger",
      true
    );
  } else {
    isConfirmed = confirm(`Are you sure you want to delete the category "${catText}"?`);
  }

  if (isConfirmed) {
    try {
      let savedCats = JSON.parse(localStorage.getItem("toyzguru_custom_categories") || "[]");
      savedCats = savedCats.filter(c => c.value !== selectedCat);
      localStorage.setItem("toyzguru_custom_categories", JSON.stringify(savedCats));

      if (window.toyzToast) {
        window.toyzToast("Category Deleted", `Successfully removed category: ${catText}`, "success");
      }

      // Re-populate dropdown and reset selection to anime
      adminPopulateCategoryDropdown("anime");
    } catch (err) {
      console.error(err);
    }
  }
}

// Open modal for editing product details
function adminEditProductTrigger(productId) {
  const products = window.productsState || [];
  const product = products.find(p => p.id === productId);
  if (!product) return;

  adminEditingProductId = productId;
  document.getElementById("admin-modal-title").textContent = `Edit Product Specs: ${productId}`;

  // Populate form fields
  document.getElementById("admin-form-product-id").value = product.id;
  document.getElementById("admin-form-title").value = product.title;
  document.getElementById("admin-form-category").value = product.category;
  document.getElementById("admin-form-badge").value = product.badge || "";
  document.getElementById("admin-form-price").value = product.price;

  const origPrice = product.original_price !== undefined ? product.original_price : product.originalPrice;
  document.getElementById("admin-form-original-price").value = origPrice || "";
  
  const normalBoxPrice = product.normal_box_price !== undefined ? product.normal_box_price : 0;
  document.getElementById("admin-form-normal-box-price").value = normalBoxPrice || "";
  const originalBoxPrice = product.original_box_price !== undefined ? product.original_box_price : 0;
  document.getElementById("admin-form-original-box-price").value = originalBoxPrice || "";

  document.getElementById("admin-form-stock").value = product.stock;
  document.getElementById("admin-form-image").value = product.image;
  document.getElementById("admin-form-desc").value = product.description;

  // Populate dynamic product GST tax categories
  adminPopulateProductTaxCategoryDropdown(product.gst_category_id);
  document.getElementById("admin-form-tax-applicable").value = product.tax_applicable === false ? "no" : "yes";
  document.getElementById("admin-form-hsn-code").value = product.hsn_code || "";
  document.getElementById("admin-form-sac-code").value = product.sac_code || "";

  // Show image preview
  const previewContainer = document.getElementById("admin-form-image-preview-container");
  const previewImg = document.getElementById("admin-form-image-preview");
  const previewName = document.getElementById("admin-form-image-name");
  if (previewContainer && previewImg && previewName) {
    previewImg.src = product.image;
    const isRemote = product.image.startsWith("http");
    const fileName = isRemote ? product.image.split("/").pop() : "custom_upload.jpg";
    previewName.textContent = fileName;
    previewContainer.style.display = "flex";
  }

  // Populate first two specs keys
  const specs = Object.entries(product.specs || {});
  document.getElementById("admin-form-spec-k1").value = specs[0] ? specs[0][0] : "";
  document.getElementById("admin-form-spec-v1").value = specs[0] ? specs[0][1] : "";
  document.getElementById("admin-form-spec-k2").value = specs[1] ? specs[1][0] : "";
  document.getElementById("admin-form-spec-v2").value = specs[1] ? specs[1][1] : "";

  // Populate Rating, Reviews Count, Options and Raw Specs JSON
  document.getElementById("admin-form-rating").value = product.rating !== undefined ? product.rating : 5.0;
  const revsCount = product.reviews_count !== undefined ? product.reviews_count : (product.reviewsCount !== undefined ? product.reviewsCount : 1);
  document.getElementById("admin-form-reviews-count").value = revsCount;

  const opts = Array.isArray(product.options) ? product.options : [product.options || "Standard Edition"];
  document.getElementById("admin-form-options").value = opts.join(", ");
  document.getElementById("admin-form-specs-json").value = product.specs ? JSON.stringify(product.specs, null, 2) : "{}";

  // Reset image URL fallback and new category toggle
  const imageUrlInput = document.getElementById("admin-form-image-url");
  if (imageUrlInput) imageUrlInput.value = "";
  const newCatWrap = document.getElementById("admin-new-category-wrap");
  const newCatToggle = document.getElementById("admin-new-category-toggle");
  const newCatInput = document.getElementById("admin-new-category-input");
  const catSelect = document.getElementById("admin-form-category");
  if (newCatWrap) newCatWrap.style.display = "none";
  if (newCatToggle) {
    newCatToggle.textContent = "+ New";
    newCatToggle.style.background = "rgba(139,92,246,0.15)";
    newCatToggle.style.color = "var(--color-brand)";
  }
  if (newCatInput) newCatInput.value = "";
  if (catSelect) {
    catSelect.disabled = false;
    catSelect.style.opacity = "1";
    adminPopulateCategoryDropdown(product.category);
  }

  // Open modal overlay
  document.getElementById("admin-product-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

// Open modal for creating new product details
async function adminCreateProductTrigger() {
  adminEditingProductId = null;
  document.getElementById("admin-modal-title").textContent = "Create New Inventory Item";

  // Clear forms inputs
  document.getElementById("admin-product-form").reset();
  document.getElementById("admin-form-product-id").value = "";
  document.getElementById("admin-form-image").value = "";
  document.getElementById("admin-form-options").value = "";
  document.getElementById("admin-form-specs-json").value = "";

  // Fetch fresh tax rates from Supabase to ensure dropdown has real UUIDs
  try { await adminFetchTaxRates(); } catch(ex) { /* fallback to current state */ }

  // Set default product GST tax configurations
  adminPopulateProductTaxCategoryDropdown("");
  document.getElementById("admin-form-tax-applicable").value = "yes";

  const hsnCodeEl = document.getElementById("admin-form-hsn-code");
  const sacCodeEl = document.getElementById("admin-form-sac-code");
  if (hsnCodeEl) hsnCodeEl.value = "";
  if (sacCodeEl) sacCodeEl.value = "";

  // Reset image URL fallback field
  const imageUrlInput = document.getElementById("admin-form-image-url");
  if (imageUrlInput) imageUrlInput.value = "";

  // Reset new category toggle back to select mode
  const newCatWrap = document.getElementById("admin-new-category-wrap");
  const newCatToggle = document.getElementById("admin-new-category-toggle");
  const newCatInput = document.getElementById("admin-new-category-input");
  const catSelect = document.getElementById("admin-form-category");
  if (newCatWrap) newCatWrap.style.display = "none";
  if (newCatToggle) {
    newCatToggle.textContent = "+ New";
    newCatToggle.style.background = "rgba(139,92,246,0.15)";
    newCatToggle.style.color = "var(--color-brand)";
  }
  if (newCatInput) newCatInput.value = "";
  if (catSelect) {
    catSelect.disabled = false;
    catSelect.style.opacity = "1";
    adminPopulateCategoryDropdown("");
  }

  // Reset file upload and preview
  const fileInput = document.getElementById("admin-form-image-file");
  if (fileInput) fileInput.value = "";
  const previewContainer = document.getElementById("admin-form-image-preview-container");
  if (previewContainer) previewContainer.style.display = "none";

  // Open modal overlay
  document.getElementById("admin-product-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

async function handleAdminProductFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("admin-form-title").value.trim();

  // Support "Add New Category" toggle - if new category input is visible and has value, use it
  const newCatWrap = document.getElementById("admin-new-category-wrap");
  const newCatInput = document.getElementById("admin-new-category-input");
  const isAddingNewCat = newCatWrap && newCatWrap.style.display === "block";
  let category = document.getElementById("admin-form-category").value;
  if (isAddingNewCat && newCatInput) {
    const newCatVal = newCatInput.value.trim();
    if (!newCatVal) {
      if (window.toyzToast) {
        window.toyzToast("Category Required", "Please enter a new category name or select an existing one.", "warning");
      }
      return;
    }
    // Convert to slug: lowercase, spaces to hyphens
    category = newCatVal.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    if (!category) {
      if (window.toyzToast) {
        window.toyzToast("Invalid Category", "Category name must contain alphanumeric characters.", "warning");
      }
      return;
    }
    // Add to the category dropdown for future use
    const catSelect = document.getElementById("admin-form-category");
    if (catSelect) {
      const exists = Array.from(catSelect.options).some(o => o.value === category);
      if (!exists) {
        const newOpt = document.createElement("option");
        newOpt.value = category;
        newOpt.textContent = newCatVal;
        catSelect.appendChild(newOpt);
      }
    }
    // Save categories to localStorage for persistence
    try {
      const savedCats = JSON.parse(localStorage.getItem("toyzguru_custom_categories") || "[]");
      if (!savedCats.find(c => c.value === category)) {
        savedCats.push({ value: category, label: newCatVal });
        localStorage.setItem("toyzguru_custom_categories", JSON.stringify(savedCats));
      }
    } catch(ex) { /* ignore */ }
  }

  const badge = document.getElementById("admin-form-badge").value;
  const price = parseFloat(document.getElementById("admin-form-price").value);
  const origPriceVal = document.getElementById("admin-form-original-price").value;
  const originalPrice = origPriceVal ? parseFloat(origPriceVal) : null;

  const normalBoxPriceVal = document.getElementById("admin-form-normal-box-price").value;
  const normalBoxPrice = normalBoxPriceVal ? parseFloat(normalBoxPriceVal) : 0.00;
  const originalBoxPriceVal = document.getElementById("admin-form-original-box-price").value;
  const originalBoxPrice = originalBoxPriceVal ? parseFloat(originalBoxPriceVal) : 0.00;

  const stock = parseInt(document.getElementById("admin-form-stock").value);
  const desc = document.getElementById("admin-form-desc").value.trim();

  // Image: first check hidden field (from upload), then fallback to URL input
  let image = document.getElementById("admin-form-image").value;
  const imageUrlInput = document.getElementById("admin-form-image-url");
  if (!image && imageUrlInput && imageUrlInput.value.trim()) {
    image = imageUrlInput.value.trim();
    document.getElementById("admin-form-image").value = image;
  }

  // Validate image exists
  if (!image) {
    if (window.toyzToast) {
      window.toyzToast("Image Required", "Please upload an image or paste an Image URL below the upload field.", "warning");
    }
    return;
  }

  const rating = parseFloat(document.getElementById("admin-form-rating").value || "5.0");
  const reviews_count = parseInt(document.getElementById("admin-form-reviews-count").value || "1");
  const optionsVal = document.getElementById("admin-form-options").value.trim();
  const options = optionsVal ? optionsVal.split(",").map(o => o.trim()).filter(Boolean) : ["Standard Edition"];

  // Specs keys / JSON parsing
  let specs = {};
  const rawSpecsJson = document.getElementById("admin-form-specs-json").value.trim();
  if (rawSpecsJson && rawSpecsJson !== "{}") {
    try {
      specs = JSON.parse(rawSpecsJson);
    } catch (err) {
      if (window.toyzToast) {
        window.toyzToast("Invalid JSON", "Product Specifications is not a valid JSON structure.", "warning");
      }
      return;
    }
  } else {
    const k1 = document.getElementById("admin-form-spec-k1").value.trim();
    const v1 = document.getElementById("admin-form-spec-v1").value.trim();
    const k2 = document.getElementById("admin-form-spec-k2").value.trim();
    const v2 = document.getElementById("admin-form-spec-v2").value.trim();
    if (k1 && v1) specs[k1] = v1;
    if (k2 && v2) specs[k2] = v2;
  }

  const tax_applicable = document.getElementById("admin-form-tax-applicable").value === "yes";
  const rawGstCatId = document.getElementById("admin-form-tax-category").value || null;
  // Only send gst_category_id if it looks like a real UUID (Supabase column is uuid type)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const gst_category_id = (rawGstCatId && uuidRegex.test(rawGstCatId)) ? rawGstCatId : null;
  const hsn_code = document.getElementById("admin-form-hsn-code").value.trim() || null;
  const sac_code = document.getElementById("admin-form-sac-code").value.trim() || null;

  // Helper to attempt Supabase operation, retrying without new/optional columns on schema errors
  async function supabaseUpsertWithRetry(operation, payloadFull, payloadNoBox, payloadStripped) {
    let result = await operation(payloadFull);
    if (result.error) {
      const errMsg = result.error.message || "";
      const isSchemaErr = errMsg.includes("column") || errMsg.includes("schema") ||
                          errMsg.includes("invalid input") || errMsg.includes("uuid") ||
                          errMsg.includes("does not exist");
      if (isSchemaErr) {
        console.warn("Retrying without box price fields due to schema error:", result.error);
        result = await operation(payloadNoBox);
        if (result.error) {
          console.warn("Retrying without GST or box price fields due to schema error:", result.error);
          result = await operation(payloadStripped);
        }
      }
    }
    return result;
  }

  try {
    if (supabase) {
      if (adminEditingProductId) {
        // Edit existing product details in Supabase
        const updateDataFull = {
          title, category, badge, price,
          original_price: originalPrice, stock, image, description: desc,
          rating, reviews_count, options, specs,
          tax_applicable, gst_category_id, hsn_code, sac_code,
          normal_box_price: normalBoxPrice,
          original_box_price: originalBoxPrice
        };
        const updateDataNoBox = {
          title, category, badge, price,
          original_price: originalPrice, stock, image, description: desc,
          rating, reviews_count, options, specs,
          tax_applicable, gst_category_id, hsn_code, sac_code
        };
        const updateDataStripped = {
          title, category, badge, price,
          original_price: originalPrice, stock, image, description: desc,
          rating, reviews_count, options, specs
        };

        const { error } = await supabaseUpsertWithRetry(
          (payload) => supabase.from('products').update(payload).eq('id', adminEditingProductId),
          updateDataFull,
          updateDataNoBox,
          updateDataStripped
        );
        if (error) throw error;

        // Show success dialog for product update
        adminShowProductSuccessDialog(false, title, adminEditingProductId);
      } else {
        // Generate new unique ID
        const randomId = Math.floor(100 + Math.random() * 900);
        const newId = `${category.substring(0, 5)}-${randomId}`;

        const newProdFull = {
          id: newId, title, category, price,
          original_price: originalPrice, image, rating, reviews_count,
          badge, description: desc, options, specs, stock,
          tax_applicable, gst_category_id, hsn_code, sac_code,
          normal_box_price: normalBoxPrice,
          original_box_price: originalBoxPrice
        };
        const newProdNoBox = {
          id: newId, title, category, price,
          original_price: originalPrice, image, rating, reviews_count,
          badge, description: desc, options, specs, stock,
          tax_applicable, gst_category_id, hsn_code, sac_code
        };
        const newProdStripped = {
          id: newId, title, category, price,
          original_price: originalPrice, image, rating, reviews_count,
          badge, description: desc, options, specs, stock
        };

        const { error } = await supabaseUpsertWithRetry(
          (payload) => supabase.from('products').insert(payload),
          newProdFull,
          newProdNoBox,
          newProdStripped
        );
        if (error) throw error;

        // Show success dialog for new product
        adminShowProductSuccessDialog(true, title, newId);
      }
    } else {
      // Local fallback / offline mode
      let products = window.productsState || [];
      if (adminEditingProductId) {
        // Edit locally
        const match = products.find(p => p.id === adminEditingProductId);
        if (match) {
          match.title = title;
          match.category = category;
          match.badge = badge;
          match.price = price;
          match.original_price = originalPrice;
          match.originalPrice = originalPrice;
          match.normal_box_price = normalBoxPrice;
          match.original_box_price = originalBoxPrice;
          match.stock = stock;
          match.image = image;
          match.description = desc;
          match.rating = rating;
          match.reviews_count = reviews_count;
          match.reviewsCount = reviews_count;
          match.options = options;
          match.specs = specs;
          match.tax_applicable = tax_applicable;
          match.gst_category_id = gst_category_id;
          match.hsn_code = hsn_code;
          match.sac_code = sac_code;
        }
        localStorage.setItem("toyzguru_products", JSON.stringify(products));
        adminShowProductSuccessDialog(false, title, adminEditingProductId);
      } else {
        // Create locally
        const randomId = Math.floor(100 + Math.random() * 900);
        const newId = `${category.substring(0, 5)}-${randomId}`;

        const newProd = {
          id: newId,
          title: title,
          category: category,
          price: price,
          original_price: originalPrice,
          originalPrice: originalPrice,
          normal_box_price: normalBoxPrice,
          original_box_price: originalBoxPrice,
          image: image,
          rating: rating,
          reviews_count: reviews_count,
          reviewsCount: reviews_count,
          badge: badge,
          description: desc,
          options: options,
          specs: specs,
          stock: stock,
          tax_applicable: tax_applicable,
          gst_category_id: gst_category_id,
          hsn_code: hsn_code,
          sac_code: sac_code
        };

        products.push(newProd);
        window.productsState = products;
        localStorage.setItem("toyzguru_products", JSON.stringify(products));
        adminShowProductSuccessDialog(true, title, newId);
      }
    }

    // Sync app state
    if (window.initDatabase) {
      await window.initDatabase();
    }

    adminCloseProductModal();
    adminRenderInventoryTable();

  } catch (err) {
    if (window.toyzToast) {
      window.toyzToast("Save Failed", err.message || "Failed to save product details.", "danger");
    }
    console.error(err);
  }
}

function adminCloseProductModal() {
  document.getElementById("admin-product-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

function adminShowProductSuccessDialog(isNew, productTitle, productId) {
  // Remove any existing success dialog
  const existing = document.getElementById("admin-product-success-dialog");
  if (existing) existing.remove();

  const heading = isNew ? "Product Successfully Added!" : "Product Updated!";
  const subtext = isNew
    ? `<strong>${productTitle}</strong> has been added to your catalog and is now live.`
    : `<strong>${productTitle}</strong> has been updated successfully.`;
  const idLabel = isNew ? "Product ID" : "Updated ID";

  const overlay = document.createElement("div");
  overlay.id = "admin-product-success-dialog";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    display: flex; align-items: center; justify-content: center;
    background: rgba(8, 11, 17, 0.82);
    backdrop-filter: blur(8px);
    animation: fadeIn 0.25s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: linear-gradient(135deg, #0f1724 0%, #1a2540 100%);
      border: 1px solid rgba(139,92,246,0.4);
      border-radius: 20px;
      padding: 2.8rem 3rem;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 0 60px rgba(139,92,246,0.25), 0 30px 60px rgba(0,0,0,0.6);
      animation: scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
    ">
      <!-- Glow ring -->
      <div style="
        width: 80px; height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, rgba(139,92,246,0.2), rgba(59,230,193,0.15));
        border: 2px solid rgba(139,92,246,0.5);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1.5rem;
        box-shadow: 0 0 30px rgba(139,92,246,0.4);
        animation: pulseRing 1.5s ease infinite;
      ">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <h2 style="
        color: #fff; font-size: 1.45rem; font-weight: 700;
        margin: 0 0 0.6rem; letter-spacing: -0.02em;
      ">${heading}</h2>

      <p style="color: rgba(255,255,255,0.65); font-size: 0.92rem; margin: 0 0 1.4rem; line-height: 1.6;">
        ${subtext}
      </p>

      <div style="
        background: rgba(139,92,246,0.1);
        border: 1px solid rgba(139,92,246,0.2);
        border-radius: 10px;
        padding: 0.7rem 1rem;
        margin-bottom: 1.8rem;
        display: flex; align-items: center; justify-content: space-between;
      ">
        <span style="color: rgba(255,255,255,0.45); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em;">${idLabel}</span>
        <span style="color: #a78bfa; font-family: monospace; font-size: 0.85rem; font-weight: 600;">${productId}</span>
      </div>

      <!-- Progress bar auto-dismiss -->
      <div style="background: rgba(255,255,255,0.08); border-radius: 4px; height: 4px; margin-bottom: 1.4rem; overflow: hidden;">
        <div id="admin-success-progress" style="
          height: 100%; width: 100%;
          background: linear-gradient(90deg, #8b5cf6, #3be6c1);
          border-radius: 4px;
          transition: width 3s linear;
        "></div>
      </div>

      <button id="admin-success-ok-btn" style="
        background: linear-gradient(135deg, #8b5cf6, #6d28d9);
        color: #fff; border: none; border-radius: 10px;
        padding: 0.75rem 2.5rem; font-size: 0.95rem; font-weight: 600;
        cursor: pointer; width: 100%;
        box-shadow: 0 4px 20px rgba(139,92,246,0.4);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 28px rgba(139,92,246,0.55)';"
         onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 20px rgba(139,92,246,0.4)';">
        Got it! 🎉
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Inject keyframes if not already present
  if (!document.getElementById("admin-success-keyframes")) {
    const style = document.createElement("style");
    style.id = "admin-success-keyframes";
    style.textContent = `
      @keyframes scaleIn {
        from { transform: scale(0.8); opacity: 0; }
        to   { transform: scale(1);   opacity: 1; }
      }
      @keyframes pulseRing {
        0%, 100% { box-shadow: 0 0 30px rgba(139,92,246,0.4); }
        50%       { box-shadow: 0 0 50px rgba(139,92,246,0.7); }
      }
    `;
    document.head.appendChild(style);
  }

  // Start shrinking progress bar (3s auto-dismiss)
  const dismissDialog = () => {
    overlay.style.animation = "fadeIn 0.2s ease reverse forwards";
    setTimeout(() => overlay.remove(), 200);
  };

  // Trigger progress bar shrink on next frame
  requestAnimationFrame(() => {
    const bar = document.getElementById("admin-success-progress");
    if (bar) bar.style.width = "0%";
  });

  const autoTimer = setTimeout(dismissDialog, 3000);

  // OK button dismisses immediately
  document.getElementById("admin-success-ok-btn").addEventListener("click", () => {
    clearTimeout(autoTimer);
    dismissDialog();
  });

  // Click outside to dismiss
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      clearTimeout(autoTimer);
      dismissDialog();
    }
  });
}

// ================= ORDER FULFILLMENT QUEUE MANAGEMENT =================
async function adminRenderOrdersQueue() {
  const tableBody = document.getElementById("admin-orders-table-body");
  if (!tableBody) return;

  // ── Fetch from Supabase then merge with any localStorage-only orders ──
  let remoteOrders = [];
  let hadSupabaseSuccess = false;
  if (supabase) {
    try {
      const { data: ords, error } = await supabase.from('orders').select('*').order('date', { ascending: false });
      if (error) throw error;
      remoteOrders = ords || [];
      hadSupabaseSuccess = true;
    } catch (err) {
      console.warn("Failed to fetch orders from Supabase:", err);
    }
  }

  // Always pull localStorage orders and merge (de-dup by ID) so test/offline orders always appear
  const localOrders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
  const remoteIds = new Set(remoteOrders.map(o => o.id));
  const localOnlyOrders = localOrders.filter(o => !remoteIds.has(o.id));
  const orders = [...remoteOrders, ...localOnlyOrders].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  window.ordersState = orders;

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          No customer purchase orders found in registry queues.
        </td>
      </tr>
    `;
    renderAdminPagination(tableBody, 0, 'orders');
    return;
  }

  // Clamp & slice for current page
  const totalPages = Math.max(1, Math.ceil(orders.length / ADMIN_PAGE_SIZE));
  adminPaginationState.orders = Math.max(1, Math.min(adminPaginationState.orders, totalPages));
  const pg = adminPaginationState.orders;
  const pageData = orders.slice((pg - 1) * ADMIN_PAGE_SIZE, pg * ADMIN_PAGE_SIZE);

  tableBody.innerHTML = pageData.map(ord => {
    // ── Safe date formatting ──
    const rawDate = ord.date ? new Date(ord.date) : null;
    const orderDate = rawDate && !isNaN(rawDate)
      ? rawDate.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "—";

    // ── Safe items parsing: handle JSONB array, JSON string, or empty ──
    let itemsList = [];
    if (Array.isArray(ord.items)) {
      itemsList = ord.items;
    } else if (typeof ord.items === 'string') {
      try { itemsList = JSON.parse(ord.items); } catch(e) { itemsList = []; }
    } else if (ord.items && typeof ord.items === 'object') {
      itemsList = [ord.items];
    }
    const itemsSummary = itemsList.length > 0
      ? itemsList.map(i => {
          const title = i.title || i.productName || i.name || 'Item';
          const option = (i.option || i.variant || '');
          const qty = i.quantity || 1;
          return `${title}${option ? ` <span style="color:var(--text-muted);">(${option})</span>` : ''} <strong>x${qty}</strong>`;
        }).join("<br>")
      : '<span style="color:var(--text-muted);font-style:italic;">—</span>';

    // ── Safe total & email ──
    const totalAmt = isNaN(Number(ord.total)) ? 0 : Number(ord.total);
    const emailDisplay = ord.email || '<span style="color:var(--text-muted);">—</span>';
    const statusVal = ord.status || 'pending';

    // Build select dropdown selector for status
    const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const dropdownOptions = statusOptions.map(opt => {
      const selected = statusVal === opt ? "selected" : "";
      return `<option value="${opt}" ${selected}>${opt.toUpperCase()}</option>`;
    }).join("");

    return `
      <tr id="admin-order-row-${ord.id}">
        <td style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; color: var(--color-brand); cursor: pointer; text-decoration: underline;" onclick="adminShowOrderDetailsTrigger('${ord.id}')">${ord.id}</td>
        <td>
          <a href="javascript:void(0)" class="product-card-add-btn receipt-btn-${ord.id}" onclick="if(typeof window.downloadOrderReceipt==='function'){window.downloadOrderReceipt('${ord.id}')}else{alert('Receipt generator not ready, please reload.')}" style="padding:0.3rem 0.6rem;font-size:0.72rem;text-decoration:none;white-space:nowrap;display:inline-flex;align-items:center;gap:0.25rem;">⬇ Receipt</a>
        </td>
        <td style="font-size:0.8rem; font-family: monospace;">${emailDisplay}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${orderDate}</td>
        <td style="font-size: 0.8rem; line-height: 1.6; max-width: 250px;">${itemsSummary}</td>
        <td style="font-weight: 700; color: var(--text-primary);">₹${totalAmt.toFixed(2)}</td>
        <td>
          <span class="order-status-badge status-${statusVal}">${statusVal}</span>
        </td>
        <td style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
          <select class="form-select" style="padding: 0.35rem; font-size: 0.8rem; background: var(--bg-tertiary);" onchange="adminUpdateOrderStatus('${ord.id}', this.value)">
            ${dropdownOptions}
          </select>
          <button class="product-card-add-btn" style="padding:0.3rem 0.6rem;font-size:0.72rem;background:var(--color-brand-gradient);margin-left:0.25rem;cursor:pointer;border:none;color:#fff;border-radius:4px;" onclick="adminOpenFulfillmentModal('${ord.id}')">Fulfill</button>
        </td>
      </tr>
    `;
  }).join("");

  renderAdminPagination(tableBody, orders.length, 'orders');
  feather.replace();
}

async function adminUpdateOrderStatus(orderId, newStatus) {
  if (supabase) {
    try {
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;

      // Sync app.js state
      if (window.ordersState) {
        const match = window.ordersState.find(o => o.id === orderId);
        if (match) match.status = newStatus;
      }

      // Refresh display status text badges without full re-render
      const row = document.getElementById(`admin-order-row-${orderId}`);
      if (row) {
        const badge = row.querySelector(".order-status-badge");
        if (badge) {
          badge.className = `order-status-badge status-${newStatus}`;
          badge.textContent = newStatus;
        }
      }

      if (window.toyzToast) {
        window.toyzToast("Fulfillment Updated", `Order ${orderId} shifted to status: ${newStatus.toUpperCase()}`, "info");
      }
    } catch (err) {
      if (window.toyzToast) {
        window.toyzToast("Fulfillment Update Failed", err.message || "Failed to update order status.", "danger");
      }
    }
  } else {
    // Local fallback
    let localOrders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
    const match = localOrders.find(o => o.id === orderId);
    if (match) {
      match.status = newStatus;
      localStorage.setItem("toyzguru_orders", JSON.stringify(localOrders));
    }

    // Sync app.js state
    if (window.ordersState) {
      const matchState = window.ordersState.find(o => o.id === orderId);
      if (matchState) matchState.status = newStatus;
    }

    // Refresh display status text badges without full re-render
    const row = document.getElementById(`admin-order-row-${orderId}`);
    if (row) {
      const badge = row.querySelector(".order-status-badge");
      if (badge) {
        badge.className = `order-status-badge status-${newStatus}`;
        badge.textContent = newStatus;
      }
    }

    if (window.toyzToast) {
      window.toyzToast("Fulfillment Updated (Demo)", `Order ${orderId} shifted to status: ${newStatus.toUpperCase()} locally`, "info");
    }
  }
}

async function adminShowOrderDetailsTrigger(orderId) {
  let orders = [];
  if (supabase) {
    try {
      const { data: ords } = await supabase.from('orders').select('*');
      orders = ords || [];
    } catch (err) {
      orders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
    }
  } else {
    orders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
  }

  const order = orders.find(o => o.id === orderId);
  if (!order) return;

  const modalTitle = document.getElementById("admin-order-modal-title");
  if (modalTitle) modalTitle.textContent = `Order Details: ${order.id}`;

  const contentContainer = document.getElementById("admin-order-modal-content");
  if (contentContainer) {
    const orderDate = new Date(order.date).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    let items = [];
    if (order.items) {
      if (typeof order.items === 'string') {
        try {
          items = JSON.parse(order.items);
        } catch (e) {
          items = [];
        }
      } else if (Array.isArray(order.items)) {
        items = order.items;
      }
    }

    let itemsHtml = items.map(item => `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--glass-border); padding: 0.5rem 0;">
        <div>
          <span style="font-weight: 600;">${item.title}</span><br>
          <span style="font-size: 0.8rem; color: var(--text-secondary);">Option: ${item.option} | Qty: ${item.quantity}</span>
        </div>
        <span style="font-weight: 700;">₹${Number(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join("");

    contentContainer.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Customer Email:</strong>
          <div style="font-family: monospace; font-size: 0.95rem; margin-top: 0.25rem;">${order.email}</div>
        </div>
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Order Date:</strong>
          <div style="font-size: 0.95rem; margin-top: 0.25rem;">${orderDate}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Payment Method:</strong>
          <div style="font-size: 0.95rem; margin-top: 0.25rem; text-transform: uppercase;">${(order.payment_method || order.method || 'Online')}</div>
        </div>
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Transaction ID:</strong>
          <div style="font-family: monospace; font-size: 0.95rem; margin-top: 0.25rem;">${order.address.includes(" | Txn ID: ") ? order.address.split(" | Txn ID: ")[1] : (order.receipt_url || order.transaction_id || ('TXN-' + order.id.replace('TG-', '')))}</div>
        </div>
      </div>

      <div style="border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
        <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase; display: block; margin-bottom: 0.5rem;">Purchased Items:</strong>
        <div style="max-height: 180px; overflow-y: auto;">
          ${itemsHtml}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem;">
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Delivery Address:</strong>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem; line-height: 1.4;">${order.address.split(" | Txn ID: ")[0]}</div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.85rem;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₹${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; color: var(--color-success);">
            <span>Discount:</span>
            <span>-₹${Number(order.discount).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Shipping:</span>
            <span>₹${Number(order.shipping).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Tax (8%):</span>
            <span>₹${Number(order.tax).toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; border-top: 1px solid var(--glass-border); padding-top: 0.35rem; margin-top: 0.25rem;">
            <span>Total:</span>
            <span style="color: var(--color-brand);">₹${Number(order.total).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 0.5rem;">
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Current Status:</strong>
          <div style="margin-top: 0.25rem;">
            <span class="order-status-badge status-${order.status}" style="font-size: 0.85rem;">${order.status.toUpperCase()}</span>
          </div>
        </div>
        <div>
          <strong style="color: var(--text-secondary); font-size: 0.8rem; text-transform: uppercase;">Change Status:</strong>
          <select class="form-select" style="padding: 0.35rem; font-size: 0.85rem; background: var(--bg-tertiary); margin-top: 0.25rem;" onchange="adminUpdateOrderStatus('${order.id}', this.value); document.getElementById('admin-order-modal-overlay').classList.remove('active'); document.body.style.overflow = '';">
            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>PENDING</option>
            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>PROCESSING</option>
            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>SHIPPED</option>
            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>DELIVERED</option>
            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>CANCELLED</option>
          </select>
        </div>
      </div>
      <div style="margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); display: flex; justify-content: center;">
        <a href="javascript:void(0)" class="receipt-btn-${order.id}" onclick="window.downloadOrderReceipt('${order.id}')"
          style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.6rem 1.5rem;background:var(--color-brand);color:#fff;border-radius:8px;font-size:0.9rem;font-weight:700;text-decoration:none;">
          <i data-feather="download" style="width:15px;height:15px;"></i> Download Receipt
        </a>
      </div>
    `;
  }

  // Open modal overlay
  document.getElementById("admin-order-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminCloseOrderModal() {
  document.getElementById("admin-order-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

// ================= MEMBER REGISTRY MANAGEMENT =================
async function adminRenderMembersRegistry() {
  const tableBody = document.getElementById("admin-members-table-body");
  if (!tableBody) return;

  try {
    let members = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
    
    if (supabase) {
      try {
        const { data: mems, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (!error && mems) {
          // Merge profiles from Supabase if they don't already exist in members
          mems.forEach(dbMem => {
            const exists = members.some(p => p.email.toLowerCase() === dbMem.email.toLowerCase());
            if (!exists) {
              members.push(dbMem);
            }
          });
          // Persist the merged list locally
          localStorage.setItem("toyzguru_profiles", JSON.stringify(members));
        }
      } catch (err) {
        console.warn("Failed to fetch profiles from Supabase, using local registry:", err);
      }
    }
    
    // Sort members by created_at descending so newest members are at the top
    members.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    // Seeding mock profiles only if they have never been initialized in local storage
    if (localStorage.getItem("toyzguru_profiles") === null) {
      const defaultMembers = [
        {
          id: "m-user-101",
          name: "Srikant Sen",
          email: "srikantsr@gmail.com",
          phone: "+91 98765 43210",
          address: "Flat 402, Neon Heights, Bandra West",
          city: "Mumbai",
          state: "Maharashtra",
          zip: "400050",
          country: "India",
          loyalty_points: 850,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "m-user-102",
          name: "Aryan Sharma",
          email: "aryan.sharma@toyzguru.com",
          phone: "+91 99999 88888",
          address: "12, Cyber Tower Street",
          city: "Bengaluru",
          state: "Karnataka",
          zip: "560001",
          country: "India",
          loyalty_points: 1200,
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "m-user-103",
          name: "Neha Patel",
          email: "neha.patel@gmail.com",
          phone: "+91 91234 56789",
          address: "A-504, Greenfield Residency, Gachibowli",
          city: "Hyderabad",
          state: "Telangana",
          zip: "500032",
          country: "India",
          loyalty_points: 340,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      const deletedProfiles = JSON.parse(localStorage.getItem("toyzguru_deleted_profiles")) || [];
      const filteredDefaultMembers = defaultMembers.filter(m => {
        const isDeleted = deletedProfiles.includes(m.email.toLowerCase()) || deletedProfiles.includes(m.id);
        return !isDeleted;
      });
      localStorage.setItem("toyzguru_profiles", JSON.stringify(filteredDefaultMembers));
      if (isOfflineFallback) {
        members = filteredDefaultMembers;
      }
    }

    adminMembersState = members;

    if (!members || members.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">No registered members found.</td>
        </tr>
      `;
      renderAdminPagination(tableBody, 0, 'members');
      return;
    }

    // Clamp & page-slice
    const totalPages = Math.max(1, Math.ceil(members.length / ADMIN_PAGE_SIZE));
    adminPaginationState.members = Math.max(1, Math.min(adminPaginationState.members, totalPages));
    const pg = adminPaginationState.members;
    const pageData = members.slice((pg - 1) * ADMIN_PAGE_SIZE, pg * ADMIN_PAGE_SIZE);

    tableBody.innerHTML = pageData.map(m => {
      const location = [m.city, m.country].filter(Boolean).join(", ") || "Not Provided";
      const wishlistCount = Array.isArray(m.wishlist) ? m.wishlist.length : (m.id === (window.userState && window.userState.id) ? (window.wishlistState || []).length : 0);
      const wishlistText = wishlistCount > 0 ? `<span style="background: rgba(255, 0, 128, 0.1); color: var(--color-brand); padding: 0.25rem 0.55rem; border-radius: 4px; font-weight: 600; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.25rem;"><i data-feather="heart" style="width: 12px; height: 12px; fill: var(--color-brand); stroke: var(--color-brand);"></i> ${wishlistCount}</span>` : `<span style="color: var(--text-muted); font-size: 0.8rem;">Empty</span>`;
      return `
        <tr id="admin-member-row-${m.id}">
          <td style="font-family: monospace; font-size: 0.8rem; color: var(--color-brand);">${m.id.substring(0, 8)}...</td>
          <td style="font-weight: 600;">${m.name}</td>
          <td style="font-family: monospace; font-size: 0.85rem;">${m.email}</td>
          <td>${location}</td>
          <td>${wishlistText}</td>
          <td>
            <div class="crud-btn-wrap">
              <button class="crud-btn crud-edit" onclick="adminEditMemberTrigger('${m.id}')" title="Edit Member"><i data-feather="edit" style="width: 14px; height: 14px;"></i></button>
              <button class="crud-btn crud-delete" onclick="adminDeleteMemberTrigger('${m.id}')" title="Delete Member"><i data-feather="trash-2" style="width: 14px; height: 14px;"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    renderAdminPagination(tableBody, members.length, 'members');
    feather.replace();
  } catch (err) {
    console.error("Member registry loading error:", err);
  }
}

async function adminUpdateMemberPoints(profileId) {
  const input = document.getElementById(`member-points-input-${profileId}`);
  if (!input) return;
  const points = parseInt(input.value);

  if (isNaN(points)) {
    if (window.toyzToast) window.toyzToast("Invalid Value", "Please enter a valid number of loyalty points.", "warning");
    return;
  }

  if (!supabase) {
    if (window.toyzToast) window.toyzToast("Action Blocked", "Cannot update member points in local offline demo mode.", "warning");
    return;
  }

  try {
    const { error } = await supabase.from('profiles').update({ loyalty_points: points }).eq('id', profileId);
    if (error) throw error;

    // Update locally stored profiles if matched
    if (window.userState && window.userState.id === profileId) {
      window.userState.loyalty_points = points;
      localStorage.setItem("toyzguru_user", JSON.stringify(window.userState));
      const pointsEl = document.getElementById("profile-card-points");
      if (pointsEl) pointsEl.textContent = points;
    }

    if (window.toyzToast) window.toyzToast("Loyalty Updated", `Member loyalty points updated to: ${points}`, "success");
    adminRenderMembersRegistry();
  } catch (err) {
    if (window.toyzToast) window.toyzToast("Update Failed", err.message || "Failed to update points.", "danger");
  }
}

async function adminDeleteMemberTrigger(profileId) {
  const isConfirmed = await window.showCustomDialog("Delete Member", "Are you sure you want to delete this member and all their related data? This action cannot be undone.", "danger", true);

  if (isConfirmed) {
    // 1. Clean up from local storage in both offline and online modes
    try {
      let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
      const member = localProfiles.find(p => p.id === profileId);

      if (member && member.email) {
        // Delete orders from local storage matching email
        let localOrders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
        localOrders = localOrders.filter(o => o.email.toLowerCase() !== member.email.toLowerCase());
        localStorage.setItem("toyzguru_orders", JSON.stringify(localOrders));
      }

      localProfiles = localProfiles.filter(p => p.id !== profileId);
      localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));

      // Keep track of deleted profiles to prevent them from being re-seeded from users.json or defaultMembers
      let deletedProfiles = JSON.parse(localStorage.getItem("toyzguru_deleted_profiles")) || [];
      if (member) {
        if (member.email && !deletedProfiles.includes(member.email.toLowerCase())) {
          deletedProfiles.push(member.email.toLowerCase());
        }
        if (member.id && !deletedProfiles.includes(member.id)) {
          deletedProfiles.push(member.id);
        }
      } else {
        if (!deletedProfiles.includes(profileId)) {
          deletedProfiles.push(profileId);
        }
      }
      localStorage.setItem("toyzguru_deleted_profiles", JSON.stringify(deletedProfiles));

      // If deleted user matches active login session
      if (window.userState && window.userState.id === profileId) {
        window.userState = null;
        localStorage.removeItem("toyzguru_user");
        if (window.location.hash === "#profile") {
          window.location.hash = "#home";
        }
      }
    } catch (err) {
      console.warn("Failed to clean up member locally:", err);
    }

    if (!supabase) {
      if (window.toyzToast) window.toyzToast("Member Deleted (Demo)", "Member and their related data have been deleted locally.", "info");
      adminRenderMembersRegistry();
      return;
    }

    // 2. Delete from Supabase (online mode)
    try {
      // Use maybeSingle() to handle mock profiles gracefully if they are deleted in online mode
      const { data: member, error: fetchError } = await supabase.from('profiles').select('*').eq('id', profileId).maybeSingle();
      if (fetchError) throw fetchError;

      if (member && member.email) {
        await supabase.from('orders').delete().eq('email', member.email);
        await supabase.from('contact_messages').delete().eq('email', member.email);
      }

      const { error: profileError } = await supabase.from('profiles').delete().eq('id', profileId);
      if (profileError) throw profileError;

      if (window.toyzToast) window.toyzToast("Member Deleted", "Member and their related data have been successfully deleted.", "info");
    } catch (err) {
      await window.showCustomDialog("Delete Failed", err.message || "Failed to delete member.", "danger");
    }

    adminRenderMembersRegistry();
  }
}

function adminEditMemberTrigger(profileId) {
  const member = adminMembersState.find(m => m.id === profileId);
  if (!member) {
    if (window.toyzToast) window.toyzToast("Member Not Found", "Failed to retrieve member details.", "warning");
    return;
  }

  // Switch to Edit mode UI
  document.getElementById("admin-form-member-id").value = member.id;
  document.getElementById("admin-member-modal-title").textContent = `Edit Member: ${member.name}`;
  document.getElementById("admin-member-save-btn").textContent = "Save Member Details";

  // Hide password field, show wishlist (edit mode)
  const pwGroup = document.getElementById("admin-form-member-password-group");
  if (pwGroup) pwGroup.style.display = "none";
  const wishlistSection = document.getElementById("admin-member-wishlist-section");
  if (wishlistSection) wishlistSection.style.display = "";

  document.getElementById("admin-form-member-name").value = member.name || "";
  document.getElementById("admin-form-member-email").value = member.email || "";
  document.getElementById("admin-form-member-phone").value = member.phone || "";
  document.getElementById("admin-form-member-points").value = member.loyalty_points !== undefined ? member.loyalty_points : 120;
  document.getElementById("admin-form-member-address").value = member.address || "";
  document.getElementById("admin-form-member-city").value = member.city || "";
  document.getElementById("admin-form-member-zip").value = member.zip || "";
  document.getElementById("admin-form-member-country").value = member.country || "India";

  // Populate state dropdown in member edit form
  const stateSelect = document.getElementById("admin-form-member-state");
  if (stateSelect) {
    stateSelect.innerHTML = '<option value="">Select State</option>' +
      (window.stateChargesState || []).map(s => `<option value="${s.state_name}">${s.state_name}</option>`).join("");
    stateSelect.value = member.state || "";
  }

  // Populate member's wishlist
  const wishlistContainer = document.getElementById("admin-member-wishlist-container");
  if (wishlistContainer) {
    const memberWishlistIds = Array.isArray(member.wishlist) ? member.wishlist : (member.id === (window.userState && window.userState.id) ? (window.wishlistState || []) : []);

    if (memberWishlistIds.length === 0) {
      wishlistContainer.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem; width: 100%;">No saved items in this member's wishlist vault.</div>`;
    } else {
      const catalogProducts = window.productsState || [];
      const wishlistedProducts = catalogProducts.filter(p => memberWishlistIds.includes(p.id));

      if (wishlistedProducts.length === 0) {
        wishlistContainer.innerHTML = `<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem; width: 100%;">Saved product IDs not found in active catalog.</div>`;
      } else {
        wishlistContainer.innerHTML = wishlistedProducts.map(product => {
          return `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem; background: rgba(255,255,255,0.02); border-radius: 4px; border: 1px solid rgba(255,255,255,0.03); width: 100%;">
              <img src="${product.image}" alt="${product.title}" style="width: 40px; height: 40px; border-radius: 4px; object-fit: cover;">
              <div style="flex: 1; min-width: 0;">
                <div style="font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary);">${product.title}</div>
                <div style="font-size: 0.75rem; color: var(--color-brand); font-weight: 500;">₹${Number(product.price).toFixed(2)}</div>
              </div>
              <span style="font-size: 0.75rem; padding: 0.15rem 0.4rem; border-radius: 10px; background: ${product.stock > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; color: ${product.stock > 0 ? '#22c55e' : '#ef4444'}; font-weight: 500;">
                ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          `;
        }).join("");
      }
    }
  }

  document.getElementById("admin-member-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";

  if (window.feather) {
    window.feather.replace();
  }
}

function adminCreateMemberTrigger() {
  // Switch to Create mode UI
  document.getElementById("admin-form-member-id").value = ""; // empty = create mode
  document.getElementById("admin-member-modal-title").textContent = "Create New Member";
  document.getElementById("admin-member-save-btn").textContent = "Create Member Account";

  // Clear all form fields
  const form = document.getElementById("admin-member-form");
  if (form) form.reset();
  document.getElementById("admin-form-member-country").value = "India";
  document.getElementById("admin-form-member-points").value = 120;

  // Show password field, hide wishlist (not applicable for new members)
  const pwGroup = document.getElementById("admin-form-member-password-group");
  if (pwGroup) pwGroup.style.display = "block";
  const pwInput = document.getElementById("admin-form-member-password");
  if (pwInput) { pwInput.value = ""; pwInput.required = true; }
  const wishlistSection = document.getElementById("admin-member-wishlist-section");
  if (wishlistSection) wishlistSection.style.display = "none";

  // Populate state dropdown
  const stateSelect = document.getElementById("admin-form-member-state");
  if (stateSelect) {
    stateSelect.innerHTML = '<option value="">Select State</option>' +
      (window.stateChargesState || []).map(s => `<option value="${s.state_name}">${s.state_name}</option>`).join("");
  }

  document.getElementById("admin-member-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";

  if (window.feather) {
    window.feather.replace();
  }
}

function adminCloseMemberModal() {
  document.getElementById("admin-member-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

async function handleAdminMemberFormSubmit(e) {
  e.preventDefault();

  const profileId = document.getElementById("admin-form-member-id").value.trim();
  const isCreateMode = !profileId; // empty profileId = creating a new member

  const name = document.getElementById("admin-form-member-name").value.trim();
  const email = document.getElementById("admin-form-member-email").value.trim();
  const phone = document.getElementById("admin-form-member-phone").value.trim();
  const points = parseInt(document.getElementById("admin-form-member-points").value) || 120;
  const address = document.getElementById("admin-form-member-address").value.trim();
  const city = document.getElementById("admin-form-member-city").value.trim();
  const state = document.getElementById("admin-form-member-state").value;
  const zip = document.getElementById("admin-form-member-zip").value.trim();
  const country = document.getElementById("admin-form-member-country").value.trim() || "India";
  const password = isCreateMode ? (document.getElementById("admin-form-member-password") || {}).value : null;

  if (!name || !email) {
    adminShowToast("Missing Fields", "Name and Email are required.", "warning");
    return;
  }

  if (isCreateMode && (!password || password.length < 6)) {
    adminShowToast("Weak Password", "Password must be at least 6 characters.", "warning");
    return;
  }

  const saveBtn = document.getElementById("admin-member-save-btn");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = isCreateMode ? "Creating..." : "Saving..."; }

  const profilePayload = {
    name,
    email,
    phone: phone || null,
    loyalty_points: points,
    address: address || null,
    city: city || null,
    state: state || '',
    zip: zip || null,
    country
  };

  try {
    if (isCreateMode) {
      // Check if email already exists in local profiles first
      let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
      const existing = localProfiles.some(p => p.email && p.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        if (window.showCustomDialog) {
          await window.showCustomDialog("Email Exists", "Email ID already exists!", "warning");
        } else {
          adminShowToast("Email Exists", "Email ID already exists!", "warning");
        }
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Create Member"; }
        return;
      }

      // Check if email already exists in Supabase database first (case-insensitive)
      if (supabase) {
        try {
          const { data: dbMems, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', email);
          
          if (!checkError && dbMems && dbMems.length > 0) {
            if (window.showCustomDialog) {
              await window.showCustomDialog("Email Exists", "Email ID already exists!", "warning");
            } else {
              adminShowToast("Email Exists", "Email ID already exists!", "warning");
            }
            if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Create Member"; }
            return;
          }
        } catch (err) {
          console.warn("Could not check duplicate email on Supabase:", err);
        }
      }

      // ── OTP Verification before creating member account ─────────────────
      if (window.requestEmailOtpVerification) {
        adminShowToast("OTP Sent", `Sending verification OTP to ${email}…`, "info");
        const otpVerified = await window.requestEmailOtpVerification(email, name);
        if (!otpVerified) {
          // Admin or member cancelled — do not create account
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Create Member"; }
          return;
        }
      }

      // Generate a UUID v4
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });


      // Create new profile object
      const newMember = {
        id: uuid,
        ...profilePayload,
        created_at: new Date().toISOString(),
        password: password,
        email_confirmed: true
      };

      // Add to registry
      localProfiles.push(newMember);
      localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));

      // Sync to Supabase profiles table if available
      if (supabase) {
        try {
          const { error: profileError } = await supabase.from('profiles').insert({
            id: uuid,
            ...profilePayload
          });
          if (profileError) {
            console.error("Error saving member profile to Supabase:", profileError);
            
            // Bypass foreign key constraint warning on local auth
            if (profileError.code === '23503') {
              console.warn("Bypassed foreign key constraint on database sync. Saved locally.");
            } else {
              // Remove from local profiles registry since sync failed for other critical reasons
              let currentLocalProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
              currentLocalProfiles = currentLocalProfiles.filter(p => p.id !== uuid);
              localStorage.setItem("toyzguru_profiles", JSON.stringify(currentLocalProfiles));
              
              let errMsg = profileError.message || "Failed to sync member to cloud database.";
              if (profileError.code === '23505' || errMsg.toLowerCase().includes("unique") || errMsg.toLowerCase().includes("exists")) {
                errMsg = "Email ID already exists!";
              }
              
              if (window.showCustomDialog) {
                await window.showCustomDialog("Save Failed", errMsg, "danger");
              } else {
                alert(errMsg);
              }
              adminShowToast("Save Failed", errMsg, "danger");
              if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Create Member"; }
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to sync new member to Supabase:", err);
          // For network offline errors we allow offline fallback.
        }
      }

      adminShowToast("Member Created", `Account for ${name} has been verified and created successfully.`, "success");

      adminCloseMemberModal();
      adminRenderMembersRegistry();

    } else {
      // ---- EDIT EXISTING MEMBER ----
      // 1. Update in local storage registry
      let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
      const match = localProfiles.find(p => p.id === profileId);
      if (match) {
        Object.assign(match, profilePayload);
        localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));
      }

      // 2. Update active session if it matches the current user
      if (window.userState && window.userState.id === profileId) {
        window.userState = { ...window.userState, ...profilePayload };
        localStorage.setItem("toyzguru_user", JSON.stringify(window.userState));
        const pointsEl = document.getElementById("profile-card-points");
        if (pointsEl) pointsEl.textContent = points;
        const nameEl = document.getElementById("profile-card-name");
        if (nameEl) nameEl.textContent = name;
      }

      // 3. Update in Supabase profiles table if online
      if (supabase) {
        try {
          const { error } = await supabase.from('profiles').update(profilePayload).eq('id', profileId);
          if (error) {
            console.error("Error updating profile in Supabase:", error);
            let errMsg = error.message || "Failed to update member in cloud database.";
            adminShowToast("Save Failed", errMsg, "danger");
            return;
          }
        } catch (err) {
          console.warn("Failed to sync profile update to Supabase:", err);
        }
      }

      adminShowToast("Member Updated", `Successfully saved details for: ${name}`, "success");
      adminCloseMemberModal();
      adminRenderMembersRegistry();
    }
  } catch (err) {
    adminShowToast("Save Failed", err.message || "Failed to save member details.", "danger");
    console.error(err);
  } finally {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = isCreateMode ? "Create Member Account" : "Save Member Details"; }
  }
}

// ================= CUSTOMER FEEDBACK INBOX MANAGEMENT =================
async function adminRenderFeedbackInbox() {
  const tableBody = document.getElementById("admin-feedback-table-body");
  if (!tableBody) return;
  if (!supabase) return;

  try {
    const { data: messages, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    if (!messages || messages.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
            No messages in support inbox.
          </td>
        </tr>
      `;
      renderAdminPagination(tableBody, 0, 'feedback');
      return;
    }

    // Clamp & page-slice
    const totalPages = Math.max(1, Math.ceil(messages.length / ADMIN_PAGE_SIZE));
    adminPaginationState.feedback = Math.max(1, Math.min(adminPaginationState.feedback, totalPages));
    const pg = adminPaginationState.feedback;
    const pageData = messages.slice((pg - 1) * ADMIN_PAGE_SIZE, pg * ADMIN_PAGE_SIZE);

    tableBody.innerHTML = pageData.map(msg => {
      const msgDate = new Date(msg.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
      return `
        <tr id="admin-feedback-row-${msg.id}">
          <td style="font-size: 0.8rem; color: var(--text-secondary);">${msgDate}</td>
          <td>
            <strong>${msg.name}</strong><br>
            <span style="font-family: monospace; font-size: 0.75rem; color: var(--text-muted);">${msg.email}</span>
          </td>
          <td style="font-weight: 600; font-size: 0.85rem; color: var(--color-brand);">${msg.subject}</td>
          <td style="font-size: 0.8rem; line-height: 1.4; max-width: 300px; white-space: normal; word-break: break-word;">${msg.message}</td>
          <td>
            <button class="crud-btn crud-delete" onclick="adminDeleteFeedbackTrigger('${msg.id}')" title="Dismiss Message">
              <i data-feather="check" style="width: 14px; height: 14px;"></i>
            </button>
          </td>
        </tr>
      `;
    }).join("");

    renderAdminPagination(tableBody, messages.length, 'feedback');
    feather.replace();
  } catch (err) {
    console.error("Feedback inbox rendering error:", err);
  }
}

async function adminDeleteFeedbackTrigger(messageId) {
  if (!supabase) {
    if (window.toyzToast) window.toyzToast("Action Blocked", "Cannot dismiss support tickets in local offline demo mode.", "warning");
    return;
  }

  const isConfirmed = await window.showCustomDialog("Dismiss Ticket", "Dismiss this support ticket?", "warning", true);

  if (isConfirmed) {
    try {
      const { error } = await supabase.from('contact_messages').delete().eq('id', messageId);
      if (error) throw error;

      if (window.toyzToast) window.toyzToast("Feedback Dismissed", "Message has been archived/removed.", "info");
      adminRenderFeedbackInbox();
    } catch (err) {
      await window.showCustomDialog("Action Failed", err.message || "Failed to dismiss message.", "danger");
    }
  }
}

// ================= SETUP ADMIN EVENT LISTENERS =================
function setupAdminEventListeners() {
  if (window._adminEventListenersSetup) return;
  window._adminEventListenersSetup = true;

  // Search box inventory input typing
  const searchInput = document.getElementById("admin-inventory-search");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      adminInventorySearchQuery = e.target.value;
      adminPaginationState.products = 1; // reset to page 1 on new search
      adminRenderInventoryTable();
    });
  }

  // Add product button trigger click
  const addBtn = document.getElementById("admin-add-product-btn");
  if (addBtn) {
    addBtn.addEventListener("click", adminCreateProductTrigger);
  }

  // Admin form overlay closure
  const closeModalBtn = document.getElementById("close-admin-modal-btn");
  if (closeModalBtn) closeModalBtn.addEventListener("click", adminCloseProductModal);
  const productModalOverlay = document.getElementById("admin-product-modal-overlay");
  if (productModalOverlay) {
    productModalOverlay.addEventListener("click", (e) => {
      if (e.target.id === "admin-product-modal-overlay") adminCloseProductModal();
    });
  }

  // Admin order details overlay closure
  const closeOrderModalBtn = document.getElementById("close-admin-order-modal-btn");
  if (closeOrderModalBtn) closeOrderModalBtn.addEventListener("click", adminCloseOrderModal);
  const orderModalOverlay = document.getElementById("admin-order-modal-overlay");
  if (orderModalOverlay) {
    orderModalOverlay.addEventListener("click", (e) => {
      if (e.target.id === "admin-order-modal-overlay") adminCloseOrderModal();
    });
  }

  // Add member button trigger click
  const addMemberBtn = document.getElementById("admin-add-member-btn");
  if (addMemberBtn) {
    addMemberBtn.addEventListener("click", adminCreateMemberTrigger);
  }

  // Admin member overlay closure
  const closeMemberBtn = document.getElementById("close-admin-member-modal-btn");
  if (closeMemberBtn) {
    closeMemberBtn.addEventListener("click", adminCloseMemberModal);
  }
  const memberOverlay = document.getElementById("admin-member-modal-overlay");
  if (memberOverlay) {
    memberOverlay.addEventListener("click", (e) => {
      if (e.target.id === "admin-member-modal-overlay") adminCloseMemberModal();
    });
  }

  // Admin member form submit
  const memberForm = document.getElementById("admin-member-form");
  if (memberForm) {
    memberForm.addEventListener("submit", handleAdminMemberFormSubmit);
  }

  // Admin form submit
  const productForm = document.getElementById("admin-product-form");
  if (productForm) productForm.addEventListener("submit", handleAdminProductFormSubmit);

  // New category toggle listener
  const newCatToggle = document.getElementById("admin-new-category-toggle");
  const newCatWrap = document.getElementById("admin-new-category-wrap");
  const catSelect = document.getElementById("admin-form-category");
  const deleteCatBtn = document.getElementById("admin-delete-category-btn");
  if (newCatToggle && newCatWrap && catSelect) {
    newCatToggle.addEventListener("click", () => {
      const isAdding = newCatWrap.style.display === "none" || !newCatWrap.style.display;
      if (isAdding) {
        newCatWrap.style.display = "block";
        newCatToggle.textContent = "✕ Cancel";
        newCatToggle.style.background = "rgba(239,68,68,0.15)";
        newCatToggle.style.color = "#ef4444";
        catSelect.disabled = true;
        catSelect.style.opacity = "0.5";
        if (deleteCatBtn) deleteCatBtn.style.display = "none";
      } else {
        newCatWrap.style.display = "none";
        newCatToggle.textContent = "+ New";
        newCatToggle.style.background = "rgba(139,92,246,0.15)";
        newCatToggle.style.color = "var(--color-brand)";
        catSelect.disabled = false;
        catSelect.style.opacity = "1";
        adminUpdateDeleteCategoryButtonVisibility();
      }
    });
  }

  // Change listener on category dropdown to toggle delete button visibility
  if (catSelect) {
    catSelect.addEventListener("change", adminUpdateDeleteCategoryButtonVisibility);
  }

  // Click listener for delete category button
  if (deleteCatBtn) {
    deleteCatBtn.addEventListener("click", adminDeleteCategoryTrigger);
  }

  // File Upload input listener using Supabase Storage
  const fileInput = document.getElementById("admin-form-image-file");
  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && supabase) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          const img = new Image();
          img.onload = function () {
            // Resize using canvas to optimize transfer speeds
            const canvas = document.createElement("canvas");
            const maxDim = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDim) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              }
            } else {
              if (height > maxDim) {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(async (blob) => {
              if (!blob) return;

              try {
                // Generate a unique filename
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

                if (window.toyzToast) {
                  window.toyzToast("Uploading...", "Saving photo to Supabase storage bucket...", "info");
                }

                const { data, error } = await supabase.storage
                  .from('product-images')
                  .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: true
                  });

                if (error) throw error;

                // Get public URL
                const { data: urlData } = supabase.storage
                  .from('product-images')
                  .getPublicUrl(fileName);

                const publicUrl = urlData.publicUrl;

                // Set hidden field value
                document.getElementById("admin-form-image").value = publicUrl;

                // Show preview
                const previewContainer = document.getElementById("admin-form-image-preview-container");
                const previewImg = document.getElementById("admin-form-image-preview");
                const previewName = document.getElementById("admin-form-image-name");

                if (previewContainer && previewImg && previewName) {
                  previewImg.src = publicUrl;
                  previewName.textContent = fileName;
                  previewContainer.style.display = "flex";
                }

                if (window.toyzToast) {
                  window.toyzToast("Image Stored", "Successfully uploaded to Supabase cloud storage.", "success");
                }
              } catch (err) {
                console.error("Upload error:", err);
                if (window.toyzToast) {
                  window.toyzToast("Upload Failed", err.message || "Failed to upload image to bucket.", "danger");
                }
              }
            }, "image/jpeg", 0.85);
          };
          img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Admin login form submit
  const loginForm = document.getElementById("admin-login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("admin-login-email").value.trim();
      const password = document.getElementById("admin-login-password").value;

      const isCorrectEmail = email.toLowerCase() === "admin@toyzguru.com" || email.toLowerCase() === "srikantsr@gmail.com";
      const isCorrectPassword = password === "AdminPassword@007" || password === "Aryan@007";

      if (isCorrectEmail && isCorrectPassword) {
        adminAuthenticated = true;
        localStorage.setItem("toyzguru_admin_auth", "true");
        adminShowToast("Access Granted", "Admin session decrypt successful.", "success");
        updateAdminAuthView();
      } else {
        await window.showCustomDialog("Access Denied", "Incorrect Security Passcode. Access to the admin dashboard has been blocked.", "danger");
      }
    });
  }

  // Admin exit button click
  const signoutBtn = document.getElementById("admin-signout-btn");
  if (signoutBtn) {
    signoutBtn.addEventListener("click", () => {
      adminAuthenticated = false;
      localStorage.removeItem("toyzguru_admin_auth");
      adminShowToast("Terminal Locked", "Admin session terminated successfully.", "info");
      updateAdminAuthView();
      window.location.hash = "#home";
    });
  }

  // Admin dashboard exit card click
  const adminSignoutCard = document.getElementById("admin-signout-card");
  if (adminSignoutCard) {
    adminSignoutCard.addEventListener("click", () => {
      if (signoutBtn) signoutBtn.click();
    });
  }

  // Excel template download button click
  const downloadTemplateBtn = document.getElementById("admin-download-excel-btn");
  if (downloadTemplateBtn) {
    downloadTemplateBtn.addEventListener("click", adminDownloadExcelTemplate);
  }

  // Excel import button file trigger
  const importBtn = document.getElementById("admin-import-excel-btn");
  const excelInput = document.getElementById("admin-excel-import-input");
  if (importBtn && excelInput) {
    importBtn.addEventListener("click", () => {
      excelInput.click();
    });
    excelInput.addEventListener("change", adminHandleExcelImport);
  }

  // Delivery Settings Search State Input
  const stateSearch = document.getElementById("admin-state-search");
  if (stateSearch) {
    stateSearch.addEventListener("input", adminRenderStatesTable);
  }

  // Delivery settings modals closures
  const closeStateModalBtn = document.getElementById("close-admin-state-modal-btn");
  if (closeStateModalBtn) closeStateModalBtn.addEventListener("click", adminCloseStateModal);
  const stateModalOverlay = document.getElementById("admin-state-modal-overlay");
  if (stateModalOverlay) {
    stateModalOverlay.addEventListener("click", (e) => {
      if (e.target.id === "admin-state-modal-overlay") adminCloseStateModal();
    });
  }

  const closeCourierModalBtn = document.getElementById("close-admin-courier-modal-btn");
  if (closeCourierModalBtn) closeCourierModalBtn.addEventListener("click", adminCloseCourierModal);
  const courierModalOverlay = document.getElementById("admin-courier-modal-overlay");
  if (courierModalOverlay) {
    courierModalOverlay.addEventListener("click", (e) => {
      if (e.target.id === "admin-courier-modal-overlay") adminCloseCourierModal();
    });
  }

  // State charges and courier form submissions
  const stateForm = document.getElementById("admin-state-form");
  if (stateForm) stateForm.addEventListener("submit", handleAdminStateFormSubmit);
  const courierForm2 = document.getElementById("admin-courier-form");
  if (courierForm2) courierForm2.addEventListener("submit", handleAdminCourierFormSubmit);

  // Add courier button click
  const addCourierBtn = document.getElementById("admin-add-courier-btn");
  if (addCourierBtn) {
    addCourierBtn.addEventListener("click", adminEditCourierCreateTrigger);
  }

  // Select all / none states in courier checklist
  const selectAllStatesBtn = document.getElementById("courier-select-all");
  if (selectAllStatesBtn) {
    selectAllStatesBtn.addEventListener("click", () => {
      const boxes = document.querySelectorAll('input[name="courier-states"]');
      boxes.forEach(b => b.checked = true);
    });
  }

  const selectNoneStatesBtn = document.getElementById("courier-select-none");
  if (selectNoneStatesBtn) {
    selectNoneStatesBtn.addEventListener("click", () => {
      const boxes = document.querySelectorAll('input[name="courier-states"]');
      boxes.forEach(b => b.checked = false);
    });
  }

  // Coupon bindings
  const addCouponBtn = document.getElementById("admin-add-coupon-btn");
  if (addCouponBtn) {
    addCouponBtn.addEventListener("click", adminCreateCouponTrigger);
  }

  const closeCouponBtn = document.getElementById("close-admin-coupon-modal-btn");
  if (closeCouponBtn) {
    closeCouponBtn.addEventListener("click", adminCloseCouponModal);
  }

  const couponOverlay = document.getElementById("admin-coupon-modal-overlay");
  if (couponOverlay) {
    couponOverlay.addEventListener("click", (e) => {
      if (e.target.id === "admin-coupon-modal-overlay") adminCloseCouponModal();
    });
  }

  const couponForm = document.getElementById("admin-coupon-form");
  if (couponForm) {
    couponForm.addEventListener("submit", handleAdminCouponFormSubmit);
  }
}

// ================= EXCEL INTEGRATION METHODS =================

async function adminDownloadExcelTemplate() {
  if (typeof XLSX === 'undefined') {
    adminShowToast("Error", "SheetJS library is not loaded.", "danger");
    return;
  }

  let products = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: true });
      if (!error && data) {
        products = data;
      }
    } catch (e) {
      console.warn("Failed to fetch products for template:", e);
    }
  }

  if (products.length === 0) {
    products = window.productsState || [];
  }

  // If still empty, add a sample row
  if (products.length === 0) {
    products = [{
      id: "anime-101",
      title: "Sample Anime Figure Spec",
      category: "anime",
      price: 4999.00,
      original_price: 5999.00,
      image: "https://lunwguzzguemtotsshjm.supabase.co/storage/v1/object/public/product-images/sample.jpg",
      rating: 5.0,
      reviews_count: 12,
      badge: "Best Seller",
      description: "This is a premium PVC anime figure collectible with excellent detailing.",
      options: "Standard PVC Edition, Deluxe Resin Edition",
      specs: '{"Material": "PVC", "Height": "24cm"}',
      stock: 15
    }];
  }

  // Format array/JSON columns for Excel representation
  const excelData = products.map(p => {
    let optsStr = "";
    if (Array.isArray(p.options)) {
      optsStr = p.options.join(", ");
    } else if (p.options) {
      optsStr = String(p.options);
    }

    let specsStr = "";
    if (p.specs && typeof p.specs === 'object') {
      specsStr = JSON.stringify(p.specs);
    } else if (p.specs) {
      specsStr = String(p.specs);
    }

    return {
      id: p.id || "",
      title: p.title || "",
      category: p.category || "",
      price: p.price !== undefined ? Number(p.price) : 0,
      original_price: p.original_price !== undefined ? Number(p.original_price) : null,
      image: p.image || "",
      rating: p.rating !== undefined ? Number(p.rating) : 5.0,
      reviews_count: p.reviews_count !== undefined ? Number(p.reviews_count) : 1,
      badge: p.badge || "",
      description: p.description || "",
      options: optsStr,
      specs: specsStr,
      stock: p.stock !== undefined ? parseInt(p.stock) : 10,
      tax_applicable: p.tax_applicable === false ? false : true,
      gst_category_id: p.gst_category_id || "",
      hsn_code: p.hsn_code || "",
      sac_code: p.sac_code || ""
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

  // Adjust column widths automatically
  const max_widths = {};
  excelData.forEach(row => {
    Object.keys(row).forEach(key => {
      const val = row[key] ? String(row[key]) : "";
      max_widths[key] = Math.max(max_widths[key] || 10, val.length);
    });
  });
  worksheet["!cols"] = Object.keys(max_widths).map(key => ({
    wch: Math.min(max_widths[key] + 2, 40) // cap width at 40 characters for display readability
  }));

  XLSX.writeFile(workbook, "toyzguru_products_catalog.xlsx");
  adminShowToast("Template Downloaded", "Excel sheet generated with catalog structure.", "success");
}

async function adminHandleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (typeof XLSX === 'undefined') {
    adminShowToast("Error", "SheetJS library is not loaded.", "danger");
    return;
  }

  const reader = new FileReader();
  reader.onload = async function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        adminShowToast("Empty File", "No product rows found in the uploaded sheet.", "warning");
        return;
      }

      // Parse and validate rows
      const parsedProducts = jsonData.map((row, index) => {
        // Validate required fields
        const title = row.title ? String(row.title).trim() : "";
        const category = row.category ? String(row.category).trim() : "";
        const price = row.price !== undefined ? parseFloat(row.price) : NaN;
        const image = row.image ? String(row.image).trim() : "";
        const description = row.description ? String(row.description).trim() : "";

        if (!title || !category || isNaN(price) || !image || !description) {
          throw new Error(`Row ${index + 2} is missing required fields (title, category, price, image, description)`);
        }

        // Process options: comma separated string to text[]
        let options = ["Standard Edition"];
        if (row.options) {
          options = String(row.options).split(",").map(o => o.trim()).filter(Boolean);
        }

        // Process specs: JSON string or object
        let specs = {};
        if (row.specs) {
          const specsStr = String(row.specs).trim();
          if (specsStr.startsWith("{") && specsStr.endsWith("}")) {
            try {
              specs = JSON.parse(specsStr);
            } catch (err) {
              console.warn(`Row ${index + 2}: invalid specs JSON. Falling back to empty object.`, err);
            }
          } else {
            // Try to parse simple key:value comma-separated fields if they entered it like that
            const pairs = specsStr.split(",").map(p => p.split(":"));
            pairs.forEach(p => {
              if (p.length === 2) {
                specs[p[0].trim()] = p[1].trim();
              }
            });
          }
        }

        // Generate id if empty
        let id = row.id ? String(row.id).trim() : "";
        if (!id) {
          const randomId = Math.floor(100 + Math.random() * 900);
          id = `${category.substring(0, 5)}-${randomId}`;
        }

        // Parse tax_applicable (default to true)
        let tax_applicable = true;
        if (row.tax_applicable !== undefined && row.tax_applicable !== null) {
          const valStr = String(row.tax_applicable).trim().toLowerCase();
          if (valStr === "false" || valStr === "no" || valStr === "0") {
            tax_applicable = false;
          }
        }

        // Validate gst_category_id format (must be UUID if set)
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        const rawGstCatId = row.gst_category_id ? String(row.gst_category_id).trim() : "";
        const gst_category_id = uuidRegex.test(rawGstCatId) ? rawGstCatId : null;

        const hsn_code = row.hsn_code ? String(row.hsn_code).trim() : null;
        const sac_code = row.sac_code ? String(row.sac_code).trim() : null;

        return {
          id: id,
          title: title,
          category: category,
          price: price,
          original_price: row.original_price !== undefined ? parseFloat(row.original_price) : null,
          image: image,
          rating: row.rating !== undefined ? parseFloat(row.rating) : 5.0,
          reviews_count: row.reviews_count !== undefined ? parseInt(row.reviews_count) : 1,
          badge: row.badge ? String(row.badge).trim() : null,
          description: description,
          options: options,
          specs: specs,
          stock: row.stock !== undefined ? parseInt(row.stock) : 10,
          tax_applicable: tax_applicable,
          gst_category_id: gst_category_id,
          hsn_code: hsn_code,
          sac_code: sac_code
        };
      });

      if (supabase) {
        // Bulk upsert into Supabase
        const { error } = await supabase.from('products').upsert(parsedProducts);
        if (error) throw error;

        adminShowToast("Sync Success", `Successfully merged ${parsedProducts.length} items with database!`, "success");
      } else {
        // Local state fallback update
        let currentProducts = window.productsState || [];
        parsedProducts.forEach(newP => {
          const matchIndex = currentProducts.findIndex(p => p.id === newP.id);
          if (matchIndex >= 0) {
            currentProducts[matchIndex] = newP;
          } else {
            currentProducts.push(newP);
          }
        });
        window.productsState = currentProducts;
        localStorage.setItem("toyzguru_products", JSON.stringify(currentProducts));
        adminShowToast("Sync Success (Demo)", `Merged ${parsedProducts.length} items locally!`, "success");
      }

      // Re-initialize local database state and re-render table
      if (window.initDatabase) {
        await window.initDatabase();
      }
      adminRenderInventoryTable();

    } catch (err) {
      console.error(err);
      adminShowToast("Import Failed", err.message || "Failed to process Excel file.", "danger");
    } finally {
      // Clear value so the same file can be uploaded again
      event.target.value = "";
    }
  };
  reader.readAsArrayBuffer(file);
}

// Attach bindings to window so other scripts or inline onclick handlers can reference them
window.adminInit = adminInit;
window.adminRenderDashboard = adminRenderDashboard;
window.adminEditProductTrigger = adminEditProductTrigger;
window.adminDeleteProductTrigger = adminDeleteProductTrigger;
window.adminUpdateOrderStatus = adminUpdateOrderStatus;
window.adminCloseProductModal = adminCloseProductModal;
window.adminUpdateMemberPoints = adminUpdateMemberPoints;
window.adminDeleteMemberTrigger = adminDeleteMemberTrigger;
window.adminEditMemberTrigger = adminEditMemberTrigger;
window.adminCreateMemberTrigger = adminCreateMemberTrigger;
window.adminCloseMemberModal = adminCloseMemberModal;
window.adminDeleteFeedbackTrigger = adminDeleteFeedbackTrigger;
window.adminCreateProductTrigger = adminCreateProductTrigger;
window.adminShowOrderDetailsTrigger = adminShowOrderDetailsTrigger;
window.adminCloseOrderModal = adminCloseOrderModal;
window.adminDownloadExcelTemplate = adminDownloadExcelTemplate;
window.adminHandleExcelImport = adminHandleExcelImport;
window.handleAdminProductFormSubmit = handleAdminProductFormSubmit;
window.adminPopulateCategoryDropdown = adminPopulateCategoryDropdown;
window.adminUpdateDeleteCategoryButtonVisibility = adminUpdateDeleteCategoryButtonVisibility;
window.adminDeleteCategoryTrigger = adminDeleteCategoryTrigger;

// ================= DELIVERY & ORDER FULFILLMENT MANAGEMENT MODULE =================

let adminDeliveryCurrentTab = "delivery-shipments";
let shipmentsState = [];
let trackingEventsState = [];
let deliveryLogsState = [];

async function adminLoadFulfillmentData() {
  // Track whether orders were loaded from Supabase so the fallback doesn't clobber them
  let _ordersLoadedFromRemote = false;

  if (supabase) {
    // ── orders: independent try-catch ──
    try {
      const { data: ords, error: errOrds } = await supabase.from('orders').select('*').order('date', { ascending: false });
      if (!errOrds) {
        const remoteOrders = ords || [];
        // Merge localStorage-only orders so offline/test orders never disappear
        const localOrders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
        const remoteIds = new Set(remoteOrders.map(o => o.id));
        const localOnly = localOrders.filter(o => !remoteIds.has(o.id));
        window.ordersState = [...remoteOrders, ...localOnly].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        _ordersLoadedFromRemote = true;
      }
    } catch (errOrds) {
      console.warn("adminLoadFulfillmentData: orders fetch failed:", errOrds);
    }

    // ── shipments: independent try-catch ──
    try {
      const { data: ships, error: errShips } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
      if (!errShips) shipmentsState = ships || [];
      else throw errShips;
    } catch (errShips) {
      console.warn("adminLoadFulfillmentData: shipments fetch failed (table may not exist yet):", errShips);
      shipmentsState = JSON.parse(localStorage.getItem("toyzguru_shipments")) || [];
    }

    // ── tracking_events: independent try-catch ──
    try {
      const { data: events, error: errEvents } = await supabase.from('tracking_events').select('*').order('timestamp', { ascending: false });
      if (!errEvents) trackingEventsState = events || [];
      else throw errEvents;
    } catch (errEvents) {
      console.warn("adminLoadFulfillmentData: tracking_events fetch failed:", errEvents);
      trackingEventsState = JSON.parse(localStorage.getItem("toyzguru_tracking_events")) || [];
    }

    // ── delivery_logs: independent try-catch ──
    try {
      const { data: logs, error: errLogs } = await supabase.from('delivery_logs').select('*').order('timestamp', { ascending: false });
      if (!errLogs) deliveryLogsState = logs || [];
      else throw errLogs;
    } catch (errLogs) {
      console.warn("adminLoadFulfillmentData: delivery_logs fetch failed:", errLogs);
      deliveryLogsState = JSON.parse(localStorage.getItem("toyzguru_delivery_logs")) || [];
    }
  } else {
    adminLoadFulfillmentDataFallback();
    _ordersLoadedFromRemote = false;
  }

  // If Supabase didn't provide orders, load from localStorage
  if (!_ordersLoadedFromRemote) {
    adminLoadFulfillmentDataFallback();
  }
}

function adminLoadFulfillmentDataFallback() {
  // Merge: start fresh from localStorage, but preserve any already-merged Supabase state
  const localOrders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
  const existingState = window.ordersState || [];
  const existingIds = new Set(existingState.map(o => o.id));
  const newLocalOnly = localOrders.filter(o => !existingIds.has(o.id));
  window.ordersState = [...existingState, ...newLocalOnly].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  if (shipmentsState.length === 0) shipmentsState = JSON.parse(localStorage.getItem("toyzguru_shipments")) || [];
  if (trackingEventsState.length === 0) trackingEventsState = JSON.parse(localStorage.getItem("toyzguru_tracking_events")) || [];
  if (deliveryLogsState.length === 0) deliveryLogsState = JSON.parse(localStorage.getItem("toyzguru_delivery_logs")) || [];
}

async function adminSaveShipment(shipment) {
  if (supabase) {
    try {
      const { error } = await supabase.from('shipments').upsert(shipment);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save shipment to Supabase:", err);
    }
  }
  let localShips = JSON.parse(localStorage.getItem("toyzguru_shipments")) || [];
  const idx = localShips.findIndex(s => s.id === shipment.id);
  if (idx >= 0) localShips[idx] = shipment;
  else localShips.push(shipment);
  localStorage.setItem("toyzguru_shipments", JSON.stringify(localShips));
}

async function adminSaveTrackingEvent(event) {
  if (supabase) {
    try {
      const { error } = await supabase.from('tracking_events').insert(event);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save tracking event to Supabase:", err);
    }
  }
  let localEvents = JSON.parse(localStorage.getItem("toyzguru_tracking_events")) || [];
  localEvents.push(event);
  localStorage.setItem("toyzguru_tracking_events", JSON.stringify(localEvents));
}

async function adminSaveLog(logEntry) {
  if (supabase) {
    try {
      const { error } = await supabase.from('delivery_logs').insert(logEntry);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to save delivery log to Supabase:", err);
    }
  }
  let localLogs = JSON.parse(localStorage.getItem("toyzguru_delivery_logs")) || [];
  localLogs.push(logEntry);
  localStorage.setItem("toyzguru_delivery_logs", JSON.stringify(localLogs));
}

// Tab navigation handler
async function adminSwitchDeliveryTab(tabId, btn) {
  // Update UI active buttons
  const tabs = btn.parentNode.querySelectorAll(".admin-sub-tab");
  tabs.forEach(t => t.classList.remove("active"));
  btn.classList.add("active");

  const subpanels = document.querySelectorAll(".subpanel-content");
  subpanels.forEach(p => p.classList.remove("active"));
  
  const targetPanel = document.getElementById(tabId);
  if (targetPanel) {
    targetPanel.classList.add("active");
  }
  adminDeliveryCurrentTab = tabId;

  await adminLoadFulfillmentData();

  if (tabId === "delivery-shipments") {
    adminRenderShipmentsTable();
  } else if (tabId === "delivery-printing") {
    adminRenderPrintingTable();
  } else if (tabId === "delivery-settings") {
    adminRenderStatesTable();
    adminRenderCouriersTable();
  } else if (tabId === "delivery-analytics") {
    adminRenderAnalyticsTab();
  } else if (tabId === "delivery-audit") {
    adminRenderLogsTable();
  }
}

async function adminRenderDeliveryPanel() {
  await adminLoadFulfillmentData();
  
  // Set default tabs active
  const defaultTabBtn = document.querySelector(`.admin-sub-tabs button[onclick*="${adminDeliveryCurrentTab}"]`);
  if (defaultTabBtn) {
    // trigger state switch
    adminSwitchDeliveryTab(adminDeliveryCurrentTab, defaultTabBtn);
  } else {
    adminRenderShipmentsTable();
  }
}

// Helpers
function getOrderForShipment(orderId) {
  return (window.ordersState || []).find(o => o.id === orderId) || null;
}

// ── Customer info extraction ──
// Resolves name and phone from either direct order fields (localStorage) or
// embedded [NAME:...][PHONE:...] address tags (Supabase orders, where those
// columns are stripped before insert).
function extractCustomerInfo(order) {
  if (!order) return { name: '—', phone: '—', email: '—' };
  // 1. Direct fields: available for localStorage / future DB orders with columns
  if (order.name && order.name.trim() && order.name.trim() !== order.email) {
    return {
      name: order.name.trim(),
      phone: (order.phone || '').trim() || '—',
      email: order.email || '—'
    };
  }
  // 2. Embedded tags in address (e.g. "[NAME:John Doe][PHONE:+91 9876543210] 123 Main St...")
  if (order.address) {
    const nameMatch = order.address.match(/\[NAME:([^\]]*)\]/);
    const phoneMatch = order.address.match(/\[PHONE:([^\]]*)\]/);
    if (nameMatch || phoneMatch) {
      return {
        name: (nameMatch?.[1] || '').trim() || order.email || 'Customer',
        phone: (phoneMatch?.[1] || '').trim() || '—',
        email: order.email || '—'
      };
    }
  }
  // 3. Fallback: use email as display name
  return { name: order.email || 'Customer', phone: '—', email: order.email || '—' };
}

// Returns delivery address with Txn ID suffix and [NAME:][PHONE:] tags stripped
function getCleanDeliveryAddress(order) {
  const raw = ((order && order.address) || '').split(' | Txn ID: ')[0];
  return raw
    .replace(/\[NAME:[^\]]*\]/g, '')
    .replace(/\[PHONE:[^\]]*\]/g, '')
    .trim() || '—';
}

// Renderer 1: Shipments Queue table
function adminRenderShipmentsTable() {
  const tableBody = document.getElementById("admin-shipments-tbody");
  if (!tableBody) return;

  const searchQuery = document.getElementById("admin-shipments-search")?.value.trim().toLowerCase() || "";
  const statusFilter = document.getElementById("admin-shipments-status-filter")?.value || "all";

  // Match shipmentsState with orders
  const allOrders = window.ordersState || [];
  
  // Generate rows for shipments plus any approved order that doesn't have a shipment record yet
  let list = [...shipmentsState];
  
  // Find orders with status processing (paid/approved) or pending that are not cancellation
  allOrders.forEach(ord => {
    if (ord.status !== "cancelled" && ord.status !== "delivered") {
      const exists = list.some(s => s.order_id === ord.id);
      if (!exists) {
        // Create virtual shipment row for displaying
        list.push({
          id: "PENDING_GEN",
          order_id: ord.id,
          tracking_number: "—",
          courier_name: "Unassigned",
          status: ord.status === "processing" ? "ready_to_pack" : "pending",
          estimated_delivery_date: null,
          created_at: ord.date
        });
      }
    }
  });

  // Filter
  let filtered = list.filter(item => {
    const order = getOrderForShipment(item.order_id);
    const { name: buyerName, phone: buyerPhone, email: buyerEmail } = extractCustomerInfo(order);
    const matchesSearch = item.order_id.toLowerCase().includes(searchQuery) ||
                          item.id.toLowerCase().includes(searchQuery) ||
                          buyerName.toLowerCase().includes(searchQuery) ||
                          buyerPhone.toLowerCase().includes(searchQuery) ||
                          buyerEmail.toLowerCase().includes(searchQuery) ||
                          item.tracking_number.toLowerCase().includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          No active shipments matching search criteria.
        </td>
      </tr>
    `;
    renderAdminPagination(tableBody, 0, 'shipments');
    return;
  }

  // Clamp & page-slice
  const totalShipPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  adminPaginationState.shipments = Math.max(1, Math.min(adminPaginationState.shipments, totalShipPages));
  const shipPg = adminPaginationState.shipments;
  const shipPageData = filtered.slice((shipPg - 1) * ADMIN_PAGE_SIZE, shipPg * ADMIN_PAGE_SIZE);

  tableBody.innerHTML = shipPageData.map(ship => {
    const order = getOrderForShipment(ship.order_id);
    const { name: buyerName, phone: buyerPhone, email: buyerEmail } = extractCustomerInfo(order);
    const estDate = ship.estimated_delivery_date ? new Date(ship.estimated_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";
    
    // Status colors mapping
    let badgeClass = "status-pending";
    if (["ready_to_pack", "packed", "quality_checked"].includes(ship.status)) badgeClass = "status-processing";
    else if (["dispatched", "in_transit", "out_for_delivery"].includes(ship.status)) badgeClass = "status-shipped";
    else if (ship.status === "delivered") badgeClass = "status-delivered";
    else if (ship.status === "returned" || ship.status === "failed") badgeClass = "status-cancelled";

    const isVirtual = ship.id === "PENDING_GEN";
    const shipDisplayId = isVirtual ? `<span style="color:var(--text-muted);font-style:italic;">Draft label</span>` : ship.id;

    // Build select dropdown selector for quick inline status update
    const statusOptions = ["pending", "ready_to_pack", "packed", "quality_checked", "dispatched", "in_transit", "out_for_delivery", "delivered", "failed", "returned"];
    const dropdownHtml = isVirtual 
      ? `<button class="product-card-add-btn" style="padding:0.3rem 0.5rem;font-size:0.75rem;background:var(--color-brand-gradient);" onclick="adminOpenFulfillmentModal('${ship.order_id}')">Approve & Fulfill</button>`
      : `
        <div style="display:flex;gap:0.35rem;align-items:center;">
          <select class="form-select" style="padding: 0.3rem; font-size: 0.75rem; background: var(--bg-tertiary); max-width: 130px;" onchange="adminUpdateShipmentStatus('${ship.id}', this.value)">
            ${statusOptions.map(opt => `<option value="${opt}" ${ship.status === opt ? "selected" : ""}>${opt.toUpperCase().replace(/_/g, ' ')}</option>`).join("")}
          </select>
          <button class="crud-btn crud-edit" onclick="adminOpenFulfillmentModal('${ship.order_id}')" title="Edit Packing details" style="padding: 0.2rem 0.3rem;"><i data-feather="edit" style="width:12px;height:12px;"></i></button>
        </div>
      `;

    const dispatchBtn = (!isVirtual && ["ready_to_pack", "packed", "quality_checked"].includes(ship.status))
      ? `<button class="product-card-add-btn" style="padding:0.3rem 0.5rem;font-size:0.75rem;background:#0ea5e9;margin-left:0.25rem;" onclick="adminOpenDispatchModal('${ship.id}')">✈ Dispatch</button>`
      : "";

    // Load recent events
    const recentEvents = trackingEventsState.filter(e => e.shipment_id === ship.id);
    const eventsCount = recentEvents.length;
    const historyBtn = !isVirtual 
      ? `<a href="javascript:void(0)" onclick="adminShowShipmentTimeline('${ship.id}')" style="color:var(--color-brand); font-size:0.78rem; text-decoration:underline;">Timeline (${eventsCount})</a>`
      : "—";

    return `
      <tr>
        <td style="font-family: monospace; font-size:0.8rem; font-weight:700;">${shipDisplayId}</td>
        <td style="font-family: monospace; font-size:0.8rem; color:var(--color-brand); cursor:pointer;" onclick="adminShowOrderDetailsTrigger('${ship.order_id}')">${ship.order_id}</td>
        <td>
          <div style="font-weight:600; font-size:0.85rem;">${buyerName}</div>
          <div style="font-size:0.72rem; color:var(--text-secondary); font-family:monospace; word-break:break-all;">${buyerEmail}</div>
        </td>
        <td>${ship.courier_name || "—"}</td>
        <td>
          <span class="order-status-badge ${badgeClass}">${ship.status.replace(/_/g, ' ')}</span>
        </td>
        <td>${estDate}</td>
        <td>${historyBtn}</td>
        <td style="display:flex; align-items:center;">
          ${dropdownHtml}
          ${dispatchBtn}
        </td>
      </tr>
    `;
  }).join("");

  renderAdminPagination(tableBody, filtered.length, 'shipments');
  feather.replace();
}

// Timeline Display Box Modal Injection
window.adminShowShipmentTimeline = function(shipmentId) {
  const events = trackingEventsState.filter(e => e.shipment_id === shipmentId).sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  const shipment = shipmentsState.find(s => s.id === shipmentId);
  
  const existing = document.getElementById('shipment-timeline-modal');
  if (existing) existing.remove();

  const listHTML = events.map(e => `
    <div class="shipment-timeline-node completed">
      <div class="shipment-timeline-dot"></div>
      <div class="shipment-timeline-content">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
          <strong style="color:var(--text-primary); text-transform:uppercase;">${e.status.replace(/_/g, ' ')}</strong>
          <span style="color:var(--text-muted); font-size:0.72rem;">${new Date(e.timestamp).toLocaleString()}</span>
        </div>
        <div style="color:var(--text-secondary); font-size:0.78rem;">${e.description}</div>
        ${e.location ? `<div style="font-size:0.72rem; color:var(--color-brand); margin-top:0.15rem;"><i data-feather="map-pin" style="width:10px;height:10px;"></i> ${e.location}</div>` : ""}
      </div>
    </div>
  `).join("");

  const modal = document.createElement('div');
  modal.id = 'shipment-timeline-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div style="background:var(--bg-secondary);border:1px solid var(--glass-border);border-radius:12px;padding:2rem;width:100%;max-width:480px;position:relative;">
      <button onclick="document.getElementById('shipment-timeline-modal').remove()" style="position:absolute;top:1rem;right:1rem;background:none;border:none;color:var(--text-secondary);cursor:pointer;"><i data-feather="x"></i></button>
      <h3 style="margin:0 0 1.25rem;font-family:'Space Grotesk',sans-serif;color:var(--color-brand);display:flex;align-items:center;gap:0.4rem;"><i data-feather="map-pin"></i> Transit Timeline: ${shipmentId}</h3>
      <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:1rem;">Courier Partner: <strong>${shipment?.courier_name || 'Unassigned'}</strong> | Tracking ID: <strong>${shipment?.tracking_number || '—'}</strong></p>
      <div style="max-height:350px; overflow-y:auto; padding-right:0.5rem; margin-top:1rem;">
        ${events.length === 0 ? `<div style="color:var(--text-muted); font-size:0.85rem; text-align:center;">No tracking events recorded.</div>` : listHTML}
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  feather.replace();
};

// Renderer 2: Printing Center Table
function adminRenderPrintingTable() {
  const tableBody = document.getElementById("admin-printing-tbody");
  if (!tableBody) return;

  const searchQuery = document.getElementById("admin-print-search")?.value.trim().toLowerCase() || "";

  let filtered = shipmentsState.filter(ship => {
    const order = getOrderForShipment(ship.order_id);
    const buyerName = order?.name || order?.email || "";
    return ship.id.toLowerCase().includes(searchQuery) ||
           ship.order_id.toLowerCase().includes(searchQuery) ||
           buyerName.toLowerCase().includes(searchQuery) ||
           ship.tracking_number.toLowerCase().includes(searchQuery);
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          No shipments ready for printing.
        </td>
      </tr>
    `;
    renderAdminPagination(tableBody, 0, 'printing');
    return;
  }

  // Clamp & page-slice
  const totalPrintPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  adminPaginationState.printing = Math.max(1, Math.min(adminPaginationState.printing, totalPrintPages));
  const printPg = adminPaginationState.printing;
  const printPageData = filtered.slice((printPg - 1) * ADMIN_PAGE_SIZE, printPg * ADMIN_PAGE_SIZE);

  tableBody.innerHTML = printPageData.map(ship => {
    const order = getOrderForShipment(ship.order_id);
    const buyerName = order?.name || order?.email || "Customer";
    
    // Count print histories from logs
    const printsCount = deliveryLogsState.filter(l => l.action_type === 'print' && l.shipment_id === ship.id).length;

    return `
      <tr>
        <td style="font-family: monospace; font-size:0.8rem; font-weight:700;">${ship.id}</td>
        <td style="font-family: monospace; font-size:0.8rem; color:var(--color-brand);">${ship.order_id}</td>
        <td>
          <div style="font-weight:600; font-size:0.82rem;">${buyerName}</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">${order?.email || '—'}</div>
        </td>
        <td>${ship.courier_name || "—"}</td>
        <td style="font-family:monospace; font-size:0.8rem;">${ship.tracking_number}</td>
        <td style="font-weight:700; color:var(--color-brand); font-size:0.85rem;">${printsCount} times</td>
        <td>
          <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
            <button class="product-card-add-btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:var(--color-brand-gradient);" onclick="adminPrintDocument('${ship.id}', 'zebra')">Zebra 4x6 Label</button>
            <button class="product-card-add-btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:rgba(255,255,255,0.06); border:1px solid var(--glass-border); color:var(--text-primary);" onclick="adminPrintDocument('${ship.id}', 'qr')">QR Sticker</button>
            <button class="product-card-add-btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:var(--color-watches);" onclick="adminPrintDocument('${ship.id}', 'invoice')">A4 Invoice</button>
            <button class="product-card-add-btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:#10b981;" onclick="adminPrintDocument('${ship.id}', 'slip')">Packing Slip</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");
  renderAdminPagination(tableBody, filtered.length, 'printing');
}

// Renderer 3: Analytics dashboard
function adminRenderAnalyticsTab() {
  const totalCount = shipmentsState.length;
  const transitCount = shipmentsState.filter(s => ['dispatched', 'in_transit', 'out_for_delivery'].includes(s.status)).length;
  const deliveredCount = shipmentsState.filter(s => s.status === "delivered").length;
  const returnedCount = shipmentsState.filter(s => s.status === "returned").length;
  const successRate = totalCount > 0 ? Math.round((deliveredCount / totalCount) * 100) : 0;
  
  // Compute avg transit time (prefilled defaults for nice stats)
  let sumDays = 0;
  let countDelivered = 0;
  shipmentsState.forEach(s => {
    if (s.status === "delivered" && s.dispatch_date) {
      const start = new Date(s.created_at || s.approved_at);
      const end = new Date(s.dispatch_date);
      const diff = Math.max(0.2, (end - start) / (1000 * 60 * 60 * 24));
      sumDays += diff;
      countDelivered++;
    }
  });
  const avgTime = countDelivered > 0 ? (sumDays / countDelivered) : 3.4;

  document.getElementById("analytics-total-shipments").textContent = totalCount;
  document.getElementById("analytics-transit-shipments").textContent = transitCount;
  document.getElementById("analytics-success-rate").textContent = successRate + "%";
  document.getElementById("analytics-returned-shipments").textContent = returnedCount;
  document.getElementById("analytics-avg-time").textContent = avgTime.toFixed(1) + "d";

  // Status breakdown bars
  const statuses = ["pending", "ready_to_pack", "packed", "quality_checked", "dispatched", "in_transit", "out_for_delivery", "delivered", "failed", "returned"];
  const maxStatusCount = Math.max(...statuses.map(st => shipmentsState.filter(s => s.status === st).length), 1);
  
  let statusHtml = statuses.map(st => {
    const count = shipmentsState.filter(s => s.status === st).length;
    const pct = (count / maxStatusCount) * 100;
    return `
      <div style="margin-bottom:0.5rem;">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.15rem;">
          <span style="text-transform:capitalize;">${st.replace(/_/g, ' ')}</span>
          <strong>${count} shipments</strong>
        </div>
        <div style="height:6px; background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:var(--color-brand-gradient); border-radius:4px;"></div>
        </div>
      </div>
    `;
  }).join("");
  document.getElementById("analytics-status-breakdown-bars").innerHTML = statusHtml;

  // Courier performance
  const couriers = ["Delhivery", "Blue Dart", "DTDC", "India Post", "Ecom Express"];
  const maxCourierCount = Math.max(...couriers.map(cr => shipmentsState.filter(s => s.courier_name === cr).length), 1);
  
  let courierHtml = couriers.map(cr => {
    const count = shipmentsState.filter(s => s.courier_name === cr).length;
    const delivered = shipmentsState.filter(s => s.courier_name === cr && s.status === "delivered").length;
    const rate = count > 0 ? Math.round((delivered / count) * 100) : 100;
    const pct = (count / maxCourierCount) * 100;

    return `
      <div style="margin-bottom:0.6rem;">
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:var(--text-secondary); margin-bottom:0.15rem;">
          <strong>${cr}</strong>
          <span style="font-size:0.7rem; color:var(--text-muted);">${count} volume | <strong style="color:var(--color-brand);">${rate}% Success</strong></span>
        </div>
        <div style="height:6px; background:rgba(255,255,255,0.02); border:1px solid var(--glass-border); border-radius:4px; overflow:hidden;">
          <div style="height:100%; width:${pct}%; background:#0ea5e9; border-radius:4px;"></div>
        </div>
      </div>
    `;
  }).join("");
  document.getElementById("analytics-courier-performance-bars").innerHTML = courierHtml;
}

// Renderer 4: Audit logs
function adminRenderLogsTable() {
  const tableBody = document.getElementById("admin-delivery-logs-tbody");
  if (!tableBody) return;

  const searchQuery = document.getElementById("admin-audit-search")?.value.trim().toLowerCase() || "";

  let filtered = deliveryLogsState.filter(log => {
    return log.action_type.toLowerCase().includes(searchQuery) ||
           (log.order_id && log.order_id.toLowerCase().includes(searchQuery)) ||
           (log.shipment_id && log.shipment_id.toLowerCase().includes(searchQuery)) ||
           log.admin_user.toLowerCase().includes(searchQuery) ||
           log.details.toLowerCase().includes(searchQuery);
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
          No audit logs recorded in session database registry.
        </td>
      </tr>
    `;
    renderAdminPagination(tableBody, 0, 'logs');
    return;
  }

  // Clamp & page-slice
  const totalLogPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  adminPaginationState.logs = Math.max(1, Math.min(adminPaginationState.logs, totalLogPages));
  const logPg = adminPaginationState.logs;
  const logPageData = filtered.slice((logPg - 1) * ADMIN_PAGE_SIZE, logPg * ADMIN_PAGE_SIZE);

  tableBody.innerHTML = logPageData.map(log => {
    return `
      <tr>
        <td style="font-size:0.75rem; color:var(--text-secondary);">${new Date(log.timestamp).toLocaleString()}</td>
        <td style="text-transform:uppercase; font-size:0.75rem; font-weight:700; color:var(--color-brand);">${log.action_type}</td>
        <td style="font-family:monospace; font-size:0.78rem;">${log.order_id || '—'}</td>
        <td style="font-family:monospace; font-size:0.78rem;">${log.shipment_id || '—'}</td>
        <td style="font-size:0.78rem; font-family:monospace; color:var(--text-secondary);">${log.admin_user}</td>
        <td style="font-size:0.8rem; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${log.details}">${log.details}</td>
      </tr>
    `;
  }).join("");
  renderAdminPagination(tableBody, filtered.length, 'logs');
}

// Fulfillment Modal Logic
async function adminOpenFulfillmentModal(orderId) {
  await adminLoadFulfillmentData();
  const order = getOrderForShipment(orderId);
  if (!order) {
    adminShowToast("Order Error", "Could not locate order details in registry.", "danger");
    return;
  }

  const shipment = shipmentsState.find(s => s.order_id === orderId);

  document.getElementById("fulfillment-form-order-id").value = orderId;
  document.getElementById("fulfillment-form-shipment-id").value = shipment ? shipment.id : "";
  document.getElementById("fulfillment-modal-title").textContent = `Fulfill Order: ${orderId}`;
  const { name: fulfillBuyerName, phone: fulfillBuyerPhone } = extractCustomerInfo(order);
  document.getElementById("fulfillment-buyer-name").textContent = fulfillBuyerName;
  
  const cleanAddr = getCleanDeliveryAddress(order);
  document.getElementById("fulfillment-buyer-address").textContent = cleanAddr;
  document.getElementById("fulfillment-buyer-address").title = cleanAddr;

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsText = items.map(i => `${i.title || i.productName} (x${i.quantity})`).join(", ");
  document.getElementById("fulfillment-items-summary").textContent = itemsText;
  document.getElementById("fulfillment-items-summary").title = itemsText;

  // Prefill action
  const actionSelect = document.getElementById("fulfillment-action");
  actionSelect.disabled = false;

  const paymentWarning = document.getElementById("fulfillment-payment-warning");
  
  // Payment status warning: if order.status is pending (meaning check didn't clear), show UPI override warning
  if (order.status === "pending") {
    actionSelect.value = "hold";
    paymentWarning.style.display = "block";
  } else if (order.status === "processing") {
    actionSelect.value = "approve";
    actionSelect.disabled = true; // payment already checked and verified!
    paymentWarning.style.display = "none";
  } else if (order.status === "cancelled") {
    actionSelect.value = "reject";
    actionSelect.disabled = true;
    paymentWarning.style.display = "none";
  } else {
    actionSelect.value = "approve";
    paymentWarning.style.display = "none";
  }

  toggleFulfillmentActionUI(actionSelect.value);

  // Prefill packing details
  if (shipment) {
    document.getElementById("pack-check-ready").checked = ["ready_to_pack", "packed", "quality_checked", "dispatched", "in_transit", "out_for_delivery", "delivered"].includes(shipment.status);
    document.getElementById("pack-check-packed").checked = ["packed", "quality_checked", "dispatched", "in_transit", "out_for_delivery", "delivered"].includes(shipment.status);
    document.getElementById("pack-check-qc").checked = ["quality_checked", "dispatched", "in_transit", "out_for_delivery", "delivered"].includes(shipment.status);
    document.getElementById("fulfillment-weight").value = shipment.weight || 1.50;
    
    if (shipment.estimated_delivery_date) {
      document.getElementById("fulfillment-est-delivery").value = new Date(shipment.estimated_delivery_date).toISOString().split('T')[0];
    } else {
      document.getElementById("fulfillment-est-delivery").value = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    document.getElementById("fulfillment-pack-image").value = shipment.packing_image_url || "";
  } else {
    document.getElementById("pack-check-ready").checked = (order.status === "processing");
    document.getElementById("pack-check-packed").checked = false;
    document.getElementById("pack-check-qc").checked = false;
    document.getElementById("fulfillment-weight").value = 1.50;
    document.getElementById("fulfillment-est-delivery").value = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    document.getElementById("fulfillment-pack-image").value = "";
  }

  // Open modal
  document.getElementById("admin-fulfillment-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminCloseFulfillmentModal() {
  document.getElementById("admin-fulfillment-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

function toggleFulfillmentActionUI(actionValue) {
  const packingSection = document.getElementById("fulfillment-packing-section");
  if (actionValue === "approve") {
    packingSection.style.display = "block";
  } else {
    packingSection.style.display = "none";
  }
}

// Fulfill Form submit action
async function handleAdminFulfillmentSubmit(e) {
  e.preventDefault();

  const orderId = document.getElementById("fulfillment-form-order-id").value;
  const shipmentId = document.getElementById("fulfillment-form-shipment-id").value;
  const action = document.getElementById("fulfillment-action").value;

  const order = getOrderForShipment(orderId);
  if (!order) return;

  const adminEmail = localStorage.getItem("toyzguru_admin_email") || "admin@toyzguru.com";

  if (action === "hold") {
    // Put order on hold (means order status shifts to pending)
    if (supabase) {
      await supabase.from('orders').update({ status: "pending" }).eq('id', orderId);
    }
    order.status = "pending";
    
    // Log
    await adminSaveLog({
      action_type: 'hold',
      order_id: orderId,
      shipment_id: shipmentId || null,
      admin_user: adminEmail,
      details: `Order TG-XXXXX shifted to Hold/Pending status due to payment check review.`
    });

    adminShowToast("Order On Hold", `Order ${orderId} shifted to verification hold queue.`, "warning");
    adminCloseFulfillmentModal();
    adminRenderShipmentsTable();
    adminRenderOrdersQueue();
    return;
  }

  if (action === "reject") {
    // Cancel and Reject order
    if (order.status !== "cancelled") {
      // Restore Stock quantities
      await restoreStockForOrder(order);
      
      if (supabase) {
        await supabase.from('orders').update({ status: "cancelled" }).eq('id', orderId);
      }
      order.status = "cancelled";

      // If shipment exists, delete it or mark returned
      if (shipmentId) {
        if (supabase) {
          await supabase.from('shipments').update({ status: "returned" }).eq('id', shipmentId);
        }
        const match = shipmentsState.find(s => s.id === shipmentId);
        if (match) match.status = "returned";
      }

      await adminSaveLog({
        action_type: 'reject',
        order_id: orderId,
        shipment_id: shipmentId || null,
        admin_user: adminEmail,
        details: `Order rejected and cancelled by Admin. Quantities restored to inventory stock.`
      });

      adminShowToast("Order Cancelled", `Order ${orderId} rejected and catalog stock restored.`, "danger");
    }
    adminCloseFulfillmentModal();
    adminRenderShipmentsTable();
    adminRenderOrdersQueue();
    return;
  }

  if (action === "approve") {
    // Approve order (and generate Shipment ID / tracking values if not already existed)
    let isNewApproval = false;
    let finalShipId = shipmentId;
    let finalTracking = "";
    
    const checkReady = document.getElementById("pack-check-ready").checked;
    const checkPacked = document.getElementById("pack-check-packed").checked;
    const checkQc = document.getElementById("pack-check-qc").checked;
    const weight = parseFloat(document.getElementById("fulfillment-weight").value);
    const estDelivery = document.getElementById("fulfillment-est-delivery").value;
    const packingImage = document.getElementById("fulfillment-pack-image").value;

    let shipmentStatus = "ready_to_pack";
    if (checkQc) shipmentStatus = "quality_checked";
    else if (checkPacked) shipmentStatus = "packed";
    else if (checkReady) shipmentStatus = "ready_to_pack";

    let shipment = null;
    if (shipmentId) {
      shipment = shipmentsState.find(s => s.id === shipmentId);
    }

    if (!shipment) {
      isNewApproval = true;
      finalShipId = `SH-${Math.floor(10000 + Math.random() * 90000)}`;
      finalTracking = `TG-${Math.floor(10000 + Math.random() * 90000)}`;
      
      shipment = {
        id: finalShipId,
        order_id: orderId,
        tracking_number: finalTracking,
        courier_id: null,
        courier_name: "Pending Assignment",
        weight: weight,
        status: shipmentStatus,
        packing_image_url: packingImage || null,
        proof_of_delivery_url: null,
        estimated_delivery_date: estDelivery ? new Date(estDelivery).toISOString() : null,
        dispatch_date: null,
        approved_at: new Date().toISOString(),
        approved_by: adminEmail,
        created_at: new Date().toISOString()
      };
    } else {
      // Update existing
      shipment.status = shipmentStatus;
      shipment.weight = weight;
      shipment.estimated_delivery_date = estDelivery ? new Date(estDelivery).toISOString() : null;
      shipment.packing_image_url = packingImage || null;
      finalTracking = shipment.tracking_number;
    }

    // Sync order status
    if (order.status === "pending") {
      // Reduce Stock quantities since it was pending (and stock wasn't subtracted before, or double check)
      await reduceStockForOrder(order);
      
      if (supabase) {
        await supabase.from('orders').update({ status: "processing" }).eq('id', orderId);
      }
      order.status = "processing";
    }

    // Save
    await adminSaveShipment(shipment);

    // Save tracking event
    const statusLabelText = shipmentStatus.toUpperCase().replace(/_/g, ' ');
    await adminSaveTrackingEvent({
      shipment_id: finalShipId,
      status: shipmentStatus,
      location: "Warehouse Hub",
      description: isNewApproval 
        ? `Order verified and approved. Cargo weight logged at ${weight} kg.`
        : `Warehouse packaging status updated to: ${statusLabelText}.`
    });

    // Save audit log
    await adminSaveLog({
      action_type: 'approval',
      order_id: orderId,
      shipment_id: finalShipId,
      admin_user: adminEmail,
      details: isNewApproval 
        ? `Approved Order. Generated Shipment ${finalShipId} and Tracking ${finalTracking}.`
        : `Updated Shipment ${finalShipId} packaging state checklist details.`
    });

    // Zoho SMTP email alerts
    if (isNewApproval) {
      await sendZohoFulfillmentAlert(order, shipment, "approved");
    } else if (shipmentStatus === "packed" || shipmentStatus === "quality_checked") {
      await sendZohoFulfillmentAlert(order, shipment, "packed");
    }

    adminShowToast("Fulfillment Updated", `Shipment details successfully synced in core logs.`, "success");
    adminCloseFulfillmentModal();
    adminRenderShipmentsTable();
    adminRenderOrdersQueue();
  }
}

// Stock Helpers
async function restoreStockForOrder(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  for (const item of items) {
    const match = (window.productsState || []).find(p => p.id === item.productId);
    if (match) {
      const newStock = match.stock + item.quantity;
      match.stock = newStock;
      if (supabase) {
        try {
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        } catch(ex) { console.error("Stock update error:", ex); }
      }
    }
  }
  if (window.saveProducts) await window.saveProducts();
}

async function reduceStockForOrder(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  for (const item of items) {
    const match = (window.productsState || []).find(p => p.id === item.productId);
    if (match) {
      const newStock = Math.max(0, match.stock - item.quantity);
      match.stock = newStock;
      if (supabase) {
        try {
          await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
        } catch(ex) { console.error("Stock update error:", ex); }
      }
    }
  }
  if (window.saveProducts) await window.saveProducts();
}

// Courier Dispatch Modals
function adminOpenDispatchModal(shipmentId) {
  const shipment = shipmentsState.find(s => s.id === shipmentId);
  if (!shipment) return;

  const order = getOrderForShipment(shipment.order_id);

  document.getElementById("dispatch-form-shipment-id").value = shipmentId;
  document.getElementById("dispatch-tracking-number").value = shipment.tracking_number;
  document.getElementById("dispatch-weight").value = shipment.weight || 1.50;

  // Select active courier dropdown
  const courierSelect = document.getElementById("dispatch-courier");
  if (shipment.courier_name && shipment.courier_name !== "Pending Assignment") {
    courierSelect.value = shipment.courier_name;
  } else {
    courierSelect.selectedIndex = 0;
  }

  // Prefill manifest
  document.getElementById("manifest-date").textContent = new Date().toLocaleDateString();
  document.getElementById("manifest-state").textContent = order?.address ? order.address.split(",").slice(-3,-2)[0] || "Telangana" : "Telangana";
  document.getElementById("manifest-weight").textContent = shipment.weight || 1.50;

  // Open modal
  document.getElementById("admin-dispatch-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminCloseDispatchModal() {
  document.getElementById("admin-dispatch-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

async function handleAdminDispatchSubmit(e) {
  e.preventDefault();

  const shipmentId = document.getElementById("dispatch-form-shipment-id").value;
  const courierName = document.getElementById("dispatch-courier").value;
  const trackingNumber = document.getElementById("dispatch-tracking-number").value.trim();
  const weight = parseFloat(document.getElementById("dispatch-weight").value);

  const shipment = shipmentsState.find(s => s.id === shipmentId);
  if (!shipment) return;

  const order = getOrderForShipment(shipment.order_id);
  const adminEmail = localStorage.getItem("toyzguru_admin_email") || "admin@toyzguru.com";

  // Update shipment
  shipment.status = "dispatched";
  shipment.courier_name = courierName;
  shipment.tracking_number = trackingNumber;
  shipment.weight = weight;
  shipment.dispatch_date = new Date().toISOString();

  // Update order status to shipped
  if (order) {
    if (supabase) {
      await supabase.from('orders').update({ status: "shipped" }).eq('id', order.id);
    }
    order.status = "shipped";
  }

  await adminSaveShipment(shipment);

  // Tracking event
  await adminSaveTrackingEvent({
    shipment_id: shipmentId,
    status: "dispatched",
    location: "Warehouse Dispatched Hub",
    description: `Cargo container dispatched via ${courierName}. Tracking code set to ${trackingNumber}.`
  });

  // Audit log
  await adminSaveLog({
    action_type: 'dispatch',
    order_id: shipment.order_id,
    shipment_id: shipmentId,
    admin_user: adminEmail,
    details: `Cargo dispatched via ${courierName}. Manifest generated for weight ${weight} kg.`
  });

  // Zoho SMTP Alert
  if (order) {
    await sendZohoFulfillmentAlert(order, shipment, "dispatched");
  }

  adminShowToast("Cargo Dispatched", `Shipment shifted to courier logistics network.`, "success");
  adminCloseDispatchModal();
  adminRenderShipmentsTable();
  adminRenderOrdersQueue();
}

// inline quick status updates from Active Shipments Grid
async function adminUpdateShipmentStatus(shipmentId, newStatus) {
  const shipment = shipmentsState.find(s => s.id === shipmentId);
  if (!shipment) return;

  const order = getOrderForShipment(shipment.order_id);
  const adminEmail = localStorage.getItem("toyzguru_admin_email") || "admin@toyzguru.com";

  let podUrl = null;

  if (newStatus === "delivered") {
    // Optional POD prompt - prompt for details
    const uploadPrompt = await window.showCustomDialog("Deliver Confirmation", "Would you like to log an optional Proof of Delivery (POD) image URL for cargo receipt verification?", "info", true);
    if (uploadPrompt) {
      // custom textbox prompt
      const result = prompt("Enter Proof of Delivery (POD) image URL:");
      if (result) podUrl = result.trim();
    }
    
    // update order status
    if (order) {
      if (supabase) {
        await supabase.from('orders').update({ status: "delivered" }).eq('id', order.id);
      }
      order.status = "delivered";
    }
    shipment.proof_of_delivery_url = podUrl || null;
  }

  if (newStatus === "returned") {
    // RTO - Restore stock and cancel order
    if (order) {
      await restoreStockForOrder(order);
      if (supabase) {
        await supabase.from('orders').update({ status: "cancelled" }).eq('id', order.id);
      }
      order.status = "cancelled";
    }
  }

  shipment.status = newStatus;
  await adminSaveShipment(shipment);

  // Log tracking event
  await adminSaveTrackingEvent({
    shipment_id: shipmentId,
    status: newStatus,
    location: newStatus === "delivered" ? "Buyer Address" : "Local Courier Hub",
    description: newStatus === "delivered" 
      ? ` cargo successfully delivered and signed. Optional POD logged: ${podUrl || 'None'}`
      : `Transit status shifted to: ${newStatus.toUpperCase().replace(/_/g, ' ')}`
  });

  // Audit log
  await adminSaveLog({
    action_type: 'status_update',
    order_id: shipment.order_id,
    shipment_id: shipmentId,
    admin_user: adminEmail,
    details: `Updated shipment status to: ${newStatus}.`
  });

  // Zoho smtp Alert
  if (order) {
    if (newStatus === "delivered") {
      await sendZohoFulfillmentAlert(order, shipment, "delivered");
    } else if (newStatus === "out_for_delivery") {
      await sendZohoFulfillmentAlert(order, shipment, "out_for_delivery");
    }
  }

  adminShowToast("Shipment Updated", `Shipment status set to ${newStatus.toUpperCase().replace(/_/g, ' ')}`, "success");
  adminRenderShipmentsTable();
  adminRenderOrdersQueue();
}

// Vector-scalable Barcode Generator (Code 39 standard)
function getCode39SVG(text) {
  const chars = {
    '0': '101001101101', '1': '110100101011', '2': '101100101011', '3': '110110010101',
    '4': '101001101011', '5': '110100110101', '6': '101100110101', '7': '101001011011',
    '8': '110100101101', '9': '101100101101', 'A': '110101001011', 'B': '101101001011',
    'C': '110110100101', 'D': '101011001011', 'E': '110101100101', 'F': '101101100101',
    'G': '101010011011', 'H': '110101001101', 'I': '101101001101', 'J': '101011001101',
    'K': '110101010011', 'L': '101101010011', 'M': '110110101001', 'N': '101011010011',
    'O': '110101101001', 'P': '101101101001', 'Q': '101010110011', 'R': '110101011001',
    'S': '101101011001', 'T': '101011011001', 'U': '110010101011', 'V': '100110101011',
    'W': '110011010101', 'X': '100101101011', 'Y': '110010110101', 'Z': '100110110101',
    '-': '100101011011', '.': '110010101101', ' ': '100110101101', '*': '100101101101',
    '+': '100100100101', '/': '100100101001', '%': '101001001001', '$': '100100100101'
  };
  const uppercase = ("*" + text.toUpperCase() + "*").split("");
  let binary = "";
  uppercase.forEach(c => {
    binary += (chars[c] || chars[' ']) + "0";
  });
  
  let svg = `<svg viewBox="0 0 ${binary.length * 2} 80" width="100%" height="80" xmlns="http://www.w3.org/2000/svg">`;
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === '1') {
      svg += `<rect x="${i * 2}" y="0" width="2" height="80" fill="#000000" />`;
    }
  }
  svg += `</svg>`;
  return svg;
}

// Print Router Engine
function adminPrintDocument(shipmentId, docType) {
  const shipment = shipmentsState.find(s => s.id === shipmentId);
  if (!shipment) return;
  const order = getOrderForShipment(shipment.order_id);
  if (!order) return;

  const trackingUrl = `${window.location.origin}${window.location.pathname}#tracking?id=${shipment.id}`;

  // Log print
  adminSaveLog({
    action_type: 'print',
    order_id: order.id,
    shipment_id: shipment.id,
    admin_user: localStorage.getItem("toyzguru_admin_email") || "admin@toyzguru.com",
    details: `Printed fulfillment layout document: ${docType.toUpperCase()}`
  });

  let w = window.open("", "_blank", "width=800,height=600");
  let html = "";
  
  if (docType === "zebra") {
    html = generateZebraLabelHTML(shipment, order, trackingUrl);
  } else if (docType === "qr") {
    html = generateQRStickerHTML(shipment, order, trackingUrl);
  } else if (docType === "invoice") {
    html = generateInvoiceHTML(order);
  } else if (docType === "slip") {
    html = generatePackingSlipHTML(shipment, order);
  }

  w.document.write(html);
  w.document.close();

  // refresh printing table count
  setTimeout(() => {
    w.print();
    adminRenderPrintingTable();
  }, 600);
}

// Dynamic Document Template HTML String Writers
function generateZebraLabelHTML(shipment, order, trackingUrl) {
  const items = Array.isArray(order.items) ? order.items : [];
  const skusText = items.map(i => `${i.productId.toUpperCase()} (${i.option || '—'}) x${i.quantity}`).join(", ");
  const cleanAddress = getCleanDeliveryAddress(order);
  const { name: custName, phone: custPhone } = extractCustomerInfo(order);
  const barcodeSvg = getCode39SVG(shipment.tracking_number);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(trackingUrl)}`;

  return `
    <html>
      <head>
        <title>Zebra 4x6 Label - ${shipment.id}</title>
        <style>
          @page { size: 4in 6in; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 0.15in;
            width: 3.7in;
            height: 5.7in;
            box-sizing: border-box;
            border: 3px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .title-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #000;
            padding-bottom: 0.05in;
          }
          .logo {
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 0.05em;
          }
          .ship-tag {
            font-size: 8pt;
            border: 1px solid #000;
            padding: 2px 4px;
            font-weight: bold;
          }
          .address-box {
            font-size: 8.5pt;
            line-height: 1.25;
            margin-top: 0.08in;
          }
          .skus-box {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 0.05in 0;
            font-size: 8pt;
            margin: 0.05in 0;
          }
          .barcode-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 0.05in 0;
          }
          .qr-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 2px solid #000;
            padding-top: 0.05in;
          }
          .details-info {
            font-size: 7.5pt;
            line-height: 1.3;
          }
        </style>
      </head>
      <body>
        <div>
          <div class="title-row">
            <span class="logo">TOYZGURU</span>
            <span class="ship-tag">PRIORITY POST</span>
          </div>

          <div style="font-size:8pt; margin-top:0.05in;">
            <strong>TO:</strong>
            <div class="address-box">
              <strong>${custName}</strong><br>
              ${cleanAddress}<br>
              <strong>Ph: ${custPhone}</strong>
            </div>
          </div>
        </div>

        <div class="skus-box">
          <strong>ITEMS:</strong> ${skusText}
        </div>

        <div class="barcode-container">
          ${barcodeSvg}
          <div style="font-size: 7.5pt; font-weight: bold; margin-top:2px;">${shipment.tracking_number}</div>
        </div>

        <div class="qr-row">
          <div class="details-info">
            <strong>ORDER ID:</strong> ${order.id}<br>
            <strong>SHIPMENT:</strong> ${shipment.id}<br>
            <strong>COURIER:</strong> ${shipment.courier_name}<br>
            <strong>WT:</strong> ${shipment.weight} kg | <strong>DATE:</strong> ${new Date().toLocaleDateString()}
          </div>
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 75px; height: 75px;" />
        </div>
      </body>
    </html>
  `;
}

function generateQRStickerHTML(shipment, order, trackingUrl) {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(trackingUrl)}`;
  return `
    <html>
      <head>
        <title>QR Sticker - ${shipment.id}</title>
        <style>
          @page { size: 3in 3in; margin: 0; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0.15in;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            border: 2px solid #000;
            box-sizing: border-box;
            width: 2.8in;
            height: 2.8in;
          }
        </style>
      </head>
      <body>
        <div style="font-size: 9pt; font-weight: bold; margin-bottom: 4px; letter-spacing:0.05em;">TOYZGURU COURIER ID</div>
        <img src="${qrCodeUrl}" style="width: 130px; height: 130px;" />
        <div style="font-size: 7.5pt; font-family:monospace; font-weight: bold; margin-top: 6px;">
          ORDER: ${order.id}<br>
          SHIPMENT: ${shipment.id}
        </div>
      </body>
    </html>
  `;
}

function generateInvoiceHTML(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const cleanAddress = getCleanDeliveryAddress(order);
  const { name: custName, phone: custPhone } = extractCustomerInfo(order);
  
  let gstinVal = window.storeSettings?.seller_gstin || "36AAAAA1111A1Z1";
  let stateVal = window.storeSettings?.business_state || "Telangana";

  let itemsHTML = items.map((i, idx) => {
    const total = i.price * i.quantity;
    const cgstPct = i.cgst_pct || 0;
    const sgstPct = i.sgst_pct || 0;
    const igstPct = i.igst_pct || 0;
    const cgstAmt = i.cgst_amount || 0;
    const sgstAmt = i.sgst_amount || 0;
    const igstAmt = i.igst_amount || 0;
    const totalTax = i.total_tax_amount || 0;
    const taxableVal = total - totalTax;

    return `
      <tr style="border-bottom:1px solid #ddd;">
        <td style="padding: 8px; text-align:center;">${idx + 1}</td>
        <td style="padding: 8px;"><strong>${i.title}</strong><br><small>Option: ${i.option} | HSN: ${i.hsn_code || '9503'}</small></td>
        <td style="padding: 8px; text-align:center;">₹${taxableVal.toFixed(2)}</td>
        <td style="padding: 8px; text-align:center;">${i.quantity}</td>
        <td style="padding: 8px; text-align:right;">₹${total.toFixed(2)}</td>
      </tr>
    `;
  }).join("");

  return `
    <html>
      <head>
        <title>Invoice - ${order.id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 30px; color: #333; line-height: 1.4; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #8b5cf6; padding-bottom: 15px; }
          .invoice-title { font-size: 24pt; font-weight: bold; color: #8b5cf6; font-family: sans-serif; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
          .section-title { font-size: 11pt; color: #8b5cf6; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-bottom: 8px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; }
          .table th { background: #f5f5f5; padding: 10px; font-weight: bold; border: 1px solid #ddd; }
          .table td { padding: 10px; border: 1px solid #ddd; }
          .totals-table { width: 300px; float: right; margin-top: 20px; border-collapse: collapse; font-size: 10pt; }
          .totals-table td { padding: 8px; border: 1px solid #ddd; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="invoice-title">TOYZGURU</div>
            <p style="font-size: 9pt; margin: 3px 0;">Premium Collectors Vault</p>
          </div>
          <div style="text-align: right; font-size: 9pt;">
            <strong>TAX INVOICE</strong><br>
            Invoice No: INV-${order.id.replace('TG-','')}<br>
            Date: ${new Date(order.date).toLocaleDateString()}<br>
            Seller GSTIN: ${gstinVal}
          </div>
        </div>

        <div class="grid-2" style="font-size: 9pt;">
          <div>
            <div class="section-title">Seller Address</div>
            <strong>ToyzGuru Logistics Ltd.</strong><br>
            Level 3, Galaxy Hub, Madhapur<br>
            Hyderabad, ${stateVal} - 500081<br>
            Email: sales@toyzguru.in
          </div>
          <div>
            <div class="section-title">Billing & Shipping Address</div>
            <strong>${custName}</strong><br>
            ${cleanAddress}<br>
            Contact: ${custPhone}<br>
            ${order.buyer_gstin ? `<strong>Buyer GSTIN:</strong> ${order.buyer_gstin}` : ""}
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Description of Goods</th>
              <th style="width: 100px;">Taxable Value</th>
              <th style="width: 60px;">Qty</th>
              <th style="width: 120px; text-align:right;">Gross Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="width: 100%; overflow: hidden;">
          <table class="totals-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${Number(order.subtotal).toFixed(2)}</td>
            </tr>
            ${order.discount > 0 ? `<tr><td>Discount</td><td style="text-align: right; color:#ef4444;">-₹${Number(order.discount).toFixed(2)}</td></tr>` : ""}
            <tr>
              <td>Tax Charges (GST)</td>
              <td style="text-align: right;">₹${Number(order.total_tax_amount || order.tax || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>Shipping Fee</td>
              <td style="text-align: right;">₹${Number(order.shipping).toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold; background: #f5f5f5;">
              <td>Total Paid</td>
              <td style="text-align: right; color:#8b5cf6;">₹${Number(order.total).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 50px; font-size: 8.5pt; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 10px;">
          This is an electronically generated tax invoice. No physical signature required. Thank you for collecting with ToyzGuru.
        </div>
      </body>
    </html>
  `;
}

function generatePackingSlipHTML(shipment, order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const cleanAddress = getCleanDeliveryAddress(order);
  const { name: custName, phone: custPhone } = extractCustomerInfo(order);
  const barcodeSvg = getCode39SVG(shipment.id);

  let itemsHTML = items.map((i, idx) => `
    <tr>
      <td style="padding: 10px; text-align:center;">${idx + 1}</td>
      <td style="padding: 10px; font-family: monospace;">${i.productId}</td>
      <td style="padding: 10px;"><strong>${i.title}</strong> - ${i.option}</td>
      <td style="padding: 10px; text-align:center; font-weight:bold; font-size:12pt;">${i.quantity}</td>
      <td style="padding: 10px; text-align:center;">[ &nbsp; ]</td>
    </tr>
  `).join("");

  return `
    <html>
      <head>
        <title>Packing Slip - ${shipment.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; }
          .table th { background: #eee; padding: 10px; border: 1px solid #ccc; }
          .table td { padding: 10px; border: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div style="font-size: 20pt; font-weight: bold;">TOYZGURU PACKING SLIP</div>
            <p style="font-size: 9pt; margin: 3px 0;">Warehouse Cargo Routing slip</p>
          </div>
          <div style="width: 200px;">
            ${barcodeSvg}
            <div style="text-align: center; font-family: monospace; font-size: 8pt; margin-top: 2px;">${shipment.id}</div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px; font-size: 9.5pt; margin-bottom: 20px;">
          <div>
            <strong>SHIP TO:</strong><br>
            <strong>${custName}</strong><br>
            ${cleanAddress}<br>
            Phone: ${custPhone}
          </div>
          <div>
            <strong>SHIPMENT DETAILS:</strong><br>
            Order ID: ${order.id}<br>
            Tracking ID: ${shipment.tracking_number}<br>
            Courier Agency: ${shipment.courier_name}<br>
            Package Weight: ${shipment.weight} kg
          </div>
        </div>

        <h3 style="border-bottom: 1px solid #333; padding-bottom: 4px; margin-top: 30px; font-size: 12pt;">Warehouse Picking Checklist</h3>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th style="width: 120px;">SKU / ID</th>
              <th>Product Details</th>
              <th style="width: 80px;">Qty Required</th>
              <th style="width: 80px;">Picked Check</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div style="margin-top: 40px; border: 1px dashed #777; padding: 15px; font-size: 9pt; border-radius:6px; background:#fafafa;">
          <strong>Warehouse Assembly Directives:</strong><br>
          1. Match product titles and options with collector specifications carefully.<br>
          2. Double check cartoon box wraps for high-value watches and diecast collectibles.<br>
          3. Affix the printed Zebra shipping label to the top face of the carton.<br>
          4. Confirm QC checkmarks in the system operations grid before dispatch handoff.
        </div>
      </body>
    </html>
  `;
}

// Zoho SMTP Email Alert dispatcher
async function sendZohoFulfillmentAlert(order, shipment, stage) {
  if (!window.sendEmailViaServer) return;

  const orderId = order.id;
  const shipId = shipment.id;
  const trackingNumber = shipment.tracking_number;
  const courier = shipment.courier_name;
  const trackingUrl = `${window.location.origin}${window.location.pathname}#tracking?id=${shipId}`;
  const estDateStr = shipment.estimated_delivery_date 
    ? new Date(shipment.estimated_delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  let subject = "";
  let heading = "";
  let detailsText = "";

  if (stage === "approved") {
    subject = `Order Approved & Shipment Initiated #${orderId} - ToyzGuru`;
    heading = "Order Approved & In Process";
    detailsText = `Great news! Your payment has been cleared, and your order has been officially approved. We have created a shipment file (Shipment ID: <strong>${shipId}</strong>) and generated tracking number <strong>${trackingNumber}</strong>. Estimated delivery: <strong>${estDateStr}</strong>.`;
  } else if (stage === "packed") {
    subject = `Order Boxed & QC Passed #${orderId} - ToyzGuru`;
    heading = "Cargo Secured & QC Checked";
    detailsText = `Your collectibles have been carefully boxed in secure vault packaging and passed our quality check inspection. Ready for dispatch handoff to courier partners.`;
  } else if (stage === "dispatched") {
    subject = `Order Cargo Dispatched #${orderId} - ToyzGuru`;
    heading = "Shipment Dispatched";
    detailsText = `Your cargo (Shipment: <strong>${shipId}</strong>) has been handed over to <strong>${courier}</strong> under Tracking ID <strong>${trackingNumber}</strong>. Estimated delivery: <strong>${estDateStr}</strong>.<br><br>
    <a href="${trackingUrl}" style="display:inline-block; padding:10px 20px; background:#8b5cf6; color:#fff; text-decoration:none; border-radius:6px; font-weight:bold; margin-top:10px;">Track Live Status</a>`;
  } else if (stage === "out_for_delivery") {
    subject = `Cargo Out for Delivery #${orderId} - ToyzGuru`;
    heading = "Out For Delivery Today";
    detailsText = `Your ToyzGuru cargo (Shipment: <strong>${shipId}</strong>) has reached your local hub and is out for delivery today via <strong>${courier}</strong>. Please keep your contact number active.`;
  } else if (stage === "delivered") {
    subject = `Cargo Successfully Delivered #${orderId} - ToyzGuru`;
    heading = "Shipment Delivered";
    detailsText = `Congratulations! Your ToyzGuru shipment <strong>${shipId}</strong> has been successfully delivered and signed. Thank you for collecting with ToyzGuru.<br>
    ${shipment.proof_of_delivery_url ? `<br><strong>Proof of Delivery URL:</strong> <a href="${shipment.proof_of_delivery_url}" style="color:#8b5cf6;">View POD image</a>` : ""}`;
  }

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #080b11; color: #f3f4f6; padding: 2.5rem; border-radius: 16px; max-width: 620px; margin: 0 auto; border: 1px solid rgba(139,92,246,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #ffffff; font-size: 1.8rem; margin: 0; font-weight: 700; letter-spacing: -0.02em;">ToyzGuru</h2>
        <p style="color: #8b5cf6; font-size: 0.85rem; margin: 0.25rem 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Logistics Fulfillment Network</p>
      </div>

      <div style="background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.75rem; text-align: center;">
        <p style="margin: 0 0 0.35rem 0; color: #a78bfa; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">${heading} ✓</p>
        <p style="margin: 0; color: #ffffff; font-size: 1.15rem; font-weight: 700; font-family: monospace;">#${orderId}</p>
      </div>

      <p style="color: #9ca3af; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
        Hi <strong style="color: #ffffff;">${order.name || "Collector"}</strong>,<br><br>
        ${detailsText}
      </p>

      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; margin-top:20px;">
        <div style="flex: 1; min-width: 180px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 1rem;">
          <p style="margin: 0 0 0.3rem 0; color: #6b7280; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;">Delivery Service</p>
          <p style="margin: 0; color: #e5e7eb; font-size: 0.88rem; line-height: 1.5;">${courier || 'Pending Partner'}<br>Code: ${trackingNumber || '—'}</p>
        </div>
        <div style="flex: 1; min-width: 180px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 1rem;">
          <p style="margin: 0 0 0.3rem 0; color: #6b7280; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;">Est. Delivery</p>
          <p style="margin: 0; color: #e5e7eb; font-size: 0.88rem;">${estDateStr}</p>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.07); margin-bottom: 1.5rem;" />

      <p style="color: #6b7280; font-size: 0.8rem; text-align: center; margin: 0; line-height: 1.6;">
        Questions? Contact our logistics desk at <a href="mailto:support@toyzguru.in" style="color: #8b5cf6;">support@toyzguru.in</a><br>
        &copy; 2026 ToyzGuru Premium Store
      </p>
    </div>
  `;

  try {
    await window.sendEmailViaServer({
      to: order.email,
      subject,
      html,
      text: `${heading}!\n\nOrder ID: ${orderId}\n\nHi ${order.name || 'Collector'},\n\nYour order has reached the stage: ${heading}.\nCourier: ${courier}\nTracking: ${trackingNumber}\nEst Date: ${estDateStr}\n\nsupport@toyzguru.in`
    });
  } catch(ex) {
    console.warn("Fulfillment alert email failed (non-blocking):", ex);
  }
}

// Attach new bindings to window so inline onclick elements can read them
window.adminSwitchDeliveryTab = adminSwitchDeliveryTab;
window.adminOpenFulfillmentModal = adminOpenFulfillmentModal;
window.adminCloseFulfillmentModal = adminCloseFulfillmentModal;
window.handleAdminFulfillmentSubmit = handleAdminFulfillmentSubmit;
window.toggleFulfillmentActionUI = toggleFulfillmentActionUI;
window.adminOpenDispatchModal = adminOpenDispatchModal;
window.adminCloseDispatchModal = adminCloseDispatchModal;
window.handleAdminDispatchSubmit = handleAdminDispatchSubmit;
window.adminUpdateShipmentStatus = adminUpdateShipmentStatus;
window.adminPrintDocument = adminPrintDocument;
window.adminRenderShipmentsTable = adminRenderShipmentsTable;
window.adminRenderPrintingTable = adminRenderPrintingTable;
window.adminRenderAnalyticsTab = adminRenderAnalyticsTab;
window.adminRenderLogsTable = adminRenderLogsTable;

function adminRenderStatesTable() {
  const tableBody = document.getElementById("admin-delivery-states-body");
  if (!tableBody) return;

  const searchQuery = document.getElementById("admin-state-search")?.value.trim().toLowerCase() || "";
  const charges = window.stateChargesState || [];

  const filtered = charges.filter(c => c.state_name.toLowerCase().includes(searchQuery));

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
          No states match search query.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(c => `
    <tr>
      <td style="font-weight: 600;">${c.state_name}</td>
      <td style="font-weight: 700; color: var(--text-primary);">₹${Number(c.normal_price).toFixed(2)}</td>
      <td style="font-weight: 700; color: var(--color-brand);">₹${Number(c.express_price).toFixed(2)}</td>
      <td>
        <button class="crud-btn crud-edit" onclick="adminEditStateTrigger('${c.state_name.replace(/'/g, "\\'")}')" title="Edit State Shipping Charges">
          <i data-feather="edit" style="width: 14px; height: 14px;"></i>
        </button>
      </td>
    </tr>
  `).join("");

  feather.replace();
}

function adminRenderCouriersTable() {
  const tableBody = document.getElementById("admin-couriers-body");
  if (!tableBody) return;

  const couriers = window.couriersState || [];

  if (couriers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
          No courier agencies registered.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = couriers.map(c => {
    const statusClass = c.is_active ? "status-delivered" : "status-cancelled";
    const statusText = c.is_active ? "ACTIVE" : "INACTIVE";
    const statesCount = Array.isArray(c.assigned_states) ? c.assigned_states.length : 0;

    let statesSummary = "None";
    if (statesCount > 0) {
      if (statesCount === (window.stateChargesState ? window.stateChargesState.length : 0)) {
        statesSummary = "All States";
      } else {
        statesSummary = c.assigned_states.slice(0, 3).join(", ");
        if (statesCount > 3) {
          statesSummary += ` +${statesCount - 3} more`;
        }
      }
    }

    return `
      <tr>
        <td style="font-weight: 600;">${c.name}</td>
        <td>
          <span class="order-status-badge ${statusClass}">${statusText}</span>
        </td>
        <td style="font-size: 0.8rem; max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${c.assigned_states.join(", ")}">
          ${statesSummary}
        </td>
        <td>
          <div class="crud-btn-wrap">
            <button class="crud-btn crud-edit" onclick="adminEditCourierTrigger('${c.id}')" title="Edit Courier Agency">
              <i data-feather="edit" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="crud-btn crud-delete" onclick="adminDeleteCourierTrigger('${c.id}')" title="Delete Courier Agency">
              <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  feather.replace();
}

function adminEditStateTrigger(stateName) {
  const chargeObj = window.stateChargesState.find(s => s.state_name === stateName);
  if (!chargeObj) return;

  document.getElementById("admin-form-state-name").value = chargeObj.state_name;
  document.getElementById("admin-state-modal-title").textContent = `Configure Shipping: ${chargeObj.state_name}`;
  document.getElementById("admin-form-state-normal").value = chargeObj.normal_price;
  document.getElementById("admin-form-state-express").value = chargeObj.express_price;

  document.getElementById("admin-state-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminEditCourierTrigger(courierId) {
  const courier = window.couriersState.find(c => c.id === courierId);
  if (!courier) return;

  document.getElementById("admin-form-courier-id").value = courier.id;
  document.getElementById("admin-courier-modal-title").textContent = `Edit Courier: ${courier.name}`;
  document.getElementById("admin-form-courier-name").value = courier.name;
  document.getElementById("admin-form-courier-active").checked = courier.is_active;

  adminRenderStatesChecklist(courier.assigned_states);

  document.getElementById("admin-courier-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminEditCourierCreateTrigger() {
  document.getElementById("admin-form-courier-id").value = "";
  document.getElementById("admin-courier-modal-title").textContent = "Add Courier Agency";
  document.getElementById("admin-courier-form").reset();
  document.getElementById("admin-form-courier-active").checked = true;

  adminRenderStatesChecklist([]);

  document.getElementById("admin-courier-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminRenderStatesChecklist(selectedStates = []) {
  const checklist = document.getElementById("admin-courier-states-checklist");
  if (!checklist) return;

  const states = window.stateChargesState || [];
  checklist.innerHTML = states.map(s => {
    const isChecked = selectedStates.includes(s.state_name) ? "checked" : "";
    return `
      <label style="display: flex; align-items: center; gap: 0.35rem; cursor: pointer; font-size: 0.8rem; padding: 0.25rem;">
        <input type="checkbox" name="courier-states" value="${s.state_name}" ${isChecked} style="accent-color: var(--color-brand); width: 14px; height: 14px;">
        <span>${s.state_name}</span>
      </label>
    `;
  }).join("");
}

async function handleAdminStateFormSubmit(e) {
  e.preventDefault();

  const stateName = document.getElementById("admin-form-state-name").value;
  const normalPrice = parseFloat(document.getElementById("admin-form-state-normal").value);
  const expressPrice = parseFloat(document.getElementById("admin-form-state-express").value);

  const chargeObj = window.stateChargesState.find(s => s.state_name === stateName);
  if (chargeObj) {
    chargeObj.normal_price = normalPrice;
    chargeObj.express_price = expressPrice;

    try {
      await window.saveStateCharges();
      adminShowToast("Charges Saved", `Updated delivery rates for ${stateName}`, "success");
      adminCloseStateModal();
      adminRenderStatesTable();
    } catch (err) {
      adminShowToast("Save Failed", err.message || "Failed to update delivery rates", "danger");
    }
  }
}

async function handleAdminCourierFormSubmit(e) {
  e.preventDefault();

  const courierId = document.getElementById("admin-form-courier-id").value;
  const name = document.getElementById("admin-form-courier-name").value.trim();
  const is_active = document.getElementById("admin-form-courier-active").checked;

  const checkedBoxes = document.querySelectorAll('input[name="courier-states"]:checked');
  const assigned_states = Array.from(checkedBoxes).map(cb => cb.value);

  if (assigned_states.length === 0) {
    adminShowToast("Selection Required", "Please assign at least one state to the courier agency.", "warning");
    return;
  }

  try {
    if (courierId) {
      const match = window.couriersState.find(c => c.id === courierId);
      if (match) {
        match.name = name;
        match.is_active = is_active;
        match.assigned_states = assigned_states;
      }
      adminShowToast("Courier Saved", `Updated agency: ${name}`, "success");
    } else {
      const newId = `c_${Math.floor(1000 + Math.random() * 9000)}`;
      const newCourierObj = {
        id: newId,
        name: name,
        assigned_states: assigned_states,
        is_active: is_active
      };

      if (window.supabase) {
        try {
          const { data, error } = await supabase.from('couriers').insert(newCourierObj).select();
          if (error) throw error;
          if (data && data[0]) {
            newCourierObj.id = data[0].id;
          }
        } catch (supaErr) {
          console.warn("Failed to insert courier into Supabase, saving locally:", supaErr);
        }
      }
      window.couriersState.push(newCourierObj);
      adminShowToast("Courier Created", `Added courier agency: ${name}`, "success");
    }

    await window.saveCouriers();
    adminCloseCourierModal();
    adminRenderCouriersTable();
  } catch (err) {
    await window.showCustomDialog("Save Failed", err.message || "Failed to save courier details.", "danger");
  }
}

async function adminDeleteCourierTrigger(courierId) {
  const courier = window.couriersState.find(c => c.id === courierId);
  if (!courier) return;

  const isConfirmed = await window.showCustomDialog("Delete Courier", `Are you sure you want to delete courier "${courier.name}"?`, "danger", true);

  if (isConfirmed) {
    try {
      if (window.supabase) {
        try {
          const { error } = await supabase.from('couriers').delete().eq('id', courierId);
          if (error) throw error;
        } catch (supaErr) {
          console.warn("Failed to delete courier from Supabase, removing locally:", supaErr);
        }
      }
      window.couriersState = window.couriersState.filter(c => c.id !== courierId);
      await window.saveCouriers();
      adminShowToast("Courier Deleted", `Removed agency ${courier.name}`, "danger");
      adminRenderCouriersTable();
    } catch (err) {
      await window.showCustomDialog("Delete Failed", err.message || "Failed to remove courier.", "danger");
    }
  }
}

function adminCloseStateModal() {
  document.getElementById("admin-state-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

function adminCloseCourierModal() {
  document.getElementById("admin-courier-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

// ================= COUPON MANAGEMENT PANEL =================

let couponsState = [];

async function adminRenderCouponsPanel() {
  await adminFetchCoupons();
  adminRenderCouponsTable();
}

async function adminFetchCoupons() {
  if (supabase) {
    try {
      const { data: remoteCoupons, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const localCoupons = JSON.parse(localStorage.getItem("toyzguru_coupons")) || [];

      if (remoteCoupons) {
        const remoteCodes = new Set(remoteCoupons.map(c => c.code.toUpperCase()));
        const localOnlyCoupons = localCoupons.filter(c => c && c.code && !remoteCodes.has(c.code.toUpperCase()));

        if (localOnlyCoupons.length > 0) {
          console.log("Syncing local coupons to Supabase:", localOnlyCoupons);
          for (const coupon of localOnlyCoupons) {
            try {
              await supabase.from('coupons').insert(coupon);
            } catch (err) {
              console.warn("Failed to sync coupon to Supabase:", coupon.code, err);
            }
          }
          // Fetch again to get the updated list from database
          const { data: updatedRemote } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
          if (updatedRemote) {
            couponsState = updatedRemote;
            localStorage.setItem("toyzguru_coupons", JSON.stringify(couponsState));
            return;
          }
        }
      }

      couponsState = remoteCoupons || [];
      localStorage.setItem("toyzguru_coupons", JSON.stringify(couponsState));
    } catch (err) {
      console.warn("Failed to fetch coupons from Supabase, falling back to local state:", err);
      couponsState = JSON.parse(localStorage.getItem("toyzguru_coupons")) || [];
    }
  } else {
    couponsState = JSON.parse(localStorage.getItem("toyzguru_coupons")) || [];
  }
}

function adminRenderCouponsTable() {
  const tableBody = document.getElementById("admin-coupons-table-body");
  if (!tableBody) return;

  if (couponsState.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          No coupons found.
        </td>
      </tr>
    `;
    renderAdminPagination(tableBody, 0, 'coupons');
    return;
  }

  // Clamp & page-slice
  const totalCpnPages = Math.max(1, Math.ceil(couponsState.length / ADMIN_PAGE_SIZE));
  adminPaginationState.coupons = Math.max(1, Math.min(adminPaginationState.coupons, totalCpnPages));
  const cpnPg = adminPaginationState.coupons;
  const cpnPageData = couponsState.slice((cpnPg - 1) * ADMIN_PAGE_SIZE, cpnPg * ADMIN_PAGE_SIZE);

  tableBody.innerHTML = cpnPageData.map(coupon => {
    const minOrderVal = coupon.min_order ? `₹${Number(coupon.min_order).toFixed(2)}` : "None";
    const maxDiscountVal = coupon.max_discount ? `₹${Number(coupon.max_discount).toFixed(2)}` : "None";
    const usageLimitVal = coupon.usage_limit ? coupon.usage_limit : "Unlimited";
    const expiresAtVal = coupon.expires_at ? new Date(coupon.expires_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never";
    const statusClass = coupon.is_active ? "status-delivered" : "status-cancelled";
    const statusText = coupon.is_active ? "ACTIVE" : "INACTIVE";
    const toggleTitle = coupon.is_active ? "Deactivate Coupon" : "Activate Coupon";
    const valueDisplay = coupon.type === 'percentage' ? `${coupon.value}%` : `₹${Number(coupon.value).toFixed(2)}`;

    return `
      <tr id="admin-coupon-row-${coupon.code}">
        <td style="font-family: monospace; font-weight: 700; color: var(--color-brand);">${coupon.code}</td>
        <td style="text-transform: capitalize; font-size: 0.85rem;">${coupon.type}</td>
        <td style="font-weight: 700;">${valueDisplay}</td>
        <td>${minOrderVal}</td>
        <td>${maxDiscountVal}</td>
        <td>${usageLimitVal}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${expiresAtVal}</td>
        <td>
          <span class="order-status-badge ${statusClass}" style="cursor: pointer;" onclick="adminToggleCouponStatus('${coupon.code}')" title="${toggleTitle}">
            ${statusText}
          </span>
        </td>
        <td>
          <div class="crud-btn-wrap">
            <button class="crud-btn crud-edit" onclick="adminEditCouponTrigger('${coupon.code}')" title="Edit Coupon">
              <i data-feather="edit" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="crud-btn crud-delete" onclick="adminDeleteCouponTrigger('${coupon.code}')" title="Delete Coupon">
              <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  renderAdminPagination(tableBody, couponsState.length, 'coupons');
  feather.replace();
}

async function adminToggleCouponStatus(code) {
  const coupon = couponsState.find(c => c.code === code);
  if (!coupon) return;

  const newStatus = !coupon.is_active;
  if (supabase) {
    try {
      const { error } = await supabase.from('coupons').update({ is_active: newStatus }).eq('code', code);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase toggle status failed:", err);
      const errMsg = err.message || "Failed to update coupon status in database.";
      await window.showCustomDialog("Status Update Failed", errMsg, "danger");
      return;
    }
  }

  coupon.is_active = newStatus;
  localStorage.setItem("toyzguru_coupons", JSON.stringify(couponsState));
  adminShowToast("Status Updated", `Coupon ${code} is now ${newStatus ? "ACTIVE" : "INACTIVE"}.`, "success");
  adminRenderCouponsTable();
}

async function adminDeleteCouponTrigger(code) {
  const isConfirmed = await window.showCustomDialog("Delete Coupon", `Are you sure you want to delete coupon "${code}"?`, "danger", true);

  if (isConfirmed) {
    if (supabase) {
      try {
        const { error } = await supabase.from('coupons').delete().eq('code', code);
        if (error) throw error;
      } catch (err) {
        console.error("Supabase coupon delete failed:", err);
        const errMsg = err.message || "Failed to delete coupon from database.";
        await window.showCustomDialog("Delete Failed", errMsg, "danger");
        return;
      }
    }
    couponsState = couponsState.filter(c => c.code !== code);
    localStorage.setItem("toyzguru_coupons", JSON.stringify(couponsState));
    adminShowToast("Coupon Deleted", `Removed coupon ${code}`, "danger");
    adminRenderCouponsTable();
  }
}

let adminEditingCouponCode = null;

function adminEditCouponTrigger(code) {
  const coupon = couponsState.find(c => c.code === code);
  if (!coupon) return;

  adminEditingCouponCode = code;
  document.getElementById("admin-coupon-modal-title").textContent = `Edit Coupon: ${code}`;

  const codeInput = document.getElementById("admin-coupon-code");
  codeInput.value = coupon.code;
  codeInput.disabled = true; // Coupon code is the primary key and cannot be edited
  codeInput.style.background = "rgba(255, 255, 255, 0.03)";
  codeInput.style.color = "var(--text-secondary)";
  codeInput.style.cursor = "not-allowed";

  document.getElementById("admin-coupon-active").checked = coupon.is_active;
  document.getElementById("admin-coupon-type").value = coupon.type;
  document.getElementById("admin-coupon-value").value = coupon.value;
  document.getElementById("admin-coupon-min-order").value = coupon.min_order || 0.00;
  document.getElementById("admin-coupon-max-discount").value = coupon.max_discount || "";
  document.getElementById("admin-coupon-usage-limit").value = coupon.usage_limit || "";

  if (coupon.expires_at) {
    // Format expires_at for datetime-local (YYYY-MM-DDTHH:MM)
    const expiryDate = new Date(coupon.expires_at);
    // Adjust timezone offset
    const tzoffset = expiryDate.getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(expiryDate - tzoffset)).toISOString().slice(0, 16);
    document.getElementById("admin-coupon-expires-at").value = localISOTime;
  } else {
    document.getElementById("admin-coupon-expires-at").value = "";
  }

  document.getElementById("admin-coupon-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminCreateCouponTrigger() {
  adminEditingCouponCode = null;
  document.getElementById("admin-coupon-modal-title").textContent = "Create New Coupon";
  document.getElementById("admin-coupon-form").reset();

  const codeInput = document.getElementById("admin-coupon-code");
  codeInput.disabled = false;
  codeInput.style.background = "";
  codeInput.style.color = "";
  codeInput.style.cursor = "";

  document.getElementById("admin-coupon-active").checked = true;
  document.getElementById("admin-coupon-min-order").value = 0.00;

  document.getElementById("admin-coupon-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminCloseCouponModal() {
  document.getElementById("admin-coupon-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

async function handleAdminCouponFormSubmit(e) {
  e.preventDefault();

  const code = document.getElementById("admin-coupon-code").value.trim().toUpperCase();
  const is_active = document.getElementById("admin-coupon-active").checked;
  const type = document.getElementById("admin-coupon-type").value;
  const value = parseFloat(document.getElementById("admin-coupon-value").value);
  const minOrderVal = document.getElementById("admin-coupon-min-order").value;
  const min_order = minOrderVal ? parseFloat(minOrderVal) : 0.00;
  const maxDiscountVal = document.getElementById("admin-coupon-max-discount").value;
  const max_discount = maxDiscountVal ? parseFloat(maxDiscountVal) : null;
  const usageLimitVal = document.getElementById("admin-coupon-usage-limit").value;
  const usage_limit = usageLimitVal ? parseInt(usageLimitVal) : null;
  const expiresAtVal = document.getElementById("admin-coupon-expires-at").value;
  const expires_at = expiresAtVal ? new Date(expiresAtVal).toISOString() : null;

  if (!code) {
    adminShowToast("Validation Error", "Coupon code is required.", "warning");
    return;
  }

  if (isNaN(value) || value <= 0) {
    adminShowToast("Validation Error", "Discount value must be greater than 0.", "warning");
    return;
  }

  const newCouponObj = {
    code: code,
    type: type,
    value: value,
    min_order: min_order,
    max_discount: max_discount,
    usage_limit: usage_limit,
    expires_at: expires_at,
    is_active: is_active
  };

  try {
    if (adminEditingCouponCode) {
      // Edit mode
      if (supabase) {
        const { error } = await supabase.from('coupons').update(newCouponObj).eq('code', adminEditingCouponCode);
        if (error) throw error;
      }
      const matchIndex = couponsState.findIndex(c => c.code === adminEditingCouponCode);
      if (matchIndex >= 0) {
        couponsState[matchIndex] = newCouponObj;
      }
      adminShowToast("Coupon Saved", `Updated details for coupon: ${adminEditingCouponCode}`, "success");
    } else {
      // Create mode
      // Check duplicate locally first
      const exists = couponsState.some(c => c.code === code);
      if (exists) {
        adminShowToast("Duplicate Code", `A coupon with code "${code}" already exists.`, "warning");
        return;
      }

      if (supabase) {
        const { error } = await supabase.from('coupons').insert(newCouponObj);
        if (error) throw error;
      }
      couponsState.push(newCouponObj);
      adminShowToast("Coupon Created", `Added coupon "${code}" to store databases.`, "success");
    }

    localStorage.setItem("toyzguru_coupons", JSON.stringify(couponsState));
    adminCloseCouponModal();
    adminRenderCouponsTable();
  } catch (err) {
    console.error("Coupon save failed:", err);
    const errMsg = err.message || "Failed to save coupon details.";
    if (window.showCustomDialog) {
      await window.showCustomDialog("Save Failed", errMsg, "danger");
    } else {
      adminShowToast("Save Failed", errMsg, "danger");
    }
  }
}

// Window Bindings
window.adminRenderDeliveryPanel = adminRenderDeliveryPanel;
window.adminRenderStatesTable = adminRenderStatesTable;
window.adminRenderCouriersTable = adminRenderCouriersTable;
window.adminEditStateTrigger = adminEditStateTrigger;
window.adminEditCourierTrigger = adminEditCourierTrigger;
window.adminEditCourierCreateTrigger = adminEditCourierCreateTrigger;
window.adminDeleteCourierTrigger = adminDeleteCourierTrigger;
window.adminCloseStateModal = adminCloseStateModal;
window.adminCloseCourierModal = adminCloseCourierModal;

// Coupon Bindings
window.adminRenderCouponsPanel = adminRenderCouponsPanel;
window.adminRenderCouponsTable = adminRenderCouponsTable;
window.adminToggleCouponStatus = adminToggleCouponStatus;
window.adminDeleteCouponTrigger = adminDeleteCouponTrigger;
window.adminEditCouponTrigger = adminEditCouponTrigger;
window.adminCreateCouponTrigger = adminCreateCouponTrigger;
window.adminCloseCouponModal = adminCloseCouponModal;
window.handleAdminCouponFormSubmit = handleAdminCouponFormSubmit;

// ================= TAX CONFIGURATION =================

// taxRatesState is declared globally in js/app.js

async function adminFetchTaxRates() {
  if (supabase) {
    try {
      const { data: remoteRates, error } = await supabase.from('gst_tax_rates').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      taxRatesState = remoteRates || [];
    } catch (err) {
      console.warn("Failed to fetch tax rates from Supabase, falling back to local storage:", err);
      taxRatesState = JSON.parse(localStorage.getItem("toyzguru_tax_rates")) || [];
    }
  } else {
    taxRatesState = JSON.parse(localStorage.getItem("toyzguru_tax_rates")) || [];
  }
  localStorage.setItem("toyzguru_tax_rates", JSON.stringify(taxRatesState));
}

async function adminSaveTaxRates() {
  localStorage.setItem("toyzguru_tax_rates", JSON.stringify(taxRatesState));
  if (supabase) {
    try {
      const { error } = await supabase.from('gst_tax_rates').upsert(taxRatesState);
      if (error) console.error("Error upserting tax rates to Supabase:", error);
    } catch (err) {
      console.error(err);
    }
  }
}

async function adminRenderTaxPanel() {
  if (!adminAuthenticated) return;
  
  // 1. Fetch tax rates and render table
  await adminFetchTaxRates();
  adminRenderTaxRatesTable();

  // 2. Load GST Configuration Settings
  await adminLoadGSTSettings();
}

async function adminLoadGSTSettings() {
  // Populate business state select in GST Configuration Settings
  const stateSelect = document.getElementById("admin-gst-business-state");
  if (stateSelect) {
    const states = window.stateChargesState || [];
    stateSelect.innerHTML = states.map(s => `<option value="${s.state_name}">${s.state_name}</option>`).join("");
  }

  // Populate Default Tax Category dropdown
  const defaultCategorySelect = document.getElementById("admin-gst-default-category");
  if (defaultCategorySelect) {
    const activeRates = taxRatesState.filter(r => r.is_active);
    defaultCategorySelect.innerHTML = `<option value="">No Default</option>` + activeRates.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
  }

  // Fetch settings from supabase/local
  if (supabase) {
    try {
      const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const gstEnabledEl = document.getElementById('admin-gst-enabled');
        const sellerGstinEl = document.getElementById('admin-gst-seller-gstin');
        const displayInclusiveEl = document.getElementById('admin-gst-display-inclusive');
        const displayExclusiveEl = document.getElementById('admin-gst-display-exclusive');

        if (gstEnabledEl) gstEnabledEl.checked = data.gst_enabled !== false;
        if (sellerGstinEl) sellerGstinEl.value = data.seller_gstin || "";
        if (data.business_state && stateSelect) stateSelect.value = data.business_state;
        if (data.default_tax_category_id && defaultCategorySelect) defaultCategorySelect.value = data.default_tax_category_id;
        if (displayInclusiveEl) displayInclusiveEl.checked = data.display_prices_including_tax !== false;
        if (displayExclusiveEl) displayExclusiveEl.checked = !!data.display_prices_excluding_tax;
        
        // Also update window storeSettings
        window.storeSettings = {
          ...window.storeSettings,
          gst_enabled: data.gst_enabled !== false,
          seller_gstin: data.seller_gstin || "",
          business_state: data.business_state || "Telangana",
          default_tax_category_id: data.default_tax_category_id || "",
          display_prices_including_tax: data.display_prices_including_tax !== false,
          display_prices_excluding_tax: !!data.display_prices_excluding_tax
        };
      }
    } catch (err) {
      console.error("Error loading GST settings:", err);
    }
  }
}

function adminRenderTaxRatesTable() {
  const tableBody = document.getElementById("admin-tax-rates-body");
  if (!tableBody) return;

  if (taxRatesState.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">
          No tax categories registered.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = taxRatesState.map(r => {
    const statusClass = r.is_active ? "status-delivered" : "status-cancelled";
    const statusText = r.is_active ? "ACTIVE" : "INACTIVE";
    const toggleTitle = r.is_active ? "Deactivate Rate" : "Activate Rate";

    return `
      <tr>
        <td style="font-weight: 600;">${r.name}</td>
        <td style="font-family: monospace; font-size: 0.85rem;">${r.code}</td>
        <td style="font-size: 0.85rem;">${r.tax_type}</td>
        <td style="font-weight: 700; color: var(--text-primary);">${r.total_tax_pct}%</td>
        <td>
          <span class="order-status-badge ${statusClass}" style="cursor: pointer;" onclick="adminToggleTaxRateStatus('${r.id}')" title="${toggleTitle}">
            ${statusText}
          </span>
        </td>
        <td>
          <div class="crud-btn-wrap">
            <button class="crud-btn crud-edit" onclick="adminEditTaxRateTrigger('${r.id}')" title="Edit Tax Rate">
              <i data-feather="edit" style="width: 14px; height: 14px;"></i>
            </button>
            <button class="crud-btn crud-delete" onclick="adminDeleteTaxRateTrigger('${r.id}')" title="Delete Tax Rate">
              <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  feather.replace();
}

async function handleGSTSettingsSubmit(e) {
  e.preventDefault();
  if (!supabase) return;

  const payload = {
    gst_enabled: document.getElementById('admin-gst-enabled').checked,
    seller_gstin: document.getElementById('admin-gst-seller-gstin').value.trim(),
    business_state: document.getElementById('admin-gst-business-state').value,
    default_tax_category_id: document.getElementById('admin-gst-default-category').value || null,
    display_prices_including_tax: document.getElementById('admin-gst-display-inclusive').checked,
    display_prices_excluding_tax: document.getElementById('admin-gst-display-exclusive').checked,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supabase.from('store_settings').upsert({ id: 1, ...payload });
    if (error) throw error;

    window.storeSettings = {
      ...window.storeSettings,
      ...payload
    };
    adminShowToast("Settings Saved", "GST Configuration updated successfully", "success");
  } catch (err) {
    console.error("Error saving GST settings:", err);
    adminShowToast("Save Failed", "Could not save GST Configuration settings", "danger");
  }
}

function adminCreateTaxRateTrigger() {
  document.getElementById("admin-form-tax-rate-id").value = "";
  document.getElementById("admin-tax-rate-modal-title").textContent = "Create New Tax Rate";
  document.getElementById("admin-tax-rate-form").reset();
  document.getElementById("admin-tax-rate-active").checked = true;

  document.getElementById("admin-tax-rate-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminEditTaxRateTrigger(rateId) {
  const rateObj = taxRatesState.find(r => r.id === rateId);
  if (!rateObj) return;

  document.getElementById("admin-form-tax-rate-id").value = rateObj.id;
  document.getElementById("admin-tax-rate-modal-title").textContent = `Edit Tax Rate: ${rateObj.name}`;
  document.getElementById("admin-tax-rate-name").value = rateObj.name;
  document.getElementById("admin-tax-rate-active").checked = rateObj.is_active;
  document.getElementById("admin-tax-rate-code").value = rateObj.code;
  document.getElementById("admin-tax-rate-type").value = rateObj.tax_type;
  document.getElementById("admin-tax-rate-cgst").value = Number(rateObj.cgst_pct).toFixed(2);
  document.getElementById("admin-tax-rate-sgst").value = Number(rateObj.sgst_pct).toFixed(2);
  document.getElementById("admin-tax-rate-igst").value = Number(rateObj.igst_pct).toFixed(2);
  document.getElementById("admin-tax-rate-total").value = Number(rateObj.total_tax_pct).toFixed(2);
  document.getElementById("admin-tax-rate-description").value = rateObj.description || "";

  document.getElementById("admin-tax-rate-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function adminCloseTaxRateModal() {
  document.getElementById("admin-tax-rate-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

async function handleTaxRateSubmit(e) {
  e.preventDefault();

  const rateId = document.getElementById("admin-form-tax-rate-id").value;
  const name = document.getElementById("admin-tax-rate-name").value.trim();
  const code = document.getElementById("admin-tax-rate-code").value.trim().toUpperCase();
  const is_active = document.getElementById("admin-tax-rate-active").checked;
  const tax_type = document.getElementById("admin-tax-rate-type").value;
  const cgst_pct = parseFloat(document.getElementById("admin-tax-rate-cgst").value) || 0;
  const sgst_pct = parseFloat(document.getElementById("admin-tax-rate-sgst").value) || 0;
  const igst_pct = parseFloat(document.getElementById("admin-tax-rate-igst").value) || 0;
  const total_tax_pct = parseFloat(document.getElementById("admin-tax-rate-total").value) || 0;
  const description = document.getElementById("admin-tax-rate-description").value.trim();

  if (!code) {
    adminShowToast("Validation Error", "Tax Code is required", "warning");
    return;
  }

  const ratePayload = {
    name,
    code,
    is_active,
    tax_type,
    cgst_pct,
    sgst_pct,
    igst_pct,
    total_tax_pct,
    description
  };

  try {
    if (rateId) {
      // Edit mode
      ratePayload.id = rateId;
      if (supabase) {
        const { error } = await supabase.from('gst_tax_rates').update(ratePayload).eq('id', rateId);
        if (error) throw error;
      }
      const matchIdx = taxRatesState.findIndex(r => r.id === rateId);
      if (matchIdx >= 0) {
        taxRatesState[matchIdx] = { ...taxRatesState[matchIdx], ...ratePayload };
      }
      adminShowToast("Tax Rate Saved", `Updated rate details: ${name}`, "success");
    } else {
      // Create mode
      const duplicate = taxRatesState.some(r => r.code === code);
      if (duplicate) {
        adminShowToast("Duplicate Code", `A tax category with code "${code}" already exists.`, "warning");
        return;
      }

      if (supabase) {
        const { data, error } = await supabase.from('gst_tax_rates').insert(ratePayload).select();
        if (error) throw error;
        if (data && data[0]) {
          taxRatesState.push(data[0]);
        } else {
          taxRatesState.push({ id: `tr_${Math.floor(1000 + Math.random() * 9000)}`, ...ratePayload });
        }
      } else {
        taxRatesState.push({ id: `tr_${Math.floor(1000 + Math.random() * 9000)}`, ...ratePayload });
      }
      adminShowToast("Tax Rate Created", `Added tax category: ${name}`, "success");
    }

    await adminSaveTaxRates();
    adminCloseTaxRateModal();
    adminRenderTaxRatesTable();
    
    // Refresh GST Configuration Default Tax Category Dropdown
    const defaultCategorySelect = document.getElementById("admin-gst-default-category");
    if (defaultCategorySelect) {
      const activeRates = taxRatesState.filter(r => r.is_active);
      const curVal = defaultCategorySelect.value;
      defaultCategorySelect.innerHTML = `<option value="">No Default</option>` + activeRates.map(r => `<option value="${r.id}">${r.name}</option>`).join("");
      defaultCategorySelect.value = curVal;
    }
  } catch (err) {
    console.error("Failed to save tax rate details:", err);
    await window.showCustomDialog("Save Failed", err.message || "Failed to save tax rate details.", "danger");
  }
}

async function adminToggleTaxRateStatus(rateId) {
  const rateObj = taxRatesState.find(r => r.id === rateId);
  if (!rateObj) return;

  const newStatus = !rateObj.is_active;
  if (supabase) {
    try {
      const { error } = await supabase.from('gst_tax_rates').update({ is_active: newStatus }).eq('id', rateId);
      if (error) throw error;
    } catch (err) {
      console.error("Supabase toggle status failed:", err);
      const errMsg = err.message || "Failed to update tax status in database.";
      await window.showCustomDialog("Status Update Failed", errMsg, "danger");
      return;
    }
  }

  rateObj.is_active = newStatus;
  await adminSaveTaxRates();
  adminShowToast("Status Updated", `Tax rate ${rateObj.name} is now ${newStatus ? "ACTIVE" : "INACTIVE"}.`, "success");
  adminRenderTaxRatesTable();
}

async function adminDeleteTaxRateTrigger(rateId) {
  const rateObj = taxRatesState.find(r => r.id === rateId);
  if (!rateObj) return;

  const isConfirmed = await window.showCustomDialog("Delete Tax Rate", `Are you sure you want to delete tax rate "${rateObj.name}"?\n\nProducts using this category will fall back to default tax settings.`, "danger", true);

  if (isConfirmed) {
    try {
      if (supabase) {
        const { error } = await supabase.from('gst_tax_rates').delete().eq('id', rateId);
        if (error) throw error;
      }
      taxRatesState = taxRatesState.filter(r => r.id !== rateId);
      await adminSaveTaxRates();
      adminShowToast("Tax Rate Deleted", `Removed tax rate: ${rateObj.name}`, "danger");
      adminRenderTaxRatesTable();
    } catch (err) {
      await window.showCustomDialog("Delete Failed", err.message || "Failed to remove tax rate.", "danger");
    }
  }
}

// Global Event Registration helpers
function setupAdminGstEventListeners() {
  const gstSettingsForm = document.getElementById("admin-gst-settings-form");
  if (gstSettingsForm) {
    gstSettingsForm.removeEventListener("submit", handleGSTSettingsSubmit);
    gstSettingsForm.addEventListener("submit", handleGSTSettingsSubmit);
  }

  const taxRateForm = document.getElementById("admin-tax-rate-form");
  if (taxRateForm) {
    taxRateForm.removeEventListener("submit", handleTaxRateSubmit);
    taxRateForm.addEventListener("submit", handleTaxRateSubmit);
  }

  const addTaxRateBtn = document.getElementById("admin-add-tax-rate-btn");
  if (addTaxRateBtn) {
    addTaxRateBtn.removeEventListener("click", adminCreateTaxRateTrigger);
    addTaxRateBtn.addEventListener("click", adminCreateTaxRateTrigger);
  }

  const closeTaxRateModalBtn = document.getElementById("close-admin-tax-rate-modal-btn");
  if (closeTaxRateModalBtn) {
    closeTaxRateModalBtn.removeEventListener("click", adminCloseTaxRateModal);
    closeTaxRateModalBtn.addEventListener("click", adminCloseTaxRateModal);
  }

  const typeSelect = document.getElementById("admin-tax-rate-type");
  if (typeSelect) {
    typeSelect.addEventListener("change", (e) => {
      const type = e.target.value;
      let cgst = 0, sgst = 0, igst = 0, total = 0;
      if (type === "GST 5%") {
        cgst = 2.5; sgst = 2.5; igst = 5; total = 5;
      } else if (type === "GST 12%") {
        cgst = 6; sgst = 6; igst = 12; total = 12;
      } else if (type === "GST 18%") {
        cgst = 9; sgst = 9; igst = 18; total = 18;
      }
      document.getElementById("admin-tax-rate-cgst").value = cgst.toFixed(2);
      document.getElementById("admin-tax-rate-sgst").value = sgst.toFixed(2);
      document.getElementById("admin-tax-rate-igst").value = igst.toFixed(2);
      document.getElementById("admin-tax-rate-total").value = total.toFixed(2);
    });
  }

  const cgstInput = document.getElementById("admin-tax-rate-cgst");
  const sgstInput = document.getElementById("admin-tax-rate-sgst");
  const igstInput = document.getElementById("admin-tax-rate-igst");
  
  const updateTotalField = () => {
    const cgst = parseFloat(cgstInput.value) || 0;
    const sgst = parseFloat(sgstInput.value) || 0;
    const igst = parseFloat(igstInput.value) || 0;
    const total = igst > 0 ? igst : (cgst + sgst);
    document.getElementById("admin-tax-rate-total").value = total.toFixed(2);
  };

  if (cgstInput) cgstInput.addEventListener("input", updateTotalField);
  if (sgstInput) sgstInput.addEventListener("input", updateTotalField);
  if (igstInput) igstInput.addEventListener("input", updateTotalField);
}

// Add setupAdminGstEventListeners to adminInit or event registration
const oldSetupAdminEventListeners = setupAdminEventListeners;
setupAdminEventListeners = function() {
  if (typeof oldSetupAdminEventListeners === "function") {
    oldSetupAdminEventListeners();
  }
  setupAdminGstEventListeners();
};


// ================= NEWSLETTER SUBSCRIBERS MANAGEMENT =================

let _newsletterAllRows = []; // cache for client-side search filter

async function adminRenderNewsletterPanel() {
  if (!adminAuthenticated) return;

  const tableBody = document.getElementById('admin-newsletter-table-body');
  const countEl = document.getElementById('admin-newsletter-count');
  if (!tableBody) return;

  // Loading state
  tableBody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
        <div style="display:inline-flex;align-items:center;gap:0.5rem;">
          <div class="spinner" style="width:20px;height:20px;border-width:2px;"></div>
          Loading subscribers...
        </div>
      </td>
    </tr>`;

  let subscribers = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      if (error) throw error;
      subscribers = data || [];
    } catch (err) {
      console.error('Failed to load newsletter subscribers:', err);
      adminShowToast('Load Failed', 'Could not fetch newsletter subscribers from database.', 'danger');
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align:center;color:var(--color-danger);padding:2rem;">
            <i data-feather="alert-triangle" style="width:20px;height:20px;vertical-align:middle;margin-right:0.35rem;"></i>
            Failed to load subscribers. Check database connection.
          </td>
        </tr>`;
      if (window.feather) feather.replace();
      return;
    }
  } else {
    // No Supabase — show empty state
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2rem;">
          Supabase not connected. No subscriber data available.
        </td>
      </tr>`;
    if (countEl) countEl.textContent = '—';
    return;
  }

  _newsletterAllRows = subscribers;
  if (countEl) countEl.textContent = subscribers.length;
  _adminRenderNewsletterRows(subscribers);
}

function _adminRenderNewsletterRows(rows) {
  const tableBody = document.getElementById('admin-newsletter-table-body');
  if (!tableBody) return;
  window._newsletterAllRows = rows; // keep reference for pagination re-draws

  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2.5rem;">
          <i data-feather="inbox" style="width:32px;height:32px;display:block;margin:0 auto 0.75rem;opacity:0.4;"></i>
          No newsletter subscribers yet. Share the sign-up form!
        </td>
      </tr>`;
    if (window.feather) feather.replace();
    renderAdminPagination(tableBody, 0, 'newsletter');
    return;
  }

  // Clamp & page-slice
  const totalNewsPages = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
  adminPaginationState.newsletter = Math.max(1, Math.min(adminPaginationState.newsletter, totalNewsPages));
  const newsPg = adminPaginationState.newsletter;
  const newsPageData = rows.slice((newsPg - 1) * ADMIN_PAGE_SIZE, newsPg * ADMIN_PAGE_SIZE);

  tableBody.innerHTML = newsPageData.map((sub, idx) => {
    const globalIdx = (newsPg - 1) * ADMIN_PAGE_SIZE + idx + 1;
    const dateStr = new Date(sub.subscribed_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    return `
      <tr id="newsletter-row-${sub.id}">
        <td style="font-size:0.8rem;color:var(--text-muted);font-family:monospace;">${globalIdx}</td>
        <td style="font-family:monospace;font-size:0.9rem;font-weight:600;color:var(--text-primary);">
          <i data-feather="mail" style="width:13px;height:13px;vertical-align:middle;margin-right:0.4rem;color:var(--color-brand);"></i>
          ${sub.email}
        </td>
        <td style="font-size:0.82rem;color:var(--text-secondary);">${dateStr}</td>
        <td>
          <div class="crud-btn-wrap">
            <button class="crud-btn crud-delete"
              onclick="adminDeleteNewsletterSubscriber('${sub.id}', '${sub.email.replace(/'/g, "\\'")}')"
              title="Remove subscriber">
              <i data-feather="trash-2" style="width:14px;height:14px;"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  renderAdminPagination(tableBody, rows.length, 'newsletter');
  if (window.feather) feather.replace();
}


function adminFilterNewsletterTable(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    _adminRenderNewsletterRows(_newsletterAllRows);
    return;
  }
  const filtered = _newsletterAllRows.filter(s => s.email.toLowerCase().includes(q));
  _adminRenderNewsletterRows(filtered);
}

async function adminDeleteNewsletterSubscriber(id, email) {
  const isConfirmed = await window.showCustomDialog("Remove Subscriber", `Remove "${email}" from the newsletter list?\n\nThis cannot be undone.`, "danger", true);

  if (!isConfirmed) return;

  if (!supabase) {
    adminShowToast('Not Available', 'Supabase connection required to delete subscribers.', 'warning');
    return;
  }

  try {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);
    if (error) throw error;

    // Remove from cache and re-render
    _newsletterAllRows = _newsletterAllRows.filter(s => s.id !== id);

    // Update count badge
    const countEl = document.getElementById('admin-newsletter-count');
    if (countEl) countEl.textContent = _newsletterAllRows.length;

    // Re-apply current search filter
    const searchInput = document.getElementById('admin-newsletter-search');
    adminFilterNewsletterTable(searchInput ? searchInput.value : '');

    adminShowToast('Subscriber Removed', `"${email}" has been removed from the newsletter list.`, 'success');
  } catch (err) {
    console.error('Delete newsletter subscriber error:', err);
    await window.showCustomDialog('Delete Failed', err.message || 'Could not remove subscriber.', 'danger');
  }
}

function adminExportNewsletterCSV() {
  if (_newsletterAllRows.length === 0) {
    adminShowToast('No Data', 'No subscribers to export.', 'warning');
    return;
  }
  const header = 'Email,Subscribed At';
  const rows = _newsletterAllRows.map(s => `"${s.email}","${new Date(s.subscribed_at).toISOString()}"`);
  const csvContent = [header, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `toyzguru_newsletter_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  adminShowToast('CSV Exported', `Exported ${_newsletterAllRows.length} subscriber emails.`, 'success');
}

// Window bindings for newsletter functions
window.adminRenderNewsletterPanel = adminRenderNewsletterPanel;
window.adminDeleteNewsletterSubscriber = adminDeleteNewsletterSubscriber;
window.adminFilterNewsletterTable = adminFilterNewsletterTable;
window.adminExportNewsletterCSV = adminExportNewsletterCSV;


// ===============================================================
//   BOT SUPPORT TICKETS ADMIN MODULE
//   Manages tickets stored in localStorage under key:
//   'toyzguru_chat_tickets'
// ===============================================================

const TICKETS_KEY = 'toyzguru_chat_tickets';

/** Retrieve all tickets from localStorage */
function adminGetTickets() {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

/** Persist tickets array back to localStorage */
function adminSaveTickets(tickets) {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
}

/** Update the sidebar badge count for open tickets */
function adminUpdateTicketsBadge() {
  const tickets = adminGetTickets();
  const openCount = tickets.filter(t => t.status !== 'resolved').length;
  const badge = document.getElementById('admin-tickets-badge');
  if (!badge) return;
  if (openCount > 0) {
    badge.textContent = openCount;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

/** Main render: loads, filters, and displays the ticket cards */
function adminRenderTicketsPanel() {
  const list = document.getElementById('admin-tickets-list');
  if (!list) return;

  let tickets = adminGetTickets();

  // Sort: newest first
  tickets.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Update stat counts
  const totalEl = document.getElementById('admin-tickets-count');
  const openEl  = document.getElementById('admin-tickets-open-count');
  if (totalEl) totalEl.textContent = tickets.length;
  if (openEl)  openEl.textContent  = tickets.filter(t => t.status !== 'resolved').length;
  adminUpdateTicketsBadge();

  // Apply filter
  const filterVal = (document.getElementById('admin-tickets-filter') || {}).value || 'all';
  const searchVal = ((document.getElementById('admin-tickets-search') || {}).value || '').toLowerCase();

  let filtered = tickets;
  if (filterVal === 'open')     filtered = filtered.filter(t => t.status !== 'resolved');
  if (filterVal === 'resolved') filtered = filtered.filter(t => t.status === 'resolved');
  if (searchVal) {
    filtered = filtered.filter(t =>
      (t.name  || '').toLowerCase().includes(searchVal) ||
      (t.email || '').toLowerCase().includes(searchVal) ||
      (t.description || '').toLowerCase().includes(searchVal) ||
      (t.id || '').toLowerCase().includes(searchVal)
    );
  }

  if (filtered.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;color:var(--text-secondary);padding:3rem 1rem;">
        <i data-feather="inbox" style="width:40px;height:40px;margin-bottom:1rem;opacity:0.3;display:block;margin:0 auto 1rem;"></i>
        <p style="font-size:0.9rem;">No tickets found matching your criteria.</p>
      </div>`;
    feather.replace();
    return;
  }

  list.innerHTML = filtered.map(ticket => {
    const isResolved = ticket.status === 'resolved';
    const dateStr = ticket.date
      ? new Date(ticket.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : '—';
    const statusColor = isResolved ? '#10b981' : '#f59e0b';
    const statusLabel = isResolved ? 'Resolved' : 'Open';
    const statusIcon  = isResolved ? 'check-circle' : 'clock';

    const replySection = ticket.adminReply
      ? `<div class="admin-ticket-reply-preview">
           <strong style="color:var(--color-brand);font-size:0.75rem;display:flex;align-items:center;gap:0.35rem;">
             <i data-feather="corner-down-right" style="width:12px;height:12px;"></i> Admin Reply
           </strong>
           <p style="margin:0.35rem 0 0; font-size:0.82rem; color:var(--text-secondary);">${ticket.adminReply}</p>
           <span style="font-size:0.72rem;color:var(--text-muted);">${ticket.replyDate ? new Date(ticket.replyDate).toLocaleString('en-IN', {dateStyle:'medium',timeStyle:'short'}) : ''}</span>
         </div>`
      : '';

    return `
      <div class="admin-ticket-card ${isResolved ? 'resolved' : 'open'}" id="ticket-card-${ticket.id}">
        <div class="admin-ticket-card-header">
          <div style="display:flex;align-items:center;gap:0.75rem;flex:1;min-width:0;">
            <div class="admin-ticket-avatar">${(ticket.name || 'U').charAt(0).toUpperCase()}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;font-size:0.9rem;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${ticket.name || 'Anonymous'}</div>
              <div style="font-size:0.78rem;color:var(--text-secondary);">${ticket.email || '—'}</div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.75rem;flex-shrink:0;">
            <span class="admin-ticket-status-pill" style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;">
              <i data-feather="${statusIcon}" style="width:12px;height:12px;"></i> ${statusLabel}
            </span>
            <span style="font-size:0.75rem;color:var(--text-muted);">${ticket.id || ''}</span>
          </div>
        </div>

        <div class="admin-ticket-card-body">
          <p style="font-size:0.84rem;color:var(--text-secondary);line-height:1.6;margin:0;">${ticket.description || 'No message provided.'}</p>
          ${replySection}
        </div>

        <div class="admin-ticket-card-footer">
          <span style="font-size:0.75rem;color:var(--text-muted);display:flex;align-items:center;gap:0.3rem;">
            <i data-feather="calendar" style="width:12px;height:12px;"></i> ${dateStr}
          </span>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            ${!isResolved ? `
              <button class="admin-ticket-btn reply" onclick="adminOpenTicketReplyModal('${ticket.id}')">
                <i data-feather="corner-down-right" style="width:13px;height:13px;"></i> Reply & Resolve
              </button>
              <button class="admin-ticket-btn resolve" onclick="adminMarkTicketResolved('${ticket.id}')">
                <i data-feather="check" style="width:13px;height:13px;"></i> Mark Resolved
              </button>
            ` : ''}
            <button class="admin-ticket-btn delete" onclick="adminDeleteTicket('${ticket.id}')">
              <i data-feather="trash-2" style="width:13px;height:13px;"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  feather.replace();
}

/** Open the reply modal for a specific ticket */
let _adminReplyTicketId = null;
function adminOpenTicketReplyModal(ticketId) {
  _adminReplyTicketId = ticketId;
  const tickets = adminGetTickets();
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  const overlay = document.getElementById('admin-ticket-reply-overlay');
  const titleEl = document.getElementById('admin-ticket-reply-title');
  const infoEl  = document.getElementById('admin-ticket-reply-info');
  const textEl  = document.getElementById('admin-ticket-reply-text');

  if (titleEl) titleEl.textContent = `Reply to ${ticket.name || 'Visitor'}`;
  if (infoEl) {
    infoEl.innerHTML = `
      <strong style="color:var(--text-primary);">${ticket.name || '—'}</strong>
      &nbsp;<span style="color:var(--text-muted);font-size:0.78rem;">&lt;${ticket.email || '—'}&gt;</span>
      <span style="float:right;font-size:0.75rem;color:var(--text-muted);">${ticket.id}</span><br>
      <span style="color:var(--text-muted);font-size:0.75rem;">${ticket.date ? new Date(ticket.date).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : ''}</span>
      <hr style="border:none;border-top:1px solid var(--glass-border);margin:0.6rem 0;">
      <em style="color:var(--text-secondary);">"${ticket.description || ''}"</em>
    `;
  }
  if (textEl) textEl.value = ticket.adminReply || '';

  if (overlay) {
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  feather.replace();
}

function adminCloseTicketReplyModal() {
  const overlay = document.getElementById('admin-ticket-reply-overlay');
  if (overlay) overlay.style.display = 'none';
  document.body.style.overflow = '';
  _adminReplyTicketId = null;
}

/** Save admin reply and mark ticket resolved */
async function adminSubmitTicketReply() {
  const textEl = document.getElementById('admin-ticket-reply-text');
  const replyText = (textEl ? textEl.value.trim() : '');
  if (!replyText) {
    adminShowToast('Reply Required', 'Please type a reply message before submitting.', 'warning');
    return;
  }

  const tickets = adminGetTickets();
  const idx = tickets.findIndex(t => t.id === _adminReplyTicketId);
  if (idx === -1) return;

  const ticket = tickets[idx];

  // Save reply & mark resolved immediately (optimistic)
  ticket.adminReply = replyText;
  ticket.replyDate  = new Date().toISOString();
  ticket.status     = 'resolved';
  adminSaveTickets(tickets);

  adminCloseTicketReplyModal();
  adminRenderTicketsPanel();
  adminShowToast('Reply Saved', `Ticket ${ticket.id} marked as resolved. Sending email…`, 'success');

  // ─── Send email to visitor ───────────────────────────────────────────────
  if (ticket.email && typeof window.sendEmailViaServer === 'function') {
    try {
      const html = buildTicketReplyEmailHTML(ticket, replyText);
      await window.sendEmailViaServer({
        to: ticket.email,
        subject: `Re: Your Support Request [${ticket.id}] — ToyzGuru`,
        html,
        text: `Hi ${ticket.name || 'there'},\n\nOur support team has replied to your ticket (${ticket.id}).\n\nYour Message:\n"${ticket.description}"\n\nAdmin Reply:\n${replyText}\n\nIf you have further questions, feel free to raise a new ticket at toyzguru.in or contact us at support@toyzguru.in.\n\n— ToyzGuru Support Team`,
      });
      adminShowToast('Email Sent ✅', `Reply email delivered to ${ticket.email}`, 'success');
    } catch (err) {
      console.error('[Tickets] Failed to send reply email:', err);
      adminShowToast('Email Failed ⚠️', `Reply saved locally but email to ${ticket.email} failed: ${err.message}. Is the email server running?`, 'warning');
    }
  } else if (!ticket.email) {
    adminShowToast('No Email on Ticket', 'Reply saved but the ticket has no email address — cannot send notification.', 'warning');
  }
}

/** Build a branded HTML email for the admin → visitor reply notification */
function buildTicketReplyEmailHTML(ticket, replyText) {
  const submittedDate = ticket.date
    ? new Date(ticket.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  return `
    <div style="font-family:'Inter',Arial,sans-serif;background-color:#080b11;color:#f3f4f6;padding:0;margin:0;min-height:100vh;">
      <div style="max-width:600px;margin:0 auto;padding:2rem 1rem;">

        <!-- Header -->
        <div style="text-align:center;padding:2rem 1.5rem 1.5rem;background:linear-gradient(135deg,rgba(139,92,246,0.15) 0%,rgba(217,70,239,0.15) 100%);border-radius:16px 16px 0 0;border:1px solid rgba(139,92,246,0.2);border-bottom:none;">
          <h1 style="font-family:'Space Grotesk',Arial,sans-serif;font-size:1.8rem;font-weight:800;color:#ffffff;margin:0 0 0.25rem;letter-spacing:-0.02em;">ToyzGuru</h1>
          <p style="color:#8b5cf6;font-size:0.8rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;margin:0;">Premium Collector Store · Support Team</p>
        </div>

        <!-- Body card -->
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-top:2px solid #8b5cf6;border-radius:0 0 16px 16px;padding:2rem 2rem 1.5rem;">

          <!-- Greeting -->
          <h2 style="font-family:'Space Grotesk',Arial,sans-serif;color:#ffffff;font-size:1.25rem;font-weight:700;margin:0 0 0.75rem;">
            👋 Hi ${ticket.name || 'there'},
          </h2>
          <p style="color:#9ca3af;font-size:0.92rem;line-height:1.7;margin:0 0 1.75rem;">
            Our support team has reviewed your request and sent you a reply. Please see the details below.
          </p>

          <!-- Ticket reference box -->
          <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:1rem 1.25rem;margin-bottom:1.5rem;">
            <p style="margin:0 0 0.5rem;font-size:0.78rem;color:#6b7280;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Your Original Request</p>
            <p style="margin:0 0 0.4rem;font-size:0.82rem;color:#9ca3af;font-style:italic;line-height:1.6;">"${ticket.description || 'No message'}"</p>
            <p style="margin:0.6rem 0 0;font-size:0.75rem;color:#4b5563;">Ticket ID: <strong style="color:#8b5cf6;">${ticket.id}</strong> &nbsp;·&nbsp; Submitted: ${submittedDate}</p>
          </div>

          <!-- Admin reply box -->
          <div style="background:linear-gradient(135deg,rgba(139,92,246,0.08) 0%,rgba(217,70,239,0.08) 100%);border:1px solid rgba(139,92,246,0.25);border-left:4px solid #8b5cf6;border-radius:10px;padding:1.25rem 1.5rem;margin-bottom:2rem;">
            <p style="margin:0 0 0.75rem;font-size:0.78rem;color:#8b5cf6;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;display:flex;align-items:center;gap:0.4rem;">
              ↩ Admin Reply
            </p>
            <p style="margin:0;font-size:0.95rem;color:#e5e7eb;line-height:1.75;white-space:pre-line;">${replyText}</p>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:1.75rem;">
            <a href="https://toyzguru.in" style="display:inline-block;padding:0.85rem 2rem;background:linear-gradient(135deg,#8b5cf6 0%,#d946ef 100%);color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:0.9rem;box-shadow:0 4px 15px rgba(139,92,246,0.4);">
              Visit ToyzGuru Store →
            </a>
          </div>

          <p style="color:#6b7280;font-size:0.82rem;line-height:1.6;margin:0 0 0.5rem;">
            If you have further questions, simply reply to this email or raise a new support ticket via the chat widget on our website.
          </p>

          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:1.5rem 0;">

          <!-- Footer -->
          <div style="text-align:center;">
            <p style="color:#4b5563;font-size:0.75rem;line-height:1.6;margin:0;">
              This email was sent from <strong style="color:#8b5cf6;">ToyzGuru Support</strong>.<br>
              © ${new Date().getFullYear()} ToyzGuru · Hyderabad, Telangana, India<br>
              <a href="mailto:support@toyzguru.in" style="color:#8b5cf6;text-decoration:none;">support@toyzguru.in</a>
              &nbsp;·&nbsp;
              <a href="https://toyzguru.in" style="color:#8b5cf6;text-decoration:none;">toyzguru.in</a>
            </p>
          </div>
        </div>

      </div>
    </div>
  `;
}

/** Mark ticket resolved without a reply */
function adminMarkTicketResolved(ticketId) {
  const tickets = adminGetTickets();
  const idx = tickets.findIndex(t => t.id === ticketId);
  if (idx === -1) return;
  tickets[idx].status = 'resolved';
  adminSaveTickets(tickets);
  adminRenderTicketsPanel();
  adminShowToast('Ticket Resolved', `Ticket ${ticketId} marked as resolved.`, 'success');
}

/** Delete a single ticket */
async function adminDeleteTicket(ticketId) {
  const ok = await window.showCustomDialog('Delete Ticket', `Are you sure you want to permanently delete ticket ${ticketId}?`, 'danger', true);
  if (!ok) return;
  let tickets = adminGetTickets();
  tickets = tickets.filter(t => t.id !== ticketId);
  adminSaveTickets(tickets);
  adminRenderTicketsPanel();
  adminShowToast('Ticket Deleted', `Ticket ${ticketId} removed.`, 'danger');
}

/** Delete all resolved tickets */
async function adminClearResolvedTickets() {
  const tickets = adminGetTickets();
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  if (resolvedCount === 0) {
    adminShowToast('Nothing to Clear', 'There are no resolved tickets to remove.', 'warning');
    return;
  }
  const ok = await window.showCustomDialog('Clear Resolved', `This will permanently delete all ${resolvedCount} resolved ticket(s). Continue?`, 'danger', true);
  if (!ok) return;
  const remaining = tickets.filter(t => t.status !== 'resolved');
  adminSaveTickets(remaining);
  adminRenderTicketsPanel();
  adminShowToast('Resolved Cleared', `Removed ${resolvedCount} resolved ticket(s).`, 'success');
}

/** Export all tickets as CSV */
function adminExportTicketsCSV() {
  const tickets = adminGetTickets();
  if (tickets.length === 0) {
    adminShowToast('Nothing to Export', 'No tickets found.', 'warning');
    return;
  }
  const headers = ['ID', 'Name', 'Email', 'Description', 'Status', 'Date Submitted', 'Admin Reply', 'Reply Date'];
  const rows = tickets.map(t => [
    t.id || '',
    `"${(t.name || '').replace(/"/g, '""')}"`,
    t.email || '',
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.status || 'open',
    t.date ? new Date(t.date).toLocaleString('en-IN') : '',
    `"${(t.adminReply || '').replace(/"/g, '""')}"`,
    t.replyDate ? new Date(t.replyDate).toLocaleString('en-IN') : ''
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `toyzguru_tickets_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  adminShowToast('Exported', `${tickets.length} ticket(s) exported as CSV.`, 'success');
}

// Call badge update on page load so the sidebar badge appears immediately
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(adminUpdateTicketsBadge, 1500);
});

// Helper to handle reply button click with UI feedback
function adminHandleTicketReplyClick(btn) {
  if (!btn) return;
  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = "<span style='opacity:0.7;'>⏳ Sending…</span>";
  // Call the async reply function and restore button state afterwards
  adminSubmitTicketReply().finally(() => {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
    if (window.feather) feather.replace();
  });
}

window.adminRenderTicketsPanel      = adminRenderTicketsPanel;
window.adminOpenTicketReplyModal    = adminOpenTicketReplyModal;
window.adminCloseTicketReplyModal   = adminCloseTicketReplyModal;
window.adminSubmitTicketReply       = adminSubmitTicketReply;
window.adminHandleTicketReplyClick  = adminHandleTicketReplyClick;
window.adminMarkTicketResolved      = adminMarkTicketResolved;
window.adminDeleteTicket            = adminDeleteTicket;
window.adminClearResolvedTickets    = adminClearResolvedTickets;
window.adminExportTicketsCSV        = adminExportTicketsCSV;


// ================= POPUP BANNER MANAGEMENT =================
const POPUP_STORAGE_KEY = 'toyzguru_popup_banner'; // { enabled, url, type, link }
const POPUP_SEEN_KEY    = 'toyzguru_popup_seen';   // sessionStorage flag

/** Reads saved popup settings from localStorage */
function _getPopupSettings() {
  try { return JSON.parse(localStorage.getItem(POPUP_STORAGE_KEY) || '{}'); }
  catch (e) { return {}; }
}

/** Persists popup settings to localStorage */
function _savePopupSettings(obj) {
  localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify(obj));
}

/** Updates the ON/OFF status badge */
function _adminUpdatePopupStatusBadge(enabled) {
  const badge = document.getElementById('popup-status-badge');
  if (!badge) return;
  if (enabled) {
    badge.className = 'popup-status-badge on';
    badge.innerHTML = '<i data-feather="check-circle" style="width:12px;height:12px;"></i> ON';
  } else {
    badge.className = 'popup-status-badge off';
    badge.innerHTML = '<i data-feather="power" style="width:12px;height:12px;"></i> OFF';
  }
  if (window.feather) feather.replace();
}

/** Sets preview in the admin panel */
function _adminSetPopupPreview(url, type) {
  const wrap  = document.getElementById('popup-preview-wrap');
  const empty = document.getElementById('popup-preview-empty');
  if (!wrap) return;
  if (empty) empty.style.display = 'none';
  wrap.classList.add('has-media');
  wrap.querySelectorAll('img, video').forEach(function(el) { el.remove(); });

  if (type === 'video') {
    var v = document.createElement('video');
    v.src = url; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
    v.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    wrap.appendChild(v);
  } else {
    var img = document.createElement('img');
    img.src = url; img.alt = 'Popup banner preview';
    img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;';
    img.onerror = function() {
      img.style.display = 'none';
      if (empty) empty.style.display = 'flex';
      wrap.classList.remove('has-media');
    };
    wrap.appendChild(img);
  }
}

/** Clears preview in the admin panel */
function _adminClearPopupPreview() {
  var wrap  = document.getElementById('popup-preview-wrap');
  var empty = document.getElementById('popup-preview-empty');
  if (!wrap) return;
  wrap.classList.remove('has-media');
  wrap.querySelectorAll('img, video').forEach(function(el) { el.remove(); });
  if (empty) empty.style.display = 'flex';
}

/** Hydrates the admin popup panel UI from saved settings */
function adminRenderPopupBannerPanel() {
  var settings = _getPopupSettings();

  var toggle = document.getElementById('popup-enabled-toggle');
  if (toggle) toggle.checked = !!settings.enabled;

  _adminUpdatePopupStatusBadge(!!settings.enabled);

  if (settings.url) {
    _adminSetPopupPreview(settings.url, settings.type || 'image');
    var urlInput = document.getElementById('popup-url-input');
    if (urlInput && !urlInput.value) urlInput.value = settings.url;
  } else {
    _adminClearPopupPreview();
  }

  var linkInput = document.getElementById('popup-link-input');
  if (linkInput) linkInput.value = settings.link || '';

  if (window.feather) feather.replace();
}

/** Toggle switch changed */
window.adminHandlePopupToggle = function(checked) {
  var settings = _getPopupSettings();
  settings.enabled = checked;
  _savePopupSettings(settings);
  _adminUpdatePopupStatusBadge(checked);
  if (window.toyzToast) {
    window.toyzToast(
      checked ? 'Popup Enabled' : 'Popup Disabled',
      checked ? 'Visitors will now see the popup on homepage.' : 'Popup is now hidden from visitors.',
      checked ? 'success' : 'warning'
    );
  }
};

/** File chosen via file picker */
window.adminHandlePopupFileSelect = function(input) {
  var file = input.files && input.files[0];
  if (!file) return;

  var info   = document.getElementById('popup-file-info');
  var nameEl = document.getElementById('popup-file-info-name');
  var sizeEl = document.getElementById('popup-file-info-size');
  if (info)   info.style.display = 'block';
  if (nameEl) nameEl.textContent = file.name;
  if (sizeEl) sizeEl.textContent = (file.size / 1024).toFixed(1) + ' KB  (' + file.type + ')';

  // Clear URL input when file is selected
  var urlInput = document.getElementById('popup-url-input');
  if (urlInput) urlInput.value = '';

  var reader = new FileReader();
  reader.onload = function(e) {
    var dataUrl = e.target.result;
    var type = file.type.startsWith('video') ? 'video' : 'image';
    _adminSetPopupPreview(dataUrl, type);
    window._popupPendingDataUrl = dataUrl;
    window._popupPendingType    = type;
  };
  reader.readAsDataURL(file);
};

/** URL input changed */
window.adminHandlePopupUrlInput = function(val) {
  window._popupPendingDataUrl = null;
  window._popupPendingType    = null;
  if (!val) { _adminClearPopupPreview(); return; }
  var isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(val);
  _adminSetPopupPreview(val, isVideo ? 'video' : 'image');
};

/** Save & Apply button */
window.adminSavePopupBanner = function() {
  var btn = document.getElementById('popup-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

  var url  = '';
  var type = 'image';

  if (window._popupPendingDataUrl) {
    url  = window._popupPendingDataUrl;
    type = window._popupPendingType || 'image';
  } else {
    var urlInput = document.getElementById('popup-url-input');
    url = urlInput ? urlInput.value.trim() : '';
    if (url) {
      var isVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
      type = isVideo ? 'video' : 'image';
    }
  }

  // Re-enable button
  setTimeout(function() {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-feather="save" style="width:14px;height:14px;"></i> Save &amp; Apply';
      if (window.feather) feather.replace();
    }
  }, 800);

  if (!url) {
    if (window.toyzToast) window.toyzToast('No Media Selected', 'Please upload a file or paste a media URL first.', 'warning');
    else alert('Please upload a file or paste a media URL first.');
    return;
  }

  // Read link
  var linkInput = document.getElementById('popup-link-input');
  var link = linkInput ? linkInput.value.trim() : '';

  // Save settings
  var settings = _getPopupSettings();
  settings.url  = url;
  settings.type = type;
  settings.link = link;
  // Auto-enable on save
  settings.enabled = true;
  _savePopupSettings(settings);

  // Update toggle + badge to reflect auto-enable
  var toggle = document.getElementById('popup-enabled-toggle');
  if (toggle) toggle.checked = true;
  _adminUpdatePopupStatusBadge(true);

  // Reset seen flag so popup shows immediately for testing
  try { sessionStorage.removeItem(POPUP_SEEN_KEY); } catch(e) {}

  // Show SUCCESS dialog
  if (window.showCustomDialog) {
    window.showCustomDialog(
      'Popup Banner Saved!',
      'Your popup banner has been saved and is now ACTIVE. Visitors will see it on their next homepage visit.\n\n' +
      (link ? 'Product link set to: ' + link : 'No product link set (visitors can just close the popup).'),
      'success',
      false
    );
  } else {
    alert('SUCCESS!\nPopup banner saved and activated.\n' + (link ? 'Link: ' + link : ''));
  }
};

/** Clear popup */
window.adminClearPopupBanner = function() {
  if (!window.showCustomDialog) {
    if (!confirm('Remove the current popup banner? This will disable the popup.')) return;
    _doAdminClearPopup();
    return;
  }
  window.showCustomDialog(
    'Clear Popup Banner',
    'This will remove the current popup media and disable the popup for visitors.',
    'danger',
    true
  ).then(function(confirmed) {
    if (confirmed) _doAdminClearPopup();
  });
};

function _doAdminClearPopup() {
  _savePopupSettings({ enabled: false });
  window._popupPendingDataUrl = null;
  window._popupPendingType    = null;

  var toggle = document.getElementById('popup-enabled-toggle');
  if (toggle) toggle.checked = false;
  _adminUpdatePopupStatusBadge(false);
  _adminClearPopupPreview();

  var urlInput  = document.getElementById('popup-url-input');
  if (urlInput) urlInput.value = '';
  var linkInput = document.getElementById('popup-link-input');
  if (linkInput) linkInput.value = '';
  var info      = document.getElementById('popup-file-info');
  if (info)     info.style.display = 'none';
  var fileInput = document.getElementById('popup-file-input');
  if (fileInput) fileInput.value = '';

  try { sessionStorage.removeItem(POPUP_SEEN_KEY); } catch(e) {}

  if (window.toyzToast) window.toyzToast('Popup Cleared', 'The popup banner has been removed and disabled.', 'success');
}

window.adminRenderPopupBannerPanel = adminRenderPopupBannerPanel;

// Patch _adminGoToPanel after it's set up to auto-render popup panel
document.addEventListener('DOMContentLoaded', function() {
  var patchInterval = setInterval(function() {
    if (window._adminGoToPanel) {
      clearInterval(patchInterval);
      var _origGoTo = window._adminGoToPanel;
      window._adminGoToPanel = function(panelId) {
        _origGoTo(panelId);
        if (panelId === 'admin-popup-panel') {
          setTimeout(adminRenderPopupBannerPanel, 60);
        }
      };
    }
  }, 150);
});


// ================= HOMEPAGE POPUP (FRONTEND) =================
window.initHomePagePopup = function() {
  var settings;
  try {
    settings = JSON.parse(localStorage.getItem(POPUP_STORAGE_KEY) || '{}');
  } catch(e) { return; }

  if (!settings.enabled || !settings.url) return;

  // Show only once per browser session
  try {
    if (sessionStorage.getItem(POPUP_SEEN_KEY)) return;
    sessionStorage.setItem(POPUP_SEEN_KEY, '1');
  } catch(e) {}

  var overlay = document.getElementById('homepage-popup-overlay');
  var box     = document.getElementById('homepage-popup-box');
  if (!overlay || !box) return;

  // Remove old media from previous calls
  box.querySelectorAll('img, video, a').forEach(function(el) { el.remove(); });

  var mediaEl;
  if (settings.type === 'video') {
    mediaEl = document.createElement('video');
    mediaEl.src = settings.url;
    mediaEl.autoplay = true; mediaEl.loop = true;
    mediaEl.muted = true; mediaEl.playsInline = true; mediaEl.controls = true;
    mediaEl.style.cssText = 'width:100%;max-height:500px;display:block;';
  } else {
    mediaEl = document.createElement('img');
    mediaEl.src = settings.url;
    mediaEl.alt = 'Welcome to ToyzGuru';
    mediaEl.style.cssText = 'width:100%;display:block;cursor:' + (settings.link ? 'pointer' : 'default') + ';';
  }

  // Wrap in link if admin set one
  if (settings.link) {
    var anchor = document.createElement('a');
    anchor.href = settings.link;
    if (settings.link.startsWith('http')) anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.cssText = 'display:block;text-decoration:none;';
    anchor.addEventListener('click', function() { window.closeHomePagePopup(); });
    anchor.appendChild(mediaEl);
    box.appendChild(anchor);
  } else {
    box.appendChild(mediaEl);
  }

  overlay.style.display = 'flex';

  // Close on backdrop click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) window.closeHomePagePopup();
  });

  // Close on Escape key
  function escHandler(e) {
    if (e.key === 'Escape') { window.closeHomePagePopup(); document.removeEventListener('keydown', escHandler); }
  }
  document.addEventListener('keydown', escHandler);
};

window.closeHomePagePopup = function() {
  var overlay = document.getElementById('homepage-popup-overlay');
  if (!overlay) return;
  overlay.classList.add('closing');
  setTimeout(function() {
    overlay.style.display = 'none';
    overlay.classList.remove('closing');
    overlay.querySelectorAll('video').forEach(function(v) { v.pause(); });
  }, 350);
};
