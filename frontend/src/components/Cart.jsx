import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft,
  AlertCircle, Package, X, ShoppingBag, Tag
} from 'lucide-react';
import './cart.css';

const Cart = () => {
  const [cartData, setCartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updatingItems, setUpdatingItems] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:8080/api/cart', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || 'Failed to fetch cart');
      }

      const data = await response.json();
      setCartData(data);

    } catch (err) {
      console.error('Error fetching cart:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:8080/api/cart/items/${cartItemId}?quantity=${newQuantity}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || 'Cannot update quantity. Item may be out of stock.');
      }

      const data = await response.json();
      setCartData(data);
      showToast('Cart updated successfully');

    } catch (err) {
      console.error('Error updating quantity:', err);
      showToast(err.message || 'Failed to update quantity', 'error');
      fetchCart();
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const removeItem = async (cartItemId) => {
    if (!window.confirm('Remove this item from cart?')) return;

    setUpdatingItems(prev => ({ ...prev, [cartItemId]: true }));

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:8080/api/cart/items/${cartItemId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || 'Failed to remove item');
      }

      const data = await response.json();
      setCartData(data);
      showToast('Item removed from cart');

    } catch (err) {
      console.error('Error removing item:', err);
      showToast(err.message || 'Failed to remove item', 'error');
      fetchCart();
    } finally {
      setUpdatingItems(prev => ({ ...prev, [cartItemId]: false }));
    }
  };

  const clearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:8080/api/cart/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
          return;
        }
        // Only parse body if there is one (backend returns 200 with empty body)
        if (response.status !== 204) {
          const errData = await response.json().catch(() => null);
          if (errData) throw new Error(errData?.error || errData?.message || 'Failed to clear cart');
        }
      }

      // Backend returns 200 with no body — reset cart state manually
      setCartData(prev => ({
        cartId: prev?.cartId,
        userId: prev?.userId,
        items: [],
        totalAmount: 0,
        totalItems: 0
      }));
      showToast('Cart cleared');

    } catch (err) {
      console.error('Error clearing cart:', err);
      showToast(err.message || 'Failed to clear cart', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        ${type === 'success' ? `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ` : `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        `}
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Use backend's pre-calculated totalAmount (falls back to manual if missing)
  const calculateSubtotal = () => {
    if (!cartData) return 0;
    if (cartData.totalAmount !== undefined && cartData.totalAmount !== null) {
      return parseFloat(cartData.totalAmount);
    }
    if (!cartData.items) return 0;
    return cartData.items.reduce((sum, item) => sum + parseFloat(item.subtotal || 0), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.08;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const formatPrice = (price) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : (price || 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numPrice);
  };

  const getFallbackImage = (category) => {
    const fallbacks = {
      'Breads':   'https://placehold.co/200x200/8B4513/FFFFFF?text=Bread',
      'Bread':    'https://placehold.co/200x200/8B4513/FFFFFF?text=Bread',
      'Pastries': 'https://placehold.co/200x200/A0522D/FFFFFF?text=Pastries',
      'Cookies':  'https://placehold.co/200x200/D2691E/FFFFFF?text=Cookies',
      'Cakes':    'https://placehold.co/200x200/CD853F/FFFFFF?text=Cakes',
      'Muffins':  'https://placehold.co/200x200/DEB887/FFFFFF?text=Muffins'
    };
    return fallbacks[category] || 'https://placehold.co/200x200/8B4513/FFFFFF?text=Product';
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your cart...</p>
        </div>
      </div>
    );
  }

  const cartItems = cartData?.items || [];
  const isEmpty = cartItems.length === 0;

  return (
    <div className="cart-page">
      {/* Header */}
      <div className="cart-header">
        <button className="back-btn" onClick={() => navigate('/userpanel')}>
          <ArrowLeft size={20} />
          Continue Shopping
        </button>

        <h1 className="cart-title">
          <ShoppingCart size={32} />
          Shopping Cart
          {!isEmpty && (
            <span className="cart-count">({cartData?.totalItems || cartItems.length} items)</span>
          )}
        </h1>

        <div className="cart-header-actions">
          {!isEmpty && (
            <button className="clear-cart-btn" onClick={clearCart} disabled={updating}>
              <Trash2 size={18} />
              Clear Cart
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}

      <div className="cart-content">
        {isEmpty ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <ShoppingBag size={80} />
            </div>
            <h2>Your cart is empty</h2>
            <p>Add some delicious items from our bakery!</p>
            <button className="shop-now-btn" onClick={() => navigate('/userpanel')}>
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="cart-items">
              {cartItems.map((item) => (
                <div key={item.cartItemId} className="cart-item">
                  <div className="item-image">
                    <img
                      src={item.imageUrl || getFallbackImage(item.productCategory)}
                      alt={item.productName}
                      onError={(e) => {
                        e.target.src = getFallbackImage(item.productCategory);
                      }}
                    />
                  </div>

                  <div className="item-details">
                    <div className="item-header">
                      <div>
                        <h3 className="item-name">{item.productName}</h3>
                        <span className="item-category">
                          <Tag size={14} />
                          {item.productCategory}
                        </span>
                      </div>
                      <button
                        className="remove-btn"
                        onClick={() => removeItem(item.cartItemId)}
                        disabled={updatingItems[item.cartItemId]}
                      >
                        {updatingItems[item.cartItemId] ? (
                          <span className="spinner-small"></span>
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>

                    {item.productDescription && (
                      <p className="item-description">{item.productDescription}</p>
                    )}

                    <div className="item-footer">
                      <div className="quantity-controls">
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          disabled={updatingItems[item.cartItemId] || item.quantity <= 1}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="quantity">
                          {updatingItems[item.cartItemId] ? (
                            <span className="spinner-small"></span>
                          ) : (
                            item.quantity
                          )}
                        </span>
                        <button
                          className="qty-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={
                            updatingItems[item.cartItemId] ||
                            item.quantity >= (item.stockQuantity || 999)
                          }
                        >
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="item-pricing">
                        <span className="unit-price">{formatPrice(item.price)} each</span>
                        <span className="item-total">{formatPrice(item.subtotal)}</span>
                      </div>
                    </div>

                    {item.isAvailable === false && (
                      <div className="item-warning">
                        <AlertCircle size={16} />
                        <span>This item is currently unavailable</span>
                      </div>
                    )}

                    {item.stockQuantity && item.stockQuantity < 5 && item.isAvailable !== false && (
                      <div className="item-info">
                        <Package size={16} />
                        <span>Only {item.stockQuantity} left in stock</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="cart-summary">
              <div className="summary-card">
                <h2 className="summary-title">Order Summary</h2>

                <div className="summary-row">
                  <span>Subtotal ({cartData?.totalItems || cartItems.length} items)</span>
                  <span>{formatPrice(calculateSubtotal())}</span>
                </div>

                <div className="summary-row">
                  <span>Tax (8%)</span>
                  <span>{formatPrice(calculateTax())}</span>
                </div>

                <div className="summary-row shipping">
                  <span>Shipping</span>
                  <span className="free-badge">FREE</span>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatPrice(calculateTotal())}</span>
                </div>

                <button
                  className="checkout-btn"
                  onClick={() => navigate('/checkout')}
                  disabled={updating || cartItems.some(item => item.isAvailable === false)}
                >
                  {cartItems.some(item => item.isAvailable === false)
                    ? 'Remove Unavailable Items'
                    : 'Proceed to Checkout'
                  }
                </button>

                <div className="secure-checkout">
                  <AlertCircle size={16} />
                  <span>Secure checkout guaranteed</span>
                </div>
              </div>

              {/* Promo Code Section */}
              <div className="promo-section">
                <h3>Have a promo code?</h3>
                <div className="promo-input-group">
                  <input
                    type="text"
                    placeholder="Enter code"
                    className="promo-input"
                  />
                  <button className="apply-btn">Apply</button>
                </div>
              </div>

              {/* Cart Info */}
              <div className="cart-info-box">
                <h4>🎉 Free Shipping</h4>
                <p>Enjoy free delivery on all orders!</p>
              </div>

              <div className="cart-info-box">
                <h4>🔒 Secure Payment</h4>
                <p>Your payment information is encrypted and secure.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;