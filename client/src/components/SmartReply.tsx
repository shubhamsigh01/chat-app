import { Sparkles } from 'lucide-react';

interface SmartReplyProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

export function SmartReply({ suggestions, onSelect }: SmartReplyProps) {
  if (suggestions.length === 0) return null;

  return (
    <div className="px-6 pb-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-teal-400" />
        <span className="text-xs text-teal-300 font-medium">AI Suggested Replies</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-teal-400/30 rounded-full text-sm text-orange-200 hover:bg-teal-500/20 hover:border-teal-400/50 transition-all hover:scale-105 active:scale-95"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
