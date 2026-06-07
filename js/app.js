// ToyzGuru Core Application Controller

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

// ================= STATE MANAGEMENT =================
let productsState = [];
let cartState = [];
let ordersState = [];
let userState = null;
let stateChargesState = [];
let couriersState = [];
let storeSettings = { tax_enabled: false, sgst_pct: 0, cgst_pct: 0, igst_pct: 0 };

// Expose states to the window object as live getter/setter properties
Object.defineProperty(window, 'productsState', {
  get: () => productsState,
  set: (val) => { productsState = val; }
});
Object.defineProperty(window, 'cartState', {
  get: () => cartState,
  set: (val) => { cartState = val; }
});
Object.defineProperty(window, 'ordersState', {
  get: () => ordersState,
  set: (val) => { ordersState = val; }
});
Object.defineProperty(window, 'userState', {
  get: () => userState,
  set: (val) => { userState = val; }
});
Object.defineProperty(window, 'stateChargesState', {
  get: () => stateChargesState,
  set: (val) => { stateChargesState = val; }
});
Object.defineProperty(window, 'couriersState', {
  get: () => couriersState,
  set: (val) => { couriersState = val; }
});
Object.defineProperty(window, 'storeSettings', {
  get: () => storeSettings,
  set: (val) => { storeSettings = val; }
});

// Initial default user profile
const defaultUser = {
  name: "Srikant SR",
  email: "srikantsr@gmail.com",
  country: "IN",
  state: "Maharashtra",
  loyaltyPoints: 120,
  address: "123 Neon Cyber Blvd, Suite 4B",
  city: "Neo-Tokyo",
  zip: "100-0001",
  phone: "+81 90-1234-5678"
};

// Initial mock historical orders to populate dashboard and profile
const defaultOrders = [
  {
    id: "TG-18245-8912",
    date: "2026-05-12T14:22:00.000Z",
    email: "alexander.m@example.com",
    items: [
      { id: "anime-1", title: "Goku 'Ultra Instinct' Masterlise Figure", price: 6499.00, quantity: 2, option: "Standard PVC" }
    ],
    subtotal: 12998.00,
    discount: 0,
    shipping: 0.00,
    tax: 1039.84,
    total: 14037.84,
    status: "delivered",
    address: "55 Cyber Shibuya St, Tokyo, JP"
  },
  {
    id: "TG-28192-3498",
    date: "2026-05-18T10:15:00.000Z",
    email: "kenji.s@example.com",
    items: [
      { id: "cars-1", title: "1:18 Lykan Hypersport Diecast - Cyberpunk Edition", price: 12499.00, quantity: 1, option: "Midnight Chrome" }
    ],
    subtotal: 12499.00,
    discount: 1249.90,
    shipping: 1000.00,
    tax: 899.93,
    total: 13149.03,
    status: "delivered",
    address: "88 Shinjuku Dr, Tokyo, JP"
  },
  {
    id: "TG-38102-1204",
    date: "2026-05-28T09:44:00.000Z",
    email: "sarah.l@example.com",
    items: [
      { id: "watches-1", title: "Vanguard Cyberpunk Gold Automatic Skeleton Watch", price: 39999.00, quantity: 1, option: "Titanium / Gold" },
      { id: "anime-1", title: "Goku 'Ultra Instinct' Masterlise Figure", price: 6499.00, quantity: 1, option: "Standard PVC" }
    ],
    subtotal: 46498.00,
    discount: 4649.80,
    shipping: 0.00,
    tax: 3347.86,
    total: 45196.06,
    status: "shipped",
    address: "742 Evergreen Terrace, Springfield, US"
  },
  {
    id: "TG-49821-3921",
    date: "2026-05-30T16:02:00.000Z",
    email: "srikantsr@gmail.com",
    items: [
      { id: "watches-2", title: "Oceanic Megalodon Automatic Dive Chronograph", price: 29999.00, quantity: 1, option: "Pacific Teal" }
    ],
    subtotal: 29999.00,
    discount: 2999.90,
    shipping: 0.00,
    tax: 2159.93,
    total: 29159.03,
    status: "processing",
    address: "123 Neon Cyber Blvd, Suite 4B, Neo-Tokyo"
  }
];

const defaultStateCharges = [
  { state_name: "Andhra Pradesh", normal_price: 150, express_price: 350 },
  { state_name: "Arunachal Pradesh", normal_price: 250, express_price: 500 },
  { state_name: "Assam", normal_price: 200, express_price: 450 },
  { state_name: "Bihar", normal_price: 150, express_price: 350 },
  { state_name: "Chhattisgarh", normal_price: 150, express_price: 350 },
  { state_name: "Goa", normal_price: 150, express_price: 350 },
  { state_name: "Gujarat", normal_price: 150, express_price: 350 },
  { state_name: "Haryana", normal_price: 150, express_price: 350 },
  { state_name: "Himachal Pradesh", normal_price: 200, express_price: 450 },
  { state_name: "Jharkhand", normal_price: 150, express_price: 350 },
  { state_name: "Karnataka", normal_price: 150, express_price: 350 },
  { state_name: "Kerala", normal_price: 150, express_price: 350 },
  { state_name: "Madhya Pradesh", normal_price: 150, express_price: 350 },
  { state_name: "Maharashtra", normal_price: 150, express_price: 350 },
  { state_name: "Manipur", normal_price: 250, express_price: 500 },
  { state_name: "Meghalaya", normal_price: 250, express_price: 500 },
  { state_name: "Mizoram", normal_price: 250, express_price: 500 },
  { state_name: "Nagaland", normal_price: 250, express_price: 500 },
  { state_name: "Odisha", normal_price: 150, express_price: 350 },
  { state_name: "Punjab", normal_price: 150, express_price: 350 },
  { state_name: "Rajasthan", normal_price: 150, express_price: 350 },
  { state_name: "Sikkim", normal_price: 200, express_price: 450 },
  { state_name: "Tamil Nadu", normal_price: 150, express_price: 350 },
  { state_name: "Telangana", normal_price: 150, express_price: 350 },
  { state_name: "Tripura", normal_price: 250, express_price: 500 },
  { state_name: "Uttar Pradesh", normal_price: 150, express_price: 350 },
  { state_name: "Uttarakhand", normal_price: 150, express_price: 350 },
  { state_name: "West Bengal", normal_price: 150, express_price: 350 },
  { state_name: "Andaman and Nicobar Islands", normal_price: 300, express_price: 600 },
  { state_name: "Chandigarh", normal_price: 150, express_price: 350 },
  { state_name: "Dadra and Nagar Haveli and Daman and Diu", normal_price: 150, express_price: 350 },
  { state_name: "Delhi", normal_price: 150, express_price: 350 },
  { state_name: "Jammu and Kashmir", normal_price: 200, express_price: 450 },
  { state_name: "Ladakh", normal_price: 250, express_price: 500 },
  { state_name: "Lakshadweep", normal_price: 300, express_price: 600 },
  { state_name: "Puducherry", normal_price: 150, express_price: 350 }
];

const defaultCouriers = [
  { id: "c1", name: "Delhivery", assigned_states: ["Maharashtra", "Karnataka", "Telangana", "Delhi"], is_active: true },
  { id: "c2", name: "Xpressbees", assigned_states: ["Gujarat", "Rajasthan", "Punjab", "Haryana"], is_active: true },
  { id: "c3", name: "Bluedart", assigned_states: ["Tamil Nadu", "Kerala", "Andhra Pradesh", "West Bengal"], is_active: true }
];

// Initialize database from Supabase with localStorage/mock fallbacks
async function initDatabase() {
  // 1. Fetch products (either from Supabase or localStorage fallback)
  if (supabase) {
    try {
      const { data: prods, error } = await supabase.from('products').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (prods && prods.length > 0) {
        productsState = prods;
      } else {
        // Seed table if empty
        if (window.initialProducts && window.initialProducts.length > 0) {
          console.log("Seeding Supabase products table...");
          const dbProducts = window.initialProducts.map(p => ({
            id: p.id,
            title: p.title,
            category: p.category,
            price: p.price,
            original_price: p.originalPrice !== undefined ? p.originalPrice : null,
            image: p.image,
            rating: p.rating,
            reviews_count: p.reviewsCount !== undefined ? p.reviewsCount : 1,
            badge: p.badge,
            description: p.description,
            options: p.options,
            specs: p.specs,
            stock: p.stock
          }));
          const { error: seedError } = await supabase.from('products').insert(dbProducts);
          if (seedError) console.error("Seeding error:", seedError);
        }
        productsState = window.initialProducts || [];
      }
    } catch (err) {
      console.warn("Using localStorage fallback for products due to:", err);
      productsState = JSON.parse(localStorage.getItem("toyzguru_products")) || window.initialProducts || [];
    }
  } else {
    console.warn("Supabase client not loaded, using localStorage/mock fallback for products.");
    productsState = JSON.parse(localStorage.getItem("toyzguru_products")) || window.initialProducts || [];
  }
  localStorage.setItem("toyzguru_products", JSON.stringify(productsState));

  // 2. Auth Session Check & User Profile retrieval
  let session = null;
  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData ? sessionData.session : null;
    } catch (err) {
      console.warn("Failed to get session from Supabase:", err);
    }
  }

  if (session) {
    const user = session.user;
    try {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;

      if (profile) {
        userState = profile;
      } else {
        // Fallback or trigger delay - create profile row
        const newProfile = {
          id: user.id,
          name: user.user_metadata.name || 'Valued Customer',
          email: user.email,
          loyalty_points: 120,
          country: 'IN',
          state: ''
        };
        await supabase.from('profiles').insert(newProfile);
        userState = newProfile;
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      userState = { id: user.id, email: user.email, name: user.user_metadata.name || 'Valued Customer', loyalty_points: 120, country: 'IN', state: '' };
    }

    // Fetch cart for authenticated user
    try {
      const { data: cartData, error } = await supabase.from('cart').select('items').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      if (cartData && cartData.items) {
        cartState = cartData.items;
      } else {
        cartState = [];
      }
    } catch (err) {
      cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];
    }

    // Fetch user specific orders
    try {
      const { data: ords, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (error) throw error;
      ordersState = ords || [];
    } catch (err) {
      ordersState = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
    }
  } else if (localStorage.getItem("toyzguru_mock_session") === "true") {
    // Load mock Google user session
    userState = JSON.parse(localStorage.getItem("toyzguru_user")) || defaultUser;
    cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];
    ordersState = JSON.parse(localStorage.getItem("toyzguru_orders")) || defaultOrders;
  } else if (localStorage.getItem("toyzguru_mock_session") === "true") {
    // Load mock Google user session
    userState = JSON.parse(localStorage.getItem("toyzguru_user")) || defaultUser;
    cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];
    ordersState = JSON.parse(localStorage.getItem("toyzguru_orders")) || defaultOrders;
  } else {
    // Guest User
    userState = null;
    cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];
    ordersState = [];
  }

  // Load state delivery charges from Supabase/localStorage
  if (supabase) {
    try {
      const { data: charges, error: chargesError } = await supabase.from('delivery_charges').select('*');
      if (!chargesError && charges && charges.length > 0) {
        stateChargesState = charges;
      } else {
        const localCharges = localStorage.getItem("toyzguru_state_charges");
        stateChargesState = localCharges ? JSON.parse(localCharges) : defaultStateCharges;
      }
    } catch (err) {
      console.warn("Using localStorage fallback for delivery charges:", err);
      try {
        stateChargesState = JSON.parse(localStorage.getItem("toyzguru_state_charges")) || defaultStateCharges;
      } catch (e) {
        stateChargesState = defaultStateCharges;
      }
    }
  } else {
    try {
      stateChargesState = JSON.parse(localStorage.getItem("toyzguru_state_charges")) || defaultStateCharges;
    } catch (e) {
      stateChargesState = defaultStateCharges;
    }
  }
  localStorage.setItem("toyzguru_state_charges", JSON.stringify(stateChargesState));

  // Load couriers from Supabase/localStorage
  if (supabase) {
    try {
      const { data: cours, error } = await supabase.from('couriers').select('*').order('name', { ascending: true });
      if (error) throw error;
      if (cours && cours.length > 0) {
        couriersState = cours;
      } else {
        console.log("Seeding Supabase couriers table...");
        const { error: seedError } = await supabase.from('couriers').insert(defaultCouriers);
        if (seedError) console.error("Seeding couriers error:", seedError);
        couriersState = defaultCouriers;
      }
    } catch (err) {
      console.warn("Using localStorage fallback for couriers:", err);
      try {
        couriersState = JSON.parse(localStorage.getItem("toyzguru_couriers")) || defaultCouriers;
      } catch (e) {
        couriersState = defaultCouriers;
      }
    }
  } else {
    try {
      couriersState = JSON.parse(localStorage.getItem("toyzguru_couriers")) || defaultCouriers;
    } catch (e) {
      couriersState = defaultCouriers;
    }
  }
  localStorage.setItem("toyzguru_couriers", JSON.stringify(couriersState));

  // Load store settings (tax configuration)
  if (supabase) {
    try {
      const { data: settings, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (!error && settings) {
        storeSettings = {
          ...settings,
          sgst_pct: parseFloat(settings.sgst_pct) || 0,
          cgst_pct: parseFloat(settings.cgst_pct) || 0,
          igst_pct: parseFloat(settings.igst_pct) || 0
        };
      }
    } catch (err) {
      console.warn("Could not load store settings:", err);
    }
  }

  // Update DOM displays
  updateCartBadges();
  renderFeaturedProducts();
  updateProfileAvatar();

  // Re-run view specific rendering if active
  const hash = window.location.hash || "#home";
  const parts = hash.split("?");
  const viewName = parts[0].substring(1);
  const params = getQueryParams(parts[1] || "");
  if (viewName === "catalog") {
    initCatalogView(params);
  } else if (viewName === "checkout") {
    initCheckoutView();
  } else if (viewName === "admin") {
    if (window.adminRenderDeliveryPanel && document.getElementById("admin-delivery-panel")?.classList.contains("active")) {
      window.adminRenderDeliveryPanel();
    }
  }
}

