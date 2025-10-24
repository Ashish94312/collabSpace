// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

export default function DocumentSearchBar({ query, setQuery }) {
  return (
    <div className="doc-search-bar">
      <input
        type="text"
        placeholder="Search documents..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="search-input"
      />
    </div>
  );
}

