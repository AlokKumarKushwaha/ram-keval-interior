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

const INITIAL_PRODUCTS = [];

const INITIAL_ORDERS = [];

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
        if (!data) return [];
        try {
            const list = JSON.parse(data);
            const deleted = JSON.parse(localStorage.getItem("rki_deleted_orders") || "[]");
            return Array.isArray(list) ? list.filter(o => !deleted.includes(o.orderId)) : [];
        } catch (e) {
            return [];
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
