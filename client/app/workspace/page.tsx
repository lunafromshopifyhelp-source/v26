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
  inspirations?: string[]; 
  discussions?: {
    _id: string;
    user: string;
    userName: string;
    text: string;
    createdAt: string;
  }[];
}

interface MissionItem {
  _id: string;
  title: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'active' | 'completed';
}

const talentCategories = [
  { id: 'All', label: '🌐 Global Feed' },
  { id: 'Art', label: '🎨 Visual Arts & Design' },
  { id: 'Music', label: '🎵 Music Architecture' },
  { id: 'Development', label: '💻 Systems & Software' },
  { id: 'Chemistry', label: '🧪 Scientific Research' },
  { id: 'Business', label: '💼 Strategy & Enterprise' }
];

export default function WorkspaceMasterConsole() {
  const router = useRouter();
  
  // 4 Unified Screen States
  const [activeNavTab, setActiveNavTab] = useState<'workspace' | 'signals' | 'discover' | 'profile'>('workspace');

  // --- WORKSPACE STATES ---
  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [newMission, setNewMission] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // --- SIGNALS & PROFILE STATES ---
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // --- DISCOVER / BROADCAST STATES ---
  const [broadcasts, setBroadcasts] = useState<BroadcastPost[]>([]); 
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [broadcastText, setBroadcastText] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'partner' | 'public'>('partner');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [activeDiscussionPostId, setActiveDiscussionPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchMissions = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/missions/my-missions/${email}`);
      setMissionsList(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFeedAndProfile = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return;
    try {
      setLoadingFeed(true);
      const res = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
      setUserProfile(res.data);
      if (res.data.displayName) setNewName(res.data.displayName);

      const postsRes = await axios.get('https://v26.onrender.com/api/posts/public-feed');
      setBroadcasts(postsRes.data);
    } catch (err) { 
      console.error(err); 
    } finally {
      setLoadingFeed(false);
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

  // --- WORKSPACE HANDLERS ---
  const handleInitialize = async () => {
    if (!newMission.trim()) return;
    const email = localStorage.getItem('v26UserEmail');
    try {
      await axios.post('https://v26.onrender.com/api/missions/create-mission', {
        creatorEmail: email,
        title: newMission,
        timeframe: timeframe
      });
      setNewMission(""); 
      fetchMissions(); 
    } catch (err) { console.error(err); }
  };

  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete this goal permanently?")) return;
    try {
      await axios.delete(`https://v26.onrender.com/api/missions/delete/${id}`);
      setMissionsList(prev => prev.filter(m => m._id !== id));
    } catch (err) { console.error(err); }
  };

  const togglePlanStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'active' : 'completed';
    setMissionsList(prev => prev.map(m => m._id === id ? { ...m, status: nextStatus } : m));
    try {
      await axios.put(`https://v26.onrender.com/api/missions/update-status/${id}`, { status: nextStatus });
    } catch (err) { fetchMissions(); }
  };

  const calculateProgress = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const filtered = missionsList.filter(m => m.timeframe === type);
    if (filtered.length === 0) return 0;
    return Math.round((filtered.filter(m => m.status === 'completed').length / filtered.length) * 100);
  };

  // --- SIGNALS HANDLERS ---
  const linkPartner = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    if (!partnerEmail.trim()) return;
    try {
      setIsLinking(true);
      await axios.put('https://v26.onrender.com/api/auth/invite-partner', { myEmail, partnerEmail });
      alert("Invitation Transmitted Successfully!");
      setPartnerEmail('');
      fetchFeedAndProfile();
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
      fetchFeedAndProfile();
    } catch (err) { alert("Failed to accept mission."); }
  };

  // --- DISCOVER / BROADCAST HANDLERS ---
  const handleBroadcast = async () => {
    if (!broadcastText.trim() && selectedFiles.length === 0) return;
    const postData = {
      authorEmail: localStorage.getItem('v26UserEmail'),
      authorName: userProfile?.displayName || "Creator", 
      text: broadcastText,
      media: selectedFiles.length > 0 ? selectedFiles.map(f => URL.createObjectURL(f)) : null,
      visibility: visibility
    };
    try {
      const res = await axios.post('https://v26.onrender.com/api/posts/create', postData);
      setBroadcasts([res.data, ...broadcasts]);
      setBroadcastText('');
      setSelectedFiles([]); 
      alert("Broadcast posted cleanly!");
    } catch (err) { console.error(err); }
  };

  const handleInspire = async (postId: string) => {
    try {
      const token = localStorage.getItem("v26Token"); 
      if (!token) return alert("Please sign in to leave an inspirational footprint!");
      const res = await axios.post(`https://v26.onrender.com/api/posts/${postId}/inspire`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBroadcasts(prev => prev.map(post => {
        if (post._id === postId) {
          let updatedInspirations = post.inspirations ? [...post.inspirations] : [];
          res.data.hasInspired ? updatedInspirations.push("user") : updatedInspirations.pop();
          return { ...post, inspirations: updatedInspirations };
        }
        return post;
      }));
    } catch (err) { console.error(err); }
  };

  const handleDiscussSubmit = async (postId: string) => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const token = localStorage.getItem("v26Token");
      if (!token) return alert("Please sign in to contribute!");
      const response = await axios.post(`https://v26.onrender.com/api/posts/${postId}/discuss`, { 
        text: commentText, 
        userName: localStorage.getItem('v26UserEmail')?.split('@')[0] || "Creator" 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBroadcasts(prev => prev.map(post => post._id === postId ? { ...post, discussions: response.data.discussions } : post));
      setCommentText('');
    } catch (err) { console.error(err); } 
    finally { setSubmittingComment(false); }
  };

  const handleShareLink = (postId: string) => {
    const assetUrl = `${window.location.origin}/workspace#${postId}`;
    navigator.clipboard.writeText(assetUrl).then(() => alert("Link copied to clipboard!"));
  };

  // --- PROFILE UPDATE HANDLERS ---
  const handleUpdateIdentity = async () => {
    const email = localStorage.getItem('v26UserEmail');
    if (!newName.trim() || !email) return;
    setUpdatingProfile(true);
    try {
      await axios.put(`https://v26.onrender.com/api/auth/update-profile`, { email, displayName: newName });
      alert("Identity updated successfully!");
      fetchFeedAndProfile();
    } catch (err) {
      alert("Identity modification failed.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const ProgressCircle = ({ percent, label, color }: { percent: number; label: string; color: string }) => (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: '55px', height: '55px', margin: '0 auto' }}>
        <svg width="55" height="55" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="26" stroke="#18181b" strokeWidth="5" fill="none" />
          <circle cx="30" cy="30" r="26" stroke={color} strokeWidth="5" fill="none" 
            strokeDasharray={163} strokeDashoffset={163 - (163 * percent) / 100} 
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.65rem', fontWeight: '800', color: '#fff' }}>{percent}%</div>
      </div>
      <div style={{ marginTop: '6px', fontSize: '0.55rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    </div>
  );

  return (
    <div className="workspace-main-container">
      <div className="workspace-scrollable-content">
        
        {/* ======================= TAB 1: WORKSPACE ======================= */}
        {activeNavTab === 'workspace' && (
          <div style={{ maxWidth: '480px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', textAlign: 'center', letterSpacing: '-0.5px', margin: 0 }}>Command Center</h2>
            
            {/* Progress Rings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#0e0e11', padding: '16px 12px', borderRadius: '20px', border: '1px solid #18181b' }}>
              <ProgressCircle percent={calculateProgress('daily')} label="Daily" color="#6366f1" />
              <ProgressCircle percent={calculateProgress('weekly')} label="Weekly" color="#a855f7" />
              <ProgressCircle percent={calculateProgress('monthly')} label="Monthly" color="#22c55e" />
              <ProgressCircle percent={calculateProgress('yearly')} label="Yearly" color="#eab308" />
            </div>

            {/* Launch Goal Box */}
            <div style={{ padding: '20px', background: '#0e0e11', border: '1px solid #18181b', borderRadius: '20px' }}>
              <span className="section-mini-tag" style={{ color: '#6366f1' }}>Initialize Vision</span>
              <input value={newMission} onChange={(e) => setNewMission(e.target.value)} placeholder="What are we manifesting?" className="premium-text-input" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)} className="premium-select-dropdown">
                  <option value="daily">Daily</option> <option value="weekly">Weekly</option> <option value="monthly">Monthly</option> <option value="yearly">Yearly</option>
                </select>
                <button onClick={handleInitialize} className="premium-action-btn">Launch Target</button>
              </div>
            </div>

            {/* Broadcast Composer */}
            <div className="composer-card-box">
              <span className="section-mini-tag" style={{ color: '#a855f7', marginBottom: '10px' }}>Broadcast Progress</span>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
                {['private', 'partner', 'public'].map((mode) => (
                  <button key={mode} onClick={() => setVisibility(mode as any)} className={`mode-toggle-pill ${visibility === mode ? 'mp-active' : ''}`}>{mode}</button>
                ))}
              </div>
              <textarea value={broadcastText} onChange={(e) => setBroadcastText(e.target.value)} placeholder="Broadcast an insight, file snapshot or clip..." className="composer-textarea" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid #18181b', marginTop: '4px' }}>
                <label className="attach-media-label">
                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                  🎬 <span>Attach Project Media</span>
                </label>
                <button onClick={handleBroadcast} className="premium-action-btn" style={{ padding: '8px 20px', borderRadius: '10px' }}>Publish</button>
              </div>
            </div>

            {/* Partnership Token Bridge */}
            <div style={{ padding: '20px', background: '#0e0e11', borderRadius: '24px', border: '1px solid #18181b' }}>
              <span className="section-mini-tag" style={{ color: '#22c55e' }}>Transmit Connection Token</span>
              <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 16px 0', lineHeight: '1.4' }}>Open a secure data transmission bridge to an alliance partner.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="Partner Email address..." className="premium-text-input" style={{ marginBottom: 0 }} />
                <button onClick={linkPartner} disabled={isLinking} className="premium-action-btn" style={{ width: '100%' }}>{isLinking ? 'Transmitting...' : 'Send Signal'}</button>
              </div>
              <div className="pipeline-status-card" style={{ marginTop: '14px', background: '#09090b' }}>
                <span className="pipeline-dot" style={{ backgroundColor: userProfile?.partnerEmail ? '#22c55e' : '#52525b' }} />
                <span><strong>Bridge Pipeline:</strong> {userProfile?.partnerEmail ? `Live with ${userProfile.partnerEmail.split('@')[0]}` : 'Offline / Interrupted'}</span>
              </div>
            </div>

            {/* Missions List */}
            <div>
              <div className="timeframe-tab-row">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} className={`timeframe-tab ${activeTab === t ? 'tf-active' : ''}`}>{t}</button>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {missionsList.filter(item => item.timeframe === activeTab).length === 0 ? (
                  <p style={{ color: '#52525b', fontSize: '0.8rem', textAlign: 'center', marginTop: '10px' }}>No targets active in this timeframe.</p>
                ) : (
                  missionsList.filter(item => item.timeframe === activeTab).map((item) => (
                    <div key={item._id} onClick={() => togglePlanStatus(item._id, item.status)} className={`checklist-card ${item.status === 'completed' ? 'card-completed' : ''}`}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={`checkbox-box ${item.status === 'completed' ? 'cb-checked' : ''}`}>{item.status === 'completed' && "✓"}</div>
                        <span className="checklist-text">{item.title}</span>
                      </div>
                      <button onClick={(e) => handleDeleteMission(item._id, e)} className="card-trash-btn">🗑️</button>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* ======================= TAB 2: SIGNALS ======================= */}
        {activeNavTab === 'signals' && (
          <div style={{ maxWidth: '440px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#fff', fontWeight: '900', letterSpacing: '-0.5px', margin: 0 }}>Network Signals</h2>
            
            {userProfile?.incomingRequest ? (
              <div style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.04)', borderRadius: '20px', border: '1px solid #6366f1' }}>
                <p style={{ fontSize: '0.85rem', color: '#e4e4e7', margin: '0 0 16px 0', lineHeight: '1.5' }}>📩 Incoming alliance request from:<br/><strong style={{ color: '#818cf8' }}>{userProfile.incomingRequest}</strong></p>
                <button onClick={acceptMission} className="premium-action-btn" style={{ width: '100%' }}>Accept & Form Alliance</button>
              </div>
            ) : (
              <div className="status-update-banner">
                <span style={{ fontWeight: '800', color: '#fff', fontSize: '0.8rem' }}>⚡ Operational Update</span>
                <p style={{ margin: '4px 0 0 0', color: '#71717a' }}>Core synchronized. No incoming alliance handshakes detected.</p>
              </div>
            )}

            <div style={{ padding: '20px', background: '#0e0e11', borderRadius: '24px', border: '1px solid #18181b' }}>
              <span className="section-mini-tag" style={{ color: '#22c55e' }}>Alliance Bridge Connection</span>
              <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 16px 0', lineHeight: '1.4' }}>Partner with an ally to share progress signals directly.</p>
              <input value={partnerEmail} onChange={(e) => setPartnerEmail(e.target.value)} placeholder="Partner Email address..." className="premium-text-input" />
              <button onClick={linkPartner} disabled={isLinking} className="premium-action-btn" style={{ width: '100%' }}>{isLinking ? 'Transmitting...' : 'Send Signal'}</button>
            </div>
          </div>
        )}

        {/* ======================= TAB 3: DISCOVER ======================= */}
        {activeNavTab === 'discover' && (
          <div className="premium-discover-layout">
            <aside className="discover-aside-panel">
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '900', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Discover</h3>
                <p style={{ color: '#71717a', fontSize: '0.75rem', lineHeight: '1.4', margin: 0 }}>Perceive public progress streams shared along the networks.</p>
              </div>
              <div className="filter-button-stack">
                <span style={{ fontSize: '0.6rem', color: '#52525b', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', paddingLeft: '8px' }}>Talent Spheres</span>
                {talentCategories.map((cat) => (
                  <button key={cat.id} onClick={() => setActiveFilter(cat.id)} className={`filter-link-btn ${activeFilter === cat.id ? 'fl-active' : ''}`}>{cat.label}</button>
                ))}
              </div>
            </aside>

            <main className="discover-feed-stream">
              {loadingFeed ? (
                <div style={{ color: '#52525b', fontSize: '0.85rem', textAlign: 'center', padding: '40px', fontWeight: '600' }}>Synchronizing broadcast streams...</div>
              ) : broadcasts.length === 0 ? (
                <p style={{ color: '#52525b', fontSize: '0.8rem', textAlign: 'center', paddingTop: '40px' }}>No active streams found inside this sphere.</p>
              ) : (
                broadcasts.map((post) => (
                  <article key={post._id} id={post._id} className="timeline-post-card">
                    <div className="post-header">
                      <div className="post-avatar">{(post.authorEmail || 'C')[0].toUpperCase()}</div>
                      <div>
                        <h4 className="post-author-name">{post.authorName || post.authorEmail.split('@')[0]}</h4>
                        <span className="post-timestamp">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="visibility-badge-tag">{post.visibility}</span>
                    </div>
                    <p className="post-main-text">{post.text}</p>
                    
                    {post.media && post.media.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: post.media.length > 1 ? '1fr 1fr' : '1fr', gap: '8px', marginBottom: '14px', borderRadius: '12px', overflow: 'hidden' }}>
                        {post.media.map((img, i) => (
                          <img key={i} src={img.startsWith('http') ? img : `https://v26.onrender.com${img}`} alt="broadcast asset" style={{ width: '100%', maxHeight: '280px', objectFit: 'cover' }} />
                        ))}
                      </div>
                    )}

                    <div className="post-action-toolbar">
                      <button onClick={() => handleInspire(post._id)} className="toolbar-btn inspire-clr">⚡ <span>{post.inspirations ? post.inspirations.length : 0} Inspire</span></button>
                      <button onClick={() => setActiveDiscussionPostId(activeDiscussionPostId === post._id ? null : post._id)} className={`toolbar-btn discuss-clr ${activeDiscussionPostId === post._id ? 'tb-open' : ''}`}>💬 <span>{post.discussions ? post.discussions.length : 0} Discuss</span></button>
                      <button onClick={() => handleShareLink(post._id)} className="toolbar-btn share-clr" style={{ marginLeft: 'auto' }}>🔗 Share</button>
                    </div>

                    {activeDiscussionPostId === post._id && (
                      <div className="discussion-drawer-panel">
                        <div className="discussion-messages-scroller">
                          {post.discussions && post.discussions.length > 0 ? post.discussions.map(disc => (
                            <div key={disc._id} className="comment-bubble">
                              <span className="comment-author">{disc.userName}</span>
                              <p style={{ margin: 0, color: '#e4e4e7' }}>{disc.text}</p>
                            </div>
                          )) : <p style={{ fontSize: '0.75rem', color: '#52525b', margin: 0 }}>Silence implies observation. Drop a perspective below.</p>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Contribute depth..." className="comment-input-field" />
                          <button onClick={() => handleDiscussSubmit(post._id)} disabled={submittingComment} className="comment-submit-btn">Send</button>
                        </div>
                      </div>
                    )}
                  </article>
                ))
              )}
            </main>
          </div>
        )}

        {/* ======================= TAB 4: PROFILE ======================= */}
        {activeNavTab === 'profile' && (
          <div style={{ maxWidth: '440px', margin: '0 auto', padding: '40px 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#fff', letterSpacing: '-0.5px', margin: 0 }}>Profile Configuration</h2>
            
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
              <p style={{ fontSize: '0.75rem', color: '#71717a', margin: '0 0 16px 0', lineHeight: '1.4' }}>Update your visible identifier broadcast token displayed across streams.</p>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter display alias..." className="premium-text-input" />
              <button onClick={handleUpdateIdentity} disabled={updatingProfile} className="premium-action-btn" style={{ width: '100%' }}>
                {updatingProfile ? 'Saving Configuration...' : 'Update Identity'}
              </button>
            </div>

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

            <button onClick={handleLogout} className="logout-trigger-btn">Disconnect Session (Logout)</button>
          </div>
        )}

      </div>

      {/* 📱 UNIFIED 4-TAB ZERO-RELOAD FOOTER NAVBAR */}
      <footer className="native-app-bottom-bar four-column-grid">
        <button onClick={() => setActiveNavTab('workspace')} className={`nav-icon-tab ${activeNavTab === 'workspace' ? 'tab-active' : ''}`}>
          <span className="tab-emoji">制造</span> <span className="tab-label-text">Workspace</span>
        </button>
        <button onClick={() => setActiveNavTab('signals')} className={`nav-icon-tab ${activeNavTab === 'signals' ? 'tab-active' : ''}`}>
          <span className="tab-emoji" style={{ position: 'relative' }}>连 {userProfile?.incomingRequest && <span className="notification-ping-dot" />}</span> 
          <span className="tab-label-text">Signals</span>
        </button>
        <button onClick={() => setActiveNavTab('discover')} className={`nav-icon-tab ${activeNavTab === 'discover' ? 'tab-active' : ''}`}>
          <span className="tab-emoji">界</span> <span className="tab-label-text">Discover</span>
        </button>
        <button onClick={() => setActiveNavTab('profile')} className={`nav-icon-tab ${activeNavTab === 'profile' ? 'tab-active' : ''}`}>
          <span className="tab-emoji">己</span> <span className="tab-label-text">Profile</span>
        </button>
      </footer>

      <style jsx global>{`
        .workspace-main-container { background-color: #09090b; color: #fafafa; height: 100vh; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .workspace-scrollable-content { flex: 1; overflow-y: auto; padding-bottom: 95px; }
        .section-mini-tag { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }

        .premium-text-input { width: 100%; background: #141416; border: 1px solid #18181b; border-radius: 12px; padding: 14px 16px; font-size: 0.85rem; color: #fff; outline: none; box-sizing: border-box; margin-bottom: 12px; transition: all 0.2s; }
        .premium-text-input:focus { border-color: #27272a; background: #18181b; }
        .premium-select-dropdown { background: #141416; color: #a1a1aa; border: 1px solid #18181b; border-radius: 12px; padding: 0 16px; font-size: 0.8rem; font-weight: 600; outline: none; cursor: pointer; }

        .premium-action-btn { background: #fff; color: #000; font-weight: 700; font-size: 0.85rem; padding: 12px 24px; border: none; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .premium-action-btn:hover { background: #e4e4e7; transform: scale(0.99); }
        .premium-action-btn:disabled { background: #18181b; color: #52525b; cursor: not-allowed; }

        .timeframe-tab-row { display: flex; gap: 6px; background: #0e0e11; padding: 4px; border-radius: 12px; border: 1px solid #18181b; margin-bottom: 16px; }
        .timeframe-tab { flex: 1; padding: 10px 4px; border-radius: 8px; border: none; background: transparent; color: #71717a; cursor: pointer; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; transition: 0.2s; }
        .tf-active { background: #18181b; color: #fff !important; }

        .checklist-card { padding: 16px; background: #0e0e11; border: 1px solid #18181b; border-radius: 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s ease; }
        .checklist-card:hover { border-color: #27272a; background: #141416; }
        .card-completed { opacity: 0.5; border-color: rgba(99, 102, 241, 0.15); }
        .checkbox-box { width: 18px; height: 18px; border: 2px solid #27272a; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 900; color: #fff; }
        .cb-checked { background: #6366f1; border-color: #6366f1; }
        .checklist-text { font-size: 0.9rem; font-weight: 500; }
        .card-trash-btn { background: transparent; border: none; cursor: pointer; opacity: 0.3; }
        .checklist-card:hover .card-trash-btn { opacity: 1; }

        .status-update-banner { padding: 16px; background: #0e0e11; border: 1px solid #18181b; border-radius: 16px; font-size: 0.8rem; line-height: 1.4; }
        .pipeline-status-card { padding: 14px 16px; background: #0e0e11; border-radius: 14px; border: 1px solid #18181b; font-size: 0.75rem; color: #a1a1aa; display: flex; align-items: center; gap: 10px; }
        .pipeline-dot { width: 6px; height: 6px; border-radius: 50%; }
        
        .logout-trigger-btn { width: 100%; margin-top: 12px; padding: 14px; background: transparent; border: 1px solid #18181b; color: #f87171; border-radius: 12px; font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all 0.2s; }
        .logout-trigger-btn:hover { background: rgba(239, 68, 68, 0.02); border-color: #f87171; }

        .composer-card-box { padding: 20px; background: #0e0e11; border: 1px solid #18181b; border-radius: 24px; }
        .mode-toggle-pill { padding: 4px 12px; font-size: 0.6rem; font-weight: 700; text-transform: uppercase; border-radius: 20px; background: transparent; color: #52525b; border: 1px solid #18181b; cursor: pointer; margin-right: 4px; }
        .mp-active { background: #6366f1 !important; color: #fff !important; border-color: #6366f1 !important; }
        .composer-textarea { width: 100%; height: 70px; padding: 8px 0; background: transparent; color: #fff; border: none; box-sizing: border-box; resize: none; font-size: 0.9rem; outline: none; }
        .attach-media-label { cursor: pointer; color: #71717a; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 6px; }

        .premium-discover-layout { max-width: 900px; margin: 0 auto; display: flex; flex-direction: row; gap: 32px; padding: 40px 20px; }
        .discover-aside-panel { width: 240px; position: sticky; top: 40px; height: fit-content; }
        .discover-feed-stream { flex: 1; display: flex; flex-direction: column; gap: 20px; }
        .filter-button-stack { display: flex; flex-direction: column; gap: 4px; background: #0e0e11; padding: 12px; border-radius: 20px; border: 1px solid #18181b; }
        .filter-link-btn { width: 100%; text-align: left; padding: 10px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 500; background: transparent; color: #71717a; border: none; cursor: pointer; }
        .fl-active { background: rgba(99, 102, 241, 0.08) !important; color: #818cf8 !important; font-weight: 700 !important; }

        .timeline-post-card { background: #0e0e11; border: 1px solid #18181b; border-radius: 24px; padding: 24px; }
        .post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; position: relative; }
        .post-avatar { width: 38px; height: 38px; border-radius: 12px; background: #141416; border: 1px solid #27272a; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; }
        .post-author-name { font-size: 0.9rem; font-weight: 700; margin: 0 0 2px 0; }
        .post-timestamp { font-size: 0.75rem; color: #52525b; display: block; }
        .visibility-badge-tag { position: absolute; right: 0; top: 8px; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; background: #141416; border: 1px solid #18181b; padding: 3px 8px; border-radius: 6px; color: #71717a; }
        .post-main-text { font-size: 0.95rem; color: #e4e4e7; line-height: 1.55; margin: 0 0 14px 0; white-space: pre-wrap; }

        .post-action-toolbar { display: flex; gap: 20px; border-top: 1px solid #18181b; padding-top: 12px; }
        .toolbar-btn { background: transparent; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; }
        .inspire-clr { color: #eab308; }
        .discuss-clr { color: #71717a; }
        .tb-open { color: #6366f1 !important; }
        .share-clr { color: #52525b; }

        .discussion-drawer-panel { background: #09090b; border-radius: 16px; padding: 14px; margin-top: 14px; border: 1px solid #18181b; }
        .discussion-messages-scroller { display: flex; flex-direction: column; gap: 8px; max-height: 160px; overflow-y: auto; }
        .comment-bubble { background: #0e0e11; padding: 10px 12px; border-radius: 12px; font-size: 0.85rem; border: 1px solid #18181b; }
        .comment-author { font-size: 0.75rem; font-weight: 700; color: #818cf8; display: block; margin-bottom: 2px; }
        .comment-input-field { flex: 1; background: #0e0e11; border: 1px solid #18181b; border-radius: 8px; padding: 10px; font-size: 0.8rem; color: #fff; outline: none; }
        .comment-submit-btn { background: #fff; color: #000; font-weight: 700; border: none; border-radius: 8px; padding: 0 14px; font-size: 0.8rem; cursor: pointer; }

        /* Unified Bottom Bar */
        .native-app-bottom-bar { position: fixed; bottom: 0; left: 0; width: 100%; height: 65px; background: rgba(11, 11, 13, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid #18181b; display: grid; align-items: center; z-index: 1000; }
        .four-column-grid { grid-template-columns: repeat(4, 1fr) !important; }
        .nav-icon-tab { background: transparent; border: none; color: #52525b; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; height: 100%; justify-content: center; transition: color 0.2s ease; }
        .tab-emoji { font-size: 0.95rem; font-weight: 800; }
        .tab-label-text { font-size: 0.55rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .tab-active { color: #fff !important; }
        .notification-ping-dot { position: absolute; top: 1px; right: -5px; width: 5px; height: 5px; background: #6366f1; border-radius: 50%; box-shadow: 0 0 6px #6366f1; }
        
        @media (max-width: 850px) {
          .premium-discover-layout { flex-direction: column !important; gap: 24px; padding: 20px; }
          .discover-aside-panel { width: 100% !important; position: relative !important; top: 0 !important; }
          .filter-button-stack { display: grid !important; grid-template-columns: 1fr 1fr; gap: 6px; }
        }
      `}</style>
    </div>
  );
}