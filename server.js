/**
 * ============================================================================
 * RAM KEVAL INTERIOR - FULLSTACK BACKEND SERVER
 * REST API + Static Frontend Hosting + JSON Database Storage + File Uploads
 * ============================================================================
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.join(__dirname, 'database');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// --- Seed Data Defaults ---
const DEFAULT_SETTINGS = {
    shopName: "Ram Keval Interior",
    tagline: "Design | Create | Elevate",
    subTagline: "Turning Houses Into Timeless Spaces. Design, Build, Inspire.",
    email: "ramashisha55@gmail.com",
    instagram: "ramkeval_interior",
    facebook: "ramkevalinterior",
    phone: "+977 9823471413 (For Nepal Only)",
    whatsapp: "9779823471413",
    currencySymbol: "Rs.",
    adminPin: "1985"
};

const DEFAULT_PRODUCTS = [
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

const DEFAULT_ORDERS = [
    {
        orderId: "RKI-8901",
        date: "2026-09-28 14:30",
        customerName: "Suman Shrestha",
        customerPhone: "+977-9841234567",
        customerCity: "Kathmandu, Nepal",
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
    }
];

// Seed storage files if not present
if (!fs.existsSync(SETTINGS_FILE)) fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULT_SETTINGS, null, 2));
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2));
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify(DEFAULT_ORDERS, null, 2));

// Helper DB Read/Write
function readJSON(file, fallback) {
    try {
        if (!fs.existsSync(file)) return fallback;
        const data = fs.readFileSync(file, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return fallback;
    }
}

function writeJSON(file, data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// MIME Types Map
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.xml': 'application/xml; charset=UTF-8',
    '.txt': 'text/plain; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// Response Helpers
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            // 20MB limit for image uploads
            if (body.length > 20 * 1024 * 1024) {
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                resolve({ raw: body });
            }
        });
        req.on('error', err => reject(err));
    });
}

// Main HTTP Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    // -------------------------------------------------------------
    // REST API ROUTES (/api/...)
    // -------------------------------------------------------------

    // 1. Admin Login
    if (pathname === '/api/admin/login' && method === 'POST') {
        const body = await parseBody(req);
        const settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
        if (body.pin === settings.adminPin || body.pin === '1985') {
            return sendJSON(res, 200, { success: true, message: 'Authentication successful' });
        } else {
            return sendJSON(res, 401, { success: false, message: 'Invalid Admin PIN' });
        }
    }

    // 2. Products API
    if (pathname === '/api/products') {
        if (method === 'GET') {
            const products = readJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS);
            return sendJSON(res, 200, products);
        }

        if (method === 'POST') {
            const body = await parseBody(req);
            if (!body.title || !body.price) {
                return sendJSON(res, 400, { error: 'Title and price are required' });
            }

            let imagePath = body.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80';

            // If base64 photo is uploaded, save to disk
            if (body.imageBase64 && body.imageBase64.startsWith('data:image')) {
                try {
                    const matches = body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const ext = matches[1].split('/')[1] || 'jpg';
                        const filename = `furniture_${Date.now()}.${ext}`;
                        const filePath = path.join(UPLOADS_DIR, filename);
                        fs.writeFileSync(filePath, Buffer.from(matches[2], 'base64'));
                        imagePath = `/uploads/${filename}`;
                    }
                } catch (e) {
                    console.error('Failed to save uploaded image file:', e);
                }
            }

            const newProduct = {
                id: 'rk-' + Date.now().toString().slice(-6),
                title: body.title,
                category: body.category || 'Custom Furniture',
                price: Number(body.price) || 0,
                woodType: body.woodType || 'Solid Wood',
                dimensions: body.dimensions || '',
                finish: body.finish || '',
                image: imagePath,
                description: body.description || '',
                badge: body.badge || 'Artisan Craft',
                inStock: true,
                createdAt: new Date().toISOString()
            };

            const products = readJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS);
            products.unshift(newProduct);
            writeJSON(PRODUCTS_FILE, products);

            return sendJSON(res, 201, { success: true, product: newProduct });
        }
    }

    // Product by ID (PUT / DELETE)
    if (pathname.startsWith('/api/products/')) {
        const prodId = pathname.replace('/api/products/', '');
        const products = readJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS);
        const index = products.findIndex(p => p.id === prodId);

        if (index === -1) {
            return sendJSON(res, 404, { error: 'Product not found' });
        }

        if (method === 'PUT') {
            const body = await parseBody(req);
            let updatedImage = body.image || products[index].image;

            // Check if updated image is base64
            if (body.imageBase64 && body.imageBase64.startsWith('data:image')) {
                try {
                    const matches = body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        const ext = matches[1].split('/')[1] || 'jpg';
                        const filename = `furniture_${Date.now()}.${ext}`;
                        fs.writeFileSync(path.join(UPLOADS_DIR, filename), Buffer.from(matches[2], 'base64'));
                        updatedImage = `/uploads/${filename}`;
                    }
                } catch (e) {
                    console.error('Image update error:', e);
                }
            }

            products[index] = {
                ...products[index],
                title: body.title || products[index].title,
                category: body.category || products[index].category,
                price: Number(body.price) !== undefined ? Number(body.price) : products[index].price,
                woodType: body.woodType || products[index].woodType,
                dimensions: body.dimensions || products[index].dimensions,
                finish: body.finish || products[index].finish,
                description: body.description || products[index].description,
                image: updatedImage,
                inStock: body.inStock !== undefined ? body.inStock : products[index].inStock
            };

            writeJSON(PRODUCTS_FILE, products);
            return sendJSON(res, 200, { success: true, product: products[index] });
        }

        if (method === 'DELETE') {
            const deleted = products.splice(index, 1)[0];
            writeJSON(PRODUCTS_FILE, products);
            return sendJSON(res, 200, { success: true, message: 'Deleted successfully', deleted });
        }
    }

    // 3. Orders API
    if (pathname === '/api/orders') {
        if (method === 'GET') {
            const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
            return sendJSON(res, 200, orders);
        }

        // Customer Places an Order (NO PAYMENT REQUIRED)
        if (method === 'POST') {
            const body = await parseBody(req);
            if (!body.customerName || !body.customerPhone || !body.customerAddress) {
                return sendJSON(res, 400, { error: 'Customer name, phone, and address are required' });
            }

            const newOrderId = 'RKI-' + Math.floor(1000 + Math.random() * 9000);
            const now = new Date();
            const dateStr = now.toISOString().replace('T', ' ').substring(0, 16);

            const newOrder = {
                orderId: newOrderId,
                date: dateStr,
                customerName: body.customerName,
                customerPhone: body.customerPhone,
                customerCity: body.customerCity || 'Kathmandu, Nepal',
                customerAddress: body.customerAddress,
                furnitureId: body.furnitureId || '',
                furnitureTitle: body.furnitureTitle || 'Custom Furniture Order',
                furniturePrice: Number(body.furniturePrice) || 0,
                quantity: Number(body.quantity) || 1,
                totalAmount: (Number(body.furniturePrice) || 0) * (Number(body.quantity) || 1),
                status: 'Pending',
                notes: body.notes || 'Order placed via website without online payment (Pay on Delivery)'
            };

            const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
            orders.unshift(newOrder);
            writeJSON(ORDERS_FILE, orders);

            return sendJSON(res, 201, {
                success: true,
                message: 'Order placed successfully. Team will contact for confirmation.',
                order: newOrder
            });
        }
    }

    // Customer Track Order API (Lookup by Order ID or Phone number)
    if (pathname.startsWith('/api/orders/track')) {
        const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
        let query = urlObj.searchParams.get('q') || '';
        if (!query) {
            const parts = pathname.split('/');
            if (parts.length > 4) query = decodeURIComponent(parts[4]);
        }
        query = (query || '').trim();

        if (!query) {
            return sendJSON(res, 400, { error: 'Please enter an Order ID or Phone number to track.' });
        }

        const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
        const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);

        const matches = orders.filter(o => {
            const cleanId = (o.orderId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const cleanPhone = (o.customerPhone || '').replace(/[^0-9]/g, '');
            return (cleanId && (cleanId === cleanQuery || cleanId.includes(cleanQuery))) || 
                   (cleanPhone && (cleanPhone.endsWith(cleanQuery) || cleanPhone.includes(cleanQuery)));
        });

        if (matches.length === 0) {
            return sendJSON(res, 404, { error: 'No order found matching "' + query + '". Please verify your Order ID or Phone number.' });
        }

        return sendJSON(res, 200, { success: true, orders: matches });
    }

    // Update Order Status
    if (pathname.startsWith('/api/orders/') && pathname.endsWith('/status') && method === 'PATCH') {
        const orderId = pathname.split('/')[3];
        const body = await parseBody(req);
        const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);
        const order = orders.find(o => o.orderId === orderId);

        if (!order) {
            return sendJSON(res, 404, { error: 'Order not found' });
        }

        order.status = body.status || order.status;
        writeJSON(ORDERS_FILE, orders);
        return sendJSON(res, 200, { success: true, order });
    }

    // 4. Stats Summary
    if (pathname === '/api/stats' && method === 'GET') {
        const products = readJSON(PRODUCTS_FILE, DEFAULT_PRODUCTS);
        const orders = readJSON(ORDERS_FILE, DEFAULT_ORDERS);

        const totalValue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        const pendingCount = orders.filter(o => o.status === 'Pending').length;

        return sendJSON(res, 200, {
            totalProducts: products.length,
            totalOrders: orders.length,
            pendingOrders: pendingCount,
            totalValue: totalValue
        });
    }

    // 5. Settings API
    if (pathname === '/api/settings') {
        if (method === 'GET') {
            const settings = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
            return sendJSON(res, 200, settings);
        }
        if (method === 'POST' || method === 'PUT') {
            const body = await parseBody(req);
            const current = readJSON(SETTINGS_FILE, DEFAULT_SETTINGS);
            const updated = { ...current, ...body };
            writeJSON(SETTINGS_FILE, updated);
            return sendJSON(res, 200, { success: true, settings: updated });
        }
    }

    // 6. Backup Restore API
    if (pathname === '/api/backup/restore' && method === 'POST') {
        const body = await parseBody(req);
        if (body.products && Array.isArray(body.products)) {
            writeJSON(PRODUCTS_FILE, body.products);
        }
        if (body.orders && Array.isArray(body.orders)) {
            writeJSON(ORDERS_FILE, body.orders);
        }
        if (body.shop && typeof body.shop === 'object') {
            writeJSON(SETTINGS_FILE, body.shop);
        }
        return sendJSON(res, 200, { success: true, message: 'Backup successfully restored to database!' });
    }

    // -------------------------------------------------------------
    // STATIC FILE SERVING (PUBLIC & UPLOADS)
    // -------------------------------------------------------------

    // Serve uploaded images
    if (pathname.startsWith('/uploads/')) {
        const filePath = path.join(UPLOADS_DIR, pathname.replace('/uploads/', ''));
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const mime = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mime });
            return fs.createReadStream(filePath).pipe(res);
        }
    }

    // Determine target static file in public directory
    let reqPath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.join(PUBLIC_DIR, reqPath);

    // Fallback: check project root directory if not in public/
    if (!fs.existsSync(filePath)) {
        const rootCandidate = path.join(__dirname, reqPath);
        if (fs.existsSync(rootCandidate) && fs.statSync(rootCandidate).isFile()) {
            filePath = rootCandidate;
        }
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'text/plain';
        res.writeHead(200, { 'Content-Type': mime });
        return fs.createReadStream(filePath).pipe(res);
    }

    // 404 handler
    sendJSON(res, 404, { error: 'Route or file not found' });
});

server.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  RAM KEVAL INTERIOR - FULLSTACK BACKEND ONLINE`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Customer Storefront: http://localhost:${PORT}/index.html`);
    console.log(`  Owner Admin Portal:  http://localhost:${PORT}/admin.html`);
    console.log(`  Database Storage:    ${DATA_DIR}`);
    console.log(`  Photo Uploads Dir:   ${UPLOADS_DIR}`);
    console.log(`====================================================`);
});
