// src/utils/tokenUtils.js

// Check if token is expired or will expire soon
export const isTokenExpired = (token, bufferMinutes = 5) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const bufferTime = bufferMinutes * 60 * 1000; // Convert buffer to milliseconds
    
    return currentTime >= (expirationTime - bufferTime);
  } catch (err) {
    console.error('Error parsing token:', err);
    return true;
  }
};

// Get token expiration time
export const getTokenExpiration = (token) => {
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch (err) {
    console.error('Error parsing token:', err);
    return null;
  }
};

// Get time until token expires (in milliseconds)
export const getTimeUntilExpiration = (token) => {
  if (!token) return 0;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expirationTime = payload.exp * 1000;
    const currentTime = Date.now();
    
    return Math.max(0, expirationTime - currentTime);
  } catch (err) {
    console.error('Error parsing token:', err);
    return 0;
  }
};
