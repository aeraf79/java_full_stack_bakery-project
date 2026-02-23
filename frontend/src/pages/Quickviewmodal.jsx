import React, { useEffect } from 'react';
import { X, Star, ShoppingCart, Plus, Minus, Package } from 'lucide-react';
import './Quickviewmodal.css';

const QuickViewModal = ({ product, onClose, onAddToCart, addingToCart }) => {
  const [quantity, setQuantity] = React.useState(1);

  // Close on ESC key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden'; // prevent bg scroll
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!product) return null;

  const formatPrice = (price) => {
    if (!price && price !== 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 2
    }).format(price);
  };

  const getFallbackImage = (category) => {
    const map = {
      'Breads': 'https://placehold.co/600x600/8B4513/FFFFFF?text=Bread',
      'Bread':  'https://placehold.co/600x600/8B4513/FFFFFF?text=Bread',
      'Pastries': 'https://placehold.co/600x600/A0522D/FFFFFF?text=Pastry',
      'Cookies':  'https://placehold.co/600x600/D2691E/FFFFFF?text=Cookie',
      'Cakes':    'https://placehold.co/600x600/CD853F/FFFFFF?text=Cake',
      'Muffins':  'https://placehold.co/600x600/DEB887/FFFFFF?text=Muffin',
    };
    return map[category] || `https://placehold.co/600x600/8B4513/FFFFFF?text=${encodeURIComponent(category || 'Product')}`;
  };

  const handleQtyChange = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > (product.stockQuantity || 99)) return product.stockQuantity || 99;
      return next;
    });
  };

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
  };

  return (
    <div className="qv-overlay" onClick={onClose}>
      <div className="qv-modal" onClick={(e) => e.stopPropagation()}>

        {/* Close button */}
        <button className="qv-close" onClick={onClose}>
          <X size={22} />
        </button>

        {/* Left: Image */}
        <div className="qv-image-side">
          <div className="qv-image-wrap">
            <img
              src={product.imageUrl || getFallbackImage(product.category)}
              alt={product.name}
              onError={(e) => { e.target.src = getFallbackImage(product.category); }}
            />
          </div>
          {!product.isAvailable && (
            <div className="qv-unavailable-tag">Out of Stock</div>
          )}
          {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
            <div className="qv-low-stock-tag">Only {product.stockQuantity} left!</div>
          )}
        </div>

        {/* Right: Details */}
        <div className="qv-details-side">

          {/* Category */}
          <span className="qv-category">{product.category}</span>

          {/* Name */}
          <h2 className="qv-name">{product.name}</h2>

          {/* Star rating (static display) */}
          <div className="qv-rating">
            {[1,2,3,4,5].map(i => (
              <Star
                key={i}
                size={16}
                style={{
                  fill: i <= 4 ? '#f59e0b' : 'none',
                  color: i <= 4 ? '#f59e0b' : '#d1d5db'
                }}
              />
            ))}
            <span className="qv-rating-text">( No reviews yet. )</span>
          </div>

          {/* Price */}
          <div className="qv-price">{formatPrice(product.price)}</div>

          {/* Description */}
          {product.description && (
            <p className="qv-description">{product.description}</p>
          )}

          <div className="qv-divider" />

          {/* Meta info */}
          <div className="qv-meta">
            {product.unit && (
              <div className="qv-meta-row">
                <span className="qv-meta-label">Unit:</span>
                <span className="qv-meta-value">{product.unit}</span>
              </div>
            )}
            {product.weight && (
              <div className="qv-meta-row">
                <span className="qv-meta-label">Weight:</span>
                <span className="qv-meta-value">{product.weight}g</span>
              </div>
            )}
            {product.allergens && (
              <div className="qv-meta-row">
                <span className="qv-meta-label">Allergens:</span>
                <span className="qv-meta-value">{product.allergens}</span>
              </div>
            )}
            <div className="qv-meta-row">
              <span className="qv-meta-label">Category:</span>
              <span className="qv-meta-value qv-meta-tag">{product.category}</span>
            </div>
            <div className="qv-meta-row">
              <span className="qv-meta-label">Availability:</span>
              <span className={`qv-meta-value ${product.isAvailable ? 'qv-in-stock' : 'qv-out-stock'}`}>
                {product.isAvailable ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          <div className="qv-divider" />

          {/* Quantity + Add to Cart */}
          {product.isAvailable ? (
            <div className="qv-actions">
              <div className="qv-qty">
                <button className="qv-qty-btn" onClick={() => handleQtyChange(-1)} disabled={quantity <= 1}>
                  <Minus size={16} />
                </button>
                <span className="qv-qty-val">{quantity}</span>
                <button className="qv-qty-btn" onClick={() => handleQtyChange(1)} disabled={quantity >= (product.stockQuantity || 99)}>
                  <Plus size={16} />
                </button>
              </div>

              <button
                className="qv-add-btn"
                onClick={handleAddToCart}
                disabled={addingToCart}
              >
                {addingToCart ? (
                  <><span className="qv-spinner" /><span>Adding...</span></>
                ) : (
                  <><ShoppingCart size={18} /><span>ADD TO CART</span></>
                )}
              </button>
            </div>
          ) : (
            <div className="qv-unavailable-msg">
              <Package size={18} />
              <span>Currently unavailable</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;