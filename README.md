# Ram Keval Interior - Fullstack Website (Frontend + Backend)

> **Design | Create | Elevate • Established 1985**  
> Master Craftsmanship in Custom Solid Wood Furniture, Modular Kitchens, Painting Works & Architectural Interiors.

---

## 🏗️ Architecture: Frontend + Backend

This project is a **complete Fullstack Application** featuring:

```text
ram-keval-interior/
├── server.js                 <-- Node.js Backend Server (REST API + JSON Database + File Uploads)
├── server.py                 <-- Python Backend Server (Alternative with zero dependencies)
├── package.json              <-- NPM Package Config
├── database/                 <-- Persistent Database Files
│   ├── products.json         <-- All furniture products & prices
│   ├── orders.json           <-- Customer orders received
│   └── settings.json         <-- Shop contact info & admin PIN
├── uploads/                  <-- Stored furniture photos uploaded by client
├── index.html                <-- Frontend: Customer Storefront & Order Placement
├── admin.html                <-- Frontend: Client / Owner Management Dashboard
├── styles.css                <-- Luxury interior styling & responsive layout
├── app.js                    <-- Frontend JS: communicates with /api/products & /api/orders
├── admin.js                  <-- Frontend JS: communicates with /api/admin & handles image uploads
└── data.js                   <-- Initial seed data & offline fallback
```

---

## ⚡ How to Start the Backend Server

You can run the backend using **either Node.js or Python**:

### Method 1: Using Node.js (Recommended)
Open PowerShell or Terminal inside the folder:
```powershell
cd C:\Users\v9919\.gemini\antigravity\scratch\ram-keval-interior
node server.js
```
*Server will start instantly at:* **`http://localhost:5000`**

### Method 2: Using Python (Zero Installation Needed)
If you prefer Python:
```powershell
python server.py
```
*Server will start instantly at:* **`http://localhost:5000`**

---

## 🌐 URLs to Open in Browser

Once the backend is running:
- **Customer Website (ग्राहक के लिए)**:  
  👉 **`http://localhost:5000/`** (or `http://localhost:5000/index.html`)
- **Client Admin Portal (दुकान मालिक के लिए)**:  
  👉 **`http://localhost:5000/admin.html`**  
  *(Default Master PIN: **`1985`**)*

---

## 🛠️ Backend REST APIs Implemented

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Returns all furniture items with prices & photos from database |
| `POST` | `/api/products` | Admin adds new furniture; saves uploaded photo file to `uploads/` folder and database |
| `PUT` | `/api/products/:id` | Admin updates price, photo, dimensions, or stock status |
| `DELETE` | `/api/products/:id` | Admin deletes furniture item from store |
| `GET` | `/api/orders` | Admin views all customer orders |
| `POST` | `/api/orders` | Customer places order (No online payment required; saved to `database/orders.json`) |
| `PATCH` | `/api/orders/:id/status`| Admin updates order status (Pending ➔ Confirmed ➔ Delivered) |
| `GET` | `/api/stats` | Calculates total furniture count, total orders, pending count, order value |
| `POST` | `/api/admin/login` | Verifies security PIN (Default: `1985`) |
| `GET` / `POST` | `/api/settings` | Updates shop phone, WhatsApp, email, and admin PIN |

---

## 📱 Features Summary

1. **Customer Side (No Payment Required)**:
   - Browse furniture catalog with transparent prices and wood types (Sagwan/Teak, Sheesham, Sal Wood).
   - "Order Now" button asks for customer Name, Phone, City (Kathmandu, Hyderabad, Gorakhpur, Lucknow), and Address.
   - Saves order directly to the backend database as **Cash on Delivery / Direct Confirmation**.
   - Optional 1-click **WhatsApp Order Copy** button so client also gets an instant message on WhatsApp!

2. **Client Side (Admin Panel)**:
   - Upload new furniture photos directly from phone/laptop.
   - Edit any furniture price or details anytime without needing to call the developer.
   - View real-time orders list with customer name, phone, address, and status.
   - 1-Click "Call Customer" & "WhatsApp Customer" buttons.

3. **Shop Heritage & Profile Included**:
   - Master Craftsman photo with 40-year heritage badge (Founded 1985 in Mumbai, expanded 2000 to Kathmandu).
   - Official Visiting Card displayed.
   - Kathmandu, Hyderabad, Gorakhpur, Lucknow work locations.
   - Corporate associations: Triveni Group & Vishwakarma Cement.
   - New 2025 Service: Professional Painting Works.
