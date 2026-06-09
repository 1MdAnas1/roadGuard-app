import React, { useState } from "react";
import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate ,Link} from "react-router-dom";
import Scanner from "./Scanner";

import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import QRGenerator from './QRGenerator';


// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if logged in)
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={
              
                <Home />
              
            } />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/scanner" element={<Scanner />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/generate" element={
              <ProtectedRoute>
                <QRGenerator />
              </ProtectedRoute>
            } />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

function Home() {
const { user } = useAuth();
  // State for active tab - default based on login status
  const [activeTab, setActiveTab] = useState(user ? 'generator' : 'login');

  // If user is logged in, show app features
  if (user) {
    return (
      <div className="App">
        <header className="app-header">
          <img src="/mylogo.png" alt="Road Guard Logo" className="app-logo" />
          <div className="header-title-wrapper">
            <h1>Road Guard</h1>
            <p>Manage your emergency QR codes and scan medical information</p>
          </div>
        </header>

        <div className="container">
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'generator' ? 'active' : ''}`}
              onClick={() => setActiveTab('generator')}
            >
              🏠 QR Generator
            </button>
            <button 
              className={`tab-button ${activeTab === 'scanner' ? 'active' : ''}`}
              onClick={() => setActiveTab('scanner')}
            >
              📷 QR Scanner
            </button>
            <button 
              className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📋 My Dashboard
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'generator' && <QRGenerator />}
            {activeTab === 'scanner' && <Scanner />}
            {activeTab === 'dashboard' && <Dashboard />}
          </div>
        </div>
      </div>
    );
  }

  // If user is not logged in, show authentication options
  return (
    <div className="App">
      <header className="app-header">
       <img src="/mylogo.png" alt="Road Guard Logo" className="app-logo" />
        <div className="header-title-wrapper">
          <h1>Road Guard</h1>
          <p>Protect yourself with smart medical emergency QR codes</p>
        </div>
      </header>

      <div className="container">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => setActiveTab('login')}
          >
            🔐 Login
          </button>
          <button 
            className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            📝 Register
          </button>
          <button 
            className={`tab-button ${activeTab === 'scanner' ? 'active' : ''}`}
            onClick={() => setActiveTab('scanner')}
          >
            📷 QR Scanner
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'login' && <Login />}
          {activeTab === 'register' && <Register />}
          {activeTab === 'scanner' && <Scanner />}
        </div>
      </div>
    </div>
  );
}

export default App;
