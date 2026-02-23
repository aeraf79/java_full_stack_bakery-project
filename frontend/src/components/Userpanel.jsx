import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut, Settings, ChevronDown, ShoppingBag, Heart,
  ShoppingCart, Search, X, Plus, Sliders, Grid, List,
  Package, Tag, Coffee, Cake, Cookie, Croissant, Leaf,
  AlertCircle, Star, Clock, ChevronRight, Truck, Award,
  Sparkles, Gift, ArrowRight, Phone, Mail, MapPin, Flame,
  TrendingUp, Shield, RefreshCw, ChevronLeft, Quote,
} from "lucide-react";

import "./userpanel.css";
import Footer from "./Footer";
import FavouritesDropdown from "../pages/Favouritesdropdown";
import "../pages/Favouritesdropdown.css";
import QuickViewModal from "../pages/Quickviewmodal";
import "../pages/Quickviewmodal.css";

// ─── Countdown Hook ─────────────────────────────────────────────────────────
const useCountdown = () => {
  const [time, setTime] = useState({ h: "08", m: "45", s: "30" });
  useEffect(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 0);
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = String(Math.floor(diff / 3600000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setTime({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
};

// ─── Testimonials ────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: "Priya S.", loc: "Mumbai", text: "The sourdough is absolutely divine — crusty outside, pillowy inside. Best I've ever had outside of Paris!", stars: 5, avatar: "PS" },
  { name: "Rahul M.", loc: "Pune",   text: "Their croissants are buttery perfection. I order every Sunday morning without fail. Worth every rupee.", stars: 5, avatar: "RM" },
  { name: "Anjali K.", loc: "Delhi", text: "The custom birthday cake blew everyone away. Moist layers, gorgeous decoration and it tasted even better than it looked.", stars: 5, avatar: "AK" },
  { name: "Dev T.",   loc: "Bengaluru", text: "Same-day delivery and everything arrived warm. The almond croissants were still flaky. Incredible service.", stars: 5, avatar: "DT" },
];

const UserPanel = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userData, setUserData] = useState({ fullName: "", email: "", role: "" });

  const [products, setProducts]               = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [categories, setCategories]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [loadingMore, setLoadingMore]         = useState(false);
  const [error, setError]                     = useState("");
  const [apiStatus, setApiStatus]             = useState("");
  const [imageErrors, setImageErrors]         = useState({});

  const [cartCount, setCartCount]     = useState(0);
  const [addingToCart, setAddingToCart] = useState({});

  const [favouritedIds, setFavouritedIds] = useState(new Set());
  const [togglingFav, setTogglingFav]     = useState({});

  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewAdding, setQuickViewAdding]   = useState(false);

  const [currentPage, setCurrentPage]     = useState(1);
  const [productsPerPage]                 = useState(10);
  const [hasMore, setHasMore]             = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery]     = useState("");
  const [priceRange, setPriceRange]       = useState({ min: 0, max: 1000 });
  const [showFilters, setShowFilters]     = useState(false);
  const [viewMode, setViewMode]           = useState("grid");
  const [sortBy, setSortBy]               = useState("newest");
  const [activeFilters, setActiveFilters] = useState([]);

  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const navigate    = useNavigate();
  const dropdownRef = useRef(null);
  const filterRef   = useRef(null);
  const countdown   = useCountdown();

  const categoryIcons = {
    Breads: <Croissant size={20} />, Bread: <Croissant size={20} />,
    Pastries: <Coffee size={20} />,  Cookies: <Cookie size={20} />,
    Cakes: <Cake size={20} />,       Muffins: <Coffee size={20} />,
    Vegan: <Leaf size={20} />,       "Gluten-Free": <AlertCircle size={20} />,
    Seasonal: <Tag size={20} />,     default: <Tag size={20} />,
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token      = localStorage.getItem("token");
    if (!storedUser || !token) { navigate("/login"); return; }
    try {
      const user = JSON.parse(storedUser);
      setUserData({ fullName: user.fullName || "User", email: user.email || "", role: user.role || "USER" });
    } catch { navigate("/login"); }
  }, [navigate]);

  useEffect(() => { fetchProducts(); fetchCartCount(); fetchFavouritedIds(); }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const id = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4500);
    return () => clearInterval(id);
  }, []);

  const fetchFavouritedIds = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8080/api/favourites/ids", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setFavouritedIds(new Set(await res.json()));
    } catch {}
  };

  const handleToggleFavourite = async (e, product) => {
    e.stopPropagation();
    if (togglingFav[product.productId]) return;
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    setTogglingFav(p => ({ ...p, [product.productId]: true }));
    setFavouritedIds(prev => {
      const next = new Set(prev);
      next.has(product.productId) ? next.delete(product.productId) : next.add(product.productId);
      return next;
    });
    try {
      const res = await fetch(`http://localhost:8080/api/favourites/toggle/${product.productId}`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setFavouritedIds(prev => {
          const next = new Set(prev);
          next.has(product.productId) ? next.delete(product.productId) : next.add(product.productId);
          return next;
        });
        showToast("Failed to update favourites", "error");
      } else {
        const data = await res.json();
        showToast(data.message, data.isFavourited ? "success" : "info");
      }
    } catch { showToast("Failed to update favourites", "error"); }
    finally { setTogglingFav(p => ({ ...p, [product.productId]: false })); }
  };

  const handleFavDropdownAction = (action) => {
    if (action.type === "removeFavourite") {
      setFavouritedIds(prev => { const next = new Set(prev); next.delete(action.productId); return next; });
    }
    if (action.type === "addToCart") handleAddToCart(action.product);
  };

  const handleFavCountChange = (productId) => {
  setFavouritedIds(prev => {
    const next = new Set(prev);
    next.delete(productId);
    return next;
  });
};

  const fetchProducts = async () => {
    setLoading(true); setError(""); setApiStatus("Connecting to API...");
    try {
      const token = localStorage.getItem("token");
      const headers = { "Content-Type": "application/json", Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const response = await fetch("http://localhost:8080/api/products/all", { method: "GET", headers });
      setApiStatus(`Server responded: ${response.status}`);
      if (!response.ok) {
        if (response.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); setTimeout(() => navigate("/login"), 2000); throw new Error("Session expired."); }
        throw new Error(`Server error (${response.status})`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format.");
      const processed = data.map(p => ({
        ...p, price: typeof p.price === "string" ? parseFloat(p.price) : p.price || 0,
        isAvailable: p.isAvailable !== undefined ? p.isAvailable : true,
      }));
      setProducts(processed);
      setCategories([...new Set(processed.map(p => p.category).filter(Boolean))]);
      const prices = processed.map(p => p.price).filter(p => !isNaN(p) && p > 0);
      if (prices.length) setPriceRange({ min: 0, max: Math.ceil(Math.max(...prices)) });
      setApiStatus(`Loaded ${processed.length} products`);
    } catch (err) { setError(err.message); setApiStatus(`Error: ${err.message}`); }
    finally { setLoading(false); }
  };

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:8080/api/cart/count", {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.ok) { const d = await res.json(); setCartCount(d.count ?? 0); }
    } catch {}
  };

  const handleImageError  = (id) => setImageErrors(p => ({ ...p, [id]: true }));
  const getFallbackImage  = (cat) => {
    const m = { Breads: "Bread", Bread: "Bread", Pastries: "Pastries", Cookies: "Cookies", Cakes: "Cakes", Muffins: "Muffins", Vegan: "Vegan", "Gluten-Free": "GF" };
    const label = m[cat] || encodeURIComponent(cat || "Product");
    const color = cat === "Vegan" ? "228B22" : "8B4513";
    return `https://placehold.co/600x400/${color}/FFFFFF?text=${label}`;
  };

  useEffect(() => {
    if (!products.length) { setFilteredProducts([]); setDisplayedProducts([]); setHasMore(false); return; }
    let r = [...products];
    if (selectedCategory !== "all") r = r.filter(p => p.category === selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      r = r.filter(p => (p.name||"").toLowerCase().includes(q) || (p.description||"").toLowerCase().includes(q) || (p.category||"").toLowerCase().includes(q));
    }
    r = r.filter(p => p.price >= priceRange.min && p.price <= priceRange.max && p.isAvailable === true);
    switch (sortBy) {
      case "price-low":  r.sort((a,b) => a.price - b.price); break;
      case "price-high": r.sort((a,b) => b.price - a.price); break;
      case "name":       r.sort((a,b) => (a.name||"").localeCompare(b.name||"")); break;
      case "newest":     r.sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)); break;
      case "oldest":     r.sort((a,b) => new Date(a.createdAt||0) - new Date(b.createdAt||0)); break;
    }
    setFilteredProducts(r);
    setCurrentPage(1);
    const f = [];
    if (selectedCategory !== "all") f.push("category");
    if (searchQuery) f.push("search");
    const maxP = Math.max(...products.map(p => p.price), 100);
    if (priceRange.min > 0 || priceRange.max < maxP) f.push("price");
    setActiveFilters(f);
  }, [products, selectedCategory, searchQuery, priceRange, sortBy]);

  useEffect(() => {
    if (filteredProducts.length > 0) {
      const end = currentPage * productsPerPage;
      setDisplayedProducts(filteredProducts.slice(0, end));
      setHasMore(end < filteredProducts.length);
    } else { setDisplayedProducts([]); setHasMore(false); }
  }, [filteredProducts, currentPage, productsPerPage]);

  const loadMoreProducts = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => { setCurrentPage(p => p + 1); setLoadingMore(false); }, 500);
  };

  const handleLogout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/"); };

  const handleAddToCart = async (product, quantity = 1) => {
    if (addingToCart[product.productId]) return;
    const token = localStorage.getItem("token");
    if (!token) { showToast("Please login to add items to cart", "error"); navigate("/login"); return; }
    setAddingToCart(p => ({ ...p, [product.productId]: true }));
    try {
      const res = await fetch("http://localhost:8080/api/cart/add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId, quantity }),
      });
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); showToast("Session expired.", "error"); navigate("/login"); return; }
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || err?.message || "Failed to add item to cart");
      }
      const data = await res.json();
      setCartCount(data.totalItems ?? 0);
      showToast(`${product.name} added to cart!`, "success");
    } catch (err) { showToast(err.message || "Failed to add item to cart", "error"); }
    finally { setAddingToCart(p => ({ ...p, [product.productId]: false })); }
  };

  const handleQuickViewAddToCart = async (product, quantity) => {
    setQuickViewAdding(true);
    const token = localStorage.getItem("token");
    if (!token) { showToast("Please login to add items to cart", "error"); navigate("/login"); setQuickViewAdding(false); return; }
    try {
      const res = await fetch("http://localhost:8080/api/cart/add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.productId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add to cart");
      const data = await res.json();
      setCartCount(data.totalItems ?? 0);
      showToast(`${product.name} × ${quantity} added to cart!`, "success");
      setQuickViewProduct(null);
    } catch (err) { showToast(err.message || "Failed to add to cart", "error"); }
    finally { setQuickViewAdding(false); }
  };

  const showToast = (message, type = "success") => {
    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `<div class="toast-content">
      ${type === "success"
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`}
      <span>${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const clearFilters = () => {
    setSelectedCategory("all"); setSearchQuery("");
    if (products.length) setPriceRange({ min: 0, max: Math.ceil(Math.max(...products.map(p => p.price), 100)) });
    setSortBy("newest");
  };

  const formatPrice = (price) => {
    if (price === undefined || price === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(price);
  };

  const currentT = TESTIMONIALS[testimonialIdx];

  return (
    <div className="user-panel">
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleQuickViewAddToCart}
          addingToCart={quickViewAdding}
        />
      )}

      {/* ═══ NAVBAR ══════════════════════════════════════════════════════ */}
      <nav className={`user-nav ${scrolled ? "nav-scrolled" : ""}`}>
        <div className="nav-container">
          <div className="logo" onClick={() => navigate("/userpanel")}>Maison Dorée</div>

          <div className="nav-actions">
            <div className="search-bar desktop-search">
              <Search size={18} />
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && <button className="clear-search" onClick={() => setSearchQuery("")}><X size={16} /></button>}
            </div>
            <FavouritesDropdown
  onAction={handleFavDropdownAction}
  favouritedIds={favouritedIds}
  onCountChange={handleFavCountChange}
/>

            <button className="cart-btn" onClick={() => navigate("/cart")}>
              <ShoppingCart size={28} />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </button>
            <div className="profile-section" ref={dropdownRef}>
              <button className="profile-btn" onClick={() => setDropdownOpen(p => !p)}>
                <div className="profile-avatar">{getInitials(userData.fullName)}</div>
                <ChevronDown size={16} className={`chevron ${dropdownOpen ? "rotate" : ""}`} />
              </button>
              {dropdownOpen && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{getInitials(userData.fullName)}</div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-username">{userData.fullName}</div>
                      <div className="dropdown-email">{userData.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { navigate("/profile"); setDropdownOpen(false); }}><Settings size={16} /><span>Profile Settings</span></button>
                  <button className="dropdown-item" onClick={() => { navigate("/orders"); setDropdownOpen(false); }}><ShoppingBag size={16} /><span>My Orders</span></button>
                  <button className="dropdown-item" onClick={() => { navigate("/favourites"); setDropdownOpen(false); }}><Heart size={16} /><span>Favourites</span></button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={handleLogout}><LogOut size={16} /><span>Logout</span></button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mobile-search-container">
          <div className="search-bar mobile-search">
            <Search size={18} />
            <input type="text" placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            {searchQuery && <button className="clear-search" onClick={() => setSearchQuery("")}><X size={16} /></button>}
          </div>
        </div>
      </nav>

      <main className="panel-content">

        {/* ═══ HERO BANNER ════════════════════════════════════════════════ */}
        <div className="hero-banner">
          <div className="hero-banner-content">
            <div className="hero-badge"><span className="badge-icon">🥖</span>Artisan Bakery Since 1985</div>
            <h1 className="hero-main-title">
              Fresh From The Oven
              <span className="title-highlight">To Your Doorstep</span>
            </h1>
            <p className="hero-subtitle">
              Discover our collection of handcrafted breads, pastries, and cakes made daily with premium ingredients and traditional recipes.
            </p>
            <div className="hero-stats">
              <div className="stat-card">
                <div className="stat-icon">🥐</div>
                <div className="stat-info"><span className="stat-number">{products.length}+</span><span className="stat-label">Artisan Products</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🍰</div>
                <div className="stat-info"><span className="stat-number">{categories.length}</span><span className="stat-label">Categories</span></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🚚</div>
                <div className="stat-info"><span className="stat-number">Free</span><span className="stat-label">Express Shipping</span></div>
              </div>
            </div>
            <div className="hero-actions">
              <button className="hero-primary-btn" onClick={() => document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth" })}>
                Shop Now <ArrowRight size={20} />
              </button>
              <button className="hero-secondary-btn" onClick={() => document.querySelector(".featured-offers-section")?.scrollIntoView({ behavior: "smooth" })}>
                View Offers
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-grid">
              <div className="grid-item item-1"><img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop" alt="Fresh bread" /></div>
              <div className="grid-item item-2"><img src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop" alt="Croissant" /></div>
              <div className="grid-item item-3"><img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop" alt="Cake" /></div>
              <div className="grid-item item-4"><img src="https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop" alt="Cookies" /></div>
            </div>
            <div className="hero-floating-elements">
              <span className="float-element">🥐</span>
              <span className="float-element">🥖</span>
              <span className="float-element">🍰</span>
              <span className="float-element">🥨</span>
              <span className="float-element">🥯</span>
            </div>
            <div className="experience-badge"><div className="years">35+</div><div className="years-text">Years of<br />Tradition</div></div>
          </div>
        </div>

        {/* ═══ TRUST STRIP ════════════════════════════════════════════════ */}
        <div className="trust-strip">
          <div className="trust-item"><Truck size={22} /><div><strong>Free Delivery</strong><span>On orders above ₹500</span></div></div>
          <div className="trust-divider" />
          <div className="trust-item"><RefreshCw size={22} /><div><strong>Fresh Daily</strong><span>Baked every morning</span></div></div>
          <div className="trust-divider" />
          <div className="trust-item"><Shield size={22} /><div><strong>100% Natural</strong><span>No preservatives</span></div></div>
          <div className="trust-divider" />
          <div className="trust-item"><Award size={22} /><div><strong>Award Winning</strong><span>Best bakery 2023</span></div></div>
          <div className="trust-divider" />
          <div className="trust-item"><Clock size={22} /><div><strong>Same Day</strong><span>Order before 12 PM</span></div></div>
        </div>

        {/* ═══ OFFER BANNER ═══════════════════════════════════════════════ */}
        <div className="hero-offer-banner">
          <div className="hero-banner-content">
            <span className="hero-badge">🔥 LIMITED TIME OFFER</span>
            <h1 className="hero-title">Freshly Baked<span>Daily</span></h1>
            <p className="hero-description">Get 20% off on all pastries when you order before 10 AM. Start your day with the perfect breakfast!</p>
            <div className="hero-countdown">
              <div className="countdown-item"><div className="countdown-value">{countdown.h}</div><div className="countdown-label">Hours</div></div>
              <div className="countdown-item"><div className="countdown-value">{countdown.m}</div><div className="countdown-label">Minutes</div></div>
              <div className="countdown-item"><div className="countdown-value">{countdown.s}</div><div className="countdown-label">Seconds</div></div>
            </div>
            <button className="hero-btn" onClick={() => document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth" })}>
              Order Now <ArrowRight size={20} />
            </button>
            <div className="floating-elements">
              <span className="floating-item">🥐</span>
              <span className="floating-item">🥖</span>
              <span className="floating-item">🍰</span>
            </div>
          </div>
          <div className="hero-image">
            <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop" alt="Freshly baked pastries" />
          </div>
        </div>

        {/* ═══ CATEGORIES ═════════════════════════════════════════════════ */}
        <div className="categories-section">
          <div className="section-header">
            <div className="section-title-group">
              <h2>Shop by Category</h2>
              <p>Explore our handcrafted selection</p>
            </div>
            <button className={`filter-toggle-btn ${showFilters ? "active" : ""}`} onClick={() => setShowFilters(!showFilters)}>
              <Sliders size={18} /><span>Filters</span>
              {activeFilters.length > 0 && <span className="filter-badge">{activeFilters.length}</span>}
            </button>
          </div>
          <div className="categories-container">
            <button className={`category-card ${selectedCategory === "all" ? "active" : ""}`} onClick={() => setSelectedCategory("all")}>
              <div className="category-icon"><Grid size={24} /></div>
              <span className="category-name">All Products</span>
              <span className="category-count">{products.length}</span>
            </button>
            {categories.map(cat => (
              <button key={cat} className={`category-card ${selectedCategory === cat ? "active" : ""}`} onClick={() => setSelectedCategory(cat)}>
                <div className="category-icon">{categoryIcons[cat] || categoryIcons.default}</div>
                <span className="category-name">{cat}</span>
                <span className="category-count">{products.filter(p => p.category === cat).length}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ FILTERS SIDEBAR ════════════════════════════════════════════ */}
        {showFilters && (
          <div className="filters-sidebar" ref={filterRef}>
            <div className="filters-header">
              <h3>Filter Products</h3>
              <button className="close-filters" onClick={() => setShowFilters(false)}><X size={20} /></button>
            </div>
            <div className="filters-content">
              <div className="filter-group">
                <label>Price Range</label>
                <div className="price-inputs">
                  <div className="price-input"><span>Min</span><input type="number" value={priceRange.min} onChange={e => setPriceRange(p => ({ ...p, min: Number(e.target.value) }))} min={0} max={priceRange.max} /></div>
                  <div className="price-input"><span>Max</span><input type="number" value={priceRange.max} onChange={e => setPriceRange(p => ({ ...p, max: Number(e.target.value) }))} min={priceRange.min} max={Math.max(...products.map(p => p.price), 100)} /></div>
                </div>
                <div className="price-range-display">{formatPrice(priceRange.min)} – {formatPrice(priceRange.max)}</div>
              </div>
              <div className="filter-group">
                <label>Sort By</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
              <div className="filter-group">
                <label>View Mode</label>
                <div className="view-mode-buttons">
                  <button className={`view-mode-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")}><Grid size={18} /> Grid</button>
                  <button className={`view-mode-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")}><List size={18} /> List</button>
                </div>
              </div>
              <button className="clear-filters-btn" onClick={clearFilters}>Clear All Filters</button>
            </div>
          </div>
        )}

        {/* ═══ PRODUCTS SECTION ═══════════════════════════════════════════ */}
        <div className="products-section">
          <div className="products-header">
            <div className="products-title">
              <h2>{selectedCategory === "all" ? "All Products" : selectedCategory}</h2>
              <span className="products-count">Showing {displayedProducts.length} of {filteredProducts.length} items</span>
            </div>
            <div className="mobile-sort">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low</option>
                <option value="price-high">Price: High</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading delicious products…</p>
              {apiStatus && <p style={{ fontSize: "0.9rem", color: "#888", marginTop: "0.5rem" }}>{apiStatus}</p>}
            </div>
          ) : error ? (
            <div className="error-state">
              <AlertCircle size={48} />
              <h3>Oops! Something went wrong</h3>
              <p>{error}</p>
              <button onClick={fetchProducts} className="retry-btn">Try Again</button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <Package size={64} />
              <h3>No products found</h3>
              <p>{products.length === 0 ? "No products available in the database." : "Try adjusting your filters or search query."}</p>
              {products.length === 0
                ? <button onClick={fetchProducts} className="retry-btn">Refresh</button>
                : <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
              }
            </div>
          ) : (
            <>
              <div className={`products-grid ${viewMode === "list" ? "list-view" : ""}`}>
                {displayedProducts.map((product) => (
                  <div key={product.productId} className="product-card" onClick={() => navigate(`/product/${product.productId}`)} style={{ cursor: "pointer" }}>
                    <div className="product-image-container">
                      <div className="product-image">
                        {!imageErrors[product.productId] && product.imageUrl
                          ? <img src={product.imageUrl} alt={product.name} onError={() => handleImageError(product.productId)} loading="lazy" />
                          : <img src={getFallbackImage(product.category)} alt={product.name} style={{ objectFit: "cover" }} />
                        }
                      </div>

                      {product.stockQuantity <= 5 && product.stockQuantity > 0 && <span className="low-stock-badge">Low Stock</span>}
                      {!product.isAvailable && <span className="out-of-stock-badge">Out of Stock</span>}

                      {/* ✅ QUICK VIEW overlay — UNCHANGED */}
                      <div className="quick-view-overlay" onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); }}>
                        <span className="quick-view-text">QUICK VIEW</span>
                      </div>

                      {/* ✅ Favourite button */}
                      <button
                        className={`favourite-btn ${favouritedIds.has(product.productId) ? "favourited" : ""}`}
                        onClick={(e) => handleToggleFavourite(e, product)}
                        disabled={togglingFav[product.productId]}
                        title={favouritedIds.has(product.productId) ? "Remove from favourites" : "Add to favourites"}
                      >
                        <Heart size={20} style={{ fill: favouritedIds.has(product.productId) ? "#ef4444" : "none", color: favouritedIds.has(product.productId) ? "#ef4444" : "currentColor", transition: "all 0.2s" }} />
                      </button>
                    </div>

                    <div className="product-info">
                      <div className="product-category">{product.category}</div>
                      <h3 className="product-name">{product.name}</h3>
                      {viewMode === "list" && product.description && <p className="product-description">{product.description}</p>}
                      <div className="product-footer">
                        <div className="price-section">
                          <span className="product-price">{formatPrice(product.price)}</span>
                          {product.unit && <span className="product-unit">/{product.unit}</span>}
                        </div>
                        <button
                          className="add-to-cart-btn"
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                          disabled={!product.isAvailable || addingToCart[product.productId]}
                        >
                          {addingToCart[product.productId] ? (<><span className="spinner-small" /><span>Adding…</span></>) : product.isAvailable ? (<><Plus size={18} /><span>Add</span></>) : (<span>Out of Stock</span>)}
                        </button>
                      </div>
                      {viewMode === "list" && product.allergens && <div className="product-allergens"><span>Allergens: {product.allergens}</span></div>}
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="load-more-container">
                  <button className="load-more-btn" onClick={loadMoreProducts} disabled={loadingMore}>
                    {loadingMore ? (<><span className="spinner-small" />Loading…</>) : (<>Show More <ChevronRight size={20} /></>)}
                  </button>
                  <p className="load-more-info">Showing {displayedProducts.length} of {filteredProducts.length} products</p>
                </div>
              )}
              {!hasMore && displayedProducts.length > 0 && (
                <div className="all-products-loaded"><p>You've seen all {filteredProducts.length} products 🎉</p></div>
              )}
            </>
          )}
        </div>

        {/* ═══ WHY CHOOSE US ══════════════════════════════════════════════ */}
        <div className="why-us-section">
          <div className="why-us-inner">
            <div className="section-label">Why Maison Dorée</div>
            <h2>Baked with Passion,<br />Delivered with Care</h2>
            <p>Every loaf, every pastry, every cake — made from scratch each morning using time-honoured techniques and the finest ingredients.</p>
            <div className="why-us-grid">
              {[
                { icon: "🌾", title: "Heritage Recipes", desc: "Our recipes have been passed down through generations of master bakers." },
                { icon: "🥚", title: "Premium Ingredients", desc: "Free-range eggs, organic flour, and locally-sourced dairy in every product." },
                { icon: "🔥", title: "Baked Daily", desc: "Nothing sits on the shelf overnight. Fresh every single morning." },
                { icon: "📦", title: "Safe Packaging", desc: "Eco-friendly packaging that keeps your order fresh and intact on delivery." },
              ].map((item, i) => (
                <div className="why-card" key={i}>
                  <div className="why-icon">{item.icon}</div>
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ FEATURED OFFERS ════════════════════════════════════════════ */}
        <div className="featured-offers-section">
          <div className="section-title-centered">
            <div className="section-label">Special Deals</div>
            <h2>Today's Special Offers</h2>
            <p>Limited-time deals on our most-loved items</p>
          </div>
          <div className="offers-grid">
            {[
              { badge: "-20%", emoji: "🥐", title: "Morning Bliss", sub: "Breakfast Special", desc: "Fresh croissants, danishes, and morning pastries. Perfect with your morning coffee!", time: <><Clock size={16} /><span>Until 10 AM</span></>, orig: "₹1,999", price: "₹1,599", btn: "Order Breakfast" },
              { badge: "BESTSELLER", emoji: "🍞", title: "Family Feast", sub: "Assorted Bread Box", desc: "6 assorted artisan breads, 2 pastries, and our signature house spreads.", time: <><Tag size={16} /><span>Save ₹1,200</span></>, orig: "₹3,999", price: "₹2,799", btn: "Get Family Pack" },
              { badge: "NEW", emoji: "🎂", title: "Sweet Indulgence", sub: "Premium Cakes & Desserts", desc: "Try our new cheesecake collection — available in 6 extraordinary flavors.", time: <><Star size={16} /><span>Limited Edition</span></>, orig: "₹3,299", price: "₹2,499", btn: "Explore Desserts" },
            ].map((o, i) => (
              <div className="offer-card" key={i}>
                <span className="offer-badge">{o.badge}</span>
                <div className="offer-image"><div className="offer-image-placeholder">{o.emoji}</div></div>
                <div className="offer-content">
                  <h3 className="offer-title">{o.title}<span>{o.sub}</span></h3>
                  <p className="offer-description">{o.desc}</p>
                  <div className="offer-meta">
                    <div className="offer-time">{o.time}</div>
                    <div className="offer-price"><span className="original-price">{o.orig}</span>{o.price}</div>
                  </div>
                  <button className="offer-btn" onClick={() => document.querySelector(".products-section")?.scrollIntoView({ behavior: "smooth" })}>
                    {o.btn} <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Mini offer strips */}
          <div className="mini-offers">
            <div className="mini-offer-card">
              <div className="mini-offer-icon">🥖</div>
              <div className="mini-offer-content">
                <h4 className="mini-offer-title">Buy 2 Get 1 Free</h4>
                <p className="mini-offer-description">On all artisan breads</p>
                <span className="mini-offer-price">Code: BREADLOVE</span>
              </div>
            </div>
            <div className="mini-offer-card">
              <div className="mini-offer-icon">☕</div>
              <div className="mini-offer-content">
                <h4 className="mini-offer-title">Free Tea/Coffee</h4>
                <p className="mini-offer-description">With any pastry purchase</p>
                <span className="mini-offer-price">Morning hours only</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ TESTIMONIALS ═══════════════════════════════════════════════ */}
        <div className="testimonials-section">
          <div className="section-title-centered">
            <div className="section-label">Customer Love</div>
            <h2>What Our Customers Say</h2>
          </div>
          <div className="testimonial-slider">
            <button className="tslide-btn tslide-prev" onClick={() => setTestimonialIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}>
              <ChevronLeft size={20} />
            </button>
            <div className="testimonial-card">
              <div className="t-quote"><Quote size={32} /></div>
              <p className="t-text">"{currentT.text}"</p>
              <div className="t-stars">{'★'.repeat(currentT.stars)}</div>
              <div className="t-author">
                <div className="t-avatar">{currentT.avatar}</div>
                <div><strong>{currentT.name}</strong><span>{currentT.loc}</span></div>
              </div>
            </div>
            <button className="tslide-btn tslide-next" onClick={() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length)}>
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="t-dots">
            {TESTIMONIALS.map((_, i) => (
              <button key={i} className={`t-dot ${i === testimonialIdx ? "active" : ""}`} onClick={() => setTestimonialIdx(i)} />
            ))}
          </div>
        </div>

        {/* ═══ NEWSLETTER ═════════════════════════════════════════════════ */}
        <div className="newsletter-section">
          <div className="newsletter-inner">
            <div className="newsletter-left">
              <div className="nl-emoji">📬</div>
              <div>
                <h3>Get Fresh Offers in Your Inbox</h3>
                <p>Subscribe for weekly deals, new arrivals, and baking secrets from our chefs.</p>
              </div>
            </div>
            <div className="newsletter-right">
              <div className="nl-input-row">
                <input type="email" placeholder="Your email address" />
                <button>Subscribe</button>
              </div>
              <p className="nl-note">No spam. Unsubscribe anytime.</p>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default UserPanel;