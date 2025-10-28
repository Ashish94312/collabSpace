import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css'; // Add styles here

export default function Login() {
  const { login, error, loading, setError, googleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Clear error on mount
  React.useEffect(() => { setError(null); }, [setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      setError(null);
      navigate('/dashboard');
    } catch (err) {
      // Error is handled in context
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-title">CollabSpace</h1>
        <h2 className="login-title">Sign in to your account</h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          <button type="submit" disabled={loading} className="login-button">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p>or</p>
        <button
          onClick={() => {
            window.location.href = "http://localhost:3000/api/googleauth";
          }}
          className='google-sign-in-btn'
        >
          {/* <FcGoogle size={22} /> */}
          <span>Sign in with Google</span>
        </button>
        <p className="login-footer">
          Don’t have an account?{' '}
          <Link to="/signup" className="signup-link">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
