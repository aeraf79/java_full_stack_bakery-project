import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin, Phone, User, Mail, Home, Building2, MapPinned,
  CreditCard, Lock, ArrowLeft, Package, AlertCircle, Loader,
  ChevronRight, ShieldCheck, Truck, Clock, Tag, Banknote,
  CheckCircle2, Wallet, Info
} from 'lucide-react';
import './Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const buyNowProduct = location.state?.product;
  const buyNowQuantity = location.state?.quantity || 1;

  const [loading, setLoading] = useState(true);
  const [cartData, setCartData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Payment method: 'RAZORPAY' | 'COD'
  const [paymentMethod, setPaymentMethod] = useState('RAZORPAY');

  const [formData, setFormData] = useState({
    name: '', phone: '', address: '',
    city: '', state: '', pincode: '', notes: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    if (buyNowProduct) { setLoading(false); loadUserProfile(); }
    else { fetchCart(); loadUserProfile(); }
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/users/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const user = await response.json();
        setFormData(prev => ({ ...prev, name: user.fullName || '', phone: user.phoneNumber || '' }));
      }
    } catch (err) { console.log('Could not load profile:', err.message); }
  };

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        throw new Error('Failed to fetch cart');
      }
      const data = await response.json();
      if (!data.items || data.items.length === 0) { navigate('/cart'); return; }
      setCartData(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    else if (formData.name.trim().length < 2) errors.name = 'At least 2 characters';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10}$/.test(formData.phone)) errors.phone = 'Must be 10 digits';
    if (!formData.address.trim()) errors.address = 'Address is required';
    else if (formData.address.trim().length < 10) errors.address = 'At least 10 characters';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.pincode.trim()) errors.pincode = 'Pincode is required';
    else if (!/^\d{6}$/.test(formData.pincode)) errors.pincode = 'Must be 6 digits';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const calculateSubtotal = () => {
    if (buyNowProduct) return parseFloat(buyNowProduct.price) * buyNowQuantity;
    return parseFloat(cartData?.totalAmount || 0);
  };
  const calculateTax = () => calculateSubtotal() * 0.08;
  const calculateFinalTotal = () => calculateSubtotal() + calculateTax();

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  // ── COD Order ─────────────────────────────────────────────
  const handleCODOrder = async () => {
    if (!validateForm()) { showToast('Please fill all required fields correctly', 'error'); return; }
    setProcessing(true); setError('');
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:8080/api/orders/cod';
      if (buyNowProduct) url = `http://localhost:8080/api/orders/cod/buy-now?productId=${buyNowProduct.productId}&quantity=${buyNowQuantity}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          paymentMethod: 'COD'
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || 'Failed to place order');
      }

      const result = await response.json();
      showToast('Order placed successfully! Pay on delivery.', 'success');
      setTimeout(() => navigate('/order-success', {
        state: { orderNumber: result.orderNumber || result.order_number, orderId: result.orderId || result.order_id, paymentMethod: 'COD' }
      }), 1500);
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  // ── Razorpay Order ─────────────────────────────────────────
  const handleRazorpayOrder = async () => {
    if (!validateForm()) { showToast('Please fill all required fields correctly', 'error'); return; }
    setProcessing(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load Razorpay. Please check your connection.');

      let createOrderUrl = 'http://localhost:8080/api/payment/create-order';
      if (buyNowProduct) createOrderUrl = `http://localhost:8080/api/payment/create-order/buy-now?productId=${buyNowProduct.productId}&quantity=${buyNowQuantity}`;

      const createOrderResponse = await fetch(createOrderUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!createOrderResponse.ok) {
        const errData = await createOrderResponse.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || 'Failed to create order');
      }

      const orderData = await createOrderResponse.json();
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Maison Dorée Bakery',
        description: `Order #${orderData.order_number}`,
        order_id: orderData.razorpay_order_id,
        prefill: { name: orderData.customer_name, email: orderData.customer_email, contact: orderData.customer_phone },
        theme: { color: '#8B4513' },
        handler: async function (response) { await verifyPayment(response); },
        modal: { ondismiss: function () { setProcessing(false); showToast('Payment cancelled', 'info'); } }
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err.message);
      showToast(err.message, 'error');
      setProcessing(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === 'COD') handleCODOrder();
    else handleRazorpayOrder();
  };

  const verifyPayment = async (razorpayResponse) => {
    try {
      const token = localStorage.getItem('token');
      const verifyResponse = await fetch('http://localhost:8080/api/payment/verify', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: razorpayResponse.razorpay_order_id,
          razorpay_payment_id: razorpayResponse.razorpay_payment_id,
          razorpay_signature: razorpayResponse.razorpay_signature
        })
      });
      if (!verifyResponse.ok) {
        const errData = await verifyResponse.json().catch(() => null);
        throw new Error(errData?.message || errData?.error || 'Payment verification failed');
      }
      const result = await verifyResponse.json();
      if (result.success) {
        showToast('Payment successful! Order placed.', 'success');
        setTimeout(() => navigate('/order-success', {
          state: { orderNumber: result.orderNumber, orderId: result.orderId, paymentMethod: 'RAZORPAY' }
        }), 1500);
      } else throw new Error(result.message || 'Payment verification failed');
    } catch (err) {
      showToast(err.message || 'Payment verification failed', 'error');
      setProcessing(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<div class="toast-content">
      ${type === 'success'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : type === 'error'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line></svg>`
      }
      <span>${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(price || 0);

  const items = buyNowProduct
    ? [{ ...buyNowProduct, quantity: buyNowQuantity, subtotal: buyNowProduct.price * buyNowQuantity }]
    : (cartData?.items || []);

  if (loading) return (
    <div className="checkout-page">
      <div className="checkout-loading">
        <div className="loading-bakery">🥐</div>
        <p>Preparing your checkout...</p>
      </div>
    </div>
  );

  return (
    <div className="checkout-page">
      {/* Background decoration */}
      <div className="checkout-bg-decor" aria-hidden="true">
        <span>🥖</span><span>🥐</span><span>🍰</span><span>🥨</span>
      </div>

      <div className="checkout-container">

        {/* ── Top Bar ── */}
        <div className="checkout-topbar">
          <button className="co-back-btn" onClick={() => navigate(buyNowProduct ? `/product/${buyNowProduct.productId}` : '/cart')}>
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>

          <div className="co-brand">
            <span className="co-brand-name">Maison Dorée</span>
            <span className="co-brand-sub">Artisan Bakery · Secure Checkout</span>
          </div>

          <div className="co-secure-tag">
            <Lock size={15} />
            <span>SSL Secured</span>
          </div>
        </div>

        {/* ── Breadcrumb Steps ── */}
        <div className="checkout-steps">
          <div className="step active completed">
            <div className="step-dot"><span>✓</span></div>
            <span className="step-label">Cart</span>
          </div>
          <div className="step-line active" />
          <div className="step active">
            <div className="step-dot"><span>2</span></div>
            <span className="step-label">Delivery</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-dot"><span>3</span></div>
            <span className="step-label">Payment</span>
          </div>
          <div className="step-line" />
          <div className="step">
            <div className="step-dot"><span>4</span></div>
            <span className="step-label">Confirm</span>
          </div>
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="co-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* ── Main Grid ── */}
        <div className="checkout-grid">

          {/* ════ LEFT ════ */}
          <div className="checkout-left">

            {/* Trust Strip */}
            <div className="co-trust-strip">
              <div className="trust-item">
                <Truck size={18} />
                <span>Always free delivery</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <Clock size={18} />
                <span>Same-day if ordered by 2 PM</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <ShieldCheck size={18} />
                <span>100% fresh guarantee</span>
              </div>
            </div>

            {/* ── Delivery Address ── */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-section-icon">
                  <MapPin size={20} />
                </div>
                <div>
                  <h2>Delivery Address</h2>
                  <p>Where should we deliver your order?</p>
                </div>
              </div>

              <form className="co-form" onSubmit={(e) => e.preventDefault()}>

                {/* Name + Phone */}
                <div className="co-form-row">
                  <div className={`co-field ${formErrors.name ? 'has-error' : ''}`}>
                    <label>
                      <User size={15} />
                      Full Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Your full name"
                    />
                    {formErrors.name && <p className="field-error">{formErrors.name}</p>}
                  </div>

                  <div className={`co-field ${formErrors.phone ? 'has-error' : ''}`}>
                    <label>
                      <Phone size={15} />
                      Phone Number <span className="req">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile"
                      maxLength={10}
                    />
                    {formErrors.phone && <p className="field-error">{formErrors.phone}</p>}
                  </div>
                </div>

                {/* Address */}
                <div className={`co-field ${formErrors.address ? 'has-error' : ''}`}>
                  <label>
                    <Home size={15} />
                    Street Address <span className="req">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House No., Building Name, Street, Area, Landmark"
                    rows={3}
                  />
                  {formErrors.address && <p className="field-error">{formErrors.address}</p>}
                </div>

                {/* City + State */}
                <div className="co-form-row">
                  <div className={`co-field ${formErrors.city ? 'has-error' : ''}`}>
                    <label>
                      <Building2 size={15} />
                      City <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="City"
                    />
                    {formErrors.city && <p className="field-error">{formErrors.city}</p>}
                  </div>

                  <div className={`co-field ${formErrors.state ? 'has-error' : ''}`}>
                    <label>
                      <MapPinned size={15} />
                      State <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="State"
                    />
                    {formErrors.state && <p className="field-error">{formErrors.state}</p>}
                  </div>
                </div>

                {/* Pincode */}
                <div className={`co-field co-field--half ${formErrors.pincode ? 'has-error' : ''}`}>
                  <label>
                    <MapPin size={15} />
                    Pincode <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    maxLength={6}
                  />
                  {formErrors.pincode && <p className="field-error">{formErrors.pincode}</p>}
                </div>

                {/* Notes */}
                <div className="co-field">
                  <label>
                    <Tag size={15} />
                    Delivery Instructions <span className="optional">(optional)</span>
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="e.g. Leave at door, ring bell twice, gate code #1234..."
                    rows={2}
                  />
                </div>

              </form>
            </div>

            {/* ── Payment Method ── */}
            <div className="co-section">
              <div className="co-section-header">
                <div className="co-section-icon">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2>Payment Method</h2>
                  <p>Choose how you'd like to pay</p>
                </div>
              </div>

              <div className="co-payment-options">

                {/* Razorpay Option */}
                <label
                  className={`co-payment-option ${paymentMethod === 'RAZORPAY' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('RAZORPAY')}
                >
                  <div className="co-payment-radio">
                    <div className={`co-radio-dot ${paymentMethod === 'RAZORPAY' ? 'active' : ''}`} />
                  </div>
                  <div className="co-payment-icon razorpay-icon">
                    <CreditCard size={22} />
                  </div>
                  <div className="co-payment-info">
                    <span className="co-payment-title">Pay Online</span>
                    <span className="co-payment-desc">Cards · UPI · Net Banking · Wallets via Razorpay</span>
                  </div>
                  <div className="co-payment-badges">
                    <span className="pay-icon">VISA</span>
                    <span className="pay-icon">UPI</span>
                  </div>
                </label>

                {/* COD Option */}
                <label
                  className={`co-payment-option ${paymentMethod === 'COD' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className="co-payment-radio">
                    <div className={`co-radio-dot ${paymentMethod === 'COD' ? 'active' : ''}`} />
                  </div>
                  <div className="co-payment-icon cod-icon">
                    <Banknote size={22} />
                  </div>
                  <div className="co-payment-info">
                    <span className="co-payment-title">Cash on Delivery</span>
                    <span className="co-payment-desc">Pay in cash when your order arrives at your door</span>
                  </div>
                  <span className="co-cod-badge">FREE</span>
                </label>

              </div>

              {/* COD note */}
              {paymentMethod === 'COD' && (
                <div className="co-cod-note">
                  <Info size={15} />
                  <span>Please keep exact change ready. Our delivery partner will collect payment on arrival.</span>
                </div>
              )}

              {/* Razorpay note */}
              {paymentMethod === 'RAZORPAY' && (
                <div className="co-razorpay-note">
                  <ShieldCheck size={15} />
                  <span>Your payment is secured by Razorpay with 256-bit SSL encryption. We never store your card details.</span>
                </div>
              )}

            </div>

          </div>

          {/* ════ RIGHT: ORDER SUMMARY ════ */}
          <div className="checkout-right">
            <div className="co-summary-card">

              <div className="co-summary-header">
                <h2>Order Summary</h2>
                <span className="co-item-count">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
              </div>

              {/* Items */}
              <div className="co-items-list">
                {items.map((item, index) => (
                  <div key={item.cartItemId || item.productId || index} className="co-item">
                    <div className="co-item-img-wrap">
                      <img
                        src={item.imageUrl || `https://placehold.co/80x80/f2e4d8/8B4513?text=${encodeURIComponent((item.productName || item.name || 'Item')[0])}`}
                        alt={item.productName || item.name}
                        onError={(e) => { e.target.src = 'https://placehold.co/80x80/f2e4d8/8B4513?text=🥖'; }}
                      />
                    </div>
                    <div className="co-item-info">
                      <h4>{item.productName || item.name}</h4>
                      <span className="co-item-qty">× {item.quantity}</span>
                    </div>
                    <span className="co-item-price">
                      {formatPrice(item.subtotal || (parseFloat(item.price) * item.quantity))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo */}
              <div className="co-promo">
                <Tag size={15} />
                <input type="text" placeholder="Promo code" className="co-promo-input" />
                <button className="co-promo-btn">Apply</button>
              </div>

              {/* Totals */}
              <div className="co-totals">
                <div className="co-total-row">
                  <span>Subtotal</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="co-total-row">
                  <span>Tax (8%)</span>
                  <span>{formatPrice(calculateTax())}</span>
                </div>
                <div className="co-total-row">
                  <span>Shipping</span>
                  <span className="co-free-tag">FREE</span>
                </div>
                {paymentMethod === 'COD' && (
                  <div className="co-total-row">
                    <span>COD Charges</span>
                    <span className="co-free-tag">FREE</span>
                  </div>
                )}
                <div className="co-total-row co-grand-total">
                  <span>Total</span>
                  <span>{formatPrice(calculateFinalTotal())}</span>
                </div>
              </div>

              {/* Selected payment indicator */}
              <div className="co-selected-payment">
                {paymentMethod === 'COD'
                  ? <><Banknote size={15} /> Pay ₹{calculateFinalTotal().toFixed(2)} on delivery</>
                  : <><CreditCard size={15} /> Pay securely via Razorpay</>
                }
              </div>

              {/* CTA */}
              <button
                className="co-place-order-btn"
                onClick={handlePlaceOrder}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader size={20} className="co-spinner" />
                    {paymentMethod === 'COD' ? 'Placing your order...' : 'Processing payment...'}
                  </>
                ) : paymentMethod === 'COD' ? (
                  <>
                    <Banknote size={20} />
                    Place Order · Pay on Delivery
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pay {formatPrice(calculateFinalTotal())}
                  </>
                )}
              </button>

              {/* Trust badges */}
              <div className="co-trust-badges">
                <div className="co-badge">
                  <Lock size={14} />
                  <span>Secure</span>
                </div>
                <div className="co-badge">
                  <ShieldCheck size={14} />
                  <span>Protected</span>
                </div>
                <div className="co-badge">
                  <Package size={14} />
                  <span>Easy Returns</span>
                </div>
              </div>

              {/* Payment icons — only when Razorpay selected */}
              {paymentMethod === 'RAZORPAY' && (
                <div className="co-payment-icons">
                  <span className="pay-icon">VISA</span>
                  <span className="pay-icon">MC</span>
                  <span className="pay-icon">UPI</span>
                  <span className="pay-icon">NET</span>
                </div>
              )}

              {paymentMethod === 'COD' && (
                <div className="co-cod-summary-note">
                  <Banknote size={14} />
                  <span>Keep exact change of {formatPrice(calculateFinalTotal())} ready</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;