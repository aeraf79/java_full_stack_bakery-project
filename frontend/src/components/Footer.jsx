import React from 'react';
import { Instagram, Facebook, Twitter, Mail, MapPin, Phone } from 'lucide-react';
import './footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3 className="footer-logo">Maison Dorée</h3>
          <p className="footer-desc">
            Crafting artisan breads and pastries with love since 1987. 
            Every bite tells a story of tradition and excellence.
          </p>
          <div className="social-links">
            <a href="#" className="social-link" aria-label="Instagram">
              <Instagram size={20} />
            </a>
            <a href="#" className="social-link" aria-label="Facebook">
              <Facebook size={20} />
            </a>
            <a href="#" className="social-link" aria-label="Twitter">
              <Twitter size={20} />
            </a>
            <a href="#" className="social-link" aria-label="Email">
              <Mail size={20} />
            </a>
          </div>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Quick Links</h4>
          <ul className="footer-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#products">Our Products</a></li>
            <li><a href="#about">About Us</a></li>
            <li><a href="#contact">Contact</a></li>
            <li><a href="#careers">Careers</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Our Products</h4>
          <ul className="footer-links">
            <li><a href="#breads">Artisan Breads</a></li>
            <li><a href="#pastries">French Pastries</a></li>
            <li><a href="#desserts">Desserts</a></li>
            <li><a href="#special">Special Orders</a></li>
            <li><a href="#catering">Catering Services</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-title">Contact Info</h4>
          <ul className="footer-contact">
            <li>
              <MapPin size={18} />
              <span>123 Artisan Street<br />Paris, France 75001</span>
            </li>
            <li>
              <Phone size={18} />
              <span>+33 1 23 45 67 89</span>
            </li>
            <li>
              <Mail size={18} />
              <span>hello@maisondoree.com</span>
            </li>
          </ul>
          <div className="footer-hours">
            <p><strong>Opening Hours:</strong></p>
            <p>Mon-Sat: 6:00 AM - 8:00 PM</p>
            <p>Sunday: 7:00 AM - 6:00 PM</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; 2024 Maison Dorée. All rights reserved. Baked with love.</p>
          <div className="footer-legal">
            <a href="#privacy">Privacy Policy</a>
            <span>•</span>
            <a href="#terms">Terms of Service</a>
            <span>•</span>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;