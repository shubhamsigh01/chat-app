import { useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  isBot?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  currentUser: string;
}

export function ChatWindow({ messages, currentUser }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender === currentUser;
        const isBot = message.isBot;

        return (
          <div
            key={message.id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-lg ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
              {/* Sender Name */}
              {!isOwnMessage && (
                <div className="flex items-center gap-2 mb-1 ml-3">
                  {isBot && (
                    <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                      <Bot className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-xs text-orange-300 font-medium">
                    {isBot ? 'Orbit AI' : message.sender}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`relative px-5 py-3 rounded-2xl ${
                  isBot
                    ? 'bg-gradient-to-r from-teal-900/40 to-blue-900/40 backdrop-blur-xl border-2 border-transparent bg-clip-padding before:absolute before:inset-0 before:rounded-2xl before:p-[2px] before:bg-gradient-to-r before:from-teal-400 before:via-blue-400 before:to-cyan-400 before:-z-10 before:animate-pulse'
                    : isOwnMessage
                    ? 'bg-gradient-to-r from-orange-600/60 to-teal-600/60 backdrop-blur-xl border border-orange-400/30 shadow-lg shadow-orange-500/20'
                    : 'bg-white/10 backdrop-blur-xl border border-white/20'
                }`}
              >
                <p className="text-white text-sm leading-relaxed">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    isBot
                      ? 'text-teal-300'
                      : isOwnMessage
                      ? 'text-orange-200'
                      : 'text-orange-300'
                  }`}
                >
                  {message.timestamp}
                </p>

                {/* AI Indicator */}
                {isBot && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}
