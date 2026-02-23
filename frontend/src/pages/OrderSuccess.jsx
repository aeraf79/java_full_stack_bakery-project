import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, Package, MapPin, Calendar, ArrowRight, Home,
  ShoppingBag, Truck, Clock, CreditCard, Phone, Star,
  Banknote, Copy, Check, Info, Mail, ChevronRight,
  PartyPopper, Gift, Heart, Sparkles
} from 'lucide-react';
import './OrderSuccess.css';

const STEPS = [
  { icon: CheckCircle, label: 'Confirmed',  desc: 'Order received & verified',  key: 'CONFIRMED'  },
  { icon: Package,     label: 'Baking',     desc: 'Freshly prepared for you',   key: 'PROCESSING' },
  { icon: Truck,       label: 'On the Way', desc: 'Out for delivery',           key: 'SHIPPED'    },
  { icon: Star,        label: 'Delivered',  desc: 'Enjoy your bakes!',          key: 'DELIVERED'  },
];

const STATUS_STEP = {
  PENDING: 0, CONFIRMED: 0, PROCESSING: 1, SHIPPED: 2, DELIVERED: 3
};

const PAYMENT_METHOD_LABELS = {
  RAZORPAY: { label: 'Razorpay',         icon: CreditCard, color: '#2563eb', bg: '#dbeafe' },
  COD:      { label: 'Cash on Delivery', icon: Banknote,   color: '#059669', bg: '#d1fae5' },
  WALLET:   { label: 'Wallet',           icon: Gift,       color: '#7c3aed', bg: '#ede9fe' },
};

