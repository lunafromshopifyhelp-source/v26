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

type ScreenMode = 'hub' | 'music' | 'enterprise' | 'systems' | 'visual' | 'directives' | 'mentorship';

export default function MobileWorkspaceDeck() {
  const router = useRouter();

  // Active Screen / Sub-page State
  const [activeScreen, setActiveScreen] = useState<ScreenMode>('hub');

  // Backend States
  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [newMission, setNewMission] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Mentorship
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Studio Logs
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [broadcastText, setBroadcastText] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'partner' | 'public'>('partner');

  const fetchMissions = async () => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/missions/my-missions/${email}`);
      setMissionsList(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProfile = async () => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;
    if (!email) return;
    try {
      const res = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
      setUserProfile(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProfile();
    fetchMissions();
  }, []);

  const handleCreateDirective = (prefix: string) => async () => {
    if (!newMission.trim()) return;
    const email = localStorage.getItem('v26UserEmail');
    try {
      await axios.post('https://v26.onrender.com/api/missions/create-mission', {
        creatorEmail: email,
        title: `[${prefix}] ${newMission}`,
        timeframe: timeframe
      });
      setNewMission(""); 
      fetchMissions(); 
    } catch (err) { console.error(err); }
  };

  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!window.confirm("Delete this target milestone?")) return;
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
      alert("Mentor frequency not detected."); 
    } finally { setIsLinking(false); }
  };

  const handleBroadcast = (domainName: string) => async () => {
    if (!broadcastText.trim() && selectedFiles.length === 0) return;
    const postData = {
      authorEmail: localStorage.getItem('v26UserEmail'),
      authorName: userProfile?.displayName || "Creator", 
      text: `[${domainName}] ${broadcastText}`,
      media: selectedFiles.length > 0 ? selectedFiles.map(f => URL.createObjectURL(f)) : null,
      visibility
    };
    try {
      await axios.post('https://v26.onrender.com/api/posts/create', postData);
      setBroadcastText('');
      setSelectedFiles([]); 
      alert("Work milestone logged to your active pipeline!");
      setActiveScreen('hub');
    } catch (err) { console.error(err); }
  };

  return (
    <div className="mobile-hub-root">

      {/* TOP HEADER */}
      <header className="mobile-nav-bar">
        {activeScreen === 'hub' ? (
          <div>
            <span className="hub-eyebrow">V26 // WORKSPACE</span>
            <h1 className="hub-main-heading">Production Hub</h1>
          </div>
        ) : (
          <button className="hub-back-trigger" onClick={() => setActiveScreen('hub')}>
            <span className="back-arrow">‹</span>
            <span>Hub</span>
          </button>
        )}

        <div className="hub-mentor-badge" onClick={() => setActiveScreen('mentorship')}>
          <span className={`badge-dot ${userProfile?.partnerEmail ? 'dot-active' : ''}`} />
          <span>{userProfile?.partnerEmail ? 'Mentor Active' : 'Solo'}</span>
        </div>
      </header>

      <main className="mobile-view-container">

        {/* ========================================================
            1. MAIN HUB MENU SCREEN (DRILL-DOWN TILES)
        ======================================================== */}
        {activeScreen === 'hub' && (
          <div className="drilldown-home">
            
            {/* Quick Status Bar */}
            <div className="hub-summary-card" onClick={() => setActiveScreen('directives')}>
              <div className="summary-col">
                <span className="summary-number" style={{ color: '#6366f1' }}>{calculateProgress('daily')}%</span>
                <span className="summary-tag">Daily Pace</span>
              </div>
              <div className="summary-line" />
              <div className="summary-col">
                <span className="summary-number" style={{ color: '#22c55e' }}>{calculateProgress('weekly')}%</span>
                <span className="summary-tag">Weekly Goals</span>
              </div>
              <div className="summary-line" />
              <div className="summary-col">
                <span className="summary-number">{missionsList.length}</span>
                <span className="summary-tag">Directives</span>
              </div>
            </div>

            {/* SECTOR 1: COLLABORATIVE DOMAINS */}
            <div className="hub-list-section">
              <span className="hub-section-label">WORK DOMAINS</span>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('music')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>🎵</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">Music Architecture</span>
                  <span className="hub-cell-subtitle">Stems, mixdown reviews, and audio drops</span>
                </div>
                <span className="hub-cell-arrow">›</span>
              </div>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('enterprise')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(234, 179, 8, 0.12)', color: '#facc15' }}>💼</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">Enterprise & Strategy</span>
                  <span className="hub-cell-subtitle">Decks, business models, and founder logs</span>
                </div>
                <span className="hub-cell-arrow">›</span>
              </div>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('systems')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80' }}>💻</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">Systems & Software</span>
                  <span className="hub-cell-subtitle">Sprints, releases, and architecture commits</span>
                </div>
                <span className="hub-cell-arrow">›</span>
              </div>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('visual')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(236, 72, 153, 0.12)', color: '#f472b6' }}>🎨</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">Visual Arts & Design</span>
                  <span className="hub-cell-subtitle">Visual brand systems, 3D and media design</span>
                </div>
                <span className="hub-cell-arrow">›</span>
              </div>
            </div>

            {/* SECTOR 2: DIRECTIVES & ALLIANCE */}
            <div className="hub-list-section">
              <span className="hub-section-label">MANAGEMENT & EXECUTION</span>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('directives')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>🎯</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">Directives & Milestones</span>
                  <span className="hub-cell-subtitle">Target checklist, velocity and checkoffs</span>
                </div>
                <span className="hub-cell-badge">{missionsList.filter(m => m.status === 'active').length}</span>
                <span className="hub-cell-arrow">›</span>
              </div>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('mentorship')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>🤝</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">Mentorship Pipeline</span>
                  <span className="hub-cell-subtitle">
                    {userProfile?.partnerEmail ? userProfile.partnerEmail : 'Link your industry mentor'}
                  </span>
                </div>
                <span className="hub-cell-arrow">›</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            2. MUSIC ARCHITECTURE SUB-PAGE
        ======================================================== */}
        {activeScreen === 'music' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="subpage-kicker">STUDIO WORKSPACE</span>
              <h2 className="subpage-title">Music Architecture</h2>
              <p className="subpage-desc">Share arrangement progress, audio stems, and mix feedback with your mentor.</p>
            </div>

            <div className="subpage-card">
              <span className="card-kicker">SESSION LOG</span>
              <textarea 
                value={broadcastText} 
                onChange={(e) => setBroadcastText(e.target.value)} 
                placeholder="Log session notes (e.g. Mastered verse 1, automated reverb bus, adjusted FL mixer)..." 
                className="subpage-textarea" 
              />
              <div className="subpage-action-row">
                <label className="file-pick-cta">
                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                  🎵 <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Stems / Audio Demo'}</span>
                </label>
                <button onClick={handleBroadcast('Music')} className="subpage-primary-btn">
                  Commit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            3. ENTERPRISE & STRATEGY SUB-PAGE
        ======================================================== */}
        {activeScreen === 'enterprise' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="subpage-kicker">FOUNDER & VENTURE ROOM</span>
              <h2 className="subpage-title">Enterprise & Strategy</h2>
              <p className="subpage-desc">Submit pitch deck revisions, business models, and market traction for executive review.</p>
            </div>

            <div className="subpage-card">
              <span className="card-kicker">VENTURE MILESTONE</span>
              <textarea 
                value={broadcastText} 
                onChange={(e) => setBroadcastText(e.target.value)} 
                placeholder="Log enterprise step (e.g. Completed slide 3-6 of investor deck, updated revenue projections)..." 
                className="subpage-textarea" 
              />
              <div className="subpage-action-row">
                <label className="file-pick-cta">
                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                  📄 <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Deck / Sheet'}</span>
                </label>
                <button onClick={handleBroadcast('Enterprise')} className="subpage-primary-btn">
                  Commit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            4. SYSTEMS & SOFTWARE SUB-PAGE
        ======================================================== */}
        {activeScreen === 'systems' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="subpage-kicker">DEV TERMINAL</span>
              <h2 className="subpage-title">Systems & Software</h2>
              <p className="subpage-desc">Log pull requests, backend deployments, and architecture blueprints.</p>
            </div>

            <div className="subpage-card">
              <span className="card-kicker">DEV LOG COMMIT</span>
              <textarea 
                value={broadcastText} 
                onChange={(e) => setBroadcastText(e.target.value)} 
                placeholder="Log system engineering changes (e.g. Connected Next.js API routes, optimized database schemas)..." 
                className="subpage-textarea" 
              />
              <div className="subpage-action-row">
                <label className="file-pick-cta">
                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                  💻 <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Screenshot / Log'}</span>
                </label>
                <button onClick={handleBroadcast('Systems')} className="subpage-primary-btn">
                  Commit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            5. VISUAL ARTS & DESIGN SUB-PAGE
        ======================================================== */}
        {activeScreen === 'visual' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="subpage-kicker">DESIGN LAB</span>
              <h2 className="subpage-title">Visual Arts & Design</h2>
              <p className="subpage-desc">Share UI mockups, 3D animation assets, brand identities, and visual drops.</p>
            </div>

            <div className="subpage-card">
              <span className="card-kicker">VISUAL ASSET LOG</span>
              <textarea 
                value={broadcastText} 
                onChange={(e) => setBroadcastText(e.target.value)} 
                placeholder="Describe visual deliverable (e.g. Finalized dark mode aesthetic, 3D character render)..." 
                className="subpage-textarea" 
              />
              <div className="subpage-action-row">
                <label className="file-pick-cta">
                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                  🖼️ <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Design Assets'}</span>
                </label>
                <button onClick={handleBroadcast('Visual')} className="subpage-primary-btn">
                  Commit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            6. DIRECTIVES & MILESTONES SUB-PAGE
        ======================================================== */}
        {activeScreen === 'directives' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="subpage-kicker">EXECUTION LOG</span>
              <h2 className="subpage-title">Directives & Milestones</h2>
              <p className="subpage-desc">Set clear deliverables for each timeframe. Check them off as you complete work.</p>
            </div>

            <div className="subpage-card">
              <span className="card-kicker">ADD DIRECTIVE</span>
              <input 
                value={newMission} 
                onChange={(e) => setNewMission(e.target.value)} 
                placeholder="What milestone are we manifesting?" 
                className="subpage-input" 
              />
              <div className="subpage-inline-row">
                <select 
                  value={timeframe} 
                  onChange={(e) => setTimeframe(e.target.value)} 
                  className="subpage-select"
                >
                  <option value="daily">Daily Target</option>
                  <option value="weekly">Weekly Target</option>
                  <option value="monthly">Monthly Milestone</option>
                  <option value="yearly">Horizon Target</option>
                </select>
                <button onClick={handleCreateDirective('Directive')} className="subpage-primary-btn">
                  Launch
                </button>
              </div>
            </div>

            <div className="subpage-tabs-bar">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(t => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)} 
                  className={`tab-btn ${activeTab === t ? 'tab-active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="subpage-tasks-stack">
              {missionsList.filter(item => item.timeframe === activeTab).length === 0 ? (
                <div className="empty-subpage-state">No targets active in this horizon.</div>
              ) : (
                missionsList.filter(item => item.timeframe === activeTab).map((item) => (
                  <div 
                    key={item._id} 
                    onClick={() => togglePlanStatus(item._id, item.status)} 
                    className={`task-entry-row ${item.status === 'completed' ? 'task-done' : ''}`}
                  >
                    <div className="task-entry-left">
                      <div className={`entry-checkbox ${item.status === 'completed' ? 'cb-done' : ''}`}>
                        {item.status === 'completed' && "✓"}
                      </div>
                      <span className="entry-title">{item.title}</span>
                    </div>
                    <button onClick={(e) => handleDeleteMission(item._id, e)} className="entry-trash-btn">
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            7. MENTORSHIP PIPELINE SUB-PAGE
        ======================================================== */}
        {activeScreen === 'mentorship' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="subpage-kicker">ALLIANCE NETWORK</span>
              <h2 className="subpage-title">Mentorship Bridge</h2>
              <p className="subpage-desc">Connect directly to an industry mentor for real-time progress oversight.</p>
            </div>

            {userProfile?.partnerEmail ? (
              <div className="subpage-card">
                <span className="card-kicker">ACTIVE MENTOR</span>
                <div className="mentor-live-row">
                  <div className="mentor-crest">{userProfile.partnerEmail[0].toUpperCase()}</div>
                  <div>
                    <h3 className="mentor-email-text">{userProfile.partnerEmail}</h3>
                    <span className="mentor-live-status">Direct Bridge Synchronized</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="subpage-card">
                <span className="card-kicker">INVITE INDUSTRY MENTOR</span>
                <p className="card-desc">Enter your mentor's email to bridge their terminal to your progress stream.</p>
                <input 
                  value={partnerEmail} 
                  onChange={(e) => setPartnerEmail(e.target.value)} 
                  placeholder="Mentor email address..." 
                  className="subpage-input" 
                />
                <button onClick={linkPartner} disabled={isLinking} className="subpage-primary-btn" style={{ width: '100%', marginTop: '6px' }}>
                  {isLinking ? 'Sending Transmission...' : 'Send Mentorship Invitation'}
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Persistent Bottom Nav */}
      <BottomNav hasNotification={!!userProfile?.incomingRequest} />

      <style jsx global>{`
        .mobile-hub-root {
          background-color: #08080a;
          min-height: 100vh;
          color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.01em;
        }

        /* Nav Header */
        .mobile-nav-bar {
          position: sticky;
          top: 0;
          background: rgba(8, 8, 10, 0.9);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .hub-eyebrow {
          font-size: 0.55rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #818cf8;
          font-family: monospace;
          display: block;
        }
        .hub-main-heading {
          font-size: 1.15rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          margin: 2px 0 0 0;
          color: #fff;
        }
        .hub-back-trigger {
          display: flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: none;
          color: #818cf8;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
        }
        .back-arrow { font-size: 1.4rem; line-height: 1; }

        .hub-mentor-badge {
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
        .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #52525b; }
        .dot-active { background: #22c55e; box-shadow: 0 0 6px #22c55e; }

        .mobile-view-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 16px 14px 100px 14px;
        }

        /* Summary Card */
        .hub-summary-card {
          display: flex;
          align-items: center;
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 14px 10px;
          margin-bottom: 20px;
          cursor: pointer;
        }
        .summary-col { flex: 1; text-align: center; }
        .summary-number { font-size: 1.25rem; font-weight: 900; color: #fff; font-family: monospace; display: block; }
        .summary-tag { font-size: 0.58rem; font-weight: 800; color: #71717a; text-transform: uppercase; margin-top: 2px; }
        .summary-line { width: 1px; height: 26px; background: rgba(255, 255, 255, 0.06); }

        /* Hub Menu Rows */
        .hub-list-section { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
        .hub-section-label {
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #71717a;
          font-family: monospace;
          padding-left: 4px;
          margin-bottom: 2px;
        }
        .hub-menu-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .hub-menu-cell:active { transform: scale(0.98); background: #14141c; }
        .hub-cell-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          flex-shrink: 0;
        }
        .hub-cell-info { flex: 1; display: flex; flex-direction: column; }
        .hub-cell-title { font-size: 0.88rem; font-weight: 700; color: #f4f4f5; }
        .hub-cell-subtitle { font-size: 0.72rem; color: #71717a; margin-top: 2px; }
        .hub-cell-badge { font-size: 0.62rem; font-weight: 800; color: #818cf8; background: #1e1b4b; padding: 3px 8px; border-radius: 10px; }
        .hub-cell-arrow { font-size: 1.2rem; color: #52525b; font-weight: 600; }

        /* Sub-Pages Style */
        .subpage-screen { display: flex; flex-direction: column; gap: 14px; }
        .subpage-banner { margin-bottom: 4px; }
        .subpage-kicker { font-size: 0.58rem; font-weight: 800; color: #818cf8; font-family: monospace; letter-spacing: 1.2px; }
        .subpage-title { font-size: 1.3rem; font-weight: 900; color: #fff; margin: 2px 0 4px 0; }
        .subpage-desc { font-size: 0.78rem; color: #71717a; margin: 0; line-height: 1.4; }

        .subpage-card {
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 16px;
        }
        .card-kicker { font-size: 0.6rem; font-weight: 800; color: #818cf8; font-family: monospace; letter-spacing: 1px; display: block; margin-bottom: 8px; }
        .card-desc { font-size: 0.78rem; color: #a1a1aa; margin: 0 0 10px 0; }
        .subpage-textarea {
          width: 100%;
          height: 100px;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 12px;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
          box-sizing: border-box;
          resize: none;
        }
        .subpage-action-row { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .file-pick-cta { color: #818cf8; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
        .subpage-primary-btn {
          background: #6366f1;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 10px 18px;
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
        }

        .subpage-input {
          width: 100%;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 10px 12px;
          color: #fff;
          font-size: 0.85rem;
          outline: none;
          box-sizing: border-box;
          margin-bottom: 8px;
        }
        .subpage-inline-row { display: flex; gap: 8px; }
        .subpage-select {
          flex: 1;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0 10px;
          color: #a1a1aa;
          font-size: 0.78rem;
          outline: none;
        }

        .subpage-tabs-bar {
          display: flex;
          gap: 4px;
          background: #121217;
          padding: 3px;
          border-radius: 10px;
        }
        .tab-btn {
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
        .tab-active { background: #1e1b4b; color: #818cf8; }

        .subpage-tasks-stack { display: flex; flex-direction: column; gap: 6px; margin-top: 6px; }
        .task-entry-row {
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
        .task-entry-left { display: flex; align-items: center; gap: 10px; }
        .entry-checkbox {
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
        .cb-done { background: #6366f1; border-color: #6366f1; }
        .entry-title { font-size: 0.82rem; font-weight: 600; color: #f4f4f5; }
        .entry-trash-btn { background: transparent; border: none; color: #71717a; cursor: pointer; }
        .empty-subpage-state { text-align: center; color: #52525b; font-size: 0.8rem; padding: 24px 0; }

        .mentor-live-row { display: flex; gap: 12px; align-items: center; }
        .mentor-crest {
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
        }
        .mentor-email-text { font-size: 0.9rem; font-weight: 800; color: #fff; margin: 0; }
        .mentor-live-status { font-size: 0.72rem; color: #22c55e; }
      `}</style>
    </div>
  );
}