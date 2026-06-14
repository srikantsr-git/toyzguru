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
let wishlistState = [];
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
Object.defineProperty(window, 'wishlistState', {
  get: () => wishlistState,
  set: (val) => { wishlistState = val; }
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
  // 0. Load seed profiles from js/users.json and merge them into localStorage
  const fallbackSeedUsers = [
    {
      "id": "ba55f7bc-b383-4581-81b6-fca01ea6dab4",
      "name": "Srikant Test",
      "email": "srikanttest@gmail.com",
      "loyalty_points": 120,
      "password": "password123"
    },
    {
      "id": "18977fda-6766-486a-b515-ddb7f0c659db",
      "name": "Srikant Test",
      "email": "srikanttest2@gmail.com",
      "loyalty_points": 120,
      "password": "password123"
    },
    {
      "id": "3dec06a2-cf7a-4a78-a402-d3453164fb10",
      "name": "Srikant Random",
      "email": "srikant_rand_9988@gmail.com",
      "loyalty_points": 120,
      "password": "password123"
    },
    {
      "id": "31b343de-a693-4951-9991-3a27ccd0251b",
      "name": "Pavan Negi",
      "email": "sriutube2017@gmail.com",
      "phone": "+919923924078",
      "address": "302, Tanush Pride, Alkapoor Township, Neknampur",
      "city": "Hyderabad",
      "state": "Telangana",
      "zip": "500089",
      "country": "IN",
      "loyalty_points": 2369,
      "password": "aakash00"
    },
    {
      "id": "a6934951-31b3-43de-9991-3a27ccd0251b",
      "name": "Sri Utube 21",
      "email": "sriutube21@gmail.com",
      "phone": "+919923924021",
      "address": "302, Alkapoor Township, Neknampur",
      "city": "Hyderabad",
      "state": "Telangana",
      "zip": "500089",
      "country": "IN",
      "loyalty_points": 120,
      "password": "aakash00"
    },
    {
      "id": "b743de27-1b3a-4951-9991-3a27ccd0251b",
      "name": "Sri Utube 17",
      "email": "sriutube17@gmail.com",
      "phone": "+919923924017",
      "address": "302, Tanush Pride, Neknampur",
      "city": "Hyderabad",
      "state": "Telangana",
      "zip": "500089",
      "country": "IN",
      "loyalty_points": 120,
      "password": "aakash00"
    },
    {
      "id": "9d1f9823-bbf1-49ab-8db4-474e3ddeb9e2",
      "name": "Test User",
      "email": "test_signup_3455@toyzguru.in",
      "loyalty_points": 120,
      "password": "password123"
    }
  ];

  let seedUsers = fallbackSeedUsers;
  try {
    const res = await fetch("js/users.json");
    if (res.ok) {
      seedUsers = await res.json();
    }
  } catch (err) {
    console.warn("Failed to load seed profiles from users.json, using hardcoded fallback:", err);
  }

  let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
  const deletedProfiles = JSON.parse(localStorage.getItem("toyzguru_deleted_profiles")) || [];
  let updated = false;
  seedUsers.forEach(seedUser => {
    const isDeleted = deletedProfiles.includes(seedUser.email.toLowerCase()) || deletedProfiles.includes(seedUser.id);
    if (isDeleted) return;

    const existingIndex = localProfiles.findIndex(p => p.email.toLowerCase() === seedUser.email.toLowerCase());
    if (existingIndex === -1) {
      localProfiles.push(seedUser);
      updated = true;
    } else {
      const existing = localProfiles[existingIndex];
      // Keep password, loyalty points, and essential fields synchronized from the seed database
      if (existing.password !== seedUser.password || existing.loyalty_points !== seedUser.loyalty_points) {
        localProfiles[existingIndex] = { ...existing, ...seedUser };
        updated = true;
      }
    }
  });
  if (updated || localStorage.getItem("toyzguru_profiles") === null) {
    localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));
  }

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
  if (localStorage.getItem("toyzguru_mock_session") === "true") {
    // Load local user profile session
    userState = JSON.parse(localStorage.getItem("toyzguru_user"));
    cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];

    // Fetch orders for this user from Supabase/localStorage fallback
    if (supabase && userState) {
      try {
        const { data: ords, error } = await supabase.from('orders').select('*').eq('user_id', userState.id).order('date', { ascending: false });
        if (error) throw error;
        ordersState = ords || [];
      } catch (err) {
        ordersState = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
      }
    } else {
      ordersState = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
    }
  } else if (supabase) {
    // Check if there's a legacy Supabase Auth session we should migrate to local mock
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData ? sessionData.session : null;
    } catch (err) {
      console.warn("Failed to get session from Supabase:", err);
    }

    if (session) {
      const user = session.user;
      try {
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error && error.code !== 'PGRST116') throw error;

        if (profile) {
          userState = profile;
        } else {
          userState = {
            id: user.id,
            name: user.user_metadata.name || 'Valued Customer',
            email: user.email,
            loyalty_points: 120,
            country: 'IN',
            state: ''
          };
          await supabase.from('profiles').insert(userState);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        userState = { id: user.id, email: user.email, name: user.user_metadata.name || 'Valued Customer', loyalty_points: 120, country: 'IN', state: '' };
      }

      // Convert legacy session to mock session
      localStorage.setItem("toyzguru_mock_session", "true");
      localStorage.setItem("toyzguru_user", JSON.stringify(userState));

      // Fetch cart
      try {
        const { data: cartData, error } = await supabase.from('cart').select('items').eq('user_id', user.id).single();
        if (cartData && cartData.items) {
          cartState = cartData.items;
        } else {
          cartState = [];
        }
      } catch (err) {
        cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];
      }

      // Fetch orders
      try {
        const { data: ords, error } = await supabase.from('orders').select('*').eq('user_id', user.id).order('date', { ascending: false });
        if (error) throw error;
        ordersState = ords || [];
      } catch (err) {
        ordersState = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
      }
    } else {
      userState = null;
      cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];
      ordersState = [];
    }
  } else {
    // Guest User
    userState = null;
    cartState = JSON.parse(localStorage.getItem("toyzguru_cart")) || [];
    ordersState = [];
  }

  // Load wishlist from userState (Supabase profile or localStorage)
  if (userState && Array.isArray(userState.wishlist) && userState.wishlist.length > 0) {
    wishlistState = userState.wishlist;
  } else {
    wishlistState = JSON.parse(localStorage.getItem("toyzguru_wishlist")) || [];
    // If user is logged in, sync their localStorage wishlist back to userState
    if (userState && wishlistState.length > 0) {
      userState.wishlist = wishlistState;
    }
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
  updateWishlistBadges();
  renderFeaturedProducts();
  renderFooterCollections();
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

  // Also sync changes to the master local profiles registry
  if (userState && userState.email) {
    let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
    const idx = localProfiles.findIndex(p => p.email.toLowerCase() === userState.email.toLowerCase());
    if (idx !== -1) {
      localProfiles[idx] = { ...localProfiles[idx], ...userState };
    } else {
      localProfiles.push(userState);
    }
    localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));
  }

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

  // -------------------------------------------------------
  // CRITICAL: Detect Supabase password-recovery token FIRST
  // Supabase email links arrive with the token in the URL
  // hash fragment as: #access_token=...&type=recovery&...
  // We must intercept this BEFORE the router parses the hash.
  // -------------------------------------------------------
  (function interceptRecoveryToken() {
    // Check both hash and search query parameters (useful for PKCE/OAuth redirects)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);

    const getParam = (key) => hashParams.get(key) || searchParams.get(key);

    const type = getParam('type');
    const accessToken = getParam('access_token');
    const refreshToken = getParam('refresh_token');
    const errorDesc = getParam('error_description');
    const error = getParam('error');

    // If any parameters exist, we should intercept and handle them
    if (type === 'recovery' || accessToken || error || errorDesc) {
      if (error || errorDesc) {
        // Supabase returned an error (e.g. link expired)
        // Clear the URL query/hash parameters
        history.replaceState(null, '', window.location.pathname + '#reset-password');
        // Show error modal after DOM is ready
        setTimeout(() => {
          const errModal = document.getElementById('pw-reset-error-modal');
          const errMsg = document.getElementById('pw-reset-error-msg');
          if (errModal) {
            if (errMsg) errMsg.textContent = decodeURIComponent((errorDesc || error || 'Invalid or expired reset link.')).replace(/\+/g, ' ');
            errModal.style.display = 'flex';
            if (window.feather) feather.replace();
          }
        }, 600);
        return;
      }

      if (type === 'recovery' && accessToken) {
        // Valid recovery token — set Supabase session from the token,
        // then clean the URL and redirect to the reset-password view.
        if (supabase) {
          supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          }).then(({ error: sessErr }) => {
            if (sessErr) {
              console.error('Failed to set recovery session:', sessErr);
            }
          });
        }
        // Replace the messy token URL with a clean hash
        history.replaceState(null, '', window.location.pathname + '#reset-password');
      }
    }
  })();

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


// ================= CUSTOM DIALOG SYSTEM =================
function showCustomDialog(title, message, type = "warning", confirmCallbackOrIsConfirm = null) {
  return new Promise((resolve) => {
    // Prevent duplicate dialogs
    const existing = document.querySelector(".custom-dialog-overlay");
    if (existing) existing.remove();

    let confirmCallback = null;
    let isConfirm = false;
    if (typeof confirmCallbackOrIsConfirm === "function") {
      confirmCallback = confirmCallbackOrIsConfirm;
      isConfirm = true;
    } else if (typeof confirmCallbackOrIsConfirm === "boolean") {
      isConfirm = confirmCallbackOrIsConfirm;
    }

    const overlay = document.createElement("div");
    overlay.className = "custom-dialog-overlay";
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(8, 11, 17, 0.85);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      font-family: 'Inter', sans-serif;
      padding: 1rem;
    `;

    let iconName = "alert-triangle";
    let themeColor = "var(--color-warning)"; // default yellow
    let iconBg = "rgba(245, 158, 11, 0.1)";
    let iconBorder = "rgba(245, 158, 11, 0.25)";

    if (type === "error" || type === "danger") {
      iconName = "x-circle";
      themeColor = "var(--color-danger)"; // red
      iconBg = "rgba(239, 68, 68, 0.1)";
      iconBorder = "rgba(239, 68, 68, 0.25)";
    } else if (type === "success") {
      iconName = "check-circle";
      themeColor = "var(--color-success)"; // green
      iconBg = "rgba(16, 185, 129, 0.1)";
      iconBorder = "rgba(16, 185, 129, 0.25)";
    } else if (type === "info") {
      iconName = "info";
      themeColor = "var(--color-info)"; // blue
      iconBg = "rgba(59, 130, 246, 0.1)";
      iconBorder = "rgba(59, 130, 246, 0.25)";
    }

    const showCancel = isConfirm;

    overlay.innerHTML = `
      <div class="glass-panel" style="
        background: var(--bg-secondary);
        border: 1px solid ${iconBorder};
        border-radius: var(--border-radius-md);
        padding: 2.5rem;
        max-width: 450px;
        width: 100%;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px ${iconBg};
        text-align: center;
        position: relative;
        color: var(--text-primary);
        animation: dialogFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transition: border-color var(--transition-normal);
      ">
        <button class="custom-dialog-close" style="
          position: absolute;
          top: 1.25rem;
          right: 1.25rem;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid var(--glass-border);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1.25rem;
          transition: all var(--transition-fast);
        " aria-label="Close dialog">&times;</button>
        
        <div style="
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: ${iconBg};
          border: 2px solid ${iconBorder};
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        ">
          <i data-feather="${iconName}" style="width: 32px; height: 32px; color: ${themeColor};"></i>
        </div>
        
        <h3 style="
          font-size: 1.5rem;
          font-family: 'Space Grotesk', sans-serif;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
          font-weight: 700;
          letter-spacing: -0.01em;
        ">${title}</h3>
        
        <p style="
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 2rem;
        ">${message}</p>
        
        <div style="display: flex; gap: 0.75rem; justify-content: center; width: 100%;">
          ${showCancel ? `
            <button class="cancel-btn" style="
              flex: 1;
              padding: 0.8rem 1.5rem;
              background: rgba(255, 255, 255, 0.04);
              color: var(--text-primary);
              border: 1px solid var(--glass-border);
              font-weight: 600;
              font-size: 0.9rem;
              border-radius: var(--border-radius-sm);
              cursor: pointer;
              transition: all var(--transition-fast);
            ">Cancel</button>
          ` : ''}
          <button class="confirm-btn" style="
            flex: 1;
            padding: 0.8rem 1.5rem;
            background: var(--color-brand-gradient);
            color: #fff;
            border: none;
            font-weight: 700;
            font-size: 0.9rem;
            border-radius: var(--border-radius-sm);
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            transition: all var(--transition-fast);
          ">${showCancel ? 'Confirm' : 'OK'}</button>
        </div>
      </div>
    `;

    // Inject CSS animation if not already injected
    if (!document.getElementById("custom-dialog-animation-style")) {
      const style = document.createElement("style");
      style.id = "custom-dialog-animation-style";
      style.textContent = `
        @keyframes dialogFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .custom-dialog-close:hover {
          background: var(--color-danger) !important;
          border-color: transparent !important;
          color: white !important;
        }
        .custom-dialog-overlay .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
        .custom-dialog-overlay .confirm-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5) !important;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);
    if (window.feather) feather.replace();

    const closeBtn = overlay.querySelector(".custom-dialog-close");
    const confirmBtn = overlay.querySelector(".confirm-btn");
    const cancelBtn = overlay.querySelector(".cancel-btn");

    const handleClose = (value) => {
      overlay.remove();
      if (value && confirmCallback) confirmCallback();
      resolve(value);
    };

    closeBtn.addEventListener("click", () => handleClose(false));
    confirmBtn.addEventListener("click", () => handleClose(true));
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => handleClose(false));
    }
  });
}
window.showCustomDialog = showCustomDialog;