// Save state back to localStorage & Supabase
async function saveCart() {
  localStorage.setItem("toyzguru_cart", JSON.stringify(cartState));
  updateCartBadges();

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        await supabase.from('cart').upsert({ user_id: user.id, items: cartState, updated_at: new Date() });
      }
    } catch (err) {
      console.warn("Could not sync cart to Supabase:", err);
    }
  }
}

async function saveOrders() {
  localStorage.setItem("toyzguru_orders", JSON.stringify(ordersState));
}

async function saveProducts() {
  localStorage.setItem("toyzguru_products", JSON.stringify(productsState));
}

async function saveUser() {
  localStorage.setItem("toyzguru_user", JSON.stringify(userState));
  const isUUID = userState && userState.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userState.id);
  if (supabase && userState && userState.id && isUUID) {
    const dbPayload = { ...userState };
    delete dbPayload.avatar; // Exclude mock avatar Base64 string from Supabase Profiles schema
    const { error } = await supabase.from('profiles').upsert(dbPayload);
    if (error) {
      if (error.message && (error.message.includes("state") || error.code === "PGRST116")) {
        delete dbPayload.state;
        const { error: retryError } = await supabase.from('profiles').upsert(dbPayload);
        if (retryError) console.error("Error saving profile to Supabase (retry):", retryError);
      } else {
        console.error("Error saving profile to Supabase:", error);
      }
    }
  }
}

async function saveStateCharges() {
  localStorage.setItem("toyzguru_state_charges", JSON.stringify(stateChargesState));
  if (supabase) {
    try {
      const { error } = await supabase.from('delivery_charges').upsert(stateChargesState);
      if (error) console.error("Error upserting state charges to Supabase:", error);
    } catch (err) {
      console.error(err);
    }
  }
}
window.saveStateCharges = saveStateCharges;

async function saveCouriers() {
  localStorage.setItem("toyzguru_couriers", JSON.stringify(couriersState));
  if (supabase) {
    try {
      const { error } = await supabase.from('couriers').upsert(couriersState);
      if (error) console.error("Error upserting couriers to Supabase:", error);
    } catch (err) {
      console.error(err);
    }
  }
}
window.saveCouriers = saveCouriers;

// ================= INSTAGRAM INTEGRATION =================
async function fetchInstagramFeed() {
  const token = "IGAAVoYTHswZANBZAFJzR1JRaVlqdXNrN3g3Y2JiTnNlVkI1NldrS2JhR0dvWng5WnJRdTVCdUVTTEFaYmhVN1RVMnAyUXBxN0pQVDVvYWotQUVoWlFqTy1NOWFSZAC1FcXA3aUl6N204eTVkdE44c2pRaWxlZAmtWb2ZAuQlNrbGoyOAZDZD";
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url&access_token=${token}`;
  
  const container = document.getElementById("instagram-feed-grid");
  if (!container) {
    console.warn("fetchInstagramFeed: Element #instagram-feed-grid not found in DOM.");
    return;
  }

  console.log("fetchInstagramFeed: Start fetching from Instagram Basic Display API...");
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Instagram API response status: ${res.status}`);
    }
    const data = await res.json();
    console.log("fetchInstagramFeed: Successfully fetched data from Instagram API:", data);
    
    if (data && data.data && data.data.length > 0) {
      const validMedia = data.data.filter(item => 
        item.media_type === "IMAGE" || 
        item.media_type === "CAROUSEL_ALBUM" || 
        item.media_type === "VIDEO"
      );
      console.log(`fetchInstagramFeed: Found ${validMedia.length} valid media items.`);
      if (validMedia.length > 0) {
        renderInstagramFeed(validMedia.slice(0, 4));
      } else {
        console.warn("fetchInstagramFeed: No valid media items found (IMAGE, CAROUSEL_ALBUM, or VIDEO).");
      }
    } else {
      console.warn("fetchInstagramFeed: Instagram API returned empty or invalid data:", data);
    }
  } catch (e) {
    console.error("Failed to load Instagram feed:", e);
  }
}

function renderInstagramFeed(mediaList) {
  const container = document.getElementById("instagram-feed-grid");
  if (!container) return;

  console.log("renderInstagramFeed: Rendering feed items:", mediaList);

  // Realistic mock stats for each post to look premium, since Basic Display API doesn't return engagement stats
  const mockLikes = [1248, 986, 2105, 1512, 1874, 1140, 2301, 1422];
  const mockComments = [56, 32, 84, 41, 63, 29, 92, 51];

  container.innerHTML = mediaList.map((item, idx) => {
    const likes = mockLikes[idx % mockLikes.length];
    const comments = mockComments[idx % mockComments.length];
    const imgUrl = item.media_type === "VIDEO" ? (item.thumbnail_url || item.media_url) : item.media_url;
    const caption = item.caption || "ToyzGuru premium collector showcase";
    
    return `
      <a href="${item.permalink}" target="_blank" rel="noopener noreferrer" class="instagram-card glass-panel">
        <img src="${imgUrl}" alt="${caption}" class="instagram-img" loading="lazy">
        <div class="instagram-overlay">
          <div class="instagram-stats">
            <span><i data-feather="heart"></i> ${likes.toLocaleString()}</span>
            <span><i data-feather="message-circle"></i> ${comments}</span>
          </div>
        </div>
      </a>
    `;
  }).join("");

  // Re-run feather replace to make icons work inside the dynamic grid
  if (window.feather) {
    window.feather.replace();
  }
}

// ================= APP INITIALIZATION =================
document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  setupRouting();
  setupEventListeners();
  updateCartBadges();
  renderFeaturedProducts();
  fetchInstagramFeed();

  // Re-enable Feather Icons replacing
  feather.replace();

  // Initialize Admin Panel charts and counters
  if (window.adminInit) {
    window.adminInit();
  }
});

// ================= TOAST SYSTEM =================
function showToast(title, description, type = "info") {
  const container = document.getElementById("global-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconName = "info";
  if (type === "success") iconName = "check-circle";
  if (type === "warning") iconName = "alert-triangle";
  if (type === "danger") iconName = "x-circle";

  toast.innerHTML = `
    <i data-feather="${iconName}"></i>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-desc">${description}</div>
    </div>
  `;

  container.appendChild(toast);
  feather.replace();

  // Slide out and remove
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(50px)";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// ================= ROUTING SYSTEM =================
function setupRouting() {
  const handleRoute = async () => {
    const hash = window.location.hash || "#home";
    const parts = hash.split("?");
    const viewName = parts[0].substring(1); // Remove '#'
    const params = getQueryParams(parts[1] || "");

    // Auth redirection rules for protected routes
    if (viewName === "profile" || viewName === "checkout") {
      let isAuthenticated = false;
      if (localStorage.getItem("toyzguru_mock_session") === "true") {
        isAuthenticated = true;
      } else if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) isAuthenticated = true;
        } catch (err) {
          console.warn("Supabase auth check failed, checking mock session:", err);
        }
      }


      if (!isAuthenticated) {
        window.location.hash = "#auth";
        showToast("Sign In Required", "Please sign in to access your profile or checkout.", "warning");
        return;
      }
    }

    // Toggle panels
    const panels = document.querySelectorAll(".view-panel");
    panels.forEach(panel => {
      panel.style.display = "none";
    });

    const targetPanel = document.getElementById(`${viewName}-view`);
    if (targetPanel) {
      targetPanel.style.display = "block";
      window.scrollTo(0, 0);
    } else {
      // Fallback
      document.getElementById("home-view").style.display = "block";
    }

    // Update active nav link
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("data-view") === viewName) {
        link.classList.add("active");
      }
    });

    // Run view specific initializers
    if (viewName === "home" || viewName === "") {
      renderFeaturedProducts();
    } else if (viewName === "catalog") {
      initCatalogView(params);
    } else if (viewName === "profile") {
      initProfileView();
    } else if (viewName === "checkout") {
      initCheckoutView();
    } else if (viewName === "contact") {
      initContactView();
    } else if (viewName === "admin") {
      if (window.adminRenderDashboard) {
        window.adminRenderDashboard();
      }
    }
  };

  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("load", handleRoute);
}

function getQueryParams(queryString) {
  const params = {};
  if (!queryString) return params;
  const pairs = queryString.split("&");
  pairs.forEach(pair => {
    const [key, value] = pair.split("=");
    params[decodeURIComponent(key)] = decodeURIComponent(value || "");
  });
  return params;
}

// ================= RENDER HOMEPAGE featured PRODUCTS =================
function renderFeaturedProducts() {
  const container = document.getElementById("featured-products-container");
  if (!container) return;

  // Grab the first 4 products in productsState
  const featured = productsState.slice(0, 4);
  container.innerHTML = featured.map(prod => renderProductCardHTML(prod)).join("");
  feather.replace();
}

function updateProfileAvatar() {
  const avatarEl = document.getElementById("profile-card-avatar");
  if (avatarEl) {
    avatarEl.src = (userState && userState.avatar) ? userState.avatar : "assets/images/product_anime_figure.png";
  }
}

