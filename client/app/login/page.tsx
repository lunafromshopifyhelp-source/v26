'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Added for clear UI feedback
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Reset error on new attempt

    try {
      // Connects to your Backend on Port 5000
      const response = await axios.post('http://https://v26.onrender.com/api/auth/login', formData);
      
      if (response.data.token) {
        // 1. Save the Token
        localStorage.setItem('v26Token', response.data.token);
        
        // 2. Save the Email (Ensures Workspace/Onboarding works)
        localStorage.setItem('v26UserEmail', response.data.user.email); 
        
        alert("Welcome back to v26, Creator!");
        router.push('/workspace'); // Redirecting to workspace where the Bridge is
      }
    } catch (err: any) {
      // FIX: This captures "Invalid email", "Wrong password", etc. from your backend
      const errorMessage = err.response?.data?.message || "Login failed. Check your connection.";
      setError(errorMessage);
      console.error("Login Error Detail:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#09090b', color: '#FFF', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: '"Inter", sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#18181b', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', border: '1px solid #27272a', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#6366f1', fontSize: '2.5rem', fontWeight: '900', letterSpacing: '-2px', margin: 0 }}>v26</h2>
          <p style={{ color: '#71717a', fontSize: '0.9rem', marginTop: '5px' }}>Enter the Bridge</p>
        </div>

        {/* ERROR DISPLAY AREA */}
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.85rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>Identity (Email)</label>
          <input 
            type="email" placeholder="name@domain.com" required 
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #27272a', background: '#09090b', color: '#FFF', outline: 'none', fontSize: '0.9rem' }}
            onChange={(e) => setFormData({...formData, email: e.target.value.trim()})} 
          />
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'block', marginBottom: '8px', marginLeft: '4px' }}>Access Key (Password)</label>
          <input 
            type="password" placeholder="••••••••" required 
            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #27272a', background: '#09090b', color: '#FFF', outline: 'none', fontSize: '0.9rem' }}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '16px', 
            backgroundColor: '#6366f1', 
            color: '#FFF', 
            border: 'none', 
            borderRadius: '12px', 
            fontWeight: '900', 
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)',
            transition: '0.2s'
          }}
        >
          {loading ? "Decrypting..." : "Login to Vision"}
        </button>

        <p style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.85rem', color: '#71717a' }}>
          New to the vision? <span style={{ color: '#6366f1', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => router.push('/register')}>Join v26</span>
        </p>
      </form>
    </div>
  );
}