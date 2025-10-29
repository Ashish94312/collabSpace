import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DocumentSearchBar from '../components/DocSearchBar'; 
import { switchPage } from '../components/Editor';
import { isTokenExpired, getTimeUntilExpiration } from '../utils/tokenUtils';
import ThemeToggle from '../components/ThemeToggle';

export default function Dashboard() {
  const { user, logout, refreshToken } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearchResultClick = (docId, pageIndex) => {
    navigate(`/editor/${docId}`);
    setTimeout(() => {
      switchPage(pageIndex); // ← from your useEditor hook
    }, 300); // wait for editor to mount
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch regular documents
        const docsRes = await fetch('http://localhost:3000/api/documents', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(Array.isArray(docsData) ? docsData : []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setDocuments([]);
      }
    };
    
    fetchData();

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
  
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Set up seamless token refresh (like Google login)
  useEffect(() => {
    const setupTokenRefresh = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const timeUntilExpiration = getTimeUntilExpiration(token);
      
      // Refresh token 2 minutes before expiration (more seamless)
      const refreshTime = Math.max(0, timeUntilExpiration - (2 * 60 * 1000));
      const timeoutId = setTimeout(async () => {
        const success = await refreshToken();
        if (!success) {
          // Only redirect if refresh completely fails
          navigate('/login');
        } else {
          // Set up next refresh
          setupTokenRefresh();
        }
      }, refreshTime);

      return timeoutId;
    };

    const timeoutId = setupTokenRefresh();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [refreshToken, navigate]);

  // Silent token refresh on user activity (like Google)
  useEffect(() => {
    const handleUserActivity = () => {
      const token = localStorage.getItem('token');
      // Only refresh if token is very close to expiring (within 5 minutes)
      if (token && isTokenExpired(token, 5)) {
        refreshToken().catch(() => {
          // Silent fail - only redirect if absolutely necessary
        });
      }
    };

    // Set up activity listeners (less aggressive)
    const events = ['click', 'keypress', 'scroll'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [refreshToken]);



  const createDocument = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ title: 'Untitled Document' }),
      });

      const doc = await res.json();
      if (res.ok) {
        navigate(`/editor/${doc.id}`);
      } else {
        alert(doc.error || 'Failed to create document');
      }
    } catch (err) {
      console.error('Failed to create doc:', err);
    }
  };

  // Filter documents by search query (case-insensitive)
  const filteredDocuments = Array.isArray(documents) 
    ? documents.filter(doc =>
        doc.title && doc.title.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>📄 CollabSpace</h1>
        <div className="user-info">
          <ThemeToggle />
          <span>{user?.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <aside className="dashboard-sidebar">
        <div className="search-container">
          <DocumentSearchBar query={query} setQuery={setQuery} />
        </div>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-actions">
          <button className="create-button" onClick={createDocument}>+ New Document</button>
        </div>

        {filteredDocuments.length > 0 ? (
          <ul className="doc-list">
            {filteredDocuments.map(doc => (
              <li key={doc.id} onClick={() => navigate(`/editor/${doc.id}`)}>
                <div className="doc-card">
                  <div className="doc-icon" aria-hidden="true">📄</div>
                  <div className="doc-info">
                    <h3>{doc.title}</h3>
                    <span className="item-type">Document</span>
                  </div>
                  <button
                    className="delete-button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const confirmDelete = window.confirm(`Are you sure you want to delete "${doc.title}"?`);
                      if (!confirmDelete) return;

                      try {
                        const res = await fetch(`http://localhost:3000/api/documents/${doc.id}`, {
                          method: 'DELETE',
                          headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                          },
                        });

                        if (!res.ok) {
                          const data = await res.json();
                          alert(data.error || 'Failed to delete document');
                          return;
                        }

                        setDocuments(prevItems => prevItems.filter(i => i.id !== doc.id));
                      } catch (err) {
                        console.error('Delete error:', err);
                        alert('Network error while deleting document');
                      }
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-docs">
            <div className="no-docs-illustration" aria-hidden="true">🗒️</div>
            <p>No documents found.</p>
            <button className="create-button" onClick={createDocument} style={{marginTop: '16px'}}>Create your first document</button>
          </div>
        )}
      </main>
    </div>
  );
}