function renderProductCardHTML(product) {
  const price = Number(product.price);
  const originalPrice = product.original_price !== undefined && product.original_price !== null ? Number(product.original_price) : (product.originalPrice !== undefined ? Number(product.originalPrice) : null);
  const reviewsCount = product.reviews_count !== undefined ? product.reviews_count : (product.reviewsCount !== undefined ? product.reviewsCount : 1);
  const rating = Number(product.rating || 5);

  const displayOriginal = originalPrice && originalPrice > price
    ? `<span class="original-price">₹${originalPrice.toFixed(2)}</span>`
    : "";

  const isSoldOut = product.stock <= 0;

  const displayBadge = isSoldOut
    ? `<span class="product-card-badge badge-soldout">Sold Out</span>`
    : (product.badge
      ? `<span class="product-card-badge badge-${product.badge.toLowerCase()}">${product.badge}</span>`
      : "");

  const imgStyle = isSoldOut ? 'style="filter: grayscale(80%); opacity: 0.6;"' : '';

  const overlayCartBtnHTML = isSoldOut
    ? `<button class="product-action-btn" disabled style="opacity: 0.5; cursor: not-allowed; pointer-events: none;" title="Sold Out">
         <i data-feather="shopping-cart"></i>
       </button>`
    : `<button class="product-action-btn" onclick="quickAddToCart('${product.id}')" title="Add to Cart">
         <i data-feather="shopping-cart"></i>
       </button>`;

  const addBtnHTML = isSoldOut
    ? `<button class="product-card-add-btn" disabled style="opacity: 0.5; cursor: not-allowed; background: var(--bg-tertiary) !important; color: var(--text-muted) !important; box-shadow: none !important; border-color: var(--glass-border) !important;">Sold Out</button>`
    : `<button class="product-card-add-btn" onclick="quickAddToCart('${product.id}')">Add +</button>`;

  return `
    <article class="product-card" id="product-card-${product.id}">
      ${displayBadge}
      <div class="product-card-img-wrap">
        <img src="${product.image}" alt="${product.title}" class="product-card-img" ${imgStyle} loading="lazy">
        <div class="product-card-overlay">
          <button class="product-action-btn" onclick="openProductModal('${product.id}')" title="Quick View">
            <i data-feather="eye"></i>
          </button>
          ${overlayCartBtnHTML}
        </div>
      </div>
      <div class="product-card-info">
        <div class="product-card-cat">${product.category.replace("-", " ")}</div>
        <h3 class="product-card-title" onclick="openProductModal('${product.id}')">${product.title}</h3>
        <div class="product-rating">
          <i data-feather="star" class="star-icon" style="width: 14px; height: 14px;"></i>
          <span class="product-card-rating-val">${rating.toFixed(1)} (${reviewsCount})</span>
        </div>
        <div class="product-card-footer">
          <div class="product-card-price">
            ₹${price.toFixed(2)}
            ${displayOriginal}
          </div>
          ${addBtnHTML}
        </div>
      </div>
    </article>
  `;
}

// ================= CATALOG LOGIC =================
let catalogFilters = {
  search: "",
  category: "all",
  priceMax: 50000,
  sort: "featured"
};

function initCatalogView(params) {
  // Apply URL parameters if any, otherwise reset to defaults
  catalogFilters.category = params.category || "all";
  catalogFilters.search = params.search || "";

  // Update UI values to match filter values
  const sidebarSearch = document.getElementById("sidebar-search");
  if (sidebarSearch) sidebarSearch.value = catalogFilters.search;

  const priceSlider = document.getElementById("filter-price-slider");
  if (priceSlider) {
    priceSlider.value = catalogFilters.priceMax;
    document.getElementById("price-slider-value").textContent = `₹${catalogFilters.priceMax}`;
  }

  updateCategoryCountBadges();
  syncCategoryButtonsUI();
  applyFiltersAndRender();

  // Clear search input fields after showing results
  const globalSearchInput = document.getElementById("global-search-input");
  if (globalSearchInput) globalSearchInput.value = "";
  if (sidebarSearch) sidebarSearch.value = "";
}

function updateCategoryCountBadges() {
  const catList = document.getElementById("filter-categories-list");
  if (!catList) return;

  // Count products per category
  const counts = { all: productsState.length };
  productsState.forEach(prod => {
    const cat = prod.category;
    counts[cat] = (counts[cat] || 0) + 1;
  });

  const categoryDisplayNames = {
    "anime": "Anime Figures",
    "toy-cars": "Collectible Cars",
    "watches": "Imported Watches"
  };

  const getCategoryDisplayName = (cat) => {
    if (categoryDisplayNames[cat]) return categoryDisplayNames[cat];
    return cat.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  // Build the list of buttons
  let html = `<button class="filter-cat-btn ${catalogFilters.category === 'all' ? 'active' : ''}" data-cat="all">All Items <span class="filter-cat-count" id="count-all">${counts.all}</span></button>`;

  const uniqueCats = Object.keys(counts).filter(k => k !== 'all').sort();
  uniqueCats.forEach(cat => {
    const activeClass = catalogFilters.category === cat ? 'active' : '';
    html += `<button class="filter-cat-btn ${activeClass}" data-cat="${cat}">${getCategoryDisplayName(cat)} <span class="filter-cat-count" id="count-${cat}">${counts[cat]}</span></button>`;
  });

  catList.innerHTML = html;
}

function syncCategoryButtonsUI() {
  const buttons = document.querySelectorAll("#filter-categories-list .filter-cat-btn");
  buttons.forEach(btn => {
    btn.classList.remove("active");
    if (btn.getAttribute("data-cat") === catalogFilters.category) {
      btn.classList.add("active");
    }
  });
}

function applyFiltersAndRender() {
  const gridContainer = document.getElementById("catalog-grid-container");
  if (!gridContainer) return;

  // Filter
  let filtered = productsState.filter(prod => {
    const matchesSearch = prod.title.toLowerCase().includes(catalogFilters.search.toLowerCase()) ||
      prod.description.toLowerCase().includes(catalogFilters.search.toLowerCase());
    const matchesCategory = catalogFilters.category === "all" || prod.category === catalogFilters.category;
    const matchesPrice = prod.price <= catalogFilters.priceMax;
    return matchesSearch && matchesCategory && matchesPrice;
  });

  // Sort
  if (catalogFilters.sort === "price-low") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (catalogFilters.sort === "price-high") {
    filtered.sort((a, b) => b.price - a.price);
  } else if (catalogFilters.sort === "rating") {
    filtered.sort((a, b) => b.rating - a.rating);
  }

  // Render
  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0; color: var(--text-secondary);">
        <i data-feather="alert-octagon" style="width: 48px; height: 48px; opacity: 0.5; margin-bottom: 1rem;"></i>
        <h3>No Products Match Your Search</h3>
        <p>Try resetting the sidebar filters or modifying your search terms.</p>
      </div>
    `;
  } else {
    gridContainer.innerHTML = filtered.map(prod => renderProductCardHTML(prod)).join("");
  }

  // Update count text
  const countText = document.getElementById("catalog-results-text");
  if (countText) {
    countText.textContent = `Showing ${filtered.length} of ${productsState.length} premium products`;
  }

  feather.replace();
}

// ================= QUICK ADD TO CART =================
function quickAddToCart(productId) {
  const product = productsState.find(p => p.id === productId);
  if (!product) return;

  // Pick first available option as default
  const defaultOption = product.options && product.options.length > 0 ? product.options[0] : "Standard";
  addToCart(productId, 1, defaultOption);
}

// ================= PRODUCT DETAIL MODAL LOGIC =================
let modalActiveProduct = null;
let modalSelectedOption = "";
let modalSelectedQty = 1;

function openProductModal(productId) {
  const product = productsState.find(p => p.id === productId);
  if (!product) return;

  modalActiveProduct = product;
  modalSelectedQty = product.stock <= 0 ? 0 : 1;

  // DOM bindings
  document.getElementById("modal-product-image").src = product.image;
  document.getElementById("modal-product-image").alt = product.title;
  document.getElementById("modal-product-category").textContent = product.category.replace("-", " ");
  document.getElementById("modal-product-title").textContent = product.title;
  document.getElementById("modal-product-price").textContent = `₹${product.price.toFixed(2)}`;
  document.getElementById("modal-product-desc").textContent = product.description;
  document.getElementById("modal-qty-val").textContent = modalSelectedQty;

  // Badge
  const modalBadge = document.getElementById("modal-product-badge");
  if (product.stock <= 0) {
    modalBadge.textContent = "Sold Out";
    modalBadge.className = "detail-badge badge-soldout";
    modalBadge.style.display = "inline-block";
  } else if (product.badge) {
    modalBadge.textContent = product.badge;
    modalBadge.className = `detail-badge badge-${product.badge.toLowerCase()}`;
    modalBadge.style.display = "inline-block";
  } else {
    modalBadge.style.display = "none";
  }

  // Original Price
  const originalPriceEl = document.getElementById("modal-product-original-price");
  const origPrice = product.original_price !== undefined && product.original_price !== null ? Number(product.original_price) : (product.originalPrice !== undefined ? Number(product.originalPrice) : null);
  if (origPrice && origPrice > product.price) {
    originalPriceEl.textContent = `₹${origPrice.toFixed(2)}`;
    originalPriceEl.style.display = "inline";
  } else {
    originalPriceEl.style.display = "none";
  }

  // Stars
  const starsContainer = document.getElementById("modal-product-stars-container");
  starsContainer.innerHTML = "";
  const fullStars = Math.floor(product.rating);
  for (let i = 0; i < 5; i++) {
    const star = document.createElement("i");
    star.setAttribute("data-feather", "star");
    star.className = "star-icon";
    if (i < fullStars) {
      star.style.fill = "var(--color-watches)";
    } else {
      star.style.opacity = "0.3";
    }
    starsContainer.appendChild(star);
  }
  const reviewsCount = product.reviews_count !== undefined ? product.reviews_count : (product.reviewsCount !== undefined ? product.reviewsCount : 1);
  document.getElementById("modal-product-reviews").textContent = `(${reviewsCount} verified reviews)`;

  // Dynamic Options (Sizing, Scale, etc.)
  const optionsTitle = document.getElementById("modal-product-options-title");
  const optionsSelectors = document.getElementById("modal-product-options-selectors");

  if (product.category === "anime") {
    optionsTitle.textContent = "Select Scale Edition / Base";
  } else if (product.category === "toy-cars") {
    optionsTitle.textContent = "Select Scale Color / Model";
  } else if (product.category === "watches") {
    optionsTitle.textContent = "Select Style Casing";
  } else {
    optionsTitle.textContent = "Options";
  }

  optionsSelectors.innerHTML = "";
  if (product.options && product.options.length > 0) {
    modalSelectedOption = product.options[0];
    product.options.forEach((opt, idx) => {
      const btn = document.createElement("button");
      btn.className = `selector-option ${idx === 0 ? "active" : ""}`;
      btn.textContent = opt;
      btn.onclick = () => {
        const sibs = optionsSelectors.querySelectorAll(".selector-option");
        sibs.forEach(s => s.classList.remove("active"));
        btn.classList.add("active");
        modalSelectedOption = opt;
      };
      optionsSelectors.appendChild(btn);
    });
    document.getElementById("modal-product-options-wrap").style.display = "block";
  } else {
    modalSelectedOption = "Standard";
    document.getElementById("modal-product-options-wrap").style.display = "none";
  }

  // Technical Specs list
  const specsList = document.getElementById("modal-product-specs-list");
  specsList.innerHTML = "";
  for (const [key, value] of Object.entries(product.specs || {})) {
    const row = document.createElement("div");
    row.className = "detail-spec-row";
    row.innerHTML = `
      <span class="detail-spec-label">${key}</span>
      <span class="detail-spec-val">${value}</span>
    `;
    specsList.appendChild(row);
  }

  // Disable button if out of stock
  const addToCartBtn = document.getElementById("modal-add-cart-btn");
  if (product.stock <= 0) {
    addToCartBtn.textContent = "Sold Out";
    addToCartBtn.disabled = true;
  } else {
    addToCartBtn.textContent = "Add to Cart";
    addToCartBtn.disabled = false;
  }

  // Display overlay
  document.getElementById("product-detail-modal-overlay").classList.add("active");
  document.body.style.overflow = "hidden"; // Disable background scrolling

  feather.replace();
}

function closeProductModal() {
  document.getElementById("product-detail-modal-overlay").classList.remove("active");
  document.body.style.overflow = "";
}

// ================= CART DRAWER OPERATIONS =================
function toggleCartDrawer(open) {
  const overlay = document.getElementById("cart-drawer-overlay");
  const drawer = document.getElementById("cart-drawer");

  if (open) {
    renderCartDrawer();
    overlay.classList.add("active");
    drawer.classList.add("active");
  } else {
    overlay.classList.remove("active");
    drawer.classList.remove("active");
  }
}

function addToCart(productId, qty, option) {
  const product = productsState.find(p => p.id === productId);
  if (!product) return;

  if (product.stock <= 0) {
    showToast("Sold Out", `${product.title} is currently sold out.`, "warning");
    return;
  }

  // Check if option is already in cart
  const existingItem = cartState.find(item => item.productId === productId && item.option === option);
  if (existingItem) {
    // check stock
    if (existingItem.quantity + qty > product.stock) {
      showToast("Inventory Limit", `Only ${product.stock} units are available.`, "warning");
      existingItem.quantity = product.stock;
    } else {
      existingItem.quantity += qty;
      showToast("Updated Cart Quantity", `${product.title} (${option}) quantity updated in cart.`, "success");
    }
  } else {
    if (qty > product.stock) {
      showToast("Inventory Limit", `Only ${product.stock} units are available.`, "warning");
      qty = product.stock;
    }
    cartState.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      option: option,
      quantity: qty
    });
    showToast("Added to Cart", `${product.title} (${option}) added to cart.`, "success");
  }

  saveCart();
  updateCartBadges();
  renderCartDrawer();

  // Pulse Cart Button
  const cartBtn = document.getElementById("cart-icon-btn");
  if (cartBtn) {
    cartBtn.style.transform = "scale(1.2)";
    setTimeout(() => {
      cartBtn.style.transform = "";
    }, 200);
  }
}

function updateCartQuantity(productId, option, change) {
  const item = cartState.find(i => i.productId === productId && i.option === option);
  if (!item) return;

  const product = productsState.find(p => p.id === productId);

  if (item.quantity + change <= 0) {
    removeFromCart(productId, option);
  } else {
    if (product && item.quantity + change > product.stock) {
      showToast("Inventory Limit", "Cannot exceed available vault stock levels.", "warning");
    } else {
      item.quantity += change;
      saveCart();
      renderCartDrawer();
    }
  }
}

function removeFromCart(productId, option) {
  cartState = cartState.filter(item => !(item.productId === productId && item.option === option));
  saveCart();
  renderCartDrawer();
  showToast("Removed Item", "Product deleted from cart drawer.", "info");
}

function updateCartBadges() {
  const totalItems = cartState.reduce((sum, item) => sum + item.quantity, 0);
  const badgeCount = document.getElementById("cart-badge-count");
  if (badgeCount) badgeCount.textContent = totalItems;

  const drawerBadgeCount = document.getElementById("cart-drawer-badge-count");
  if (drawerBadgeCount) drawerBadgeCount.textContent = totalItems;
}

function renderCartDrawer() {
  const container = document.getElementById("cart-items-list");
  const subtotalEl = document.getElementById("cart-drawer-subtotal");
  if (!container) return;

  if (cartState.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-message">
        <i data-feather="shopping-bag" style="width: 48px; height: 48px;"></i>
        <p>Your vault cart is empty.</p>
        <p style="font-size: 0.8rem; margin-top: 0.5rem;">Secure a premium product drop to begin.</p>
      </div>
    `;
    subtotalEl.textContent = "₹0.00";
    feather.replace();
    return;
  }

  container.innerHTML = cartState.map(item => {
    return `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.title}" class="cart-item-img">
        <div class="cart-item-details">
          <div class="cart-item-name">${item.title}</div>
          <div class="cart-item-option">Option: ${item.option}</div>
          <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
          <div class="cart-item-actions">
            <button class="qty-btn" onclick="updateCartQuantity('${item.productId}', '${item.option}', -1)">-</button>
            <span class="cart-item-qty">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartQuantity('${item.productId}', '${item.option}', 1)">+</button>
          </div>
        </div>
        <div class="cart-item-remove" onclick="removeFromCart('${item.productId}', '${item.option}')">
          <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
        </div>
      </div>
    `;
  }).join("");

  const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;

  feather.replace();
}

