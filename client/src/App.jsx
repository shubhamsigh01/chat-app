import { useState, useEffect, useRef } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { OrbitSidebar } from './components/OrbitSidebar';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { SmartReply } from './components/SmartReply';
import { DMPanel } from './components/DMPanel';
import { SummaryModal } from './components/SummaryModal';
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
  
  const [privateChats, setPrivateChats] = useState({});
  const [dmRecipient, setDmRecipient] = useState(null);
  const [notifications, setNotifications] = useState({});
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  
  const { sharedKeys, openSecureSession } = useCrypto();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    socket.auth = { token };
    socket.connect();

    socket.on('connect', () => {
      console.log('✅ Connected:', socket.id);
      if (room && joined) {
        socket.emit('join_room', { room });
      }
    });

    socket.on('connect_error', (err) => {
      console.log('❌ Auth Error:', err.message);
      handleLogout();
    });

    socket.on('message_history', (history) => {
      const formattedHistory = history.map(msg => ({
        id: msg.messageId || Math.random().toString(),
        text: msg.text,
        sender: msg.system ? 'System' : msg.username,
        timestamp: new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: msg.isBot,
        reactions: msg.reactions,
        messageId: msg.messageId
      }));
      setMessages(formattedHistory);
    });

    socket.on('receive_message', (msg) => {
      const formattedMsg = {
        id: msg.messageId || Math.random().toString(),
        text: msg.text,
        sender: msg.system ? 'System' : msg.username,
        timestamp: new Date(msg.time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isBot: msg.isBot,
        reactions: msg.reactions,
        messageId: msg.messageId
      };
      setMessages(prev => [...prev, formattedMsg]);
    });

    socket.on('online_users', (users) => setOnlineUsers(users));

    socket.on('user_joined', ({ username }) => {
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', text: `${username} joined`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    });

    socket.on('user_left', ({ username }) => {
      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'System', text: `${username} left`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    });

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
      
      setDmRecipient(currentRecipient => {
        if (!currentRecipient || currentRecipient.id !== fromId) {
          setNotifications(prev => ({ ...prev, [fromId]: (prev[fromId] || 0) + 1 }));
        }
        return currentRecipient;
      });
    });

    socket.on('message_reaction_update', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg.messageId === messageId ? { ...msg, reactions } : msg
      ));
    });

    return () => socket.disconnect();
  }, [token]);

  const handleLogin = (user, roomId, jwtToken) => {
    // Note: The new AuthScreen might just return (username, room)
    // The previous App.jsx expected Login.jsx to handle fetch and return token
    // We will need to adapt AuthScreen to actually perform the fetch, OR perform it here
  };

  const handleLogout = () => {
    localStorage.removeItem('chat_token');
    localStorage.removeItem('chat_username');
    setToken(null);
    setJoined(false);
    if (socket) socket.disconnect();
  };

  const handleSendMessage = (text) => {
    if (text.trim()) {
      socket.emit('send_message', { room, text });
      socket.emit('stop_typing', { room });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleAISummary = () => {
    setShowSummaryModal(true);
  };

  // We map onlineUsers to the User interface expected by OrbitSidebar
  // interface User { id: string, username: string, status: string }
  const mappedUsers = onlineUsers.map(u => ({
    id: u.id,
    username: u.username,
    status: 'online'
  }));

  if (!token || !joined) {
    // We will render AuthScreen, but we need to ensure it handles actual auth.
    // For now, let's keep the old Login component logic or wrap it in AuthScreen.
    // Let's modify AuthScreen directly or use it here if it's already modified.
    // I will refactor AuthScreen to do the actual fetch later.
    return <AuthScreen onLogin={(user, roomId, jwt) => {
      setToken(jwt);
      setUsername(user);
      setRoom(roomId);
      setJoined(true);
      socket.emit('join_room', { room: roomId });
    }} />;
  }

  return (
    <div className="h-screen w-full flex relative overflow-hidden">
      {/* Cosmic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-teal-950" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

      {/* Main Content */}
      <div className="relative z-10 flex w-full h-full">
        <OrbitSidebar
          roomName={room}
          currentUser={username}
          users={mappedUsers}
          onOpenDM={(user) => {
            if (user.id === socket.id) return;
            setDmRecipient(user);
            setNotifications(prev => ({ ...prev, [user.id]: 0 }));
          }}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col">
          <ChatWindow messages={messages} currentUser={username} />
          
          <ChatInput
            onSendMessage={handleSendMessage}
            onAISummary={handleAISummary}
            onChange={(val) => {
              socket.emit('typing', { room });
              if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
              typingTimeoutRef.current = setTimeout(() => {
                socket.emit('stop_typing', { room });
              }, 2000);
            }}
          />
        </div>
      </div>

      {/* DM Panel */}
      {dmRecipient && (
        <DMPanel
          socket={socket}
          recipientId={dmRecipient.id}
          recipientName={dmRecipient.username}
          currentUser={username}
          messages={privateChats}
          setMessages={setPrivateChats}
          onClose={() => setDmRecipient(null)}
        />
      )}

      {/* Summary Modal */}
      <SummaryModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        messages={messages.slice(-50).map(m => ({ sender: m.sender, text: m.text }))}
      />
    </div>
  );
}