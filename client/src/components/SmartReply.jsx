import React, { useState, useEffect } from 'react';

/**
 * SmartReply Component
 * Fetches and displays AI-generated reply suggestions based on recent chat messages.
 */
export default function SmartReply({ recentMessages, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only fetch if we have enough context (e.g., at least 1 message)
    if (!recentMessages || recentMessages.length === 0) {
      setSuggestions([]);
      return;
    }

    let isMounted = true;

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/ai/smart-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: recentMessages })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        
        if (isMounted) {
          setSuggestions(data.suggestions || []);
        }
      } catch (error) {
        console.error('Error fetching smart replies:', error);
        if (isMounted) {
          setSuggestions([]); // Fail silently
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce the fetch slightly so we don't spam the API on rapid messages
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [recentMessages]);

  if (!loading && suggestions.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
      {loading ? (
        // Skeleton pills
        [1, 2, 3].map(i => (
          <div 
            key={i} 
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: '#e5e7eb',
              color: 'transparent',
              fontSize: '0.85rem',
              animation: 'pulse 1.5s infinite ease-in-out',
              minWidth: '60px'
            }}
          >
            ...
          </div>
        ))
      ) : (
        // Actual suggestion pills
        suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: '#374151',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#f3f4f6'}
          >
            {suggestion}
          </button>
        ))
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>
    </div>
  );
}
