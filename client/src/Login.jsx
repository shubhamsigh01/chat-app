import { useState } from 'react';

export default function Login({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isLogin ? '/login' : '/register';
    
    try {
      const res = await fetch(`/auth${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      localStorage.setItem('chat_token', data.token);
      localStorage.setItem('chat_username', data.username);
      onAuthSuccess(data.token, data.username);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="App">
      <div className="joinChatContainer" style={{ maxWidth: 450 }}>
        <h3>{isLogin ? 'Orbit Login' : 'Orbit Register'}</h3>
        {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input 
            placeholder="Username" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
        </form>
        <p 
          onClick={() => setIsLogin(!isLogin)} 
          style={{ cursor: 'pointer', color: 'var(--text-muted)', marginTop: 15, fontSize: '0.9rem' }}
          onMouseOver={e => e.target.style.color = 'var(--primary)'}
          onMouseOut={e => e.target.style.color = 'var(--text-muted)'}
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}
