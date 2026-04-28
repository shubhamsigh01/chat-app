import { Shield, Lock, User, KeyRound, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface AuthScreenProps {
  onLogin: (username: string, roomId: string, token: string) => void;
}

export function AuthScreen({ onLogin }: AuthScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !roomId || !password) return;
    setError('');
    const endpoint = isLogin ? '/login' : '/register';
    
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${BACKEND_URL}/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned a non-JSON response.");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Auth failed");
      
      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_username', data.username);
      onLogin(data.username, roomId, data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center">
      {/* Cosmic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-teal-950" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-orange-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000" />

      {/* Auth Card */}
      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-teal-500 mb-4 shadow-lg shadow-orange-500/50">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Orbit Chat</h1>
            <p className="text-orange-200 text-sm">Secure messaging with AI intelligence</p>
          </div>

          {/* JWT Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 rounded-full backdrop-blur-sm">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-300 font-semibold">JWT Secured Authentication</span>
          </div>

          {error && <p className="text-red-400 text-sm text-center mb-4">{error}</p>}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="text-sm text-orange-200 font-medium mb-2 block">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm text-orange-200 font-medium mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {/* Room ID */}
            <div>
              <label className="text-sm text-orange-200 font-medium mb-2 block">Room ID</label>
              <div className="relative">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter room ID (e.g., lobby)"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-teal-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-300 text-sm hover:text-orange-200 transition-colors"
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>

          {/* E2EE Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-teal-300">
            <Lock className="w-3 h-3" />
            <span>End-to-End Encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
