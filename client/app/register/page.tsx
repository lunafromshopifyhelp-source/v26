'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connecting to your Backend Brain on Port 5000
      const response = await axios.post('http://https://v26.onrender.com/api/auth/register', formData);

      if (response.status === 201 || response.status === 200) {
        alert("Registration Successful! Your journey of purpose begins.");
        // Redirecting to login so they can sign in for the first time
        router.push('/login'); 
      }
    } catch (error: any) {
      console.error("Registration Error:", error.response?.data);
      alert(error.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#FFF', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif' }}>
      <form onSubmit={handleSubmit} style={{ background: '#1E1E1E', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: '#6366f1', marginBottom: '10px', textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }}>v26</h2>
        <h3 style={{ color: '#FFF', marginBottom: '20px', textAlign: 'center' }}>Join the Mission</h3>
        <p style={{ textAlign: 'center', color: '#A1A1AA', marginBottom: '30px' }}>Begin your journey of purpose.</p>
        
        <input 
          type="text" placeholder="Full Name" required 
          style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#2A2A2A', color: '#FFF', outline: 'none' }}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <input 
          type="email" placeholder="Email Address" required 
          style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#2A2A2A', color: '#FFF', outline: 'none' }}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />
        <input 
          type="password" placeholder="Password" required 
          style={{ width: '100%', padding: '12px', marginBottom: '25px', borderRadius: '8px', border: '1px solid #333', background: '#2A2A2A', color: '#FFF', outline: 'none' }}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            width: '100%', 
            padding: '15px', 
            backgroundColor: loading ? '#4f46e5' : '#6366f1', 
            color: '#FFF', 
            border: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: '0.3s'
          }}
        >
          {loading ? "Registering..." : "Create My Creator Account"}
        </button>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.9rem', color: '#A1A1AA' }}>
          Already part of the mission? <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={() => router.push('/login')}>Login</span>
        </p>
      </form>
    </div>
  );
}