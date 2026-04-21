import React, { useState, useEffect } from 'react';

/**
 * SummaryModal Component
 * Fetches and displays an AI-generated summary of the room's recent messages.
 */
export default function SummaryModal({ messages, onClose }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle Escape key to close modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const fetchSummary = async () => {
      try {
        const response = await fetch('/api/ai/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages })
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        setSummary(data.summary || 'Could not generate summary.');
      } catch (error) {
        console.error('Error fetching summary:', error);
        setSummary('An error occurred while generating the summary.');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [messages, onClose]);

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        style={{
          backgroundColor: '#fff',
          color: '#333',
          padding: '24px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          position: 'relative'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            cursor: 'pointer',
            color: '#666'
          }}
          aria-label="Close"
        >
          &times;
        </button>
        
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '1.5rem' }}>Room Summary</h2>
        
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
            <div style={{
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        ) : (
          <div style={{ lineHeight: '1.6', fontSize: '1rem' }}>
            {summary}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