export default function OrderSuccess() {
  const navigate  = useNavigate();
  const location  = useLocation();

  const orderNumber   = location.state?.orderNumber;
  const orderId       = location.state?.orderId;
  const paymentMethod = location.state?.paymentMethod || 'RAZORPAY';

  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [copied, setCopied]             = useState(false);
  const [confetti, setConfetti]         = useState([]);

  const isCOD = paymentMethod === 'COD';

  useEffect(() => {
    if (!orderNumber) { navigate('/userpanel'); return; }
    fetchOrderDetails();
    setConfetti(
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left:    Math.random() * 100,
        delay:   Math.random() * 2.5,
        dur:     2.5 + Math.random() * 2,
        color:   ['#8B4513','#D2691E','#F4A460','#DEB887','#FFDEAD','#CD853F','#c8845a','#fef3c7'][i % 8],
        size:    7 + Math.random() * 9,
        rotate:  Math.random() * 360,
        shape:   i % 3, // 0=circle, 1=square, 2=rect
      }))
    );
  }, []);

  const fetchOrderDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`http://localhost:8080/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setOrderDetails(await res.json());
    } catch { /* silently skip */ }
    finally { setLoading(false); }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(orderNumber || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatPrice = (p) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(p || 0);

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const currentStep  = STATUS_STEP[orderDetails?.status] ?? 0;
  const methodConfig = PAYMENT_METHOD_LABELS[orderDetails?.paymentMethod || paymentMethod] || PAYMENT_METHOD_LABELS.RAZORPAY;
  const MethodIcon   = methodConfig.icon;

  return (
    <div className="os-page">

      {/* ── Confetti ── */}
      <div className="os-confetti" aria-hidden="true">
        {confetti.map(p => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              width:  p.shape === 2 ? p.size * 1.8 : p.size,
              height: p.size,
              background: p.color,
              borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? '2px' : '3px',
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ))}
      </div>

      {/* ── Background decoration ── */}
      <div className="os-bg" aria-hidden="true">
        <div className="os-blob os-blob-1" />
        <div className="os-blob os-blob-2" />
      </div>

      <div className="os-container">

        {/* ── Hero Check ── */}
        <div className="os-hero">
          <div className="os-rings">
            <div className="os-ring os-ring-3" />
            <div className="os-ring os-ring-2" />
            <div className="os-ring os-ring-1" />
            <div className="os-check-icon">
              <CheckCircle size={52} strokeWidth={2} />
            </div>
          </div>

          <div className="os-hero-text">
            <h1 className="os-title">
              {isCOD ? 'Order Confirmed! 🎊' : 'Payment Successful! 🎉'}
            </h1>
            <p className="os-subtitle">
              Thank you for choosing <strong>Maison Dorée</strong>.
              {isCOD
                ? ' Your order is confirmed and will be delivered soon!'
                : ' Your fresh bakes are being prepared with love!'}
            </p>
          </div>
        </div>

        {/* ── Order Number ── */}
        <div className="os-number-card">
          <div className="os-num-inner">
            <div className="os-num-left">
              <span className="os-num-label">Order Number</span>
              <span className="os-num-value">#{orderNumber}</span>
              <span className="os-num-hint">Keep this for tracking your order</span>
            </div>
            <button
              className={`os-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy order number"
            >
              {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy</>}
            </button>
          </div>

          {/* COD reminder strip */}
          {isCOD && (
            <div className="os-cod-strip">
              <Banknote size={16} />
              <div>
                <strong>Cash on Delivery</strong>
                <span>
                  Please keep {orderDetails ? formatPrice(orderDetails.finalAmount) : 'the exact amount'} ready when your order arrives.
                </span>
              </div>
            </div>
          )}

          {/* Razorpay paid strip */}
          {!isCOD && (
            <div className="os-paid-strip">
              <CheckCircle size={15} />
              <span>Payment confirmed · Secured by Razorpay</span>
            </div>
          )}
        </div>

        {/* ── Journey tracker ── */}
        <div className="os-journey-card">
          <div className="os-card-title">
            <Truck size={16} /> Your Order Journey
          </div>
          <div className="os-steps">
            {STEPS.map((step, i) => {
              const Icon   = step.icon;
              const done   = currentStep > i;
              const active = currentStep === i;
              return (
                <React.Fragment key={step.key}>
                  <div className={`os-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
                    <div className="os-step-circle">
                      {done ? <Check size={17} /> : <Icon size={17} />}
                    </div>
                    <div className="os-step-info">
                      <span className="os-step-label">{step.label}</span>
                      <span className="os-step-desc">{step.desc}</span>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`os-connector ${done ? 'done' : active ? 'half' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── Order Details (loaded) ── */}
        {!loading && orderDetails && (
          <>
            {/* Summary + Delivery */}
            <div className="os-grid-2">

              {/* Delivery Details */}
              <div className="os-card">
                <div className="os-card-head">
                  <MapPin size={15} /> Delivery Details
                </div>
                <div className="os-card-body">
                  <div className="os-delivery-name">{orderDetails.shippingName}</div>
                  <div className="os-delivery-rows">
                    <div className="os-drow">
                      <Phone size={13} />
                      <span>{orderDetails.shippingPhone}</span>
                    </div>
                    <div className="os-drow">
                      <Home size={13} />
                      <span>{orderDetails.shippingAddress}</span>
                    </div>
                    <div className="os-drow">
                      <MapPin size={13} />
                      <span>{orderDetails.shippingCity}, {orderDetails.shippingState}</span>
                      <span className="os-pincode">{orderDetails.shippingPincode}</span>
                    </div>
                    {orderDetails.orderNotes && (
                      <div className="os-notes-row">
                        <Info size={12} /> {orderDetails.orderNotes}
                      </div>
                    )}
                  </div>
                  <div className="os-delivery-date">
                    <Calendar size={13} />
                    <span>Placed on {formatDate(orderDetails.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="os-card">
                <div className="os-card-head">
                  <CreditCard size={15} /> Payment Summary
                </div>
                <div className="os-card-body">
                  <div className="os-pay-method">
                    <div className="os-pay-method-icon" style={{ background: methodConfig.bg, color: methodConfig.color }}>
                      <MethodIcon size={18} />
                    </div>
                    <div>
                      <div className="os-pay-method-name">{methodConfig.label}</div>
                      <div
                        className="os-pay-status"
                        style={{
                          color: orderDetails.paymentStatus === 'PAID' ? '#059669' : '#d97706',
                          background: orderDetails.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7'
                        }}
                      >
                        {orderDetails.paymentStatus === 'PAID' ? '✓ Paid' : '⏳ Pay on Delivery'}
                      </div>
                    </div>
                  </div>

                  <div className="os-price-rows">
                    <div className="os-price-row">
                      <span>Subtotal</span>
                      <span>{formatPrice(orderDetails.totalAmount)}</span>
                    </div>
                    {parseFloat(orderDetails.discountAmount || 0) > 0 && (
                      <div className="os-price-row green">
                        <span>Discount</span>
                        <span>− {formatPrice(orderDetails.discountAmount)}</span>
                      </div>
                    )}
                    <div className="os-price-row">
                      <span>Shipping</span>
                      <span>
                        {parseFloat(orderDetails.shippingFee || 0) > 0
                          ? formatPrice(orderDetails.shippingFee)
                          : <span className="os-free-tag">FREE</span>
                        }
                      </span>
                    </div>
                    <div className="os-price-row os-price-total">
                      <span>{isCOD ? 'Amount Due' : 'Total Paid'}</span>
                      <span>{formatPrice(orderDetails.finalAmount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Ordered */}
            {orderDetails.orderItems?.length > 0 && (
              <div className="os-card">
                <div className="os-card-head">
                  <ShoppingBag size={15} />
                  Items Ordered
                  <span className="os-item-count">{orderDetails.orderItems.length} item{orderDetails.orderItems.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="os-items-list">
                  {orderDetails.orderItems.map((item, i) => (
                    <div key={item.orderItemId || i} className="os-item">
                      <div className="os-item-img">
                        <img
                          src={item.productImageUrl || `https://placehold.co/64x64/f2e4d8/8B4513?text=${encodeURIComponent((item.productName || 'P')[0])}`}
                          alt={item.productName}
                          onError={e => { e.target.src = 'https://placehold.co/64x64/f2e4d8/8B4513?text=🥖'; }}
                        />
                      </div>
                      <div className="os-item-info">
                        <span className="os-item-name">{item.productName}</span>
                        <span className="os-item-meta">
                          {formatPrice(item.price || item.priceAtPurchase)} × {item.quantity}
                        </span>
                      </div>
                      <span className="os-item-subtotal">{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="os-items-footer">
                  <span>All items freshly prepared with care 🥐</span>
                  <span className="os-items-total">{formatPrice(orderDetails.finalAmount)}</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="os-skeleton-group">
            <div className="os-skeleton os-sk-tall" />
            <div className="os-skeleton os-sk-short" />
          </div>
        )}

        {/* ── What's Next ── */}
        <div className="os-whats-next">
          <div className="os-wn-title">
            <Info size={15} /> What happens next?
          </div>
          <div className="os-wn-steps">
            <div className="os-wn-step">
              <div className="os-wn-num">1</div>
              <div className="os-wn-text">
                <strong>Confirmation Email</strong>
                <span>A receipt has been sent to your registered email address.</span>
              </div>
            </div>
            <div className="os-wn-step">
              <div className="os-wn-num">2</div>
              <div className="os-wn-text">
                <strong>Fresh Preparation</strong>
                <span>Our bakers start preparing your order right away.</span>
              </div>
            </div>
            <div className="os-wn-step">
              <div className="os-wn-num">3</div>
              <div className="os-wn-text">
                <strong>{isCOD ? 'Pay on Arrival' : 'Out for Delivery'}</strong>
                <span>
                  {isCOD
                    ? `Keep ${orderDetails ? formatPrice(orderDetails.finalAmount) : 'the exact amount'} ready for the delivery partner.`
                    : 'Your order will be delivered within the estimated time window.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="os-actions">
          <button className="os-btn-primary" onClick={() => navigate('/orders')}>
            <Package size={17} />
            Track My Order
            <ArrowRight size={17} />
          </button>
          <button className="os-btn-secondary" onClick={() => navigate('/userpanel')}>
            <ShoppingBag size={17} />
            Continue Shopping
          </button>
        </div>

        {/* ── Brand Footer ── */}
        <div className="os-brand-footer">
          <div className="os-brand-icons">🥐 🥖 🍰</div>
          <div className="os-brand-text">Maison Dorée · Handcrafted with love since 1985</div>
          <div className="os-brand-heart">
            <Heart size={13} fill="currentColor" /> Thank you for your order
          </div>
        </div>

      </div>
    </div>
  );
}