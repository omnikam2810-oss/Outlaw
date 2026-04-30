import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // we will implement this axios instance soon
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('ds_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        setUser(null);
        localStorage.removeItem('ds_token');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('ds_token', data.token);
    localStorage.setItem('ds_refresh_token', data.refreshToken);
    setUser(data.user);
    return data;
  };

  const registerUser = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    localStorage.setItem('ds_token', data.token);
    localStorage.setItem('ds_refresh_token', data.refreshToken);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('ds_token');
    localStorage.removeItem('ds_refresh_token');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register: registerUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
