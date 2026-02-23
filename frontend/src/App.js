import React from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminPanel from './components/Adminpanel';
import UserPanel from "./components/Userpanel"; 
import Profile from "./pages/Profile";
import Cart from "./components/Cart"; // Add Cart import
import Favourites from "./pages/Favourites"; // Add Favourites import
import ProductDetails from './pages/Productdetails';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import MyOrders from './pages/MyOrders';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/adminpanel" element={<AdminPanel />} />
          <Route path="/userpanel" element={<UserPanel />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} /> {/* Add Cart route */}
          <Route path="/favourites" element={<Favourites />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/orders" element={<MyOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;