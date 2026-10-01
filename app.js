// Ram Keval Interior - Customer Storefront Application (app.js)
// Supports both Backend API (REST) and LocalStorage Offline Fallback

document.addEventListener("DOMContentLoaded", async () => {
    // State
    let products = [];
    let settings = Storage.getSettings();
    let currentCategory = "All";
    let searchQuery = "";
    let selectedProductForOrder = null;

    // DOM Elements
    const productsContainer = document.getElementById("productsContainer");
    const categoryTabs = document.getElementById("categoryTabs");
    const searchInput = document.getElementById("searchInput");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const navLinks = document.querySelector(".nav-links");

    // Modal Elements
    const orderModal = document.getElementById("orderModal");
    const closeOrderModalBtn = document.getElementById("closeOrderModalBtn");
    const customerOrderForm = document.getElementById("customerOrderForm");
    const modalThumb = document.getElementById("modalThumb");
    const modalProdTitle = document.getElementById("modalProdTitle");
    const modalProdPrice = document.getElementById("modalProdPrice");
    const modalProdSpecs = document.getElementById("modalProdSpecs");
    const orderFurnitureId = document.getElementById("orderFurnitureId");
    const orderFurnitureTitle = document.getElementById("orderFurnitureTitle");
    const orderFurniturePrice = document.getElementById("orderFurniturePrice");
    const orderQty = document.getElementById("orderQty");

    // Success Modal Elements
    const successModal = document.getElementById("successModal");
    const closeSuccessBtn = document.getElementById("closeSuccessBtn");
    const successOrderIdDisplay = document.getElementById("successOrderIdDisplay");
    const successName = document.getElementById("successName");
    const successItem = document.getElementById("successItem");
    const successTotal = document.getElementById("successTotal");
    const sendWaOrderBtn = document.getElementById("sendWaOrderBtn");

    // Load initial products from Backend (or LocalStorage fallback)
    await loadProducts();
    await loadSettings();

    // Fetch Products Function
    async function loadProducts() {
        try {
            const res = await fetch("/api/products");
            if (res.ok) {
                products = await res.json();
            } else {
                products = Storage.getProducts();
            }
        } catch (e) {
            // Offline / file:// protocol fallback
            products = Storage.getProducts();
        }
        renderProducts();
    }

    // Fetch Settings Function
    async function loadSettings() {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                settings = await res.json();
            }
        } catch (e) {
            settings = Storage.getSettings();
        }
    }

    // Setup Category Tabs
    if (categoryTabs) {
        categoryTabs.addEventListener("click", (e) => {
            const btn = e.target.closest(".cat-btn");
            if (!btn) return;

            document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentCategory = btn.getAttribute("data-category");
            renderProducts();
        });
    }

    // Setup Search Input
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderProducts();
        });
    }

    // Mobile Navigation Toggle
    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener("click", () => {
            if (navLinks.style.display === "flex") {
                navLinks.style.display = "none";
            } else {
                navLinks.style.display = "flex";
                navLinks.style.flexDirection = "column";
                navLinks.style.position = "absolute";
                navLinks.style.top = "100%";
                navLinks.style.left = "0";
                navLinks.style.width = "100%";
                navLinks.style.background = "#fff";
                navLinks.style.padding = "20px";
                navLinks.style.boxShadow = "0 10px 25px rgba(0,0,0,0.1)";
            }
        });
    }

    // Render Product Cards
    function renderProducts() {
        if (!productsContainer) return;

        const filtered = products.filter(prod => {
            const matchesCat = (currentCategory === "All" || prod.category === currentCategory);
            const matchesSearch = !searchQuery || 
                prod.title.toLowerCase().includes(searchQuery) ||
                (prod.woodType && prod.woodType.toLowerCase().includes(searchQuery)) ||
                (prod.category && prod.category.toLowerCase().includes(searchQuery)) ||
                (prod.description && prod.description.toLowerCase().includes(searchQuery));
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            productsContainer.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #fff; border-radius: 12px; border: 1px dashed #ebdcd0;">
                    <i class="fa-solid fa-couch" style="font-size: 3rem; color: #d4a373; margin-bottom: 12px;"></i>
                    <h3 style="margin-bottom: 6px;">No furniture found</h3>
                    <p style="color: #777;">Try selecting a different category or clearing your search keywords.</p>
                </div>
            `;
            return;
        }

        productsContainer.innerHTML = filtered.map(prod => {
            const formattedPrice = Number(prod.price).toLocaleString("en-IN");
            const badgeHtml = prod.badge ? `<span class="prod-badge">${escapeHtml(prod.badge)}</span>` : '';
            
            const waMsg = encodeURIComponent(`Namaste Ram Keval Interior! I am interested in: "${prod.title}" (${settings.currencySymbol} ${formattedPrice}). Can you share more details?`);
            const waLink = `https://wa.me/${settings.whatsapp}?text=${waMsg}`;

            return `
                <div class="product-card">
                    <div class="prod-img-box">
                        <img src="${prod.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'}" alt="${escapeHtml(prod.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'">
                        ${badgeHtml}
                        <span class="prod-category-tag">${escapeHtml(prod.category)}</span>
                    </div>
                    <div class="prod-details">
                        <h3 class="prod-title">${escapeHtml(prod.title)}</h3>
                        
                        <div class="prod-specs">
                            <div><i class="fa-solid fa-tree" style="color: #8b4513;"></i> <span><strong>Wood:</strong> ${escapeHtml(prod.woodType || 'Solid Seasoned Hardwood')}</span></div>
                            ${prod.dimensions ? `<div><i class="fa-solid fa-ruler-combined" style="color: #b87333;"></i> <span><strong>Size:</strong> ${escapeHtml(prod.dimensions)}</span></div>` : ''}
                            ${prod.finish ? `<div><i class="fa-solid fa-brush" style="color: #c69214;"></i> <span><strong>Finish:</strong> ${escapeHtml(prod.finish)}</span></div>` : ''}
                        </div>

                        <p class="prod-desc">${escapeHtml(prod.description || 'Mastercrafted piece designed for unmatched durability and timeless beauty.')}</p>

                        <div class="prod-footer">
                            <div class="prod-price-box">
                                <span class="price-label">Transparent Price</span>
                                <span class="prod-price">${settings.currencySymbol} ${formattedPrice}</span>
                            </div>
                            <div class="order-btn-group">
                                <button class="btn btn-order-now order-trigger-btn" data-id="${prod.id}">
                                    <i class="fa-solid fa-cart-arrow-down"></i> Order Now
                                </button>
                                <a href="${waLink}" target="_blank" class="btn-wa-icon" title="Ask on WhatsApp">
                                    <i class="fa-brands fa-whatsapp"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        // Attach event listeners to Order buttons
        document.querySelectorAll(".order-trigger-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const prodId = btn.getAttribute("data-id");
                openOrderModal(prodId);
            });
        });
    }

    // Open Order Modal for Selected Product
    function openOrderModal(productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        selectedProductForOrder = prod;
        modalThumb.src = prod.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80';
        modalProdTitle.textContent = prod.title;
        modalProdPrice.textContent = `${settings.currencySymbol} ${Number(prod.price).toLocaleString("en-IN")}`;
        modalProdSpecs.textContent = `Wood: ${prod.woodType || 'Solid Wood'} | Category: ${prod.category}`;

        orderFurnitureId.value = prod.id;
        orderFurnitureTitle.value = prod.title;
        orderFurniturePrice.value = prod.price;
        orderQty.value = 1;

        orderModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    // Close Order Modal
    function closeOrderModal() {
        orderModal.classList.remove("active");
        document.body.style.overflow = "auto";
        customerOrderForm.reset();
        selectedProductForOrder = null;
    }

    if (closeOrderModalBtn) {
        closeOrderModalBtn.addEventListener("click", closeOrderModal);
    }

    // Handle Order Submission (POST to Backend API & LocalStorage)
    if (customerOrderForm) {
        customerOrderForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("custName").value.trim();
            const phone = document.getElementById("custPhone").value.trim();
            const city = document.getElementById("custCity").value;
            const address = document.getElementById("custAddress").value.trim();
            const notes = document.getElementById("custNotes").value.trim();
            const qty = parseInt(orderQty.value, 10) || 1;
            const unitPrice = parseFloat(orderFurniturePrice.value) || 0;
            const total = unitPrice * qty;

            const orderPayload = {
                customerName: name,
                customerPhone: phone,
                customerCity: city,
                customerAddress: address,
                furnitureId: orderFurnitureId.value,
                furnitureTitle: orderFurnitureTitle.value,
                furniturePrice: unitPrice,
                quantity: qty,
                notes: notes
            };

            let generatedOrderId = "RKI-" + Math.floor(1000 + Math.random() * 9000);

            // 1. Send Order to Backend API Server
            try {
                const apiRes = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(orderPayload)
                });
                if (apiRes.ok) {
                    const result = await apiRes.json();
                    if (result.order && result.order.orderId) {
                        generatedOrderId = result.order.orderId;
                    }
                }
            } catch (err) {
                console.log("Backend offline, saving to local storage fallback:", err);
            }

            // 2. Also save to LocalStorage for safety
            const localOrders = Storage.getOrders();
            localOrders.unshift({
                orderId: generatedOrderId,
                date: new Date().toISOString().replace("T", " ").substring(0, 16),
                customerName: name,
                customerPhone: phone,
                customerCity: city,
                customerAddress: address,
                furnitureId: orderFurnitureId.value,
                furnitureTitle: orderFurnitureTitle.value,
                furniturePrice: unitPrice,
                quantity: qty,
                totalAmount: total,
                status: "Pending",
                notes: notes
            });
            Storage.saveOrders(localOrders);

            // Close order modal
            closeOrderModal();

            // WhatsApp link with order details
            const waText = encodeURIComponent(
                `*New Furniture Order #${generatedOrderId}*\n` +
                `------------------------------------\n` +
                `*Item:* ${orderFurnitureTitle.value}\n` +
                `*Qty:* ${qty}\n` +
                `*Total Price:* ${settings.currencySymbol} ${total.toLocaleString("en-IN")}\n` +
                `*Payment:* Pay on Delivery / Direct Confirmation\n\n` +
                `*Customer Details:*\n` +
                `*Name:* ${name}\n` +
                `*Phone:* ${phone}\n` +
                `*City:* ${city}\n` +
                `*Address:* ${address}\n` +
                (notes ? `*Special Request:* ${notes}\n` : "") +
                `------------------------------------\n` +
                `Please confirm my booking and expected delivery schedule. Thank you!`
            );

            const waDirectUrl = `https://wa.me/${settings.whatsapp}?text=${waText}`;

            // Show Success Modal
            successOrderIdDisplay.textContent = generatedOrderId;
            successName.textContent = `${name} (${phone})`;
            successItem.textContent = `${orderFurnitureTitle.value} (Qty: ${qty})`;
            successTotal.textContent = `${settings.currencySymbol} ${total.toLocaleString("en-IN")}`;
            sendWaOrderBtn.href = waDirectUrl;

            successModal.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    }

    if (closeSuccessBtn) {
        closeSuccessBtn.addEventListener("click", () => {
            successModal.classList.remove("active");
            document.body.style.overflow = "auto";
        });
    }

    function escapeHtml(text) {
        if (!text) return "";
        return text
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
