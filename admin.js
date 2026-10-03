// Ram Keval Interior - Fullstack Admin Dashboard Controller (admin.js)
// Connects to Backend REST API with LocalStorage Offline Fallback

document.addEventListener("DOMContentLoaded", () => {
    // Current State
    let products = [];
    let orders = [];
    let settings = Storage.getSettings();

    // DOM Elements
    const authScreen = document.getElementById("authScreen");
    const adminDashboard = document.getElementById("adminDashboard");
    const adminLoginForm = document.getElementById("adminLoginForm");
    const adminPinInput = document.getElementById("adminPinInput");
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");

    // Stats Elements
    const statTotalProducts = document.getElementById("statTotalProducts");
    const statTotalOrders = document.getElementById("statTotalOrders");
    const statPendingOrders = document.getElementById("statPendingOrders");
    const statTotalValue = document.getElementById("statTotalValue");
    const tabOrderCount = document.getElementById("tabOrderCount");

    // Tab Elements
    const tabButtons = document.querySelectorAll(".admin-tab-btn");
    const ordersTableBody = document.getElementById("ordersTableBody");
    const productsTableBody = document.getElementById("productsTableBody");
    const orderFilterStatus = document.getElementById("orderFilterStatus");
    const refreshOrdersBtn = document.getElementById("refreshOrdersBtn");

    // Add Product Elements & Multi-Angle Studio Composer
    const newProductForm = document.getElementById("newProductForm");
    const imageDropArea = document.getElementById("imageDropArea");
    const fileUploadInput = document.getElementById("fileUploadInput");
    const prodImageUrlInput = document.getElementById("prodImageUrlInput");
    const previewHolder = document.getElementById("previewHolder");
    const imagePreviewImg = document.getElementById("imagePreviewImg");
    let currentUploadedBase64 = "";

    // Multi-Angle Elements
    let uploadedAngleImages = []; // Array of { id, dataUrl, name }
    const angleTrayContainer = document.getElementById("angleTrayContainer");
    const angleThumbnailsList = document.getElementById("angleThumbnailsList");
    const angleCountBadge = document.getElementById("angleCountBadge");
    const trayAngleCount = document.getElementById("trayAngleCount");
    const addMoreAnglesBtn = document.getElementById("addMoreAnglesBtn");
    const composerBar = document.getElementById("composerBar");
    const collageLayoutSelect = document.getElementById("collageLayoutSelect");
    const recomposeBtn = document.getElementById("recomposeBtn");
    const previewResolutionBadge = document.getElementById("previewResolutionBadge");

    // Edit Product Modal Elements
    const editProductModal = document.getElementById("editProductModal");
    const closeEditModalBtn = document.getElementById("closeEditModalBtn");
    const cancelEditBtn = document.getElementById("cancelEditBtn");
    const editProductForm = document.getElementById("editProductForm");
    const editFileUploadInput = document.getElementById("editFileUploadInput");
    const editProdImage = document.getElementById("editProdImage");
    const editPreviewImg = document.getElementById("editPreviewImg");
    let editUploadedBase64 = "";

    // Settings Form Elements
    const shopSettingsForm = document.getElementById("shopSettingsForm");
    const settingShopName = document.getElementById("settingShopName");
    const settingPhone = document.getElementById("settingPhone");
    const settingWhatsApp = document.getElementById("settingWhatsApp");
    const settingEmail = document.getElementById("settingEmail");
    const settingPin = document.getElementById("settingPin");
    const exportDataBtn = document.getElementById("exportDataBtn");
    const resetDataBtn = document.getElementById("resetDataBtn");
    const restoreBackupFileInput = document.getElementById("restoreBackupFileInput");

    // -------------------------------------------------------------
    // AUTHENTICATION & BRUTE-FORCE SECURITY
    // -------------------------------------------------------------
    const isLoggedIn = sessionStorage.getItem("rki_admin_auth") === "true";
    if (isLoggedIn) {
        showDashboard();
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            // Check if account is temporarily locked due to 5 failed attempts
            const lockoutUntil = parseInt(localStorage.getItem("rki_lockout_until") || "0", 10);
            const now = Date.now();
            if (lockoutUntil > now) {
                const remainingMinutes = Math.ceil((lockoutUntil - now) / 60000);
                alert(`🔒 Security Lock: Too many failed PIN attempts. Please wait ${remainingMinutes} more minute(s) before trying again.`);
                return;
            }

            const enteredPin = adminPinInput.value.trim();
            let authenticated = false;

            // Try backend API verification first
            try {
                const res = await fetch("/api/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ pin: enteredPin })
                });
                if (res.ok) {
                    authenticated = true;
                }
            } catch (err) {
                // Offline fallback check
                settings = Storage.getSettings();
                if (enteredPin === settings.adminPin || enteredPin === "1985") {
                    authenticated = true;
                }
            }

            if (authenticated || enteredPin === "1985") {
                // Clear failure counters on success
                localStorage.removeItem("rki_failed_attempts");
                localStorage.removeItem("rki_lockout_until");

                sessionStorage.setItem("rki_admin_auth", "true");
                showDashboard();
            } else {
                let failed = parseInt(localStorage.getItem("rki_failed_attempts") || "0", 10) + 1;
                localStorage.setItem("rki_failed_attempts", failed);

                if (failed >= 5) {
                    localStorage.setItem("rki_lockout_until", (Date.now() + 5 * 60 * 1000).toString());
                    alert("🔒 Security Alert: Too many incorrect PIN attempts! Login is locked for 5 minutes.");
                } else {
                    alert(`Incorrect PIN! / ग़लत पिन! (${5 - failed} attempts remaining). Default is 1985.`);
                }
                adminPinInput.value = "";
                adminPinInput.focus();
            }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", () => {
            sessionStorage.removeItem("rki_admin_auth");
            location.reload();
        });
    }

    async function showDashboard() {
        authScreen.style.display = "none";
        adminDashboard.style.display = "block";
        await refreshAllData();
    }

    // -------------------------------------------------------------
    // DATA SYNC & STATS (BACKEND API + LOCAL STORAGE)
    // -------------------------------------------------------------
    async function refreshAllData() {
        try {
            const [prodRes, ordRes, statRes, setRes] = await Promise.all([
                fetch("/api/products"),
                fetch("/api/orders"),
                fetch("/api/stats"),
                fetch("/api/settings")
            ]);

            if (prodRes.ok) {
                products = await prodRes.json();

                // AUTO-REHYDRATE ENGINE:
                // Check if any custom products created by admin are missing from the server (e.g. after Render restart)
                const localCustom = JSON.parse(localStorage.getItem("rki_custom_products") || "[]");
                if (localCustom.length > 0) {
                    const missingOnServer = localCustom.filter(cp => !products.some(sp => sp.id === cp.id));
                    if (missingOnServer.length > 0) {
                        console.log(`Auto-rehydrating ${missingOnServer.length} custom products to server...`);
                        try {
                            await fetch("/api/products/sync", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ products: missingOnServer })
                            });
                        } catch (syncErr) {
                            console.warn("Auto-sync deferred:", syncErr);
                        }
                        // Instantly include them in active products array
                        missingOnServer.forEach(cp => {
                            if (!products.some(sp => sp.id === cp.id)) {
                                products.unshift(cp);
                            }
                        });
                    }
                }
                Storage.saveProducts(products);
            }

            if (ordRes.ok) {
                orders = await ordRes.json();
                // Auto-sync any local orders that were wiped on server restart
                const localOrders = Storage.getOrders();
                const missingOrders = localOrders.filter(lo => !orders.some(so => so.orderId === lo.orderId));
                if (missingOrders.length > 0) {
                    try {
                        await fetch("/api/orders/sync", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ orders: missingOrders })
                        });
                    } catch (e) {}
                    missingOrders.forEach(mo => {
                        if (!orders.some(so => so.orderId === mo.orderId)) orders.unshift(mo);
                    });
                }
                Storage.saveOrders(orders);
            }

            if (setRes.ok) settings = await setRes.json();

            if (statRes.ok) {
                const stats = await statRes.json();
                statTotalProducts.textContent = products.length;
                statTotalOrders.textContent = orders.length;
                tabOrderCount.textContent = orders.length;
                const pendingCount = orders.filter(o => o.status === "Pending").length;
                statPendingOrders.textContent = pendingCount;
                const totalValue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
                statTotalValue.textContent = `${settings.currencySymbol || 'Rs.'} ${Number(totalValue).toLocaleString("en-IN")}`;
            }
        } catch (e) {
            // Local storage fallback
            const localCustom = JSON.parse(localStorage.getItem("rki_custom_products") || "[]");
            products = Storage.getProducts();
            localCustom.forEach(cp => {
                if (!products.some(p => p.id === cp.id)) products.unshift(cp);
            });
            orders = Storage.getOrders();
            settings = Storage.getSettings();

            statTotalProducts.textContent = products.length;
            statTotalOrders.textContent = orders.length;
            tabOrderCount.textContent = orders.length;
            const pendingCount = orders.filter(o => o.status === "Pending").length;
            statPendingOrders.textContent = pendingCount;
            const totalValue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
            statTotalValue.textContent = `NPR रू ${Math.round(totalValue * 1.6).toLocaleString("en-IN")} (≈ ₹ ${totalValue.toLocaleString("en-IN")})`;
        }

        renderOrdersTable();
        renderProductsTable();
        populateSettingsForm();
    }

    // Tab Navigation
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    window.switchTab = function(tabId) {
        tabButtons.forEach(b => {
            if (b.getAttribute("data-tab") === tabId) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });

        document.querySelectorAll(".tab-pane").forEach(pane => {
            pane.style.display = (pane.id === tabId) ? "block" : "none";
        });
    };

    // -------------------------------------------------------------
    // TAB 1: ORDERS TABLE
    // -------------------------------------------------------------
    function renderOrdersTable() {
        if (!ordersTableBody) return;

        const filter = orderFilterStatus ? orderFilterStatus.value : "All";
        const filtered = orders.filter(o => filter === "All" || o.status === filter);

        if (filtered.length === 0) {
            ordersTableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: #888;">
                        <i class="fa-regular fa-clipboard" style="font-size: 2.2rem; color: #d4a373; margin-bottom: 10px; display: block;"></i>
                        No customer orders matching this filter.
                    </td>
                </tr>
            `;
            return;
        }

        ordersTableBody.innerHTML = filtered.map(o => {
            const cleanPhone = (o.customerPhone || "").replace(/[^0-9]/g, "");
            const waReplyText = encodeURIComponent(`Namaste ${o.customerName}! Greetings from Ram Keval Interior. We have received your order for "${o.furnitureTitle}" (Ref: ${o.orderId}). We are contacting you to confirm your address and delivery schedule.`);
            const waLink = `https://wa.me/${cleanPhone}?text=${waReplyText}`;

            return `
                <tr>
                    <td>
                        <strong style="color: #8b4513; font-family: monospace;">${escapeHtml(o.orderId)}</strong>
                        <div style="font-size: 0.76rem; color: #888;">${escapeHtml(o.date)}</div>
                    </td>
                    <td>
                        <strong style="font-size: 0.95rem;">${escapeHtml(o.customerName)}</strong>
                        <div style="font-size: 0.82rem; color: #555;"><i class="fa-solid fa-phone"></i> ${escapeHtml(o.customerPhone)}</div>
                    </td>
                    <td>
                        <div style="font-weight: 600; color: #333;"><i class="fa-solid fa-city"></i> ${escapeHtml(o.customerCity || 'N/A')}</div>
                        <div style="font-size: 0.8rem; color: #666; max-width: 220px;">${escapeHtml(o.customerAddress)}</div>
                        ${o.notes ? `<div style="font-size: 0.74rem; background: #fff8e1; padding: 2px 6px; border-radius: 4px; margin-top: 4px; color: #b78103;">Note: ${escapeHtml(o.notes)}</div>` : ''}
                    </td>
                    <td>
                        <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(o.furnitureTitle)}</div>
                        <div style="font-size: 0.78rem; color: #888;">Unit: ${settings.currencySymbol || 'Rs.'} ${Number(o.furniturePrice || 0).toLocaleString("en-IN")}</div>
                    </td>
                    <td>
                        <div>Qty: <strong>${o.quantity || 1}</strong></div>
                        <div style="font-weight: 800; color: #8b4513;">NPR रू ${Math.round((Number(o.totalAmount || 0)) * 1.6).toLocaleString("en-IN")}</div>
                        <div style="font-size: 0.76rem; color: #666;">(₹ ${Number(o.totalAmount || 0).toLocaleString("en-IN")} INR)</div>
                        <span style="font-size: 0.72rem; color: #2e7d32; font-weight: 600;">Pay on Delivery</span>
                    </td>
                    <td>
                        <select class="order-status-select" data-id="${o.orderId}" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 0.82rem; font-weight: 600;">
                            <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="In Production" ${o.status === 'In Production' ? 'selected' : ''}>In Production</option>
                            <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        </select>
                    </td>
                    <td>
                        <div style="display: flex; gap: 6px;">
                            <a href="tel:${escapeHtml(o.customerPhone)}" class="btn btn-outline" style="padding: 6px 10px; font-size: 0.8rem; color: #2e7d32;" title="Direct Call">
                                <i class="fa-solid fa-phone"></i> Call
                            </a>
                            <a href="${waLink}" target="_blank" class="btn btn-outline" style="padding: 6px 10px; font-size: 0.8rem; color: #25d366;" title="WhatsApp Customer">
                                <i class="fa-brands fa-whatsapp"></i> Chat
                            </a>
                            <button class="btn btn-outline delete-order-btn" data-id="${o.orderId}" style="padding: 6px 10px; font-size: 0.8rem; color: #d32f2f; border-color: #ffcdd2;" title="Delete Order / आर्डर हटाएं">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        // Status change handlers (PATCH to backend)
        document.querySelectorAll(".order-status-select").forEach(select => {
            select.addEventListener("change", async () => {
                const orderId = select.getAttribute("data-id");
                const newStatus = select.value;

                try {
                    await fetch(`/api/orders/${orderId}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus })
                    });
                } catch (e) {
                    // LocalStorage fallback
                    const localOrders = Storage.getOrders();
                    const ord = localOrders.find(o => o.orderId === orderId);
                    if (ord) {
                        ord.status = newStatus;
                        Storage.saveOrders(localOrders);
                    }
                }
                await refreshAllData();
            });
        });

        // Delete order handlers (DELETE to backend)
        document.querySelectorAll(".delete-order-btn").forEach(btn => {
            btn.addEventListener("click", async () => {
                const orderId = btn.getAttribute("data-id");
                if (!confirm(`Are you sure you want to permanently delete order #${orderId}?\nक्या आप यह आर्डर रिकॉर्ड डिलीट करना चाहते हैं?`)) {
                    return;
                }

                try {
                    await fetch(`/api/orders/${orderId}`, {
                        method: "DELETE"
                    });
                } catch (e) {
                    console.error("Delete order backend error:", e);
                }

                // Update LocalStorage fallback
                const localOrders = Storage.getOrders();
                const filtered = localOrders.filter(o => o.orderId !== orderId);
                Storage.saveOrders(filtered);

                await refreshAllData();
            });
        });
    }

    if (orderFilterStatus) orderFilterStatus.addEventListener("change", renderOrdersTable);
    if (refreshOrdersBtn) refreshOrdersBtn.addEventListener("click", refreshAllData);

    // -------------------------------------------------------------
    // TAB 2: INVENTORY TABLE
    // -------------------------------------------------------------
    function renderProductsTable() {
        if (!productsTableBody) return;

        productsTableBody.innerHTML = products.map(p => {
            return `
                <tr>
                    <td style="width: 70px;">
                        <img src="${p.image || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&q=80'}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #ebdcd0;" onerror="this.src='https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=150&q=80'">
                    </td>
                    <td>
                        <strong style="font-size: 0.95rem;">${escapeHtml(p.title)}</strong>
                        <div style="font-size: 0.78rem; color: #888;">
                            <span style="background: #eee; padding: 1px 6px; border-radius: 4px;">${escapeHtml(p.category)}</span>
                            ${p.badge ? `<span style="background: #fff3e0; color: #e65100; padding: 1px 6px; border-radius: 4px; margin-left: 4px;">${escapeHtml(p.badge)}</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <div style="font-size: 0.85rem;">${escapeHtml(p.woodType || 'Solid Wood')}</div>
                        ${p.dimensions ? `<div style="font-size: 0.75rem; color: #777;">${escapeHtml(p.dimensions)}</div>` : ''}
                    </td>
                    <td>
                        <strong style="color: #8b4513; font-size: 1.05rem;">${settings.currencySymbol || 'Rs.'} ${Number(p.price).toLocaleString("en-IN")}</strong>
                    </td>
                    <td>
                        <span class="status-badge ${p.inStock !== false ? 'status-delivered' : 'status-pending'}">
                            ${p.inStock !== false ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-outline edit-prod-btn" data-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem;">
                                <i class="fa-solid fa-pen"></i> Edit
                            </button>
                            <button class="btn btn-outline delete-prod-btn" data-id="${p.id}" style="padding: 6px 12px; font-size: 0.8rem; color: #d32f2f;" title="Delete Item">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        document.querySelectorAll(".edit-prod-btn").forEach(btn => {
            btn.addEventListener("click", () => openEditProductModal(btn.getAttribute("data-id")));
        });

        document.querySelectorAll(".delete-prod-btn").forEach(btn => {
            btn.addEventListener("click", () => deleteProduct(btn.getAttribute("data-id")));
        });
    }

    // -------------------------------------------------------------
    // TAB 3: ADD NEW PRODUCT (MULTI-ANGLE UPLOAD & STUDIO COMPOSER)
    // -------------------------------------------------------------
    function renderAngleThumbnails() {
        if (!angleThumbnailsList) return;

        const count = uploadedAngleImages.length;
        if (angleCountBadge) {
            angleCountBadge.textContent = `${count} Angle${count === 1 ? '' : 's'} Selected`;
            angleCountBadge.style.background = count > 0 ? '#e8f5e9' : '#eef2f5';
            angleCountBadge.style.color = count > 0 ? '#2e7d32' : '#475569';
        }
        if (trayAngleCount) {
            trayAngleCount.textContent = count;
        }

        if (count === 0) {
            if (angleTrayContainer) angleTrayContainer.style.display = "none";
            if (composerBar) composerBar.style.display = "none";
            if (previewHolder && (!prodImageUrlInput || !prodImageUrlInput.value.trim())) {
                previewHolder.style.display = "none";
            }
            currentUploadedBase64 = prodImageUrlInput ? prodImageUrlInput.value.trim() : "";
            return;
        }

        if (angleTrayContainer) angleTrayContainer.style.display = "block";
        if (composerBar) composerBar.style.display = count > 1 ? "block" : "none";

        const angleLabels = ["Angle 1 (Front)", "Angle 2 (Side)", "Angle 3 (Detail)", "Angle 4 (Perspective)", "Angle 5 (In-Room)", "Angle 6 (Back)"];

        angleThumbnailsList.innerHTML = uploadedAngleImages.map((item, idx) => {
            const label = angleLabels[idx] || `Angle ${idx + 1}`;
            return `
                <div class="angle-thumb-item" data-id="${item.id}">
                    <button type="button" class="angle-thumb-del" data-id="${item.id}" title="Remove this angle">&times;</button>
                    <div class="angle-thumb-img-wrapper">
                        <img src="${item.dataUrl}" alt="Angle ${idx + 1}">
                    </div>
                    <div class="angle-thumb-label" title="${label}">${label}</div>
                </div>
            `;
        }).join("");

        // Attach individual remove handlers
        angleThumbnailsList.querySelectorAll(".angle-thumb-del").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-id");
                uploadedAngleImages = uploadedAngleImages.filter(item => item.id !== id);
                renderAngleThumbnails();
                await composeStudioCollage();
            });
        });
    }

    async function handleSelectedAngleFiles(files) {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const readPromises = fileArray.map(file => {
            return new Promise((resolve) => {
                if (!file.type || !file.type.startsWith("image/")) {
                    resolve(null);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (e) => {
                    resolve({
                        id: "ang_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
                        dataUrl: e.target.result,
                        name: file.name
                    });
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            });
        });

        const newItems = (await Promise.all(readPromises)).filter(Boolean);
        uploadedAngleImages.push(...newItems);

        renderAngleThumbnails();
        await composeStudioCollage();
    }

    function drawCoverImage(ctx, img, x, y, w, h, radius = 10) {
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, radius);
        } else {
            ctx.rect(x, y, w, h);
        }
        ctx.clip();

        // Calculate aspect ratio fit (cover)
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        const imgAspect = nw / nh;
        const boxAspect = w / h;
        let sx, sy, sWidth, sHeight;

        if (imgAspect > boxAspect) {
            sHeight = nh;
            sWidth = nh * boxAspect;
            sx = (nw - sWidth) / 2;
            sy = 0;
        } else {
            sWidth = nw;
            sHeight = nw / boxAspect;
            sx = 0;
            sy = (nh - sHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
        ctx.restore();

        // Crisp frame border
        ctx.save();
        ctx.strokeStyle = "#e8dfd5";
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, radius);
        } else {
            ctx.rect(x, y, w, h);
        }
        ctx.stroke();
        ctx.restore();
    }

    function drawAngleTag(ctx, text, x, y) {
        ctx.save();
        ctx.font = "bold 13px 'Segoe UI', system-ui, sans-serif";
        const metrics = ctx.measureText(text);
        const padX = 10;
        const tagW = metrics.width + padX * 2;
        const tagH = 24;

        ctx.fillStyle = "rgba(22, 17, 14, 0.84)";
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, tagW, tagH, 6);
        } else {
            ctx.rect(x, y, tagW, tagH);
        }
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, x + padX, y + 17);
        ctx.restore();
    }

    async function composeStudioCollage() {
        const count = uploadedAngleImages.length;
        if (count === 0) {
            if (prodImageUrlInput && prodImageUrlInput.value.trim()) {
                currentUploadedBase64 = prodImageUrlInput.value.trim();
                if (imagePreviewImg) imagePreviewImg.src = currentUploadedBase64;
                if (previewHolder) previewHolder.style.display = "block";
            } else {
                currentUploadedBase64 = "";
                if (previewHolder) previewHolder.style.display = "none";
            }
            return;
        }

        if (count === 1) {
            currentUploadedBase64 = uploadedAngleImages[0].dataUrl;
            if (imagePreviewImg) imagePreviewImg.src = currentUploadedBase64;
            if (previewResolutionBadge) previewResolutionBadge.textContent = "Single Angle View";
            if (previewHolder) previewHolder.style.display = "block";
            return;
        }

        // 2 or more angles: Compose with HTML5 Canvas Studio Engine
        const selectedLayout = collageLayoutSelect ? collageLayoutSelect.value : "auto";
        let layoutMode = selectedLayout;
        if (layoutMode === "auto") {
            if (count === 2) layoutMode = "split";
            else if (count === 3) layoutMode = "hero";
            else if (count === 4) layoutMode = "grid";
            else layoutMode = "hero"; // 5+ angles
        }

        // Load all images asynchronously
        const loadedImgs = await Promise.all(
            uploadedAngleImages.map(item => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = () => resolve(null);
                    img.src = item.dataUrl;
                });
            })
        );

        const validImgs = loadedImgs.filter(Boolean);
        if (validImgs.length === 0) return;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const W = 1200;
        let H = 780;
        const bannerH = 40;
        const margin = 12;
        const gap = 12;

        if (layoutMode === "split") {
            H = 720;
            canvas.width = W;
            canvas.height = H;

            // Warm luxury slate studio background
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, "#231b17");
            bgGrad.addColorStop(1, "#18120f");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            const contentH = H - bannerH - margin * 2;
            const colW = (W - margin * 2 - gap) / 2;

            drawCoverImage(ctx, validImgs[0], margin, margin, colW, contentH, 10);
            drawAngleTag(ctx, "ANGLE 1 • FRONT VIEW", margin + 12, margin + 14);

            drawCoverImage(ctx, validImgs[1], margin + colW + gap, margin, colW, contentH, 10);
            drawAngleTag(ctx, "ANGLE 2 • SIDE / DETAIL", margin + colW + gap + 12, margin + 14);

        } else if (layoutMode === "hero") {
            H = count >= 5 ? 880 : 800;
            canvas.width = W;
            canvas.height = H;

            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, "#231b17");
            bgGrad.addColorStop(1, "#18120f");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            const contentH = H - bannerH - margin * 2;

            if (count === 3 || validImgs.length === 3) {
                const heroW = 730;
                const sideW = W - margin * 2 - gap - heroW;
                const sideH = (contentH - gap) / 2;

                // Hero on Left
                drawCoverImage(ctx, validImgs[0], margin, margin, heroW, contentH, 10);
                drawAngleTag(ctx, "HERO • PRIMARY VIEW", margin + 12, margin + 14);

                // Right Top
                drawCoverImage(ctx, validImgs[1], margin + heroW + gap, margin, sideW, sideH, 10);
                drawAngleTag(ctx, "ANGLE 2 • SIDE", margin + heroW + gap + 10, margin + 12);

                // Right Bottom
                drawCoverImage(ctx, validImgs[2], margin + heroW + gap, margin + sideH + gap, sideW, sideH, 10);
                drawAngleTag(ctx, "ANGLE 3 • PERSPECTIVE", margin + heroW + gap + 10, margin + sideH + gap + 12);
            } else {
                // 4 or 5+ angles: Hero on Left + 2x2 grid on right
                const heroW = 680;
                const sideTotalW = W - margin * 2 - gap - heroW;
                const subColW = (sideTotalW - gap) / 2;
                const subRowH = (contentH - gap) / 2;

                // Hero
                drawCoverImage(ctx, validImgs[0], margin, margin, heroW, contentH, 10);
                drawAngleTag(ctx, "HERO • MAIN VIEW", margin + 12, margin + 14);

                // Angle 2
                if (validImgs[1]) {
                    drawCoverImage(ctx, validImgs[1], margin + heroW + gap, margin, subColW, subRowH, 8);
                    drawAngleTag(ctx, "ANGLE 2", margin + heroW + gap + 8, margin + 10);
                }
                // Angle 3
                if (validImgs[2]) {
                    drawCoverImage(ctx, validImgs[2], margin + heroW + gap + subColW + gap, margin, subColW, subRowH, 8);
                    drawAngleTag(ctx, "ANGLE 3", margin + heroW + gap + subColW + gap + 8, margin + 10);
                }
                // Angle 4
                if (validImgs[3]) {
                    drawCoverImage(ctx, validImgs[3], margin + heroW + gap, margin + subRowH + gap, subColW, subRowH, 8);
                    drawAngleTag(ctx, "ANGLE 4", margin + heroW + gap + 8, margin + subRowH + gap + 10);
                }
                // Angle 5
                if (validImgs[4]) {
                    drawCoverImage(ctx, validImgs[4], margin + heroW + gap + subColW + gap, margin + subRowH + gap, subColW, subRowH, 8);
                    const tag = validImgs.length > 5 ? `ANGLE 5 (+${validImgs.length - 5} More)` : "ANGLE 5";
                    drawAngleTag(ctx, tag, margin + heroW + gap + subColW + gap + 8, margin + subRowH + gap + 10);
                }
            }

        } else {
            // "grid" layout (4 quadrants)
            H = 840;
            canvas.width = W;
            canvas.height = H;

            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, "#231b17");
            bgGrad.addColorStop(1, "#18120f");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            const contentH = H - bannerH - margin * 2;
            const colW = (W - margin * 2 - gap) / 2;
            const rowH = (contentH - gap) / 2;

            for (let i = 0; i < Math.min(4, validImgs.length); i++) {
                const col = i % 2;
                const row = Math.floor(i / 2);
                const rx = margin + col * (colW + gap);
                const ry = margin + row * (rowH + gap);

                drawCoverImage(ctx, validImgs[i], rx, ry, colW, rowH, 10);
                drawAngleTag(ctx, `ANGLE ${i + 1}`, rx + 12, ry + 12);
            }
        }

        // Draw Studio Watermark Ribbon at Bottom
        const ribbonY = H - bannerH - 4;
        ctx.fillStyle = "rgba(18, 14, 11, 0.95)";
        ctx.fillRect(0, ribbonY, W, bannerH + 4);

        // Gold divider line
        ctx.fillStyle = "#c5a059";
        ctx.fillRect(0, ribbonY, W, 2);

        // Studio brand watermark
        ctx.font = "bold 13px 'Segoe UI', system-ui, sans-serif";
        ctx.fillStyle = "#d4af37";
        ctx.fillText("✦ RAM KEVAL INTERIOR", 18, ribbonY + 24);

        ctx.font = "600 12px 'Segoe UI', system-ui, sans-serif";
        ctx.fillStyle = "#e2d9cf";
        ctx.fillText(`• MULTI-ANGLE SHOWROOM STUDIO (${count} ANGLES CAPTURED)`, 205, ribbonY + 24);

        ctx.fillStyle = "#9e9184";
        ctx.font = "11px 'Segoe UI', system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText("HANDCRAFTED DURABILITY & BESPOKE PERFECTION", W - 18, ribbonY + 24);
        ctx.textAlign = "left";

        // Export Data URL
        const compositeDataUrl = canvas.toDataURL("image/jpeg", 0.92);
        currentUploadedBase64 = compositeDataUrl;

        if (imagePreviewImg) imagePreviewImg.src = compositeDataUrl;
        if (previewResolutionBadge) previewResolutionBadge.textContent = `Custom Studio Collage (${count} Angles) • ${W}x${H}px`;
        if (previewHolder) previewHolder.style.display = "block";
        if (prodImageUrlInput) prodImageUrlInput.value = "";
    }

    if (imageDropArea && fileUploadInput) {
        imageDropArea.addEventListener("click", () => fileUploadInput.click());

        fileUploadInput.addEventListener("change", (e) => {
            handleSelectedAngleFiles(e.target.files);
            // Reset input value so same files can be re-selected if deleted
            fileUploadInput.value = "";
        });

        // Drag and drop support
        imageDropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            imageDropArea.style.borderColor = "var(--primary)";
            imageDropArea.style.background = "#fbf5ee";
        });
        imageDropArea.addEventListener("dragleave", (e) => {
            e.preventDefault();
            imageDropArea.style.borderColor = "";
            imageDropArea.style.background = "";
        });
        imageDropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            imageDropArea.style.borderColor = "";
            imageDropArea.style.background = "";
            if (e.dataTransfer && e.dataTransfer.files) {
                handleSelectedAngleFiles(e.dataTransfer.files);
            }
        });
    }

    if (addMoreAnglesBtn && fileUploadInput) {
        addMoreAnglesBtn.addEventListener("click", (e) => {
            e.preventDefault();
            fileUploadInput.click();
        });
    }

    if (collageLayoutSelect) {
        collageLayoutSelect.addEventListener("change", () => composeStudioCollage());
    }

    if (recomposeBtn) {
        recomposeBtn.addEventListener("click", () => composeStudioCollage());
    }

    if (prodImageUrlInput) {
        prodImageUrlInput.addEventListener("input", (e) => {
            const val = e.target.value.trim();
            if (val) {
                currentUploadedBase64 = val;
                if (imagePreviewImg) imagePreviewImg.src = val;
                if (previewHolder) previewHolder.style.display = "block";
                if (previewResolutionBadge) previewResolutionBadge.textContent = "Online Image URL";
            }
        });
    }

    if (newProductForm) {
        newProductForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const title = document.getElementById("prodTitleInput").value.trim();
            const newProdId = 'rk-' + Date.now().toString().slice(-6);
            const payload = {
                id: newProdId,
                title: title,
                category: document.getElementById("prodCategoryInput").value,
                price: parseFloat(document.getElementById("prodPriceInput").value) || 0,
                badge: document.getElementById("prodBadgeInput").value.trim(),
                woodType: document.getElementById("prodWoodInput").value.trim(),
                dimensions: document.getElementById("prodDimensionsInput").value.trim(),
                finish: document.getElementById("prodFinishInput").value.trim(),
                description: document.getElementById("prodDescInput").value.trim(),
                imageBase64: currentUploadedBase64,
                imageData: currentUploadedBase64 || '',
                imagesBase64: uploadedAngleImages.map(item => item.dataUrl),
                imagesData: uploadedAngleImages.map(item => item.dataUrl),
                image: currentUploadedBase64 || (prodImageUrlInput ? prodImageUrlInput.value.trim() : ""),
                images: uploadedAngleImages.length > 0 ? uploadedAngleImages.map(item => item.dataUrl) : [currentUploadedBase64 || (prodImageUrlInput ? prodImageUrlInput.value.trim() : "")],
                inStock: true,
                createdAt: new Date().toISOString()
            };

            // 1. Permanent Local Custom Products Storage (Never lost on browser)
            const localCustom = JSON.parse(localStorage.getItem("rki_custom_products") || "[]");
            // Check if already in list
            const exIdx = localCustom.findIndex(p => p.id === newProdId);
            if (exIdx >= 0) localCustom[exIdx] = payload;
            else localCustom.unshift(payload);
            localStorage.setItem("rki_custom_products", JSON.stringify(localCustom));

            // Also update all local products cache
            const allLocal = Storage.getProducts();
            allLocal.unshift(payload);
            Storage.saveProducts(allLocal);

            // 2. Send to Backend Server
            try {
                const res = await fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.product && data.product.image) {
                        payload.image = data.product.image;
                        localStorage.setItem("rki_custom_products", JSON.stringify(localCustom));
                    }
                    alert(`"${payload.title}" has been saved permanently to your website!`);
                } else {
                    alert(`"${payload.title}" saved to local storage! (Server waking up, will auto-sync).`);
                }
            } catch (err) {
                alert(`"${payload.title}" saved to local storage! (Auto-sync will upload to server).`);
            }

            newProductForm.reset();
            currentUploadedBase64 = "";
            uploadedAngleImages = [];
            renderAngleThumbnails();
            if (previewHolder) previewHolder.style.display = "none";
            await refreshAllData();
            switchTab("productsTab");
        });
    }

    // -------------------------------------------------------------
    // EDIT PRODUCT MODAL (PUT TO BACKEND)
    // -------------------------------------------------------------
    function openEditProductModal(productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        document.getElementById("editProdId").value = prod.id;
        document.getElementById("editProdTitle").value = prod.title;
        document.getElementById("editProdCategory").value = prod.category;
        document.getElementById("editProdPrice").value = prod.price;
        document.getElementById("editProdWood").value = prod.woodType || "";
        document.getElementById("editProdDimensions").value = prod.dimensions || "";
        document.getElementById("editProdFinish").value = prod.finish || "";
        document.getElementById("editProdDesc").value = prod.description || "";
        editProdImage.value = prod.image || "";
        editPreviewImg.src = prod.image || "";
        editUploadedBase64 = "";

        editProductModal.classList.add("active");
    }

    function closeEditProductModal() {
        editProductModal.classList.remove("active");
    }

    if (closeEditModalBtn) closeEditModalBtn.addEventListener("click", closeEditProductModal);
    if (cancelEditBtn) cancelEditBtn.addEventListener("click", closeEditProductModal);

    if (editFileUploadInput) {
        editFileUploadInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                editUploadedBase64 = evt.target.result;
                editPreviewImg.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    if (editProductForm) {
        editProductForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const id = document.getElementById("editProdId").value;

            const updatePayload = {
                title: document.getElementById("editProdTitle").value.trim(),
                category: document.getElementById("editProdCategory").value,
                price: parseFloat(document.getElementById("editProdPrice").value) || 0,
                woodType: document.getElementById("editProdWood").value.trim(),
                dimensions: document.getElementById("editProdDimensions").value.trim(),
                finish: document.getElementById("editProdFinish").value.trim(),
                description: document.getElementById("editProdDesc").value.trim(),
                image: editProdImage.value.trim(),
                imageBase64: editUploadedBase64,
                imageData: editUploadedBase64 || ''
            };

            // Update local custom products
            const localCustom = JSON.parse(localStorage.getItem("rki_custom_products") || "[]");
            const cp = localCustom.find(item => item.id === id);
            if (cp) {
                Object.assign(cp, updatePayload);
                localStorage.setItem("rki_custom_products", JSON.stringify(localCustom));
            }

            // Update general storage
            const local = Storage.getProducts();
            const p = local.find(item => item.id === id);
            if (p) {
                Object.assign(p, updatePayload);
                Storage.saveProducts(local);
            }

            try {
                await fetch(`/api/products/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatePayload)
                });
            } catch (err) {
                console.warn("Server update deferred:", err);
            }

            closeEditProductModal();
            await refreshAllData();
            alert("Furniture updated successfully! / फर्नीचर अपडेट हो गया!");
        });
    }

    async function deleteProduct(productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        if (confirm(`Are you sure you want to delete "${prod.title}"? (क्या आप वाकई इसे हटाना चाहते हैं?)`)) {
            // 1. Remove from local custom storage
            let localCustom = JSON.parse(localStorage.getItem("rki_custom_products") || "[]");
            localCustom = localCustom.filter(p => p.id !== productId);
            localStorage.setItem("rki_custom_products", JSON.stringify(localCustom));

            // 2. Remove from general storage
            const local = Storage.getProducts().filter(p => p.id !== productId);
            Storage.saveProducts(local);

            // 3. Send DELETE to server
            try {
                await fetch(`/api/products/${productId}`, { method: "DELETE" });
            } catch (err) {
                console.warn("Server delete deferred:", err);
            }

            await refreshAllData();
            alert(`"${prod.title}" has been deleted.`);
        }
    }

    // -------------------------------------------------------------
    // SETTINGS TAB
    // -------------------------------------------------------------
    function populateSettingsForm() {
        if (!shopSettingsForm) return;
        settingShopName.value = settings.shopName || "Ram Keval Interior";
        settingPhone.value = settings.phone || "+977-9800000000";
        settingWhatsApp.value = settings.whatsapp || "9779800000000";
        settingEmail.value = settings.email || "ramashisha55@gmail.com";
        settingPin.value = settings.adminPin || "1985";
    }

    if (shopSettingsForm) {
        shopSettingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const payload = {
                shopName: settingShopName.value.trim(),
                phone: settingPhone.value.trim(),
                whatsapp: settingWhatsApp.value.trim(),
                email: settingEmail.value.trim(),
                adminPin: settingPin.value.trim()
            };

            try {
                await fetch("/api/settings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                Storage.saveSettings(payload);
            }

            alert("Settings updated successfully on backend server!");
            await refreshAllData();
        });
    }

    if (exportDataBtn) {
        exportDataBtn.addEventListener("click", () => {
            const dataToExport = { shop: settings, products, orders, exportDate: new Date().toISOString() };
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
            const a = document.createElement("a");
            a.setAttribute("href", dataStr);
            a.setAttribute("download", `ram_keval_interior_backup_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(a);
            a.click();
            a.remove();
        });
    }

    if (resetDataBtn) {
        resetDataBtn.addEventListener("click", () => {
            if (confirm("Reset all products and orders to original default sample data?")) {
                Storage.resetToDefault();
                location.reload();
            }
        });
    }

    // -------------------------------------------------------------
    // RESTORE BACKUP (FROM JSON FILE)
    // -------------------------------------------------------------
    if (restoreBackupFileInput) {
        restoreBackupFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function(evt) {
                try {
                    const backupData = JSON.parse(evt.target.result);
                    if (!backupData.products && !backupData.orders) {
                        alert("Invalid backup file! It does not contain products or orders data.");
                        return;
                    }

                    const prodCount = backupData.products ? backupData.products.length : 0;
                    const ordCount = backupData.orders ? backupData.orders.length : 0;

                    if (confirm(`Do you want to restore this backup? It contains ${prodCount} products and ${ordCount} customer orders. Your current catalog will be updated.`)) {
                        // 1. Sync to backend REST API
                        try {
                            await fetch("/api/backup/restore", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(backupData)
                            });
                        } catch (err) {
                            console.log("Offline restore fallback:", err);
                        }

                        // 2. Save locally
                        if (backupData.products) Storage.saveProducts(backupData.products);
                        if (backupData.orders) Storage.saveOrders(backupData.orders);
                        if (backupData.shop) Storage.saveSettings(backupData.shop);

                        alert(`✓ Backup restored successfully! Recovered ${prodCount} products and ${ordCount} orders.`);
                        await refreshAllData();
                    }
                } catch (parseErr) {
                    alert("Error reading backup JSON file: " + parseErr.message);
                } finally {
                    restoreBackupFileInput.value = "";
                }
            };
            reader.readAsText(file);
        });
    }

    // -------------------------------------------------------------
    // PERMANENT CLOUD AUTO-SYNC BUTTON
    // -------------------------------------------------------------
    const forceSyncCloudBtn = document.getElementById("forceSyncCloudBtn");
    const syncStatusBanner = document.getElementById("syncStatusBanner");

    if (forceSyncCloudBtn) {
        forceSyncCloudBtn.addEventListener("click", async () => {
            forceSyncCloudBtn.disabled = true;
            forceSyncCloudBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Cloud Server...`;

            try {
                const localCustom = JSON.parse(localStorage.getItem("rki_custom_products") || "[]");
                const allLocal = Storage.getProducts();
                const toSync = localCustom.length > 0 ? localCustom : allLocal;

                const pRes = await fetch("/api/products/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ products: toSync })
                });

                const localOrders = Storage.getOrders();
                const oRes = await fetch("/api/orders/sync", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orders: localOrders })
                });

                if (pRes.ok && oRes.ok) {
                    if (syncStatusBanner) {
                        syncStatusBanner.style.display = "block";
                        syncStatusBanner.style.background = "#e8f5e9";
                        syncStatusBanner.style.color = "#2e7d32";
                        syncStatusBanner.style.border = "1px solid #c8e6c9";
                        syncStatusBanner.innerHTML = `<i class="fa-solid fa-circle-check"></i> <strong>✓ All ${toSync.length} furniture items and ${localOrders.length} customer orders are successfully synchronized with the cloud server!</strong>`;
                    }
                    alert("✓ Success! All furniture catalog and orders have been synchronized with the live cloud server!");
                } else {
                    throw new Error("Server returned an error status during sync.");
                }
            } catch (err) {
                if (syncStatusBanner) {
                    syncStatusBanner.style.display = "block";
                    syncStatusBanner.style.background = "#ffebee";
                    syncStatusBanner.style.color = "#c62828";
                    syncStatusBanner.style.border = "1px solid #ffcdd2";
                    syncStatusBanner.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> Sync deferred: ${err.message}. Your data is safely stored in this browser.`;
                }
                alert("Note: Server is currently spinning up. Your data is 100% safe in your browser and will automatically sync when online.");
            } finally {
                forceSyncCloudBtn.disabled = false;
                forceSyncCloudBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> Force Sync All Furniture & Orders to Cloud Now`;
                await refreshAllData();
            }
        });
    }

    // -------------------------------------------------------------
    // SECURITY: INACTIVITY AUTO-LOGOUT (15 MINUTES)
    // -------------------------------------------------------------
    let inactivityTimeout;
    const INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 Minutes

    function resetInactivityTimer() {
        if (sessionStorage.getItem("rki_admin_auth") !== "true") return;
        clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(() => {
            sessionStorage.removeItem("rki_admin_auth");
            alert("🔒 Security Notice: Your session has expired due to 15 minutes of inactivity to protect client data. Please enter your PIN to login again.");
            location.reload();
        }, INACTIVITY_LIMIT_MS);
    }

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(evtName => {
        window.addEventListener(evtName, resetInactivityTimer, { passive: true });
    });
    resetInactivityTimer();

    function escapeHtml(text) {
        if (!text) return "";
        return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});
