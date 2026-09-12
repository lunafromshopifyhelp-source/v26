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

export default function WorkspaceExecutiveConsole() {
  const router = useRouter();

  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [newMission, setNewMission] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Mentorship & Alliance State
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Studio Work Log / Broadcast
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [broadcastText, setBroadcastText] = useState('');
  const [workDomain, setWorkDomain] = useState<'Enterprise' | 'Music Architecture' | 'Systems Dev' | 'Visual Design'>('Music Architecture');
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
    if (!window.confirm("Purge this operational target?")) return;
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
      alert("Mentor account frequency not detected."); 
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
      alert("Work milestone logged to active stream!");
    } catch (err) { 
      console.error(err); 
    }
  };

  return (
    <div className="ws-deck-root">
      
      {/* 1. EXECUTIVE WORKSPACE HEADER */}
      <header className="ws-top-banner">
        <div className="ws-header-left">
          <span className="ws-suite-tag">V26 // WORKSPACE SUITE</span>
          <h1 className="ws-suite-title">Mentorship & Execution Deck</h1>
        </div>
        <div className="ws-active-badge">
          <span className="ws-status-dot" />
          <span>LIVE STUDIO</span>
        </div>
      </header>

      <div className="ws-main-scrollable">

        {/* 2. MENTORSHIP ALLIANCE PIPELINE CARD */}
        <section className="ws-mentor-card">
          <div className="ws-card-header-row">
            <span className="ws-section-kicker">DIRECT MENTORSHIP PIPELINE</span>
            <span className="ws-badge-pill">
              {userProfile?.partnerEmail ? 'ALLIANCE LINKED' : 'SOLO WORKSPACE'}
            </span>
          </div>

          {userProfile?.partnerEmail ? (
            <div className="ws-active-mentor-row">
              <div className="ws-mentor-avatar">
                {userProfile.partnerEmail[0].toUpperCase()}
              </div>
              <div className="ws-mentor-details">
                <span className="ws-mentor-label">Assigned Mentor / Collaborator</span>
                <span className="ws-mentor-name">{userProfile.partnerEmail}</span>
                <span className="ws-mentor-note">Direct review enabled: Targets & progress sync directly to this bridge.</span>
              </div>
            </div>
          ) : (
            <div className="ws-unlinked-mentor-box">
              <p className="ws-unlinked-desc">
                Connect with an industry mentor or collaborator (Music, Enterprise, Architecture) to unlock dual review on your goals.
              </p>
              <div className="ws-input-action-row">
                <input 
                  value={partnerEmail} 
                  onChange={(e) => setPartnerEmail(e.target.value)} 
                  placeholder="Enter Mentor / Partner Email..." 
                  className="ws-input-field" 
                />
                <button onClick={linkPartner} disabled={isLinking} className="ws-primary-btn">
                  {isLinking ? 'Linking...' : 'Invite Mentor'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. STUDIO DOMAIN SELECTION */}
        <div className="ws-domain-selector">
          <span className="ws-domain-label">ACTIVE DOMAIN:</span>
          {(['Music Architecture', 'Enterprise', 'Systems Dev', 'Visual Design'] as const).map(domain => (
            <button 
              key={domain} 
              onClick={() => setWorkDomain(domain)}
              className={`ws-domain-chip ${workDomain === domain ? 'chip-active' : ''}`}
            >
              {domain}
            </button>
          ))}
        </div>

        {/* 4. VELOCITY GAUGES */}
        <div className="ws-gauges-grid">
          {[
            { key: 'daily', label: 'Daily Goals', pct: calculateProgress('daily'), color: '#6366f1' },
            { key: 'weekly', label: 'Weekly Targets', pct: calculateProgress('weekly'), color: '#8b5cf6' },
            { key: 'monthly', label: 'Monthly Milestones', pct: calculateProgress('monthly'), color: '#22c55e' },
            { key: 'yearly', label: 'Vision Horizon', pct: calculateProgress('yearly'), color: '#eab308' },
          ].map(gauge => (
            <div key={gauge.key} className="ws-gauge-item">
              <div className="ws-ring-wrapper">
                <svg width="50" height="50" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r="25" stroke="#181820" strokeWidth="5" fill="none" />
                  <circle 
                    cx="30" cy="30" r="25" stroke={gauge.color} strokeWidth="5" fill="none" 
                    strokeDasharray={157} strokeDashoffset={157 - (157 * gauge.pct) / 100} 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="ws-ring-text">{gauge.pct}%</span>
              </div>
              <span className="ws-gauge-label">{gauge.label}</span>
            </div>
          ))}
        </div>

        {/* 5. WORK EXECUTION STUDIO / LOGS */}
        <section className="ws-card">
          <div className="ws-card-header-row">
            <span className="ws-section-kicker">STUDIO WORK LOG & ARTIFACTS</span>
            <div className="ws-visibility-pills">
              {['private', 'partner', 'public'].map((mode) => (
                <button 
                  key={mode} 
                  onClick={() => setVisibility(mode as any)} 
                  className={`ws-mode-btn ${visibility === mode ? 'mode-active' : ''}`}
                >
                  {mode === 'partner' ? 'Mentor Only' : mode}
                </button>
              ))}
            </div>
          </div>
          
          <textarea 
            value={broadcastText} 
            onChange={(e) => setBroadcastText(e.target.value)} 
            placeholder={`Log work in progress for ${workDomain}... (e.g. Mastered verse 1, Pitch deck slide 4)`} 
            className="ws-studio-textarea" 
          />
          
          <div className="ws-studio-footer">
            <label className="ws-upload-btn">
              <input 
                type="file" 
                multiple 
                style={{ display: 'none' }} 
                onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} 
              />
              📁 <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Stems / Deck / Screenshot'}</span>
            </label>
            <button onClick={handleBroadcast} className="ws-primary-btn ws-btn-sm">
              Commit Work
            </button>
          </div>
        </section>

        {/* 6. MENTORSHIP DIRECTIVES & GOAL TARGETS */}
        <section className="ws-card">
          <span className="ws-section-kicker">SET DIRECTIVE / TARGET</span>
          <div className="ws-directive-form">
            <input 
              value={newMission} 
              onChange={(e) => setNewMission(e.target.value)} 
              placeholder={`Add actionable milestone for ${workDomain}...`} 
              className="ws-input-field" 
            />
            <div className="ws-directive-subrow">
              <select 
                value={timeframe} 
                onChange={(e) => setTimeframe(e.target.value)} 
                className="ws-select-field"
              >
                <option value="daily">Daily Target</option>
                <option value="weekly">Weekly Target</option>
                <option value="monthly">Monthly Milestone</option>
                <option value="yearly">Yearly Horizon</option>
              </select>
              <button onClick={handleInitialize} className="ws-primary-btn">
                Launch Target
              </button>
            </div>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="ws-timeframe-bar">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(t => (
              <button 
                key={t} 
                onClick={() => setActiveTab(t)} 
                className={`ws-tf-tab ${activeTab === t ? 'tf-active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Goals Checklist Stream */}
          <div className="ws-tasks-list">
            {missionsList.filter(item => item.timeframe === activeTab).length === 0 ? (
              <div className="ws-empty-tasks">
                No active directives in this horizon. Add a goal above for mentor tracking.
              </div>
            ) : (
              missionsList.filter(item => item.timeframe === activeTab).map((item) => (
                <div 
                  key={item._id} 
                  onClick={() => togglePlanStatus(item._id, item.status)} 
                  className={`ws-task-card ${item.status === 'completed' ? 'task-done' : ''}`}
                >
                  <div className="ws-task-left">
                    <div className={`ws-checkbox ${item.status === 'completed' ? 'checked' : ''}`}>
                      {item.status === 'completed' && "✓"}
                    </div>
                    <span className="ws-task-title">{item.title}</span>
                  </div>
                  <button onClick={(e) => handleDeleteMission(item._id, e)} className="ws-trash-icon">
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

      </div>

      {/* Modern Bottom Navigation */}
      <BottomNav hasNotification={!!userProfile?.incomingRequest} />

      <style jsx global>{`
        .ws-deck-root {
          background-color: #08080a;
          min-height: 100vh;
          color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.01em;
        }

        /* Top Banner */
        .ws-top-banner {
          position: sticky;
          top: 0;
          background: rgba(8, 8, 10, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .ws-suite-tag {
          font-size: 0.6rem;
          font-weight: 800;
          color: #818cf8;
          letter-spacing: 1.5px;
          font-family: monospace;
          display: block;
        }
        .ws-suite-title {
          font-size: 1.15rem;
          font-weight: 900;
          color: #ffffff;
          margin: 2px 0 0 0;
          letter-spacing: -0.5px;
        }
        .ws-active-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 800;
          color: #22c55e;
          font-family: monospace;
        }
        .ws-status-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }

        .ws-main-scrollable {
          max-width: 560px;
          margin: 0 auto;
          padding: 16px 16px 100px 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Generic Cards */
        .ws-card, .ws-mentor-card {
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 18px;
        }
        .ws-card-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .ws-section-kicker {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #818cf8;
          font-family: monospace;
          display: block;
          margin-bottom: 8px;
        }
        .ws-badge-pill {
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
          background: #181822;
          color: #a1a1aa;
          font-family: monospace;
        }

        /* Mentor Pipeline */
        .ws-active-mentor-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 10px;
          background: #14141c;
          border-radius: 14px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }
        .ws-mentor-avatar {
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
        .ws-mentor-details { display: flex; flex-direction: column; }
        .ws-mentor-label { font-size: 0.65rem; color: #71717a; font-weight: 700; text-transform: uppercase; }
        .ws-mentor-name { font-size: 0.9rem; font-weight: 800; color: #fff; }
        .ws-mentor-note { font-size: 0.72rem; color: #818cf8; margin-top: 2px; }

        .ws-unlinked-desc { font-size: 0.8rem; color: #a1a1aa; line-height: 1.4; margin: 0 0 12px 0; }
        .ws-input-action-row { display: flex; gap: 8px; }

        /* Domain Chips */
        .ws-domain-selector {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        .ws-domain-selector::-webkit-scrollbar { display: none; }
        .ws-domain-label {
          font-size: 0.62rem;
          font-weight: 800;
          color: #52525b;
          font-family: monospace;
          margin-right: 4px;
        }
        .ws-domain-chip {
          background: #121217;
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #71717a;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          cursor: pointer;
        }
        .chip-active {
          background: #1e1b4b;
          border-color: #6366f1;
          color: #c7d2fe;
        }

        /* Velocity Gauges */
        .ws-gauges-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 14px 10px;
        }
        .ws-gauge-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .ws-ring-wrapper { position: relative; width: 50px; height: 50px; }
        .ws-ring-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 0.65rem;
          font-weight: 800;
          color: #fff;
        }
        .ws-gauge-label {
          font-size: 0.58rem;
          font-weight: 800;
          color: #71717a;
          text-transform: uppercase;
          margin-top: 6px;
        }

        /* Studio Work Area */
        .ws-visibility-pills { display: flex; gap: 4px; }
        .ws-mode-btn {
          background: #181822;
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #71717a;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          cursor: pointer;
        }
        .mode-active {
          background: #6366f1;
          color: #fff;
          border-color: #6366f1;
        }
        .ws-studio-textarea {
          width: 100%;
          height: 80px;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 12px;
          color: #fff;
          font-size: 0.85rem;
          box-sizing: border-box;
          resize: none;
          outline: none;
        }
        .ws-studio-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 10px;
        }
        .ws-upload-btn {
          color: #818cf8;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* Directives Form */
        .ws-directive-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .ws-directive-subrow { display: flex; gap: 8px; }
        .ws-input-field {
          flex: 1;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-size: 0.82rem;
          outline: none;
        }
        .ws-select-field {
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0 12px;
          color: #a1a1aa;
          font-size: 0.8rem;
          font-weight: 600;
          outline: none;
        }
        .ws-primary-btn {
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
        }
        .ws-btn-sm { padding: 8px 16px; font-size: 0.78rem; }

        /* Timeframe Tabs & Tasks */
        .ws-timeframe-bar {
          display: flex;
          gap: 6px;
          background: #14141c;
          padding: 4px;
          border-radius: 10px;
          margin-bottom: 12px;
        }
        .ws-tf-tab {
          flex: 1;
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 6px 0;
          border-radius: 6px;
          text-transform: capitalize;
          cursor: pointer;
        }
        .tf-active {
          background: #272738;
          color: #fff;
        }

        .ws-tasks-list { display: flex; flex-direction: column; gap: 8px; }
        .ws-task-card {
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }
        .task-done { opacity: 0.45; }
        .ws-task-left { display: flex; align-items: center; gap: 10px; }
        .ws-checkbox {
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
        .checked { background: #6366f1; border-color: #6366f1; }
        .ws-task-title { font-size: 0.85rem; font-weight: 600; color: #f4f4f5; }
        .ws-trash-icon { background: transparent; border: none; cursor: pointer; opacity: 0.4; }
        .ws-trash-icon:hover { opacity: 1; }
        .ws-empty-tasks {
          text-align: center;
          font-size: 0.78rem;
          color: #52525b;
          padding: 24px 10px;
        }
      `}</style>
    </div>
  );
}