'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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
  const router = useRouter();
  
  // App Navigation Tabs: workspace, signals, discover
  const [activeNavTab, setActiveNavTab] = useState<'workspace' | 'signals' | 'discover'>('workspace');

  // Personal Checklist States
  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [newMission, setNewMission] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Partnership & Sync States
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Discover Feed & Broadcast States
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
      console.error(err);
    }
  };

  const fetchFeedAndProfile = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
      setUserProfile(res.data);
      
      const postsRes = await axios.get(`https://v26.onrender.com/api/posts/bridge/${email}/${res.data.partnerEmail || 'none'}`);
      setBroadcasts(postsRes.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => {
    fetchFeedAndProfile();
    fetchMissions();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
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
      console.error(err);
    }
  };

  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete this goal permanently?")) return;
    try {
      await axios.delete(`https://v26.onrender.com/api/missions/delete/${id}`);
      setMissionsList(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const linkPartner = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    if (!partnerEmail) return;
    try {
      setIsLinking(true);
      await axios.put('https://v26.onrender.com/api/auth/invite-partner', { myEmail, partnerEmail });
      alert("Invitation Sent to Partner's Signals Panel!");
      setPartnerEmail('');
      fetchFeedAndProfile();
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
      fetchFeedAndProfile();
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
      alert("Broadcast transmitted to the Discover network!");
    } catch (err) { 
      console.error(err);
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
      <div style={{ position: 'relative', width: '55px', height: '55px', margin: '0 auto' }}>
        <svg width="55" height="55" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="26" stroke="#27272a" strokeWidth="5" fill="none" />
          <circle cx="30" cy="30" r="26" stroke={color} strokeWidth="5" fill="none" 
            strokeDasharray={163} strokeDashoffset={163 - (163 * percent) / 100} 
            strokeLinecap="round" style={{ transition: '0.5s' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.65rem', fontWeight: 'bold' }}>{percent}%</div>
      </div>
      <div style={{ marginTop: '5px', fontSize: '0.55rem', color: '#71717a', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );

  return (
    <div className="workspace-main-container">
      <div className="workspace-scrollable-content">
        
        {/* 🏠 TAB 1: PERSONAL WORKSPACE & DYNAMIC CHECKLISTS */}
        {activeNavTab === 'workspace' && (
          <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '20px', color: '#6366f1', textAlign: 'center' }}>Command Center</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '25px', background: '#18181b', padding: '12px', borderRadius: '15px', border: '1px solid #27272a' }}>
              <ProgressCircle percent={calculateProgress('daily')} label="Daily" color="#6366f1" />
              <ProgressCircle percent={calculateProgress('weekly')} label="Weekly" color="#a855f7" />
              <ProgressCircle percent={calculateProgress('monthly')} label="Monthly" color="#22c55e" />
              <ProgressCircle percent={calculateProgress('yearly')} label="Yearly" color="#EAB308" />
            </div>

            <div style={{ marginBottom: '25px', padding: '15px', background: 'rgba(129, 140, 248, 0.03)', borderRadius: '16px', border: '1px solid #27272a' }}>
              <p style={{ fontSize: '0.7rem', color: '#818cf8', marginBottom: '10px', fontWeight: 'bold' }}>INITIALIZE VISION</p>
              <input value={newMission} onChange={(e) => setNewMission(e.target.value)} placeholder="What are we manifesting?" style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', color: '#fff', padding: '12px', borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box', fontSize: '0.85rem' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} style={{ background: '#111113', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '8px', padding: '0 8px', fontSize: '0.8rem' }}>
                  <option value="daily">Daily</option> <option value="weekly">Weekly</option> <option value="monthly">Monthly</option> <option value="yearly">Yearly</option>
                </select>
                <button onClick={handleInitialize} style={{ flexGrow: 1, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Launch Goal</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '8px 4px', borderRadius: '6px', border: 'none', background: activeTab === t ? '#6366f1' : '#18181b', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{t}</button>
              ))}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {missionsList.filter(item => item.timeframe === activeTab).length === 0 ? (
                <p style={{ color: '#71717a', fontSize: '0.75rem', textAlign: 'center', marginTop: '15px' }}>No targets active in this timeframe.</p>
              ) : (
                missionsList.filter(item => item.timeframe === activeTab).map((item) => (
                  <div key={item._id} onClick={() => togglePlanStatus(item._id, item.status)} style={{ padding: '14px', background: item.status === 'completed' ? 'rgba(99, 102, 241, 0.02)' : '#18181b', borderRadius: '12px', border: '1px solid #27272a', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', height: '16px', border: '2px solid #6366f1', borderRadius: '4px', backgroundColor: item.status === 'completed' ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem' }}>{item.status === 'completed' && "✓"}</div>
                      <span style={{ fontSize: '0.85rem', color: item.status === 'completed' ? '#71717a' : '#fff' }}>{item.title}</span>
                    </div>
                    <button onClick={(e) => handleDeleteMission(item._id, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.95rem' }}>🗑️</button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 🔔 TAB 2: SIGNALS (ALERTS, INCOMING REQUESTS & STATUSES ONLY) */}
        {activeNavTab === 'signals' && (
          <div style={{ maxWidth: '500px', margin: '0 auto', padding: '30px 20px' }}>
            <h2 style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '20px', fontWeight: 'bold' }}>📡 Network Signals</h2>
            
            {userProfile?.incomingRequest ? (
              <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '16px', border: '1px solid #6366f1', marginBottom: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '12px', lineHeight: '1.4' }}>📩 Incoming Partnership Invitation from:<br/><strong style={{ color: '#818cf8' }}>{userProfile.incomingRequest}</strong></p>
                <button onClick={acceptMission} style={{ width: '100%', padding: '12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Accept Request & Link Bridge</button>
              </div>
            ) : (
              <div style={{ color: '#a1a1aa', fontSize: '0.8rem', marginBottom: '25px', background: '#18181b', padding: '15px', borderRadius: '12px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <p style={{ margin: 0, fontWeight: 'bold', color: '#fff' }}>⚡ Status Update</p>
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
              📡 <strong>Bridge Pipeline:</strong> {userProfile?.partnerEmail ? `Operational (${userProfile.partnerEmail})` : 'Offline'}
            </div>
            
            <button onClick={handleLogout} style={{ width: '100%', marginTop: '35px', padding: '12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.85rem' }}>Disconnect Session (Logout)</button>
          </div>
        )}

        {/* 🌍 TAB 3: DISCOVER (RICH FB-STYLE TIMELINE & CREATIVE REELS FEED ONLY) */}
        {activeNavTab === 'discover' && (
          <div style={{ maxWidth: '550px', margin: '0 auto', padding: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>🌍 Discover Hub</h2>
            <p style={{ color: '#71717a', fontSize: '0.75rem', marginBottom: '20px' }}>Creative Posts, Reels, and Progress Updates across the Bridge</p>

            {/* BROADCAST PUBLISHING POST CONSOLE */}
            <div style={{ marginBottom: '25px', padding: '20px', background: 'linear-gradient(145deg, #18181b, #09090b)', borderRadius: '20px', border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                {['private', 'partner', 'public'].map((mode) => (
                  <button key={mode} onClick={() => setVisibility(mode as any)} style={{ padding: '4px 10px', fontSize: '0.6rem', borderRadius: '20px', background: visibility === mode ? '#6366f1' : 'transparent', color: '#fff', border: '1px solid #27272a', cursor: 'pointer', textTransform: 'uppercase' }}>{mode}</button>
                ))}
              </div>
              <textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Share a new post or attach project clips/reels..." style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', color: '#fff', borderRadius: '10px', border: '1px solid #27272a', marginBottom: '12px', boxSizing: 'border-box', resize: 'none', fontSize: '0.85rem', outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ cursor: 'pointer', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                  🎬 Attach Media / Reels
                </label>
                <button onClick={handleBroadcast} style={{ padding: '8px 20px', background: '#6366f1', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}>Publish</button>
              </div>
            </div>

            {/* TIMELINE FEED */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {broadcasts.length === 0 ? (
                <p style={{ color: '#71717a', fontSize: '0.8rem', textAlign: 'center', marginTop: '20px' }}>No creative broadcasts or reels found on your feed.</p>
              ) : (
                broadcasts.map((post) => (
                  <div key={post._id} style={{ background: '#18181b', padding: '15px', borderRadius: '16px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold', color: '#6366f1', fontSize: '0.85rem' }}>{post.authorEmail === localStorage.getItem('v26UserEmail') ? 'You' : post.authorName}</span>
                        <span style={{ fontSize: '0.55rem', padding: '2px 6px', background: '#09090b', borderRadius: '4px', color: '#71717a', textTransform: 'uppercase' }}>{post.visibility}</span>
                      </div>
                      {post.authorEmail === localStorage.getItem('v26UserEmail') && (
                        <button onClick={() => deletePost(post._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>🗑️</button>
                      )}
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#e4e4e7', lineHeight: '1.4' }}>{post.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* 📱 FIXED PREMIUM APP BOTTOM TAB BAR */}
      <footer className="native-app-bottom-bar">
        <button onClick={() => setActiveNavTab('workspace')} className={`nav-icon-tab ${activeNavTab === 'workspace' ? 'tab-active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>🏠</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Workspace</span>
        </button>

        <button onClick={() => setActiveNavTab('signals')} className={`nav-icon-tab ${activeNavTab === 'signals' ? 'tab-active' : ''}`}>
          <span style={{ fontSize: '1.2rem', position: 'relative', display: 'inline-block' }}>
            🔔 {userProfile?.incomingRequest && <span className="notification-ping-dot"></span>}
          </span>
          <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Signals</span>
        </button>

        <button onClick={() => setActiveNavTab('discover')} className={`nav-icon-tab ${activeNavTab === 'discover' ? 'tab-active' : ''}`}>
          <span style={{ fontSize: '1.2rem' }}>🌍</span>
          <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Discover</span>
        </button>
      </footer>

      <style jsx global>{`
        .workspace-main-container {
          background-color: #09090b; 
          color: #fff; 
          height: 100vh; 
          display: flex; 
          flex-direction: column;
          font-family: sans-serif;
          position: relative;
          overflow: hidden;
        }
        .workspace-scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding-bottom: 85px; 
        }
        .native-app-bottom-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 65px;
          background: #111113;
          border-top: 1px solid #27272a;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          z-index: 100;
        }
        .nav-icon-tab {
          background: transparent;
          border: none;
          color: #71717a;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          height: 100%;
          justify-content: center;
        }
        .tab-active {
          color: #6366f1 !important;
        }
        .notification-ping-dot {
          position: absolute;
          top: -1px;
          right: -3px;
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
}