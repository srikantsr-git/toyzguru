// ToyzGuru Initial Product Database
// Stored as a global variable so other scripts can access it instantly in the browser.

window.initialProducts = [
  // Anime Figures Category
  {
    id: "anime-1",
    title: "Goku 'Ultra Instinct' Masterlise Figure",
    category: "anime",
    price: 6499.00,
    originalPrice: 7999.00,
    image: "assets/images/product_anime_figure.png",
    rating: 4.9,
    reviewsCount: 124,
    badge: "hot",
    description: "A breathtaking collector scale showcase statue featuring Goku in his perfected Ultra Instinct state. Features masterfully sculpted muscle definitions, metallic silver hair, and translucent aura visual effects.",
    options: ["Standard PVC", "Exclusive LED Base Edition"],
    specs: {
      "Scale": "1:8 Scale Collectible",
      "Height": "28 cm / 11 inches",
      "Material": "Premium PVC & ABS",
      "Studio": "ToyzGuru Studio"
    },
    stock: 15
  },
  {
    id: "anime-2",
    title: "Cyberpunk Tokyo Neon Samurai 1:6 Scale Figure",
    category: "anime",
    price: 14999.00,
    originalPrice: 17999.00,
    image: "assets/images/hero_figures.png",
    rating: 4.7,
    reviewsCount: 88,
    badge: "sale",
    description: "A high-detail 1:6 scale action figure representing a techwear cyber-samurai. Features 30 points of articulation, exchangeable magnetic hands, glowing neon energy swords, and layered textile garments.",
    options: ["Cyber Cyberpunk Edition", "Matte Stealth Edition"],
    specs: {
      "Scale": "1:6 scale fully articulated",
      "Clothing": "Real woven techwear garment fabric",
      "Accessories": "2x LED Katana, 4x exchangeable hands",
      "Height": "30 cm / 12 inches"
    },
    stock: 8
  },
  {
    id: "anime-3",
    title: "Demon Slayer Tanjiro Hinokami Kagura Figuarts",
    category: "anime",
    price: 7999.00,
    originalPrice: 8999.00,
    image: "assets/images/hero_figures.png",
    rating: 4.8,
    reviewsCount: 56,
    badge: "new",
    description: "Capturing the raw energy of the fire dance, this fixed-pose figure features dynamic flame wave wraps made of translucent resin, detailed face painting showing battle focus, and high-quality display plaque.",
    options: ["Standard Edition", "Premium Acrylic Base Edition"],
    specs: {
      "Series": "Demon Slayer: Kimetsu no Yaiba",
      "Material": "Translucent ABS & PVC",
      "Height": "21 cm",
      "Details": "Authentic licensed Figuarts Zero spec"
    },
    stock: 25
  },

  // Premium Toy Cars & Collectibles Category
  {
    id: "cars-1",
    title: "1:18 Lykan Hypersport Diecast - Cyberpunk Edition",
    category: "toy-cars",
    price: 12499.00,
    originalPrice: 15499.00,
    image: "assets/images/hero_cars.png",
    rating: 4.9,
    reviewsCount: 42,
    badge: "sale",
    description: "Exquisite 1:18 scale metal diecast replica of the legendary Lykan Hypersport in custom metallic midnight chrome. Features fully opening scissor doors, functional steerable wheels, interactive active spoiler, and working LED headlamps.",
    options: ["Midnight Chrome", "Electric Blue", "Obsidian Black"],
    specs: {
      "Scale": "1:18 Diecast Model",
      "Material": "Zinc Alloy & High-Quality ABS",
      "Details": "Opening doors, hood, and trunk",
      "Interactive": "Working steering and suspension"
    },
    stock: 12
  },
  {
    id: "cars-2",
    title: "1:18 Lamborghini Aventador SVJ Metal Replica",
    category: "toy-cars",
    price: 14499.00,
    originalPrice: 14499.00,
    image: "assets/images/hero_cars.png",
    rating: 5.0,
    reviewsCount: 19,
    badge: "new",
    description: "The ultimate track weapon, recreated in perfect precision. This collector's piece features authentic carbon fiber decals, detailed engine bay showcasing the V12 power plant, real rubber tires, and synthetic leather upholstered interior seats.",
    options: ["Ad Personam Gold", "Verde Alceo Green"],
    specs: {
      "Scale": "1:18 Scale Collector Piece",
      "Material": "Diecast metal with composite parts",
      "Weight": "1.2 kg heavy-feel body",
      "Packaging": "Premium display base & acrylic case"
    },
    stock: 8
  },
  {
    id: "cars-3",
    title: "1:24 Skyline GT-R R34 Custom Street Tuner",
    category: "toy-cars",
    price: 6999.00,
    originalPrice: 7999.00,
    image: "assets/images/hero_cars.png",
    rating: 4.6,
    reviewsCount: 67,
    badge: "",
    description: "Pay homage to the king of import tuners. Features a carbon fiber hood replica, customized chrome deep-dish rims, fully detailed RB26DETT twin-turbo engine layout, and working underglow neon lights (powered by watch batteries).",
    options: ["Bayside Blue", "Midnight Purple III"],
    specs: {
      "Scale": "1:24 scale replica",
      "Material": "Composite plastic & metal chassis",
      "Tires": "Drift-spec low profile rubber",
      "Lights": "Built-in micro LEDs with switch"
    },
    stock: 22
  },

  // Imported Watches Category
  {
    id: "watches-1",
    title: "Vanguard Cyberpunk Gold Automatic Skeleton Watch",
    category: "watches",
    price: 39999.00,
    originalPrice: 45999.00,
    image: "assets/images/hero_watches.png",
    rating: 4.9,
    reviewsCount: 31,
    badge: "hot",
    description: "An incredible automatic mechanical timepiece featuring an open-heart dial exposing gold-plated gears in motion. Wrapped in an aerospace-grade gunmetal titanium alloy case, finished with a glowing tritium-coated index.",
    options: ["Titanium / Gold", "All Matte Black"],
    specs: {
      "Movement": "Premium 24-Jewel Automatic Self-Wind",
      "Power Reserve": "42 Hours",
      "Case": "42mm Grade 5 Titanium",
      "Crystal": "Scratch-Resistant Sapphire Glass"
    },
    stock: 5
  },
  {
    id: "watches-2",
    title: "Oceanic Megalodon Automatic Dive Chronograph",
    category: "watches",
    price: 29999.00,
    originalPrice: 34999.00,
    image: "assets/images/hero_watches.png",
    rating: 4.8,
    reviewsCount: 15,
    badge: "new",
    description: "Engineered for raw performance. Featuring 200m (20ATM) water resistance, a helium escape valve, rotating ceramic bezel, and a premium custom integrated vulcanized rubber strap. Powered by an ultra-precise Japanese mechanical movement.",
    options: ["Carbon Black", "Pacific Teal"],
    specs: {
      "Movement": "Japanese NH35 mechanical automatic",
      "Water Resistance": "200 meters / 660 feet",
      "Bezel": "120-Click Unidirectional Ceramic",
      "Lume": "Swiss Super-LumiNova BGW9"
    },
    stock: 15
  },
  {
    id: "watches-3",
    title: "Starlight Cosmos Mechanical Chronograph",
    category: "watches",
    price: 24999.00,
    originalPrice: 24999.00,
    image: "assets/images/hero_watches.png",
    rating: 4.7,
    reviewsCount: 28,
    badge: "",
    description: "A cosmic masterpiece. Featuring a genuine aventurine glass dial that mimics the star-filled galaxy, polished steel case, manual winding mechanical column-wheel chronograph movement, and an alligator grain leather strap.",
    options: ["Galaxy Blue / Silver", "Supernova Red / Gold"],
    specs: {
      "Movement": "Manual Wind Column-Wheel Chrono",
      "Case": "40mm Stainless Steel",
      "Strap": "Premium Top Grain Leather",
      "Dial": "Genuine Aventurine stone crystal"
    },
    stock: 0
  }
];
