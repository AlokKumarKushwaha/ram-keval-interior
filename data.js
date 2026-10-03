// Ram Keval Interior - Initial Default Data Store
// Provides initial sample inventory and default configuration

const INITIAL_SETTINGS = {
    shopName: "Ram Keval Interior",
    tagline: "Design | Create | Elevate",
    subTagline: "Turning Houses Into Timeless Spaces. Design, Build, Inspire.",
    email: "ramashisha55@gmail.com",
    instagram: "ramkeval_interior",
    facebook: "ramkevalinterior",
    phone: "+977 9823471413 (For Nepal Only)",
    whatsapp: "9779823471413", // Direct WhatsApp ordering to Ram Keval Interior
    currencySymbol: "Rs.",
    adminPin: "1985", // Default master PIN
    locations: [
        { city: "Kathmandu", country: "Nepal", highlight: "Primary Hub & Master Workshop (Since 2000)", projects: "KL Residency (Sano Gaucharan), Thamel, Naxal" },
        { city: "Hyderabad", country: "India", highlight: "Executive & Luxury Residences", projects: "Modular Kitchen & Custom Solid Wood Works" },
        { city: "Gorakhpur", country: "India", highlight: "Heritage Woodwork & Home Interiors", projects: "Traditional & Contemporary Furniture" },
        { city: "Lucknow", country: "India", highlight: "Architectural Wood & Painting Projects", projects: "Turnkey Interiors & Custom Furniture" }
    ],
    milestones: [
        { year: "1985", title: "Master Craftsmanship Begins in Mumbai", desc: "Our founder started his dedicated woodwork career leading expert artisan teams across Navi Mumbai & West Mumbai." },
        { year: "2000", title: "Expansion to Kathmandu, Nepal", desc: "Brought unmatched expertise to Kathmandu, creating bespoke interiors for prestigious landmarks like KL Residency, Thamel & Naxal." },
        { year: "2015", title: "Corporate Partnerships", desc: "Trusted by top industry leaders including Triveni Group and Vishwakarma Cement for corporate infrastructure." },
        { year: "2025", title: "Professional Painting Services Launch", desc: "Broadened our mastery to include luxury interior & exterior painting works for a complete turnkey finish." }
    ]
};

const INITIAL_PRODUCTS = [
    {
        id: "rk-101",
        title: "Royal Teak King Size Bed with Tufted Headboard",
        category: "Bedroom",
        price: 85000,
        woodType: "Grade-A Sagwan (Teak Wood)",
        dimensions: "6 ft x 6.5 ft (King Size)",
        finish: "Hand-rubbed Melamine Matte Walnut",
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        description: "Crafted from seasoned solid teak wood with hydraulic storage box underneath and premium stain-resistant velvet headboard cushion. Built for generations.",
        inStock: true,
        featured: true,
        badge: "Bestseller"
    },
    {
        id: "rk-102",
        title: "Handcrafted 6-Seater Sheesham Dining Table Set",
        category: "Dining",
        price: 68000,
        woodType: "Pure Sheesham (Indian Rosewood)",
        dimensions: "6 ft x 3.5 ft Table + 6 Ergonomic Chairs",
        finish: "Natural Grain Honey Gloss",
        image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=80",
        description: "Solid heavy-duty dining table showcasing authentic wood grains, accompanied by 6 high-back upholstered chairs with high-density foam comfort.",
        inStock: true,
        featured: true,
        badge: "Masterpiece"
    },
    {
        id: "rk-103",
        title: "L-Shaped Modern Luxury Velvet Sectional Sofa",
        category: "Living Room",
        price: 72000,
        woodType: "Treated Sal Wood Frame + High-Density Foam",
        dimensions: "9 ft x 6 ft Corner Configuration",
        finish: "Royal Emerald Green Stain-Resistant Suede",
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
        description: "Deep-seated luxury sectional sofa with pocket spring cushions, removable washable covers, and solid brass-capped wooden legs.",
        inStock: true,
        featured: true,
        badge: "Trending"
    },
    {
        id: "rk-104",
        title: "Modular Acrylic Kitchen Cabinetry System",
        category: "Modular Kitchen",
        price: 145000,
        woodType: "BWP Grade Marine Plywood + Acrylic Facing",
        dimensions: "Customized to Room Space (Standard 10x8 L-Shape)",
        finish: "Gloss White & Charcoal Gray with Soft-Close Blum Fittings",
        image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
        description: "Waterproof, termite-proof modular kitchen with tandem pullouts, spice racks, tall pantry unit, and hydraulic overhead cabinets.",
        inStock: true,
        featured: true,
        badge: "Turnkey Kitchen"
    },
    {
        id: "rk-105",
        title: "Executive Solid Wood Study & Office Desk",
        category: "Office",
        price: 38000,
        woodType: "Seasoned Teak Wood with Brass Knobs",
        dimensions: "5 ft x 2.5 ft x 30 inch Height",
        finish: "Classic Dark Mahogany Polish",
        image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80",
        description: "Designed for leaders. Features 3 lockable drawers, cable management grommet, side CPU/folder storage and spacious scratch-resistant top.",
        inStock: true,
        featured: false,
        badge: "Office Essential"
    },
    {
        id: "rk-106",
        title: "4-Door Floor-to-Ceiling Wardrobe with Dressing Mirror",
        category: "Bedroom",
        price: 92000,
        woodType: "Commercial HDMR + Teak Veneer Sheet",
        dimensions: "7 ft Width x 8 ft Height x 2 ft Depth",
        finish: "Warm Oak Veneer with Matte PU Coating",
        image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=900&q=80",
        description: "Custom built-in wardrobe with internal LED motion sensor strips, concealed secret jewellery locker, full-length bevelled mirror, and deep hanging space.",
        inStock: true,
        featured: true,
        badge: "Custom Wardrobe"
    },
    {
        id: "rk-107",
        title: "Minimalist Floating TV Unit with Fluted Panel Backdrop",
        category: "Living Room",
        price: 32000,
        woodType: "Engineered Hardwood & Charcoal Louvers",
        dimensions: "7 ft Width x 6 ft Wall Height",
        finish: "Matte Slate & Warm Walnut Veneer",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80",
        description: "Floating media console with push-to-open acoustic drawers, concealed LED ambient backlighting and designer wooden fluted acoustic panels.",
        inStock: true,
        featured: false,
        badge: "Modern Interior"
    },
    {
        id: "rk-108",
        title: "Luxury Painting Works & Wall Texture Package",
        category: "Painting Works",
        price: 25000,
        woodType: "Asian Paints Royale / Stucco / Metallic Texture",
        dimensions: "Per Room (Up to 300 sq. ft. wall area)",
        finish: "Silk Sheen Velvet / Venetian Stucco Marble Finish",
        image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=900&q=80",
        description: "Our new 2025 specialized service! Includes wall preparation, waterproofing, crack repair, 2 coats primer, and double luxury topcoat with dust-free machine sanding.",
        inStock: true,
        featured: true,
        badge: "New in 2025"
    }
];

