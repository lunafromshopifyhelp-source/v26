'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios'; // Import axios

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [parentTalent, setParentTalent] = useState('');
  const [specificTalent, setSpecificTalent] = useState('');
  const [vision, setVision] = useState('');
  const [loading, setLoading] = useState(false); // Added a loading state
  const router = useRouter();

  const domains = [
    { id: 'arts', label: 'Creative Arts', icon: '🎨', hint: 'Music, Painting, Fashion, Acting...' },
    { id: 'tech', label: 'Tech & Digital', icon: '💻', hint: 'Coding, Cybersecurity, AI, Design...' },
    { id: 'science', label: 'Science & Logic', icon: '🔬', hint: 'Chemistry, Research, Medicine...' },
    { id: 'business', label: 'Trade & Strategy', icon: '📈', hint: 'Baking, Real Estate, Sales...' },
    { id: 'service', label: 'Humanity', icon: '🌍', hint: 'Teaching, Nursing, Sports, Ministry...' },
    { id: 'other', label: 'Unique / Other', icon: '✨', hint: 'Anything else under the sun.' }
  ];

  const handleFinish = async () => {
    if (!vision.trim()) return;
    setLoading(true);

    try {
      // 1. Grab the email saved during login
      const userEmail = localStorage.getItem('v26UserEmail');

      if (!userEmail) {
        alert("Session expired. Please login again.");
        router.push('/login');
        return;
      }

      // 2. Send the data to your Backend
      await axios.put('https://v26.onrender.com/api/auth/update-profile', {
        email: userEmail,
        talent: specificTalent,
        vision: vision
      });

      alert(`Mission Initialized: ${specificTalent}!`);
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Onboarding Error:", error.response?.data);
      alert("Failed to save profile. Please check if your backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#09090b', color: '#fff', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '550px', width: '100%', textAlign: 'center' }}>
        
        {/* STEP 1: SELECT DOMAIN */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '10px' }}>Select your <span style={{ color: '#6366f1' }}>Domain.</span></h1>
            <p style={{ color: '#a1a1aa', marginBottom: '40px' }}>Where does your gift naturally live?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              {domains.map((d) => (
                <div 
                  key={d.id}
                  onClick={() => { setParentTalent(d.label); setStep(2); }}
                  style={{ padding: '20px', background: '#18181b', borderRadius: '20px', border: '1px solid #27272a', cursor: 'pointer', transition: '0.3s', textAlign: 'left' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#27272a'}
                >
                  <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{d.icon}</div>
                  <div style={{ fontWeight: 'bold' }}>{d.label}</div>
                  <div style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '5px' }}>{d.hint}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: SPECIFIC TALENT */}
        {step === 2 && (
          <div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Name your <span style={{ color: '#6366f1' }}>Craft.</span></h1>
            <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>You chose {parentTalent}. What specifically do you do?</p>
            <input 
              type="text" 
              placeholder="e.g. Gospel Singer, Fashion Designer, Chemist..."
              style={{ width: '100%', padding: '20px', borderRadius: '15px', background: '#18181b', color: '#fff', border: '1px solid #333', fontSize: '1.2rem', outline: 'none' }}
              onChange={(e) => setSpecificTalent(e.target.value)}
            />
            <button 
              onClick={() => setStep(3)}
              disabled={!specificTalent.trim()}
              style={{ 
                marginTop: '20px', width: '100%', padding: '15px', 
                backgroundColor: specificTalent.trim() ? '#6366f1' : '#27272a', 
                color: specificTalent.trim() ? '#fff' : '#71717a', 
                borderRadius: '12px', fontWeight: 'bold', cursor: specificTalent.trim() ? 'pointer' : 'not-allowed' 
              }}
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 3: VISION STATEMENT */}
        {step === 3 && (
          <div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '10px' }}>Define your <span style={{ color: '#EAB308' }}>Purpose.</span></h1>
            <p style={{ color: '#a1a1aa', marginBottom: '30px' }}>What is the goal of your {specificTalent}?</p>
            <textarea 
              placeholder="To impact the world through..."
              style={{ width: '100%', height: '120px', padding: '20px', borderRadius: '15px', background: '#18181b', color: '#fff', border: '1px solid #333', fontSize: '1.1rem', outline: 'none' }}
              onChange={(e) => setVision(e.target.value)}
            />
            <button 
              onClick={handleFinish}
              disabled={!vision.trim() || loading}
              style={{ 
                marginTop: '20px', width: '100%', padding: '15px', 
                backgroundColor: vision.trim() ? '#6366f1' : '#27272a', 
                color: vision.trim() ? '#fff' : '#71717a', 
                borderRadius: '12px', fontWeight: 'bold', cursor: vision.trim() ? 'pointer' : 'not-allowed' 
              }}
            >
              {loading ? "Initializing..." : "Initialize My Mission"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}