import { Phone, Video, MoreVertical } from 'lucide-react';
import type { Contact } from './Sidebar';

interface ChatHeaderProps {
  contact: Contact;
}

export function ChatHeader({ contact }: ChatHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-md ${
              contact.isBot
                ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                : 'bg-gradient-to-br from-orange-400 to-pink-500'
            }`}
          >
            {contact.avatar}
          </div>
          <div
            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
              contact.status === 'online'
                ? 'bg-green-400'
                : contact.status === 'away'
                ? 'bg-yellow-400'
                : 'bg-gray-300'
            }`}
          />
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="font-bold text-gray-900">{contact.name}</h2>
          <div className="flex items-center gap-2">
            {contact.status === 'online' ? (
              <span className="text-sm text-green-600 font-medium">
                {contact.isBot ? 'Always Active' : 'Active now'}
              </span>
            ) : contact.status === 'away' ? (
              <span className="text-sm text-yellow-600 font-medium">Away</span>
            ) : (
              <span className="text-sm text-gray-500">Offline</span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-3 rounded-2xl hover:bg-gray-100 transition-colors">
          <Phone className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-3 rounded-2xl hover:bg-gray-100 transition-colors">
          <Video className="w-5 h-5 text-gray-600" />
        </button>
        <button className="p-3 rounded-2xl hover:bg-gray-100 transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
