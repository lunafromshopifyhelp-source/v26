'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

interface PlanItem {
  id: number;
  text: string;
  done: boolean;
}

export default function Workspace() {
  const [selectedTalent, setSelectedTalent] = useState('All');
  const [projects, setProjects] = useState<any[]>([]);
  
  // Dynamic Modal UI States
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [depositTargetStatus, setDepositTargetStatus] = useState<'active' | 'manifested'>('active');

  // --- PLANS STATE ---
  const [plans, setPlans] = useState<{ daily: PlanItem[]; weekly: PlanItem[]; yearly: PlanItem[] }>({
    daily: [{ id: 1, text: 'Study Organic Chemistry', done: false }],
    weekly: [{ id: 2, text: 'Record "Soulful" Demo', done: false }],
    yearly: [{ id: 3, text: 'Complete v26 Platform', done: false }]
  });
  
  const [newMission, setNewMission] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'yearly'>('daily');

  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [broadcasts, setBroadcasts] = useState<BroadcastPost[]>([]); 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [broadcastText, setBroadcastText] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'partner' | 'public'>('partner');

  // Core Data Synchronization Loader
  const fetchVaultAndProfile = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    try {
      // Synchronize Profile Data
      const res = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
      setUserProfile(res.data);
      
      // Synchronize Broadcast Feed
      const postsRes = await axios.get(`https://v26.onrender.com/api/posts/bridge/${email}/${res.data.partnerEmail || 'none'}`);
      setBroadcasts(postsRes.data);

      // Synchronize Vault Metrics
      const vaultRes = await axios.get(`https://v26.onrender.com/api/projects/vault/${email}`);
      setProjects(vaultRes.data);
    } catch (err) { 
      console.error("Workspace synchronization failed:", err); 
    }
  };

  useEffect(() => {
    fetchVaultAndProfile();
  }, []);

  // Open Portal with Configured Transmission Context
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
    } catch (err) {
      console.error("Signal lost during initialization.");
    }
  };

  const linkPartner = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    try {
      setIsLinking(true);
      await axios.put('https://v26.onrender.com/api/auth/link-partner', { myEmail, partnerEmail });
      alert("Invitation Sent!");
      fetchVaultAndProfile();
    } catch (err) { 
      alert("Partner not found in v26."); 
    } finally { 
      setIsLinking(false); 
    }
  };

  const acceptMission = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    try {
      await axios.put('https://v26.onrender.com/api/auth/accept-mission', { 
        myEmail, 
        requesterEmail: userProfile?.incomingRequest 
      });
      alert("Mission Accepted!");
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
      alert("Failed to post to Bridge."); 
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

  const calculateProgress = (type: 'daily' | 'weekly' | 'yearly') => {
    const list = plans[type];
    if (list.length === 0) return 0;
    return Math.round((list.filter(p => p.done).length / list.length) * 100);
  };

  const togglePlan = (type: 'daily' | 'weekly' | 'yearly', id: number) => {
    setPlans({ 
      ...plans, 
      [type]: plans[type].map(p => p.id === id ? { ...p, done: !p.done } : p) 
    });
  };

  const ProgressCircle = ({ percent, label, color }: { percent: number; label: string; color: string }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '65px', height: '65px', margin: '0 auto' }}>
        <svg width="65" height="65">
          <circle cx="32.5" cy="32.5" r="28" stroke="#27272a" strokeWidth="5" fill="none" />
          <circle cx="32.5" cy="32.5" r="28" stroke={color} strokeWidth="5" fill="none" 
            strokeDasharray={176} strokeDashoffset={176 - (176 * percent) / 100} 
            strokeLinecap="round" style={{ transition: '0.5s' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.7rem', fontWeight: 'bold' }}>{percent}%</div>
      </div>
      <div style={{ marginTop: '5px', fontSize: '0.6rem', color: '#71717a', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );

  return (
    <div className="workspace-main-container">
      
      {/* LEFT: COMMAND CENTER */}
      <section className="left-command-panel">
        <h2 style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '25px', color: '#6366f1' }}>Command Center</h2>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '35px', background: '#18181b', padding: '15px', borderRadius: '15px', border: '1px solid #27272a' }}>
          <ProgressCircle percent={calculateProgress('daily')} label="Daily" color="#6366f1" />
          <ProgressCircle percent={calculateProgress('weekly')} label="Weekly" color="#a855f7" />
          <ProgressCircle percent={calculateProgress('yearly')} label="Yearly" color="#EAB308" />
        </div>

        {/* VISION INITIALIZER */}
        <div style={{ marginBottom: '25px', padding: '20px', background: 'rgba(129, 140, 248, 0.05)', borderRadius: '24px', border: '1px solid #27272a' }}>
          <p style={{ fontSize: '0.75rem', color: '#818cf8', marginBottom: '12px', fontWeight: 'bold', letterSpacing: '1px' }}>INITIALIZE VISION</p>
          <input 
            value={newMission} 
            onChange={(e) => setNewMission(e.target.value)}
            placeholder="What are we manifesting?" 
            style={{ width: '100%', background: '#09090b', border: '1px solid #27272a', color: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '10px', boxSizing: 'border-box' }} 
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              style={{ background: '#111113', color: '#a1a1aa', border: '1px solid #27272a', borderRadius: '8px', padding: '0 10px', fontSize: '0.8rem' }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="yearly">Yearly</option>
            </select>
            <button onClick={handleInitialize} style={{ flexGrow: 1, padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Launch</button>
          </div>
        </div>

        {userProfile?.incomingRequest && userProfile?.partnerStatus !== 'active' && (
          <div style={{ marginBottom: '25px', padding: '15px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', border: '1px solid #6366f1' }}>
            <p style={{ fontSize: '0.8rem', color: '#fff', marginBottom: '10px' }}>📩 Mission Request from: <br/><strong>{userProfile.incomingRequest}</strong></p>
            <button onClick={acceptMission} style={{ width: '100%', padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Accept Mission</button>
          </div>
        )}

        <div style={{ marginBottom: '25px', padding: '15px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid #312e81' }}>
          <p style={{ fontSize: '0.75rem', color: '#a5b4fc', marginBottom: '10px' }}>Link Accountability Partner</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="Partner Email..." style={{ flexGrow: 1, padding: '8px', fontSize: '0.8rem', background: '#09090b', border: '1px solid #27272a', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' }} />
            <button onClick={linkPartner} disabled={isLinking} style={{ padding: '8px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>{isLinking ? '...' : 'Link'}</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          {(['daily', 'weekly', 'yearly'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: activeTab === t ? '#6366f1' : '#18181b', color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>{t}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {plans[activeTab].map((item) => (
            <div key={item.id} onClick={() => togglePlan(activeTab, item.id)} style={{ padding: '12px', background: item.done ? 'rgba(99, 102, 241, 0.03)' : '#18181b', borderRadius: '10px', border: '1px solid', borderColor: item.done ? '#6366f1' : '#27272a', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '18px', height: '18px', border: '2px solid #6366f1', borderRadius: '4px', backgroundColor: item.done ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>{item.done && "✓"}</div>
              <span style={{ fontSize: '0.9rem', color: item.done ? '#71717a' : '#fff' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* RIGHT: THE SOUL & THE BRIDGE */}
      <section style={{ flexGrow: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* MULTIMEDIA BROADCAST */}
        <div style={{ marginBottom: '30px', padding: '25px', background: 'linear-gradient(145deg, #1e1b4b, #09090b)', borderRadius: '24px', border: '1px solid #312e81' }}>
          <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800', marginBottom: '15px' }}>🚀 Broadcast Progress</h3>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            {['private', 'partner', 'public'].map((mode) => (
              <button key={mode} onClick={() => setVisibility(mode as any)} style={{ padding: '5px 12px', fontSize: '0.6rem', borderRadius: '20px', border: '1px solid #312e81', background: visibility === mode ? '#6366f1' : 'transparent', color: '#fff', cursor: 'pointer', textTransform: 'capitalize' }}>{mode}</button>
            ))}
          </div>

          <textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Tell your partner about today's win..." style={{ width: '100%', padding: '15px', background: 'rgba(0,0,0,0.3)', color: '#fff', borderRadius: '12px', border: '1px solid #27272a', marginBottom: '15px', fontSize: '0.9rem', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          
          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px' }}>
              {selectedFiles.map((file, idx) => (
                <div key={idx} style={{ position: 'relative', border: '1px solid #6366f1', borderRadius: '8px', overflow: 'hidden', height: '80px' }}>
                   <img src={URL.createObjectURL(file)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                   <button onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: '#fff', border: 'none', padding: '2px 5px', fontSize: '0.6rem', cursor: 'pointer' }}>X</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ cursor: 'pointer', color: '#a5b4fc', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
              📁 Attach Media (Multi)
            </label>
            <button onClick={handleBroadcast} style={{ padding: '10px 20px', background: '#6366f1', color: '#fff', borderRadius: '8px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>Post to Bridge</button>
          </div>
        </div>

        {/* FEED LIST */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {broadcasts.map((post) => (
            <div key={post._id} style={{ background: '#18181b', padding: '20px', borderRadius: '15px', border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#6366f1' }}>{post.authorEmail === localStorage.getItem('v26UserEmail') ? 'You' : post.authorName}</span>
                    <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: '#27272a', color: '#a1a1aa' }}>{post.visibility}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {post.authorEmail === localStorage.getItem('v26UserEmail') && (
                        <button onClick={() => deletePost(post._id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>🗑️</button>
                    )}
                </div>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#fff', marginBottom: post.media && post.media.length > 0 ? '15px' : '0' }}>{post.text}</p>
              {post.media && post.media.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: post.media.length > 1 ? '1fr 1fr' : '1fr', gap: '10px' }}>
                  {post.media.map((img, i) => (
                    <img key={i} src={img} alt="upload" style={{ width: '100%', borderRadius: '10px', maxHeight: '300px', objectFit: 'cover' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* THE VAULT: STORE OF TALENTS */}
        <div style={{ marginBottom: '40px', padding: '25px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '24px', border: '1px solid #1e1b4b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 'bold' }}>📂 The Vault</h3>
              <p style={{ color: '#6366f1', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Store of Talents</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>Filter Field:</span>
              <select 
                value={selectedTalent || 'All'} 
                onChange={(e) => setSelectedTalent(e.target.value)}
                style={{ padding: '8px 12px', background: '#09090b', color: '#fff', borderRadius: '10px', fontSize: '0.75rem', border: '1px solid #27272a', cursor: 'pointer', outline: 'none' }}
              >
                <option value="All">Global Feed</option>
                <option value="Art">Visual Arts & Design</option>
                <option value="Music">Music & Sound Architecture</option>
                <option value="Writing">Literature & Storytelling</option>
                <option value="Film">Cinematography & Motion</option>
                <option value="Science">Scientific Research</option>
                <option value="Dev">Systems Engineering</option>
                <option value="Business">Entrepreneurship & Strategy</option>
                <option value="Spiritual">Spiritual Leadership</option>
                <option value="Agri">Agriculture & Sustainability</option>
                <option value="Athletics">Physical Talent & Athletics</option>
                <option value="Other">Other Divine Talents</option>
              </select>
            </div>
          </div>

          <div className="vault-sections-grid">
            
            {/* SECTION A: ACTIVE FREQUENCIES */}
            <div style={{ background: '#09090b', padding: '20px', borderRadius: '15px', border: '1px solid #27272a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h4 style={{ color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 'bold' }}>📡 Active Frequencies</h4>
                <span style={{ color: '#4ade80', fontSize: '0.7rem' }}>{projects.filter((p: any) => p.status === 'active').length} Files</span>
              </div>
              <div style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {projects.filter((p: any) => p.status === 'active').map((proj: any) => (
                  <div key={proj._id} style={{ background: '#18181b', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #27272a' }}>
                    <p style={{ color: '#fff' }}>{proj.title}</p>
                    <span style={{ color: '#71717a', fontSize: '0.6rem' }}>Modified: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>
                ))}
                
                {/* Linked Premium Drag & Drop Portal */}
                <button 
                  onClick={() => triggerVaultDeposit('active')} 
                  style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed #3f3f46', color: '#a1a1aa', borderRadius: '8px', fontSize: '0.7rem', cursor: 'pointer' }}
                >
                  + Deposit Unfinished Work
                </button>
              </div>
            </div>

            {/* SECTION B: MANIFESTED VISIONS */}
            <div style={{ background: '#09090b', padding: '20px', borderRadius: '15px', border: '1px solid #27272a' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                <h4 style={{ color: '#fbbf24', fontSize: '0.8rem', fontWeight: 'bold' }}>💎 Manifested Visions</h4>
                <span style={{ color: '#fbbf24', fontSize: '0.7rem' }}>{projects.filter((p: any) => p.status === 'manifested').length} Assets</span>
              </div>
              <div style={{ minHeight: '100px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {projects.filter((p: any) => p.status === 'manifested').map((proj: any) => (
                  <div key={proj._id} style={{ background: '#18181b', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #27272a' }}>
                    <p style={{ color: '#fff' }}>{proj.title}</p>
                    <span style={{ color: '#71717a', fontSize: '0.6rem' }}>Manifested: {new Date(proj.updatedAt).toLocaleDateString()}</span>
                  </div>
                ))}

                {/* Linked Premium Drag & Drop Portal */}
                <button 
                  onClick={() => triggerVaultDeposit('manifested')} 
                  style={{ width: '100%', padding: '10px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #fbbf24', color: '#fbbf24', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Archive Finished Project
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MINI BRIDGE */}
        <div style={{ padding: '15px', background: '#09090b', borderRadius: '15px', border: '1px solid #27272a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>📡 <strong>Bridge Status:</strong> {userProfile?.partnerStatus === 'active' ? 'Operational' : 'Offline'}</p>
          <button onClick={() => alert("Handshake Protocol Initialized.")} style={{ background: 'transparent', color: '#6366f1', border: 'none', fontSize: '0.7rem', cursor: 'pointer' }}>Open Handshake Settings</button>
        </div>
      </section>

      {/* DYNAMIC DRAG AND DROP MODAL INJECTION */}
      {isDepositOpen && (
        <VaultDepositModal 
          onClose={() => setIsDepositOpen(false)} 
          onSuccess={fetchVaultAndProfile} 
        />
      )}

      {/* Responsive Structural Media Rules */}
      <style jsx global>{`
        .workspace-main-container {
          background-color: #09090b; 
          color: #fff; 
          min-height: 100vh; 
          display: flex; 
          flex-direction: row;
          font-family: "Inter", sans-serif;
        }

        .left-command-panel {
          width: 35%; 
          border-right: 1px solid #27272a; 
          padding: 30px; 
          overflow-y: auto;
        }

        .vault-sections-grid {
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .workspace-main-container {
            flex-direction: column !important;
          }
          .left-command-panel {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #27272a;
            box-sizing: border-box;
          }
          .vault-sections-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}