// ================= EMAIL UTILITY =================
// Sends email via local Python Flask server (localhost) OR Supabase Edge Function (production)
const isLocal = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || !window.location.hostname);
const EMAIL_SERVER_URL = isLocal
  ? "http://127.0.0.1:3001/send-email"
  : `${supabaseUrl}/functions/v1/send-email`;

async function sendEmailViaServer({ to, subject, html, text = "" }) {
  try {
    const headers = { "Content-Type": "application/json" };
    // Add Supabase Anon Key for Edge Function authentication in production
    if (!isLocal) {
      headers["Authorization"] = `Bearer ${supabaseKey}`;
    }

    const res = await fetch(EMAIL_SERVER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({ to, subject, html, text }),
    });
    
    // Attempt to parse JSON response safely
    let json;
    try {
      json = await res.json();
    } catch(e) {
      throw new Error("Invalid response from email server.");
    }

    if (!res.ok || !json.success) {
      throw new Error(json.error || "Email server returned an error.");
    }
    return { success: true };
  } catch (err) {
    throw new Error(err.message || "Failed to reach the email server. If local, is server.py running?");
  }
}
window.sendEmailViaServer = sendEmailViaServer;

// ─── Build registration confirmation HTML email ────────────────────────────
function buildVerificationEmailHTML(userProfile, confirmLink) {
  return `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #080b11; color: #f3f4f6; padding: 2.5rem; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid rgba(139, 92, 246, 0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #ffffff; font-size: 1.8rem; margin: 0; font-weight: 700; letter-spacing: -0.02em;">ToyzGuru</h2>
        <p style="color: #8b5cf6; font-size: 0.85rem; margin: 0.25rem 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Premium Collector Store</p>
      </div>

      <h3 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #ffffff; font-size: 1.4rem; margin-top: 0; margin-bottom: 1rem; font-weight: 600; text-align: center;">Confirm your Email Address</h3>

      <p style="color: #9ca3af; font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem;">
        Welcome to ToyzGuru, <strong style="color: #ffffff;">${userProfile.name}</strong>!<br><br>
        Thank you for registering an account with us. To complete your registration and unlock access to your profile dashboard, order history, loyalty points, and exclusive member benefits, please confirm your email address by clicking the button below:
      </p>

      <div style="text-align: center; margin-bottom: 2.5rem;">
        <a href="${confirmLink}" style="display: inline-block; padding: 0.9rem 2.2rem; background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: #ffffff !important; text-decoration: none; font-weight: 700; border-radius: 8px; box-shadow: 0 4px 15px rgba(139,92,246,0.4); font-size: 0.95rem;">Confirm Registration</a>
      </div>

      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin-bottom: 1.5rem;" />

      <p style="color: #6b7280; font-size: 0.8rem; text-align: center; line-height: 1.5; margin: 0;">
        If the button above does not work, copy and paste the following link into your browser:<br>
        <a href="${confirmLink}" style="color: #8b5cf6; text-decoration: underline; word-break: break-all;">${confirmLink}</a>
      </p>
    </div>
  `;
}

// ─── Registration verification email ──────────────────────────────────────
async function sendOutgoingVerificationEmail(userProfile) {
  const confirmLink = `${window.location.origin}${window.location.pathname}#confirm-email?email=${encodeURIComponent(userProfile.email)}`;

  try {
    await sendEmailViaServer({
      to: userProfile.email,
      subject: "Confirm your ToyzGuru Registration",
      html: buildVerificationEmailHTML(userProfile, confirmLink),
      text: `Welcome to ToyzGuru, ${userProfile.name}!\n\nPlease confirm your registration by visiting:\n${confirmLink}`,
    });
    showToast("Verification Sent", `A verification email has been sent to ${userProfile.email}.`, "success");
  } catch (error) {
    console.error("Failed to send verification email:", error);
    showCustomDialog("Verification Failed", `Failed to send verification email to ${userProfile.email}.\n\nDetails: ${error.message}\n\nPlease make sure the email server is running (email-server/server.py).`, "error");
  }
}
window.sendOutgoingVerificationEmail = sendOutgoingVerificationEmail;

// ─── Order confirmation email ──────────────────────────────────────────────
async function sendOrderConfirmationEmail(order) {
  if (!order || !order.email) return;

  const itemsHTML = (order.items || []).map(item =>
    `<tr>
      <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); color: #e5e7eb; font-size: 0.9rem;">${item.name || item.productName || "Product"}</td>
      <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); color: #9ca3af; font-size: 0.9rem; text-align: center;">×${item.quantity || 1}</td>
      <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.06); color: #a78bfa; font-size: 0.9rem; text-align: right;">₹${Number(item.price * (item.quantity || 1)).toFixed(2)}</td>
    </tr>`
  ).join("");

  const estimatedDelivery = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; background-color: #080b11; color: #f3f4f6; padding: 2.5rem; border-radius: 16px; max-width: 620px; margin: 0 auto; border: 1px solid rgba(139,92,246,0.2); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h2 style="font-family: 'Space Grotesk', Arial, sans-serif; color: #ffffff; font-size: 1.8rem; margin: 0; font-weight: 700; letter-spacing: -0.02em;">ToyzGuru</h2>
        <p style="color: #8b5cf6; font-size: 0.85rem; margin: 0.25rem 0 0 0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Premium Collector Store</p>
      </div>

      <div style="background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25); border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.75rem; text-align: center;">
        <p style="margin: 0 0 0.35rem 0; color: #a78bfa; font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;">Order Confirmed ✓</p>
        <p style="margin: 0; color: #ffffff; font-size: 1.15rem; font-weight: 700; font-family: monospace;">#${order.id || order.order_id}</p>
      </div>

      <p style="color: #9ca3af; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
        Hi <strong style="color: #ffffff;">${order.name || order.customer_name || "Valued Customer"}</strong>,<br><br>
        Thank you for your order! We've received your payment and will begin processing your items shortly.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
        <thead>
          <tr>
            <th style="padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.04); color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; border-radius: 6px 0 0 6px;">Item</th>
            <th style="padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.04); color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; text-align: center;">Qty</th>
            <th style="padding: 0.6rem 0.75rem; background: rgba(255,255,255,0.04); color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; text-align: right; border-radius: 0 6px 6px 0;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 0.75rem; color: #6b7280; font-size: 0.85rem; text-align: right; font-weight: 600;">Total Paid:</td>
            <td style="padding: 0.75rem; color: #a78bfa; font-size: 1rem; text-align: right; font-weight: 700;">₹${Number(order.total || 0).toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>

      <div style="display: flex; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 180px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 1rem;">
          <p style="margin: 0 0 0.3rem 0; color: #6b7280; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;">Shipping To</p>
          <p style="margin: 0; color: #e5e7eb; font-size: 0.88rem; line-height: 1.5;">${order.address || order.shipping_address || "—"}</p>
        </div>
        <div style="flex: 1; min-width: 180px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 10px; padding: 1rem;">
          <p style="margin: 0 0 0.3rem 0; color: #6b7280; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.07em; font-weight: 600;">Est. Delivery</p>
          <p style="margin: 0; color: #e5e7eb; font-size: 0.88rem;">${estimatedDelivery}</p>
        </div>
      </div>

      <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.07); margin-bottom: 1.5rem;" />

      <p style="color: #6b7280; font-size: 0.8rem; text-align: center; margin: 0; line-height: 1.6;">
        Questions? Reply to this email or contact us at <a href="mailto:support@toyzguru.in" style="color: #8b5cf6;">support@toyzguru.in</a><br>
        &copy; 2025 ToyzGuru Premium Store
      </p>
    </div>
  `;

  try {
    await sendEmailViaServer({
      to: order.email,
      subject: `Order Confirmed #${order.id || order.order_id} – ToyzGuru`,
      html,
      text: `Order Confirmed!\n\nHi ${order.name || "Customer"},\n\nYour order #${order.id || order.order_id} has been confirmed.\nTotal: ₹${Number(order.total || 0).toFixed(2)}\nEst. Delivery: ${estimatedDelivery}\n\nThank you for shopping at ToyzGuru!\nsupport@toyzguru.in`,
    });
    console.log("Order confirmation email sent to", order.email);
  } catch (err) {
    console.warn("Order confirmation email failed (non-blocking):", err.message);
  }
}
window.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
window.sendOrderConfirmationEmail = sendOrderConfirmationEmail;


// ================= OTP EMAIL VERIFICATION SYSTEM =================
// Generates a 6-digit OTP, emails it via the proxy server, then
// shows an in-page modal for the user to enter the code.
// Returns a Promise<boolean> — true = verified, false = cancelled/failed.

const OTP_VALIDITY_MINUTES = 10;
let _otpStore = {}; // { email: { code, expiresAt } }

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendOtpEmail(email, name) {
  const otp = generateOtp();
  const expiresAt = Date.now() + OTP_VALIDITY_MINUTES * 60 * 1000;
  _otpStore[email.toLowerCase()] = { code: otp, expiresAt };

  const html = `
    <div style="font-family:'Inter',Arial,sans-serif;background:#080b11;color:#f3f4f6;padding:2.5rem;border-radius:16px;max-width:560px;margin:0 auto;border:1px solid rgba(139,92,246,0.2);box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align:center;margin-bottom:1.75rem;">
        <h2 style="font-family:'Space Grotesk',Arial,sans-serif;color:#fff;font-size:1.7rem;margin:0;font-weight:700;letter-spacing:-0.02em;">ToyzGuru</h2>
        <p style="color:#8b5cf6;font-size:0.8rem;margin:0.2rem 0 0;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Premium Collector Store</p>
      </div>

      <h3 style="font-family:'Space Grotesk',Arial,sans-serif;color:#fff;font-size:1.25rem;margin:0 0 0.75rem;font-weight:600;text-align:center;">Registration Verification</h3>

      <p style="color:#9ca3af;font-size:0.9rem;line-height:1.65;margin-bottom:1.5rem;">
        Dear <strong style="color:#fff;">${name || "Member"}</strong>,<br><br>
        Thank you for registering with us.<br>
        To complete your registration and verify your account, please use the One-Time Password (OTP) below:
      </p>

      <div style="background:rgba(139,92,246,0.1);border:1.5px solid rgba(139,92,246,0.35);border-radius:12px;padding:1.5rem;text-align:center;margin-bottom:1.75rem;">
        <p style="margin:0 0 0.4rem;color:#a78bfa;font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Your OTP</p>
        <p style="margin:0;font-family:monospace;font-size:2.75rem;font-weight:800;color:#ffffff;letter-spacing:0.35em;text-shadow:0 0 20px rgba(139,92,246,0.6);">${otp}</p>
        <p style="margin:0.6rem 0 0;color:#6b7280;font-size:0.78rem;">Valid for <strong style="color:#a78bfa;">${OTP_VALIDITY_MINUTES} minutes</strong></p>
      </div>

      <p style="color:#9ca3af;font-size:0.85rem;line-height:1.6;margin-bottom:1.5rem;">
        For your security, please do not share this code with anyone.<br>
        If you did not initiate this registration request, please ignore this message or contact our support team immediately.
      </p>

      <hr style="border:0;border-top:1px solid rgba(255,255,255,0.07);margin-bottom:1.25rem;" />

      <p style="color:#6b7280;font-size:0.78rem;text-align:center;margin:0;line-height:1.6;">
        Thank you,<br>
        <strong style="color:#a78bfa;">ToyzGuru</strong> &mdash; Premium Collector Store<br>
        <a href="mailto:support@toyzguru.in" style="color:#8b5cf6;">support@toyzguru.in</a>
      </p>
    </div>
  `;

  await sendEmailViaServer({
    to: email,
    subject: "Your ToyzGuru Registration OTP",
    html,
    text: `Registration Verification\n\nDear ${name || "Member"},\n\nThank you for registering with us.\n\nYour OTP: ${otp}\n\nThis OTP is valid for ${OTP_VALIDITY_MINUTES} minutes. Do not share it with anyone.\n\nThank you,\nToyzGuru`,
  });

  return otp; // returned for logging only — do NOT expose in UI
}

