'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import VaultDepositModal from '@/components/VaultDepositModal';

interface UserProfile {
  email?: string;
  displayName?: string; 
  partnerEmail?: string;
  partnerStatus?: 'none' | 'pending' | 'active';
  incomingRequest?: string;
  visionRank?: number;
}

interface BroadcastPost {
  _id: string; 
  authorEmail: string;
  authorName: string; 
  text: string;
  media: string[] | null; 
  fileName?: string;
  visibility: 'private' | 'partner' | 'public';
  createdAt: string;
}

interface MissionItem {
  _id: string;
  title: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'active' | 'completed';
}

export default function Workspace() {
  const [selectedTalent, setSelectedTalent] = useState('All');
  const [projects, setProjects] = useState<any[]>([]);
  const router = useRouter();
  
  // App Navigation Active View Tab State
  const [activeNavTab, setActiveNavTab] = useState<'workspace' | 'signals' | 'discover'>('workspace');

  // Dynamic Modal UI States
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositTargetStatus, setDepositTargetStatus] = useState<'active' | 'manifested'>('active');

  // --- DYNAMIC MISSIONS SYNC STATE ---
  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [newMission, setNewMission] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [broadcasts, setBroadcasts] = useState<BroadcastPost[]>([]); 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [broadcastText, setBroadcastText] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'partner' | 'public'>('partner');

  const fetchMissions = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/missions/my-missions/${email}`);
      setMissionsList(res.data);
    } catch (err) {
      console.error("Failed to sync custom missions:", err);
    }
  };

  const fetchVaultAndProfile = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
      setUserProfile(res.data);
      
      const postsRes = await axios.get(`https://v26.onrender.com/api/posts/bridge/${email}/${res.data.partnerEmail || 'none'}`);
      setBroadcasts(postsRes.data);

      const vaultRes = await axios.get(`https://v26.onrender.com/api/projects/vault/${email}`);
      setProjects(vaultRes.data);
    } catch (err) { 
      console.error("Workspace synchronization failed:", err); 
    }
  };

  useEffect(() => {
    fetchVaultAndProfile();
    fetchMissions();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('v26UserEmail');
    localStorage.removeItem('v26Token');
    router.push('/login');
  };

  const triggerVaultDeposit = (status: 'active' | 'manifested') => {
    setDepositTargetStatus(status);
    setIsDepositOpen(true);
  };

  const handleInitialize = async () => {
    if (!newMission) return;
    const email = localStorage.getItem('v26UserEmail');
    try {
      await axios.post('https://v26.onrender.com/api/missions/create-mission', {
        creatorEmail: email,
        title: newMission,
        timeframe: timeframe
      });
      setNewMission(""); 
      alert("Vision Manifested.");
      fetchMissions(); 
    } catch (err) {
      console.error("Signal lost during initialization.");
    }
  };

  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete this goal permanently?")) return;
    try {
      await axios.delete(`https://v26.onrender.com/api/missions/delete/${id}`);
      setMissionsList(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      console.error("Failed to delete mission:", err);
    }
  };

  const linkPartner = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    try {
      setIsLinking(true);
      await axios.put('https://v26.onrender.com/api/auth/invite-partner', { myEmail, partnerEmail });
      alert("Invitation Sent to Partner's Signals Panel!");
      fetchVaultAndProfile();
    } catch (err) { 
      alert("Partner account configuration not found."); 
    } finally { 
      setIsLinking(false); 
    }
  };

  const acceptMission = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    try {
      await axios.put('https://v26.onrender.com/api/auth/accept-partner', { 
        myEmail, 
        partnerEmail: userProfile?.incomingRequest 
      });
      alert("Mission Bridge Activated successfully!");
      fetchVaultAndProfile();
    } catch (err) { 
      alert("Failed to accept mission."); 
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim() && selectedFiles.length === 0) return;
    const postData = {
      authorEmail: localStorage.getItem('v26UserEmail'),
      authorName: userProfile?.displayName || "New Creator", 
      text: broadcastText,
      media: selectedFiles.length > 0 ? selectedFiles.map(f => URL.createObjectURL(f)) : null,
      visibility: visibility
    };
    try {
      const res = await axios.post('https://v26.onrender.com/api/posts/create', postData);
      setBroadcasts([res.data, ...broadcasts]);
      setBroadcastText('');
      setSelectedFiles([]); 
    } catch (err) { 
      console.error("Post Error:", err);
    }
  };

  const deletePost = async (id: string) => {
    if (!window.confirm("Delete this broadcast?")) return;
    try {
      await axios.delete(`https://v26.onrender.com/api/posts/${id}`);
      setBroadcasts(broadcasts.filter(post => post._id !== id));
    } catch (err) { 
      alert("Delete failed"); 
    }
  };

  const calculateProgress = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const filteredMissions = missionsList.filter(m => m.timeframe === type);
    if (filteredMissions.length === 0) return 0;
    const completedCount = filteredMissions.filter(m => m.status === 'completed').length;
    return Math.round((completedCount / filteredMissions.length) * 100);
  };

  const togglePlanStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'active' : 'completed';
    setMissionsList(prev => prev.map(m => m._id === id ? { ...m, status: nextStatus } : m));
    try {
      await axios.put(`https://v26.onrender.com/api/missions/update-status/${id}`, { status: nextStatus });
    } catch (err) {
      fetchMissions();
    }
  };

  const ProgressCircle = ({ percent, label, color }: { percent: number; label: string; color: string }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto' }}>
        <svg width="60" height="60">
          <circle cx="30" cy="30" r="26" stroke="#27272a" strokeWidth="4" fill="none" />
          <circle cx="30" cy="30" r="26" stroke={color} strokeWidth="4" fill="none" 
            strokeDasharray={163} strokeDashoffset={163 - (163 * percent) / 100} 
            strokeLinecap="round" style={{ transition: '0.5s' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.65rem', fontWeight: 'bold' }}>{percent}%</div>
      </div>
      <div style={{ marginTop: '5px', fontSize: '0.55rem', color: '#71717a' }}>{label}</div>
    </div>
  );

  return (
    <div className="workspace-main-container">
      
      {/* 🏢 MAIN DYNAMIC LAYER ROUTER PANELS */}
      <div className="workspace-scrollable-content">
        
        {activeNavTab === 'workspace' && (
          <div className="layout-split-grid">
            {/* LEFT SIDEBAR: COMMAND CONTROLS */}
            <section className="left-command-panel">
              <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '25px', color: '#6366f1' }}>Command Center</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '30px', background: '#18181b', padding: '12px', borderRadius: '15px', border: '1px solid #27272a' }}>
                <ProgressCircle percent={calculateProgress('daily')} label="Daily" color="#6366f1" />
                <ProgressCircle percent={calculateProgress('weekly')} label="Weekly" color="#a855f7" />
                <ProgressCircle percent={calculateProgress('monthly')} label="Monthly" color="#22c55e" />
                <ProgressCircle percent={calculateProgress('yearly')} label="Yearly" color="#EAB308" />
              </div>

              {/* VISION INITIALIZER */}
              <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(129, 140, 248, 0.05)', borderRadius: '24px', border: '1px solid #27272a' }}>
                <p style={{ fontSize: '0.75rem', color: '#818cf8', marginBottom: '12px', fontWeight: 'bold' }}>INITIALIZE VISION</p>
                <input value={newMission} onChange={(e) => setNewMission(e.target.value)} placeholder="What are we manifesting?" style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', color: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '10px', boxSizing: 'border-box' }} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ background: '#111113', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '8px', padding: '0 10px' }}>
                    <option value="daily">Daily</option> <option value="weekly">Weekly</option> <option value="monthly">Monthly</option> <option value="yearly">Yearly</option>
                  </select>
                  <button onClick={handleInitialize} style={{ flexGrow: 1, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Launch</button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: activeTab === t ? '#6366f1' : '#18181b', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>{t}</button>
                ))}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {missionsList.filter(item => item.timeframe === activeTab).length === 0 ? (
                  <p style={{ color: '#71717a', fontSize: '0.8rem', textAlign: 'center' }}>No visions initialized.</p>
                ) : (
                  missionsList.filter(item => item.timeframe === activeTab).map((item) => (
                    <div key={item._id} onClick={() => togglePlanStatus(item._id, item.status)} style={{ padding: '12px', background: item.status === 'completed' ? 'rgba(99, 102, 241, 0.03)' : '#18181b', borderRadius: '10px', border: '1px solid #27272a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '18px', height: '18px', border: '2px solid #6366f1', borderRadius: '4px', backgroundColor: item.status === 'completed' ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{item.status === 'completed' && "✓"}</div>
                        <span style={{ fontSize: '0.9rem', color: item.status === 'completed' ? '#71717a' : '#fff' }}>{item.title}</span>
                      </div>
                      <button onClick={(e) => handleDeleteMission(item._id, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* RIGHT WORKSPACE CONSOLE */}
            <section style={{ flexGrow: 1, padding: '20px' }}>
              {/* BROADCAST CARD */}
              <div style={{ marginBottom: '30px', padding: '25px', background: 'linear-gradient(145deg, #1e1b4b, #09090b)', borderRadius: '24px', border: '1px solid #312e81' }}>
                <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '800', marginBottom: '15px' }}>🚀 Broadcast Progress</h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  {['private', 'partner', 'public'].map((mode) => (
                    <button key={mode} onClick={() => setVisibility(mode as any)} style={{ padding: '4px 10px', fontSize: '0.6rem', borderRadius: '20px', background: visibility === mode ? '#6366f1' : 'transparent', color: '#fff', border: '1px solid #312e81', cursor: 'pointer' }}>{mode}</button>
                  ))}
                </div>
                <textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Tell your partner about today's win..." style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', border: '1px solid #27272a', marginBottom: '15px', boxSizing: 'border-box', resize: 'none' }} />
                
                {selectedFiles.length > 0 && (
                  <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} style={{ position: 'relative', border: '1px solid #6366f1', borderRadius: '8px', overflow: 'hidden', height: '80px' }}>
                         <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                         <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', border: 'none', fontSize: '0.6rem', cursor: 'pointer' }}>X</button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ cursor: 'pointer', color: '#a5b4fc', fontSize: '0.8rem' }}>
                    <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                    📁 Attach Media (Multi)
                  </label>
                  <button onClick={handleBroadcast} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Post to Bridge</button>
                </div>
              </div>

              {/* POSTS LIST FEED */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {broadcasts.map((post) => (
                  <div key={post._id} style={{ background: '#18181b', padding: '20px', borderRadius: '15px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{post.authorEmail === localStorage.getItem('v26UserEmail') ? 'You' : post.authorName}</span>
                      {post.authorEmail === localStorage.getItem('v26UserEmail') && <button onClick={() => deletePost(post._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>}
                    </div>
                    <p style={{ fontSize: '0.9rem', color: '#fff' }}>{post.text}</p>
                    {post.media && post.media.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: post.media.length > 1 ? '1fr 1fr' : '1fr', gap: '10px', marginTop: '10px' }}>
                        {post.media.map((img, i) => <img key={i} src={img} alt="upload" style={{ width: '100%', borderRadius: '10px', maxHeight: '250px', objectFit: 'cover' }} />)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 2: SIGNALS PANEL */}
        {activeNavTab === 'signals' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '25px', fontWeight: 'bold' }}>📡 Network Signals</h2>
            
            {/* LIVE INCOMING CONNECTIONS */}
            {userProfile?.incomingRequest ? (
              <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '16px', border: '1px solid #6366f1', marginBottom: '25px' }}>
                <p style={{ fontSize: '0.9rem', color: '#fff', marginBottom: '15px' }}>📩 Incoming Partnership Invitation from: <br/><strong style={{ color: '#818cf8' }}>{userProfile.incomingRequest}</strong></p>
                <button onClick={acceptMission} style={{ padding: '12px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Accept Partner & Activate Bridge</button>
              </div>
            ) : (
              <p style={{ color: '#71717a', fontSize: '0.85rem', marginBottom: '30px', background: '#18181b', padding: '15px', borderRadius: '10px', border: '1px solid #27272a' }}>No active incoming alliance signals found.</p>
            )}

            {/* SEND OUTBOUND INVITATIONS */}
            <div style={{ padding: '20px', background: '#18181b', borderRadius: '16px', border: '1px solid #27272a' }}>
              <h3 style={{ fontSize: '1rem', color: '#fff', marginBottom: '8px' }}>Link Accountability Partner</h3>
              <p style={{ fontSize: '0.75rem', color: '#71717a', marginBottom: '15px' }}>Enter their profile email to stream mutual workflow updates.</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="Partner Email address..." style={{ flexGrow: 1, padding: '12px', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '8px' }} />
                <button onClick={linkPartner} disabled={isLinking} style={{ padding: '12px 20px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>{isLinking ? '...' : 'Send Signal'}</button>
              </div>
            </div>
            
            <button onClick={handleLogout} style={{ width: '100%', marginTop: '40px', padding: '14px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Disconnect Session (Logout)</button>
          </div>
        )}

        {/* TAB 3: DISCOVER SPACE (THE VAULT SECTIONS) */}
        {activeNavTab === 'discover' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', color: '#fff', fontWeight: 'bold' }}>📂 The Talent Vault</h2>
                <p style={{ color: '#6366f1', fontSize: '0.75rem', textTransform: 'uppercase' }}>Global Ecosystem Hub</p>
              </div>
              <select value={selectedTalent} onChange={(e) => setSelectedTalent(e.target.value)} style={{ padding: '10px', background: '#18181b', color: '#fff', borderRadius: '8px', border: '1px solid #27272a' }}>
                <option value="All">Global Feed</option> <option value="Music">Music & Sound Architecture</option> <option value="Dev">Systems Engineering</option> <option value="Film">Cinematography</option>
              </select>
            </div>

            <div className="vault-sections-grid">
              <div style={{ background: '#18181b', padding: '20px', borderRadius: '15px', border: '1px solid #27272a' }}>
                <h4 style={{ color: '#a5b4fc', fontSize: '0.85rem', marginBottom: '15px' }}>📡 Active Frequencies</h4>
                <button onClick={() => triggerVaultDeposit('active')} style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px dashed #3f3f46', color: '#a1a1aa', borderRadius: '8px', cursor: 'pointer' }}>+ Deposit Unfinished Work</button>
              </div>
              <div style={{ background: '#18181b', padding: '20px', borderRadius: '15px', border: '1px solid #27272a' }}>
                <h4 style={{ color: '#fbbf24', fontSize: '0.85rem', marginBottom: '15px' }}>💎 Manifested Visions</h4>
                <button onClick={() => triggerVaultDeposit('manifested')} style={{ width: '100%', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', color: '#fbbf24', borderRadius: '8px', cursor: 'pointer' }}>Archive Finished Project</button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 📱 NATIVE APP STICKY BOTTOM NAVIGATION BAR */}
      <footer className="native-app-bottom-bar">
        <button onClick={() => setActiveNavTab('workspace')} className={`nav-icon-tab ${activeNavTab === 'workspace' ? 'tab-active' : ''}`}>
          <span style={{ fontSize: '1.3rem' }}>🏠</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Workspace</span>
        </button>

        <button onClick={() => setActiveNavTab('signals')} className={`nav-icon-tab ${activeNavTab === 'signals' ? 'tab-active' : ''}`}>
          <span style={{ fontSize: '1.3rem', position: 'relative' }}>
            🔔 {userProfile?.incomingRequest && <span className="notification-ping-dot"></span>}
          </span>
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Signals</span>
        </button>

        <button onClick={() => setActiveNavTab('discover')} className={`nav-icon-tab ${activeNavTab === 'discover' ? 'tab-active' : ''}`}>
          <span style={{ fontSize: '1.3rem' }}>🌍</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Discover</span>
        </button>
      </footer>

      {isDepositOpen && <VaultDepositModal onClose={() => setIsDepositOpen(false)} onSuccess={fetchVaultAndProfile} />}

      <style jsx global>{`
        .workspace-main-container {
          background-color: #09090b; 
          color: #fff; 
          height: 100vh; 
          display: flex; 
          flex-direction: column;
          font-family: "Inter", sans-serif;
          position: relative;
          overflow: hidden;
        }

        .workspace-scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 90px; /* Space so content doesn't sit under the bar */
        }

        .layout-split-grid {
          display: flex;
          flex-direction: row;
          min-height: 100%;
        }

        .left-command-panel {
          width: 35%; 
          border-right: 1px solid #27272a; 
          padding: 30px; 
        }

        .native-app-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 75px;
          background: #111113;
          border-top: 1px solid #27272a;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          justify-items: center;
          z-index: 100;
        }

        .nav-icon-tab {
          background: transparent;
          border: none;
          color: #71717a;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          width: 100%;
          height: 100%;
          justify-content: center;
          transition: 0.2s;
        }

        .tab-active {
          color: #6366f1 !important;
          background: rgba(99, 102, 241, 0.03);
        }

        .notification-ping-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
        }

        .vault-sections-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

        @media (max-width: 1024px) {
          .layout-split-grid { flex-direction: column; }
          .left-command-panel { width: 100%; border-right: none; border-bottom: 1px solid #27272a; box-sizing: border-box; }
          .vault-sections-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}