const INITIAL_ORDERS = [
    {
        orderId: "RKI-8901",
        date: "2026-09-28 14:30",
        customerName: "Suman Shrestha",
        customerPhone: "+977-9841234567",
        customerCity: "Kathmandu",
        customerAddress: "Sano Gaucharan, Near KL Residency, Ward 5",
        furnitureId: "rk-101",
        furnitureTitle: "Royal Teak King Size Bed with Tufted Headboard",
        furniturePrice: 85000,
        quantity: 1,
        totalAmount: 85000,
        status: "Confirmed",
        notes: "Please call 1 hour before visiting for measurement."
    },
    {
        orderId: "RKI-8902",
        date: "2026-09-30 11:15",
        customerName: "Rajesh Kumar Verma",
        customerPhone: "+91-9450123890",
        customerCity: "Gorakhpur",
        customerAddress: "Civil Lines, Near Golghar Market, House #42",
        furnitureId: "rk-102",
        furnitureTitle: "Handcrafted 6-Seater Sheesham Dining Table Set",
        furniturePrice: 68000,
        quantity: 1,
        totalAmount: 68000,
        status: "Pending",
        notes: "Want dark walnut finish instead of honey gloss if possible."
    },
    {
        orderId: "RKI-8903",
        date: "2026-10-01 09:45",
        customerName: "Pooja Reddy",
        customerPhone: "+91-9885091234",
        customerCity: "Hyderabad",
        customerAddress: "Jubilee Hills, Road No. 36, Flat 402",
        furnitureId: "rk-104",
        furnitureTitle: "Modular Acrylic Kitchen Cabinetry System",
        furniturePrice: 145000,
        quantity: 1,
        totalAmount: 145000,
        status: "In Production",
        notes: "Site visit and kitchen layout blueprint requested."
    }
];

// Helper functions for LocalStorage persistence
const Storage = {
    getProducts() {
        const data = localStorage.getItem("rki_products");
        if (!data) {
            localStorage.setItem("rki_products", JSON.stringify(INITIAL_PRODUCTS));
            return INITIAL_PRODUCTS;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return INITIAL_PRODUCTS;
        }
    },
    saveProducts(products) {
        try {
            // Clean products to strip duplicate large base64 fields before saving to localStorage
            const clean = (products || []).map(p => {
                const clone = { ...p };
                if (clone.image && !clone.image.startsWith('data:image')) {
                    delete clone.imageData;
                    delete clone.imageBase64;
                    delete clone.imagesData;
                    delete clone.imagesBase64;
                }
                return clone;
            });
            localStorage.setItem("rki_products", JSON.stringify(clean));
        } catch (e) {
            console.warn("Storage quota warning on saveProducts:", e);
        }
    },
    getOrders() {
        const data = localStorage.getItem("rki_orders");
        if (!data) {
            try { localStorage.setItem("rki_orders", JSON.stringify(INITIAL_ORDERS)); } catch (e) {}
            return INITIAL_ORDERS;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return INITIAL_ORDERS;
        }
    },
    saveOrders(orders) {
        try {
            localStorage.setItem("rki_orders", JSON.stringify(orders || []));
        } catch (e) {
            console.warn("Storage quota warning on saveOrders:", e);
        }
    },
    getSettings() {
        const data = localStorage.getItem("rki_settings");
        if (!data) {
            try { localStorage.setItem("rki_settings", JSON.stringify(INITIAL_SETTINGS)); } catch (e) {}
            return INITIAL_SETTINGS;
        }
        try {
            return JSON.parse(data);
        } catch (e) {
            return INITIAL_SETTINGS;
        }
    },
    saveSettings(settings) {
        try {
            localStorage.setItem("rki_settings", JSON.stringify(settings || {}));
        } catch (e) {
            console.warn("Storage quota warning on saveSettings:", e);
        }
    },
    resetToDefault() {
        try {
            localStorage.setItem("rki_products", JSON.stringify(INITIAL_PRODUCTS));
            localStorage.setItem("rki_orders", JSON.stringify(INITIAL_ORDERS));
            localStorage.setItem("rki_settings", JSON.stringify(INITIAL_SETTINGS));
            localStorage.removeItem("rki_custom_products");
        } catch (e) {}
    }
};
