'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface UserProfile {
  email?: string;
  displayName?: string; 
  partnerEmail?: string;
  visionRank?: number;
}

export default function StandaloneProfilePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    axios.get(`https://v26.onrender.com/api/auth/profile/${email}`)
      .then(res => {
        setUserProfile(res.data);
        if (res.data.displayName) setNewName(res.data.displayName);
      }).catch(err => console.error(err));
  }, []);

  const handleUpdateIdentity = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!newName.trim() || !email) return;
    setUpdatingProfile(true);
    try {
      await axios.put(`https://v26.onrender.com/api/auth/update-profile`, { email, displayName: newName });
      alert("System profile identifiers updated successfully!");
    } catch (err) {
      alert("Identity modification failed.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#fafafa', padding: '40px 20px', paddingBottom: '95px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>Profile Configuration</h2>
        
        <div style={{ background: '#0e0e11', border: '1px solid #18181b', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
            {(userProfile?.displayName || userProfile?.email || 'V')[0].toUpperCase()}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '0 0 2px 0' }}>{userProfile?.displayName || 'Creator Terminal'}</h3>
            <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>{userProfile?.email}</p>
          </div>
        </div>

        <div style={{ padding: '20px', background: '#0e0e11', border: '1px solid #18181b', borderRadius: '24px' }}>
          <span className="section-mini-tag" style={{ color: '#818cf8' }}>Modify Visual Identity</span>
          <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 16px 0', lineHeight: '1.4' }}>Update your visible identifier broadcast token displayed across global streams.</p>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter display alias..." className="premium-text-input" />
          <button onClick={handleUpdateIdentity} disabled={updatingProfile} className="premium-action-btn" style={{ width: '100%' }}>
            {updatingProfile ? 'Saving Configuration...' : 'Update Identity'}
          </button>
        </div>

        <button onClick={handleLogout} className="logout-trigger-btn">Disconnect Session (Logout)</button>
      </div>

      <BottomNav />

      <style jsx global>{`
        .section-mini-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
        .premium-text-input { width: 100%; background: #141416; border: 1px solid #18181b; border-radius: 12px; padding: 14px 16px; font-size: 0.85rem; color: #fff; outline: none; box-sizing: border-box; margin-bottom: 12px; }
        .premium-action-btn { background: #fff; color: #000; font-weight: 700; font-size: 0.85rem; padding: 12px 24px; border: none; border-radius: 12px; cursor: pointer; }
        .logout-trigger-btn { width: 100%; padding: 14px; background: transparent; border: 1px solid #18181b; color: #f87171; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
      `}</style>
    </div>
  );
}