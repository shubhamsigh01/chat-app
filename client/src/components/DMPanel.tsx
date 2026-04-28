import { X, Lock, Shield } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface DMMessage {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
}

interface DMPanelProps {
  recipientUsername: string;
  currentUser: string;
  onClose: () => void;
}

export function DMPanel({ recipientUsername, currentUser, onClose }: DMPanelProps) {
  const [messages, setMessages] = useState<DMMessage[]>([
    {
      id: '1',
      text: 'Hey! This is a private message.',
      sender: recipientUsername,
      timestamp: '10:30 AM',
    },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      const message: DMMessage = {
        id: Date.now().toString(),
        text: newMessage,
        sender: currentUser,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };
      setMessages([...messages, message]);
      setNewMessage('');
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gradient-to-b from-slate-950/95 to-blue-950/95 backdrop-blur-2xl border-l border-white/20 shadow-2xl flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-semibold shadow-lg">
              {recipientUsername.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-white font-semibold">{recipientUsername}</h3>
              <p className="text-xs text-orange-300">Direct Message</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-orange-300" />
          </button>
        </div>

        {/* E2EE Badge */}
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl backdrop-blur-sm">
          <Shield className="w-4 h-4 text-emerald-400" />
          <Lock className="w-3 h-3 text-emerald-400" />
          <span className="text-xs text-emerald-300 font-semibold">
            End-to-End Encrypted
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isOwnMessage = message.sender === currentUser;
          return (
            <div
              key={message.id}
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isOwnMessage && (
                  <span className="text-xs text-orange-300 mb-1 ml-3">
                    {message.sender}
                  </span>
                )}
                <div
                  className={`px-4 py-2 rounded-xl ${
                    isOwnMessage
                      ? 'bg-gradient-to-r from-teal-600/60 to-blue-600/60 backdrop-blur-xl border border-teal-400/30'
                      : 'bg-white/10 backdrop-blur-xl border border-white/20'
                  }`}
                >
                  <p className="text-white text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-teal-200' : 'text-orange-300'
                    }`}
                  >
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a secure message..."
            className="flex-1 bg-transparent outline-none text-white placeholder:text-orange-300/50 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="w-8 h-8 rounded-lg bg-gradient-to-r from-teal-600 to-blue-600 flex items-center justify-center hover:shadow-lg transition-all disabled:opacity-50"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
