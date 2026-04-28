import { MessageSquare, Circle, Lock } from 'lucide-react';

interface User {
  id: string;
  username: string;
  status: 'online' | 'offline' | 'away';
}

interface OrbitSidebarProps {
  roomName: string;
  currentUser: string;
  users: User[];
  onOpenDM: (username: string) => void;
}

export function OrbitSidebar({ roomName, currentUser, users, onOpenDM }: OrbitSidebarProps) {
  return (
    <div className="w-80 bg-gradient-to-b from-slate-950/40 to-blue-950/40 backdrop-blur-2xl border-r border-white/10 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-teal-500 flex items-center justify-center shadow-lg shadow-orange-500/50">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Orbit Chat</h1>
            <div className="flex items-center gap-1 text-xs text-teal-300">
              <Lock className="w-3 h-3" />
              <span>E2EE Protected</span>
            </div>
          </div>
        </div>

        {/* Room Name */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
          <p className="text-xs text-orange-300 mb-1">Current Room</p>
          <p className="text-white font-semibold">#{roomName}</p>
        </div>
      </div>

      {/* Active Users */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <h3 className="text-xs font-semibold text-orange-300 uppercase tracking-wider mb-3">
            Active Users ({users.filter((u) => u.status === 'online').length})
          </h3>
        </div>

        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => user.username !== currentUser && onOpenDM(user.username)}
              className={`w-full p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all group ${
                user.username === currentUser ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-teal-500 flex items-center justify-center text-white font-semibold shadow-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  {/* Status Indicator */}
                  {user.status === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-slate-950 shadow-lg animate-pulse" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">
                      {user.username}
                      {user.username === currentUser && (
                        <span className="ml-2 text-xs text-orange-300">(You)</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-orange-300">
                    {user.status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>

                {/* DM Indicator */}
                {user.username !== currentUser && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="px-2 py-1 bg-orange-500/20 rounded-lg border border-orange-400/30">
                      <span className="text-xs text-orange-300">DM</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-gradient-to-r from-orange-500/20 to-teal-500/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
          <p className="text-xs text-orange-200 text-center">
            🛡️ Your messages are end-to-end encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
