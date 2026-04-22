import { useState, useEffect, useRef } from 'react';
import Login from './Login';
import SmartReply from './components/SmartReply';
import SummaryModal from './components/SummaryModal';
import DMPanel from './components/DMPanel';
import { useCrypto } from './context/CryptoContext';
import socket from './socket';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('chat_token'));
  const [username, setUsername] = useState(localStorage.getItem('chat_username') || '');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [input, setInput] = useState('');
  
  const [privateChats, setPrivateChats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const { sharedKeys, openSecureSession } = useCrypto();
  const emojis = ['👍', '❤️', '😂', '😮'];

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // 🟢 Connect to socket with JWT token
    socket.auth = { token };
    socket.connect();

    socket.on('connect', () => console.log('✅ Connected:', socket.id));
    socket.on('connect_error', (err) => {
      console.log('❌ Auth Error:', err.message);
      handleLogout();
    });

    socket.on('message_history', (history) => setMessages(history));
    socket.on('receive_message', (msg) => setMessages(prev => [...prev, msg]));
    socket.on('online_users', (users) => setOnlineUsers(users));

    socket.on('user_joined', ({ username }) =>
      setMessages(prev => [...prev, { system: true, text: `${username} joined` }])
    );

    socket.on('user_left', ({ username }) =>
      setMessages(prev => [...prev, { system: true, text: `${username} left` }])
    );

    socket.on('user_typing', ({ username }) => {
      setTypingUsers(prev => prev.includes(username) ? prev : [...prev, username]);
    });

    socket.on('user_stop_typing', ({ username }) => {
      setTypingUsers(prev => prev.filter(user => user !== username));
    });

    socket.on('receive_private_message', async ({ from, text, time, fromId, iv, ciphertext }) => {
      let plaintext = text;
      if (iv && ciphertext) {
        try {
          // If we don't have the key yet, we might need to request it
          // but for background messages, we'll just try to use what's cached.
          if (sharedKeys.current[fromId]) {
            const { decryptMessage } = await import('./utils/crypto');
            plaintext = await decryptMessage(sharedKeys.current[fromId], { iv, ciphertext });
          } else {
            plaintext = "[Encrypted message]";
          }
        } catch (err) {
          plaintext = "[Could not decrypt]";
        }
      }

      setPrivateChats(prev => ({
        ...prev,
        [fromId]: [...(prev[fromId] || []), { from, text: plaintext, time }]
      }));
      if (!selectedUser || selectedUser.id !== fromId) {
        setNotifications(prev => ({ ...prev, [fromId]: (prev[fromId] || 0) + 1 }));
      }
    });

    socket.on('message_reaction_update', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg.messageId === messageId ? { ...msg, reactions } : msg
      ));
    });

    return () => socket.disconnect();
  }, [token]); // Removed selectedUser to prevent disconnect on DM open

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleAuthSuccess = (token, user) => {
    setToken(token);
    setUsername(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_username');
    setToken(null);
    setJoined(false);
    if (socket) socket.disconnect();
  };

  const joinRoom = () => {
    if (!room.trim()) return alert('Enter a room name!');
    socket.emit('join_room', { room });
    setJoined(true);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    socket.emit('typing', { room });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { room });
    }, 2000);
  };

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('send_message', { room, text: input });
      socket.emit('stop_typing', { room });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setInput('');
    }
  };

  const openPrivateChat = (user) => {
    if (user.id === socket.id) return;
    setSelectedUser(user);
    setNotifications(prev => ({ ...prev, [user.id]: 0 }));
  };

  const reactToMessage = (messageId, emoji) => {
    socket.emit('react_message', { room, messageId, emoji });
    setHoveredMessage(null);
  };

  if (!token) return <Login onAuthSuccess={handleAuthSuccess} />;

  if (!joined) return (
    <div className="App">
      <div className="joinChatContainer">
        <h3>Welcome, {username}!</h3>
        <input 
          placeholder="Room name (e.g. general)" 
          value={room} 
          onChange={e => setRoom(e.target.value)} 
          onKeyDown={e => e.key === 'Enter' && joinRoom()} 
        />
        <button onClick={joinRoom}>Join Room</button>
        <button onClick={handleLogout} style={{ marginTop: '10px', background: 'transparent', border: '1px solid var(--glass-border)', fontSize: '0.9rem' }}>Logout</button>
      </div>
    </div>
  );

  const last10Messages = messages.filter(m => !m.system).slice(-10).map(m => `${m.username}: ${m.text}`);
  const last50Messages = messages.filter(m => !m.system).slice(-50).map(m => ({ sender: m.username, text: m.text }));

  return (
    <div className="App" style={{ height: '100vh', padding: '20px' }}>
      {showSummary && <SummaryModal messages={last50Messages} onClose={() => setShowSummary(false)} />}
      
      <div className="chat-window" style={{ width: '100%', maxWidth: '1000px', height: '80vh', display: 'flex', flexDirection: 'row' }}>
        {/* Main Chat Area */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--glass-border)' }}>
          <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>Room: {room}</p>
            <div>
              <button className="chat-header-btn" onClick={() => setShowSummary(true)} style={{ marginRight: 10, padding: '5px 10px', borderRadius: '8px', background: 'var(--glass)', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>Summarize</button>
              <button className="chat-header-btn" onClick={() => setJoined(false)} style={{ padding: '5px 10px', borderRadius: '8px', background: 'var(--glass)', color: 'white', border: '1px solid var(--glass-border)', cursor: 'pointer' }}>Change Room</button>
            </div>
          </div>

          <div className="chat-body" style={{ flex: 1, padding: '20px' }}>
            {messages.map((msg, i) =>
              msg.system
                ? <p key={i} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', margin: '10px 0', fontStyle: 'italic' }}>{msg.text}</p>
                : (
                  <div 
                    key={msg.messageId || i} 
                    className="message" 
                    id={msg.username === username ? 'you' : 'other'}
                    onMouseEnter={() => setHoveredMessage(msg.messageId)} 
                    onMouseLeave={() => setHoveredMessage(null)}
                  >
                    <div className="message-content">
                      <p style={{ margin: 0 }}>
                        {msg.isBot && <span style={{ color: '#818cf8', marginRight: '4px' }}>✦</span>}
                        <strong style={{ fontSize: '0.75rem', display: 'block', marginBottom: '2px', opacity: 0.8 }}>{msg.username}</strong>
                        {msg.text}
                      </p>
                    </div>
                    
                    <div className="message-meta">
                      <span>{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {hoveredMessage === msg.messageId && (
                      <div style={{ position: 'absolute', top: -30, [msg.username === username ? 'right' : 'left']: 0, background: 'var(--bg-card)', border: '1px solid var(--glass-border)', borderRadius: 20, padding: '4px 10px', display: 'flex', gap: 8, zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                        {emojis.map(emoji => (
                          <span key={emoji} onClick={() => reactToMessage(msg.messageId, emoji)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseOver={e => e.target.style.transform = 'scale(1.2)'} onMouseOut={e => e.target.style.transform = 'scale(1)'}>{emoji}</span>
                        ))}
                      </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                      {Object.entries(msg.reactions || {}).map(([emoji, users]) => (
                        <span key={emoji} onClick={() => reactToMessage(msg.messageId, emoji)} style={{ fontSize: '0.7rem', background: users.includes(username) ? 'rgba(99, 102, 241, 0.2)' : 'var(--glass)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: 10, cursor: 'pointer', color: 'var(--text-main)' }}>
                          {emoji} {users.length}
                        </span>
                      ))}
                    </div>
                  </div>
                )
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: '0 20px', height: 20 }}>
            {typingUsers.length > 0 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{typingUsers.join(', ')} typing...</p>}
          </div>

          <div className="chat-footer" style={{ flexDirection: 'column', gap: '10px' }}>
            <SmartReply recentMessages={last10Messages} onSelect={(s) => setInput(s)} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <input 
                value={input} 
                onChange={handleInputChange} 
                onKeyDown={e => e.key === 'Enter' && sendMessage()} 
                placeholder="Group message..." 
              />
              <button onClick={sendMessage}>Send</button>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>Tip: type @bot followed by your question to ask AI</p>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ flex: 0.8, background: 'rgba(255, 255, 255, 0.02)', padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <h4 style={{ marginBottom: '1.5rem', color: 'var(--text-main)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>Online Users</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {onlineUsers.map(user => (
              <li 
                key={user.id} 
                onClick={() => openPrivateChat(user)} 
                style={{ 
                  cursor: 'pointer', 
                  padding: '10px', 
                  borderRadius: '12px', 
                  background: selectedUser?.id === user.id ? 'var(--glass)' : 'transparent',
                  color: user.id === socket.id ? 'var(--primary)' : 'var(--text-main)', 
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--glass)'}
                onMouseOut={e => e.currentTarget.style.background = selectedUser?.id === user.id ? 'var(--glass)' : 'transparent'}
              >
                <span>
                  {user.username} {user.id === socket.id && <small style={{ opacity: 0.6 }}>(You)</small>}
                </span>
                {notifications[user.id] > 0 && <span style={{ background: '#ef4444', color: 'white', borderRadius: '10px', padding: '2px 8px', fontSize: 10, fontWeight: 'bold' }}>{notifications[user.id]}</span>}
              </li>
            ))}
          </ul>

          {selectedUser && (
            <DMPanel 
              socket={socket} 
              recipientId={selectedUser.id} 
              recipientName={selectedUser.username} 
              username={username} 
              messages={privateChats} 
              setMessages={setPrivateChats} 
            />
          )}
        </div>
      </div>
    </div>
  );
}