function verifyOtpCode(email, enteredCode) {
  const record = _otpStore[email.toLowerCase()];
  if (!record) return { valid: false, reason: "No OTP sent to this email." };
  if (Date.now() > record.expiresAt) {
    delete _otpStore[email.toLowerCase()];
    return { valid: false, reason: "OTP has expired. Please try again." };
  }
  if (enteredCode.trim() !== record.code) {
    return { valid: false, reason: "Incorrect OTP. Please check your email and try again." };
  }
  delete _otpStore[email.toLowerCase()];
  return { valid: true };
}

// Shows the OTP entry modal. Returns Promise<boolean> true = verified.
function showOtpModal(email) {
  return new Promise((resolve) => {
    // Inject keyframe CSS once
    if (!document.getElementById("otp-dialog-style")) {
      const style = document.createElement("style");
      style.id = "otp-dialog-style";
      style.textContent = `
        @keyframes otpFadeIn { from { opacity:0; transform:scale(0.94) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .otp-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:1rem; }
        .otp-box { background:var(--bg-secondary,#0d1117);border:1px solid rgba(139,92,246,0.3);border-radius:20px;padding:2.25rem 2rem;max-width:420px;width:100%;box-shadow:0 0 0 1px rgba(139,92,246,0.12),0 20px 60px rgba(0,0,0,0.6);animation:otpFadeIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;position:relative; }
        .otp-input { width:100%;padding:1.1rem 1rem;font-family:monospace;font-size:2rem;font-weight:800;text-align:center;letter-spacing:0.4em;background:rgba(139,92,246,0.07);border:1.5px solid rgba(139,92,246,0.3);border-radius:12px;color:#fff;outline:none;transition:border-color 0.2s,box-shadow 0.2s; }
        .otp-input:focus { border-color:#8b5cf6;box-shadow:0 0 0 3px rgba(139,92,246,0.18); }
        .otp-input.shake { animation:shake 0.4s ease; }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        .otp-verify-btn { width:100%;padding:0.9rem;background:linear-gradient(135deg,#8b5cf6 0%,#d946ef 100%);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:1rem;cursor:pointer;margin-top:1rem;transition:transform 0.2s,box-shadow 0.2s; }
        .otp-verify-btn:hover { transform:translateY(-2px);box-shadow:0 6px 20px rgba(139,92,246,0.45); }
        .otp-verify-btn:disabled { opacity:0.55;cursor:not-allowed;transform:none; }
        .otp-cancel-btn { width:100%;padding:0.75rem;background:transparent;color:var(--text-secondary,#9ca3af);border:1px solid rgba(255,255,255,0.08);border-radius:10px;font-size:0.9rem;cursor:pointer;margin-top:0.5rem;transition:background 0.2s,border-color 0.2s; }
        .otp-cancel-btn:hover { background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.15); }
        .otp-resend-link { background:none;border:none;color:#8b5cf6;font-size:0.82rem;cursor:pointer;text-decoration:underline;padding:0; }
        .otp-resend-link:disabled { color:#6b7280;cursor:not-allowed;text-decoration:none; }
        .otp-error-msg { color:#f87171;font-size:0.82rem;text-align:center;margin-top:0.6rem;min-height:1.2em; }
      `;
      document.head.appendChild(style);
    }

    const overlay = document.createElement("div");
    overlay.className = "otp-overlay";
    overlay.innerHTML = `
      <div class="otp-box">
        <button id="otp-close-btn" style="position:absolute;top:1rem;right:1rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:var(--text-secondary,#9ca3af);width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">&times;</button>

        <div style="text-align:center;margin-bottom:1.5rem;">
          <div style="width:52px;height:52px;background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;">
            <i data-feather="mail" style="width:24px;height:24px;color:#8b5cf6;"></i>
          </div>
          <h3 style="font-family:'Space Grotesk',sans-serif;color:#fff;font-size:1.3rem;font-weight:700;margin:0 0 0.4rem;">Verify Your Email</h3>
          <p style="color:#9ca3af;font-size:0.88rem;margin:0;line-height:1.5;">
            We've sent a <strong style="color:#a78bfa;">6-digit OTP</strong> to<br>
            <strong style="color:#e5e7eb;">${email}</strong>
          </p>
        </div>

        <input id="otp-code-input" class="otp-input" type="text" inputmode="numeric" maxlength="6" placeholder="— — — — — —" autocomplete="one-time-code" />
        <p id="otp-error-msg" class="otp-error-msg"></p>

        <p style="color:#6b7280;font-size:0.8rem;text-align:center;margin:0.25rem 0 0;">
          Valid for <strong style="color:#a78bfa;">${OTP_VALIDITY_MINUTES} min</strong> &nbsp;·&nbsp;
          <button id="otp-resend-btn" class="otp-resend-link">Resend OTP</button>
        </p>

        <button id="otp-verify-btn" class="otp-verify-btn">Verify &amp; Continue</button>
        <button id="otp-cancel-btn-action" class="otp-cancel-btn">Cancel Registration</button>
      </div>
    `;

    document.body.appendChild(overlay);
    if (window.feather) feather.replace();

    const input = overlay.querySelector("#otp-code-input");
    const verifyBtn = overlay.querySelector("#otp-verify-btn");
    const cancelBtn = overlay.querySelector("#otp-cancel-btn-action");
    const closeBtn = overlay.querySelector("#otp-close-btn");
    const errorMsg = overlay.querySelector("#otp-error-msg");
    const resendBtn = overlay.querySelector("#otp-resend-btn");

    // Auto-format input to digits only
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 6);
      errorMsg.textContent = "";
    });

    input.focus();

    const doVerify = () => {
      const entered = input.value.trim();
      if (entered.length !== 6) {
        errorMsg.textContent = "Please enter the 6-digit OTP.";
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 400);
        return;
      }
      const result = verifyOtpCode(email, entered);
      if (result.valid) {
        overlay.remove();
        resolve(true);
      } else {
        errorMsg.textContent = result.reason;
        input.classList.add("shake");
        setTimeout(() => input.classList.remove("shake"), 400);
        input.value = "";
        input.focus();
      }
    };

    const doClose = () => { overlay.remove(); resolve(false); };

    verifyBtn.addEventListener("click", doVerify);
    cancelBtn.addEventListener("click", doClose);
    closeBtn.addEventListener("click", doClose);

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doVerify();
      if (e.key === "Escape") doClose();
    });

    // Resend OTP — re-sends and restarts expiry timer
    resendBtn.addEventListener("click", async () => {
      resendBtn.disabled = true;
      resendBtn.textContent = "Sending…";
      errorMsg.textContent = "";
      try {
        const storedName = resendBtn.dataset.name || "";
        await sendOtpEmail(email, storedName);
        errorMsg.style.color = "#34d399";
        errorMsg.textContent = "New OTP sent! Check your inbox.";
        setTimeout(() => { errorMsg.style.color = "#f87171"; errorMsg.textContent = ""; }, 3500);
      } catch (err) {
        errorMsg.textContent = "Failed to resend OTP: " + err.message;
      }
      setTimeout(() => { resendBtn.disabled = false; resendBtn.textContent = "Resend OTP"; }, 30000);
    });
  });
}

// Main entry point — call this before creating the account.
// Returns Promise<boolean>: true = OTP verified, false = cancelled.
async function requestEmailOtpVerification(email, name) {
  try {
    showToast("OTP Sent", `A verification OTP has been sent to ${email}. Please check your inbox.`, "info");
    await sendOtpEmail(email, name);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    await showCustomDialog(
      "OTP Delivery Failed",
      `Could not send OTP to ${email}.\n\nDetails: ${err.message}\n\nPlease ensure the email server is running (email-server/server.py on port 3001).`,
      "danger"
    );
    return false;
  }

  // Show the OTP entry modal and wait for user action
  const resendBtn_ref = document.querySelector("#otp-resend-btn");
  if (resendBtn_ref) resendBtn_ref.dataset.name = name || "";
  return await showOtpModal(email);
}
window.requestEmailOtpVerification = requestEmailOtpVerification;



