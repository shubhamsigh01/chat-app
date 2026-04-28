import { Search, Circle } from 'lucide-react';
import { useState } from 'react';

interface Contact {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastMessage: string;
  time: string;
  unread?: number;
  isBot?: boolean;
}

const contacts: Contact[] = [
  {
    id: '1',
    name: 'AI Assistant',
    avatar: '🤖',
    status: 'online',
    lastMessage: 'How can I help you today?',
    time: '2m',
    isBot: true,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    avatar: '👩‍💼',
    status: 'online',
    lastMessage: 'See you at the meeting!',
    time: '5m',
    unread: 3,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    avatar: '👨‍💻',
    status: 'away',
    lastMessage: 'Thanks for the update',
    time: '1h',
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatar: '👩‍🎨',
    status: 'online',
    lastMessage: 'Love the new design!',
    time: '2h',
  },
  {
    id: '5',
    name: 'Alex Rodriguez',
    avatar: '👨‍🚀',
    status: 'offline',
    lastMessage: 'Catch up tomorrow?',
    time: '1d',
  },
  {
    id: '6',
    name: 'Lisa Park',
    avatar: '👩‍🔬',
    status: 'online',
    lastMessage: 'Project looks great!',
    time: '2d',
  },
];

interface SidebarProps {
  activeContactId: string;
  onContactSelect: (id: string) => void;
}

export function Sidebar({ activeContactId, onContactSelect }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-lg">
            <span className="text-2xl">💬</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              ChatFlow
            </h1>
            <p className="text-xs text-gray-500">Stay Connected</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-full border-2 border-transparent focus:border-purple-300 focus:bg-white transition-all outline-none"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredContacts.map((contact) => {
          const isActive = contact.id === activeContactId;
          return (
            <button
              key={contact.id}
              onClick={() => onContactSelect(contact.id)}
              className={`w-full p-4 rounded-3xl mb-2 text-left transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-purple-100 via-pink-50 to-orange-50 backdrop-blur-lg shadow-md scale-[1.02]'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md ${
                      contact.isBot
                        ? 'bg-gradient-to-br from-blue-400 to-purple-500'
                        : 'bg-gradient-to-br from-orange-400 to-pink-500'
                    }`}
                  >
                    {contact.avatar}
                  </div>
                  {/* Status Indicator */}
                  <div
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                      contact.status === 'online'
                        ? 'bg-green-400'
                        : contact.status === 'away'
                        ? 'bg-yellow-400'
                        : 'bg-gray-300'
                    }`}
                  />
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {contact.name}
                    </h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {contact.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {contact.lastMessage}
                    </p>
                    {contact.unread && (
                      <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-full flex-shrink-0">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { contacts };
export type { Contact };
