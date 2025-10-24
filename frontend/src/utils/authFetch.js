// src/utils/authFetch.js
export async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
  
    const res = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  
    if (res.status === 401) {
      // Token expired or invalid - try to refresh silently
      try {
        const refreshResponse = await fetch('http://localhost:3000/api/refresh-token', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (refreshResponse.ok) {
          const { token: newToken } = await refreshResponse.json();
          localStorage.setItem('token', newToken);
          
          // Retry the original request with new token
          const retryRes = await fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (retryRes.status === 401) {
            // Still unauthorized after refresh, redirect to login silently
            localStorage.removeItem('token');
            window.location.href = '/login';
            throw new Error('Unauthorized');
          }
          
          return retryRes;
        } else {
          // Refresh failed, redirect to login silently
          localStorage.removeItem('token');
          window.location.href = '/login';
          throw new Error('Unauthorized');
        }
      } catch (refreshErr) {
        // Refresh failed, redirect to login silently
        localStorage.removeItem('token');
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
    }
  
    return res;
  }
  