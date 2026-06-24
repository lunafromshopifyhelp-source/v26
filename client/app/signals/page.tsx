'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';
interface UserProfile {
  email?: string;
  partnerEmail?: string;
  partnerStatus?: 'none' | 'pending' | 'active';
  incomingRequest?: string;
}

export default function SignalsPage() {
  const router = useRouter();
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
      setUserProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const linkPartner = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    if (!partnerEmail) return;
    try {
      setIsLinking(true);
      await axios.put('https://v26.onrender.com/api/auth/invite-partner', { myEmail, partnerEmail });
      alert("Invitation Transmitted!");
      setPartnerEmail('');
      fetchProfile();
    } catch (err) {
      alert("Partner account configuration not found.");
    } finally { setIsLinking(false); }
  };

  const acceptMission = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    try {
      await axios.put('https://v26.onrender.com/api/auth/accept-partner', { 
        myEmail, 
        partnerEmail: userProfile?.incomingRequest 
      });
      alert("Bridge Activated!");
      fetchProfile();
    } catch (err) { alert("Failed to accept mission."); }
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '30px 20px', paddingBottom: '90px' }}>
      <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '20px', fontWeight: 'bold' }}>📡 Network Signals</h2>
      
      {userProfile?.incomingRequest ? (
        <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '16px', border: '1px solid #6366f1', marginBottom: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '12px', lineHeight: '1.4' }}>📩 Incoming Invitation from:<br/><strong style={{ color: '#818cf8' }}>{userProfile.incomingRequest}</strong></p>
          <button onClick={acceptMission} style={{ width: '100%', padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Accept Request & Link Bridge</button>
        </div>
      ) : (
        <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '25px', background: '#18181b', padding: '15px', borderRadius: '12px', border: '1px solid #27272a' }}>
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#fff' }}>⚡ Status Update</p>
          <p style={{ margin: 0, color: '#71717a' }}>System fully synchronized. No active pending incoming request tags found.</p>
        </div>
      )}

      <div style={{ padding: '20px', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
        <h3 style={{ fontSize: '0.95rem', color: '#fff', marginBottom: '6px', fontWeight: 'bold' }}>Send Partnership Request</h3>
        <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '15px', lineHeight: '1.4' }}>Transmit a connection signal to a partner's device terminal via email block.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <input value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="Partner Email address..." style={{ width: '100%', padding: '12px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px', fontSize: '0.85rem', boxSizing: 'border-box' }} />
          <button onClick={linkPartner} disabled={isLinking} style={{ width: '100%', padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>{isLinking ? 'Transmitting...' : 'Send Signal'}</button>
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', background: '#111113', borderRadius: '12px', border: '1px solid #27272a', fontSize: '0.75rem', color: '#a1a1aa' }}>
        💡 <strong>Bridge Pipeline Status:</strong> {userProfile?.partnerEmail ? `Active Alliance with (${userProfile.partnerEmail})` : 'Offline / Unlinked'}
      </div>
      
      <button onClick={handleLogout} style={{ width: '100%', marginTop: '35px', padding: '12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Disconnect Session (Logout)</button>

      <BottomNav hasNotification={!!userProfile?.incomingRequest} />
    </div>
  );
}