// ================= CHECKOUT LOGIC =================
let isCouponApplied = false;
let activeCoupon = null;

function calculateCouponDiscount(subtotal) {
  if (!activeCoupon) return 0;
  let discount = 0;
  if (activeCoupon.type === 'percentage') {
    discount = subtotal * (Number(activeCoupon.value) / 100);
    if (activeCoupon.max_discount && discount > Number(activeCoupon.max_discount)) {
      discount = Number(activeCoupon.max_discount);
    }
  } else if (activeCoupon.type === 'fixed') {
    discount = Number(activeCoupon.value);
  }
  return Math.min(discount, subtotal);
}

function parseNormalAddress(addrStr) {
  if (!addrStr) return null;
  if (addrStr.trim().startsWith('{')) {
    try {
      return JSON.parse(addrStr);
    } catch (e) {}
  }
  const parts = addrStr.split(', ');
  if (parts.length >= 8) {
    return {
      name: parts[0] || "",
      email: parts[1] || "",
      phone: parts[2] || "",
      address: parts[3] || "",
      city: parts[4] || "",
      zip: parts[5] || "",
      state: parts[6] || "",
      country: parts[7] || ""
    };
  }
  return {
    name: parts[0] || "",
    email: parts[1] || "",
    phone: parts[2] || "",
    address: parts.slice(3).join(", ") || "",
    city: "",
    zip: "",
    state: "",
    country: "India"
  };
}

function initCheckoutView() {
  if (cartState.length === 0) {
    window.location.hash = "#catalog";
    showToast("Cart Empty", "Please add items to your cart before checking out.", "warning");
    return;
  }

  const addrContainer = document.getElementById("checkout-addresses-container");
  if (addrContainer) {
    let html = '';
    
    // 1. Saved Address
    let dName = userState ? (userState.delivery_name || userState.name || "") : "";
    let dAddr = userState ? (userState.delivery_address || userState.address || "") : "";
    let dCity = userState ? (userState.delivery_city || userState.city || "") : "";
    let dState = userState ? (userState.delivery_state || userState.state || "") : "";
    let savedDesc = (dName || dAddr) ? `${dName} | ${dAddr}, ${dCity}, ${dState}` : "No saved delivery address found. Home address will be used.";
    
    html += `
      <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 8px;">
        <input type="radio" name="checkout-address-option" value="saved" checked style="accent-color: var(--color-brand); margin-top: 0.25rem;">
        <div>
          <h5 style="margin: 0 0 0.25rem; font-size: 0.9rem; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif;">Default Delivery Address</h5>
          <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;" id="checkout-saved-delivery-desc">${savedDesc}</p>
        </div>
      </label>
    `;

    // Removed Alternative 1 and 2 per user request

    // 4. Enter New
    html += `
      <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 8px;">
        <input type="radio" name="checkout-address-option" value="new" style="accent-color: var(--color-brand); margin-top: 0.25rem;">
        <div>
          <h5 style="margin: 0 0 0.25rem; font-size: 0.9rem; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif;">Enter another delivery address</h5>
          <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">Fill in the form below with a new address to deliver to.</p>
        </div>
      </label>
    `;

    addrContainer.innerHTML = html;
  }

  // Populate Indian States selector
  const stateSelect = document.getElementById("ship-state");
  if (stateSelect) {
    stateSelect.innerHTML = stateChargesState.map(s => `<option value="${s.state_name}">${s.state_name}</option>`).join("");
  }

  // Apply default selected address fields
  applyCheckoutAddressSelection();

  // Listen to address option changes
  const optionRadios = document.querySelectorAll('input[name="checkout-address-option"]');
  optionRadios.forEach(radio => {
    radio.removeEventListener("change", applyCheckoutAddressSelection);
    radio.addEventListener("change", applyCheckoutAddressSelection);
  });

  if (stateSelect) {
    stateSelect.removeEventListener("change", renderCheckoutSummary);
    stateSelect.addEventListener("change", renderCheckoutSummary);
  }

  const modeRadios = document.querySelectorAll('input[name="shipping-mode"]');
  modeRadios.forEach(radio => {
    radio.removeEventListener("change", renderCheckoutSummary);
    radio.addEventListener("change", renderCheckoutSummary);
  });

  renderCheckoutSummary();
}

