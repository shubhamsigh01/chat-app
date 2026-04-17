import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001'); // ← Move socket OUTSIDE component

export default function App() {
  const [username, setUsername] = useState('');
  const [room, setRoom] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    socket.on('connect', () => console.log('✅ Connected:', socket.id));
    socket.on('connect_error', (err) => console.log('❌ Error:', err.message));

    socket.on('message_history', (history) => {
      console.log('📜 History received:', history);
      setMessages(history);
    });

    socket.on('receive_message', (msg) => {
      console.log('💬 Message received:', msg);
      setMessages(prev => [...prev, msg]);
    });

    socket.on('online_users', (users) => {
      console.log('👥 Online users:', users);
      setOnlineUsers(users);
    });

    socket.on('user_joined', ({ username }) =>
      setMessages(prev => [...prev, { system: true, text: `${username} joined` }])
    );

    socket.on('user_left', ({ username }) =>
      setMessages(prev => [...prev, { system: true, text: `${username} left` }])
    );

    return () => socket.removeAllListeners();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const joinRoom = () => {
    if (!username.trim() || !room.trim()) {
      alert('Enter both username and room name!');
      return;
    }
    console.log('🚪 Joining room:', room, 'as', username);
    socket.emit('join_room', { room, username });
    setJoined(true);
  };

  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('send_message', { room, username, text: input });
      setInput('');
    }
  };

  if (!joined) return (
    <div style={{ padding: 40 }}>
      <h2>Join a Chat Room</h2>
      <input
        placeholder="Your username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        style={{ display: 'block', marginBottom: 10, padding: 8, width: 200 }}
      />
      <input
        placeholder="Room name (e.g. general)"
        value={room}
        onChange={e => setRoom(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && joinRoom()}
        style={{ display: 'block', marginBottom: 10, padding: 8, width: 200 }}
      />
      <button onClick={joinRoom} style={{ padding: '8px 20px' }}>Join Room</button>
    </div>
  );

  return (
    <div style={{ padding: 20 }}>
      <h3>Room: {room} | Online: {onlineUsers.join(', ')}</h3>
      <div style={{ height: 400, overflowY: 'auto', border: '1px solid #ccc', padding: 10, marginBottom: 10 }}>
        {messages.map((msg, i) =>
          msg.system
            ? <p key={i} style={{ color: 'gray', fontStyle: 'italic' }}>{msg.text}</p>
            : <p key={i}><strong>{msg.username}</strong>: {msg.text}</p>
        )}
        <div ref={bottomRef} />
      </div>
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && sendMessage()}
        placeholder="Type a message..."
        style={{ padding: 8, width: 300, marginRight: 8 }}
      />
      <button onClick={sendMessage} style={{ padding: '8px 16px' }}>Send</button>
    </div>
  );
}