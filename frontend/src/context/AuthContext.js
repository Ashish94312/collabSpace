// src/context/AuthContext.js
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Check for existing token on initial load
  useEffect(() => {
    const validateAndSetUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // First, try to validate the token with the backend
          const response = await fetch('http://localhost:3000/api/validate-token', {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            const { user } = await response.json();
            setUser(user);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (err) {
          console.error('Token validation error:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setInitializing(false);
    };

    validateAndSetUser();
  }, []);

  // Clear error on navigation
  useEffect(() => {
    const clear = () => setError(null);
    window.addEventListener('popstate', clear);
    return () => window.removeEventListener('popstate', clear);
  }, []);

  const signup = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signup failed');
      }
      setError(null); // Clear error on success
      return true; // Indicate success
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const { token } = await response.json();
      localStorage.setItem('token', token);
      // Decode JWT to get id and email
      const decoded = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: decoded.id, email: decoded.email });
      setError(null); // Clear error on success
      return true; // Indicate success
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const googleSignIn =  (token) => {
    localStorage.setItem("token", token);
    // Decode JWT to get id and email
    const decoded = JSON.parse(atob(token.split('.')[1]));
    // console.log(token);
    // console.log('decoded token', decoded);
    setUser({ id: decoded.id, email: decoded.email });
    // console.log('set user as ',{ id: decoded.id, email: decoded.email });
    setError(null); // Clear error on success
    setLoading(false);
    return true; // Indicate success
  }

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshToken = async () => {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const response = await fetch('http://localhost:3000/api/refresh-token', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const { token: newToken } = await response.json();
        localStorage.setItem('token', newToken);
        return true;
      } else {
        // Token refresh failed, user needs to login again
        localStorage.removeItem('token');
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error('Token refresh error:', err);
      localStorage.removeItem('token');
      setUser(null);
      return false;
    }
  };

  const value = {
    user,
    error,
    loading,
    initializing,
    signup,
    login,
    googleSignIn,
    logout,
    refreshToken,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {!initializing && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}