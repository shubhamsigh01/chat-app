import { Smile, Paperclip, Send } from 'lucide-react';
import { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
}

export function MessageInput({ onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <div className="relative flex items-center gap-3 bg-gray-50 rounded-full px-5 py-3 border-2 border-transparent focus-within:border-purple-300 focus-within:bg-white transition-all">
        {/* Emoji Button */}
        <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          <Smile className="w-6 h-6" />
        </button>

        {/* Input Field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 bg-transparent outline-none placeholder:text-gray-400"
        />

        {/* Attachment Button */}
        <button className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
          <Paperclip className="w-6 h-6" />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105 active:scale-95"
        >
          <Send className="w-5 h-5 text-white" />
        </button>
      </div>
    </div>
  );
}
