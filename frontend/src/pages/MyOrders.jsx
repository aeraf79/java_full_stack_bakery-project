import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Package, MapPin, Calendar, Clock, ChevronDown,
  ChevronUp, ShoppingBag, Truck, CheckCircle, XCircle,
  RefreshCw, AlertCircle, RotateCcw, CreditCard, Phone,
  Home, Search, Filter, Eye, Banknote, Star, Download,
  Receipt, TrendingUp, Box, Hash, Award, Copy, Check,
  ChevronRight, Info, Layers
} from 'lucide-react';
import './MyOrders.css';

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    color: '#d97706', bg: '#fef3c7', border: '#fcd34d', icon: Clock,       step: 0 },
  CONFIRMED:  { label: 'Confirmed',  color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', icon: CheckCircle, step: 1 },
  PROCESSING: { label: 'Processing', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', icon: RefreshCw,   step: 2 },
  SHIPPED:    { label: 'Shipped',    color: '#0891b2', bg: '#cffafe', border: '#67e8f9', icon: Truck,        step: 3 },
  DELIVERED:  { label: 'Delivered',  color: '#059669', bg: '#d1fae5', border: '#6ee7b7', icon: CheckCircle, step: 4 },
  CANCELLED:  { label: 'Cancelled',  color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: XCircle,     step: -1 },
  REFUNDED:   { label: 'Refunded',   color: '#4b5563', bg: '#f3f4f6', border: '#d1d5db', icon: RotateCcw,  step: -1 },
};

const PAYMENT_CONFIG = {
  PENDING:  { label: 'Pending',  color: '#d97706', bg: '#fef3c7' },
  PAID:     { label: 'Paid',     color: '#059669', bg: '#d1fae5' },
  FAILED:   { label: 'Failed',   color: '#dc2626', bg: '#fee2e2' },
  REFUNDED: { label: 'Refunded', color: '#4b5563', bg: '#f3f4f6' },
};

const PAYMENT_METHOD_CONFIG = {
  RAZORPAY: { label: 'Razorpay',          icon: CreditCard, color: '#2563eb' },
  COD:      { label: 'Cash on Delivery',  icon: Banknote,   color: '#059669' },
  WALLET:   { label: 'Wallet',            icon: Award,      color: '#7c3aed' },
};

const TRACK_STEPS = [
  { key: 'CONFIRMED',  label: 'Confirmed',  icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED',    label: 'Shipped',    icon: Truck },
  { key: 'DELIVERED',  label: 'Delivered',  icon: Award },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatPrice = (p) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(p || 0);

const formatDate = (d, short = false) => {
  if (!d) return '—';
  const date = new Date(d);
  if (short) return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  return date.toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

const getRelativeTime = (d) => {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return formatDate(d, true);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatsBar({ orders }) {
  const stats = useMemo(() => {
    const total     = orders.length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const active    = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING','SHIPPED'].includes(o.status)).length;
    const spent     = orders
      .filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
      .reduce((sum, o) => sum + parseFloat(o.finalAmount || 0), 0);
    return { total, delivered, active, spent };
  }, [orders]);

  return (
    <div className="stats-bar">
      <div className="stat-item">
        <div className="stat-icon-wrap stat-blue"><Receipt size={18} /></div>
        <div className="stat-text">
          <span className="stat-num">{stats.total}</span>
          <span className="stat-lbl">Total Orders</span>
        </div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-icon-wrap stat-green"><CheckCircle size={18} /></div>
        <div className="stat-text">
          <span className="stat-num">{stats.delivered}</span>
          <span className="stat-lbl">Delivered</span>
        </div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-icon-wrap stat-amber"><Truck size={18} /></div>
        <div className="stat-text">
          <span className="stat-num">{stats.active}</span>
          <span className="stat-lbl">Active</span>
        </div>
      </div>
      <div className="stat-divider" />
      <div className="stat-item">
        <div className="stat-icon-wrap stat-brown"><TrendingUp size={18} /></div>
        <div className="stat-text">
          <span className="stat-num">{formatPrice(stats.spent)}</span>
          <span className="stat-lbl">Total Spent</span>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <button className="copy-btn" onClick={handleCopy} title="Copy order number">
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function OrderTracker({ status, createdAt, paidAt, deliveredAt }) {
  const currentStep = STATUS_CONFIG[status]?.step ?? 0;
  if (currentStep < 0) return null;

  return (
    <div className="tracker-wrap">
      <div className="tracker-header">
        <Layers size={15} /> Order Progress
      </div>
      <div className="tracker-steps">
        {TRACK_STEPS.map((step, i) => {
          const StepIcon = step.icon;
          const stepNum  = i + 1;
          const done     = currentStep > stepNum - 1;
          const active   = currentStep === stepNum - 1 + 1;
          // label for tooltip
          const dateMap  = { CONFIRMED: paidAt || createdAt, DELIVERED: deliveredAt };
          return (
            <React.Fragment key={step.key}>
              <div className={`t-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                <div className="t-circle">
                  {done
                    ? <CheckCircle size={15} />
                    : active
                    ? <StepIcon size={14} />
                    : <span>{stepNum}</span>
                  }
                </div>
                <span className="t-lbl">{step.label}</span>
                {(done || active) && dateMap[step.key] && (
                  <span className="t-date">{formatDate(dateMap[step.key], true)}</span>
                )}
              </div>
              {i < TRACK_STEPS.length - 1 && (
                <div className={`t-line ${done ? 'done' : active ? 'half' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ItemsTable({ items }) {
  return (
    <div className="items-table-wrap">
      <table className="items-table">
        <thead>
          <tr>
            <th>Product</th>
            <th className="center">Qty</th>
            <th className="right">Unit Price</th>
            <th className="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((item, i) => (
            <tr key={i}>
              <td>
                <div className="item-cell">
                  <img
                    src={item.productImageUrl || `https://placehold.co/48x48/f2e4d8/8B4513?text=${encodeURIComponent((item.productName || 'P')[0])}`}
                    alt={item.productName}
                    onError={e => { e.target.src = 'https://placehold.co/48x48/f2e4d8/8B4513?text=🥖'; }}
                  />
                  <span className="item-name">{item.productName}</span>
                </div>
              </td>
              <td className="center">
                <span className="qty-badge">× {item.quantity}</span>
              </td>
              <td className="right text-muted">{formatPrice(item.price || item.priceAtPurchase)}</td>
              <td className="right item-subtotal">{formatPrice(item.subtotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddressCard({ order }) {
  return (
    <div className="info-card">
      <div className="info-card-title"><MapPin size={15} /> Delivery Address</div>
      <div className="addr-name">{order.shippingName}</div>
      <div className="addr-line"><Phone size={13} />{order.shippingPhone}</div>
      <div className="addr-line"><Home size={13} />{order.shippingAddress}</div>
      <div className="addr-line city-line">
        <MapPin size={13} />
        {order.shippingCity}, {order.shippingState}
        <span className="pincode-badge">{order.shippingPincode}</span>
      </div>
      {order.orderNotes && (
        <div className="order-notes-box">
          <Info size={13} /> {order.orderNotes}
        </div>
      )}
    </div>
  );
}

function PaymentCard({ order }) {
  const payStatus = PAYMENT_CONFIG[order.paymentStatus] || PAYMENT_CONFIG.PENDING;
  const methodCfg = PAYMENT_METHOD_CONFIG[order.paymentMethod];
  const MethodIcon = methodCfg?.icon || CreditCard;

  return (
    <div className="info-card">
      <div className="info-card-title"><CreditCard size={15} /> Payment Details</div>

      <div className="pay-method-row">
        <div className="pay-method-icon">
          <MethodIcon size={16} />
        </div>
        <div className="pay-method-info">
          <span className="pay-method-name">{methodCfg?.label || order.paymentMethod || '—'}</span>
          <span
            className="pay-status-chip"
            style={{ color: payStatus.color, background: payStatus.bg }}
          >
            {payStatus.label}
          </span>
        </div>
      </div>

      <div className="pay-breakdown">
        <div className="pay-row">
          <span>Subtotal</span>
          <span>{formatPrice(order.totalAmount)}</span>
        </div>
        {parseFloat(order.discountAmount) > 0 && (
          <div className="pay-row green">
            <span>Discount</span>
            <span>− {formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="pay-row">
          <span>Shipping</span>
          <span>{parseFloat(order.shippingFee) > 0 ? formatPrice(order.shippingFee) : <span className="free-tag">FREE</span>}</span>
        </div>
        <div className="pay-row total">
          <span>Total</span>
          <span>{formatPrice(order.finalAmount)}</span>
        </div>
      </div>

      {order.paidAt && (
        <div className="paid-at-row">
          <CheckCircle size={13} />
          <span>Paid on {formatDate(order.paidAt)}</span>
        </div>
      )}
      {order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING' && (
        <div className="cod-reminder">
          <Banknote size={13} />
          <span>Keep {formatPrice(order.finalAmount)} ready for delivery</span>
        </div>
      )}
    </div>
  );
}

function OrderTimeline({ order }) {
  const events = [
    { label: 'Order Placed',       date: order.createdAt,   active: true },
    { label: 'Payment Received',   date: order.paidAt,      active: !!order.paidAt },
    { label: 'Order Delivered',    date: order.deliveredAt, active: !!order.deliveredAt },
  ].filter(Boolean);

  return (
    <div className="info-card timeline-card">
      <div className="info-card-title"><Clock size={15} /> Timeline</div>
      <div className="timeline-list">
        {events.map((ev, i) => (
          <div key={i} className={`tl-item ${ev.active ? 'active' : ''}`}>
            <div className="tl-dot-wrap">
              <div className={`tl-dot ${ev.active ? 'active' : ''}`} />
              {i < events.length - 1 && <div className={`tl-line ${ev.active ? 'active' : ''}`} />}
            </div>
            <div className="tl-body">
              <span className="tl-label">{ev.label}</span>
              <span className="tl-date">{ev.date ? formatDate(ev.date) : '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery]   = useState('');
  const [sortBy, setSortBy]             = useState('newest');
  const [activeTab, setActiveTab]       = useState('items'); // 'items' | 'address' | 'payment' | 'timeline'

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) { navigate('/login'); return; }
        throw new Error('Failed to load orders');
      }
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (orderId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(orderId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Failed to cancel order');
      }
      showToast('Order cancelled successfully', 'success');
      fetchOrders();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<div class="toast-content">
      ${type === 'success'
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
      }
      <span>${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  const filtered = useMemo(() => {
    let list = [...orders];
    // Filter
    if (filterStatus !== 'ALL') list = list.filter(o => o.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.shippingName?.toLowerCase().includes(q) ||
        o.orderItems?.some(i => i.productName?.toLowerCase().includes(q))
      );
    }
    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest')   return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest')   return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'highest')  return parseFloat(b.finalAmount) - parseFloat(a.finalAmount);
      if (sortBy === 'lowest')   return parseFloat(a.finalAmount) - parseFloat(b.finalAmount);
      return 0;
    });
    return list;
  }, [orders, filterStatus, searchQuery, sortBy]);

  const canCancel = (status) => ['PENDING', 'CONFIRMED'].includes(status);

  const toggleExpand = (orderId) => {
    setExpandedOrder(prev => prev === orderId ? null : orderId);
    setActiveTab('items');
  };

  const statusCounts = useMemo(() => {
    const counts = {};
    orders.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
    return counts;
  }, [orders]);

  return (
    <div className="mo-page">
      <div className="mo-bg" aria-hidden="true">
        <div className="mo-blob mo-blob-1" />
        <div className="mo-blob mo-blob-2" />
        <div className="mo-blob mo-blob-3" />
        <div className="mo-grain" />
      </div>

      <div className="mo-container">

        {/* ── Top Bar ── */}
        <header className="mo-topbar">
          <button className="mo-back-btn" onClick={() => navigate('/userpanel')}>
            <ArrowLeft size={16} />
            <span>Back to Shop</span>
          </button>

          <div className="mo-title-group">
            <div className="mo-title-icon">
              <ShoppingBag size={22} />
            </div>
            <div>
              <h1>My Orders</h1>
              <p>{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
            </div>
          </div>

          <button className="mo-refresh-btn" onClick={fetchOrders} title="Refresh orders">
            <RefreshCw size={16} />
          </button>
        </header>

        {/* ── Stats Bar ── */}
        {!loading && !error && orders.length > 0 && <StatsBar orders={orders} />}

        {/* ── Controls ── */}
        <div className="mo-controls">
          <div className="mo-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by order #, product, or name…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                <XCircle size={15} />
              </button>
            )}
          </div>

          <div className="mo-sort">
            <Filter size={14} />
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>
        </div>

        {/* ── Status Filter Pills ── */}
        <div className="mo-filters">
          <button
            className={`mo-pill ${filterStatus === 'ALL' ? 'active-all' : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            All
            <span className="pill-count">{orders.length}</span>
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = statusCounts[key] || 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                className={`mo-pill ${filterStatus === key ? 'active-status' : ''}`}
                onClick={() => setFilterStatus(key)}
                style={filterStatus === key ? {
                  background: cfg.bg, color: cfg.color, borderColor: cfg.border
                } : {}}
              >
                {cfg.label}
                <span className="pill-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="mo-loading">
            <div className="mo-spinner">
              <div className="spinner-ring" />
              <div className="spinner-bread">🥐</div>
            </div>
            <p>Loading your orders…</p>
          </div>
        ) : error ? (
          <div className="mo-state-box mo-error">
            <div className="state-icon-wrap error"><AlertCircle size={32} /></div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button className="mo-cta-btn" onClick={fetchOrders}>
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mo-state-box mo-empty">
            <div className="empty-visual">
              <div className="empty-plate">🍽️</div>
              <div className="empty-crumbs">✦ ✦ ✦</div>
            </div>
            <h3>{orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}</h3>
            <p>{orders.length === 0
              ? 'Your order history will appear here once you place your first order.'
              : 'Try adjusting your search or filter to find what you\'re looking for.'
            }</p>
            {orders.length === 0
              ? <button className="mo-cta-btn" onClick={() => navigate('/userpanel')}>
                  <ShoppingBag size={16} /> Start Shopping
                </button>
              : <button className="mo-cta-btn" onClick={() => { setFilterStatus('ALL'); setSearchQuery(''); }}>
                  <XCircle size={16} /> Clear Filters
                </button>
            }
          </div>
        ) : (
          <div className="mo-list">
            {filtered.map((order, idx) => {
              const statusCfg    = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const StatusIcon   = statusCfg.icon;
              const isExpanded   = expandedOrder === order.orderId;
              const isCancellable = canCancel(order.status);
              const methodCfg    = PAYMENT_METHOD_CONFIG[order.paymentMethod];
              const MethodIcon   = methodCfg?.icon || CreditCard;

              return (
                <div
                  key={order.orderId}
                  className={`mo-card ${isExpanded ? 'mo-card--open' : ''}`}
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  {/* ── Card Header ── */}
                  <div className="mo-card-header" onClick={() => toggleExpand(order.orderId)}>
                    {/* Left: order info */}
                    <div className="mo-card-left">
                      <div className="mo-order-num-row">
                        <Hash size={13} className="hash-icon" />
                        <span className="mo-order-num">{order.orderNumber}</span>
                        <CopyButton text={order.orderNumber} />
                      </div>
                      <div className="mo-order-meta">
                        <span className="mo-meta-item">
                          <Calendar size={12} />
                          {formatDate(order.createdAt)}
                        </span>
                        <span className="mo-time-ago">{getRelativeTime(order.createdAt)}</span>
                      </div>
                      <div className="mo-payment-method-row">
                        <MethodIcon size={12} />
                        <span>{methodCfg?.label || order.paymentMethod || 'Online'}</span>
                        {order.orderItems?.length > 0 && (
                          <>
                            <span className="dot-sep">·</span>
                            <Box size={12} />
                            <span>{order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: amount + status */}
                    <div className="mo-card-right">
                      <div className="mo-amount">{formatPrice(order.finalAmount)}</div>
                      <div
                        className="mo-status-badge"
                        style={{ color: statusCfg.color, background: statusCfg.bg, borderColor: statusCfg.border }}
                      >
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </div>
                      <div className="mo-expand-btn">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>
                  </div>

                  {/* ── Items Preview Strip (collapsed) ── */}
                  {!isExpanded && (
                    <div className="mo-preview-strip">
                      <div className="mo-preview-imgs">
                        {(order.orderItems || []).slice(0, 4).map((item, i) => (
                          <div key={i} className="preview-img-wrap" title={item.productName}>
                            <img
                              src={item.productImageUrl || `https://placehold.co/40x40/f2e4d8/8B4513?text=${encodeURIComponent((item.productName || 'P')[0])}`}
                              alt={item.productName}
                              onError={e => { e.target.src = 'https://placehold.co/40x40/f2e4d8/8B4513?text=🥖'; }}
                            />
                          </div>
                        ))}
                        {(order.orderItems?.length || 0) > 4 && (
                          <div className="preview-more">+{order.orderItems.length - 4}</div>
                        )}
                      </div>
                      <div className="mo-preview-names">
                        {(order.orderItems || []).slice(0, 2).map((item, i) => (
                          <span key={i} className="preview-pill">{item.productName}</span>
                        ))}
                        {(order.orderItems?.length || 0) > 2 && (
                          <span className="preview-pill muted">+{order.orderItems.length - 2} more</span>
                        )}
                      </div>
                      {isCancellable && (
                        <button
                          className="quick-cancel-btn"
                          onClick={(e) => handleCancel(order.orderId, e)}
                          disabled={cancellingId === order.orderId}
                        >
                          {cancellingId === order.orderId
                            ? <RefreshCw size={13} className="spin" />
                            : <XCircle size={13} />
                          }
                          Cancel
                        </button>
                      )}
                    </div>
                  )}

                  {/* ── Expanded Body ── */}
                  {isExpanded && (
                    <div className="mo-body">

                      {/* Progress Tracker */}
                      <OrderTracker
                        status={order.status}
                        createdAt={order.createdAt}
                        paidAt={order.paidAt}
                        deliveredAt={order.deliveredAt}
                      />

                      {/* Cancelled / Refunded note */}
                      {(order.status === 'CANCELLED' || order.status === 'REFUNDED') && (
                        <div className="mo-status-note" style={{ borderColor: statusCfg.border, color: statusCfg.color, background: statusCfg.bg }}>
                          <StatusIcon size={16} />
                          <span>
                            {order.status === 'CANCELLED'
                              ? 'This order has been cancelled.'
                              : 'This order has been refunded. Please allow 5–7 business days for the amount to reflect.'
                            }
                          </span>
                        </div>
                      )}

                      {/* COD badge */}
                      {order.paymentMethod === 'COD' && order.paymentStatus === 'PENDING' && (
                        <div className="mo-cod-banner">
                          <Banknote size={16} />
                          <div>
                            <strong>Cash on Delivery</strong>
                            <span>Please keep {formatPrice(order.finalAmount)} ready when your order arrives.</span>
                          </div>
                        </div>
                      )}

                      {/* Tab navigation */}
                      <div className="mo-tabs">
                        {[
                          { id: 'items',    label: 'Items',    icon: Package },
                          { id: 'address',  label: 'Delivery', icon: MapPin },
                          { id: 'payment',  label: 'Payment',  icon: CreditCard },
                          { id: 'timeline', label: 'Timeline', icon: Clock },
                        ].map(tab => {
                          const TabIcon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              className={`mo-tab ${activeTab === tab.id ? 'mo-tab--active' : ''}`}
                              onClick={() => setActiveTab(tab.id)}
                            >
                              <TabIcon size={14} />
                              {tab.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab content */}
                      <div className="mo-tab-body">
                        {activeTab === 'items' && <ItemsTable items={order.orderItems} />}
                        {activeTab === 'address' && <AddressCard order={order} />}
                        {activeTab === 'payment' && <PaymentCard order={order} />}
                        {activeTab === 'timeline' && <OrderTimeline order={order} />}
                      </div>

                      {/* Order summary footer */}
                      <div className="mo-order-footer">
                        <div className="mo-footer-info">
                          <span className="mo-footer-num">#{order.orderNumber}</span>
                          <span className="mo-footer-total">{formatPrice(order.finalAmount)}</span>
                        </div>
                        <div className="mo-footer-actions">
                          {isCancellable && (
                            <button
                              className="btn-cancel"
                              onClick={(e) => handleCancel(order.orderId, e)}
                              disabled={cancellingId === order.orderId}
                            >
                              {cancellingId === order.orderId
                                ? <><RefreshCw size={14} className="spin" /> Cancelling…</>
                                : <><XCircle size={14} /> Cancel Order</>
                              }
                            </button>
                          )}
                          <button className="btn-shop" onClick={() => navigate('/userpanel')}>
                            <ShoppingBag size={14} /> Shop Again
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Results info ── */}
        {!loading && filtered.length > 0 && (filterStatus !== 'ALL' || searchQuery) && (
          <div className="mo-results-info">
            Showing {filtered.length} of {orders.length} orders
            <button onClick={() => { setFilterStatus('ALL'); setSearchQuery(''); }}>Clear filters</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyOrders;