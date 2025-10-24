import { useState } from 'react';
import './InviteUser.css';

function InviteUser({ documentId }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    setMessage('');

    if (!email.trim()) {
      setMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(`http://localhost:3000/api/documents/${documentId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data?.error || 'Failed to invite user.');
      } else {
        setMessage(data?.message || 'Invitation sent!');
        setEmail('');
      }
    } catch (err) {
      console.error('Invite error:', err);
      setMessage('Unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-container">
      <input
        type="email"
        className="invite-input"
        value={email}
        placeholder="Collaborator's email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        onClick={handleInvite}
        className="invite-button"
        disabled={loading}
      >
        {loading ? 'Inviting...' : 'Invite'}
      </button>

      {message && <p className={`invite-message ${message.includes('success') ? 'success' : 'error'}`}>
        {message}
      </p>}
    </div>
  );
}

export default InviteUser;
