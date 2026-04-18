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
      const res = await fetch(`http://localhost:3001/auth${endpoint}`, {
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
    <div style={{ padding: 40, maxWidth: 400, margin: 'auto' }}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10 }} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginBottom: 10 }} required />
        <button type="submit" style={{ width: '100%', padding: 10, background: '#007bff', color: 'white', border: 'none' }}>{isLogin ? 'Login' : 'Register'}</button>
      </form>
      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: 'blue', marginTop: 10 }}>
        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
      </p>
    </div>
  );
}
