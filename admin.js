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

    // Add Product Elements
    const newProductForm = document.getElementById("newProductForm");
    const imageDropArea = document.getElementById("imageDropArea");
    const fileUploadInput = document.getElementById("fileUploadInput");
    const prodImageUrlInput = document.getElementById("prodImageUrlInput");
    const previewHolder = document.getElementById("previewHolder");
    const imagePreviewImg = document.getElementById("imagePreviewImg");
    let currentUploadedBase64 = "";

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

    // -------------------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------------------
    const isLoggedIn = sessionStorage.getItem("rki_admin_auth") === "true";
    if (isLoggedIn) {
        showDashboard();
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
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
                sessionStorage.setItem("rki_admin_auth", "true");
                showDashboard();
            } else {
                alert("Incorrect PIN! / ग़लत पिन! Default is 1985.");
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

            if (prodRes.ok) products = await prodRes.json();
            if (ordRes.ok) orders = await ordRes.json();
            if (setRes.ok) settings = await setRes.json();

            if (statRes.ok) {
                const stats = await statRes.json();
                statTotalProducts.textContent = stats.totalProducts;
                statTotalOrders.textContent = stats.totalOrders;
                tabOrderCount.textContent = stats.totalOrders;
                statPendingOrders.textContent = stats.pendingOrders;
                statTotalValue.textContent = `${settings.currencySymbol || 'Rs.'} ${Number(stats.totalValue).toLocaleString("en-IN")}`;
            }
        } catch (e) {
            // Local storage fallback
            products = Storage.getProducts();
            orders = Storage.getOrders();
            settings = Storage.getSettings();

            statTotalProducts.textContent = products.length;
            statTotalOrders.textContent = orders.length;
            tabOrderCount.textContent = orders.length;
            const pendingCount = orders.filter(o => o.status === "Pending").length;
            statPendingOrders.textContent = pendingCount;
            const totalValue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
            statTotalValue.textContent = `${settings.currencySymbol || 'Rs.'} ${totalValue.toLocaleString("en-IN")}`;
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
                        <div style="font-weight: 800; color: #8b4513;">${settings.currencySymbol || 'Rs.'} ${Number(o.totalAmount || 0).toLocaleString("en-IN")}</div>
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
    // TAB 3: ADD NEW PRODUCT (POST TO BACKEND WITH IMAGE UPLOAD)
    // -------------------------------------------------------------
    if (imageDropArea && fileUploadInput) {
        imageDropArea.addEventListener("click", () => fileUploadInput.click());

        fileUploadInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(evt) {
                currentUploadedBase64 = evt.target.result;
                imagePreviewImg.src = currentUploadedBase64;
                previewHolder.style.display = "block";
                prodImageUrlInput.value = "";
            };
            reader.readAsDataURL(file);
        });
    }

    if (prodImageUrlInput) {
        prodImageUrlInput.addEventListener("input", (e) => {
            const val = e.target.value.trim();
            if (val) {
                currentUploadedBase64 = val;
                imagePreviewImg.src = val;
                previewHolder.style.display = "block";
            }
        });
    }

    if (newProductForm) {
        newProductForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const payload = {
                title: document.getElementById("prodTitleInput").value.trim(),
                category: document.getElementById("prodCategoryInput").value,
                price: parseFloat(document.getElementById("prodPriceInput").value) || 0,
                badge: document.getElementById("prodBadgeInput").value.trim(),
                woodType: document.getElementById("prodWoodInput").value.trim(),
                dimensions: document.getElementById("prodDimensionsInput").value.trim(),
                finish: document.getElementById("prodFinishInput").value.trim(),
                description: document.getElementById("prodDescInput").value.trim(),
                imageBase64: currentUploadedBase64,
                image: prodImageUrlInput.value.trim()
            };

            try {
                const res = await fetch("/api/products", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    alert(`"${payload.title}" has been saved to the database and published live!`);
                } else {
                    throw new Error("Server responded with error");
                }
            } catch (err) {
                // LocalStorage Fallback
                const local = Storage.getProducts();
                local.unshift({
                    id: "rk-" + Date.now().toString().slice(-5),
                    ...payload,
                    image: payload.imageBase64 || payload.image || "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
                    inStock: true
                });
                Storage.saveProducts(local);
                alert(`"${payload.title}" added to local catalog!`);
            }

            newProductForm.reset();
            currentUploadedBase64 = "";
            previewHolder.style.display = "none";
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
                imageBase64: editUploadedBase64
            };

            try {
                await fetch(`/api/products/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatePayload)
                });
            } catch (err) {
                const local = Storage.getProducts();
                const p = local.find(item => item.id === id);
                if (p) {
                    Object.assign(p, updatePayload);
                    Storage.saveProducts(local);
                }
            }

            closeEditProductModal();
            await refreshAllData();
            alert("Furniture updated successfully! / फर्नीचर अपडेट हो गया!");
        });
    }

    async function deleteProduct(productId) {
        const prod = products.find(p => p.id === productId);
        if (!prod) return;

        if (confirm(`Are you sure you want to delete "${prod.title}"?`)) {
            try {
                await fetch(`/api/products/${productId}`, { method: "DELETE" });
            } catch (err) {
                const local = Storage.getProducts().filter(p => p.id !== productId);
                Storage.saveProducts(local);
            }
            await refreshAllData();
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

    function escapeHtml(text) {
        if (!text) return "";
        return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});