function applyCheckoutAddressSelection() {
  const selectedOption = document.querySelector('input[name="checkout-address-option"]:checked')?.value || "saved";
  
  if (selectedOption === "saved") {
    // Fill saved delivery address or home address fallback
    const fullName = userState ? (userState.delivery_name || userState.name || "") : "";
    document.getElementById("ship-first-name").value = fullName.split(" ")[0] || "";
    document.getElementById("ship-last-name").value = fullName.split(" ").slice(1).join(" ") || "";
    document.getElementById("ship-email").value = userState ? (userState.delivery_email || userState.email || "") : "";
    document.getElementById("ship-phone").value = userState ? (userState.delivery_phone || userState.phone || "") : "";
    document.getElementById("ship-address").value = userState ? (userState.delivery_address || userState.address || "") : "";
    document.getElementById("ship-city").value = userState ? (userState.delivery_city || userState.city || "") : "";
    document.getElementById("ship-zip").value = userState ? (userState.delivery_zip || userState.zip || "") : "";
    
    const stateVal = userState ? (userState.delivery_state || userState.state || "") : "";
    const stateSelect = document.getElementById("ship-state");
    if (stateSelect && stateVal) {
      stateSelect.value = stateVal;
    }
  } else if (selectedOption === "new") {
    // Give blank fields to enter another address
    document.getElementById("ship-first-name").value = "";
    document.getElementById("ship-last-name").value = "";
    document.getElementById("ship-email").value = "";
    document.getElementById("ship-phone").value = "";
    document.getElementById("ship-address").value = "";
    document.getElementById("ship-city").value = "";
    document.getElementById("ship-zip").value = "";
    const stateSelect = document.getElementById("ship-state");
    if (stateSelect) {
      stateSelect.selectedIndex = 0;
    }
  }

  // Toggle form visibility
  const wrapper = document.getElementById("checkout-address-fields-wrapper");
  if (wrapper) {
    wrapper.style.display = selectedOption === "new" ? "grid" : "none";
  }

  // Ensure shipping cost updates when selection changes
  renderCheckoutSummary();

  // Trigger UI summary updates
  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const container = document.getElementById("checkout-summary-items");
  if (!container) return;

  container.innerHTML = cartState.map(item => `
    <div class="summary-item">
      <div>
        <span class="summary-item-name">${item.title}</span>
        <span class="summary-item-qty">x${item.quantity}</span>
      </div>
      <strong>₹${(item.price * item.quantity).toFixed(2)}</strong>
    </div>
  `).join("");

  // Calculation parameters
  const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Validate min_order on active coupon if applied
  if (activeCoupon && activeCoupon.min_order && subtotal < Number(activeCoupon.min_order)) {
    const minOrderVal = Number(activeCoupon.min_order);
    activeCoupon = null;
    isCouponApplied = false;
    setTimeout(() => {
      showToast("Coupon Removed", `Cart total is below the minimum order of ₹${minOrderVal.toFixed(2)}.`, "warning");
    }, 100);
  }

  const discount = calculateCouponDiscount(subtotal);

  const country = document.getElementById("ship-country").value;
  let shipping = 1000.00; // International fallback

  if (country === "IN") {
    const stateName = document.getElementById("ship-state").value;
    const shippingMode = document.querySelector('input[name="shipping-mode"]:checked')?.value || "normal";

    const chargeObj = stateChargesState.find(s => s.state_name === stateName);
    if (chargeObj) {
      const normalPrice = Number(chargeObj.normal_price);
      const expressPrice = Number(chargeObj.express_price);

      // Update labels in UI
      const normalLbl = document.getElementById("checkout-normal-cost-lbl");
      const expressLbl = document.getElementById("checkout-express-cost-lbl");
      if (normalLbl) normalLbl.textContent = `₹${normalPrice.toFixed(2)}`;
      if (expressLbl) expressLbl.textContent = `₹${expressPrice.toFixed(2)}`;

      if (subtotal > 12000) {
        if (normalLbl) normalLbl.textContent = "FREE";
        shipping = shippingMode === "express" ? expressPrice : 0.00;
      } else {
        shipping = shippingMode === "express" ? expressPrice : normalPrice;
      }

      // Display assigned couriers
      const activeCouriers = couriersState.filter(c => c.is_active && c.assigned_states.includes(stateName));
      const courierMsg = document.getElementById("checkout-assigned-courier-msg");
      if (courierMsg) {
        if (activeCouriers.length > 0) {
          courierMsg.innerHTML = `Delivered via: <strong>${activeCouriers.map(c => c.name).join(", ")}</strong>`;
          courierMsg.style.color = "var(--color-success)";
        } else {
          courierMsg.textContent = "Delivered via: Standard National Post (No courier assigned)";
          courierMsg.style.color = "var(--text-secondary)";
        }
      }
    }
  } else {
    shipping = subtotal > 12000 ? 0.00 : 1000.00;
  }

  let tax = 0;
  let taxLabel = "Estimated Tax (0%)";
  if (storeSettings.tax_enabled) {
    const totalTaxPct = storeSettings.cgst_pct;
    tax = (subtotal - discount) * (totalTaxPct / 100);
    taxLabel = `CGST (${totalTaxPct}%)`;
  }
  const taxLabelEl = document.getElementById("checkout-tax-label");
  if (taxLabelEl) taxLabelEl.textContent = taxLabel;

  const total = (subtotal - discount) + shipping + tax;

  document.getElementById("checkout-subtotal").textContent = `₹${subtotal.toFixed(2)}`;

  const discountRow = document.getElementById("checkout-discount-row");
  if (activeCoupon) {
    discountRow.style.display = "flex";
    const labelSpan = discountRow.querySelector("span:first-child") || discountRow.children[0];
    const typeLabel = activeCoupon.type === 'percentage' ? `${activeCoupon.value}%` : `₹${Number(activeCoupon.value).toFixed(2)}`;
    if (labelSpan) {
      labelSpan.textContent = `Discount Applied (${activeCoupon.code} - ${typeLabel})`;
    }
    document.getElementById("checkout-discount-val").textContent = `-₹${discount.toFixed(2)}`;
  } else {
    discountRow.style.display = "none";
  }

  document.getElementById("checkout-shipping").textContent = shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`;
  document.getElementById("checkout-tax").textContent = `₹${tax.toFixed(2)}`;
  document.getElementById("checkout-total-due").textContent = `₹${total.toFixed(2)}`;

  // Update UPI QR Code display amount
  const upiQrAmt = document.getElementById("upi-qr-amount");
  if (upiQrAmt) {
    upiQrAmt.textContent = `₹${total.toFixed(2)}`;
  }
}

// Apply checkout coupon
async function applyCoupon() {
  const codeInput = document.getElementById("coupon-code-input");
  const code = codeInput.value.trim().toUpperCase();
  if (!code) {
    showToast("Invalid Coupon", "Please enter a coupon code.", "warning");
    return;
  }

  // 1. Fetch coupon details (Supabase with localStorage fallback)
  let coupon = null;
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient.from('coupons').select('*').eq('code', code).maybeSingle();
      if (!error && data) {
        coupon = data;
      }
    } catch (err) {
      console.warn("Failed to fetch coupon from Supabase, checking local fallback:", err);
    }
  }

  if (!coupon) {
    // Check offline localStorage fallback
    const localCoupons = JSON.parse(localStorage.getItem("toyzguru_coupons")) || [];
    coupon = localCoupons.find(c => c.code.toUpperCase() === code);
  }

  if (!coupon) {
    showToast("Invalid Coupon", "Promo code not recognized.", "danger");
    return;
  }

  // 2. Validate Coupon Conditions
  if (!coupon.is_active) {
    showToast("Coupon Inactive", "This promo code is no longer active.", "warning");
    return;
  }

  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    showToast("Coupon Expired", "This coupon has expired.", "warning");
    return;
  }

  const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (coupon.min_order && subtotal < Number(coupon.min_order)) {
    showToast("Minimum Order Required", `A minimum order of ₹${Number(coupon.min_order).toFixed(2)} is required to use this coupon.`, "warning");
    return;
  }

  // 3. Apply the Coupon
  activeCoupon = coupon;
  isCouponApplied = true;
  renderCheckoutSummary();
  
  const discountLabel = coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`;
  showToast("Coupon Applied", `Coupon code ${coupon.code} verified: ${discountLabel} Discount Applied.`, "success");
}

// Masking card formatting
function setupCreditCardMasking() {
  // Card masking logic removed since payment is shifted to UPI QR Code
}

// Process Secure Payment Simulation
async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const shippingForm = document.getElementById("shipping-form");
  if (!shippingForm.checkValidity()) {
    showToast("Missing Fields", "Please complete all shipping forms.", "warning");
    window.scrollTo(0, document.getElementById("shipping-form").offsetTop - 100);
    return;
  }

  const address = document.getElementById("ship-address").value;

  const method = document.getElementById("selected-payment-method")?.value || "razorpay";

  // Visual submission loader
  const paymentForm = document.getElementById("payment-details-form");
  const loader = document.getElementById("payment-status-loader");
  const loaderTitle = document.getElementById("payment-loader-title");
  const loaderDesc = document.getElementById("payment-loader-desc");

  if (loaderTitle && loaderDesc) {
    loaderTitle.textContent = "Opening Secure Gateway...";
    loaderDesc.textContent = "Please complete your payment in the Razorpay window.";
  }

  paymentForm.style.display = "none";
  loader.classList.add("active");

  try {
    const firstName = document.getElementById("ship-first-name").value;
    const lastName = document.getElementById("ship-last-name").value;
    const email = document.getElementById("ship-email").value;
    const city = document.getElementById("ship-city").value;
    const zip = document.getElementById("ship-zip").value;
    const country = document.getElementById("ship-country").value;
    const phone = document.getElementById("ship-phone").value;

    const subtotal = cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = calculateCouponDiscount(subtotal);

    let shipping = 1000.00; // International fallback
    if (country === "IN") {
      const stateName = document.getElementById("ship-state").value;
      const shippingMode = document.querySelector('input[name="shipping-mode"]:checked')?.value || "normal";
      const chargeObj = stateChargesState.find(s => s.state_name === stateName);
      if (chargeObj) {
        const normalPrice = Number(chargeObj.normal_price);
        const expressPrice = Number(chargeObj.express_price);
        if (subtotal > 12000) {
          shipping = shippingMode === "express" ? expressPrice : 0.00;
        } else {
          shipping = shippingMode === "express" ? expressPrice : normalPrice;
        }
      }
    } else {
      shipping = subtotal > 12000 ? 0.00 : 1000.00;
    }

    let tax = 0;
    if (storeSettings.tax_enabled) {
      const totalTaxPct = storeSettings.cgst_pct;
      tax = (subtotal - discount) * (totalTaxPct / 100);
    }
    const total = (subtotal - discount) + shipping + tax;

    const newOrderId = `TG-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const stateName = country === "IN" ? document.getElementById("ship-state").value : "";
    const stateStr = stateName ? `, ${stateName}` : "";
    const fullAddress = `${address}, ${city}${stateStr}, ${zip}, ${country}`;

    // Get current session
    let userId = null;
    let session = null;
    if (supabase) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        session = sessionData ? sessionData.session : null;
        userId = session ? session.user.id : null;
      } catch (err) {
        console.warn("Failed to get session from Supabase during checkout:", err);
      }
    } else {
      userId = userState ? userState.id : null;
    }

    const newOrderObj = {
      id: newOrderId,
      user_id: userId,
      email: email,
      items: [...cartState],
      subtotal: subtotal,
      discount: discount,
      shipping: shipping,
      tax: tax,
      total: total,
      status: "processing",
      address: fullAddress,
      date: new Date().toISOString()
    };

    const executeSaveOrder = async () => {
      // 1. Save order (Supabase if available, localStorage fallback always)
      if (supabase) {
        const { error: orderError } = await supabase.from('orders').insert(newOrderObj);
        if (orderError) throw orderError;
      } else {
        let localOrders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
        localOrders.push(newOrderObj);
        localStorage.setItem("toyzguru_orders", JSON.stringify(localOrders));
      }

      // 2. Adjust Products Inventory Stock levels
      for (const cartItem of cartState) {
        const match = productsState.find(p => p.id === cartItem.productId);
        if (match) {
          const newStock = Math.max(0, match.stock - cartItem.quantity);
          match.stock = newStock;
          // Update in database if supabase is available
          if (supabase) {
            try {
              const { error: stockError } = await supabase.from('products').update({ stock: newStock }).eq('id', cartItem.productId);
              if (stockError) console.error("Stock update error:", stockError);
            } catch (err) {
              console.error("Stock update error:", err);
            }
          }
        }
      }
      await saveProducts(); // sync to localStorage

      // 3. Give loyalty points & update profile parameters
      if (userState) {
        const pointsGained = Math.round(total);
        userState.loyalty_points = (userState.loyalty_points || 120) + pointsGained;
        userState.name = `${firstName} ${lastName}`;
        userState.email = email;
        userState.phone = phone;

        // Check if user changed address (selected "new") and store it as normal text string in Address1 or Address 2
        const selectedOption = document.querySelector('input[name="checkout-address-option"]:checked')?.value || "saved";
        if (selectedOption === "new") {
          const stateName = country === "IN" ? document.getElementById("ship-state").value : "";
          const countryVal = country === "IN" ? "India" : country;
          const newAddrStr = `${firstName} ${lastName}, ${email}, ${phone}, ${address}, ${city}, ${zip}, ${stateName}, ${countryVal}`;

          if (!userState.address1) {
            userState.address1 = newAddrStr;
          } else if (!userState.address2) {
            userState.address2 = newAddrStr;
          } else {
            // Roll over or overwrite
            userState.address2 = userState.address1;
            userState.address1 = newAddrStr;
          }
        }

        if (supabase) {
          try {
            const { error: profileError } = await supabase.from('profiles').update({
              name: userState.name,
              email: userState.email,
              phone: userState.phone,
              loyalty_points: userState.loyalty_points,
              address1: userState.address1 || null,
              address2: userState.address2 || null
            }).eq('id', userState.id);
            if (profileError) console.error("Profile update error:", profileError);
          } catch (err) {
            console.error("Profile update error:", err);
          }
        }

        await saveUser(); // sync to localStorage
      }

      // 4. Clear cart state locally and in Supabase
      cartState = [];
      await saveCart(); // clears in Supabase and localStorage
      isCouponApplied = false;
      activeCoupon = null;

      // Refresh memory states
      if (supabase) {
        if (session) {
          try {
            const { data: ords } = await supabase.from('orders').select('*').eq('user_id', userId).order('date', { ascending: false });
            ordersState = ords || [];
            await saveOrders();
          } catch (err) {
            console.warn("Failed to refresh orders from Supabase:", err);
          }
        }
      } else {
        const allOrders = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
        ordersState = allOrders.filter(o => o.email.toLowerCase() === email.toLowerCase()) || [];
        await saveOrders();
      }

      // Success view display
      document.getElementById("success-order-id").textContent = newOrderId;
      document.getElementById("success-est-delivery").textContent = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' });
      document.getElementById("success-shipping-address").textContent = fullAddress;
      document.getElementById("success-total-paid").textContent = `₹${total.toFixed(2)}`;

      // Set success redirection links
      document.getElementById("success-track-link").href = `#tracking?id=${newOrderId}`;

      // Delay slightly to simulate secure gateway poll verification
      setTimeout(() => {
        paymentForm.style.display = "block";
        loader.classList.remove("active");

        // Redirect
        window.location.hash = "#success";
        showToast("Payment Verified!", "Transaction cleared. Order processed in Supabase.", "success");

        // Re-render dashboard
        if (window.adminInit) {
          window.adminInit();
        }
      }, 1000);
    };

    if (method === "razorpay") {
      paymentForm.style.display = "block";
      loader.classList.remove("active");

      const options = {
        key: "rzp_test_SxpBmYxNC1h3K0",
        amount: Math.round(total * 100),
        currency: "INR",
        name: "ToyzGuru Premium Store",
        description: "Order Payment",
        prefill: {
          name: `${firstName} ${lastName}`,
          email: email,
          contact: phone
        },
        theme: {
          color: "#ff0080"
        },
        handler: async function (response) {
          paymentForm.style.display = "none";
          loader.classList.add("active");
          if (loaderTitle && loaderDesc) {
            loaderTitle.textContent = "Processing Payment...";
            loaderDesc.textContent = "Payment successful. Finalizing your order...";
          }
          try {
            await executeSaveOrder();
          } catch (e) {
            showToast("Checkout Failed", e.message || "Failed to process transaction after payment.", "danger");
            paymentForm.style.display = "block";
            loader.classList.remove("active");
          }
        },
        modal: {
          ondismiss: function() {
            showToast("Payment Cancelled", "You closed the payment window.", "warning");
          }
        }
      };
      const rzp1 = new window.Razorpay(options);
      rzp1.open();
    } else {
      await executeSaveOrder();
    }


  } catch (err) {
    showToast("Checkout Failed", err.message || "Failed to process transaction.", "danger");
    console.error(err);
    paymentForm.style.display = "block";
    loader.classList.remove("active");
  }
}

