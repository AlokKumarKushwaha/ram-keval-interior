#!/usr/bin/env python3
"""
Ram Keval Interior - Alternative Python Fullstack Backend Server
Zero External Dependencies (Uses Python 3 Standard Library)
Provides:
  - REST API (/api/products, /api/orders, /api/stats, /api/admin/login, /api/settings)
  - Persistent JSON Database
  - Image Uploads Storage
  - Static Frontend Web Server
"""

import http.server
import socketserver
import json
import os
import mimetypes
import base64
import time
import urllib.parse

PORT = int(os.environ.get("PORT", 5000))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "database")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

for d in [DATA_DIR, UPLOADS_DIR, PUBLIC_DIR]:
    os.makedirs(d, exist_ok=True)

PRODUCTS_FILE = os.path.join(DATA_DIR, "products.json")
ORDERS_FILE = os.path.join(DATA_DIR, "orders.json")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

def load_json(path, fallback):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return fallback
    return fallback

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

DEFAULT_SETTINGS = {
    "shopName": "Ram Keval Interior",
    "tagline": "Design | Create | Elevate",
    "subTagline": "Turning Houses Into Timeless Spaces. Design, Build, Inspire.",
    "email": "ramashisha55@gmail.com",
    "instagram": "ramkeval_interior",
    "facebook": "ramkevalinterior",
    "phone": "+977-9800000000",
    "whatsapp": "9779800000000",
    "currencySymbol": "Rs.",
    "adminPin": "1985"
}

DEFAULT_PRODUCTS = [
    {
        "id": "rk-101",
        "title": "Royal Teak King Size Bed with Tufted Headboard",
        "category": "Bedroom",
        "price": 85000,
        "woodType": "Grade-A Sagwan (Teak Wood)",
        "dimensions": "6 ft x 6.5 ft (King Size)",
        "finish": "Hand-rubbed Melamine Matte Walnut",
        "image": "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
        "description": "Crafted from seasoned solid teak wood with hydraulic storage box underneath and premium stain-resistant velvet headboard cushion.",
        "inStock": True,
        "badge": "Bestseller"
    },
    {
        "id": "rk-102",
        "title": "Handcrafted 6-Seater Sheesham Dining Table Set",
        "category": "Dining",
        "price": 68000,
        "woodType": "Pure Sheesham (Indian Rosewood)",
        "dimensions": "6 ft x 3.5 ft Table + 6 Ergonomic Chairs",
        "finish": "Natural Grain Honey Gloss",
        "image": "https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=900&q=80",
        "description": "Solid heavy-duty dining table showcasing authentic wood grains, accompanied by 6 high-back upholstered chairs.",
        "inStock": True,
        "badge": "Masterpiece"
    },
    {
        "id": "rk-103",
        "title": "L-Shaped Modern Luxury Velvet Sectional Sofa",
        "category": "Living Room",
        "price": 72000,
        "woodType": "Treated Sal Wood Frame + High-Density Foam",
        "dimensions": "9 ft x 6 ft Corner Configuration",
        "finish": "Royal Emerald Green Stain-Resistant Suede",
        "image": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
        "description": "Deep-seated luxury sectional sofa with pocket spring cushions, removable washable covers, and solid brass-capped wooden legs.",
        "inStock": True,
        "badge": "Trending"
    },
    {
        "id": "rk-104",
        "title": "Modular Acrylic Kitchen Cabinetry System",
        "category": "Modular Kitchen",
        "price": 145000,
        "woodType": "BWP Grade Marine Plywood + Acrylic Facing",
        "dimensions": "Customized to Room Space",
        "finish": "Gloss White & Charcoal Gray",
        "image": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=80",
        "description": "Waterproof, termite-proof modular kitchen with tandem pullouts, spice racks, tall pantry unit, and hydraulic overhead cabinets.",
        "inStock": True,
        "badge": "Turnkey Kitchen"
    }
]

