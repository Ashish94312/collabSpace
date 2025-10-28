import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthSuccess() {
  const navigate = useNavigate();
  const { googleSignIn} = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    console.log('params', params);
    const token = params.get("token");
    if (token) {
      googleSignIn(token);
      navigate("/dashboard");
    }
  }, []);

  
  return (
    <>Signing in....</>
  );
}