// ============================================================
//  HTML Receipt Generator — Zero CDN dependency, native ₹ support
//  Opens a styled, printable invoice in a new browser tab.
// ============================================================
function generateOrderReceiptHTML(order) {
  try {
    const orderIdStr = order.id || 'N/A';
    const invoiceNum = `INV-${orderIdStr}`;
    const invoiceDate = new Date(order.date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const custName = order.customer_name || order.name || order.email || 'Customer';
    const method = (order.payment_method || order.method || 'Online').toUpperCase();
    const hsnCode = '9505';
    const gstin = 'N/A';

    // Safely parse items regardless of string/array storage
    let items = [];
    if (Array.isArray(order.items)) {
      items = order.items;
    } else if (typeof order.items === 'string') {
      try { items = JSON.parse(order.items); } catch (e) { items = []; }
    }

    const taxPct = (window.storeSettings && window.storeSettings.tax_enabled) ? (window.storeSettings.cgst_pct || 0) : 0;
    const discountVal = parseFloat(order.discount) || 0;
    const shippingVal = parseFloat(order.shipping) || 0;
    const totalVal = parseFloat(order.total) || 0;

    let computedSubtotal = 0;
    const itemRows = items.map((item, idx) => {
      if (!item) return '';
      const unitP = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0;
      const qty = item.quantity || 1;
      const lineTot = unitP * qty;
      const lineGst = lineTot * (taxPct / 100);
      computedSubtotal += lineTot;
      return `
        <tr class="${idx % 2 === 0 ? 'row-alt' : ''}">
          <td class="center">${idx + 1}</td>
          <td><strong>${item.title || ''}</strong>${item.option ? `<br><span class="muted">Variant: ${item.option}</span>` : ''}</td>
          <td class="center">${hsnCode}</td>
          <td class="center">${qty}</td>
          <td class="right">&#8377;${unitP.toFixed(2)}</td>
          <td class="center">${taxPct}%</td>
          <td class="right">&#8377;${lineGst.toFixed(2)}</td>
          <td class="right bold">&#8377;${lineTot.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const sgst = (window.storeSettings && window.storeSettings.tax_enabled) ? computedSubtotal * ((window.storeSettings.sgst_pct || 0) / 100) : 0;
    const cgst = (window.storeSettings && window.storeSettings.tax_enabled) ? computedSubtotal * ((window.storeSettings.cgst_pct || 0) / 100) : 0;
    const igst = (window.storeSettings && window.storeSettings.tax_enabled) ? computedSubtotal * ((window.storeSettings.igst_pct || 0) / 100) : 0;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>ToyzGuru Invoice &mdash; ${invoiceNum}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#eef2f7;color:#141420;font-size:13px}
    .page{max-width:860px;margin:24px auto;background:#fff;box-shadow:0 6px 32px rgba(0,0,0,.14);border-radius:10px;overflow:hidden}
    /* Header */
    .hdr{background:linear-gradient(135deg,#1a5aa0 0%,#0d3d7a 100%);color:#fff;padding:28px 32px;display:flex;justify-content:space-between;align-items:flex-start}
    .brand-name{font-size:30px;font-weight:800;letter-spacing:-.5px}
    .brand-tag{font-size:11px;opacity:.8;margin-top:3px}
    .brand-contact{font-size:10.5px;opacity:.7;margin-top:5px}
    .inv-meta{text-align:right}
    .inv-title{font-size:22px;font-weight:700;letter-spacing:1px}
    .inv-sub{font-size:11px;opacity:.85;margin-top:5px}
    /* Status bar */
    .status-bar{background:#f5f9ff;border-bottom:1px solid #dce8fa;padding:9px 32px;display:flex;align-items:center;gap:12px}
    .paid-badge{background:#1a9645;color:#fff;padding:4px 14px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:.5px}
    .status-note{color:#667;font-size:11px}
    /* Parties */
    .parties{display:grid;grid-template-columns:1fr 1fr}
    .party{padding:20px 28px}
    .party:first-child{background:#f0f6ff;border-right:1px solid #dce8fa}
    .party-label{font-size:10px;font-weight:700;color:#1a5aa0;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px}
    .party-name{font-size:14px;font-weight:700;margin-bottom:4px}
    .party-detail{font-size:11.5px;color:#667;line-height:1.6}
    /* Meta strip */
    .meta-strip{background:#1a5aa0;color:#fff;padding:9px 28px;display:flex;gap:36px;font-size:11px;font-weight:600;flex-wrap:wrap}
    .meta-strip span{opacity:.9}
    /* Table */
    .tbl-wrap{padding:0 16px}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#1a5aa0;color:#fff}
    thead th{padding:9px 8px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;white-space:nowrap}
    .th-l{text-align:left}
    .th-c{text-align:center}
    .th-r{text-align:right}
    tbody tr{border-bottom:1px solid #e5edf8}
    tbody tr.row-alt{background:#f5f9ff}
    tbody td{padding:10px 8px;vertical-align:middle}
    .center{text-align:center}
    .right{text-align:right}
    .bold{font-weight:700}
    .muted{font-size:11px;color:#889}
    /* Totals */
    .totals-wrap{display:flex;justify-content:flex-end;padding:16px 16px 4px}
    .totals-box{min-width:300px}
    .t-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #e5edf8;font-size:12.5px}
    .t-row:last-child{border:none}
    .t-label{color:#778}
    .t-val{font-weight:600;color:#141420}
    .t-val.disc{color:#c0392b}
    .grand{background:linear-gradient(135deg,#1a5aa0,#0d3d7a);color:#fff;margin:12px 16px;border-radius:7px;padding:13px 22px;display:flex;justify-content:space-between;align-items:center}
    .grand-label{font-size:14px;font-weight:700;letter-spacing:.5px}
    .grand-val{font-size:22px;font-weight:800}
    /* Footer */
    .receipt-footer{background:#1a5aa0;color:#fff;padding:16px 28px;margin-top:20px;font-size:10.5px;line-height:1.75;opacity:.95}
    .receipt-footer strong{font-weight:700}
    /* Action bar */
    .action-bar{padding:14px 28px;background:#f5f9ff;border-top:1px solid #dce8fa;display:flex;gap:10px;justify-content:flex-end}
    .btn-print{background:#1a5aa0;color:#fff;border:none;padding:9px 22px;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .2s}
    .btn-print:hover{background:#0d3d7a}
    .btn-close{background:transparent;color:#667;border:1px solid #ccd;padding:9px 18px;border-radius:6px;font-size:13px;cursor:pointer;transition:background .2s}
    .btn-close:hover{background:#eee}
    @media print{
      body{background:#fff}
      .page{box-shadow:none;margin:0;border-radius:0;max-width:100%}
      .action-bar{display:none}
    }
  </style>
</head>
<body>
<div class="page">
  <div class="hdr">
    <div>
      <div class="brand-name">ToyzGuru</div>
      <div class="brand-tag">Premium Collectibles &nbsp;&bull;&nbsp; toyzguru.in</div>
      <div class="brand-contact">support@toyzguru.in &nbsp;|&nbsp; Ph: 9527652118 &nbsp;|&nbsp; Neknampur, Hyderabad</div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">TAX INVOICE</div>
      <div class="inv-sub">Invoice No: <strong>${invoiceNum}</strong></div>
      <div class="inv-sub">Date: ${invoiceDate}</div>
    </div>
  </div>

  <div class="status-bar">
    <span class="paid-badge">&#10004; PAYMENT RECEIVED</span>
    <span class="status-note">Order successfully placed and confirmed</span>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Sold By</div>
      <div class="party-name">Shree Enterprises</div>
      <div class="party-detail">601, TNR Grandilla, Street 4, Road no. 29<br>Alkapoor Township, Neknampur<br>Hyderabad &ndash; 500089, Telangana, India<br>Ph: 9527652118<br>GSTIN: ${gstin}</div>
    </div>
    <div class="party">
      <div class="party-label">Bill To / Ship To</div>
      <div class="party-name">${custName}</div>
      <div class="party-detail">${(order.address || 'Address not recorded').replace(/\n/g, '<br>')}<br>Email: ${order.email || '&mdash;'}</div>
    </div>
  </div>

  <div class="meta-strip">
    <span>Order ID: <strong>${orderIdStr}</strong></span>
    <span>Date: <strong>${invoiceDate}</strong></span>
    <span>Payment: <strong>${method}</strong></span>
    <span>Status: <strong>PAID</strong></span>
  </div>

  <div class="tbl-wrap">
    <table>
      <thead>
        <tr>
          <th class="th-c" style="width:30px">#</th>
          <th class="th-l">Product Description</th>
          <th class="th-c">HSN</th>
          <th class="th-c">Qty</th>
          <th class="th-r">Unit Price</th>
          <th class="th-c">GST%</th>
          <th class="th-r">GST Amt</th>
          <th class="th-r">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#889;">No items found</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="totals-wrap">
    <div class="totals-box">
      <div class="t-row"><span class="t-label">Subtotal (before tax)</span><span class="t-val">&#8377;${computedSubtotal.toFixed(2)}</span></div>
      ${discountVal > 0 ? `<div class="t-row"><span class="t-label">Coupon Discount</span><span class="t-val disc">&minus;&#8377;${discountVal.toFixed(2)}</span></div>` : ''}
      <div class="t-row"><span class="t-label">Shipping &amp; Handling</span><span class="t-val">${shippingVal > 0 ? '&#8377;' + shippingVal.toFixed(2) : 'FREE'}</span></div>
      ${sgst > 0 ? `<div class="t-row"><span class="t-label">SGST @ ${window.storeSettings.sgst_pct}%</span><span class="t-val">&#8377;${sgst.toFixed(2)}</span></div>` : ''}
      ${cgst > 0 ? `<div class="t-row"><span class="t-label">CGST @ ${window.storeSettings.cgst_pct}%</span><span class="t-val">&#8377;${cgst.toFixed(2)}</span></div>` : ''}
      ${igst > 0 ? `<div class="t-row"><span class="t-label">IGST @ ${window.storeSettings.igst_pct}%</span><span class="t-val">&#8377;${igst.toFixed(2)}</span></div>` : ''}
    </div>
  </div>

  <div class="grand">
    <span class="grand-label">GRAND TOTAL</span>
    <span class="grand-val">&#8377;${totalVal.toFixed(2)}</span>
  </div>

  <div class="receipt-footer">
    <strong>Terms &amp; Conditions</strong><br>
    All sales are final. For returns/exchanges, contact support within 7 days of delivery.
    This is a computer-generated invoice &mdash; no physical signature required.<br>
    ToyzGuru &nbsp;|&nbsp; 601, TNR Grandilla, Street 4, Road no. 29, Alkapoor Township, Neknampur, Hyderabad &ndash; 500089 &nbsp;|&nbsp; Ph: 9527652118 &nbsp;|&nbsp; support@toyzguru.in &nbsp;|&nbsp; toyzguru.in
  </div>

  <div class="action-bar">
    <button class="btn-close" onclick="window.close()">Close</button>
    <button class="btn-print" onclick="window.print()">&#128438; Print / Save as PDF</button>
  </div>
</div>
</body>
</html>`;

    // Open in new tab; fall back to blob URL if popups blocked
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
    } else {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 300);
    }
    return null; // No remote URL for HTML receipts
  } catch (err) {
    console.error('generateOrderReceiptHTML error:', err);
    throw err;
  }
}
window.generateOrderReceiptHTML = generateOrderReceiptHTML;

// Keep old name as alias so any existing call sites still work
window.generateOrderReceiptPDF = function (order) {
  generateOrderReceiptHTML(order);
  return Promise.resolve(null);
};

// ── Open receipt for a given order ID ──
window.downloadOrderReceipt = async function (orderId) {
  const btns = document.querySelectorAll(`.receipt-btn-${orderId}`);
  btns.forEach(btn => {
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.6';
    btn.dataset.oldHtml = btn.innerHTML;
    btn.textContent = 'Opening...';
  });

  try {
    // Locate order — ordersState first, then Supabase
    let order = (window.ordersState || []).find(o => o.id === orderId);
    if (!order && (window.supabase || window.supabaseClient)) {
      const sb = window.supabase || window.supabaseClient;
      const { data } = await sb.from('orders').select('*').eq('id', orderId).single();
      order = data;
    }
    if (!order) { showToast('Order Not Found', 'Could not locate order data.', 'danger'); return; }

    generateOrderReceiptHTML(order);
    showToast('Receipt Opened', 'Invoice opened in a new tab. Use Print &#8594; Save as PDF to download.', 'success');
  } catch (e) {
    console.error('downloadOrderReceipt error:', e);
    showToast('Error', 'Failed to generate receipt: ' + (e.message || e), 'danger');
  } finally {
    btns.forEach(btn => {
      btn.style.pointerEvents = '';
      btn.style.opacity = '';
      btn.innerHTML = btn.dataset.oldHtml || 'View Receipt';
    });
    if (typeof feather !== 'undefined') feather.replace();
  }
};



// ================= ROUTING SYSTEM =================

function setupRouting() {
  const handleRoute = async () => {
    const hash = window.location.hash || "#home";
    const parts = hash.split("?");
    const viewName = parts[0].substring(1);
    const params = getQueryParams(parts[1] || "");

    // 0. Email Confirmation Interception
    if (viewName === "confirm-email") {
      const email = params.email;
      if (email) {
        let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
        const idx = localProfiles.findIndex(p => p.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) {
          localProfiles[idx].email_confirmed = true;
          localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));

          // Set active logged in session
          localStorage.setItem("toyzguru_mock_session", "true");
          localStorage.setItem("toyzguru_user", JSON.stringify(localProfiles[idx]));

          showToast("Email Confirmed ✓", "Registration verified! Welcome to ToyzGuru.", "success");
          await initDatabase();
          window.location.hash = "#profile";
          return;
        }
      }
      showToast("Verification Failed", "Invalid confirmation link.", "danger");
      window.location.hash = "#auth";
      return;
    }

    // 1. Password Reset Token Interception
    if (viewName === "reset-password") {
      const token = params.token;
      const email = params.email ? decodeURIComponent(params.email).toLowerCase() : null;

      if (token && email) {
        const resetTokens = JSON.parse(localStorage.getItem("toyzguru_reset_tokens") || "{}");
        const tokenData = resetTokens[email];

        if (tokenData && tokenData.token === token && tokenData.expiresAt > Date.now()) {
          // Valid token — prepare reset session
          localStorage.setItem("toyzguru_reset_email", email);
          showToast("Link Verified", "Please enter your new password.", "success");
          
          // Clear URL parameters to prevent copy-pasting the token
          history.replaceState(null, "", window.location.pathname + '#reset-password');
        } else {
          // Invalid or expired token
          showToast("Link Expired", "This password reset link is invalid or has expired.", "danger");
          window.location.hash = "#auth";
          return;
        }
      } else if (!localStorage.getItem("toyzguru_reset_email")) {
        // Direct access to #reset-password without a token or active reset session
        window.location.hash = "#auth";
        return;
      }
    }

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
    } else if (viewName === "wishlist") {
      initWishlistView();
    } else if (viewName === "checkout") {
      initCheckoutView();
    } else if (viewName === "contact") {
      initContactView();
    } else if (viewName === "auth") {
      const signinForm = document.getElementById("auth-signin-form");
      const signupForm = document.getElementById("auth-signup-form");
      const forgotForm = document.getElementById("auth-forgot-password-form");
      if (signinForm) signinForm.reset();
      if (signupForm) signupForm.reset();
      if (forgotForm) forgotForm.reset();

      const elements = [
        "auth-signin-email", "auth-signin-password",
        "auth-signup-name", "auth-signup-email", "auth-signup-password",
        "auth-forgot-email"
      ];
      elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    } else if (viewName === "admin") {
      if (window.adminRenderDashboard) {
        window.adminRenderDashboard();
      }
    }
  };

  window.addEventListener("hashchange", handleRoute);
  window.addEventListener("load", handleRoute);

  // Run immediately on initialization to sync view with the current URL hash state
  handleRoute();
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

// ================= FOOTER COLLECTIONS =================
function renderFooterCollections() {
  const list = document.getElementById("footer-browse-store-links");
  if (!list) return;

  // Display names for known categories — matches catalog sidebar labels
  const categoryDisplayNames = {
    "anime": "Anime Figures",
    "toy-cars": "Collectible Cars",
    "watches": "Imported Watches",
    "Katana": "Katana Collection",
    "soft-toys": "Soft Toys",
    "girls-toys": "Girls' Toys",
    "action-figures": "Action Figures",
    "collectibles": "Collectibles"
  };

  const getCategoryDisplayName = (cat) => {
    if (categoryDisplayNames[cat]) return categoryDisplayNames[cat];
    // Auto-generate readable name from slug for any future categories
    return cat.split(/[-_]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  // Get unique categories from productsState, sorted alphabetically
  const uniqueCats = [...new Set(productsState.map(p => p.category))].sort();

  // Build links: "All Collections" first, then each category
  let html = `<li><a href="#catalog" class="footer-link">All Collections</a></li>`;
  uniqueCats.forEach(cat => {
    html += `<li><a href="#catalog?category=${encodeURIComponent(cat)}" class="footer-link">${getCategoryDisplayName(cat)}</a></li>`;
  });

  list.innerHTML = html;
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

  const isWishlisted = wishlistState.includes(product.id);
  const heartClass = isWishlisted ? "wishlist-toggle-btn active" : "wishlist-toggle-btn";
  const heartFill = isWishlisted ? 'fill="var(--color-brand)"' : '';
  const wishlistBtnHTML = `
    <button class="${heartClass}" onclick="event.stopPropagation(); toggleWishlist('${product.id}')" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
      <i data-feather="heart" ${heartFill} style="width: 15px; height: 15px; ${isWishlisted ? 'fill: var(--color-brand); stroke: var(--color-brand);' : ''}"></i>
    </button>
  `;

  return `
    <article class="product-card" id="product-card-${product.id}">
      ${displayBadge}
      <div class="product-card-img-wrap">
        ${wishlistBtnHTML}
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

  // Update wishlist button in product detail modal
  const modalWishlistBtn = document.getElementById("modal-wishlist-btn");
  if (modalWishlistBtn) {
    const isWishlisted = wishlistState.includes(productId);
    if (isWishlisted) {
      modalWishlistBtn.classList.add("active");
      modalWishlistBtn.innerHTML = `<i data-feather="heart" style="width: 20px; height: 20px; fill: var(--color-brand); stroke: var(--color-brand);"></i>`;
      modalWishlistBtn.setAttribute("title", "Remove from Wishlist");
    } else {
      modalWishlistBtn.classList.remove("active");
      modalWishlistBtn.innerHTML = `<i data-feather="heart" style="width: 20px; height: 20px;"></i>`;
      modalWishlistBtn.setAttribute("title", "Add to Wishlist");
    }
    modalWishlistBtn.onclick = () => {
      toggleWishlist(productId);
      const updatedWishlist = wishlistState.includes(productId);
      if (updatedWishlist) {
        modalWishlistBtn.classList.add("active");
        modalWishlistBtn.innerHTML = `<i data-feather="heart" style="width: 20px; height: 20px; fill: var(--color-brand); stroke: var(--color-brand);"></i>`;
        modalWishlistBtn.setAttribute("title", "Remove from Wishlist");
      } else {
        modalWishlistBtn.classList.remove("active");
        modalWishlistBtn.innerHTML = `<i data-feather="heart" style="width: 20px; height: 20px;"></i>`;
        modalWishlistBtn.setAttribute("title", "Add to Wishlist");
      }
      feather.replace();
    };
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

function updateWishlistBadges() {
  const badge = document.getElementById("wishlist-badge-count");
  if (!badge) return;

  const count = wishlistState.length;
  badge.textContent = count;
  if (count > 0) {
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

async function saveWishlist() {
  localStorage.setItem("toyzguru_wishlist", JSON.stringify(wishlistState));
  updateWishlistBadges();

  // Sync to active member profile in localStorage if user is logged in
  if (userState && userState.id) {
    userState.wishlist = wishlistState;
    localStorage.setItem("toyzguru_user", JSON.stringify(userState));

    // Also update in profiles array
    let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
    const match = localProfiles.find(p => p.id === userState.id);
    if (match) {
      match.wishlist = wishlistState;
      localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));
    }

    // Sync wishlist to Supabase profile (if wishlist column exists)
    if (supabase) {
      try {
        await supabase.from('profiles').update({ wishlist: wishlistState }).eq('id', userState.id);
      } catch (err) {
        // Silently fail if wishlist column doesn't exist yet
      }
    }
  }
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
    } catch (e) { }
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

    // 2. Alternative Address 1
    if (userState && userState.address1) {
      html += `
        <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 8px;">
          <input type="radio" name="checkout-address-option" value="alt1" style="accent-color: var(--color-brand); margin-top: 0.25rem;">
          <div>
            <h5 style="margin: 0 0 0.25rem; font-size: 0.9rem; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif;">Alternative Address 1</h5>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${userState.address1}</p>
          </div>
        </label>
      `;
    }

    // 3. Alternative Address 2
    if (userState && userState.address2) {
      html += `
        <label style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer; padding: 1rem; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 8px;">
          <input type="radio" name="checkout-address-option" value="alt2" style="accent-color: var(--color-brand); margin-top: 0.25rem;">
          <div>
            <h5 style="margin: 0 0 0.25rem; font-size: 0.9rem; color: var(--text-primary); font-family: 'Space Grotesk', sans-serif;">Alternative Address 2</h5>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary); line-height: 1.4;">${userState.address2}</p>
          </div>
        </label>
      `;
    }

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
  } else if (selectedOption === "alt1" || selectedOption === "alt2") {
    // Parse stored alternative address string: Name, Email, Phone, Address, City, Zip, State, Country
    const rawAddr = selectedOption === "alt1" ? (userState && userState.address1) : (userState && userState.address2);
    if (rawAddr) {
      const parts = rawAddr.split(",").map(p => p.trim());
      // parts[0]=Name, parts[1]=Email, parts[2]=Phone, parts[3]=Address, parts[4]=City, parts[5]=Zip, parts[6]=State
      const parsedName = parts[0] || "";
      const parsedEmail = parts[1] || (userState ? userState.email : "");
      const parsedPhone = parts[2] || (userState ? userState.phone : "");
      const parsedAddr = parts[3] || "";
      const parsedCity = parts[4] || "";
      const parsedZip = parts[5] || "";
      const parsedState = parts[6] || "";
      document.getElementById("ship-first-name").value = parsedName.split(" ")[0] || parsedName;
      document.getElementById("ship-last-name").value = parsedName.split(" ").slice(1).join(" ") || "";
      document.getElementById("ship-email").value = parsedEmail;
      document.getElementById("ship-phone").value = parsedPhone;
      document.getElementById("ship-address").value = parsedAddr;
      document.getElementById("ship-city").value = parsedCity;
      document.getElementById("ship-zip").value = parsedZip;
      const stateSelect = document.getElementById("ship-state");
      if (stateSelect && parsedState) stateSelect.value = parsedState;
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

  // Toggle form field editability and visibility
  const wrapper = document.getElementById("checkout-address-fields-wrapper");
  if (wrapper) {
    // Always show the address fields so user can see what address is being used
    wrapper.style.display = "grid";

    // Make fields read-only when using saved address, editable for new address
    const inputs = wrapper.querySelectorAll("input:not([type=hidden])");
    const selects = wrapper.querySelectorAll("select");
    const saveBtn = document.getElementById("checkout-save-address-btn");

    if (selectedOption === "saved" || selectedOption === "alt1" || selectedOption === "alt2") {
      inputs.forEach(input => {
        input.readOnly = true;
        input.style.background = "rgba(255,255,255,0.03)";
        input.style.color = "var(--text-secondary)";
        input.style.cursor = "default";
      });
      selects.forEach(select => {
        select.disabled = true;
        select.style.color = "var(--text-secondary)";
        select.style.cursor = "default";
      });
      if (saveBtn) saveBtn.style.display = "none";
    } else {
      inputs.forEach(input => {
        input.readOnly = false;
        input.style.background = "";
        input.style.color = "";
        input.style.cursor = "";
      });
      selects.forEach(select => {
        select.disabled = false;
        select.style.color = "";
        select.style.cursor = "";
      });
      if (saveBtn) saveBtn.style.display = "";
    }
  }

  // Ensure shipping cost updates when selection changes
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
    const userId = userState ? userState.id : null;

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

      // ----- Receipt ready: HTML receipt opens on-demand via View Receipt button -----
      // (No PDF generation needed; see generateOrderReceiptHTML)


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
        if (userId) {
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

      // Always show the View Receipt button — HTML receipt generated on demand
      const receiptWrap = document.getElementById('success-receipt-wrap');
      const receiptLink = document.getElementById('success-receipt-link');
      if (receiptWrap && receiptLink) {
        receiptLink.href = 'javascript:void(0)';
        receiptLink.onclick = function (e) { e.preventDefault(); window.downloadOrderReceipt(newOrderObj.id); };
        receiptWrap.style.display = '';
        if (typeof feather !== 'undefined') feather.replace();
      }

      // Set success redirection links
      document.getElementById("success-track-link").href = `#tracking?id=${newOrderId}`;

      // Send order confirmation email (non-blocking)
      if (window.sendOrderConfirmationEmail) {
        window.sendOrderConfirmationEmail(newOrderObj);
      }


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
          ondismiss: function () {
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
    const parsedItems = Array.isArray(ord.items) ? ord.items : (typeof ord.items === 'string' ? (() => { try { return JSON.parse(ord.items); } catch (e) { return []; } })() : []);
    const itemsSummary = parsedItems.map(i => `${i.title || ''} (${i.option || ''}) x${i.quantity || 1}`).join("<br>");

    return `
      <tr>
        <td style="font-family: 'Space Grotesk', sans-serif; font-weight: 600;">${ord.id}</td>
        <td>${orderDate}</td>
        <td style="font-size: 0.8rem; line-height: 1.4;">${itemsSummary}</td>
        <td style="font-weight: 700; color: var(--color-brand);">₹${ord.total.toFixed(2)}</td>
        <td><span class="order-status-badge status-${ord.status}">${ord.status}</span></td>
        <td>
          <a href="javascript:void(0)" class="product-card-add-btn receipt-btn-${ord.id}" onclick="window.downloadOrderReceipt('${ord.id}')" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; text-decoration: none; display: inline-block;">Download Receipt</a>
          <a href="#tracking?id=${ord.id}" class="product-card-add-btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; text-decoration: none; display: inline-block;">Track Status</a>
        </td>
      </tr>
    `;
  }).join("");

  // Render payment history list
  renderPaymentHistory(userOrders);

  // Refresh wishlist inside member profile settings too
  renderProfileWishlist();

  feather.replace();
}

function renderPaymentHistory(userOrders) {
  const payContainer = document.getElementById("profile-payments-list");
  if (!payContainer) return;

  if (!userOrders || userOrders.length === 0) {
    payContainer.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;color:var(--text-secondary);padding:2rem;">
          No payment transactions found for your account.
        </td>
      </tr>
    `;
    return;
  }

  payContainer.innerHTML = userOrders.map(ord => {
    const payDate = new Date(ord.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const itemsList = Array.isArray(ord.items)
      ? ord.items.map(i => `${i.title} x${i.quantity}`).join("<br>")
      : "—";

    return `
      <tr id="pay-row-${ord.id}">
        <td style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:var(--color-brand);">${ord.id}</td>
        <td>${payDate}</td>
        <td style="font-size:0.8rem;line-height:1.5;">${itemsList}</td>
        <td style="font-weight:700;">₹${Number(ord.total).toFixed(2)}</td>
        <td>
          <a href="javascript:void(0)" class="receipt-btn-${ord.id}" onclick="window.downloadOrderReceipt('${ord.id}')"
            style="display:inline-flex;align-items:center;gap:0.35rem;padding:0.3rem 0.7rem;background:var(--color-brand);color:#fff;border-radius:5px;font-size:0.75rem;font-weight:700;text-decoration:none;">
            <i data-feather="download" style="width:12px;height:12px;"></i> Download
          </a>
        </td>
        <td>
          <button type="button" onclick="window.deletePaymentRecord('${ord.id}')"
            style="padding:0.3rem 0.65rem;font-size:0.75rem;background:rgba(255,60,60,0.12);color:#ff6b6b;border:1px solid rgba(255,60,60,0.3);border-radius:5px;cursor:pointer;font-weight:600;">
            Delete
          </button>
        </td>
      </tr>
    `;
  }).join("");

  if (typeof feather !== "undefined") feather.replace();
}

window.deletePaymentRecord = async function (orderId) {
  if (!await showCustomDialog("Delete Record", `Remove order ${orderId} from your payment history? This only removes the local record — the actual order remains in the system.`, "warning", true)) return;

  // Remove from ordersState memory
  ordersState = ordersState.filter(o => o.id !== orderId);

  // Remove from localStorage
  const stored = JSON.parse(localStorage.getItem("toyzguru_orders")) || [];
  const updated = stored.filter(o => o.id !== orderId);
  localStorage.setItem("toyzguru_orders", JSON.stringify(updated));

  // Remove row from DOM
  const row = document.getElementById(`pay-row-${orderId}`);
  if (row) row.remove();

  showToast("Record Removed", `Payment record for ${orderId} removed from your history.`, "info");
};

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

// ---- Helper: re-render address cards without full profile re-init ----
function refreshAddressCards() {
  const addrContainer = document.getElementById('member-addresses-container');
  if (!addrContainer) return;
  addrContainer.innerHTML = '';
  [1, 2].forEach(function (i) {
    const val = i === 1 ? userState.address1 : userState.address2;
    if (val) {
      addrContainer.innerHTML += `
        <div style="padding: 1rem; background: rgba(255,255,255,0.02); border: 1px solid var(--glass-border); border-radius: 8px;">
          <h5 style="margin: 0 0 0.5rem; color: var(--text-primary); font-family: 'Space Grotesk',sans-serif;">Alternative Address ${i}</h5>
          <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">${val}</p>
          <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
            <button type="button" onclick="window.editAlternativeAddress(${i})" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: var(--color-brand); color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
            <button type="button" onclick="window.deleteAlternativeAddress(${i})" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; background: rgba(255,255,255,0.1); color: var(--text-primary); border: 1px solid var(--glass-border); border-radius: 4px; cursor: pointer;">Delete</button>
          </div>
        </div>
      `;
    }
  });
  if (!userState.address1 && !userState.address2) {
    addrContainer.innerHTML = '<div style="font-size: 0.85rem; color: var(--text-muted);">No alternative addresses saved yet.</div>';
  }
}

window.deleteAlternativeAddress = async function (idx) {
  if (!await showCustomDialog("Delete Address", `Delete Alternative Address ${idx}? This cannot be undone.`, "warning", true)) return;
  if (idx === 1) userState.address1 = null;
  if (idx === 2) userState.address2 = null;

  try {
    if (supabase && userState.id) {
      const payload = {};
      payload[`address${idx}`] = null;
      const { error } = await supabase.from('profiles').update(payload).eq('id', userState.id);
      if (error) throw error;
    }
    await saveUser();
    refreshAddressCards();
    showToast('Address Deleted', `Alternative Address ${idx} removed.`, 'info');
  } catch (err) {
    showToast('Delete Failed', err.message, 'danger');
  }
};

window.editAlternativeAddress = function (idx) {
  const current = (idx === 1 ? userState.address1 : userState.address2) || '';

  // Remove any existing address edit modal
  const existing = document.getElementById('addr-edit-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'addr-edit-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem;';
  modal.innerHTML = `
    <div style="background:var(--bg-secondary);border:1px solid var(--glass-border);border-radius:12px;padding:2rem;width:100%;max-width:480px;">
      <h4 style="margin:0 0 1.25rem;font-family:'Space Grotesk',sans-serif;color:var(--color-brand);">Edit Alternative Address ${idx}</h4>
      <textarea id="addr-edit-input" rows="4" style="width:100%;padding:0.75rem;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);font-size:0.9rem;font-family:inherit;resize:vertical;box-sizing:border-box;">${current}</textarea>
      <p style="font-size:0.78rem;color:var(--text-muted);margin:0.5rem 0 1.25rem;">Enter full address details (e.g. Name, Phone, Street, City, State, Pin)</p>
      <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
        <button id="addr-edit-cancel" type="button" style="padding:0.5rem 1.25rem;background:transparent;border:1px solid var(--glass-border);border-radius:6px;color:var(--text-primary);cursor:pointer;font-size:0.9rem;">Cancel</button>
        <button id="addr-edit-save" type="button" style="padding:0.5rem 1.25rem;background:var(--color-brand);border:none;border-radius:6px;color:white;cursor:pointer;font-size:0.9rem;font-weight:600;">Save Address</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('addr-edit-cancel').onclick = function () { modal.remove(); };
  modal.onclick = function (e) { if (e.target === modal) modal.remove(); };

  document.getElementById('addr-edit-save').onclick = async function () {
    const newVal = document.getElementById('addr-edit-input').value.trim();
    if (!newVal) {
      showToast('Validation Error', 'Address cannot be empty.', 'danger');
      return;
    }
    if (idx === 1) userState.address1 = newVal;
    if (idx === 2) userState.address2 = newVal;
    try {
      if (supabase && userState.id) {
        const payload = {};
        payload[`address${idx}`] = newVal;
        const { error } = await supabase.from('profiles').update(payload).eq('id', userState.id);
        if (error) throw error;
      }
      await saveUser();
      modal.remove();
      refreshAddressCards();
      showToast('Address Updated', `Alternative Address ${idx} saved successfully.`, 'success');
    } catch (err) {
      showToast('Update Failed', err.message, 'danger');
    }
  };
};

// ================= EVENT LISTENERS BINDINGS =================
function setupEventListeners() {
  console.log("setupEventListeners running");

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
      if (authForgotPasswordForm) authForgotPasswordForm.style.display = "none";
    });
    authTabSignup.addEventListener("click", () => {
      authTabSignup.classList.add("active");
      authTabSignin.classList.remove("active");
      authSignupForm.style.display = "block";
      authSigninForm.style.display = "none";
      if (authForgotPasswordForm) authForgotPasswordForm.style.display = "none";
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

  // Auth Forgot Password Submit — sends real email with token link
  if (authForgotPasswordForm) {
    authForgotPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("auth-forgot-email").value.trim();
      if (!email) return;

      const submitBtn = authForgotPasswordForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      try {
        const localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
        let matchedProfile = localProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());

        // For demo purposes, we'll proceed even if the profile isn't found locally yet
        if (!matchedProfile) {
          matchedProfile = { email: email, name: "Customer" };
        }

        // Generate secure reset token (32 hex chars)
        const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0')).join('');
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes

        // Store token in localStorage keyed by email
        const resetTokens = JSON.parse(localStorage.getItem("toyzguru_reset_tokens") || "{}");
        resetTokens[email.toLowerCase()] = { token, expiresAt };
        localStorage.setItem("toyzguru_reset_tokens", JSON.stringify(resetTokens));

        // Build the reset URL
        const baseUrl = window.location.origin + window.location.pathname;
        const resetUrl = `${baseUrl}#reset-password?token=${token}&email=${encodeURIComponent(email)}`;
        const customerName = matchedProfile.name || "Valued Customer";

        // Build professional reset email HTML
        const resetEmailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0d14;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0d14;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:linear-gradient(145deg,#0f1420 0%,#111827 100%);border-radius:16px;border:1px solid rgba(139,92,246,0.18);box-shadow:0 20px 60px rgba(0,0,0,0.6);overflow:hidden;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#1a0a2e 0%,#0d1b3e 60%,#0a1628 100%);padding:36px 40px;text-align:center;border-bottom:1px solid rgba(139,92,246,0.15);">
  <div style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;margin-bottom:4px;">ToyzGuru</div>
  <div style="font-size:11px;color:#8b5cf6;font-weight:600;text-transform:uppercase;letter-spacing:2px;">Premium Collector Store</div>
</td></tr>

<!-- Icon + Heading -->
<tr><td style="padding:40px 40px 20px;text-align:center;">
  <div style="font-size:48px;margin-bottom:16px;">&#128272;</div>
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">Password Reset Request</h1>
  <p style="margin:0;color:#9ca3af;font-size:14px;">We received a request to reset your account password</p>
</td></tr>

<!-- Body -->
<tr><td style="padding:0 40px 32px;">
  <p style="color:#d1d5db;font-size:15px;line-height:1.7;margin:0 0 24px;">
    Hi <strong style="color:#ffffff;">${customerName}</strong>,<br><br>
    Someone requested a password reset for the ToyzGuru account linked to
    <strong style="color:#a78bfa;">${email}</strong>.
    If this was you, click the button below to create a new password.
  </p>

  <!-- CTA Button -->
  <div style="text-align:center;margin:28px 0 32px;">
    <a href="${resetUrl}"
       style="display:inline-block;background:linear-gradient(135deg,#7c3aed 0%,#8b5cf6 100%);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 44px;border-radius:10px;letter-spacing:0.3px;box-shadow:0 8px 24px rgba(139,92,246,0.45);">
      Reset My Password &rarr;
    </a>
  </div>

  <!-- Warning box -->
  <div style="background:rgba(251,191,36,0.06);border:1px solid rgba(251,191,36,0.22);border-radius:10px;padding:16px 20px;margin-bottom:24px;">
    <p style="margin:0;color:#fbbf24;font-size:13px;line-height:1.65;">
      <strong>&#9200; This link expires in 30 minutes.</strong><br>
      If you did not request a password reset, you can safely ignore this email &mdash; your password will not change.
    </p>
  </div>

  <!-- Manual link -->
  <p style="color:#6b7280;font-size:11.5px;line-height:1.6;margin:0;">
    If the button above does not work, paste this URL into your browser:<br>
    <span style="color:#8b5cf6;word-break:break-all;">${resetUrl}</span>
  </p>
</td></tr>

<!-- Divider -->
<tr><td style="padding:0 40px;"><div style="border-top:1px solid rgba(255,255,255,0.06);"></div></td></tr>

<!-- Footer -->
<tr><td style="padding:22px 40px 34px;text-align:center;">
  <p style="margin:0 0 5px;color:#4b5563;font-size:11.5px;line-height:1.7;">
    ToyzGuru &nbsp;|&nbsp; 601, TNR Grandilla, Street 4, Road no. 29, Neknampur, Hyderabad &ndash; 500089<br>
    <a href="mailto:support@toyzguru.in" style="color:#8b5cf6;text-decoration:none;">support@toyzguru.in</a>
    &nbsp;|&nbsp; Ph: 9527652118
  </p>
  <p style="margin:6px 0 0;color:#374151;font-size:11px;">&copy; 2025 ToyzGuru. All rights reserved.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

        // Send email via server
        await sendEmailViaServer({
          to: email,
          subject: "Reset Your ToyzGuru Password",
          html: resetEmailHtml,
          text: `Hi ${customerName},\n\nYou requested a password reset for your ToyzGuru account.\n\nReset link (expires in 30 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email.\n\nToyzGuru Support\nsupport@toyzguru.in | Ph: 9527652118`
        });

        // Reset form and return to Sign In
        authForgotPasswordForm.reset();
        authForgotPasswordForm.style.display = "none";
        if (authSigninForm) authSigninForm.style.display = "block";

        // Show a custom dialog box indicating the email was sent
        showCustomDialog(
          "Check Your Inbox", 
          `A password reset link has been sent to ${email}.\n\nPlease check your inbox (and spam folder) and click the link to set your new password.`, 
          "success"
        );

      } catch (err) {
        console.error("Password reset email error:", err);
        showToast("Email Failed", "Could not send reset email. Please ensure the email server is running (email-server/server.py on port 3001).", "danger");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Reset Link';
        }
      }
    });
  }

  // Auth Reset Password Submit — full validation + Local registry update + success modal
  if (authResetPasswordForm) {
    authResetPasswordForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newPassword = document.getElementById("auth-reset-new-password").value;
      const confirmPassword = document.getElementById("auth-reset-confirm-password");
      const matchLabel = document.getElementById("reset-pw-match-label");
      const submitBtn = document.getElementById("auth-reset-submit-btn");

      // Validate password length
      if (newPassword.length < 6) {
        showToast("Too Short", "Password must be at least 6 characters long.", "warning");
        return;
      }

      // Validate confirm password matches
      if (confirmPassword && newPassword !== confirmPassword.value) {
        if (matchLabel) {
          matchLabel.textContent = '✗ Passwords do not match';
          matchLabel.style.color = '#ef4444';
        }
        showToast("Passwords Don't Match", "Please make sure both passwords are identical.", "warning");
        return;
      }

      // Loading state
      if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i data-feather="loader" style="width:15px;height:15px;vertical-align:middle;"></i> Updating...'; feather.replace(); }

      setTimeout(async () => {
        try {
          const resetEmail = localStorage.getItem("toyzguru_reset_email") || (userState && userState.email);
          if (!resetEmail) {
            throw new Error("No active password reset session found.");
          }

          let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
          const idx = localProfiles.findIndex(p => p.email.toLowerCase() === resetEmail.toLowerCase());

          if (idx !== -1) {
            localProfiles[idx].password = newPassword;
            localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));

            // Sync with Supabase profiles table if the profile is currently active
            if (userState && userState.email.toLowerCase() === resetEmail.toLowerCase()) {
              userState.password = newPassword;
              await saveUser();
            }
          }

          localStorage.removeItem("toyzguru_reset_email");

          // Clear the reset token to prevent reuse
          if (resetEmail) {
            const resetTokens = JSON.parse(localStorage.getItem("toyzguru_reset_tokens") || "{}");
            delete resetTokens[resetEmail.toLowerCase()];
            localStorage.setItem("toyzguru_reset_tokens", JSON.stringify(resetTokens));
          }

          // Sign the user out so they must log in fresh with the new password
          localStorage.removeItem("toyzguru_mock_session");
          localStorage.removeItem("toyzguru_user");
          userState = null;

          // Reset form
          authResetPasswordForm.reset();
          const bar = document.getElementById('reset-pw-strength-bar');
          const lbl = document.getElementById('reset-pw-strength-label');
          if (bar) { bar.style.width = '0%'; bar.className = ''; }
          if (lbl) lbl.textContent = '';
          if (matchLabel) { matchLabel.textContent = ''; }

          // Redirect immediately to login with a success toast
          showToast("Password Updated", "Your password has been successfully reset. Please sign in.", "success");
          window.location.hash = "#auth";
        } catch (err) {
          console.error('Password reset error:', err);
          showToast("Update Failed", err.message || "Failed to update password. Please try again.", "danger");
        } finally {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i data-feather="shield" style="width:15px;height:15px;vertical-align:middle;margin-right:0.35rem;"></i> Update Password Securely'; feather.replace(); }
        }
      }, 1000);
    });
  }

  // Supabase Auth State Change Listener — fallback for PASSWORD_RECOVERY event
  // (fires when Supabase processes the token before our interceptor runs)
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Make sure we're on the reset-password view
        if (window.location.hash !== '#reset-password') {
          window.location.hash = '#reset-password';
        }
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

      const localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
      const matchedProfile = localProfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
      const expectedPassword = matchedProfile ? (matchedProfile.password || "password123") : null;

      if (matchedProfile && expectedPassword === password) {
        if (matchedProfile.email_confirmed === false) {
          showToast("Email Unverified", "Please check your inbox and confirm your registration first.", "warning");
          return;
        }
        localStorage.setItem("toyzguru_mock_session", "true");
        localStorage.setItem("toyzguru_user", JSON.stringify(matchedProfile));

        showToast("Signed In", "Welcome back to ToyzGuru!", "success");
        await initDatabase();
        window.location.hash = "#profile";
      } else if (email.toLowerCase() === "srikantsr@gmail.com") {
        // Log in as default user
        localStorage.setItem("toyzguru_mock_session", "true");
        localStorage.setItem("toyzguru_user", JSON.stringify(defaultUser));
        if (!localStorage.getItem("toyzguru_orders")) {
          localStorage.setItem("toyzguru_orders", JSON.stringify(defaultOrders));
        }

        showToast("Signed In", "Logged in to default user profile.", "success");
        await initDatabase();
        window.location.hash = "#profile";
      } else {
        showToast("Sign In Failed", "Invalid email or password. Please try again.", "danger");
      }
    });
  }

  // Auth Sign Up Submit
  console.log("authSignupForm exists in DOM:", !!authSignupForm);
  if (authSignupForm) {
    authSignupForm.addEventListener("submit", async (e) => {
      console.log("Signup form submit triggered");
      e.preventDefault();
      const name = document.getElementById("auth-signup-name").value.trim();
      const email = document.getElementById("auth-signup-email").value.trim();
      const password = document.getElementById("auth-signup-password").value;

      if (!name || !email || !password) {
        showToast("Validation Error", "All fields are required.", "warning");
        return;
      }

      if (password.length < 6) {
        showToast("Weak Password", "Password must be at least 6 characters long.", "warning");
        return;
      }

      let localProfiles = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
      const existingProfile = localProfiles.some(p => p.email && p.email.toLowerCase() === email.toLowerCase());

      if (existingProfile) {
        await showCustomDialog("Email Exists", "Email ID already exists!", "warning");
        showToast("Sign Up Failed", "Email ID already exists!", "warning");
        return;
      }

      // Check if email already exists in Supabase profiles database first (case-insensitive)
      if (supabase) {
        try {
          const { data: dbMems, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .ilike('email', email);

          if (!checkError && dbMems && dbMems.length > 0) {
            await showCustomDialog("Email Exists", "Email ID already exists!", "warning");
            showToast("Sign Up Failed", "Email ID already exists!", "warning");
            return;
          }
        } catch (err) {
          console.warn("Could not check duplicate email on Supabase:", err);
        }
      }

      // ── OTP Verification before account creation ────────────────────────
      if (window.requestEmailOtpVerification) {
        const otpVerified = await window.requestEmailOtpVerification(email, name);
        if (!otpVerified) {
          // User cancelled or OTP failed — do not create account
          return;
        }
      }

      // Generate a UUID v4 so it can sync with Supabase profiles table
      const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });


      // Create new user profile with verification set to false
      const newProfile = {
        id: uuid,
        name: name,
        email: email,
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "India",
        loyalty_points: 120,
        created_at: new Date().toISOString(),
        password: password,
        email_confirmed: true
      };

      // Add to local profiles array
      localProfiles.push(newProfile);
      localStorage.setItem("toyzguru_profiles", JSON.stringify(localProfiles));

      // Sync user profile to Supabase database directly if online
      if (supabase) {
        try {
          const dbPayload = { ...newProfile };
          delete dbPayload.password;
          delete dbPayload.email_confirmed;

          const { error: syncError } = await supabase.from('profiles').insert(dbPayload);
          if (syncError) {
            console.error("Error saving profile to Supabase:", syncError);

            // Bypass foreign key constraint warning on local auth
            if (syncError.code === '23503') {
              console.warn("Bypassed foreign key constraint on database sync. Saved locally.");
            } else {
              // Revert local profiles registry for other critical database errors
              let currentLocal = JSON.parse(localStorage.getItem("toyzguru_profiles")) || [];
              currentLocal = currentLocal.filter(p => p.id !== uuid);
              localStorage.setItem("toyzguru_profiles", JSON.stringify(currentLocal));

              let errMsg = syncError.message || "Failed to sync registration to database.";
              if (syncError.code === '23505' || errMsg.toLowerCase().includes("unique") || errMsg.toLowerCase().includes("exists")) {
                errMsg = "Email ID already exists!";
              }
              await showCustomDialog("Sign Up Failed", errMsg, "danger");
              showToast("Sign Up Failed", errMsg, "warning");
              return;
            }
          }
        } catch (err) {
          console.warn("Could not backup profile to Supabase (offline fallback):", err);
          // For network/offline errors, we allow offline fallback.
        }
      }


      showToast("Registration Complete", "Your account has been created and verified. You can now sign in!", "success");

      // Switch view tab back to Sign In
      const authTabSignin = document.getElementById("auth-tab-signin");
      if (authTabSignin) {
        authTabSignin.click();
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
  window._profileGoToPanel = (panelId) => {
    const profileNavBtns = document.querySelectorAll(".profile-nav-btn");
    profileNavBtns.forEach(btn => {
      btn.classList.remove("active");
      if (btn.getAttribute("data-panel") === panelId) {
        btn.classList.add("active");
      }
    });

    const panels = document.querySelectorAll(".profile-panel");
    panels.forEach(p => {
      p.classList.remove("active");
      if (p.id === panelId) p.classList.add("active");
    });

    // Re-render wishlist when Wishlist Vault tab is opened
    if (panelId === "profile-wishlist") {
      renderProfileWishlist();
    }
  };

  const profileNavBtns = document.querySelectorAll(".profile-nav-btn");
  profileNavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetPanel = btn.getAttribute("data-panel");
      if (targetPanel) {
        window._profileGoToPanel(targetPanel);
      }
    });
  });

  const dashSignoutCard = document.getElementById("dash-signout-card");
  if (dashSignoutCard) {
    dashSignoutCard.addEventListener("click", () => {
      const signOutBtn = document.getElementById("profile-signout-btn");
      if (signOutBtn) signOutBtn.click();
    });
  }


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

  // Footer Newsletter signup — saves to Supabase newsletter_subscribers table
  document.getElementById("newsletter-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const email = (input.value || "").trim().toLowerCase();
    if (!email) return;

    const btn = e.target.querySelector("button[type='submit']");
    if (btn) { btn.disabled = true; btn.textContent = "Joining..."; }

    if (supabase) {
      try {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .insert({ email });

        if (error) {
          // Unique violation = already subscribed
          if (error.code === '23505') {
            showToast("Already Subscribed", `${email} is already on our drops list!`, "info");
          } else {
            throw error;
          }
        } else {
          showToast("Subscription Confirmed!", `Vault news and limited drops will be sent to ${email}.`, "success");
          input.value = "";
        }
      } catch (err) {
        console.error("Newsletter subscription error:", err);
        showToast("Subscription Failed", "Could not save your email. Please try again later.", "danger");
      }
    } else {
      // Offline / local fallback
      showToast("Subscription Confirmed (Demo)", `Vault news and limited product drops will be sent to ${email}.`, "success");
      input.value = "";
    }

    if (btn) { btn.disabled = false; btn.textContent = "Join"; }
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

  // ================= WISHLIST ACTION LISTENERS =================
  // Heart nav icon button click handler
  const wishlistIconBtn = document.getElementById("wishlist-icon-btn");
  if (wishlistIconBtn) {
    wishlistIconBtn.addEventListener("click", () => {
      window.location.hash = "#wishlist";
    });
  }

  // Clear Wishlist listeners
  const clearWishlist = () => {
    wishlistState = [];
    saveWishlist();
    initWishlistView();
    renderProfileWishlist();
    showToast("Wishlist Cleared", "All saved items removed from your wishlist vault.", "info");
  };
  const clearBtn = document.getElementById("wishlist-clear-btn");
  if (clearBtn) clearBtn.addEventListener("click", clearWishlist);
  const profileClearBtn = document.getElementById("profile-wishlist-clear-btn");
  if (profileClearBtn) profileClearBtn.addEventListener("click", clearWishlist);

  // Add All to Cart listeners
  const addAllToCart = () => {
    if (wishlistState.length === 0) return;
    let addedCount = 0;
    wishlistState.forEach(productId => {
      const product = productsState.find(p => p.id === productId);
      if (product && product.stock > 0) {
        const option = (product.options && product.options.length > 0) ? product.options[0] : "Standard";
        const existing = cartState.find(item => item.productId === productId && item.option === option);
        if (existing) {
          if (existing.quantity < product.stock) {
            existing.quantity++;
            addedCount++;
          }
        } else {
          cartState.push({
            productId: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            option: option,
            quantity: 1
          });
          addedCount++;
        }
      }
    });
    if (addedCount > 0) {
      saveCart();
      showToast("Vault Stashed", `Successfully stashed ${addedCount} wishlist items to your cart.`, "success");

      // Move stashed items out of wishlist
      wishlistState = wishlistState.filter(productId => {
        const product = productsState.find(p => p.id === productId);
        return !product || product.stock <= 0;
      });
      saveWishlist();
      initWishlistView();
      renderProfileWishlist();
    } else {
      showToast("Vault Locked", "All saved items are currently out of stock or already at limit.", "warning");
    }
  };
  const addAllBtn = document.getElementById("wishlist-add-all-btn");
  if (addAllBtn) addAllBtn.addEventListener("click", addAllToCart);
  const profileAddAllBtn = document.getElementById("profile-wishlist-add-all-btn");
  if (profileAddAllBtn) profileAddAllBtn.addEventListener("click", addAllToCart);
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

// ================= LANDSCAPE ORIENTATION HINT =================
// Shows a popup suggesting landscape mode when user opens the Member (profile)
// or Admin dashboard on a mobile portrait screen.

(function setupLandscapeHint() {
  // Views that benefit from landscape because they have wide data tables
  const LANDSCAPE_VIEWS = ['profile', 'admin'];

  const overlay = document.getElementById('landscape-hint-overlay');
  const dismissBtn = document.getElementById('landscape-hint-dismiss-btn');

  if (!overlay || !dismissBtn) return;

  // Per-session flag: user already clicked "Got it" in this session
  let sessionDismissed = false;

  /** Returns true if we're on a narrow portrait mobile screen */
  function isPortraitMobile() {
    const w = window.innerWidth || document.documentElement.clientWidth;
    const h = window.innerHeight || document.documentElement.clientHeight;
    return w < 600 && h > w; // portrait = taller than wide, narrow viewport
  }

  /** Get current view name from hash */
  function getCurrentView() {
    const hash = window.location.hash || '#home';
    return hash.split('?')[0].substring(1) || 'home';
  }

  /** Show the hint popup with animated entry */
  function showHint() {
    overlay.classList.remove('lh-hiding');
    overlay.style.display = 'flex';
    // Re-init feather icons inside the popup (rotate-cw, check, info)
    if (window.feather) window.feather.replace();
  }

  /** Hide the hint popup with animated exit */
  function hideHint(permanent) {
    if (permanent) sessionDismissed = true;
    overlay.classList.add('lh-hiding');
    // Wait for the fade-out animation to complete before hiding
    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('lh-hiding');
    }, 320);
  }

  /** Evaluate whether to show or hide based on current state */
  function evaluate() {
    if (sessionDismissed) return; // User already said "Got it" this session
    const view = getCurrentView();
    if (LANDSCAPE_VIEWS.includes(view) && isPortraitMobile()) {
      showHint();
    } else {
      // If already visible but user rotated to landscape — auto-dismiss softly
      if (overlay.style.display !== 'none') {
        hideHint(false); // don't mark as permanent — allow showing again if re-enters portrait
      }
    }
  }

  // Dismiss button: "Got it, Continue"
  dismissBtn.addEventListener('click', () => hideHint(true));

  // Re-evaluate on orientation / resize change
  window.addEventListener('resize', evaluate);
  if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', evaluate);
  } else {
    window.addEventListener('orientationchange', evaluate);
  }

  // Re-evaluate on route change (hashchange)
  window.addEventListener('hashchange', () => {
    // Small delay to let the routing/view switch complete
    setTimeout(evaluate, 150);
  });

  // Also hook into initial load
  window.addEventListener('load', () => setTimeout(evaluate, 500));

  // Reset session dismiss flag when user leaves the landscape-required views
  // so the hint may show again next visit to that view within the same session
  window.addEventListener('hashchange', () => {
    const view = getCurrentView();
    if (!LANDSCAPE_VIEWS.includes(view)) {
      sessionDismissed = false;
    }
  });


  // Expose for debugging
  window._landscapeHint = { show: showHint, hide: () => hideHint(false), evaluate };
})();


