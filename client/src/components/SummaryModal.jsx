import React, { useState, useEffect } from 'react';

/**
 * SummaryModal Component
 * Fetches and displays an AI-generated summary of the room's recent messages.
 */
export default function SummaryModal({ messages, onClose }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Handle Escape key to close modal
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      setSummary("");

      try {
        const res = await fetch("/api/ai/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Summarization failed");
        }

        setSummary(data.summary);
      } catch (err) {
        console.error("Summarize error:", err.message);
        setError(err.message);
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
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          padding: '32px',
          borderRadius: '24px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          border: '1px solid var(--glass-border)',
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
        
        <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.75rem', fontWeight: 700, background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Room Summary</h2>
        
        {error && (
          <div style={{ color: "#f87171", marginTop: "8px", fontSize: "14px", marginBottom: "16px" }}>
            ⚠️ {error}
          </div>
        )}

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
        ) : error ? (
          <div style={{ 
            color: '#ef4444', 
            background: 'rgba(239, 68, 68, 0.1)', 
            padding: '16px', 
            borderRadius: '12px', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.95rem'
          }}>
            {error}
          </div>
        ) : (
          <div style={{ lineHeight: '1.6', fontSize: '1.05rem', color: 'var(--text-main)', opacity: 0.9 }}>
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
