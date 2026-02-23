import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, ShoppingCart, Loader, Package } from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────────────
// onAction      : (action) => void   — replaces the old `onAddToCart` prop
// favouritedIds : Set<number>        — controlled by UserPanel (source of truth)
// onCountChange : (newSet) => void   — called when a removal happens so UserPanel
//                                      can remove the id from its favouritedIds Set

const FavouritesDropdown = ({ onAction, favouritedIds = new Set(), onCountChange }) => {
  const [open, setOpen]           = useState(false);
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const dropdownRef = useRef(null);
  const navigate    = useNavigate();

  // ── Derived count from the prop Set (always in sync with UserPanel) ──────
  const count = favouritedIds.size;

  // ── Close on outside click ───────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Fetch full favourite objects when dropdown opens ─────────────────────
  useEffect(() => {
    if (open) fetchFavourites();
  }, [open]);

  // ── If parent removes a favourite externally, keep list in sync ──────────
  useEffect(() => {
    if (favourites.length > 0) {
      setFavourites(prev => prev.filter(f => favouritedIds.has(f.productId)));
    }
  }, [favouritedIds]);

  const fetchFavourites = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8080/api/favourites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavourites(data);
      }
    } catch (err) {
      console.error('Failed to fetch favourites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (e, favouriteId, productId) => {
    e.stopPropagation();
    setRemovingId(favouriteId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8080/api/favourites/${favouriteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // 1. Remove from local list
        setFavourites(prev => prev.filter(f => f.favouriteId !== favouriteId));

        // 2. Tell UserPanel to remove from its favouritedIds Set
        //    so the heart icon on the product card un-fills instantly
        if (onCountChange) onCountChange(productId);

        // 3. Legacy action for un-hearting the product card
        if (onAction) onAction({ type: 'removeFavourite', productId });
      }
    } catch (err) {
      console.error('Failed to remove favourite:', err);
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (e, fav) => {
    e.stopPropagation();
    if (onAction) {
      onAction({
        type: 'addToCart',
        product: {
          productId:   fav.productId,
          name:        fav.productName,
          isAvailable: fav.isAvailable,
        },
      });
    }
  };

  const formatPrice = (price) => {
    if (!price) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 2,
    }).format(price);
  };

  const getFallbackImage = (category) => {
    const map = {
      Breads:   'https://placehold.co/80x80/8B4513/FFFFFF?text=Bread',
      Bread:    'https://placehold.co/80x80/8B4513/FFFFFF?text=Bread',
      Pastries: 'https://placehold.co/80x80/A0522D/FFFFFF?text=Pastry',
      Cookies:  'https://placehold.co/80x80/D2691E/FFFFFF?text=Cookie',
      Cakes:    'https://placehold.co/80x80/CD853F/FFFFFF?text=Cake',
    };
    return map[category] || 'https://placehold.co/80x80/8B4513/FFFFFF?text=Product';
  };

  return (
    <div className="fav-dropdown-wrapper" ref={dropdownRef}>

      {/* ── Heart Button with LIVE count from favouritedIds.size ─────────── */}
      <button
        className="fav-icon-btn"
        onClick={() => setOpen(prev => !prev)}
        title="My Favourites"
      >
        <Heart
          size={24}
          className={count > 0 ? 'fav-icon-filled' : ''}
        />
        {count > 0 && (
          <span className="fav-badge">{count}</span>
        )}
      </button>

      {/* ── Dropdown Panel ───────────────────────────────────────────────── */}
      {open && (
        <div className="fav-dropdown">
          <div className="fav-dropdown-header">
            <div className="fav-dropdown-title">
              <Heart size={18} />
              <span>My Favourites</span>
            </div>
            {count > 0 && (
              <span className="fav-dropdown-count">
                {count} item{count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="fav-dropdown-body">
            {loading ? (
              <div className="fav-loading">
                <Loader size={24} className="fav-spinner" />
                <p>Loading favourites...</p>
              </div>
            ) : favourites.length === 0 ? (
              <div className="fav-empty">
                <Package size={40} />
                <p>No favourites yet</p>
                <span>Click the ♡ on any product to save it here</span>
              </div>
            ) : (
              <ul className="fav-list">
                {favourites.map(fav => (
                  <li key={fav.favouriteId} className="fav-item">
                    <div className="fav-item-image">
                      <img
                        src={fav.imageUrl || getFallbackImage(fav.productCategory)}
                        alt={fav.productName}
                        onError={(e) => { e.target.src = getFallbackImage(fav.productCategory); }}
                      />
                    </div>
                    <div className="fav-item-info">
                      <p className="fav-item-name">{fav.productName}</p>
                      <p className="fav-item-category">{fav.productCategory}</p>
                      <p className="fav-item-price">{formatPrice(fav.price)}</p>
                      {!fav.isAvailable && (
                        <span className="fav-unavailable">Out of Stock</span>
                      )}
                    </div>
                    <div className="fav-item-actions">
                      <button
                        className="fav-cart-btn"
                        onClick={(e) => handleAddToCart(e, fav)}
                        disabled={!fav.isAvailable}
                        title="Add to cart"
                      >
                        <ShoppingCart size={15} />
                      </button>
                      <button
                        className="fav-remove-btn"
                        onClick={(e) => handleRemove(e, fav.favouriteId, fav.productId)}
                        disabled={removingId === fav.favouriteId}
                        title="Remove from favourites"
                      >
                        {removingId === fav.favouriteId
                          ? <Loader size={14} className="fav-spinner" />
                          : <X size={14} />
                        }
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {favourites.length > 0 && (
            <div className="fav-dropdown-footer">
              <button
                className="fav-view-all-btn"
                onClick={() => { navigate('/favourites'); setOpen(false); }}
              >
                View All Favourites
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FavouritesDropdown;