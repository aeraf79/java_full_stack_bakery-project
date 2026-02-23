import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Adminpanel.css";

// ─── API ────────────────────────────────────────────────────────────────────
const API = "http://localhost:8080/api";
const hdr = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "—";

const initials = (n) =>
  (n || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const STATUS_CLS = {
  PENDING: "s-pending", CONFIRMED: "s-confirmed", PROCESSING: "s-processing",
  SHIPPED: "s-shipped", DELIVERED: "s-delivered", CANCELLED: "s-cancelled", REFUNDED: "s-refunded",
};
const PAY_CLS = { PENDING: "p-pending", PAID: "p-paid", FAILED: "p-failed", REFUNDED: "p-refunded" };
const CATEGORIES = ["Breads","Pastries","Cakes","Cookies","Muffins","Vegan","Gluten-Free","Seasonal","Beverages","Other"];

// ─── TOAST ──────────────────────────────────────────────────────────────────
const ToastStack = ({ toasts, remove }) => (
  <div className="toast-stack">
    {toasts.map((t) => (
      <div key={t.id} className={`ap-toast ap-toast-${t.type}`}>
        <span className="ap-toast-ic">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
        <span>{t.msg}</span>
        <button onClick={() => remove(t.id)}>×</button>
      </div>
    ))}
  </div>
);

// ─── CONFIRM ────────────────────────────────────────────────────────────────
const ConfirmBox = ({ msg, onOk, onCancel }) => (
  <div className="ap-overlay" onClick={onCancel}>
    <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
      <div className="confirm-icon">⚠</div>
      <p>{msg}</p>
      <div className="confirm-btns">
        <button className="ap-btn ap-btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="ap-btn ap-btn-danger" onClick={onOk}>Delete</button>
      </div>
    </div>
  </div>
);

// ─── PRODUCT MODAL ──────────────────────────────────────────────────────────
const ProductModal = ({ product, onClose, onSave }) => {
  const isEdit = !!product?.productId;
  const blank = { name:"", description:"", price:"", category:"Breads", stockQuantity:"",
                  imageUrl:"", isAvailable:true, unit:"", weight:"", allergens:"" };
  const [form, setForm]   = useState({ ...blank, ...(product || {}) });
  const [errs, setErrs]   = useState({});
  const [busy, setBusy]   = useState(false);

  const setF = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrs((e) => ({ ...e, [k]: null })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())                        e.name = "Name is required";
    if (!form.price || +form.price <= 0)          e.price = "Price must be > 0";
    if (!form.category)                            e.category = "Category required";
    if (form.stockQuantity === "" || +form.stockQuantity < 0) e.stockQuantity = "Stock ≥ 0";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrs(e); return; }
    setBusy(true);
    const body = {
      name: form.name.trim(), description: form.description || "",
      price: parseFloat(form.price), category: form.category,
      stockQuantity: parseInt(form.stockQuantity), imageUrl: form.imageUrl || "",
      isAvailable: form.isAvailable, unit: form.unit || "",
      weight: form.weight ? parseFloat(form.weight) : null,
      allergens: form.allergens || "",
    };
    try {
      const url = isEdit ? `${API}/products/${product.productId}` : `${API}/products/add`;
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: hdr(), body: JSON.stringify(body) });
      if (!res.ok) { const t = await res.text(); throw new Error(t); }
      onSave(await res.json(), isEdit);
    } catch (err) { alert("Error: " + err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="ap-mhead">
          <h2>{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <button className="ap-mclose" onClick={onClose}>×</button>
        </div>
        <div className="ap-mbody">
          <div className="form-g2">
            <Field label="Name *" error={errs.name}>
              <input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Sourdough Loaf" />
            </Field>
            <Field label="Category *" error={errs.category}>
              <select value={form.category} onChange={(e) => setF("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Price (₹) *" error={errs.price}>
              <input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setF("price", e.target.value)} placeholder="250" />
            </Field>
            <Field label="Stock Quantity *" error={errs.stockQuantity}>
              <input type="number" min="0" value={form.stockQuantity} onChange={(e) => setF("stockQuantity", e.target.value)} placeholder="50" />
            </Field>
            <Field label="Unit">
              <input value={form.unit} onChange={(e) => setF("unit", e.target.value)} placeholder="e.g. 500g, piece, dozen" />
            </Field>
            <Field label="Weight (kg)">
              <input type="number" step="0.01" value={form.weight} onChange={(e) => setF("weight", e.target.value)} placeholder="0.5" />
            </Field>
          </div>
          <Field label="Description">
            <textarea rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Describe the product…" />
          </Field>
          <Field label="Image URL">
            <input value={form.imageUrl} onChange={(e) => setF("imageUrl", e.target.value)} placeholder="https://…" />
            {form.imageUrl && (
              <img src={form.imageUrl} alt="preview" className="img-preview"
                   onError={(e) => (e.target.style.display = "none")} />
            )}
          </Field>
          <Field label="Allergens">
            <input value={form.allergens} onChange={(e) => setF("allergens", e.target.value)} placeholder="e.g. Gluten, Dairy, Eggs" />
          </Field>
          <div className="field-row-check">
            <label>Available for sale</label>
            <label className="ap-toggle">
              <input type="checkbox" checked={!!form.isAvailable} onChange={(e) => setF("isAvailable", e.target.checked)} />
              <span className="ap-toggle-slider" />
            </label>
          </div>
        </div>
        <div className="ap-mfoot">
          <button className="ap-btn ap-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spin-xs" />} {isEdit ? "Update Product" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── USER EDIT MODAL ────────────────────────────────────────────────────────
const UserModal = ({ user, onClose, onSave }) => {
  const [form, setForm] = useState({
    fullName: user.fullName || "", email: user.email || "",
    phoneNumber: user.phoneNumber || "", role: user.role || "USER",
  });
  const [busy, setBusy] = useState(false);
  const setF = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/users/put/${user.userId}`, {
        method: "PUT", headers: hdr(), body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(await res.text());
      onSave(await res.json());
    } catch (err) { alert("Error: " + err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ap-mhead"><h2>Edit User</h2><button className="ap-mclose" onClick={onClose}>×</button></div>
        <div className="ap-mbody">
          <div className="usr-edit-avatar">{initials(user.fullName)}</div>
          <Field label="Full Name"><input value={form.fullName} onChange={(e) => setF("fullName", e.target.value)} /></Field>
          <Field label="Email"><input type="email" value={form.email} onChange={(e) => setF("email", e.target.value)} /></Field>
          <Field label="Phone Number"><input value={form.phoneNumber} onChange={(e) => setF("phoneNumber", e.target.value)} /></Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setF("role", e.target.value)}>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </Field>
        </div>
        <div className="ap-mfoot">
          <button className="ap-btn ap-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spin-xs" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── ORDER DETAIL MODAL ─────────────────────────────────────────────────────
const OrderModal = ({ order, onClose, onUpdate }) => {
  const [status, setStatus]     = useState(order.status);
  const [payStatus, setPayStatus] = useState(order.paymentStatus);
  const [busy, setBusy]         = useState(false);

   const submit = async () => {
    setBusy(true);
    try {
      // Call the new unified status update endpoint
      const res = await fetch(`${API}/orders/${order.orderId}/status`, {
        method: "PUT",
        headers: hdr(),
        body: JSON.stringify({ status, paymentStatus: payStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();
      onUpdate(updated);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="ap-mhead">
          <div>
            <h2>Order #{order.orderNumber}</h2>
            <p className="mhead-sub">{fmtDate(order.createdAt)}</p>
          </div>
          <button className="ap-mclose" onClick={onClose}>×</button>
        </div>
        <div className="ap-mbody">
          {/* Badges */}
          <div className="ord-badge-row">
            <span className={`status-bdg ${STATUS_CLS[order.status]}`}>{order.status}</span>
            <span className={`pay-bdg ${PAY_CLS[order.paymentStatus]}`}>{order.paymentStatus}</span>
            {order.paymentMethod && <span className="method-bdg">💳 {order.paymentMethod}</span>}
          </div>

          <div className="ord-two-col">
            <div className="ord-info-card">
              <h4>🧑 Customer</h4>
              <p><strong>{order.customerName || order.shippingName}</strong></p>
              {order.customerEmail && <p className="info-secondary">{order.customerEmail}</p>}
              <p>📞 {order.shippingPhone}</p>
            </div>
            <div className="ord-info-card">
              <h4>📍 Shipping Address</h4>
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}, {order.shippingState} {order.shippingPincode}</p>
              {order.orderNotes && <p className="ord-notes">📝 {order.orderNotes}</p>}
            </div>
          </div>

          {/* Items */}
          <div className="ord-items-section">
            <h4>🛒 Order Items ({order.orderItems?.length ?? 0})</h4>
            <table className="ord-items-tbl">
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(order.orderItems || []).map((it, i) => (
                  <tr key={i}>
                    <td>
                      <div className="oitem-cell">
                        {it.productImageUrl && (
                          <img src={it.productImageUrl} alt="" className="oitem-thumb"
                               onError={(e) => (e.target.style.display = "none")} />
                        )}
                        <span>{it.productName}</span>
                      </div>
                    </td>
                    <td>×{it.quantity}</td>
                    <td>{fmt(it.priceAtPurchase)}</td>
                    <td><strong>{fmt(it.subtotal)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="ord-totals">
            <div className="tot-row"><span>Subtotal</span><span>{fmt(order.totalAmount)}</span></div>
            {parseFloat(order.discountAmount) > 0 && (
              <div className="tot-row tot-discount"><span>Discount</span><span>− {fmt(order.discountAmount)}</span></div>
            )}
            <div className="tot-row"><span>Shipping</span><span>{parseFloat(order.shippingFee) === 0 ? "Free" : fmt(order.shippingFee)}</span></div>
            <div className="tot-row tot-final"><span>Total</span><span>{fmt(order.finalAmount)}</span></div>
          </div>

          {/* Status update */}
          <div className="ord-update-strip">
            <div className="form-g2">
              <Field label="Order Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  {["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Payment Status">
                <select value={payStatus} onChange={(e) => setPayStatus(e.target.value)}>
                  {["PENDING","PAID","FAILED","REFUNDED"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </div>
            <button className="ap-btn ap-btn-primary" onClick={submit} disabled={busy}>
              {busy && <span className="spin-xs" />} Update Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── STOCK MODAL ────────────────────────────────────────────────────────────
const StockModal = ({ product, onClose, onSave }) => {
  const [qty, setQty] = useState(product.stockQuantity ?? 0);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/products/${product.productId}/stock?quantity=${qty}`, {
        method: "PATCH", headers: hdr(),
      });
      if (!res.ok) throw new Error(await res.text());
      onSave(await res.json());
    } catch (err) { alert("Error: " + err.message); }
    finally { setBusy(false); }
  };
  return (
    <div className="ap-overlay" onClick={onClose}>
      <div className="ap-modal ap-modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="ap-mhead"><h2>Update Stock</h2><button className="ap-mclose" onClick={onClose}>×</button></div>
        <div className="ap-mbody">
          <p className="stock-prod-name">{product.name}</p>
          <Field label="New Stock Quantity">
            <div className="qty-stepper">
              <button className="qty-btn" onClick={() => setQty(Math.max(0, qty - 1))}>−</button>
              <input type="number" min="0" value={qty} onChange={(e) => setQty(parseInt(e.target.value) || 0)} />
              <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
            </div>
          </Field>
          <div className="stock-hint">Current: {product.stockQuantity} units</div>
        </div>
        <div className="ap-mfoot">
          <button className="ap-btn ap-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ap-btn ap-btn-primary" onClick={submit} disabled={busy}>
            {busy && <span className="spin-xs" />} Update Stock
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── FIELD WRAPPER ──────────────────────────────────────────────────────────
const Field = ({ label, error, children }) => (
  <div className={`ap-field ${error ? "ap-field-err" : ""}`}>
    {label && <label>{label}</label>}
    {children}
    {error && <span className="ap-err-msg">{error}</span>}
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminPanel() {
  const navigate   = useNavigate();
  const [tab, setTab]           = useState("dashboard");
  const [adminName, setAdminName] = useState("Admin");
  const [sideOpen, setSideOpen] = useState(false);

  // Toast
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Auth
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user") || "{}");
    if (!token || user.role !== "ADMIN") { navigate("/login"); return; }
    setAdminName(user.fullName || "Admin");
  }, [navigate]);

  const logout = () => { localStorage.clear(); navigate("/"); };

  // ── PRODUCTS ────────────────────────────────────────────────────────────
  const [products,  setProducts]   = useState([]);
  const [pLoad,     setPLoad]      = useState(false);
  const [pSearch,   setPSearch]    = useState("");
  const [pCat,      setPCat]       = useState("all");
  const [pModal,    setPModal]     = useState(null);
  const [stockModal,setStockModal] = useState(null);
  const [lowStock,  setLowStock]   = useState([]);
  const [pStats,    setPStats]     = useState({});
  const [delProd,   setDelProd]    = useState(null);

  const fetchProducts = useCallback(async () => {
    setPLoad(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch(`${API}/products/all`,        { headers: hdr() }),
        fetch(`${API}/products/low-stock`,  { headers: hdr() }),
        fetch(`${API}/products/statistics`, { headers: hdr() }),
      ]);
      setProducts(r1.ok ? await r1.json() : []);
      setLowStock(r2.ok ? await r2.json() : []);
      setPStats(r3.ok   ? await r3.json() : {});
    } catch { toast("Failed to load products", "error"); }
    finally   { setPLoad(false); }
  }, [toast]);

  const toggleAvail = async (p) => {
    try {
      const res = await fetch(`${API}/products/${p.productId}/toggle-availability`, { method: "PATCH", headers: hdr() });
      if (!res.ok) throw new Error();
      const u = await res.json();
      setProducts((arr) => arr.map((x) => x.productId === u.productId ? u : x));
      toast(`${u.name} marked ${u.isAvailable ? "available" : "unavailable"}`);
    } catch { toast("Failed to toggle", "error"); }
  };

  const deleteProd = async (id) => {
    try {
      const res = await fetch(`${API}/products/${id}`, { method: "DELETE", headers: hdr() });
      if (!res.ok) throw new Error();
      setProducts((arr) => arr.filter((x) => x.productId !== id));
      toast("Product deleted");
    } catch { toast("Failed to delete", "error"); }
    finally { setDelProd(null); }
  };

  const filteredP = products.filter((p) => {
    const cat = pCat === "all" || p.category === pCat;
    const srch = !pSearch || p.name?.toLowerCase().includes(pSearch.toLowerCase()) || p.category?.toLowerCase().includes(pSearch.toLowerCase());
    return cat && srch;
  });
  const pCats = ["all", ...new Set(products.map((p) => p.category).filter(Boolean))];

  // ── ORDERS ──────────────────────────────────────────────────────────────
  const [orders,  setOrders]  = useState([]);
  const [oLoad,   setOLoad]   = useState(false);
  const [oSearch, setOSearch] = useState("");
  const [oStatus, setOStatus] = useState("all");
  const [oModal,  setOModal]  = useState(null);

  const fetchOrders = useCallback(async () => {
    setOLoad(true);
    try {
      const res = await fetch(`${API}/orders`, { headers: hdr() });
      const data = res.ok ? await res.json() : [];
      setOrders(Array.isArray(data) ? data : []);
    } catch { toast("Failed to load orders", "error"); }
    finally { setOLoad(false); }
  }, [toast]);

  const filteredO = orders.filter((o) => {
    const st = oStatus === "all" || o.status === oStatus;
    const sr = !oSearch ||
      (o.orderNumber || "").toLowerCase().includes(oSearch.toLowerCase()) ||
      (o.customerEmail || "").toLowerCase().includes(oSearch.toLowerCase()) ||
      (o.shippingName || "").toLowerCase().includes(oSearch.toLowerCase());
    return st && sr;
  });

  const oStats = {
    total:     orders.length,
    revenue:   orders.reduce((s, o) => s + parseFloat(o.finalAmount || 0), 0),
    pending:   orders.filter((o) => o.status === "PENDING").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED").length,
  };

  // ── USERS ───────────────────────────────────────────────────────────────
  const [users,   setUsers]   = useState([]);
  const [uLoad,   setULoad]   = useState(false);
  const [uSearch, setUSearch] = useState("");
  const [uModal,  setUModal]  = useState(null);
  const [delUsr,  setDelUsr]  = useState(null);

  const fetchUsers = useCallback(async () => {
    setULoad(true);
    try {
      const res = await fetch(`${API}/users/all`, { headers: hdr() });
      setUsers(res.ok ? await res.json() : []);
    } catch { toast("Failed to load users", "error"); }
    finally { setULoad(false); }
  }, [toast]);

  const deleteUser = async (id) => {
    try {
      const res = await fetch(`${API}/users/delete/${id}`, { method: "DELETE", headers: hdr() });
      if (!res.ok) throw new Error();
      setUsers((u) => u.filter((x) => x.userId !== id));
      toast("User deleted");
    } catch { toast("Failed to delete user", "error"); }
    finally { setDelUsr(null); }
  };

  const filteredU = users.filter((u) =>
    !uSearch ||
    u.fullName?.toLowerCase().includes(uSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(uSearch.toLowerCase())
  );

  // Load on tab change
  useEffect(() => {
    if (tab === "dashboard") { fetchProducts(); fetchOrders(); fetchUsers(); return; }
    if (tab === "products")  { fetchProducts(); return; }
    if (tab === "orders")    { fetchOrders(); return; }
    if (tab === "users")     { fetchUsers(); return; }
  }, [tab]);

  // Dashboard metrics
  const dash = {
    products: pStats.totalProducts    ?? products.length,
    available:pStats.availableProducts ?? products.filter(p=>p.isAvailable).length,
    lowCnt:   pStats.lowStockCount     ?? lowStock.length,
    revenue:  oStats.revenue,
    orders:   oStats.total,
    pending:  oStats.pending,
    users:    users.length,
    admins:   users.filter(u=>u.role==="ADMIN").length,
  };

  const NAV_ITEMS = [
    { key:"dashboard", icon:"◈",  label:"Dashboard" },
    { key:"products",  icon:"🥐", label:"Products",  badge: dash.lowCnt || 0 },
    { key:"orders",    icon:"📦", label:"Orders",    badge: dash.pending || 0 },
    { key:"users",     icon:"👥", label:"Users" },
  ];

  // ── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className={`ap-shell ${sideOpen ? "ap-side-open" : ""}`}>
      <ToastStack toasts={toasts} remove={removeToast} />

      {/* ═══ SIDEBAR ════════════════════════════════════════════════════ */}
      <aside className="ap-sidebar">
        <div className="ap-brand">
          <div className="ap-brand-icon">🥐</div>
          <div>
            <div className="ap-brand-name">Maison Dorée</div>
            <div className="ap-brand-sub">Admin Console</div>
          </div>
        </div>

        <nav className="ap-nav">
          {NAV_ITEMS.map((n) => (
            <button key={n.key}
              className={`ap-nav-item ${tab === n.key ? "ap-nav-active" : ""}`}
              onClick={() => { setTab(n.key); setSideOpen(false); }}>
              <span className="ap-nav-icon">{n.icon}</span>
              <span className="ap-nav-label">{n.label}</span>
              {n.badge > 0 && <span className="ap-nav-badge">{n.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="ap-admin-footer">
          <div className="ap-admin-av">{initials(adminName)}</div>
          <div className="ap-admin-info">
            <div className="ap-admin-name">{adminName}</div>
            <div className="ap-admin-role">Administrator</div>
          </div>
          <button className="ap-logout-btn" onClick={logout} title="Logout">⏻</button>
        </div>
      </aside>

      {/* ═══ MAIN ═══════════════════════════════════════════════════════ */}
      <div className="ap-main">

        {/* Topbar */}
        <header className="ap-topbar">
          <button className="ap-hamburger" onClick={() => setSideOpen(!sideOpen)}>☰</button>
          <div className="ap-topbar-title">
            {NAV_ITEMS.find((n) => n.key === tab)?.label}
          </div>
          <div className="ap-topbar-right">
            <span className="ap-role-chip">ADMIN</span>
            <div className="ap-topbar-av">{initials(adminName)}</div>
            <button className="ap-topbar-logout" onClick={logout}>Sign Out</button>
          </div>
        </header>

        <div className="ap-body">

          {/* ══════ DASHBOARD ══════════════════════════════════════════ */}
          {tab === "dashboard" && (
            <div className="ap-section">
              <div className="dash-greeting">
                <div>
                  <h1>Good day, {adminName.split(" ")[0]} 👋</h1>
                  <p className="dash-date">
                    {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}
                  </p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card kpi-brown" onClick={() => setTab("products")}>
                  <div className="kpi-icon-wrap">🥐</div>
                  <div>
                    <div className="kpi-val">{dash.products}</div>
                    <div className="kpi-lbl">Total Products</div>
                    <div className="kpi-hint">{dash.available} available</div>
                  </div>
                </div>
                <div className="kpi-card kpi-gold" onClick={() => setTab("orders")}>
                  <div className="kpi-icon-wrap">💰</div>
                  <div>
                    <div className="kpi-val kpi-val-sm">{fmt(dash.revenue)}</div>
                    <div className="kpi-lbl">Total Revenue</div>
                    <div className="kpi-hint">{dash.orders} orders</div>
                  </div>
                </div>
                <div className="kpi-card kpi-amber" onClick={() => setTab("orders")}>
                  <div className="kpi-icon-wrap">⏳</div>
                  <div>
                    <div className="kpi-val">{dash.pending}</div>
                    <div className="kpi-lbl">Pending Orders</div>
                    <div className="kpi-hint">Needs attention</div>
                  </div>
                </div>
                <div className="kpi-card kpi-teal" onClick={() => setTab("users")}>
                  <div className="kpi-icon-wrap">👥</div>
                  <div>
                    <div className="kpi-val">{dash.users}</div>
                    <div className="kpi-lbl">Total Users</div>
                    <div className="kpi-hint">{dash.admins} admins</div>
                  </div>
                </div>
              </div>

              <div className="dash-row">
                {/* Low Stock */}
                <div className="dash-card">
                  <div className="dash-card-hd">
                    <h3>⚠ Low Stock Alert</h3>
                    <button className="link-btn" onClick={() => setTab("products")}>View All →</button>
                  </div>
                  {lowStock.length === 0
                    ? <div className="dash-empty">All products well-stocked ✓</div>
                    : <div className="ls-list">
                        {lowStock.slice(0, 7).map((p) => (
                          <div key={p.productId} className="ls-item">
                            <div className="ls-left">
                              {p.imageUrl
                                ? <img src={p.imageUrl} alt="" className="ls-thumb" onError={(e)=>e.target.style.display='none'} />
                                : <div className="ls-thumb-ph">{p.name?.[0]}</div>}
                              <span className="ls-name">{p.name}</span>
                            </div>
                            <span className={`ls-qty ${p.stockQuantity <= 3 ? "ls-danger" : "ls-warn"}`}>
                              {p.stockQuantity} left
                            </span>
                          </div>
                        ))}
                      </div>
                  }
                </div>

                {/* Recent Orders */}
                <div className="dash-card">
                  <div className="dash-card-hd">
                    <h3>📦 Recent Orders</h3>
                    <button className="link-btn" onClick={() => setTab("orders")}>View All →</button>
                  </div>
                  {orders.length === 0
                    ? <div className="dash-empty">No orders yet</div>
                    : orders.slice(0, 6).map((o) => (
                        <div key={o.orderId} className="ro-item" onClick={() => { setTab("orders"); setOModal(o); }}>
                          <div className="ro-left">
                            <div className="ro-num">#{o.orderNumber}</div>
                            <div className="ro-cust">{o.shippingName || o.customerName || "—"}</div>
                          </div>
                          <div className="ro-right">
                            <span className={`status-bdg ${STATUS_CLS[o.status]}`}>{o.status}</span>
                            <div className="ro-amt">{fmt(o.finalAmount)}</div>
                          </div>
                        </div>
                      ))
                  }
                </div>
              </div>

              {/* Order Breakdown */}
              <div className="dash-card">
                <h3>📊 Order Status Breakdown</h3>
                <div className="breakdown-grid">
                  {["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"].map((s) => {
                    const cnt = orders.filter((o) => o.status === s).length;
                    const pct = orders.length ? Math.round((cnt / orders.length) * 100) : 0;
                    return (
                      <div key={s} className="bd-item">
                        <div className="bd-top">
                          <span className={`status-bdg ${STATUS_CLS[s]}`}>{s}</span>
                          <span className="bd-cnt">{cnt}</span>
                        </div>
                        <div className="bd-bar">
                          <div className={`bd-fill bd-fill-${STATUS_CLS[s]}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="bd-pct">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══════ PRODUCTS ═══════════════════════════════════════════ */}
          {tab === "products" && (
            <div className="ap-section">
              <div className="sec-head">
                <div>
                  <h2>Products</h2>
                  <p className="sec-sub">
                    {products.length} total · {pStats.availableProducts ?? "—"} available · {pStats.lowStockCount ?? 0} low stock
                  </p>
                </div>
                <button className="ap-btn ap-btn-primary" onClick={() => setPModal("add")}>
                  + Add Product
                </button>
              </div>

              <div className="ap-filter-bar">
                <div className="ap-search">
                  <span>🔍</span>
                  <input placeholder="Search products…" value={pSearch} onChange={(e) => setPSearch(e.target.value)} />
                  {pSearch && <button onClick={() => setPSearch("")}>×</button>}
                </div>
                <div className="ap-pills">
                  {pCats.map((c) => (
                    <button key={c} className={`ap-pill ${pCat === c ? "ap-pill-active" : ""}`}
                      onClick={() => setPCat(c)}>
                      {c === "all" ? "All" : c}
                    </button>
                  ))}
                </div>
              </div>

              {pLoad
                ? <div className="ap-loader-wrap"><div className="ap-loader" /></div>
                : (
                  <div className="ap-tbl-wrap">
                    <table className="ap-tbl">
                      <thead>
                        <tr>
                          <th>Product</th><th>Category</th><th>Price</th>
                          <th>Stock</th><th>Available</th><th className="th-actions">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredP.length === 0
                          ? <tr><td colSpan={6} className="tbl-empty">No products found</td></tr>
                          : filteredP.map((p) => (
                              <tr key={p.productId} className={!p.isAvailable ? "row-dim" : ""}>
                                <td>
                                  <div className="prod-cell">
                                    {p.imageUrl
                                      ? <img src={p.imageUrl} alt="" className="p-thumb" onError={(e) => e.target.style.display = "none"} />
                                      : <div className="p-thumb-ph">{p.name?.[0]}</div>}
                                    <div>
                                      <div className="p-name">{p.name}</div>
                                      <div className="p-meta">{p.unit || ""}{p.weight ? ` · ${p.weight}kg` : ""}</div>
                                    </div>
                                  </div>
                                </td>
                                <td><span className="p-cat-tag">{p.category}</span></td>
                                <td className="td-price">{fmt(p.price)}</td>
                                <td>
                                  <div className="stock-cell">
                                    <span className={`stock-num ${p.stockQuantity <= 5 ? "sn-low" : p.stockQuantity <= 15 ? "sn-mid" : "sn-ok"}`}>
                                      {p.stockQuantity}
                                    </span>
                                    <button className="icon-act" title="Update stock" onClick={() => setStockModal(p)}>📦</button>
                                  </div>
                                </td>
                                <td>
                                  <label className="ap-toggle">
                                    <input type="checkbox" checked={!!p.isAvailable} onChange={() => toggleAvail(p)} />
                                    <span className="ap-toggle-slider" />
                                  </label>
                                </td>
                                <td>
                                  <div className="acts">
                                    <button className="icon-act act-edit" title="Edit" onClick={() => setPModal(p)}>✏</button>
                                    <button className="icon-act act-del"  title="Delete" onClick={() => setDelProd(p)}>🗑</button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        }
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          )}

          {/* ══════ ORDERS ═════════════════════════════════════════════ */}
          {tab === "orders" && (
            <div className="ap-section">
              <div className="sec-head">
                <div>
                  <h2>Orders</h2>
                  <p className="sec-sub">{oStats.total} total · Revenue {fmt(oStats.revenue)}</p>
                </div>
                <button className="ap-btn ap-btn-ghost" onClick={fetchOrders}>↻ Refresh</button>
              </div>

              {/* Mini KPIs */}
              <div className="o-kpi-row">
                {[
                  { label:"Total",     val: oStats.total,     cls:"" },
                  { label:"Pending",   val: oStats.pending,   cls:"okpi-amber" },
                  { label:"Delivered", val: oStats.delivered, cls:"okpi-teal"  },
                  { label:"Cancelled", val: oStats.cancelled, cls:"okpi-red"   },
                ].map((k, i) => (
                  <div key={i} className={`o-kpi ${k.cls}`}>
                    <div className="o-kpi-v">{k.val}</div>
                    <div className="o-kpi-l">{k.label}</div>
                  </div>
                ))}
              </div>

              <div className="ap-filter-bar">
                <div className="ap-search">
                  <span>🔍</span>
                  <input placeholder="Search order #, customer…" value={oSearch} onChange={(e) => setOSearch(e.target.value)} />
                  {oSearch && <button onClick={() => setOSearch("")}>×</button>}
                </div>
                <div className="ap-pills">
                  {["all","PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED","REFUNDED"].map((s) => (
                    <button key={s} className={`ap-pill ${oStatus === s ? "ap-pill-active" : ""}`}
                      onClick={() => setOStatus(s)}>
                      {s === "all" ? "All" : s}
                    </button>
                  ))}
                </div>
              </div>

              {oLoad
                ? <div className="ap-loader-wrap"><div className="ap-loader" /></div>
                : (
                  <div className="ap-tbl-wrap">
                    <table className="ap-tbl">
                      <thead>
                        <tr>
                          <th>Order #</th><th>Customer</th><th>Items</th>
                          <th>Amount</th><th>Payment</th><th>Status</th><th>Date</th><th className="th-actions">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredO.length === 0
                          ? <tr><td colSpan={8} className="tbl-empty">No orders found</td></tr>
                          : filteredO.map((o) => (
                              <tr key={o.orderId}>
                                <td><span className="ord-num">#{o.orderNumber}</span></td>
                                <td>
                                  <div className="usr-cell">
                                    <div className="usr-av-sm">{initials(o.shippingName || o.customerName)}</div>
                                    <div>
                                      <div className="usr-name-s">{o.shippingName || o.customerName || "—"}</div>
                                      <div className="usr-email-s">{o.customerEmail || "—"}</div>
                                    </div>
                                  </div>
                                </td>
                                <td><span className="items-cnt">{o.orderItems?.length ?? 0} items</span></td>
                                <td className="td-price">{fmt(o.finalAmount)}</td>
                                <td>
                                  <span className={`pay-bdg ${PAY_CLS[o.paymentStatus]}`}>{o.paymentStatus}</span>
                                  <div className="pay-method-s">{o.paymentMethod || "—"}</div>
                                </td>
                                <td><span className={`status-bdg ${STATUS_CLS[o.status]}`}>{o.status}</span></td>
                                <td className="td-date">{fmtDate(o.createdAt)}</td>
                                <td>
                                  <button className="icon-act act-view" onClick={() => setOModal(o)} title="View Details">👁</button>
                                </td>
                              </tr>
                            ))
                        }
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          )}

          {/* ══════ USERS ══════════════════════════════════════════════ */}
          {tab === "users" && (
            <div className="ap-section">
              <div className="sec-head">
                <div>
                  <h2>Users</h2>
                  <p className="sec-sub">{users.length} total · {users.filter(u=>u.role==="ADMIN").length} admins</p>
                </div>
                <button className="ap-btn ap-btn-ghost" onClick={fetchUsers}>↻ Refresh</button>
              </div>

              <div className="ap-filter-bar">
                <div className="ap-search">
                  <span>🔍</span>
                  <input placeholder="Search by name or email…" value={uSearch} onChange={(e) => setUSearch(e.target.value)} />
                  {uSearch && <button onClick={() => setUSearch("")}>×</button>}
                </div>
              </div>

              {uLoad
                ? <div className="ap-loader-wrap"><div className="ap-loader" /></div>
                : (
                  <div className="ap-tbl-wrap">
                    <table className="ap-tbl">
                      <thead>
                        <tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th className="th-actions">Actions</th></tr>
                      </thead>
                      <tbody>
                        {filteredU.length === 0
                          ? <tr><td colSpan={5} className="tbl-empty">No users found</td></tr>
                          : filteredU.map((u) => (
                              <tr key={u.userId} className={u.role === "ADMIN" ? "row-admin" : ""}>
                                <td>
                                  <div className="usr-cell">
                                    <div className={`usr-av ${u.role==="ADMIN"?"usr-av-admin":""}`}>{initials(u.fullName)}</div>
                                    <span className="usr-name-s">{u.fullName}</span>
                                  </div>
                                </td>
                                <td className="usr-email-s">{u.email}</td>
                                <td>{u.phoneNumber || "—"}</td>
                                <td><span className={`role-tag ${u.role==="ADMIN"?"rt-admin":"rt-user"}`}>{u.role}</span></td>
                                <td>
                                  <div className="acts">
                                    <button className="icon-act act-edit" onClick={() => setUModal(u)} title="Edit">✏</button>
                                    <button className="icon-act act-del"  onClick={() => setDelUsr(u)}  title="Delete">🗑</button>
                                  </div>
                                </td>
                              </tr>
                            ))
                        }
                      </tbody>
                    </table>
                  </div>
                )
              }
            </div>
          )}

        </div>{/* ap-body */}
      </div>{/* ap-main */}

      {/* ═══ MODALS ═══════════════════════════════════════════════════════ */}
      {(pModal === "add" || pModal?.productId) && (
        <ProductModal
          product={pModal === "add" ? null : pModal}
          onClose={() => setPModal(null)}
          onSave={(saved, isEdit) => {
            setProducts((a) => isEdit ? a.map((x) => x.productId === saved.productId ? saved : x) : [saved, ...a]);
            setPModal(null);
            toast(isEdit ? "Product updated ✓" : "Product added ✓");
          }}
        />
      )}
      {stockModal && (
        <StockModal product={stockModal} onClose={() => setStockModal(null)}
          onSave={(s) => {
            setProducts((a) => a.map((x) => x.productId === s.productId ? s : x));
            setStockModal(null);
            toast(`Stock updated for ${s.name}`);
          }} />
      )}
      {oModal && (
        <OrderModal order={oModal} onClose={() => setOModal(null)}
          onUpdate={(u) => {
            setOrders((a) => a.map((x) => x.orderId === u.orderId ? u : x));
            setOModal(null);
            toast("Order updated ✓");
          }} />
      )}
      {uModal && (
        <UserModal user={uModal} onClose={() => setUModal(null)}
          onSave={(s) => {
            setUsers((a) => a.map((x) => x.userId === s.userId ? s : x));
            setUModal(null);
            toast("User updated ✓");
          }} />
      )}
      {delProd && (
        <ConfirmBox msg={`Delete "${delProd.name}"? This cannot be undone.`}
          onOk={() => deleteProd(delProd.productId)} onCancel={() => setDelProd(null)} />
      )}
      {delUsr && (
        <ConfirmBox msg={`Delete user "${delUsr.fullName}"? This cannot be undone.`}
          onOk={() => deleteUser(delUsr.userId)} onCancel={() => setDelUsr(null)} />
      )}

      {sideOpen && <div className="sb-overlay" onClick={() => setSideOpen(false)} />}
    </div>
  );
}