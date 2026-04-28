import { Send, Sparkles, FileText, Smile, Paperclip } from 'lucide-react';
import { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onAISummary: () => void;
}

export function ChatInput({ onSendMessage, onAISummary }: ChatInputProps) {
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
    <div className="border-t border-white/10 p-4">
      {/* AI Action Bar */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <button
          onClick={onAISummary}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-teal-500/20 to-blue-500/20 backdrop-blur-sm border border-teal-400/30 rounded-full text-xs text-teal-300 hover:bg-teal-500/30 transition-all"
        >
          <FileText className="w-3 h-3" />
          <span>Summarize Thread</span>
        </button>
        <div className="flex items-center gap-1 text-xs text-orange-400">
          <Sparkles className="w-3 h-3" />
          <span>AI Actions</span>
        </div>
      </div>

      {/* Input Area */}
      <div className="relative flex items-center gap-3 bg-white/5 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/20 focus-within:border-orange-400/50 transition-all">
        {/* Emoji Button */}
        <button className="text-orange-400 hover:text-orange-300 transition-colors flex-shrink-0">
          <Smile className="w-5 h-5" />
        </button>

        {/* Input Field */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message... (mention @bot for AI)"
          className="flex-1 bg-transparent outline-none text-white placeholder:text-orange-300/50"
        />

        {/* Attachment Button */}
        <button className="text-orange-400 hover:text-orange-300 transition-colors flex-shrink-0">
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-600 to-teal-600 flex items-center justify-center shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
