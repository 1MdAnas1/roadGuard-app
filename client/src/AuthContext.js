import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verify token and get user info
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      // You might want to create a /api/verify endpoint
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      logout();
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(user));
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('http://localhost:5000/api/register', userData);

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('userData', JSON.stringify(user));
        setToken(token);
        setUser(user);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        return { success: true };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};