import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, ShoppingCart, Trash2, ArrowLeft,
  Package, AlertCircle, Loader, Plus
} from 'lucide-react';
import './Favourites.css';
import Footer from '../components/Footer';

const Favourites = () => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const [addingToCart, setAddingToCart] = useState({});
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    fetchFavourites();
  }, []);

  const fetchFavourites = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/favourites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) { navigate('/login'); return; }
        throw new Error('Failed to load favourites');
      }
      const data = await res.json();
      setFavourites(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (favouriteId, productName) => {
    setRemovingId(favouriteId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/favourites/${favouriteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFavourites(prev => prev.filter(f => f.favouriteId !== favouriteId));
        showToast(`${productName} removed from favourites`, 'info');
      }
    } catch (err) {
      showToast('Failed to remove item', 'error');
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Remove all favourites?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/favourites/clear', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFavourites([]);
        showToast('All favourites cleared', 'info');
      }
    } catch (err) {
      showToast('Failed to clear favourites', 'error');
    }
  };

  const handleAddToCart = async (fav) => {
    if (addingToCart[fav.productId] || !fav.isAvailable) return;
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    setAddingToCart(prev => ({ ...prev, [fav.productId]: true }));
    try {
      const res = await fetch('http://localhost:8080/api/cart/add', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: fav.productId, quantity: 1 })
      });
      if (!res.ok) throw new Error('Failed to add to cart');
      const data = await res.json();
      setCartCount(data.totalItems ?? 0);
      showToast(`${fav.productName} added to cart!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setAddingToCart(prev => ({ ...prev, [fav.productId]: false }));
    }
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<div class="toast-content">
      ${type === 'success'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : type === 'info'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line></svg>`
      }
      <span>${message}</span>
    </div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getFallbackImage = (category) => {
    const map = {
      'Breads': 'https://placehold.co/300x300/8B4513/FFFFFF?text=Bread',
      'Bread':  'https://placehold.co/300x300/8B4513/FFFFFF?text=Bread',
      'Pastries': 'https://placehold.co/300x300/A0522D/FFFFFF?text=Pastry',
      'Cookies':  'https://placehold.co/300x300/D2691E/FFFFFF?text=Cookie',
      'Cakes':    'https://placehold.co/300x300/CD853F/FFFFFF?text=Cake',
      'Muffins':  'https://placehold.co/300x300/DEB887/FFFFFF?text=Muffin',
    };
    return map[category] || 'https://placehold.co/300x300/8B4513/FFFFFF?text=Product';
  };

  const formatPrice = (price) => {
    if (!price) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="fav-page">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="fav-page-header">
        <div className="fav-page-header-inner">
          <button className="fav-back-btn" onClick={() => navigate('/userpanel')}>
            <ArrowLeft size={20} />
            <span>Back to Shop</span>
          </button>

          <div className="fav-page-title">
            <div className="fav-title-icon">
              <Heart size={28} />
            </div>
            <div>
              <h1>My Favourites</h1>
              <p>{favourites.length} saved item{favourites.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="fav-header-actions">
            {favourites.length > 0 && (
              <button className="fav-clear-btn" onClick={handleClearAll}>
                <Trash2 size={16} />
                <span>Clear All</span>
              </button>
            )}
            <button className="fav-cart-nav-btn" onClick={() => navigate('/cart')}>
              <ShoppingCart size={18} />
              <span>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="fav-page-main">

        {loading ? (
          <div className="fav-page-loading">
            <Loader size={40} className="fav-page-spinner" />
            <p>Loading your favourites...</p>
          </div>

        ) : error ? (
          <div className="fav-page-error">
            <AlertCircle size={48} />
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button onClick={fetchFavourites} className="fav-retry-btn">Try Again</button>
          </div>

        ) : favourites.length === 0 ? (
          <div className="fav-page-empty">
            <div className="fav-empty-icon">
              <Heart size={64} />
            </div>
            <h2>No favourites yet</h2>
            <p>Browse our products and click the ♡ icon to save items you love.</p>
            <button className="fav-shop-btn" onClick={() => navigate('/userpanel')}>
              Start Shopping
            </button>
          </div>

        ) : (
          <div className="fav-page-grid">
            {favourites.map((fav, index) => (
              <div
                key={fav.favouriteId}
                className="fav-product-card"
                
                style={{ animationDelay: `${index * 0.06}s` }}
              >
                {/* Image */}
                <div className="fav-card-image">
                  <img
                    src={fav.imageUrl || getFallbackImage(fav.productCategory)}
                    alt={fav.productName}
                    onError={(e) => { e.target.src = getFallbackImage(fav.productCategory); }}
                  />
                  {!fav.isAvailable && (
                    <div className="fav-card-unavailable-overlay">Out of Stock</div>
                  )}
                  {/* Remove button */}
                  <button
                    className="fav-card-remove-btn"
                    onClick={() => handleRemove(fav.favouriteId, fav.productName)}
                    disabled={removingId === fav.favouriteId}
                    title="Remove from favourites"
                  >
                    {removingId === fav.favouriteId
                      ? <Loader size={16} className="fav-page-spinner" />
                      : <Heart size={16} style={{ fill: '#ef4444', color: '#ef4444' }} />
                    }
                  </button>
                </div>

                {/* Info */}
                <div className="fav-card-info">
                  <span className="fav-card-category">{fav.productCategory}</span>
                  <h3 className="fav-card-name">{fav.productName}</h3>

                 

                  <div className="fav-card-footer">
                    <div className="fav-card-price">
                      <span>{formatPrice(fav.price)}</span>
                      {fav.unit && <span className="fav-card-unit">/{fav.unit}</span>}
                    </div>

                    <button
                      className="fav-card-cart-btn"
                      onClick={() => handleAddToCart(fav)}
                      disabled={!fav.isAvailable || addingToCart[fav.productId]}
                    >
                      {addingToCart[fav.productId] ? (
                        <><Loader size={15} className="fav-page-spinner" /><span>Adding...</span></>
                      ) : fav.isAvailable ? (
                        <><Plus size={15} /><span>Add to Cart</span></>
                      ) : (
                        <span>Unavailable</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Favourites;