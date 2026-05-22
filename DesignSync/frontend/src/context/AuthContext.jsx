import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // we will implement this axios instance soon
import { AuthContext } from './AuthContextValue';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('ds_user');
    if (!cached) return null;
    try {
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem('ds_user');
      return null;
    }
  });
  const [loading, setLoading] = useState(() => !localStorage.getItem('ds_user') && Boolean(localStorage.getItem('ds_token')));

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
        localStorage.setItem('ds_user', JSON.stringify(data.user));
      } catch {
        setUser(null);
        localStorage.removeItem('ds_token');
        localStorage.removeItem('ds_refresh_token');
        localStorage.removeItem('ds_user');
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
    localStorage.setItem('ds_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const registerUser = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    if (data.token) {
      localStorage.setItem('ds_token', data.token);
      localStorage.setItem('ds_refresh_token', data.refreshToken);
      localStorage.setItem('ds_user', JSON.stringify(data.user));
      setUser(data.user);
    }
    return data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('ds_token');
    localStorage.removeItem('ds_refresh_token');
    localStorage.removeItem('ds_user');
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ds_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register: registerUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