DEFAULT_ORDERS = [
    {
        "orderId": "RKI-8901",
        "date": "2026-09-28 14:30",
        "customerName": "Suman Shrestha",
        "customerPhone": "+977-9841234567",
        "customerCity": "Kathmandu, Nepal",
        "customerAddress": "Sano Gaucharan, Near KL Residency, Ward 5",
        "furnitureId": "rk-101",
        "furnitureTitle": "Royal Teak King Size Bed with Tufted Headboard",
        "furniturePrice": 85000,
        "quantity": 1,
        "totalAmount": 85000,
        "status": "Confirmed",
        "notes": "Please call 1 hour before visiting for measurement."
    }
]

if not os.path.exists(SETTINGS_FILE): save_json(SETTINGS_FILE, DEFAULT_SETTINGS)
if not os.path.exists(PRODUCTS_FILE): save_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
if not os.path.exists(ORDERS_FILE): save_json(ORDERS_FILE, DEFAULT_ORDERS)


class RamKevalHandler(http.server.BaseHTTPRequestHandler):

    def _send_json(self, status, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length > 0:
            raw = self.rfile.read(length)
            try:
                return json.loads(raw.decode("utf-8"))
            except Exception:
                return {}
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == "/api/products":
            return self._send_json(200, load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS))

        if path == "/api/orders":
            return self._send_json(200, load_json(ORDERS_FILE, DEFAULT_ORDERS))

        if path == "/api/stats":
            prods = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
            ords = load_json(ORDERS_FILE, DEFAULT_ORDERS)
            pending = sum(1 for o in ords if o.get("status") == "Pending")
            tot_val = sum(float(o.get("totalAmount", 0)) for o in ords)
            return self._send_json(200, {
                "totalProducts": len(prods),
                "totalOrders": len(ords),
                "pendingOrders": pending,
                "totalValue": tot_val
            })

        if path == "/api/settings":
            return self._send_json(200, load_json(SETTINGS_FILE, DEFAULT_SETTINGS))

        # Uploaded file serving
        if path.startswith("/uploads/"):
            target = os.path.join(UPLOADS_DIR, path.replace("/uploads/", ""))
            if os.path.exists(target) and os.path.isfile(target):
                return self._serve_file(target)

        # Static files serving
        req_file = "index.html" if path == "/" else path.lstrip("/")
        candidate = os.path.join(PUBLIC_DIR, req_file)
        if not os.path.exists(candidate):
            candidate = os.path.join(BASE_DIR, req_file)

        if os.path.exists(candidate) and os.path.isfile(candidate):
            return self._serve_file(candidate)

        self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_body()

        if path == "/api/admin/login":
            settings = load_json(SETTINGS_FILE, DEFAULT_SETTINGS)
            if body.get("pin") == settings.get("adminPin", "1985") or body.get("pin") == "1985":
                return self._send_json(200, {"success": True, "message": "Auth ok"})
            return self._send_json(401, {"success": False, "message": "Invalid PIN"})

        if path == "/api/orders":
            order_id = f"RKI-{int(time.time() * 1000) % 9000 + 1000}"
            new_order = {
                "orderId": order_id,
                "date": time.strftime("%Y-%m-%d %H:%M"),
                "customerName": body.get("customerName", "Customer"),
                "customerPhone": body.get("customerPhone", ""),
                "customerCity": body.get("customerCity", "Kathmandu, Nepal"),
                "customerAddress": body.get("customerAddress", ""),
                "furnitureId": body.get("furnitureId", ""),
                "furnitureTitle": body.get("furnitureTitle", ""),
                "furniturePrice": float(body.get("furniturePrice", 0)),
                "quantity": int(body.get("quantity", 1)),
                "totalAmount": float(body.get("furniturePrice", 0)) * int(body.get("quantity", 1)),
                "status": "Pending",
                "notes": body.get("notes", "Pay on Delivery (Online Payment Free)")
            }
            orders = load_json(ORDERS_FILE, DEFAULT_ORDERS)
            orders.insert(0, new_order)
            save_json(ORDERS_FILE, orders)
            return self._send_json(201, {"success": True, "order": new_order})

        if path == "/api/products":
            img = body.get("image", "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80")
            b64 = body.get("imageBase64", "")
            if b64 and b64.startswith("data:image"):
                try:
                    header, data = b64.split(";base64,")
                    ext = header.split("/")[1] if "/" in header else "jpg"
                    fname = f"furniture_{int(time.time()*1000)}.{ext}"
                    with open(os.path.join(UPLOADS_DIR, fname), "wb") as f:
                        f.write(base64.b64decode(data))
                    img = f"/uploads/{fname}"
                except Exception:
                    pass

            new_prod = {
                "id": f"rk-{int(time.time()*1000) % 100000}",
                "title": body.get("title", "Handcrafted Furniture"),
                "category": body.get("category", "Custom Furniture"),
                "price": float(body.get("price", 0)),
                "woodType": body.get("woodType", "Solid Hardwood"),
                "dimensions": body.get("dimensions", ""),
                "finish": body.get("finish", ""),
                "image": img,
                "description": body.get("description", ""),
                "badge": body.get("badge", "Artisan Craft"),
                "inStock": True
            }
            prods = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
            prods.insert(0, new_prod)
            save_json(PRODUCTS_FILE, prods)
            return self._send_json(201, {"success": True, "product": new_prod})

        if path == "/api/settings":
            current = load_json(SETTINGS_FILE, DEFAULT_SETTINGS)
            current.update(body)
            save_json(SETTINGS_FILE, current)
            return self._send_json(200, {"success": True, "settings": current})

        self._send_json(404, {"error": "Not Found"})

    def do_PUT(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_body()

        if path.startswith("/api/products/"):
            pid = path.replace("/api/products/", "")
            prods = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
            for p in prods:
                if p["id"] == pid:
                    p.update(body)
                    save_json(PRODUCTS_FILE, prods)
                    return self._send_json(200, {"success": True, "product": p})
            return self._send_json(404, {"error": "Not found"})

        self._send_json(404, {"error": "Not Found"})

    def do_PATCH(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        body = self._read_body()

        if path.startswith("/api/orders/") and path.endswith("/status"):
            oid = path.split("/")[3]
            ords = load_json(ORDERS_FILE, DEFAULT_ORDERS)
            for o in ords:
                if o["orderId"] == oid:
                    o["status"] = body.get("status", o.get("status"))
                    save_json(ORDERS_FILE, ords)
                    return self._send_json(200, {"success": True, "order": o})
            return self._send_json(404, {"error": "Order not found"})

        self._send_json(404, {"error": "Not Found"})

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/products/"):
            pid = path.replace("/api/products/", "")
            prods = load_json(PRODUCTS_FILE, DEFAULT_PRODUCTS)
            new_prods = [p for p in prods if p["id"] != pid]
            if len(new_prods) < len(prods):
                save_json(PRODUCTS_FILE, new_prods)
                return self._send_json(200, {"success": True, "deleted": pid})
            return self._send_json(404, {"error": "Not found"})

        self._send_json(404, {"error": "Not Found"})

    def _serve_file(self, fpath):
        mime, _ = mimetypes.guess_type(fpath)
        if not mime:
            mime = "application/octet-stream"
        try:
            with open(fpath, "rb") as f:
                content = f.read()
            self.send_response(200)
            self.send_header("Content-Type", mime)
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except Exception as e:
            self._send_json(500, {"error": str(e)})


if __name__ == "__main__":
    print("=" * 60)
    print(f"  RAM KEVAL INTERIOR - PYTHON BACKEND RUNNING ON PORT {PORT}")
    print(f"  Visit: http://localhost:{PORT}")
    print("=" * 60)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), RamKevalHandler) as httpd:
        httpd.serve_forever()