// ================= PASSWORD RESET HELPERS =================

/**
 * updateResetPasswordStrength(value)
 * Updates the visual strength indicator bar and label as user types.
 */
function updateResetPasswordStrength(value) {
  const bar = document.getElementById('reset-pw-strength-bar');
  const lbl = document.getElementById('reset-pw-strength-label');
  if (!bar || !lbl) return;

  const len = value.length;
  let strength = 0;

  if (len >= 6) strength++;
  if (len >= 10) strength++;
  if (/[A-Z]/.test(value)) strength++;
  if (/[0-9]/.test(value)) strength++;
  if (/[^A-Za-z0-9]/.test(value)) strength++;

  bar.className = '';
  if (len === 0) {
    bar.style.width = '0%';
    lbl.textContent = '';
    lbl.style.color = 'var(--text-muted)';
  } else if (strength <= 2) {
    bar.classList.add('pw-strength-weak');
    lbl.textContent = 'Weak — add numbers, symbols, and uppercase';
    lbl.style.color = '#ef4444';
  } else if (strength <= 3) {
    bar.classList.add('pw-strength-medium');
    lbl.textContent = 'Medium — getting better!';
    lbl.style.color = '#f59e0b';
  } else {
    bar.classList.add('pw-strength-strong');
    lbl.textContent = 'Strong — great password!';
    lbl.style.color = '#22c55e';
  }
}

