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
    const modalProdSubPrice = document.getElementById("modalProdSubPrice");
    const modalProdSpecs = document.getElementById("modalProdSpecs");
    const orderFurnitureId = document.getElementById("orderFurnitureId");
    const orderFurnitureTitle = document.getElementById("orderFurnitureTitle");
    const orderFurniturePrice = document.getElementById("orderFurniturePrice");
    const orderQty = document.getElementById("orderQty");
    const custCitySelect = document.getElementById("custCity");

    // Dual Currency State (Nepal NPR & India INR)
    // 1 INR = 1.60 NPR (Fixed Nepal Exchange Peg)
    const NPR_PER_INR = 1.6;
    let currentCurrency = localStorage.getItem("rki_selected_currency") || "NPR";

    function getFormattedPrices(baseInrPrice) {
        const inr = Number(baseInrPrice) || 0;
        const npr = Math.round(inr * NPR_PER_INR);
        return {
            inr: inr,
            npr: npr,
            inrFormatted: inr.toLocaleString("en-IN"),
            nprFormatted: npr.toLocaleString("en-IN"),
            primaryLabel: currentCurrency === "NPR" ? "Nepal Price (NPR)" : "India Price (INR)",
            primaryText: currentCurrency === "NPR" 
                ? `<span class="currency-symbol">रू</span> ${npr.toLocaleString("en-IN")}` 
                : `<span class="currency-symbol">₹</span> ${inr.toLocaleString("en-IN")}`,
            secondaryText: currentCurrency === "NPR" 
                ? `≈ <span class="currency-symbol">₹</span> ${inr.toLocaleString("en-IN")} INR (India)` 
                : `≈ <span class="currency-symbol">रू</span> ${npr.toLocaleString("en-IN")} NPR (Nepal)`
        };
    }

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

    // Fetch Products Function (Server Master + Offline Fallback)
    async function loadProducts() {
        let serverProducts = [];
        try {
            const res = await fetch("/api/products");
            if (res.ok) {
                serverProducts = await res.json();
            }
        } catch (e) {
            console.log("Server waking up / offline fallback active...");
        }

        const localDeleted = JSON.parse(localStorage.getItem("rki_deleted_products") || "[]");

        if (serverProducts.length > 0) {
            // Server responded with live master catalog
            products = serverProducts.filter(p => !localDeleted.includes(p.id));
            Storage.saveProducts(products);

            // Clean local custom products to remove any deleted items
            let localCustom = JSON.parse(localStorage.getItem("rki_custom_products") || "[]");
            localCustom = localCustom.filter(cp => !localDeleted.includes(cp.id) && products.some(p => p.id === cp.id));
            localStorage.setItem("rki_custom_products", JSON.stringify(localCustom));
        } else {
            // Offline fallback: Use cached products excluding deleted ones
            const allLocal = Storage.getProducts();
            products = allLocal.filter(p => !localDeleted.includes(p.id));
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

    // Setup Currency Switcher Controls
    const btnCurrNPR = document.getElementById("btnCurrNPR");
    const btnCurrINR = document.getElementById("btnCurrINR");

    function setCurrency(curr) {
        currentCurrency = curr;
        localStorage.setItem("rki_selected_currency", curr);
        if (btnCurrNPR && btnCurrINR) {
            if (curr === "NPR") {
                btnCurrNPR.classList.add("active");
                btnCurrINR.classList.remove("active");
            } else {
                btnCurrINR.classList.add("active");
                btnCurrNPR.classList.remove("active");
            }
        }
        renderProducts();
        if (selectedProductForOrder) {
            updateOrderModalPrice();
        }
    }

    if (btnCurrNPR) {
        btnCurrNPR.addEventListener("click", () => setCurrency("NPR"));
    }
    if (btnCurrINR) {
        btnCurrINR.addEventListener("click", () => setCurrency("INR"));
    }

    // Initialize toggle state on page load
    if (btnCurrNPR && btnCurrINR) {
        if (currentCurrency === "INR") {
            btnCurrINR.classList.add("active");
            btnCurrNPR.classList.remove("active");
        } else {
            btnCurrNPR.classList.add("active");
            btnCurrINR.classList.remove("active");
        }
    }

    // Modal Price & Currency Auto-Updater
    function updateOrderModalPrice() {
        if (!selectedProductForOrder) return;
        const qty = parseInt(orderQty ? orderQty.value : 1, 10) || 1;
        const p = getFormattedPrices(selectedProductForOrder.price * qty);
        if (modalProdPrice) {
            modalProdPrice.innerHTML = `${p.primaryText} <span style="font-size: 0.85rem; font-weight: 600; color: #777;">(${currentCurrency})</span>`;
        }
        if (modalProdSubPrice) {
            modalProdSubPrice.innerHTML = p.secondaryText;
        }
    }

    if (custCitySelect) {
        custCitySelect.addEventListener("change", () => {
            const val = custCitySelect.value;
            if (val.includes("Nepal")) {
                currentCurrency = "NPR";
                if (btnCurrNPR && btnCurrINR) {
                    btnCurrNPR.classList.add("active");
                    btnCurrINR.classList.remove("active");
                }
            } else if (val.includes("India")) {
                currentCurrency = "INR";
                if (btnCurrNPR && btnCurrINR) {
                    btnCurrINR.classList.add("active");
                    btnCurrNPR.classList.remove("active");
                }
            }
            localStorage.setItem("rki_selected_currency", currentCurrency);
            updateOrderModalPrice();
            renderProducts();
        });
    }

    if (orderQty) {
        orderQty.addEventListener("input", updateOrderModalPrice);
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
        mobileMenuBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            navLinks.classList.toggle("mobile-open");
        });

        // Close mobile drawer when any link is clicked
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("mobile-open");
            });
        });

        // Close when clicking outside
        document.addEventListener("click", (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove("mobile-open");
            }
        });
    }

    // Render Product Cards with Dual Currency (Nepal NPR & India INR)
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
            const p = getFormattedPrices(prod.price);
            const badgeHtml = prod.badge ? `<span class="prod-badge">${escapeHtml(prod.badge)}</span>` : '';
            
            const waMsg = encodeURIComponent(`Namaste Ram Keval Interior! I am interested in: "${prod.title}" (NPR रू ${p.nprFormatted} / INR ₹ ${p.inrFormatted}). Can you share more details?`);
            const waLink = `https://wa.me/${settings.whatsapp}?text=${waMsg}`;

            // Multi-Angle Selector Bar if product has multiple photos
            let angleBarHtml = '';
            if (prod.images && prod.images.length > 1) {
                const anglePills = prod.images.map((imgUrl, aIdx) => {
                    return `
                        <button type="button" class="angle-thumb-pill" data-prodid="${prod.id}" data-imgsrc="${escapeHtml(imgUrl)}" title="View Angle ${aIdx + 1}">
                            <img src="${escapeHtml(imgUrl)}" class="angle-pill-mini-img" alt="Angle ${aIdx + 1}" onerror="this.style.display='none'">
                            <span>Angle ${aIdx + 1}</span>
                        </button>
                    `;
                }).join("");

                angleBarHtml = `
                    <div class="prod-angle-bar" id="angleBar_${prod.id}">
                        <span style="font-size: 0.7rem; font-weight: 700; color: #8b4513; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;">
                            <i class="fa-solid fa-camera"></i> Angles (${prod.images.length}):
                        </span>
                        <button type="button" class="angle-thumb-pill active" data-prodid="${prod.id}" data-imgsrc="${escapeHtml(prod.image)}" title="View All Angles Collage">
                            <i class="fa-solid fa-layer-group" style="font-size: 0.75rem;"></i>
                            <span>All Angles</span>
                        </button>
                        ${anglePills}
                    </div>
                `;
            }

            return `
                <div class="product-card">
                    <div class="prod-img-box">
                        <img id="cardMainImg_${prod.id}" src="${prod.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'}" alt="${escapeHtml(prod.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80'">
                        ${badgeHtml}
                        <span class="prod-category-tag">${escapeHtml(prod.category)}</span>
                    </div>
                    ${angleBarHtml}
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
                                <span class="price-label">${p.primaryLabel}</span>
                                <span class="prod-price">${p.primaryText}</span>
                                <span class="prod-equiv-price">${p.secondaryText}</span>
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

        // Attach event listeners to angle switcher pills
        document.querySelectorAll(".angle-thumb-pill").forEach(pill => {
            pill.addEventListener("click", (e) => {
                e.stopPropagation();
                const prodId = pill.getAttribute("data-prodid");
                const imgSrc = pill.getAttribute("data-imgsrc");
                const mainImg = document.getElementById(`cardMainImg_${prodId}`);
                if (mainImg && imgSrc) {
                    mainImg.src = imgSrc;
                }
                const parentBar = pill.closest(".prod-angle-bar");
                if (parentBar) {
                    parentBar.querySelectorAll(".angle-thumb-pill").forEach(p => p.classList.remove("active"));
                    pill.classList.add("active");
                }
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
        modalProdSpecs.textContent = `Wood: ${prod.woodType || 'Solid Wood'} | Category: ${prod.category}`;

        orderFurnitureId.value = prod.id;
        orderFurnitureTitle.value = prod.title;
        orderFurniturePrice.value = prod.price;
        const orderFurnitureImage = document.getElementById("orderFurnitureImage");
        if (orderFurnitureImage) orderFurnitureImage.value = prod.image || '';
        orderQty.value = 1;

        // Auto-prefill saved customer profile (Flipkart-style seamless experience)
        const savedPhone = localStorage.getItem("rki_user_phone");
        const savedName = localStorage.getItem("rki_user_name");
        const savedAddr = localStorage.getItem("rki_user_address");
        const savedCity = localStorage.getItem("rki_user_city");
        const custPhoneInput = document.getElementById("custPhone");
        const custNameInput = document.getElementById("custName");
        const custAddressInput = document.getElementById("custAddress");
        const custCityInput = document.getElementById("custCity");

        if (savedPhone && custPhoneInput && !custPhoneInput.value) custPhoneInput.value = savedPhone;
        if (savedName && custNameInput && !custNameInput.value) custNameInput.value = savedName;
        if (savedAddr && custAddressInput && !custAddressInput.value) custAddressInput.value = savedAddr;
        if (savedCity && custCityInput) custCityInput.value = savedCity;

        // Modal Angle Switcher
        const modalAngleTray = document.getElementById("modalAngleTray");
        const modalAnglePills = document.getElementById("modalAnglePills");
        if (modalAngleTray && modalAnglePills) {
            if (prod.images && prod.images.length > 1) {
                const pillsHtml = `
                    <button type="button" class="angle-thumb-pill active modal-angle-pill" data-src="${escapeHtml(prod.image)}">
                        <i class="fa-solid fa-layer-group"></i> All Angles
                    </button>
                    ${prod.images.map((url, idx) => `
                        <button type="button" class="angle-thumb-pill modal-angle-pill" data-src="${escapeHtml(url)}">
                            <img src="${escapeHtml(url)}" class="angle-pill-mini-img" alt="Angle">
                            Angle ${idx + 1}
                        </button>
                    `).join("")}
                `;
                modalAnglePills.innerHTML = pillsHtml;
                modalAngleTray.style.display = "block";

                modalAnglePills.querySelectorAll(".modal-angle-pill").forEach(pill => {
                    pill.addEventListener("click", () => {
                        modalThumb.src = pill.getAttribute("data-src");
                        modalAnglePills.querySelectorAll(".modal-angle-pill").forEach(p => p.classList.remove("active"));
                        pill.classList.add("active");
                    });
                });
            } else {
                modalAngleTray.style.display = "none";
                modalAnglePills.innerHTML = "";
            }
        }

        updateOrderModalPrice();

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

            const furnitureImage = document.getElementById("orderFurnitureImage") ? document.getElementById("orderFurnitureImage").value : "";

            const orderPayload = {
                customerName: name,
                customerPhone: phone,
                customerCity: city,
                customerAddress: address,
                furnitureId: orderFurnitureId.value,
                furnitureTitle: orderFurnitureTitle.value,
                furniturePrice: unitPrice,
                furnitureImage: furnitureImage,
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
                furnitureImage: furnitureImage,
                quantity: qty,
                totalAmount: total,
                status: "Pending",
                notes: notes
            });
            Storage.saveOrders(localOrders);

            // Save Customer Profile & Order to localStorage (Flipkart-style user memory)
            localStorage.setItem("rki_user_name", name);
            localStorage.setItem("rki_user_phone", phone);
            localStorage.setItem("rki_user_address", address);
            localStorage.setItem("rki_user_city", city);
            localStorage.setItem("rki_last_order_id", generatedOrderId);

            updateCustomerNavbarUI();

            // Close order modal
            closeOrderModal();

            const totalNPR = Math.round(total * NPR_PER_INR);
            const waPriceLine = city.includes("Nepal") || currentCurrency === "NPR" 
                ? `*Total Price:* NPR रू ${totalNPR.toLocaleString("en-IN")} (≈ INR ₹ ${total.toLocaleString("en-IN")})\n`
                : `*Total Price:* INR ₹ ${total.toLocaleString("en-IN")} (≈ NPR रू ${totalNPR.toLocaleString("en-IN")})\n`;

            // WhatsApp link with order details
            const waText = encodeURIComponent(
                `*New Furniture Order #${generatedOrderId}*\n` +
                `------------------------------------\n` +
                `*Item:* ${orderFurnitureTitle.value}\n` +
                `*Qty:* ${qty}\n` +
                waPriceLine +
                `*Location / Branch:* ${city}\n` +
                `*Payment:* Pay on Delivery / Direct Confirmation\n\n` +
                `*Customer Details:*\n` +
                `*Name:* ${name}\n` +
                `*Phone:* ${phone}\n` +
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
            successTotal.textContent = `NPR रू ${totalNPR.toLocaleString("en-IN")} (≈ ₹ ${total.toLocaleString("en-IN")} INR)`;
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

    const successTrackLiveBtn = document.getElementById("successTrackLiveBtn");
    if (successTrackLiveBtn) {
        successTrackLiveBtn.addEventListener("click", () => {
            successModal.classList.remove("active");
            openTrackOrderModal();
        });
    }

    // -------------------------------------------------------------
    // FLIPKART-STYLE CUSTOMER ACCOUNT & "MY ORDERS" CONTROLLER
    // -------------------------------------------------------------
    const trackOrderModal = document.getElementById("trackOrderModal");
    const closeTrackModalBtn = document.getElementById("closeTrackModalBtn");
    const trackOrderForm = document.getElementById("trackOrderForm");
    const trackOrderInput = document.getElementById("trackOrderInput");
    const trackLoader = document.getElementById("trackLoader");
    const trackErrorMsg = document.getElementById("trackErrorMsg");
    const trackErrorText = document.getElementById("trackErrorText");
    const trackResultContainer = document.getElementById("trackResultContainer");
    const custProfileStrip = document.getElementById("custProfileStrip");
    const profileCustName = document.getElementById("profileCustName");
    const profileCustPhone = document.getElementById("profileCustPhone");
    const phoneLookupSection = document.getElementById("phoneLookupSection");
    const btnSwitchPhone = document.getElementById("btnSwitchPhone");

    // Nav & Dropdown elements
    const navAccountWrapper = document.getElementById("navAccountWrapper");
    const navTrackCtaBtn = document.getElementById("navTrackCtaBtn");
    const navAccountLabel = document.getElementById("navAccountLabel");
    const dropdownUserName = document.getElementById("dropdownUserName");
    const dropdownUserPhone = document.getElementById("dropdownUserPhone");
    const navOrdersBadge = document.getElementById("navOrdersBadge");
    const mobileOrdersBadge = document.getElementById("mobileOrdersBadge");
    const menuOrdersCountTag = document.getElementById("menuOrdersCountTag");
    const menuMyOrdersBtn = document.getElementById("menuMyOrdersBtn");
    const menuSavedAddressBtn = document.getElementById("menuSavedAddressBtn");
    const menuSwitchPhoneBtn = document.getElementById("menuSwitchPhoneBtn");
    const savedAddressModal = document.getElementById("savedAddressModal");
    const closeSavedAddressModalBtn = document.getElementById("closeSavedAddressModalBtn");
    const closeSavedAddressBtn = document.getElementById("closeSavedAddressBtn");

    // Update Account Dropdown & Badge UI on Page Load
    async function updateCustomerNavbarUI() {
        const savedPhone = localStorage.getItem("rki_user_phone");
        const savedName = localStorage.getItem("rki_user_name");

        if (savedPhone) {
            if (dropdownUserName) dropdownUserName.textContent = savedName || "Valued Customer";
            if (dropdownUserPhone) dropdownUserPhone.textContent = savedPhone;
            if (navAccountLabel) navAccountLabel.textContent = savedName ? savedName.split(" ")[0] : "My Orders";
            if (profileCustName) profileCustName.textContent = savedName || "Valued Customer";
            if (profileCustPhone) profileCustPhone.textContent = savedPhone;

            // Fetch active orders count in background
            try {
                const res = await fetch(`/api/orders/track?q=${encodeURIComponent(savedPhone)}`);
                if (res.ok) {
                    const data = await res.json();
                    const count = data.orders ? data.orders.length : 0;
                    if (count > 0) {
                        if (navOrdersBadge) {
                            navOrdersBadge.textContent = count;
                            navOrdersBadge.style.display = "inline-block";
                        }
                        if (mobileOrdersBadge) {
                            mobileOrdersBadge.textContent = count;
                            mobileOrdersBadge.style.display = "inline-block";
                        }
                        if (menuOrdersCountTag) {
                            menuOrdersCountTag.textContent = `${count} Orders`;
                            menuOrdersCountTag.style.display = "inline-block";
                        }
                    }
                }
            } catch (e) {
                // Ignore silent background network errors
            }
        } else {
            if (dropdownUserName) dropdownUserName.textContent = "Guest Customer";
            if (dropdownUserPhone) dropdownUserPhone.textContent = "No phone linked";
            if (navAccountLabel) navAccountLabel.textContent = "My Orders";
            if (navOrdersBadge) navOrdersBadge.style.display = "none";
            if (mobileOrdersBadge) mobileOrdersBadge.style.display = "none";
            if (menuOrdersCountTag) menuOrdersCountTag.style.display = "none";
        }
    }

    // Call on load
    updateCustomerNavbarUI();

    // Attach Click Handlers to all "My Orders" buttons
    const myOrdersTriggers = [
        document.getElementById("navTrackOrderLink"),
        document.getElementById("mobileTrackOrderBtn"),
        document.getElementById("topTrackLink"),
        menuMyOrdersBtn
    ];

    myOrdersTriggers.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                if (navLinks && navLinks.classList.contains("mobile-open")) {
                    navLinks.classList.remove("mobile-open");
                }
                openTrackOrderModal();
            });
        }
    });

    // Desktop Account Button click
    if (navTrackCtaBtn) {
        navTrackCtaBtn.addEventListener("click", (e) => {
            // On desktop, click opens modal directly or toggles dropdown
            if (window.innerWidth <= 768) {
                e.preventDefault();
                openTrackOrderModal();
            } else {
                openTrackOrderModal();
            }
        });
    }

    // Switch / Enter Mobile No. Button handlers
    if (btnSwitchPhone) {
        btnSwitchPhone.addEventListener("click", () => {
            if (phoneLookupSection) {
                phoneLookupSection.style.display = phoneLookupSection.style.display === "none" ? "block" : "none";
                if (phoneLookupSection.style.display === "block" && trackOrderInput) {
                    trackOrderInput.focus();
                }
            }
        });
    }

    if (menuSwitchPhoneBtn) {
        menuSwitchPhoneBtn.addEventListener("click", () => {
            openTrackOrderModal();
            if (phoneLookupSection) {
                phoneLookupSection.style.display = "block";
                if (trackOrderInput) trackOrderInput.focus();
            }
        });
    }

    // Saved Delivery Address modal handlers
    if (menuSavedAddressBtn) {
        menuSavedAddressBtn.addEventListener("click", () => {
            const savedName = localStorage.getItem("rki_user_name") || "No name saved";
            const savedPhone = localStorage.getItem("rki_user_phone") || "No phone linked";
            const savedAddr = localStorage.getItem("rki_user_address") || "No address saved yet. Address will be saved after placing your first order.";
            const savedCity = localStorage.getItem("rki_user_city") || "Kathmandu, Nepal";

            const nameEl = document.getElementById("savedAddrName");
            const phoneEl = document.getElementById("savedAddrPhone");
            const addrEl = document.getElementById("savedAddrText");
            const cityEl = document.getElementById("savedAddrCity");

            if (nameEl) nameEl.textContent = savedName;
            if (phoneEl) phoneEl.textContent = savedPhone;
            if (addrEl) addrEl.textContent = savedAddr;
            if (cityEl) cityEl.textContent = savedCity;

            if (savedAddressModal) {
                savedAddressModal.classList.add("active");
                document.body.style.overflow = "hidden";
            }
        });
    }

    if (closeSavedAddressModalBtn) {
        closeSavedAddressModalBtn.addEventListener("click", () => {
            if (savedAddressModal) savedAddressModal.classList.remove("active");
            document.body.style.overflow = "auto";
        });
    }

    if (closeSavedAddressBtn) {
        closeSavedAddressBtn.addEventListener("click", () => {
            if (savedAddressModal) savedAddressModal.classList.remove("active");
            document.body.style.overflow = "auto";
        });
    }

    if (savedAddressModal) {
        savedAddressModal.addEventListener("click", (e) => {
            if (e.target === savedAddressModal) {
                savedAddressModal.classList.remove("active");
                document.body.style.overflow = "auto";
            }
        });
    }

    if (closeTrackModalBtn) {
        closeTrackModalBtn.addEventListener("click", closeTrackOrderModal);
    }

    if (trackOrderModal) {
        trackOrderModal.addEventListener("click", (e) => {
            if (e.target === trackOrderModal) closeTrackOrderModal();
        });
    }

    // Auto open if URL has #track or #orders
    if (window.location.hash === "#track" || window.location.hash === "#orders") {
        setTimeout(() => openTrackOrderModal(), 400);
    }

    function openTrackOrderModal(initialQuery = "") {
        if (!trackOrderModal) return;

        trackErrorMsg.style.display = "none";
        trackResultContainer.style.display = "none";
        trackLoader.style.display = "none";

        const savedPhone = localStorage.getItem("rki_user_phone");
        const targetQuery = initialQuery || savedPhone || "";

        if (savedPhone) {
            if (custProfileStrip) custProfileStrip.style.display = "flex";
            if (phoneLookupSection) phoneLookupSection.style.display = "none";
            if (profileCustName) profileCustName.textContent = localStorage.getItem("rki_user_name") || "Valued Customer";
            if (profileCustPhone) profileCustPhone.textContent = savedPhone;
        } else {
            if (custProfileStrip) custProfileStrip.style.display = "none";
            if (phoneLookupSection) phoneLookupSection.style.display = "block";
        }

        trackOrderModal.classList.add("active");
        document.body.style.overflow = "hidden";

        if (targetQuery) {
            trackOrderInput.value = targetQuery;
            performOrderTracking(targetQuery);
        } else {
            trackOrderInput.focus();
        }
    }

    function closeTrackOrderModal() {
        if (!trackOrderModal) return;
        trackOrderModal.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    if (trackOrderForm) {
        trackOrderForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const q = trackOrderInput.value.trim();
            if (q) performOrderTracking(q);
        });
    }

    async function performOrderTracking(query) {
        trackLoader.style.display = "block";
        trackErrorMsg.style.display = "none";
        trackResultContainer.style.display = "none";
        trackResultContainer.innerHTML = "";

        let matchedOrders = [];

        // 1. Try Backend API first
        try {
            const res = await fetch(`/api/orders/track?q=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                if (data.orders && data.orders.length > 0) {
                    matchedOrders = data.orders;
                }
            }
        } catch (err) {
            console.log("Backend offline, checking localStorage for tracking fallback:", err);
        }

        // 2. Fallback to LocalStorage if needed
        if (matchedOrders.length === 0) {
            const localOrders = Storage.getOrders();
            const cleanQ = query.toLowerCase().replace(/[^a-z0-9]/g, "");
            matchedOrders = localOrders.filter(o => {
                const cleanId = (o.orderId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                const cleanPhone = (o.customerPhone || "").replace(/[^0-9]/g, "");
                return (cleanId && (cleanId === cleanQ || cleanId.includes(cleanQ))) ||
                       (cleanPhone && (cleanPhone.endsWith(cleanQ) || cleanPhone.includes(cleanQ)));
            });
        }

        trackLoader.style.display = "none";

        if (matchedOrders.length === 0) {
            trackErrorText.textContent = `No order found for "${escapeHtml(query)}". Please enter the 10-digit mobile number used while placing the order.`;
            trackErrorMsg.style.display = "block";
            if (phoneLookupSection) phoneLookupSection.style.display = "block";
            return;
        }

        // Save customer profile automatically upon finding orders (Flipkart memory)
        const latestOrder = matchedOrders[0];
        if (latestOrder.customerPhone) {
            localStorage.setItem("rki_user_phone", latestOrder.customerPhone);
            if (latestOrder.customerName) localStorage.setItem("rki_user_name", latestOrder.customerName);
            if (latestOrder.customerAddress) localStorage.setItem("rki_user_address", latestOrder.customerAddress);
            if (latestOrder.customerCity) localStorage.setItem("rki_user_city", latestOrder.customerCity);

            if (custProfileStrip) custProfileStrip.style.display = "flex";
            if (profileCustName) profileCustName.textContent = latestOrder.customerName || "Valued Customer";
            if (profileCustPhone) profileCustPhone.textContent = latestOrder.customerPhone;
            if (phoneLookupSection) phoneLookupSection.style.display = "none";

            updateCustomerNavbarUI();
        }

        renderTrackResults(matchedOrders);
    }

    function renderTrackResults(ordersList) {
        trackResultContainer.innerHTML = ordersList.map(order => {
            const status = order.status || "Pending";
            let statusPillClass = "status-pill-pending";
            let statusBadgeText = "Pending Verification / पुष्टि प्रक्रिया में";
            let statusIcon = "fa-clock";
            let stepIndex = 1; // 1: Placed, 2: Confirmed, 3: In Workshop, 4: Delivered
            let progressWidth = "15%";
            let noteText = "Namaste! Aapka order receive ho gaya hai. Humare master craftsman Ram Keval ji aapse call par baat karke order details aur measurements confirm karenge.";

            if (status === "Confirmed") {
                statusPillClass = "status-pill-confirmed";
                statusBadgeText = "Order Confirmed / ऑर्डर कन्फर्म";
                statusIcon = "fa-circle-check";
                stepIndex = 2;
                progressWidth = "48%";
                noteText = "Aapka order confirm ho chuka hai! Seasoned solid wood select karke workshop schedule me assign kar diya gaya hai.";
            } else if (status === "In Production") {
                statusPillClass = "status-pill-production";
                statusBadgeText = "In Production / वर्कशॉप में निर्माण जारी";
                statusIcon = "fa-hammer";
                stepIndex = 3;
                progressWidth = "78%";
                noteText = "Aapka furniture humare master karigar workshop me pure solid wood se cutting, assembly aur hand-polishing kar rahe hain.";
            } else if (status === "Delivered") {
                statusPillClass = "status-pill-delivered";
                statusBadgeText = "Delivered / सुरक्षित डिलीवर हो चुका";
                statusIcon = "fa-box-circle-check";
                stepIndex = 4;
                progressWidth = "100%";
                noteText = "Aapka furniture safaltapoorvak deliver ho chuka hai. Ram Keval Interior par bharosa karne ke liye dhanyawaad!";
            }

            const step1Done = stepIndex >= 1 ? "done" : "";
            const step2Done = stepIndex >= 2 ? "done" : "";
            const step3Done = stepIndex >= 3 ? "done" : "";
            const step4Done = stepIndex >= 4 ? "done" : "";

            const step1Active = stepIndex === 1 ? "active" : "";
            const step2Active = stepIndex === 2 ? "active" : "";
            const step3Active = stepIndex === 3 ? "active" : "";
            const step4Active = stepIndex === 4 ? "active" : "";

            // Find image for item
            const itemPhoto = order.furnitureImage || 
                (products.find(p => p.id === order.furnitureId || p.title === order.furnitureTitle)?.image) || 
                '';

            const waInquiry = encodeURIComponent(
                `Namaste Ram Keval ji, I am viewing my Order #${order.orderId} for "${order.furnitureTitle}". Current status: ${status}. Please provide an update.`
            );
            const waInquiryLink = `https://wa.me/${settings.whatsapp}?text=${waInquiry}`;

            return `
                <div class="track-order-card">
                    <div class="track-order-header">
                        <div>
                            <span class="track-order-id-badge">#${escapeHtml(order.orderId)}</span>
                            <div style="font-size: 0.76rem; color: #888; margin-top: 4px;">
                                <i class="fa-regular fa-calendar-check"></i> Booked on: ${escapeHtml(order.date || 'Recently')}
                            </div>
                        </div>
                        <div class="track-order-status-pill ${statusPillClass}">
                            <i class="fa-solid ${statusIcon}"></i>
                            <span>${statusBadgeText}</span>
                        </div>
                    </div>

                    <!-- 4-Step Stepped Progress Timeline -->
                    <div class="track-stepper">
                        <div class="track-stepper-progress" style="width: ${progressWidth};"></div>

                        <div class="track-step ${step1Done} ${step1Active}">
                            <div class="step-node"><i class="fa-solid fa-receipt"></i></div>
                            <span class="step-title">Order Placed</span>
                            <span class="step-desc">Booked Online</span>
                        </div>

                        <div class="track-step ${step2Done} ${step2Active}">
                            <div class="step-node"><i class="fa-solid fa-clipboard-check"></i></div>
                            <span class="step-title">Confirmed</span>
                            <span class="step-desc">Call Verified</span>
                        </div>

                        <div class="track-step ${step3Done} ${step3Active}">
                            <div class="step-node"><i class="fa-solid fa-hammer"></i></div>
                            <span class="step-title">In Workshop</span>
                            <span class="step-desc">Crafting & Polish</span>
                        </div>

                        <div class="track-step ${step4Done} ${step4Active}">
                            <div class="step-node"><i class="fa-solid fa-truck-fast"></i></div>
                            <span class="step-title">Delivered</span>
                            <span class="step-desc">At Doorstep</span>
                        </div>
                    </div>

                    <!-- Craftsman Real-Time Update Note -->
                    <div class="track-craftsman-note">
                        <div style="font-weight: 700; color: #8b4513; margin-bottom: 2px;">
                            <i class="fa-solid fa-user-gear"></i> Master Craftsman Update:
                        </div>
                        <div>${noteText}</div>
                    </div>

                    <!-- Item Details Summary with Real Furniture Thumbnail -->
                    <div class="track-item-details">
                        <div class="fk-order-thumb-wrap">
                            ${itemPhoto 
                                ? `<img src="${escapeHtml(itemPhoto)}" class="fk-order-thumb-img" alt="${escapeHtml(order.furnitureTitle)}">` 
                                : `<i class="fa-solid fa-couch fk-order-thumb-icon"></i>`
                            }
                        </div>
                        <div class="track-item-info" style="flex: 1;">
                            <h5 style="font-size: 1rem; margin-bottom: 4px; color: #2b170c;">${escapeHtml(order.furnitureTitle)}</h5>
                            <p style="margin-bottom: 4px;">
                                <strong>Quantity:</strong> ${order.quantity || 1} • 
                                <strong>Total:</strong> <span style="color: var(--primary); font-weight: 800;">NPR रू ${(Math.round(Number(order.totalAmount || order.furniturePrice || 0) * NPR_PER_INR)).toLocaleString("en-IN")}</span> 
                                <span style="font-size: 0.78rem; color: #888;">(≈ ₹ ${Number(order.totalAmount || order.furniturePrice || 0).toLocaleString("en-IN")} INR)</span>
                            </p>
                            <p style="font-size: 0.78rem; color: #666; line-height: 1.4;">
                                <i class="fa-solid fa-location-dot" style="color: #e65100;"></i> <strong>Delivery Address:</strong> ${escapeHtml(order.customerAddress || 'Customer Address')}, ${escapeHtml(order.customerCity || '')}
                            </p>
                        </div>
                    </div>

                    <!-- Direct Actions (WhatsApp, Workshop Call & Print) -->
                    <div class="track-help-actions">
                        <a href="${waInquiryLink}" target="_blank" class="btn btn-primary" style="background: #25d366; border-color: #25d366;">
                            <i class="fa-brands fa-whatsapp"></i> Chat on WhatsApp
                        </a>
                        <a href="tel:+9779823471413" class="btn btn-outline" style="border-color: #2e7d32; color: #2e7d32;">
                            <i class="fa-solid fa-phone"></i> Call Workshop
                        </a>
                        <button type="button" class="btn btn-outline" onclick="window.print()" style="font-size: 0.82rem;">
                            <i class="fa-solid fa-print"></i> Print Slip
                        </button>
                    </div>
                </div>
            `;
        }).join("");

        trackResultContainer.style.display = "block";
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