// ================= ORDER TRACKING VIEW LOGIC =================
function searchFulfillmentOrder(orderId) {
  const cleanId = orderId.trim();
  const order = ordersState.find(o => o.id.toLowerCase() === cleanId.toLowerCase());

  const resultsPanel = document.getElementById("tracking-results-panel");
  const errorPanel = document.getElementById("tracking-error-message");

  if (!order) {
    resultsPanel.style.display = "none";
    errorPanel.style.display = "block";
    return;
  }

  errorPanel.style.display = "none";
  resultsPanel.style.display = "block";

  // Fill details
  document.getElementById("track-panel-order-id").textContent = order.id;

  // Set est delivery (8 days after order creation date)
  const orderDate = new Date(order.date);
  const deliveryEst = new Date(orderDate.getTime() + 8 * 24 * 60 * 60 * 1000);
  document.getElementById("track-panel-delivery-date").textContent = deliveryEst.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  // Render Timeline steps status
  const steps = ["received", "processing", "shipped", "delivered"];
  const currentStatus = order.status.toLowerCase();

  const activeIdx = steps.indexOf(currentStatus);

  // Clear styles
  steps.forEach(st => {
    document.getElementById(`track-step-${st}`).classList.remove("active", "completed");
    document.getElementById(`track-time-${st}`).textContent = "--:--";
  });

  // Calculate timelines times
  const timeReceived = orderDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  document.getElementById("track-time-received").textContent = timeReceived;
  document.getElementById("track-step-received").classList.add("completed");

  if (activeIdx >= 1) { // processing
    const timeProc = new Date(orderDate.getTime() + 2 * 60 * 60 * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("track-time-processing").textContent = timeProc;
    if (activeIdx > 1) {
      document.getElementById("track-step-processing").classList.add("completed");
    } else {
      document.getElementById("track-step-processing").classList.add("active");
    }
  }

  if (activeIdx >= 2) { // shipped
    const timeShip = new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("track-time-shipped").textContent = timeShip;
    if (activeIdx > 2) {
      document.getElementById("track-step-shipped").classList.add("completed");
    } else {
      document.getElementById("track-step-shipped").classList.add("active");
    }
  }

  if (activeIdx >= 3) { // delivered
    const timeDeliv = new Date(orderDate.getTime() + 48 * 60 * 60 * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    document.getElementById("track-time-delivered").textContent = timeDeliv;
    document.getElementById("track-step-delivered").classList.add("completed");
  } else {
    // Current active indicator
    if (activeIdx >= 0) {
      document.getElementById(`track-step-${steps[activeIdx]}`).classList.add("active");
    }
  }

  // Update Timeline Progress Bar Line percentage
  const progressPercent = activeIdx === 0 ? 0 : activeIdx === 1 ? 33 : activeIdx === 2 ? 66 : 100;
  document.getElementById("tracking-progress-bar").style.width = `${progressPercent}%`;

  // Custom descriptions
  const descEl = document.getElementById("track-panel-desc");
  if (currentStatus === "received") {
    descEl.textContent = "Your payment has cleared. Our warehouse crew is currently matching item specs and inspecting collectibles.";
  } else if (currentStatus === "processing") {
    descEl.textContent = "Your premium items are boxed in secure vault cases and waiting for pickup by international shipping handlers.";
  } else if (currentStatus === "shipped") {
    descEl.textContent = "Vault container is in transit. Tracking number handed over to local courier. High-value cargo transit protection activated.";
  } else if (currentStatus === "delivered") {
    descEl.textContent = "Vault packaging successfully delivered and signed for. Thank you for collecting with ToyzGuru.";
  }

  feather.replace();
}

// ================= USER PROFILE VIEW LOGIC =================
function initProfileView() {
  if (!userState) {
    window.location.hash = "#auth";
    return;
  }
  // Setup settings fields values (Home Address)
  document.getElementById("user-setting-name").value = userState.name || "";
  document.getElementById("user-setting-email").value = userState.email || "";
  document.getElementById("user-setting-phone").value = userState.phone || "";
  document.getElementById("user-setting-address").value = userState.address || "";
  document.getElementById("user-setting-city").value = userState.city || "";
  document.getElementById("user-setting-zip").value = userState.zip || "";
  document.getElementById("user-setting-country").value = "India";

  const profileStateSelect = document.getElementById("user-setting-state");
  if (profileStateSelect) {
    profileStateSelect.innerHTML = '<option value="">Select Default State</option>' +
      (window.stateChargesState || []).map(s => `<option value="${s.state_name}">${s.state_name}</option>`).join("");
    profileStateSelect.value = userState.state || "";
  }

  // Alternative Saved Addresses
  const addrContainer = document.getElementById("member-addresses-container");
  if (addrContainer) {
    addrContainer.innerHTML = '';
    if (userState.address1) {
      addrContainer.innerHTML += `
        <div style="padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 8px;">
          <h5 style="margin: 0 0 0.5rem; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif;">Alternative Address 1</h5>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${userState.address1}</p>
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button type="button" onclick="window.editAlternativeAddress(1)" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: var(--color-brand); color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
            <button type="button" onclick="window.deleteAlternativeAddress(1)" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border: 1px solid var(--glass-border); border-radius: 4px; cursor: pointer;">Delete</button>
          </div>
        </div>
      `;
    }
    if (userState.address2) {
      addrContainer.innerHTML += `
        <div style="padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 8px;">
          <h5 style="margin: 0 0 0.5rem; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif;">Alternative Address 2</h5>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${userState.address2}</p>
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button type="button" onclick="window.editAlternativeAddress(2)" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: var(--color-brand); color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
            <button type="button" onclick="window.deleteAlternativeAddress(2)" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: rgba(255, 255, 255, 0.1); color: var(--text-primary); border: 1px solid var(--glass-border); border-radius: 4px; cursor: pointer;">Delete</button>
          </div>
        </div>
      `;
    }
    if (!userState.address1 && !userState.address2) {
      addrContainer.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-muted);">No alternative addresses saved yet.</div>`;
    }
  }

  // Same as above checkbox status and listener
  const sameAddressCheck = document.getElementById("user-setting-same-address");
  if (sameAddressCheck) {
    sameAddressCheck.checked = (
      userState.name && userState.name === userState.delivery_name &&
      userState.email && userState.email === userState.delivery_email &&
      userState.phone && userState.phone === userState.delivery_phone &&
      userState.address && userState.address === userState.delivery_address &&
      userState.city && userState.city === userState.delivery_city &&
      userState.zip && userState.zip === userState.delivery_zip &&
      userState.state && userState.state === userState.delivery_state
    );
  }

  updateProfileAvatar();

  // Sidebar card data sync
  document.getElementById("profile-card-name").textContent = userState.name || "Valued Customer";
  document.getElementById("profile-card-points").textContent = userState.loyalty_points !== undefined ? userState.loyalty_points : 120;

  // Render orders history list
  const listContainer = document.getElementById("profile-orders-list");
  if (!listContainer) return;

  // Filter orders matching logged user email
  const userOrders = ordersState.filter(o => o.email.toLowerCase() === userState.email.toLowerCase());

  if (userOrders.length === 0) {
    listContainer.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
          You haven't placed any orders yet. Click "Shop" to browse collections.
        </td>
      </tr>
    `;
    return;
  }

  // Sort descending dates
  userOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

  listContainer.innerHTML = userOrders.map(ord => {
    const orderDate = new Date(ord.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const itemsSummary = ord.items.map(i => `${i.title} (${i.option}) x${i.quantity}`).join("<br>");

    return `
      <tr>
        <td style="font-family: 'Space Grotesk', sans-serif; font-weight: 600;">${ord.id}</td>
        <td>${orderDate}</td>
        <td style="font-size: 0.8rem; line-height: 1.4;">${itemsSummary}</td>
        <td style="font-weight: 700; color: var(--color-brand);">₹${ord.total.toFixed(2)}</td>
        <td>
          <span class="order-status-badge status-${ord.status}">${ord.status}</span>
        </td>
        <td>
          <a href="#tracking?id=${ord.id}" class="product-card-add-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; text-decoration: none;">Track Status</a>
        </td>
      </tr>
    `;
  }).join("");

  feather.replace();
}

async function handleProfileSettingsSubmit(e) {
  e.preventDefault();
  userState.name = document.getElementById("user-setting-name").value;
  userState.email = document.getElementById("user-setting-email").value;
  userState.phone = document.getElementById("user-setting-phone").value.trim();
  userState.address = document.getElementById("user-setting-address").value.trim();
  userState.city = document.getElementById("user-setting-city").value.trim();
  userState.zip = document.getElementById("user-setting-zip").value.trim();
  userState.country = "IN";
  userState.state = document.getElementById("user-setting-state")?.value || "";

  // Delivery fields have been removed from the UI. Keep existing values or defaults.

  try {
    if (supabase && userState.id) {
      const dbPayload = {
        name: userState.name,
        email: userState.email,
        phone: userState.phone || null,
        address: userState.address || null,
        city: userState.city || null,
        state: userState.state || null,
        zip: userState.zip || null,
        country: userState.country || 'IN'
      };

      const { error: profileError } = await supabase.from('profiles').update(dbPayload).eq('id', userState.id);
      if (profileError) throw profileError;
    }

    await saveUser();
    // update profile card labels
    document.getElementById("profile-card-name").textContent = userState.name;
    showToast("Profile Updated", "Account settings successfully saved to secure engine.", "success");
  } catch (err) {
    showToast("Update Failed", err.message || "Failed to update profile details.", "danger");
    console.error(err);
  }
}

window.deleteAlternativeAddress = async function(idx) {
  if (idx === 1) userState.address1 = null;
  if (idx === 2) userState.address2 = null;

  try {
    if (supabase && userState.id) {
      const { error } = await supabase.from('profiles').update({
        [`address${idx}`]: null
      }).eq('id', userState.id);
      if (error) throw error;
    }
    await saveUser();
    showToast("Address Deleted", `Alternative Address ${idx} removed.`, "info");
    updateProfileViews();
  } catch (err) {
    showToast("Delete Failed", err.message, "danger");
  }
};

window.editAlternativeAddress = async function(idx) {
  const current = idx === 1 ? userState.address1 : userState.address2;
  const newVal = prompt(`Edit Alternative Address ${idx} (Format: Name, Email, Phone, Address, City, Zip, State, Country)`, current);
  if (newVal !== null && newVal.trim() !== "") {
    if (idx === 1) userState.address1 = newVal.trim();
    if (idx === 2) userState.address2 = newVal.trim();
    
    try {
      if (supabase && userState.id) {
        const { error } = await supabase.from('profiles').update({
          [`address${idx}`]: newVal.trim()
        }).eq('id', userState.id);
        if (error) throw error;
      }
      await saveUser();
      showToast("Address Updated", `Alternative Address ${idx} saved.`, "success");
      updateProfileViews();
    } catch (err) {
      showToast("Update Failed", err.message, "danger");
    }
  }
};

// ================= EVENT LISTENERS BINDINGS =================
function setupEventListeners() {

  // Mobile Hamburger menu toggle
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const navMenu = document.getElementById("main-nav-menu");
  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
      navMenu.style.display = navMenu.style.display === "flex" ? "none" : "flex";
      navMenu.style.flexDirection = "column";
      navMenu.style.position = "absolute";
      navMenu.style.top = "70px";
      navMenu.style.left = "0";
      navMenu.style.width = "100%";
      navMenu.style.background = "var(--bg-secondary)";
      navMenu.style.padding = "1rem";
      navMenu.style.borderBottom = "1px solid var(--glass-border)";
    });

    // Close mobile menu when any nav link is clicked (mobile responsive behavior)
    const links = navMenu.querySelectorAll(".nav-link");
    links.forEach(link => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768) {
          navMenu.style.display = "none";
        }
      });
    });
  }

  // Cart Drawer show/hide
  document.getElementById("cart-icon-btn").addEventListener("click", () => toggleCartDrawer(true));
  document.getElementById("close-cart-btn").addEventListener("click", () => toggleCartDrawer(false));
  document.getElementById("cart-drawer-overlay").addEventListener("click", () => toggleCartDrawer(false));

  // Profile Icon Button routing
  document.getElementById("profile-icon-btn").addEventListener("click", () => {
    window.location.hash = "#profile";
  });

  // Global search enter key
  document.getElementById("global-search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const keyword = e.target.value.trim();
      if (keyword) {
        window.location.hash = `#catalog?search=${encodeURIComponent(keyword)}`;
        e.target.value = "";
      }
    }
  });

  // Global search icon click
  const globalSearchIcon = document.querySelector(".search-box .search-icon");
  if (globalSearchIcon) {
    globalSearchIcon.style.cursor = "pointer";
    globalSearchIcon.addEventListener("click", () => {
      const input = document.getElementById("global-search-input");
      if (input) {
        const keyword = input.value.trim();
        if (keyword) {
          window.location.hash = `#catalog?search=${encodeURIComponent(keyword)}`;
          input.value = "";
        }
      }
    });
  }

  // Product detail modal closures
  document.getElementById("close-product-modal-btn").addEventListener("click", closeProductModal);
  document.getElementById("product-detail-modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "product-detail-modal-overlay") closeProductModal();
  });

  // Modal Increment / Decrement actions
  document.getElementById("modal-qty-dec").addEventListener("click", () => {
    if (modalSelectedQty > 1) {
      modalSelectedQty--;
      document.getElementById("modal-qty-val").textContent = modalSelectedQty;
    }
  });
  document.getElementById("modal-qty-inc").addEventListener("click", () => {
    if (modalActiveProduct && modalSelectedQty < modalActiveProduct.stock) {
      modalSelectedQty++;
      document.getElementById("modal-qty-val").textContent = modalSelectedQty;
    } else {
      showToast("Stock limit reached", "Cannot purchase more than available vault limits.", "warning");
    }
  });

  // Modal add to cart
  document.getElementById("modal-add-cart-btn").addEventListener("click", () => {
    if (modalActiveProduct) {
      addToCart(modalActiveProduct.id, modalSelectedQty, modalSelectedOption);
      closeProductModal();
    }
  });

  // Checkout Actions
  const applyCouponBtn = document.getElementById("apply-coupon-btn");
  if (applyCouponBtn) applyCouponBtn.addEventListener("click", applyCoupon);

  const checkoutFormSubmit = document.getElementById("payment-details-form");
  if (checkoutFormSubmit) checkoutFormSubmit.addEventListener("submit", handleCheckoutSubmit);

  const saveAddrBtn = document.getElementById("checkout-save-address-btn");
  if (saveAddrBtn) {
    saveAddrBtn.addEventListener("click", async () => {
      const shippingForm = document.getElementById("shipping-form");
      if (!shippingForm.checkValidity()) {
        showToast("Missing Fields", "Please complete all shipping address fields before saving.", "warning");
        window.scrollTo(0, document.getElementById("shipping-form").offsetTop - 100);
        return;
      }

      const firstName = document.getElementById("ship-first-name").value;
      const lastName = document.getElementById("ship-last-name").value;
      const email = document.getElementById("ship-email").value;
      const address = document.getElementById("ship-address").value;
      const city = document.getElementById("ship-city").value;
      const zip = document.getElementById("ship-zip").value;
      const stateName = document.getElementById("ship-state").value;
      const country = document.getElementById("ship-country").value || "IN";
      const phone = document.getElementById("ship-phone").value;
      
      const countryVal = country === "IN" ? "India" : country;
      const newAddrStr = `${firstName} ${lastName}, ${email}, ${phone}, ${address}, ${city}, ${zip}, ${stateName}, ${countryVal}`;

      if (userState) {
        if (!userState.address1) {
          userState.address1 = newAddrStr;
        } else if (!userState.address2) {
          userState.address2 = newAddrStr;
        } else {
          // Roll over or overwrite
          userState.address2 = userState.address1;
          userState.address1 = newAddrStr;
        }

        // Save to Supabase and LocalStorage
        try {
          if (supabase) {
            const { error: profileError } = await supabase.from('profiles').update({
              address1: userState.address1 || null,
              address2: userState.address2 || null
            }).eq('id', userState.id);
            if (profileError) throw profileError;
          }
          await saveUser();
          showToast("Address Saved", "Delivery address saved to your profile settings successfully.", "success");
          
          // Re-populate and sync address selection choices
          initCheckoutView();
        } catch (err) {
          showToast("Failed to Save", err.message || "Failed to save address to database.", "danger");
        }
      } else {
        showToast("Sign In Required", "Please sign in to save addresses to your profile.", "warning");
      }
    });
  }

  // Payment Tab Switch Listeners
  const paymentTabBtns = document.querySelectorAll(".payment-tab-btn");
  paymentTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      paymentTabBtns.forEach(b => {
        b.classList.remove("active");
        b.style.background = "rgba(255, 255, 255, 0.02)";
        b.style.borderColor = "var(--glass-border)";
        b.style.color = "var(--text-secondary)";
      });
      btn.classList.add("active");
      btn.style.background = "rgba(255, 255, 255, 0.05)";
      btn.style.borderColor = "var(--color-brand)";
      btn.style.color = "var(--text-primary)";

      const method = btn.getAttribute("data-method");
      const hiddenInput = document.getElementById("selected-payment-method");
      if (hiddenInput) hiddenInput.value = method;

      const panels = document.querySelectorAll(".payment-panel-content");
      panels.forEach(p => p.style.display = "none");

      const targetPanel = document.getElementById(`${method}-payment-panel`);
      if (targetPanel) targetPanel.style.display = "block";
    });
  });

  // Google Pay Mock Click handler
  const gpayMockBtn = document.getElementById("gpay-mock-button");
  if (gpayMockBtn) {
    gpayMockBtn.addEventListener("click", () => {
      if (checkoutFormSubmit) {
        checkoutFormSubmit.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    });
  }

  // Cart Drawer Checkout routing
  document.getElementById("proceed-checkout-btn").addEventListener("click", () => {
    toggleCartDrawer(false);
    window.location.hash = "#checkout";
  });

  // Order Tracking Form search actions
  document.getElementById("tracking-search-btn").addEventListener("click", () => {
    const orderId = document.getElementById("tracking-search-id").value;
    searchFulfillmentOrder(orderId);
  });

  document.getElementById("tracking-search-id").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      searchFulfillmentOrder(e.target.value);
    }
  });

  // Profile Settings Edit submits
  document.getElementById("profile-settings-form").addEventListener("submit", handleProfileSettingsSubmit);



  // Handle profile image upload
  const avatarInput = document.getElementById("user-setting-avatar-input");
  const avatarTrigger = document.getElementById("avatar-upload-trigger");
  if (avatarTrigger && avatarInput) {
    avatarTrigger.addEventListener("click", () => {
      avatarInput.click();
    });

    avatarInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const base64Data = event.target.result;

          // Update visual image instantly
          const avatarEl = document.getElementById("profile-card-avatar");
          if (avatarEl) avatarEl.src = base64Data;

          // Save to userState & localStorage
          if (userState) {
            userState.avatar = base64Data;
            await saveUser();
            showToast("Profile Image Updated", "Your new profile picture has been saved successfully.", "success");
          } else {
            showToast("Sign In Required", "Please sign in to update your profile image.", "warning");
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Auth View tabs switching
  const authTabSignin = document.getElementById("auth-tab-signin");
  const authTabSignup = document.getElementById("auth-tab-signup");
  const authSigninForm = document.getElementById("auth-signin-form");
  const authSignupForm = document.getElementById("auth-signup-form");
  const authForgotPasswordForm = document.getElementById("auth-forgot-password-form");
  const forgotPasswordLink = document.getElementById("forgot-password-link");
  const backToSigninLink = document.getElementById("back-to-signin-link");
  const authResetPasswordForm = document.getElementById("auth-reset-password-form");

  if (authTabSignin && authTabSignup) {
    authTabSignin.addEventListener("click", () => {
      authTabSignin.classList.add("active");
      authTabSignup.classList.remove("active");
      authSigninForm.style.display = "block";
      authSignupForm.style.display = "none";
      if(authForgotPasswordForm) authForgotPasswordForm.style.display = "none";
    });
    authTabSignup.addEventListener("click", () => {
      authTabSignup.classList.add("active");
      authTabSignin.classList.remove("active");
      authSignupForm.style.display = "block";
      authSigninForm.style.display = "none";
      if(authForgotPasswordForm) authForgotPasswordForm.style.display = "none";
    });
  }

  if (forgotPasswordLink && backToSigninLink && authForgotPasswordForm) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      authSigninForm.style.display = "none";
      authForgotPasswordForm.style.display = "block";
    });
    backToSigninLink.addEventListener("click", (e) => {
      e.preventDefault();
      authForgotPasswordForm.style.display = "none";
      authSigninForm.style.display = "block";
    });
  }

  // Auth Forgot Password Submit
  if (authForgotPasswordForm) {
    authForgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-forgot-email").value.trim();

      if (!supabase) {
        showToast("Database Offline", "Supabase client is not loaded. Cannot send reset link.", "danger");
        return;
      }

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + window.location.pathname + '#reset-password',
        });
        if (error) throw error;
        showToast("Reset Link Sent", "Check your email inbox for the password reset link.", "success");
        authForgotPasswordForm.style.display = "none";
        authSigninForm.style.display = "block";
      } catch (err) {
        showToast("Reset Failed", err.message || "Failed to send reset link.", "danger");
      }
    });
  }

  // Auth Reset Password Submit
  if (authResetPasswordForm) {
    authResetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("auth-reset-new-password").value;

      if (!supabase) {
        showToast("Database Offline", "Supabase client is not loaded. Cannot update password.", "danger");
        return;
      }

      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        showToast("Password Updated", "Your password has been changed successfully. You can now access your vault.", "success");
        window.location.hash = "#profile";
      } catch (err) {
        showToast("Update Failed", err.message || "Failed to update password.", "danger");
      }
    });
  }

  // Supabase Auth State Change Listener for Password Recovery
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.hash = '#reset-password';
      }
    });
  }

  // Google Authentication Trigger
  const googleAuthBtn = document.getElementById("google-auth-btn");
  if (googleAuthBtn) {
    googleAuthBtn.addEventListener("click", async () => {
      showToast("Connecting to Google...", "Authorizing your account secure profile...", "info");

      setTimeout(async () => {
        // Set mock user profile using Srikant's details to match default data
        const mockGoogleUser = {
          id: "google-mock-id-12345",
          name: "Srikant SR",
          email: "srikantsr@gmail.com",
          country: "IN",
          state: "Maharashtra",
          loyalty_points: 120,
          address: "123 Neon Cyber Blvd, Suite 4B",
          city: "Neo-Tokyo",
          zip: "100-0001",
          phone: "+81 90-1234-5678"
        };

        localStorage.setItem("toyzguru_mock_session", "true");
        localStorage.setItem("toyzguru_user", JSON.stringify(mockGoogleUser));

        // Populate standard orders if none are stored yet
        if (!localStorage.getItem("toyzguru_orders")) {
          localStorage.setItem("toyzguru_orders", JSON.stringify(defaultOrders));
        }

        showToast("Signed In via Google", "Welcome to ToyzGuru!", "success");
        await initDatabase();
        window.location.hash = "#profile";
      }, 1000);
    });
  }

  // Auth Sign In Submit
  if (authSigninForm) {
    authSigninForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-signin-email").value.trim();
      const password = document.getElementById("auth-signin-password").value;

      if (!supabase) {
        showToast("Database Offline", "Supabase client is not loaded. Cannot authenticate.", "danger");
        return;
      }

      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        showToast("Signed In", "Welcome back to ToyzGuru!", "success");
        await initDatabase();
        window.location.hash = "#profile";
      } catch (err) {
        showToast("Sign In Failed", err.message || "Invalid email or password.", "danger");
      }
    });
  }

  // Auth Sign Up Submit
  if (authSignupForm) {
    authSignupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("auth-signup-name").value.trim();
      const email = document.getElementById("auth-signup-email").value.trim();
      const password = document.getElementById("auth-signup-password").value;

      if (!supabase) {
        showToast("Database Offline", "Supabase client is not loaded. Cannot register.", "danger");
        return;
      }

      try {
        const { data: existingProfile } = await supabase.from('profiles').select('email').eq('email', email).maybeSingle();
        if (existingProfile) {
          showToast("Sign Up Failed", "An account with this email address already exists. Please sign in instead.", "warning");
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name }
          }
        });
        if (error) throw error;

        if (data.session) {
          showToast("Account Created", "Welcome to ToyzGuru! Logged in automatically.", "success");
          await initDatabase();
          window.location.hash = "#profile";
        } else {
          showToast("Verification Sent", "Check your email inbox to verify your registration.", "info");
        }
      } catch (err) {
        showToast("Sign Up Failed", err.message || "Registration encountered an error.", "danger");
      }
    });
  }

  // Sign Out click handler
  const signOutBtn = document.getElementById("profile-signout-btn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", async () => {
      try {
        if (supabase) {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
        }

        showToast("Signed Out", "Secure session terminated successfully.", "info");
        userState = null;
        cartState = [];
        ordersState = [];
        localStorage.removeItem("toyzguru_cart");
        localStorage.removeItem("toyzguru_orders");
        localStorage.removeItem("toyzguru_user");
        localStorage.removeItem("toyzguru_mock_session");
        await initDatabase();
        window.location.hash = "#home";
      } catch (err) {
        showToast("Sign Out Failed", err.message || "Could not clear session.", "danger");
      }
    });
  }

  // Profile navigation panel swappers
  const profileNavBtns = document.querySelectorAll(".profile-nav-btn");
  profileNavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      profileNavBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const targetPanel = btn.getAttribute("data-panel");
      const panels = document.querySelectorAll(".profile-panel");
      panels.forEach(p => {
        p.classList.remove("active");
        if (p.id === targetPanel) p.classList.add("active");
      });
    });
  });

  // Homepage Hero Carousel Dot Indicators
  const sliderDots = document.querySelectorAll("#hero-carousel .slider-dot");
  const slides = document.querySelectorAll("#hero-carousel .slide");
  sliderDots.forEach(dot => {
    dot.addEventListener("click", () => {
      const idx = parseInt(dot.getAttribute("data-slide-to"));

      slides.forEach(s => s.classList.remove("active"));
      sliderDots.forEach(d => d.classList.remove("active"));

      slides[idx].classList.add("active");
      dot.classList.add("active");
    });
  });

  // Autoplay hero slides every 6 seconds
  let currentSlide = 0;
  setInterval(() => {
    const activeSlide = document.querySelector("#hero-carousel .slide.active");
    if (!activeSlide) return;

    currentSlide = (currentSlide + 1) % slides.length;
    slides.forEach(s => s.classList.remove("active"));
    sliderDots.forEach(d => d.classList.remove("active"));

    slides[currentSlide].classList.add("active");
    sliderDots[currentSlide].classList.add("active");
  }, 7000);

  // Catalog filter triggers
  // Search input typing
  const sidebarSearch = document.getElementById("sidebar-search");
  if (sidebarSearch) {
    sidebarSearch.addEventListener("input", (e) => {
      catalogFilters.search = e.target.value;
      applyFiltersAndRender();
    });

    // Clear search on pressing Enter
    sidebarSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        catalogFilters.search = e.target.value.trim();
        applyFiltersAndRender();
        e.target.value = "";
      }
    });
  }

  // Sidebar search icon click
  const sidebarSearchIcon = document.querySelector(".filter-search-box .filter-search-icon");
  if (sidebarSearchIcon) {
    sidebarSearchIcon.style.cursor = "pointer";
    sidebarSearchIcon.addEventListener("click", () => {
      if (sidebarSearch) {
        catalogFilters.search = sidebarSearch.value.trim();
        applyFiltersAndRender();
        sidebarSearch.value = "";
      }
    });
  }

  // Category buttons click using event delegation
  const catList = document.getElementById("filter-categories-list");
  if (catList) {
    catList.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-cat-btn");
      if (btn) {
        catalogFilters.category = btn.getAttribute("data-cat");
        syncCategoryButtonsUI();
        applyFiltersAndRender();
      }
    });
  }

  // Price slider updates
  const priceSlider = document.getElementById("filter-price-slider");
  if (priceSlider) {
    priceSlider.addEventListener("input", (e) => {
      catalogFilters.priceMax = parseFloat(e.target.value);
      document.getElementById("price-slider-value").textContent = `₹${catalogFilters.priceMax}`;
      applyFiltersAndRender();
    });
  }

  // Sort select selector
  const sortSelect = document.getElementById("catalog-sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      catalogFilters.sort = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Clear filters button click
  const clearFiltersBtn = document.getElementById("clear-filters-btn");
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
      catalogFilters = {
        search: "",
        category: "all",
        priceMax: 50000,
        sort: "featured"
      };

      if (sidebarSearch) sidebarSearch.value = "";
      if (priceSlider) {
        priceSlider.value = 50000;
        document.getElementById("price-slider-value").textContent = `₹50,000`;
      }
      if (sortSelect) sortSelect.value = "featured";

      syncCategoryButtonsUI();
      applyFiltersAndRender();
      showToast("Filters Cleared", "Reset catalog to display default listings.", "info");
    });
  }

  // Checkout address prefill trigger in Success view
  const trackLink = document.getElementById("success-track-link");
  if (trackLink) {
    trackLink.addEventListener("click", () => {
      // Get the order ID from URL query parameters manually
      const href = trackLink.getAttribute("href");
      const parts = href.split("?id=");
      if (parts[1]) {
        setTimeout(() => {
          document.getElementById("tracking-search-id").value = parts[1];
          searchFulfillmentOrder(parts[1]);
        }, 100);
      }
    });
  }

  // Bind order tracking links in profile order lists
  document.getElementById("profile-orders-list").addEventListener("click", (e) => {
    if (e.target.classList.contains("product-card-add-btn")) {
      const orderIdLink = e.target.getAttribute("href");
      const id = orderIdLink.split("?id=")[1];
      if (id) {
        setTimeout(() => {
          document.getElementById("tracking-search-id").value = id;
          searchFulfillmentOrder(id);
        }, 100);
      }
    }
  });

  // Contact Us Map Update click handler
  const mapUpdateBtn = document.getElementById("contact-map-update-btn");
  if (mapUpdateBtn) {
    mapUpdateBtn.addEventListener("click", () => {
      const addressInput = document.getElementById("contact-map-input-address");
      const addressVal = addressInput ? addressInput.value.trim() : "";
      if (addressVal) {
        localStorage.setItem("toyzguru_store_address", addressVal);

        // Update display text and iframe src
        const displayAddressEl = document.getElementById("contact-display-address");
        if (displayAddressEl) displayAddressEl.textContent = addressVal;

        const mapIframe = document.getElementById("contact-google-map");
        if (mapIframe) {
          mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(addressVal)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
        }

        showToast("Location Updated", `Showroom relocated to: ${addressVal}`, "success");
      } else {
        showToast("Input Required", "Please enter a valid address or city.", "warning");
      }
    });
  }

  // Contact Us Form submit handler
  const contactForm = document.getElementById("contact-support-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("contact-name").value.trim();
      const email = document.getElementById("contact-email").value.trim();
      const subject = document.getElementById("contact-subject").value.trim();
      const message = document.getElementById("contact-message").value.trim();

      try {
        const { error } = await supabase.from('contact_messages').insert({
          name,
          email,
          subject,
          message
        });
        if (error) throw error;

        showToast("Message Transmitted", `Thank you, ${name}. Our vault support desk has received your ticket regarding: "${subject}". We will reply to ${email} within 12 hours.`, "success");
        contactForm.reset();
      } catch (err) {
        showToast("Message Transmission Failed", err.message || "Could not submit message.", "danger");
      }
    });
  }

  // Brand Story Footer Newsletter signup simulation
  document.getElementById("newsletter-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    showToast("Subscription Confirmed", `Vault news and limited product drops will be sent to ${input.value}.`, "success");
    input.value = "";
  });

  // FAQ Accordion Toggle click handler
  document.addEventListener("click", (e) => {
    const questionBtn = e.target.closest(".faq-question");
    if (questionBtn) {
      const faqItem = questionBtn.closest(".faq-item");
      const answer = faqItem.querySelector(".faq-answer");

      const isOpen = faqItem.classList.contains("active");

      if (isOpen) {
        faqItem.classList.remove("active");
        answer.style.maxHeight = null;
      } else {
        faqItem.classList.add("active");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    }
  });
}

// ================= CONTACT VIEW LOGIC =================
function initContactView() {
  const storeAddress = localStorage.getItem("toyzguru_store_address") || "601, Street 4, TNR Gradilla, Road no. 29, Alkapoor Township, Neknampur, Hyderabad – 500089 Telangana";

  // Set address text
  const displayAddressEl = document.getElementById("contact-display-address");
  if (displayAddressEl) displayAddressEl.textContent = storeAddress;

  // Prefill map input field
  const mapInputEl = document.getElementById("contact-map-input-address");
  if (mapInputEl) mapInputEl.value = storeAddress;

  // Update Map iframe src
  const mapIframe = document.getElementById("contact-google-map");
  if (mapIframe) {
    mapIframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;
  }
}

// Helper to let other modules access toast alerts
window.toyzToast = showToast;
window.openProductModal = openProductModal;
window.quickAddToCart = quickAddToCart;
window.initDatabase = initDatabase;
