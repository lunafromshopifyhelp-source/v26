'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';

interface UserProfile {
  email?: string;
  displayName?: string; 
  partnerEmail?: string;
  partnerStatus?: 'none' | 'pending' | 'active';
  incomingRequest?: string;
  visionRank?: number;
}

interface MissionItem {
  _id: string;
  title: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'active' | 'completed';
}

export default function MobileWorkspaceDeck() {
  const router = useRouter();

  // Mobile Sub-Page Navigation State
  const [activeRoom, setActiveRoom] = useState<'directives' | 'studio' | 'alliance'>('directives');

  // Core Data States
  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [newMission, setNewMission] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Mentorship & Alliance State
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Studio Log & Media
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [broadcastText, setBroadcastText] = useState('');
  const [workDomain, setWorkDomain] = useState<'Music Architecture' | 'Enterprise' | 'Systems Dev' | 'Visual Design'>('Music Architecture');
  const [visibility, setVisibility] = useState<'private' | 'partner' | 'public'>('partner');

  const fetchMissions = async () => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/missions/my-missions/${email}`);
      setMissionsList(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  const fetchProfile = async () => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
      setUserProfile(res.data);
    } catch (err) { 
      console.error(err); 
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchMissions();
  }, []);

  const handleInitialize = async () => {
    if (!newMission.trim()) return;
    const email = localStorage.getItem('v26UserEmail');
    try {
      await axios.post('https://v26.onrender.com/api/missions/create-mission', {
        creatorEmail: email,
        title: `[${workDomain}] ${newMission}`,
        timeframe: timeframe
      });
      setNewMission(""); 
      fetchMissions(); 
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete this target milestone?")) return;
    try {
      await axios.delete(`https://v26.onrender.com/api/missions/delete/${id}`);
      setMissionsList(prev => prev.filter(m => m._id !== id));
    } catch (err) { 
      console.error(err); 
    }
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

  const calculateProgress = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const filtered = missionsList.filter(m => m.timeframe === type);
    if (filtered.length === 0) return 0;
    return Math.round((filtered.filter(m => m.status === 'completed').length / filtered.length) * 100);
  };

  const linkPartner = async () => {
    const myEmail = localStorage.getItem('v26UserEmail');
    if (!partnerEmail.trim()) return;
    try {
      setIsLinking(true);
      await axios.put('https://v26.onrender.com/api/auth/invite-partner', { myEmail, partnerEmail });
      alert("Mentorship Bridge Request Transmitted!");
      setPartnerEmail('');
      fetchProfile();
    } catch (err) { 
      alert("Mentor frequency address not found."); 
    } finally { 
      setIsLinking(false); 
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastText.trim() && selectedFiles.length === 0) return;
    const postData = {
      authorEmail: localStorage.getItem('v26UserEmail'),
      authorName: userProfile?.displayName || "Creator", 
      text: `[${workDomain}] ${broadcastText}`,
      media: selectedFiles.length > 0 ? selectedFiles.map(f => URL.createObjectURL(f)) : null,
      visibility: visibility
    };
    try {
      await axios.post('https://v26.onrender.com/api/posts/create', postData);
      setBroadcastText('');
      setSelectedFiles([]); 
      alert("Work milestone committed to studio log!");
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div className="mob-deck-root">
      
      {/* 1. APP HEADER */}
      <header className="mob-deck-header">
        <div>
          <span className="mob-subtag">v26 // WORKSPACE</span>
          <h1 className="mob-title">Production Deck</h1>
        </div>
        <div className="mob-mentor-pill" onClick={() => setActiveRoom('alliance')}>
          <span className={`mob-dot ${userProfile?.partnerEmail ? 'dot-active' : ''}`} />
          <span>{userProfile?.partnerEmail ? 'Mentor Sync' : 'Solo'}</span>
        </div>
      </header>

      {/* 2. SUB-PAGE ROOM TOGGLE (Mobile Native Segmented Control) */}
      <nav className="mob-segmented-nav">
        <button 
          onClick={() => setActiveRoom('directives')} 
          className={`mob-seg-tab ${activeRoom === 'directives' ? 'seg-active' : ''}`}
        >
          <span>🎯</span> Directives
        </button>
        <button 
          onClick={() => setActiveRoom('studio')} 
          className={`mob-seg-tab ${activeRoom === 'studio' ? 'seg-active' : ''}`}
        >
          <span>🎛️</span> Studio Log
        </button>
        <button 
          onClick={() => setActiveRoom('alliance')} 
          className={`mob-seg-tab ${activeRoom === 'alliance' ? 'seg-active' : ''}`}
        >
          <span>🤝</span> Mentorship
        </button>
      </nav>

      {/* DOMAIN SELECTION CHIPS */}
      <div className="mob-domain-strip">
        {(['Music Architecture', 'Enterprise', 'Systems Dev', 'Visual Design'] as const).map(domain => (
          <button 
            key={domain} 
            onClick={() => setWorkDomain(domain)} 
            className={`mob-domain-pill ${workDomain === domain ? 'pill-active' : ''}`}
          >
            {domain}
          </button>
        ))}
      </div>

      {/* MAIN VIEW AREA */}
      <main className="mob-body-scrollable">

        {/* ======================= SUB-ROOM 1: DIRECTIVES & TARGETS ======================= */}
        {activeRoom === 'directives' && (
          <div className="mob-room-content">
            {/* Velocity Gauges */}
            <div className="mob-gauges-row">
              {[
                { label: 'Daily', pct: calculateProgress('daily'), color: '#6366f1' },
                { label: 'Weekly', pct: calculateProgress('weekly'), color: '#8b5cf6' },
                { label: 'Monthly', pct: calculateProgress('monthly'), color: '#22c55e' },
                { label: 'Horizon', pct: calculateProgress('yearly'), color: '#eab308' },
              ].map(g => (
                <div key={g.label} className="mob-gauge-chip">
                  <span className="mob-gauge-pct" style={{ color: g.color }}>{g.pct}%</span>
                  <span className="mob-gauge-title">{g.label}</span>
                </div>
              ))}
            </div>

            {/* Launch Goal Mini-Card */}
            <div className="mob-card">
              <span className="mob-kicker">ADD NEW DIRECTIVE</span>
              <input 
                value={newMission} 
                onChange={(e) => setNewMission(e.target.value)} 
                placeholder={`Milestone for ${workDomain}...`} 
                className="mob-input" 
              />
              <div className="mob-form-row">
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)} 
                  className="mob-select"
                >
                  <option value="daily">Daily Target</option>
                  <option value="weekly">Weekly Target</option>
                  <option value="monthly">Monthly Milestone</option>
                  <option value="yearly">Horizon Target</option>
                </select>
                <button onClick={handleInitialize} className="mob-cta-btn">
                  Launch
                </button>
              </div>
            </div>

            {/* Timeframe Scope Selector */}
            <div className="mob-time-selector">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)} 
                  className={`mob-time-btn ${activeTab === t ? 'time-active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Task List */}
            <div className="mob-tasks-stream">
              {missionsList.filter(item => item.timeframe === activeTab).length === 0 ? (
                <div className="mob-empty-state">
                  No {activeTab} directives recorded. Launch one above for mentor review.
                </div>
              ) : (
                missionsList.filter(item => item.timeframe === activeTab).map((item) => (
                  <div 
                    key={item._id} 
                    onClick={() => togglePlanStatus(item._id, item.status)} 
                    className={`mob-task-row ${item.status === 'completed' ? 'task-done' : ''}`}
                  >
                    <div className="mob-task-left">
                      <div className={`mob-check-bubble ${item.status === 'completed' ? 'bubble-done' : ''}`}>
                        {item.status === 'completed' && "✓"}
                      </div>
                      <span className="mob-task-text">{item.title}</span>
                    </div>
                    <button onClick={(e) => handleDeleteMission(item._id, e)} className="mob-trash-btn">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ======================= SUB-ROOM 2: STUDIO WORK LOG ======================= */}
        {activeRoom === 'studio' && (
          <div className="mob-room-content">
            <div className="mob-card">
              <div className="mob-card-head">
                <span className="mob-kicker">STUDIO ARTIFACT TRANSMISSION</span>
                <div className="mob-scope-pills">
                  {['private', 'partner', 'public'].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setVisibility(m as any)} 
                      className={`mob-scope-btn ${visibility === m ? 'scope-active' : ''}`}
                    >
                      {m === 'partner' ? 'Mentor' : m}
                    </button>
                  ))}
                </div>
              </div>

              <textarea 
                value={broadcastText} 
                onChange={(e) => setBroadcastText(e.target.value)} 
                placeholder={`Describe session progress for ${workDomain} (e.g., Mixed vocal leads, completed business pitch deck slide 5)...`} 
                className="mob-textarea" 
              />

              <div className="mob-studio-action-row">
                <label className="mob-file-cta">
                  <input 
                    type="file" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} 
                  />
                  📁 <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Upload Stems / Media'}</span>
                </label>
                <button onClick={handleBroadcast} className="mob-cta-btn">
                  Commit
                </button>
              </div>
            </div>

            <div className="mob-info-banner">
              <span className="mob-info-icon">💡</span>
              <p className="mob-info-text">
                Artifacts shared in "Mentor" mode only transmit down your verified alliance pipeline. Public commits display onto the global Matrix stream.
              </p>
            </div>
          </div>
        )}

        {/* ======================= SUB-ROOM 3: MENTORSHIP & ALLIANCE ======================= */}
        {activeRoom === 'alliance' && (
          <div className="mob-room-content">
            <div className="mob-card">
              <span className="mob-kicker">ACTIVE MENTORSHIP PIPELINE</span>

              {userProfile?.partnerEmail ? (
                <div className="mob-mentor-box">
                  <div className="mob-mentor-avatar">
                    {userProfile.partnerEmail[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="mob-mentor-meta">VERIFIED ALLIANCE BRIDGE</span>
                    <h3 className="mob-mentor-email">{userProfile.partnerEmail}</h3>
                    <p className="mob-mentor-hint">
                      Dual-sync active: Your directives and studio logs are viewable by your mentor.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mob-unlinked-box">
                  <p className="mob-unlinked-text">
                    Invite an entrepreneur, veteran music producer, or industry leader to review your progression.
                  </p>
                  <input 
                    value={partnerEmail} 
                    onChange={(e) => setPartnerEmail(e.target.value)} 
                    placeholder="Mentor email address..." 
                    className="mob-input" 
                  />
                  <button onClick={linkPartner} disabled={isLinking} className="mob-cta-btn mob-btn-full">
                    {isLinking ? 'Transmitting Bridge Request...' : 'Send Mentorship Invitation'}
                  </button>
                </div>
              )}
            </div>

            <div className="mob-card">
              <span className="mob-kicker">ACCOUNT SECURITY STATUS</span>
              <div className="mob-status-list">
                <div className="mob-status-item">
                  <span>Cryptographic Channel</span>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>Level 1 Active</span>
                </div>
                <div className="mob-status-item">
                  <span>Autonomous Rank</span>
                  <span style={{ color: '#818cf8', fontWeight: 700 }}>Creator Tier</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 📱 PERSISTENT UNIFIED BOTTOM NAV */}
      <BottomNav hasNotification={!!userProfile?.incomingRequest} />

      <style jsx global>{`
        .mob-deck-root {
          background-color: #08080a;
          min-height: 100vh;
          color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.01em;
        }

        /* Top Header */
        .mob-deck-header {
          position: sticky;
          top: 0;
          background: rgba(8, 8, 10, 0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px 8px 16px;
        }
        .mob-subtag {
          font-size: 0.55rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #818cf8;
          font-family: monospace;
          display: block;
        }
        .mob-title {
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin: 2px 0 0 0;
          color: #fff;
        }
        .mob-mentor-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #121217;
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.68rem;
          font-weight: 700;
          cursor: pointer;
        }
        .mob-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #52525b;
        }
        .dot-active { background: #22c55e; box-shadow: 0 0 6px #22c55e; }

        /* Segmented Room Control */
        .mob-segmented-nav {
          display: flex;
          gap: 4px;
          margin: 6px 14px 10px 14px;
          background: #111116;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 3px;
          border-radius: 12px;
        }
        .mob-seg-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          background: transparent;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          color: #71717a;
          font-size: 0.74rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .seg-active {
          background: #1c1c24;
          color: #fff !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        /* Domain Selector Strip */
        .mob-domain-strip {
          display: flex;
          gap: 6px;
          padding: 0 14px 10px 14px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .mob-domain-strip::-webkit-scrollbar { display: none; }
        .mob-domain-pill {
          background: #0e0e12;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #71717a;
          padding: 4px 10px;
          border-radius: 16px;
          font-size: 0.68rem;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
        }
        .pill-active {
          background: #1e1b4b;
          border-color: #6366f1;
          color: #c7d2fe;
          font-weight: 700;
        }

        /* Main Body */
        .mob-body-scrollable {
          padding: 0 14px 95px 14px;
          max-width: 520px;
          margin: 0 auto;
        }
        .mob-room-content { display: flex; flex-direction: column; gap: 12px; }

        /* Gauges Row */
        .mob-gauges-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
          padding: 12px 6px;
          text-align: center;
        }
        .mob-gauge-chip { display: flex; flex-direction: column; align-items: center; }
        .mob-gauge-pct { font-size: 0.95rem; font-weight: 900; font-family: monospace; }
        .mob-gauge-title { font-size: 0.58rem; font-weight: 800; color: #71717a; text-transform: uppercase; margin-top: 2px; }

        /* Mobile Cards */
        .mob-card {
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 16px;
        }
        .mob-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .mob-kicker {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #818cf8;
          font-family: monospace;
          display: block;
          margin-bottom: 8px;
        }

        /* Inputs & Form Controls */
        .mob-input {
          width: 100%;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: #fff;
          font-size: 0.82rem;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 8px;
        }
        .mob-form-row { display: flex; gap: 8px; }
        .mob-select {
          flex: 1;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0 10px;
          color: #a1a1aa;
          font-size: 0.78rem;
          font-weight: 600;
          outline: none;
        }
        .mob-cta-btn {
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .mob-btn-full { width: 100%; margin-top: 6px; }

        /* Time Selector */
        .mob-time-selector {
          display: flex;
          gap: 4px;
          background: #121217;
          padding: 3px;
          border-radius: 10px;
        }
        .mob-time-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 6px 0;
          border-radius: 6px;
          text-transform: capitalize;
          cursor: pointer;
        }
        .time-active {
          background: #1c1c26;
          color: #fff;
        }

        /* Tasks Stream */
        .mob-tasks-stream { display: flex; flex-direction: column; gap: 6px; }
        .mob-task-row {
          background: #121217;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .task-done { opacity: 0.45; }
        .mob-task-left { display: flex; align-items: center; gap: 10px; }
        .mob-check-bubble {
          width: 18px;
          height: 18px;
          border: 2px solid #3f3f46;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 900;
          color: #fff;
        }
        .bubble-done { background: #6366f1; border-color: #6366f1; }
        .mob-task-text { font-size: 0.82rem; font-weight: 600; color: #f4f4f5; }
        .mob-trash-btn { background: transparent; border: none; color: #71717a; cursor: pointer; }
        .mob-empty-state { text-align: center; color: #52525b; font-size: 0.78rem; padding: 24px 10px; }

        /* Studio Specific */
        .mob-scope-pills { display: flex; gap: 4px; }
        .mob-scope-btn {
          background: #181822;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #71717a;
          font-size: 0.62rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
        }
        .scope-active { background: #6366f1; color: #fff; border-color: #6366f1; }
        .mob-textarea {
          width: 100%;
          height: 90px;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: #fff;
          font-size: 0.82rem;
          outline: none;
          box-sizing: border-box;
          resize: none;
        }
        .mob-studio-action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .mob-file-cta { color: #818cf8; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
        .mob-info-banner {
          display: flex;
          gap: 10px;
          background: rgba(99, 102, 241, 0.05);
          border: 1px solid rgba(99, 102, 241, 0.15);
          border-radius: 14px;
          padding: 12px;
        }
        .mob-info-icon { font-size: 1.1rem; }
        .mob-info-text { font-size: 0.75rem; color: #a1a1aa; margin: 0; line-height: 1.4; }

        /* Mentor Specific */
        .mob-mentor-box { display: flex; gap: 12px; align-items: center; }
        .mob-mentor-avatar {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.1rem;
          color: #fff;
          flex-shrink: 0;
        }
        .mob-mentor-meta { font-size: 0.58rem; font-weight: 800; color: #818cf8; font-family: monospace; }
        .mob-mentor-email { font-size: 0.88rem; margin: 2px 0 0 0; color: #fff; }
        .mob-mentor-hint { font-size: 0.72rem; color: #71717a; margin: 4px 0 0 0; }
        .mob-unlinked-text { font-size: 0.8rem; color: #a1a1aa; line-height: 1.4; margin: 0 0 10px 0; }
        .mob-status-list { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
        .mob-status-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: #a1a1aa;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }
      `}</style>
    </div>
  );
}