/**
 * toggleResetPasswordVisibility(inputId, btn)
 * Toggles between password/text type and swaps the eye icon.
 */
function toggleResetPasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  // Swap feather icon
  const icon = btn.querySelector('i[data-feather]');
  if (icon) {
    icon.setAttribute('data-feather', isHidden ? 'eye-off' : 'eye');
    if (window.feather) feather.replace();
  }
}

/**
 * closePwResetSuccessModal()
 * Called by the "Go to Login Page" button inside the success modal.
 * Hides the modal, restores scroll, and navigates to the auth/login view.
 */
function closePwResetSuccessModal() {
  const modal = document.getElementById('pw-reset-success-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  // Redirect to login page
  window.location.hash = '#auth';
}

/**
 * closePwResetErrorModal()
 * Called by the "Request New Reset Link" button in the error modal.
 * Redirects to the auth page so the user can trigger a new reset.
 */
function closePwResetErrorModal() {
  const modal = document.getElementById('pw-reset-error-modal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  // Go to login where user can click "Forgot Password" again
  window.location.hash = '#auth';
}

// Expose helpers globally
window.updateResetPasswordStrength = updateResetPasswordStrength;
window.toggleResetPasswordVisibility = toggleResetPasswordVisibility;
window.closePwResetSuccessModal = closePwResetSuccessModal;
window.closePwResetErrorModal = closePwResetErrorModal;

// ================= WISHLIST ENGINE FUNCTIONS =================

function toggleWishlist(productId) {
  const index = wishlistState.indexOf(productId);
  const product = productsState.find(p => p.id === productId);
  const title = product ? product.title : "Product";

  if (index === -1) {
    wishlistState.push(productId);
    showToast("Vault Saved", `"${title}" added to your wishlist.`, "success");
  } else {
    wishlistState.splice(index, 1);
    showToast("Vault Removed", `"${title}" removed from your wishlist.`, "info");
  }

  saveWishlist();

  // Update product card icon states immediately on the screen
  const cards = document.querySelectorAll(`.product-card#product-card-${productId}`);
  cards.forEach(card => {
    const btn = card.querySelector(".wishlist-toggle-btn");
    if (btn) {
      const active = wishlistState.includes(productId);
      if (active) {
        btn.classList.add("active");
        btn.innerHTML = `<i data-feather="heart" fill="var(--color-brand)" style="width: 15px; height: 15px; fill: var(--color-brand); stroke: var(--color-brand);"></i>`;
      } else {
        btn.classList.remove("active");
        btn.innerHTML = `<i data-feather="heart" style="width: 15px; height: 15px;"></i>`;
      }
    }
  });

  // If currently viewing wishlist, refresh it
  const hash = window.location.hash || "#home";
  if (hash.startsWith("#wishlist")) {
    initWishlistView();
  }

  // Refresh wishlist inside member profile settings too
  renderProfileWishlist();

  // Trigger admin panel lists updates if admin view is active
  if (window.adminRenderMembersRegistry) {
    window.adminRenderMembersRegistry();
  }

  feather.replace();
}

function initWishlistView() {
  const container = document.getElementById("wishlist-items-grid");
  if (!container) return;

  if (wishlistState.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.01); border: 1px dashed var(--glass-border); border-radius: var(--border-radius-md);">
        <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255, 0, 128, 0.05); border: 1px solid rgba(255, 0, 128, 0.15); display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
          <i data-feather="heart" style="width: 36px; height: 36px; color: var(--color-brand);"></i>
        </div>
        <h3 style="font-size: 1.5rem; font-family: 'Space Grotesk', sans-serif; margin-bottom: 0.5rem;">Your Wishlist Vault is Empty</h3>
        <p style="font-size: 0.9rem; color: var(--text-secondary); max-width: 450px; line-height: 1.6; margin-bottom: 2rem;">
          Secure your dream collectibles before they sell out! Explore our exclusive inventory of anime action figures, detailed toy cars, and premium mechanical watches.
        </p>
        <a href="#catalog" class="checkout-btn" style="text-decoration: none; padding: 0.85rem 2rem;">
          Browse Vault Catalog <i data-feather="arrow-right" style="width: 16px; height: 16px; vertical-align: middle; margin-left: 0.25rem;"></i>
        </a>
      </div>
    `;

    // Hide actions container if empty
    const actionsContainer = document.getElementById("wishlist-actions-container");
    if (actionsContainer) actionsContainer.style.display = "none";

    feather.replace();
    return;
  }

  // Show actions container
  const actionsContainer = document.getElementById("wishlist-actions-container");
  if (actionsContainer) actionsContainer.style.display = "flex";

  // Filter products matching user wishlist ids
  const wishlistedProds = productsState.filter(p => wishlistState.includes(p.id));

  container.innerHTML = wishlistedProds.map(product => {
    return renderProductCardHTML(product);
  }).join("");

  feather.replace();
}

function renderProfileWishlist() {
  const container = document.getElementById("profile-wishlist-items-grid");
  if (!container) return;

  if (wishlistState.length === 0) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem; width: 100%;">No saved items in your vault.</div>`;
    const actions = document.getElementById("profile-wishlist-actions");
    if (actions) actions.style.display = "none";
    return;
  }

  const actions = document.getElementById("profile-wishlist-actions");
  if (actions) actions.style.display = "flex";

  const wishlistedProds = productsState.filter(p => wishlistState.includes(p.id));
  container.innerHTML = wishlistedProds.map(product => renderProductCardHTML(product)).join("");

  feather.replace();
}

// Expose wishlist functions globally
window.toggleWishlist = toggleWishlist;
window.initWishlistView = initWishlistView;
window.renderProfileWishlist = renderProfileWishlist;
