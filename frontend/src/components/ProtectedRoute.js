// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React, { useEffect, useState } from 'react';

export default function ProtectedRoute({ children }) {
  const { user, initializing } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/validate-token', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsValid(true);
        } else {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setIsValid(false);
        }
      } catch (err) {
        console.error('Token validation error:', err);
        localStorage.removeItem('token');
        setIsValid(false);
      }
      
      setIsValidating(false);
    };

    validateToken();
  }, [token]);

  if (initializing || isValidating) {
    return <div>Loading...</div>;
  }

  if (!user || !token || !isValid) {
    return <Navigate to="/login" />;
  }

  return children;
}