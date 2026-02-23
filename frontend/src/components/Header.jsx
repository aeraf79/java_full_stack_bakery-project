import React from 'react';
import './header.css';

const Header = ({ scrolled }) => {
  return (
    <nav className={`header-nav ${scrolled ? 'header-nav-scrolled' : ''}`}>
      <div className="header-logo">Maison Dorée</div>
      <ul className="header-nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="#products">Products</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <div className="header-mobile-menu-btn">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </nav>
  );
};

export default Header;