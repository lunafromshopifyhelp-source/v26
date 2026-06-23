'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 🧼 Clear old session data on mount so you can register a clean new account
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('v26UserEmail');
      localStorage.removeItem('v26Token');
    }
  }, []);

  // Step A: Request the Verification Code to Gmail
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name || !formData.password) {
      alert("Please fill in all fields first.");
      return;
    }
    setLoading(true);

    try {
      const response = await axios.post('https://v26.onrender.com/api/auth/send-verification', { 
        email: formData.email 
      });
      if (response.status === 200) {
        setIsCodeSent(true);
        alert("Verification code sent to your Gmail!");
      }
    } catch (error: any) {
      console.error("Verification Error:", error.response?.data);
      alert(error.response?.data?.message || "Failed to send code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step B: Submit the Code and Complete Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('https://v26.onrender.com/api/auth/register', {
        ...formData,
        code: verificationCode,
        rememberMe
      });

      if (response.status === 201 || response.status === 200) {
        alert("Registration Successful! Your journey of purpose begins.");
        router.push('/login'); 
      }
    } catch (error: any) {
      console.error("Registration Error:", error.response?.data);
      alert(error.response?.data?.message || "Invalid verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRedirect = () => {
    // Points to your backend Google OAuth integration endpoint
    window.location.href = 'https://v26.onrender.com/api/auth/google';
  };

  const handlePhonePrompt = () => {
    const phone = prompt("Enter your phone number for verification:");
    if (!phone) return;
    alert(`Sending verification SMS to ${phone}... (Feature expanding soon)`);
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#FFF', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ background: '#1E1E1E', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
        
        <h2 style={{ color: '#6366f1', marginBottom: '10px', textAlign: 'center', fontSize: '2rem', fontWeight: 'bold' }}>v26</h2>
        <h3 style={{ color: '#FFF', marginBottom: '20px', textAlign: 'center' }}>Join the Mission</h3>
        <p style={{ textAlign: 'center', color: '#A1A1AA', marginBottom: '30px' }}>Begin your journey of purpose.</p>
        
        {!isCodeSent ? (
          /* FORM 1: ENTER DETAILS */
          <form onSubmit={handleSendCode}>
            <input 
              type="text" placeholder="Full Name" required 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#2A2A2A', color: '#FFF', outline: 'none', boxSizing: 'border-box' }}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <input 
              type="email" placeholder="Email Address" required 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#2A2A2A', color: '#FFF', outline: 'none', boxSizing: 'border-box' }}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            <input 
              type="password" placeholder="Password" required 
              style={{ width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #333', background: '#2A2A2A', color: '#FFF', outline: 'none', boxSizing: 'border-box' }}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />

            {/* Remember Password Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', gap: '8px' }}>
              <input 
                type="checkbox" id="remember" checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ color: '#A1A1AA', fontSize: '0.9rem', cursor: 'pointer' }}>Remember password</label>
            </div>
            
            <button 
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '15px', backgroundColor: '#6366f1', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
            >
              {loading ? "Sending Code..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          /* FORM 2: VERIFY GMAIL CODE */
          <form onSubmit={handleVerifyAndRegister}>
            <p style={{ textAlign: 'center', color: '#818cf8', fontSize: '0.95rem', marginBottom: '20px' }}>
              We sent a 6-digit code to <strong>{formData.email}</strong>
            </p>
            <input 
              type="text" placeholder="Enter 6-Digit Code" required maxLength={6}
              style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #6366f1', background: '#2A2A2A', color: '#FFF', outline: 'none', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '4px', boxSizing: 'border-box' }}
              onChange={(e) => setVerificationCode(e.target.value)}
            />
            <button 
              type="submit" disabled={loading}
              style={{ width: '100%', padding: '15px', backgroundColor: '#22c55e', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '0.85rem', color: '#A1A1AA', cursor: 'pointer' }} onClick={() => setIsCodeSent(false)}>
              ← Edit details
            </p>
          </form>
        )}

        {/* Third-Party Authentication Integrations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px', borderTop: '1px solid #333', paddingTop: '20px' }}>
          <button 
            onClick={handleGoogleRedirect}
            style={{ width: '100%', padding: '12px', backgroundColor: '#FFF', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
          >
            Continue with Google
          </button>
          
          <button 
            onClick={handlePhonePrompt}
            style={{ width: '100%', padding: '12px', backgroundColor: '#2A2A2A', color: '#FFF', border: '1px solid #444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Continue with Phone Number
          </button>
        </div>

        <p style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.9rem', color: '#A1A1AA' }}>
          Already part of the mission? <span style={{ color: '#6366f1', cursor: 'pointer' }} onClick={() => router.push('/login')}>Login</span>
        </p>
      </div>
    </div>
  );
}