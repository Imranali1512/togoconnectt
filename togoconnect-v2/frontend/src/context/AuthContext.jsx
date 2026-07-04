import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Set axios header BEFORE any state — runs synchronously
  const getInitialUser = () => {
    try {
      const stored = localStorage.getItem('togoUser');
      if (stored) {
        const u = JSON.parse(stored);
        if (u && u.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${u.token}`;
          return u;
        }
      }
    } catch {}
    return null;
  };

  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = user;
    if (u && u.token) {
      // Verify token silently + refresh from server
      axios.get('/api/auth/me')
        .then(r => {
          const updated = { ...u, ...r.data, isNew: false };
          setUser(updated);
          localStorage.setItem('togoUser', JSON.stringify(updated));
        })
        .catch(() => {
          setUser(null);
          localStorage.removeItem('togoUser');
          delete axios.defaults.headers.common['Authorization'];
        });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('togoUser', JSON.stringify(userData));
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('togoUser');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
