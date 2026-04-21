import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Login from './Login';
import SmartReply from './components/SmartReply';
import SummaryModal from './components/SummaryModal';
let socket; // Initialize socket outside so we can reconnect with token

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
  const [dmInput, setDmInput] = useState('');
  const [notifications, setNotifications] = useState({});
  const [hoveredMessage, setHoveredMessage] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const emojis = ['👍', '❤️', '😂', '😮'];

  const bottomRef = useRef(null);
  const dmBottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // 🟢 Connect to socket with JWT token
    socket = io('http://localhost:3001', {
      auth: { token }
    });

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

    socket.on('receive_private_message', ({ from, text, time, fromId }) => {
      setPrivateChats(prev => ({
        ...prev,
        [fromId]: [...(prev[fromId] || []), { from, text, time }]
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
  }, [token, selectedUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateChats, selectedUser]);

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

  const sendPrivateMessage = () => {
    if (dmInput.trim() && selectedUser) {
      socket.emit('private_message', { to: selectedUser.id, text: dmInput });
      setPrivateChats(prev => ({
        ...prev,
        [selectedUser.id]: [...(prev[selectedUser.id] || []), { from: username, text: dmInput, time: new Date().toISOString() }]
      }));
      setDmInput('');
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
    <div style={{ padding: 40 }}>
      <h2>Welcome, {username}!</h2>
      <button onClick={handleLogout} style={{ marginBottom: 20 }}>Logout</button>
      <input placeholder="Room name (e.g. general)" value={room} onChange={e => setRoom(e.target.value)} onKeyDown={e => e.key === 'Enter' && joinRoom()} style={{ display: 'block', marginBottom: 10, padding: 8 }} />
      <button onClick={joinRoom}>Join Room</button>
    </div>
  );

  const last10Messages = messages.filter(m => !m.system).slice(-10).map(m => `${m.username}: ${m.text}`);
  const last50Messages = messages.filter(m => !m.system).slice(-50).map(m => ({ sender: m.username, text: m.text }));

  return (
    <div style={{ display: 'flex', padding: 20, gap: 20 }}>
      {showSummary && <SummaryModal messages={last50Messages} onClose={() => setShowSummary(false)} />}
      <div style={{ flex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Room: {room}</h3>
          <div>
            <button onClick={() => setShowSummary(true)} style={{ marginRight: 10 }}>Summarize</button>
            <button onClick={() => setJoined(false)}>Change Room</button>
          </div>
        </div>
        <div style={{ height: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
          {messages.map((msg, i) =>
            msg.system
              ? <p key={i} style={{ color: 'gray', fontStyle: 'italic' }}>{msg.text}</p>
              : (
                <div key={msg.messageId || i} onMouseEnter={() => setHoveredMessage(msg.messageId)} onMouseLeave={() => setHoveredMessage(null)} style={{ position: 'relative', padding: '5px 8px', borderRadius: '4px', backgroundColor: msg.isBot ? '#eef2ff' : 'transparent', marginBottom: '4px' }}>
                  <p style={{ margin: 0 }}>
                    {msg.isBot && <span style={{ color: '#4f46e5', marginRight: '4px' }}>✦</span>}
                    <strong style={{ color: msg.isBot ? '#4f46e5' : 'inherit' }}>{msg.username}</strong>: {msg.text}
                  </p>
                  {hoveredMessage === msg.messageId && (
                    <div style={{ position: 'absolute', top: -20, left: 50, background: 'white', border: '1px solid #ccc', borderRadius: 20, padding: '2px 8px', display: 'flex', gap: 5, zIndex: 10 }}>
                      {emojis.map(emoji => (
                        <span key={emoji} onClick={() => reactToMessage(msg.messageId, emoji)} style={{ cursor: 'pointer' }}>{emoji}</span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                    {Object.entries(msg.reactions || {}).map(([emoji, users]) => (
                      <span key={emoji} onClick={() => reactToMessage(msg.messageId, emoji)} style={{ fontSize: '0.7rem', background: users.includes(username) ? '#e3f2fd' : '#f5f5f5', padding: '2px 6px', borderRadius: 10, cursor: 'pointer' }}>
                        {emoji} {users.length}
                      </span>
                    ))}
                  </div>
                </div>
              )
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ height: 20 }}>{typingUsers.length > 0 && <p style={{ fontSize: '0.8rem', fontStyle: 'italic' }}>{typingUsers.join(', ')} typing...</p>}</div>
        <SmartReply recentMessages={last10Messages} onSelect={(s) => setInput(s)} />
        <input value={input} onChange={handleInputChange} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Group message..." style={{ padding: 8, width: '70%' }} />
        <button onClick={sendMessage}>Send</button>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '4px 0 0 0' }}>Tip: type @bot followed by your question to ask AI</p>
      </div>

      <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: 20 }}>
        <h4>Online Users</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {onlineUsers.map(user => (
            <li key={user.id} onClick={() => openPrivateChat(user)} style={{ cursor: 'pointer', color: user.id === socket.id ? 'black' : 'blue', marginBottom: 5 }}>
              {user.username} {user.id === socket.id && '(You)'}
              {notifications[user.id] > 0 && <span style={{ background: 'red', color: 'white', borderRadius: '50%', padding: '2px 6px', marginLeft: 10, fontSize: 10 }}>{notifications[user.id]}</span>}
            </li>
          ))}
        </ul>

        {selectedUser && (
          <div style={{ marginTop: 20, border: '1px solid #999', padding: 10 }}>
            <h5>Chat with {selectedUser.username}</h5>
            <div style={{ height: 200, overflowY: 'auto', background: '#f9f9f9', padding: 5, marginBottom: 5 }}>
              {(privateChats[selectedUser.id] || []).map((msg, i) => (
                <p key={i} style={{ margin: '2px 0', fontSize: '0.9rem' }}>
                  <strong>{msg.from}:</strong> {msg.text}
                </p>
              ))}
              <div ref={dmBottomRef} />
            </div>
            <input value={dmInput} onChange={e => setDmInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendPrivateMessage()} placeholder="Direct message..." style={{ width: '100%', padding: 5, boxSizing: 'border-box' }} />
          </div>
        )}
      </div>
    </div>
  );
}