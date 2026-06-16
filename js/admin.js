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
    return;
  }

  tableBody.innerHTML = filtered.map(prod => {
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

  // Helper to attempt Supabase operation, retrying without GST fields on schema errors
  async function supabaseUpsertWithRetry(operation, payloadFull, payloadStripped) {
    let result = await operation(payloadFull);
    if (result.error) {
      const errMsg = result.error.message || "";
      const isSchemaErr = errMsg.includes("column") || errMsg.includes("schema") ||
                          errMsg.includes("invalid input") || errMsg.includes("uuid") ||
                          errMsg.includes("does not exist");
      if (isSchemaErr) {
        console.warn("Retrying without GST fields due to schema error:", result.error);
        result = await operation(payloadStripped);
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

  let orders = [];
  if (supabase) {
    try {
      const { data: ords, error } = await supabase.from('orders').select('*').order('date', { ascending: false });
      if (error) throw error;
      orders = ords || [];
    } catch (err) {
      console.warn("Failed to fetch orders from Supabase:", err);
      orders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
    }
  } else {
    orders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
  }

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          No customer purchase orders found in registry queues.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = orders.map(ord => {
    console.log('Admin order:', ord);

    const orderDate = new Date(ord.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const itemsList = Array.isArray(ord.items) ? ord.items : [];
    const itemsSummary = itemsList.map(i => `${i.title} (${i.option}) <strong>x${i.quantity}</strong>`).join("<br>");

    // Build select dropdown selector for status
    const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"];
    const dropdownOptions = statusOptions.map(opt => {
      const selected = ord.status === opt ? "selected" : "";
      return `<option value="${opt}" ${selected}>${opt.toUpperCase()}</option>`;
    }).join("");

    return `
      <tr id="admin-order-row-${ord.id}">
        <td style="font-family: 'Space Grotesk', sans-serif; font-weight: 600; color: var(--color-brand); cursor: pointer; text-decoration: underline;" onclick="adminShowOrderDetailsTrigger('${ord.id}')">${ord.id}</td>
        <td style="font-size:0.8rem; font-family: monospace;">${ord.email}</td>
        <td style="font-size: 0.8rem; color: var(--text-secondary);">${orderDate}</td>
        <td style="font-size: 0.8rem; line-height: 1.4; max-width: 250px;">${itemsSummary}</td>
        <td style="font-weight: 700; color: var(--text-primary);">₹${Number(ord.total).toFixed(2)}</td>
        <td>
          <span class="order-status-badge status-${ord.status}">${ord.status}</span>
        </td>
        <td style="display:flex; gap:0.4rem; flex-wrap:wrap; align-items:center;">
          <select class="form-select" style="padding: 0.35rem; font-size: 0.8rem; background: var(--bg-tertiary);" onchange="adminUpdateOrderStatus('${ord.id}', this.value)">
            ${dropdownOptions}
          </select>
          <a href="javascript:void(0)" class="product-card-add-btn receipt-btn-${ord.id}" onclick="window.downloadOrderReceipt('${ord.id}')" style="padding:0.3rem 0.6rem;font-size:0.72rem;text-decoration:none;white-space:nowrap;">⬇ Receipt</a>
        </td>
      </tr>
    `;
  }).join("");

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
      return;
    }

    tableBody.innerHTML = members.map(m => {
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
      return;
    }

    tableBody.innerHTML = messages.map(msg => {
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
      } else {
        newCatWrap.style.display = "none";
        newCatToggle.textContent = "+ New";
        newCatToggle.style.background = "rgba(139,92,246,0.15)";
        newCatToggle.style.color = "var(--color-brand)";
        catSelect.disabled = false;
        catSelect.style.opacity = "1";
      }
    });
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

// ================= DELIVERY & COURIER SETTINGS MANAGEMENT =================

function adminRenderDeliveryPanel() {
  adminRenderStatesTable();
  adminRenderCouriersTable();
}

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
        const { data, error } = await supabase.from('couriers').insert(newCourierObj).select();
        if (error) throw error;
        if (data && data[0]) {
          window.couriersState.push(data[0]);
        } else {
          window.couriersState.push(newCourierObj);
        }
      } else {
        window.couriersState.push(newCourierObj);
      }
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
        const { error } = await supabase.from('couriers').delete().eq('id', courierId);
        if (error) throw error;
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
    return;
  }

  tableBody.innerHTML = couponsState.map(coupon => {
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

  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="text-align:center;color:var(--text-secondary);padding:2.5rem;">
          <i data-feather="inbox" style="width:32px;height:32px;display:block;margin:0 auto 0.75rem;opacity:0.4;"></i>
          No newsletter subscribers yet. Share the sign-up form!
        </td>
      </tr>`;
    if (window.feather) feather.replace();
    return;
  }

  tableBody.innerHTML = rows.map((sub, idx) => {
    const dateStr = new Date(sub.subscribed_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
    return `
      <tr id="newsletter-row-${sub.id}">
        <td style="font-size:0.8rem;color:var(--text-muted);font-family:monospace;">${idx + 1}</td>
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

