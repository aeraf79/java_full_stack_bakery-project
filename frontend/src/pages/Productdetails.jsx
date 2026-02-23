import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, ShoppingCart, Plus, Minus,
  Star, Check, Truck, Shield, Clock, Package, ChevronRight,
  Info, AlertCircle, Loader, User, LogOut, Settings,
  ChevronDown, Search, X
} from 'lucide-react';
import './Productdetails.css';
import Footer from '../components/Footer';

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isFavourited, setIsFavourited] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  const [activeTab, setActiveTab] = useState('description');
  const [showShareMenu, setShowShareMenu] = useState(false);

  // ── Navbar state ──
  const [scrolled, setScrolled] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [userData, setUserData] = useState({ fullName: '', email: '' });
  const dropdownRef = useRef(null);

  // ── Navbar effects ──
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setUserData({ fullName: u.fullName || '', email: u.email || '' });
      }
    } catch (_) {}
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // ── Product effects ──
  useEffect(() => {
    fetchProductDetails();
    checkIfFavourited();
  }, [productId]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`http://localhost:8080/api/products/${productId}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch product');

      const data = await response.json();
      setProduct(data);
      if (data.category) fetchSimilarProducts(data.category, productId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarProducts = async (category, excludeId) => {
    try {
      const response = await fetch('http://localhost:8080/api/products/all');
      if (!response.ok) return;
      const allProducts = await response.json();
      const similar = allProducts
        .filter(p => p.category === category && p.productId !== parseInt(excludeId) && p.isAvailable)
        .slice(0, 4);
      setSimilarProducts(similar);
    } catch (_) {}
  };

  const checkIfFavourited = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('http://localhost:8080/api/favourites/ids', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const ids = await res.json();
        setIsFavourited(ids.includes(parseInt(productId)));
      }
    } catch (_) {}
  };

  const handleToggleFavourite = async () => {
    if (togglingFav) return;
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setTogglingFav(true);
    setIsFavourited(!isFavourited);
    try {
      const res = await fetch(`http://localhost:8080/api/favourites/toggle/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setIsFavourited(!isFavourited);
        showToast('Failed to update favourites', 'error');
      } else {
        const data = await res.json();
        showToast(data.message, data.isFavourited ? 'success' : 'info');
      }
    } catch (_) {
      setIsFavourited(!isFavourited);
      showToast('Failed to update favourites', 'error');
    } finally {
      setTogglingFav(false);
    }
  };

  const handleAddToCart = async () => {
    if (addingToCart) return;
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setAddingToCart(true);
    try {
      const response = await fetch('http://localhost:8080/api/cart/add', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.productId, quantity })
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      showToast(`${quantity} × ${product.name} added to cart!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add to cart', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    navigate('/checkout', { state: { product, quantity } });
  };

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > (product?.stockQuantity || 99)) return product?.stockQuantity || 99;
      return next;
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name, text: `Check out ${product?.name} from Maison Dorée`, url: window.location.href })
        .catch(() => setShowShareMenu(true));
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard!', 'success');
    setShowShareMenu(false);
  };

  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<div class="toast-content">
      ${type === 'success'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`
      }
      <span>${message}</span>
    </div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  const getFallbackImage = () => 'https://placehold.co/800x800/8B4513/FFFFFF?text=Product';

  if (loading) return (
    <div className="pd-loading">
      <Loader size={48} className="pd-spinner" />
      <p>Loading product details...</p>
    </div>
  );

  if (error || !product) return (
    <div className="pd-error">
      <AlertCircle size={64} />
      <h2>Product Not Found</h2>
      <p>{error || 'The product you are looking for does not exist.'}</p>
      <button onClick={() => navigate('/userpanel')} className="pd-back-btn">
        <ArrowLeft size={20} /> Back to Shop
      </button>
    </div>
  );

  const images = product.imageUrl ? [product.imageUrl] : [getFallbackImage()];

  return (
    <div className="product-details-page">

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav className={`pd-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="pd-nav-container">

          {/* Logo */}
          <div className="pd-logo" onClick={() => navigate('/userpanel')}>
            Maison Dorée
          </div>

          {/* Nav Actions */}
          <div className="pd-nav-actions">

            {/* Back to shop */}
            <button className="pd-nav-back" onClick={() => navigate('/userpanel')}>
              <ArrowLeft size={16} />
              <span>Shop</span>
            </button>

            {/* Cart */}
            <button className="pd-nav-cart" onClick={() => navigate('/cart')}>
              <ShoppingCart size={22} />
            </button>

            {/* Profile dropdown */}
            <div className="pd-profile-section" ref={dropdownRef}>
              <button
                className="pd-profile-btn"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="pd-profile-avatar">
                  {getInitials(userData.fullName)}
                </div>
                <ChevronDown size={16} className={`pd-chevron ${showProfileDropdown ? 'rotate' : ''}`} />
              </button>

              {showProfileDropdown && (
                <div className="pd-profile-dropdown">
                  <div className="pd-dropdown-header">
                    <div className="pd-dropdown-avatar">
                      {getInitials(userData.fullName)}
                    </div>
                    <div className="pd-dropdown-info">
                      <span className="pd-dropdown-name">{userData.fullName || 'User'}</span>
                      <span className="pd-dropdown-email">{userData.email}</span>
                    </div>
                  </div>

                  <div className="pd-dropdown-divider" />

                  <button className="pd-dropdown-item" onClick={() => { navigate('/profile'); setShowProfileDropdown(false); }}>
                    <Settings size={17} />
                    Profile Settings
                  </button>
                  <button className="pd-dropdown-item" onClick={() => { navigate('/cart'); setShowProfileDropdown(false); }}>
                    <ShoppingCart size={17} />
                    My Cart
                  </button>

                  <div className="pd-dropdown-divider" />

                  <button className="pd-dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={17} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ BREADCRUMB ═══════════════ */}
      <div className="pd-breadcrumb">
        <span onClick={() => navigate('/userpanel')}>Home</span>
        <ChevronRight size={16} />
        <span onClick={() => navigate('/userpanel')}>{product.category}</span>
        <ChevronRight size={16} />
        <span className="active">{product.name}</span>
      </div>

      {/* ═══════════════ MAIN PRODUCT ═══════════════ */}
      <div className="pd-main">

        {/* Gallery */}
        <div className="pd-gallery">
          <div className="pd-main-image">
            <img
              src={images[selectedImage]}
              alt={product.name}
              onError={(e) => { e.target.src = getFallbackImage(); }}
            />
            {!product.isAvailable && (
              <div className="pd-out-of-stock-overlay">Out of Stock</div>
            )}
            {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
              <div className="pd-low-stock-badge">Only {product.stockQuantity} left!</div>
            )}
          </div>

          {images.length > 1 && (
            <div className="pd-thumbnails">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`pd-thumb ${selectedImage === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="pd-info">
          <div className="pd-category-badge">{product.category}</div>

          <h1 className="pd-title">{product.name}</h1>

          <div className="pd-rating">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={18} style={{ fill: i <= 4 ? '#f59e0b' : 'none', color: i <= 4 ? '#f59e0b' : '#d1d5db' }} />
            ))}
            <span className="pd-rating-text">4.0 (128 reviews)</span>
          </div>

          <div className="pd-price-section">
            <span className="pd-price">{formatPrice(product.price)}</span>
            {product.unit && <span className="pd-unit">/ {product.unit}</span>}
          </div>

          <p className="pd-description">{product.description || 'No description available.'}</p>

          <div className="pd-highlights">
            <div className="pd-highlight"><Check size={18} /><span>Freshly baked daily</span></div>
            <div className="pd-highlight"><Check size={18} /><span>Premium ingredients</span></div>
            <div className="pd-highlight"><Check size={18} /><span>Handcrafted with care</span></div>
          </div>

          {product.isAvailable && (
            <div className="pd-quantity-section">
              <label>Quantity:</label>
              <div className="pd-qty-controls">
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}><Minus size={18} /></button>
                <span className="pd-qty-value">{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= (product.stockQuantity || 99)}><Plus size={18} /></button>
              </div>
            </div>
          )}

          <div className="pd-actions">
            {product.isAvailable ? (
              <>
                <button className="pd-add-cart-btn" onClick={handleAddToCart} disabled={addingToCart}>
                  {addingToCart
                    ? <><Loader size={18} className="pd-spinner" />Adding...</>
                    : <><ShoppingCart size={18} />Add to Cart</>
                  }
                </button>
                <button className="pd-buy-now-btn" onClick={handleBuyNow} disabled={addingToCart}>
                  Buy Now
                </button>
              </>
            ) : (
              <button className="pd-unavailable-btn" disabled>
                <Package size={18} /> Out of Stock
              </button>
            )}

            <button
              className={`pd-fav-btn ${isFavourited ? 'favourited' : ''}`}
              onClick={handleToggleFavourite}
              disabled={togglingFav}
            >
              <Heart size={20} style={{ fill: isFavourited ? '#ef4444' : 'none' }} />
            </button>

            <div className="pd-share-wrapper">
              <button className="pd-share-btn" onClick={handleShare}><Share2 size={20} /></button>
              {showShareMenu && (
                <div className="pd-share-menu">
                  <button onClick={copyLink}>Copy Link</button>
                </div>
              )}
            </div>
          </div>

          <div className="pd-trust-badges">
            <div className="pd-badge">
              <Truck size={20} />
              <div><strong>Free Delivery</strong><span>On orders over $50</span></div>
            </div>
            <div className="pd-badge">
              <Shield size={20} />
              <div><strong>Secure Payment</strong><span>100% protected</span></div>
            </div>
            <div className="pd-badge">
              <Clock size={20} />
              <div><strong>Same Day</strong><span>Order before 2PM</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ TABS ═══════════════ */}
      <div className="pd-tabs-section">
        <div className="pd-tabs-header">
          {['description','ingredients','nutrition','reviews'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'reviews' ? 'Reviews (128)' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="pd-tabs-content">
          {activeTab === 'description' && (
            <div className="pd-tab-panel">
              <h3>About This Product</h3>
              <p>{product.description || 'Crafted with the finest ingredients and traditional baking methods.'}</p>
              <p>Each item is prepared fresh daily by our experienced bakers, ensuring you receive the absolute best in taste and texture.</p>
              {product.allergens && (
                <div className="pd-allergen-info">
                  <Info size={18} /><strong>Allergens:</strong> {product.allergens}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ingredients' && (
            <div className="pd-tab-panel">
              <h3>Ingredients</h3>
              <p>Premium flour, organic butter, free-range eggs, pure cane sugar, Madagascar vanilla, sea salt.</p>
              <ul className="pd-ingredients-list">
                <li>Premium unbleached wheat flour</li>
                <li>Organic European-style butter</li>
                <li>Free-range eggs</li>
                <li>Pure cane sugar</li>
                <li>Madagascar bourbon vanilla</li>
                <li>Himalayan pink salt</li>
              </ul>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="pd-tab-panel">
              <h3>Nutrition Facts</h3>
              <div className="pd-nutrition-table">
                {[['Serving Size', product.unit || '1 piece'], ['Calories','280'], ['Total Fat','12g'], ['Carbohydrates','38g'], ['Protein','6g'], ['Sugar','14g']].map(([label, val]) => (
                  <div className="pd-nutrition-row" key={label}>
                    <span>{label}</span><strong>{val}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="pd-tab-panel">
              <h3>Customer Reviews</h3>
              <div className="pd-reviews-summary">
                <div className="pd-reviews-avg">
                  <span className="pd-avg-score">4.0</span>
                  <div>
                    <div className="pd-stars">
                      {[1,2,3,4,5].map(i => <Star key={i} size={16} style={{ fill: i<=4?'#f59e0b':'none', color: i<=4?'#f59e0b':'#d1d5db' }} />)}
                    </div>
                    <span>Based on 128 reviews</span>
                  </div>
                </div>
              </div>
              {[
                { name: 'Sarah M.', stars: 5, text: '"Absolutely delicious! The texture is perfect and the taste is incredible. Will definitely order again!"', date: '2 days ago' },
                { name: 'Michael K.', stars: 4, text: '"Great quality and fresh. Only wish the portions were slightly larger for the price."', date: '1 week ago' }
              ].map(r => (
                <div className="pd-review" key={r.name}>
                  <div className="pd-review-header">
                    <strong>{r.name}</strong>
                    <div className="pd-stars">
                      {[1,2,3,4,5].map(i => <Star key={i} size={14} style={{ fill: i<=r.stars?'#f59e0b':'none', color: i<=r.stars?'#f59e0b':'#d1d5db' }} />)}
                    </div>
                  </div>
                  <p>{r.text}</p>
                  <span className="pd-review-date">{r.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════ SIMILAR PRODUCTS ═══════════════ */}
      {similarProducts.length > 0 && (
        <div className="pd-similar-section">
          <h2>You May Also Like</h2>
          <div className="pd-similar-grid">
            {similarProducts.map(item => (
              <div key={item.productId} className="pd-similar-card" onClick={() => navigate(`/product/${item.productId}`)}>
                <div className="pd-similar-image">
                  <img src={item.imageUrl || getFallbackImage()} alt={item.name} onError={(e) => { e.target.src = getFallbackImage(); }} />
                </div>
                <div className="pd-similar-info">
                  <span className="pd-similar-category">{item.category}</span>
                  <h4>{item.name}</h4>
                  <span className="pd-similar-price">{formatPrice(item.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetails;