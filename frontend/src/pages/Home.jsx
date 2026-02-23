import './home.css';
import React, { useState, useEffect } from 'react';
import { ChevronRight, MapPin, Clock, Phone, Instagram, Facebook, Award, Heart, Users, Sparkles } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

import { useNavigate } from "react-router-dom";




const BakeryWebsite = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');

  const navigate = useNavigate();


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const products = [
    { 
      name: 'Artisan Sourdough', 
      price: '$8', 
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=600&h=400&fit=crop',
      desc: 'Traditional 48-hour fermented bread with a crispy crust',
      category: 'bread'
    },
    { 
      name: 'Butter Croissants', 
      price: '$4', 
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&h=400&fit=crop',
      desc: 'Buttery, flaky layers of pure heaven',
      category: 'pastry'
    },
    { 
      name: 'Chocolate Éclair', 
      price: '$6', 
      image: 'https://i.ibb.co/KjTYVxCr/b2.avif',
      desc: 'Classic French pastry filled with cream',
      category: 'pastry'
    },
    { 
      name: 'Cinnamon Rolls', 
      price: '$5', 
      image: 'https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=600&h=400&fit=crop',
      desc: 'Warm, gooey, and irresistible',
      category: 'pastry'
    },
    { 
      name: 'French Baguette', 
      price: '$6', 
      image: 'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=600&h=400&fit=crop',
      desc: 'Crusty outside, soft and airy inside',
      category: 'bread'
    },
    { 
      name: 'Berry Tart', 
      price: '$7', 
      image: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=400&fit=crop',
      desc: 'Fresh seasonal berries on buttery crust',
      category: 'dessert'
    },
    { 
      name: 'Almond Croissant', 
      price: '$5', 
      image: 'https://images.unsplash.com/photo-1623334044303-241021148842?w=600&h=400&fit=crop',
      desc: 'Filled with sweet almond cream',
      category: 'pastry'
    },
    { 
      name: 'Pain au Chocolat', 
      price: '$4.5', 
      image: 'https://i.ibb.co/HLbbhrxK/b1.webp',
      desc: 'Dark chocolate wrapped in flaky pastry',
      category: 'pastry'
    },
    { 
      name: 'Lemon Tart', 
      price: '$6.5', 
      image: 'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=600&h=400&fit=crop',
      desc: 'Tangy lemon curd with meringue',
      category: 'dessert'
    },
    { 
      name: 'Multigrain Loaf', 
      price: '$7', 
      image: 'https://i.ibb.co/0pYMjdJn/b3.webp',
      desc: 'Healthy blend of seeds and grains',
      category: 'bread'
    },
    { 
      name: 'Chocolate Cake', 
      price: '$8', 
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop',
      desc: 'Rich, decadent chocolate layers',
      category: 'dessert'
    },
    { 
      name: 'Apple Strudel', 
      price: '$5.5', 
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=400&fit=crop',
      desc: 'Traditional Austrian pastry with cinnamon apples',
      category: 'pastry'
    }
  ];

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'bread', name: 'Breads' },
    { id: 'pastry', name: 'Pastries' },
    { id: 'dessert', name: 'Desserts' }
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const testimonials = [
    {
      name: 'Sophie Martin',
      role: 'Local Food Critic',
      text: 'The croissants here are simply divine. Every bite transports you straight to Paris. Best bakery in the city!',
      rating: 5
    },
    {
      name: 'James Wilson',
      role: 'Regular Customer',
      text: 'I\'ve been coming here for 10 years. The quality never disappoints. Their sourdough is absolutely legendary.',
      rating: 5
    },
    {
      name: 'Emma Chen',
      role: 'Pastry Enthusiast',
      text: 'As someone who has traveled extensively through Europe, I can confidently say this is the real deal. Authentic and delicious.',
      rating: 5
    }
  ];

  return (
    <div className="bakery-site">
      {/* Header Component */}
      <Header scrolled={scrolled} />

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <div className="hero-subtitle">Artisan Bakery Since 1987</div>
          <h1 className="hero-title">
            Where Every Loaf<br />
            Tells a <span className="accent">Story</span>
          </h1>
          <p className="hero-description">
            Handcrafted with love, baked to perfection. Experience the warmth of traditional baking in every bite.
          </p>
          <button 
  className="cta-button"
  onClick={() => navigate("/register")}
>
  Explore Our Menu
  <ChevronRight size={20} />
</button>

        </div>
        <div className="scroll-indicator">
          <div style={{ fontSize: '2rem', opacity: 0.5 }}>↓</div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="featured">
        <div className="featured-content">
          <div className="featured-image">
            <img src="https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop" alt="Baker at work" />
            <div className="featured-badge">Master Bakers</div>
          </div>
          <div className="featured-text">
            <h2>The Art of Traditional Baking</h2>
            <p>
              Every morning before sunrise, our master bakers begin their craft. Using techniques 
              passed down through generations and only the finest organic ingredients, we create 
              breads and pastries that honor the timeless tradition of artisan baking.
            </p>
            <p>
              From our signature sourdough starter, cultivated for over 30 years, to our 
              hand-laminated croissants, each product is a labor of love and dedication to 
              the art of baking.
            </p>
            <div className="featured-highlights">
              <div className="highlight-item">
                <div className="highlight-icon">
                  <Award size={24} />
                </div>
                <div className="highlight-text">
                  <h4>Award Winning</h4>
                  <p>Multiple national baking awards</p>
                </div>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">
                  <Heart size={24} />
                </div>
                <div className="highlight-text">
                  <h4>Made Fresh Daily</h4>
                  <p>Baked fresh every morning</p>
                </div>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">
                  <Users size={24} />
                </div>
                <div className="highlight-text">
                  <h4>Family Owned</h4>
                  <p>Three generations of bakers</p>
                </div>
              </div>
              <div className="highlight-item">
                <div className="highlight-icon">
                  <Sparkles size={24} />
                </div>
                <div className="highlight-text">
                  <h4>100% Natural</h4>
                  <p>No preservatives or additives</p>
                </div>
              </div>
            </div>
            <button className="cta-button">
              Learn Our Story
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="products" id="products">
        <div className="section-header">
          <div className="section-label">Our Specialties</div>
          <h2 className="section-title">Daily Fresh Delights</h2>
        </div>
        
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
        
        <div className="products-grid">
          {filteredProducts.map((product, index) => (
            <div 
              className="product-card" 
              key={index}
              style={{ 
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both` 
              }}
            >
              <div className="product-image">
                <img src={product.image} alt={product.name} />
                <div className="product-overlay"></div>
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-desc">{product.desc}</p>
                <div className="product-price">{product.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials">
        <div className="section-header">
          <div className="section-label">What People Say</div>
          <h2 className="section-title">Loved by Our Community</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div 
              className="testimonial-card" 
              key={index}
              style={{ 
                animation: `fadeInUp 0.6s ease-out ${index * 0.15}s both` 
              }}
            >
              <div className="testimonial-stars">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="testimonial-text">{testimonial.text}</p>
              <div className="testimonial-author">
                <div className="author-name">{testimonial.name}</div>
                <div className="author-role">{testimonial.role}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery">
        <div className="section-header">
          <div className="section-label" style={{ color: 'var(--gold)' }}>Instagram Gallery</div>
          <h2 className="section-title" style={{ color: 'var(--cream)' }}>Behind the Scenes</h2>
        </div>
        <div className="gallery-grid">
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=300&fit=crop" alt="Fresh bread" />
            <div className="gallery-overlay">
              <div className="gallery-title">Morning Fresh Batch</div>
            </div>
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1509365390695-33aeb5e8b6d4?w=400&h=300&fit=crop" alt="Croissants" />
            <div className="gallery-overlay">
              <div className="gallery-title">Perfect Layers</div>
            </div>
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=400&h=300&fit=crop" alt="Baguettes" />
            <div className="gallery-overlay">
              <div className="gallery-title">Artisan Baguettes</div>
            </div>
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400&h=300&fit=crop" alt="Pastries" />
            <div className="gallery-overlay">
              <div className="gallery-title">Sweet Creations</div>
            </div>
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1509365465985-25d11c17e812?w=400&h=300&fit=crop" alt="Cinnamon rolls" />
            <div className="gallery-overlay">
              <div className="gallery-title">Cinnamon Heaven</div>
            </div>
          </div>
          <div className="gallery-item">
            <img src="https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&h=300&fit=crop" alt="Baker" />
            <div className="gallery-overlay">
              <div className="gallery-title">Master at Work</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="about-content">
          <div className="about-text">
            <h2>Crafted with Passion, Served with Pride</h2>
            <p>
              For over three decades, we've been perfecting the art of traditional baking. 
              Every morning, our master bakers arrive before dawn to create the finest 
              breads and pastries using time-honored techniques and the highest quality ingredients.
            </p>
            <p>
              From our signature sourdough to delicate French pastries, each creation 
              is a testament to our commitment to excellence and our love for the craft.
            </p>
          </div>
          <div className="about-stats">
            <div className="stat">
              <div className="stat-number">36+</div>
              <div className="stat-label">Years of Excellence</div>
            </div>
            <div className="stat">
              <div className="stat-number">50+</div>
              <div className="stat-label">Daily Varieties</div>
            </div>
            <div className="stat">
              <div className="stat-number">100%</div>
              <div className="stat-label">Natural Ingredients</div>
            </div>
            <div className="stat">
              <div className="stat-number">5K+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact" id="contact">
        <div className="contact-content">
          <div className="section-header">
            <div className="section-label">Visit Us</div>
            <h2 className="section-title">Find Your Way to Heaven</h2>
          </div>
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <MapPin size={28} />
              </div>
              <div className="contact-label">Location</div>
              <div className="contact-value">123 Artisan Street<br />Paris, France</div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <Clock size={28} />
              </div>
              <div className="contact-label">Hours</div>
              <div className="contact-value">Mon-Sat: 6am - 8pm<br />Sun: 7am - 6pm</div>
            </div>
            <div className="contact-item">
              <div className="contact-icon">
                <Phone size={28} />
              </div>
              <div className="contact-label">Phone</div>
              <div className="contact-value">+33 1 23 45 67 89</div>
            </div>
          </div>
          <div className="social-links">
            <a href="#" className="social-link">
              <Instagram size={24} />
            </a>
            <a href="#" className="social-link">
              <Facebook size={24} />
            </a>
          </div>
        </div>
      </section>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default BakeryWebsite;