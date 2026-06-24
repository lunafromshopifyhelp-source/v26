'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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
    <div className="workspace-main-container">
      <div className="workspace-scrollable-content">
        <div style={{ maxWidth: '440px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Profile Configuration</h2>
          
          {/* User Metadata Overview Identity Plaque */}
          <div style={{ background: '#0e0e11', border: '1px solid #18181b', borderRadius: '24px', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '55px', height: '55px', borderRadius: '18px', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
              {(userProfile?.displayName || userProfile?.email || 'V')[0].toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: '0 0 2px 0' }}>{userProfile?.displayName || 'Creator Terminal'}</h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a', margin: 0 }}>{userProfile?.email}</p>
            </div>
          </div>

          {/* Custom Identity Editing Controls */}
          <div style={{ padding: '20px', background: '#0e0e11', border: '1px solid #18181b', borderRadius: '24px' }}>
            <span className="section-mini-tag" style={{ color: '#818cf8' }}>Modify Visual Identity</span>
            <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 16px 0', lineHeight: '1.4' }}>Update your visible identifier broadcast token displayed across global streams.</p>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter display alias..." className="premium-text-input" />
            <button onClick={handleUpdateIdentity} disabled={updatingProfile} className="premium-action-btn" style={{ width: '100%' }}>
              {updatingProfile ? 'Saving Configuration...' : 'Update Identity'}
            </button>
          </div>

          {/* Structural Account Parameters Matrix */}
          <div style={{ padding: '20px', background: '#0e0e11', border: '1px solid #18181b', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <span className="section-mini-tag" style={{ color: '#a1a1aa' }}>Account Infrastructure</span>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', borderBottom: '1px solid #18181b', paddingBottom: '10px' }}>
              <span style={{ color: '#71717a' }}>Alliance Status</span>
              <span style={{ fontWeight: '600', color: userProfile?.partnerEmail ? '#22c55e' : '#eab308' }}>
                {userProfile?.partnerEmail ? 'Bridged Alliance Linked' : 'Standalone Autonomous'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: '#71717a' }}>Security Level</span>
              <span style={{ fontWeight: '600', color: '#a855f7' }}>Level {userProfile?.visionRank || 1} Cryptography</span>
            </div>
          </div>

          {/* Danger Zone Logout Trigger */}
          <button onClick={handleLogout} className="logout-trigger-btn">Disconnect Session (Logout)</button>
        </div>
      </div>

      {/* 📱 FIXED 4-TAB NAVIGATION APP FOOTER BAR */}
      <footer className="native-app-bottom-bar four-column-grid">
        <button onClick={() => router.push('/workspace')} className="nav-icon-tab">
          <span className="tab-emoji">制造</span> <span className="tab-label-text">Workspace</span>
        </button>
        <button onClick={() => router.push('/workspace')} className="nav-icon-tab">
          <span className="tab-emoji">连</span> <span className="tab-label-text">Signals</span>
        </button>
        <button onClick={() => router.push('/discover')} className="nav-icon-tab">
          <span className="tab-emoji">界</span> <span className="tab-label-text">Discover</span>
        </button>
        <button onClick={() => router.push('/profile')} className="nav-icon-tab tab-active">
          <span className="tab-emoji">己</span> <span className="tab-label-text">Profile</span>
        </button>
      </footer>

      <style jsx global>{`
        .workspace-main-container { background-color: #09090b; color: #fafafa; height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .workspace-scrollable-content { flex: 1; overflow-y: auto; padding-bottom: 95px; }
        .section-mini-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }

        .premium-text-input { width: 100%; background: #141416; border: 1px solid #18181b; border-radius: 12px; padding: 14px 16px; font-size: 0.85rem; color: #fff; outline: none; box-sizing: border-box; margin-bottom: 12px; transition: all 0.2s; }
        .premium-text-input:focus { border-color: #27272a; background: #18181b; }

        .premium-action-btn { background: #fff; color: #000; font-weight: 700; font-size: 0.85rem; padding: 12px 24px; border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .premium-action-btn:hover { background: #e4e4e7; transform: scale(0.99); }
        .premium-action-btn:disabled { background: #18181b; color: #52525b; cursor: not-allowed; }

        .logout-trigger-btn { width: 100%; padding: 14px; background: transparent; border: 1px solid #18181b; color: #f87171; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .logout-trigger-btn:hover { background: rgba(239, 68, 68, 0.02); border-color: #f87171; }

        .native-app-bottom-bar { position: fixed; bottom: 0; left: 0; width: 100%; height: 65px; background: rgba(11, 11, 13, 0.8); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid #18181b; display: grid; align-items: center; z-index: 1000; }
        .four-column-grid { grid-template-columns: repeat(4, 1fr) !important; }
        .nav-icon-tab { background: transparent; border: none; color: #52525b; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; height: 100%; justify-content: center; }
        .tab-emoji { font-size: 0.95rem; font-weight: 800; }
        .tab-label-text { font-size: 0.55rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .tab-active { color: #fff !important; }
      `}</style>
    </div>
  );
}