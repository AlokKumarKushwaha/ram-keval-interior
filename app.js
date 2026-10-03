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
        orderQty.value = 1;

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

            // Save last order ID to localStorage for quick tracking
            localStorage.setItem("rki_last_order_id", generatedOrderId);

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
            const lastId = localStorage.getItem("rki_last_order_id") || successOrderIdDisplay.textContent;
            openTrackOrderModal(lastId);
        });
    }

    // -------------------------------------------------------------
    // CUSTOMER ORDER TRACKING CONTROLLER
    // -------------------------------------------------------------
    const trackOrderModal = document.getElementById("trackOrderModal");
    const closeTrackModalBtn = document.getElementById("closeTrackModalBtn");
    const trackOrderForm = document.getElementById("trackOrderForm");
    const trackOrderInput = document.getElementById("trackOrderInput");
    const recentOrderQuickBox = document.getElementById("recentOrderQuickBox");
    const recentOrderIdTag = document.getElementById("recentOrderIdTag");
    const quickTrackRecentBtn = document.getElementById("quickTrackRecentBtn");
    const trackLoader = document.getElementById("trackLoader");
    const trackErrorMsg = document.getElementById("trackErrorMsg");
    const trackErrorText = document.getElementById("trackErrorText");
    const trackResultContainer = document.getElementById("trackResultContainer");

    const trackNavButtons = [
        document.getElementById("navTrackOrderLink"),
        document.getElementById("navTrackCtaBtn"),
        document.getElementById("mobileTrackOrderBtn"),
        document.getElementById("topTrackLink")
    ];

    trackNavButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                // Close mobile menu drawer if open
                if (navLinks && navLinks.classList.contains("mobile-open")) {
                    navLinks.classList.remove("mobile-open");
                }
                openTrackOrderModal();
            });
        }
    });

    if (closeTrackModalBtn) {
        closeTrackModalBtn.addEventListener("click", closeTrackOrderModal);
    }

    if (trackOrderModal) {
        trackOrderModal.addEventListener("click", (e) => {
            if (e.target === trackOrderModal) closeTrackOrderModal();
        });
    }

    // Auto open if URL has #track
    if (window.location.hash === "#track") {
        setTimeout(() => openTrackOrderModal(), 400);
    }

    function openTrackOrderModal(initialQuery = "") {
        if (!trackOrderModal) return;

        // Check recent order in localStorage
        const recentId = localStorage.getItem("rki_last_order_id");
        if (recentId && recentOrderQuickBox && recentOrderIdTag) {
            recentOrderIdTag.textContent = recentId;
            recentOrderQuickBox.style.display = "flex";
        } else if (recentOrderQuickBox) {
            recentOrderQuickBox.style.display = "none";
        }

        trackErrorMsg.style.display = "none";
        trackResultContainer.style.display = "none";
        trackLoader.style.display = "none";

        trackOrderModal.classList.add("active");
        document.body.style.overflow = "hidden";

        if (initialQuery) {
            trackOrderInput.value = initialQuery;
            performOrderTracking(initialQuery);
        } else {
            trackOrderInput.focus();
        }
    }

    function closeTrackOrderModal() {
        if (!trackOrderModal) return;
        trackOrderModal.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    if (quickTrackRecentBtn) {
        quickTrackRecentBtn.addEventListener("click", () => {
            const recentId = localStorage.getItem("rki_last_order_id");
            if (recentId) {
                trackOrderInput.value = recentId;
                performOrderTracking(recentId);
            }
        });
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
            trackErrorText.textContent = `No order found for "${escapeHtml(query)}". Please verify your Order ID (e.g. RKI-1001) or mobile number.`;
            trackErrorMsg.style.display = "block";
            return;
        }

        renderTrackResults(matchedOrders);
    }

    function renderTrackResults(ordersList) {
        trackResultContainer.innerHTML = ordersList.map(order => {
            const status = order.status || "Pending";
            let statusPillClass = "status-pill-pending";
            let statusBadgeText = "Pending Verification / पुष्टि प्रक्रिया में";
            let statusIcon = "fa-clock";
            let stepIndex = 1; // 1: Placed, 2: Confirmed, 3: In Production, 4: Delivered
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
            const step2Done = stepIndex >= 2 ? "done" : (stepIndex === 1 ? "" : "");
            const step3Done = stepIndex >= 3 ? "done" : "";
            const step4Done = stepIndex >= 4 ? "done" : "";

            const step1Active = stepIndex === 1 ? "active" : "";
            const step2Active = stepIndex === 2 ? "active" : "";
            const step3Active = stepIndex === 3 ? "active" : "";
            const step4Active = stepIndex === 4 ? "active" : "";

            const waInquiry = encodeURIComponent(
                `Namaste Ram Keval ji, I am tracking my Order #${order.orderId} for "${order.furnitureTitle}". Current status: ${status}. Please provide an update.`
            );
            const waInquiryLink = `https://wa.me/${settings.whatsapp}?text=${waInquiry}`;

            return `
                <div class="track-order-card">
                    <div class="track-order-header">
                        <div>
                            <span class="track-order-id-badge">#${escapeHtml(order.orderId)}</span>
                            <div style="font-size: 0.76rem; color: #888; margin-top: 4px;">Booked on: ${escapeHtml(order.date || 'Recently')}</div>
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
                            <div class="step-node"><i class="fa-solid fa-screwdriver-wrench"></i></div>
                            <span class="step-title">In Production</span>
                            <span class="step-desc">Workshop Crafting</span>
                        </div>

                        <div class="track-step ${step4Done} ${step4Active}">
                            <div class="step-node"><i class="fa-solid fa-truck"></i></div>
                            <span class="step-title">Delivered</span>
                            <span class="step-desc">To Your Home</span>
                        </div>
                    </div>

                    <!-- Craftsman Real-Time Update Note -->
                    <div class="track-craftsman-note">
                        <div style="font-weight: 700; color: #8b4513; margin-bottom: 2px;">
                            <i class="fa-solid fa-user-gear"></i> Master Craftsman Update:
                        </div>
                        <div>${noteText}</div>
                    </div>

                    <!-- Item Details Summary -->
                    <div class="track-item-details">
                        <div style="font-size: 1.8rem; color: var(--primary);">
                            <i class="fa-solid fa-couch"></i>
                        </div>
                        <div class="track-item-info" style="flex: 1;">
                            <h5>${escapeHtml(order.furnitureTitle)}</h5>
                            <p><strong>Quantity:</strong> ${order.quantity || 1} • <strong>Total:</strong> NPR रू ${(Math.round(Number(order.totalAmount || order.furniturePrice || 0) * NPR_PER_INR)).toLocaleString("en-IN")} <span style="font-size: 0.78rem; color: #888;">(≈ ₹ ${Number(order.totalAmount || order.furniturePrice || 0).toLocaleString("en-IN")} INR)</span></p>
                            <p style="font-size: 0.76rem; color: #777;">
                                <i class="fa-solid fa-location-dot"></i> Delivery to: ${escapeHtml(order.customerCity || '')} (${escapeHtml(order.customerAddress || 'Customer Address')})
                            </p>
                        </div>
                    </div>

                    <!-- Direct Actions -->
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
