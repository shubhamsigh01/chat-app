import { useEffect, useRef } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'contact' | 'bot';
  time: string;
}

interface ChatMessagesProps {
  messages: Message[];
  contactAvatar: string;
  isBot: boolean;
}

export function ChatMessages({ messages, contactAvatar, isBot }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
      {messages.map((message) => {
        const isUser = message.sender === 'user';
        const isBotMessage = message.sender === 'bot';

        return (
          <div
            key={message.id}
            className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar for received messages */}
            {!isUser && (
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                  isBotMessage || isBot
                    ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                    : 'bg-gradient-to-br from-orange-400 to-pink-500'
                }`}
              >
                {contactAvatar}
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`max-w-md px-5 py-3 rounded-3xl relative ${
                isUser
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white shadow-lg shadow-purple-200'
                  : isBotMessage || isBot
                  ? 'bg-white border-2 border-transparent shadow-md relative before:absolute before:inset-0 before:rounded-3xl before:p-[2px] before:bg-gradient-to-r before:from-blue-400 before:to-purple-500 before:-z-10 before:animate-pulse'
                  : 'bg-white shadow-md shadow-pink-100'
              }`}
            >
              <p className={isUser ? 'text-white' : 'text-gray-900'}>{message.text}</p>
              <span
                className={`text-xs mt-1 block ${
                  isUser ? 'text-purple-100' : 'text-gray-500'
                }`}
              >
                {message.time}
              </span>

              {/* Special AI indicator */}
              {(isBotMessage || isBot) && !isUser && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs">✨</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
