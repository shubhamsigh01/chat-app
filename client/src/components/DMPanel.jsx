/*
 * DMPanel.jsx
 * Component for direct messaging between two users.
 * Layers E2E encryption on top of the existing Socket.io relay.
 */

import { useEffect, useRef, useState } from 'react'
import { useCrypto } from '../context/CryptoContext'
import { encryptMessage, decryptMessage } from '../utils/crypto'

export default function DMPanel({ socket, recipientId, recipientName, username, messages, setMessages }) {
  const { openSecureSession } = useCrypto()
  const sharedKeyRef = useRef(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(null)
  const [input, setInput] = useState('')
  const dmBottomRef = useRef(null)

  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, recipientId]);

  useEffect(() => {
    setSessionReady(false)
    setSessionError(null)
    sharedKeyRef.current = null

    openSecureSession(recipientId)
      .then(key => {
        sharedKeyRef.current = key
        setSessionReady(true)
      })
      .catch(() => setSessionError('Could not establish secure session. Try again.'))
  }, [recipientId])

  // Message listener removed because it's now handled centrally in App.jsx
  // to support background notifications and shared state.

  async function sendMessage() {
    const text = input.trim()
    if (!text || !sharedKeyRef.current) return

    try {
      const { iv, ciphertext } = await encryptMessage(sharedKeyRef.current, text)

      // Emit encrypted payload
      socket.emit('private_message', {
        to: recipientId,
        iv,
        ciphertext,
        timestamp: new Date()
      })

      setMessages(prev => ({
        ...prev,
        [recipientId]: [...(prev[recipientId] || []), { from: username, text, time: new Date().toISOString() }]
      }))
      setInput('')
    } catch (err) {
      console.error('Encryption error:', err);
    }
  }

  return (
    <div style={{ marginTop: 20, background: 'var(--glass)', border: '1px solid var(--glass-border)', borderRadius: '16px', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-main)' }}>Chat with {recipientName}</h5>
        {sessionReady && (
          <span style={{
            fontSize: 10,
            padding: '2px 8px',
            background: 'rgba(34, 197, 94, 0.1)',
            color: '#4ade80',
            borderRadius: 99,
            border: '1px solid rgba(34, 197, 94, 0.2)'
          }}>
            Secure
          </span>
        )}
      </div>
      
      <div className="chat-body" style={{ height: 200, padding: 10, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
        {(messages[recipientId] || []).map((msg, i) => (
          <div key={i} style={{ 
            marginBottom: 8, 
            alignSelf: msg.from === username ? 'flex-end' : 'flex-start',
            maxWidth: '90%'
          }}>
            <p style={{ 
              margin: 0, 
              fontSize: '0.8rem', 
              padding: '6px 10px', 
              borderRadius: '10px',
              background: msg.from === username ? 'var(--primary)' : 'var(--glass)',
              color: 'white',
              borderBottomRightRadius: msg.from === username ? 2 : 10,
              borderBottomLeftRadius: msg.from === username ? 10 : 2
            }}>
              {msg.text}
            </p>
          </div>
        ))}
        <div ref={dmBottomRef} />
      </div>
      
      <div style={{ display: 'flex', gap: 5 }}>
        <input 
          className="chat-footer-input"
          value={input} 
          onChange={e => setInput(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && sendMessage()} 
          placeholder={sessionReady ? 'Secure msg...' : 'Encrypting...'} 
          style={{ 
            flex: 1, 
            padding: '8px 12px', 
            fontSize: '0.8rem',
            background: 'var(--glass)',
            border: '1px solid var(--glass-border)',
            borderRadius: 8,
            color: 'white',
            outline: 'none'
          }} 
          disabled={!sessionReady}
        />
        <button 
          onClick={sendMessage} 
          disabled={!sessionReady} 
          style={{ 
            padding: '8px 15px', 
            fontSize: '0.8rem',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            opacity: sessionReady ? 1 : 0.5
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}
