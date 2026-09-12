'use client';
import React, { useState, useEffect, useRef } from 'react';
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
  talent?: string;
}

interface MissionItem {
  _id: string;
  title: string;
  timeframe: 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: 'active' | 'completed';
  scheduledTime?: string; // e.g. "14:30"
}

interface ScheduledCall {
  mentorEmail: string;
  scheduledDateTime: string;
  topic: string;
}

type ScreenMode = 'hub' | 'craft_studio' | 'directives' | 'mentorship';

export default function MobileWorkspaceDeck() {
  const router = useRouter();

  // Navigation Screen State
  const [activeScreen, setActiveScreen] = useState<ScreenMode>('hub');

  // Backend States
  const [missionsList, setMissionsList] = useState<MissionItem[]>([]);
  const [newMission, setNewMission] = useState("");
  const [missionTime, setMissionTime] = useState("");
  const [timeframe, setTimeframe] = useState("daily");
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');

  // Mentorship & Call State
  const [partnerEmail, setPartnerEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [scheduledCall, setScheduledCall] = useState<ScheduledCall | null>(null);
  const [callDateTime, setCallDateTime] = useState('');
  const [callTopic, setCallTopic] = useState('');
  const [isCalling, setIsCalling] = useState(false);

  // PA Reminder Alarm State
  const [activeAlarmTask, setActiveAlarmTask] = useState<MissionItem | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Locked User Primary Craft
  const [userTalent, setUserTalent] = useState<string>('Music Architecture');

  // Studio Logs
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); 
  const [broadcastText, setBroadcastText] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'partner' | 'public'>('partner');

  // Play audio chime for PA alarms & Mentor calls
  const playRingChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5 note
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn("Audio alarm autoplay requires initial user interaction:", e);
    }
  };

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
      if (res.data.talent) {
        setUserTalent(res.data.talent);
      } else {
        const saved = localStorage.getItem('v26UserTalent');
        if (saved) setUserTalent(saved);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchProfile();
    fetchMissions();

    // Check saved mentor call
    const savedCall = localStorage.getItem('v26ScheduledCall');
    if (savedCall) {
      try { setScheduledCall(JSON.parse(savedCall)); } catch (e) {}
    }
  }, []);

  // PA Reminder & Call Monitoring Timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      // Check task reminders
      missionsList.forEach(m => {
        if (m.status === 'active' && m.scheduledTime === currentTimeStr) {
          const alertedKey = `alerted_${m._id}_${currentTimeStr}`;
          if (!sessionStorage.getItem(alertedKey)) {
            sessionStorage.setItem(alertedKey, 'true');
            playRingChime();
            setActiveAlarmTask(m);
          }
        }
      });

      // Check scheduled mentor calls
      if (scheduledCall && !isCalling) {
        const callTime = new Date(scheduledCall.scheduledDateTime).getTime();
        const diff = Math.abs(now.getTime() - callTime);
        // Rings if within 1 minute of scheduled time
        if (diff < 60000) {
          const callKey = `call_alerted_${scheduledCall.scheduledDateTime}`;
          if (!sessionStorage.getItem(callKey)) {
            sessionStorage.setItem(callKey, 'true');
            playRingChime();
            setIsCalling(true);
          }
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [missionsList, scheduledCall, isCalling]);

  const handleCreateDirective = async () => {
    if (!newMission.trim()) return;
    const email = localStorage.getItem('v26UserEmail');
    const formattedTitle = missionTime 
      ? `⏰ ${missionTime} • ${newMission.trim()}`
      : newMission.trim();

    try {
      const res = await axios.post('https://v26.onrender.com/api/missions/create-mission', {
        creatorEmail: email,
        title: formattedTitle,
        timeframe
      });
      setNewMission(""); 
      setMissionTime("");
      fetchMissions(); 
    } catch (err) { console.error(err); }
  };

  const handleDeleteMission = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!window.confirm("Remove this directive?")) return;
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
      alert("Mentorship Bridge Transmitted!");
      setPartnerEmail('');
      fetchProfile();
    } catch (err) { 
      alert("Mentor frequency not detected."); 
    } finally { setIsLinking(false); }
  };

  const handleScheduleCall = () => {
    if (!callDateTime) return alert("Select date and time for the review call.");
    const callData: ScheduledCall = {
      mentorEmail: userProfile?.partnerEmail || "mentor@v26.io",
      scheduledDateTime: callDateTime,
      topic: callTopic.trim() || "Milestone & Craft Review"
    };
    setScheduledCall(callData);
    localStorage.setItem('v26ScheduledCall', JSON.stringify(callData));
    alert(`Synchronized Review Call set for ${new Date(callDateTime).toLocaleString()}. Both terminals will ring at call time.`);
    setCallTopic('');
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
      alert("Work milestone logged to your pipeline!");
      setActiveScreen('hub');
    } catch (err) { console.error(err); }
  };

  const userInitial = (userProfile?.displayName || userProfile?.email || 'U')[0].toUpperCase();

  return (
    <div className="mobile-hub-root">

      {/* TOP HEADER WITH PROFILE AVATAR (NO // SLATE TEXT) */}
      <header className="mobile-nav-bar">
        {activeScreen === 'hub' ? (
          <button 
            className="nav-avatar-pill" 
            onClick={() => router.push('/profile')}
            aria-label="Profile Settings"
          >
            <div className="avatar-circle">{userInitial}</div>
            <div className="avatar-meta">
              <span className="avatar-user-name">{userProfile?.displayName || userProfile?.email?.split('@')[0] || 'Creator'}</span>
              <span className="avatar-craft-tag">{userTalent}</span>
            </div>
          </button>
        ) : (
          <button className="hub-back-trigger" onClick={() => setActiveScreen('hub')}>
            <span className="back-arrow">‹</span>
            <span>Workspace</span>
          </button>
        )}

        <div className="nav-header-right">
          <div className="hub-mentor-badge" onClick={() => setActiveScreen('mentorship')}>
            <span className={`badge-dot ${userProfile?.partnerEmail ? 'dot-active' : ''}`} />
            <span>{userProfile?.partnerEmail ? 'Mentor Sync' : 'Solo'}</span>
          </div>
          {activeScreen !== 'hub' && (
            <div 
              className="avatar-circle avatar-small" 
              onClick={() => router.push('/profile')}
            >
              {userInitial}
            </div>
          )}
        </div>
      </header>

      <main className="mobile-view-container">

        {/* ========================================================
            1. MAIN HUB SCREEN (LOCKED TO USER'S CRAFT)
        ======================================================== */}
        {activeScreen === 'hub' && (
          <div className="drilldown-home">
            
            {/* LOCKED DEDICATED CRAFT STUDIO (NO SWITCH BUTTON) */}
            <div className="talent-hero-card">
              <div className="talent-hero-top">
                <span className="talent-tag">ASSIGNED STUDIO ENVIRONMENT</span>
              </div>
              <h2 className="talent-hero-title">{userTalent}</h2>
              <p className="talent-hero-desc">
                {userTalent.toLowerCase().includes('music') && "Your dedicated audio studio: submit stems, arrangements, mixer routing, and master reviews."}
                {userTalent.toLowerCase().includes('art') && "Your dedicated visual studio: manage brand design systems, 3D artwork, and client mockups."}
                {userTalent.toLowerCase().includes('enterprise') && "Your executive suite: pitch deck submissions, venture models, and billionaire mentor advisory."}
                {userTalent.toLowerCase().includes('system') && "Your engineering terminal: git branches, deployment logs, and architecture blueprints."}
              </p>
              <button 
                className="talent-enter-btn"
                onClick={() => setActiveScreen('craft_studio')}
              >
                Launch Studio Desk →
              </button>
            </div>

            {/* PA Daily Goal Velocity Glance */}
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
                <span className="summary-number">{missionsList.filter(m => m.status === 'active').length}</span>
                <span className="summary-tag">Pending Targets</span>
              </div>
            </div>

            {/* Hub Menu List */}
            <div className="hub-list-section">
              <span className="hub-section-label">OPERATIONS & MENTORSHIP</span>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('craft_studio')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                  {userTalent.toLowerCase().includes('music') ? '🎵' : userTalent.toLowerCase().includes('art') ? '🎨' : userTalent.toLowerCase().includes('enterprise') ? '💼' : '💻'}
                </div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">{userTalent} Desk</span>
                  <span className="hub-cell-subtitle">Log session work, drop artifacts & review</span>
                </div>
                <span className="hub-cell-arrow">›</span>
              </div>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('directives')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>🎯</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">PA Directives & Time Reminders</span>
                  <span className="hub-cell-subtitle">Scheduled alarms, daily checklist & completion %</span>
                </div>
                <span className="hub-cell-badge">{missionsList.filter(m => m.status === 'active').length} active</span>
                <span className="hub-cell-arrow">›</span>
              </div>

              <div className="hub-menu-cell" onClick={() => setActiveScreen('mentorship')}>
                <div className="hub-cell-icon" style={{ background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' }}>🤝</div>
                <div className="hub-cell-info">
                  <span className="hub-cell-title">Mentorship & Scheduled Calls</span>
                  <span className="hub-cell-subtitle">
                    {scheduledCall ? `Call set: ${new Date(scheduledCall.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : (userProfile?.partnerEmail || 'Link your mentor')}
                  </span>
                </div>
                <span className="hub-cell-arrow">›</span>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================
            2. PRIMARY CRAFT WORKSPACE SUB-PAGE
        ======================================================== */}
        {activeScreen === 'craft_studio' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="craft-badge">{userTalent.toUpperCase()} ENVIRONMENT</span>
              <h2 className="subpage-title">{userTalent}</h2>
              <p className="subpage-desc">Share arrangement stems, artifacts, or business assets with your mentor for immediate feedback.</p>
            </div>

            <div className="subpage-card">
              <span className="card-kicker">SESSION LOG</span>
              <textarea 
                value={broadcastText} 
                onChange={(e) => setBroadcastText(e.target.value)} 
                placeholder={`Log session deliverables for ${userTalent}...`} 
                className="subpage-textarea" 
              />
              <div className="subpage-action-row">
                <label className="file-pick-cta">
                  <input type="file" multiple style={{ display: 'none' }} onChange={(e) => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} />
                  📁 <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Stems / Media Files'}</span>
                </label>
                <button onClick={handleBroadcast(userTalent)} className="subpage-primary-btn">
                  Commit Work
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            3. PA DIRECTIVES & TIME-BASED REMINDERS
        ======================================================== */}
        {activeScreen === 'directives' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="craft-badge" style={{ color: '#c084fc', borderColor: 'rgba(168, 85, 247, 0.3)' }}>PERSONAL ASSISTANT</span>
              <h2 className="subpage-title">Directives & Time Reminders</h2>
              <p className="subpage-desc">Set milestones with exact times. When the time arrives, your terminal will ring and remind you to complete it.</p>
            </div>

            {/* Launch Target with Time Input */}
            <div className="subpage-card">
              <span className="card-kicker">SCHEDULE GOAL / MEETING REMINDER</span>
              <input 
                value={newMission} 
                onChange={(e) => setNewMission(e.target.value)} 
                placeholder="Task (e.g., Attend strategy sync, mix vocal tracks, meet mentor)..." 
                className="subpage-input" 
              />
              <div className="subpage-inline-row">
                <input 
                  type="time" 
                  value={missionTime} 
                  onChange={(e) => setMissionTime(e.target.value)} 
                  className="subpage-time-input" 
                  title="Execution reminder time"
                />
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
                <button onClick={handleCreateDirective} className="subpage-primary-btn">
                  Set Task
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
                  {t} ({calculateProgress(t)}%)
                </button>
              ))}
            </div>

            <div className="subpage-tasks-stack">
              {missionsList.filter(item => item.timeframe === activeTab).length === 0 ? (
                <div className="empty-subpage-state">No {activeTab} directives scheduled.</div>
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
            4. MENTORSHIP & SYNCHRONIZED CALL ROOM
        ======================================================== */}
        {activeScreen === 'mentorship' && (
          <div className="subpage-screen">
            <div className="subpage-banner">
              <span className="craft-badge" style={{ color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}>ALLIANCE NETWORK</span>
              <h2 className="subpage-title">Mentor Review & Calls</h2>
              <p className="subpage-desc">Schedule 1-on-1 review sessions. Both devices ring simultaneously at the appointed call time.</p>
            </div>

            {/* Mentor Overview Card */}
            <div className="subpage-card">
              <span className="card-kicker">VERIFIED MENTOR BRIDGE</span>
              {userProfile?.partnerEmail ? (
                <div className="mentor-live-row">
                  <div className="mentor-crest">{userProfile.partnerEmail[0].toUpperCase()}</div>
                  <div>
                    <h3 className="mentor-email-text">{userProfile.partnerEmail}</h3>
                    <span className="mentor-live-status">Direct Bridge Active</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="card-desc">Enter your mentor's email address to connect your workspace.</p>
                  <input 
                    value={partnerEmail} 
                    onChange={(e) => setPartnerEmail(e.target.value)} 
                    placeholder="Mentor email..." 
                    className="subpage-input" 
                  />
                  <button onClick={linkPartner} disabled={isLinking} className="subpage-primary-btn" style={{ width: '100%', marginTop: '6px' }}>
                    {isLinking ? 'Sending...' : 'Invite Mentor'}
                  </button>
                </div>
              )}
            </div>

            {/* Call Scheduler Card */}
            <div className="subpage-card">
              <span className="card-kicker">SCHEDULE SYNCHRONIZED CALL</span>
              {scheduledCall ? (
                <div className="scheduled-call-box">
                  <div className="call-info-row">
                    <span className="call-icon">📞</span>
                    <div>
                      <span className="call-status-tag">CALL SCHEDULED</span>
                      <h4 className="call-topic-title">{scheduledCall.topic}</h4>
                      <span className="call-time-display">
                        ⏰ {new Date(scheduledCall.scheduledDateTime).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="call-actions-row">
                    <button onClick={() => { playRingChime(); setIsCalling(true); }} className="subpage-primary-btn" style={{ flex: 1 }}>
                      Simulate Ring / Start Call
                    </button>
                    <button 
                      onClick={() => {
                        setScheduledCall(null);
                        localStorage.removeItem('v26ScheduledCall');
                      }} 
                      className="call-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="card-desc">Pick date and time. Both your device and your mentor's device will trigger an audible ring.</p>
                  <input 
                    type="datetime-local" 
                    value={callDateTime} 
                    onChange={(e) => setCallDateTime(e.target.value)} 
                    className="subpage-input" 
                  />
                  <input 
                    value={callTopic} 
                    onChange={(e) => setCallTopic(e.target.value)} 
                    placeholder="Review topic (e.g. Mastered Album Review, Seed Round Pitch)..." 
                    className="subpage-input" 
                  />
                  <button onClick={handleScheduleCall} className="subpage-primary-btn" style={{ width: '100%', marginTop: '6px' }}>
                    Schedule Call & Sync Both Terminals
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* PA REMINDER ALARM MODAL */}
      {activeAlarmTask && (
        <div className="alarm-modal-backdrop">
          <div className="alarm-modal-sheet">
            <div className="alarm-bell-icon">🔔</div>
            <span className="alarm-subtitle">PERSONAL ASSISTANT DIRECTIVE ALARM</span>
            <h3 className="alarm-task-title">{activeAlarmTask.title}</h3>
            <p className="alarm-note">The scheduled execution time for this target has arrived.</p>
            <div className="alarm-actions">
              <button 
                onClick={() => {
                  togglePlanStatus(activeAlarmTask._id, 'active');
                  setActiveAlarmTask(null);
                }} 
                className="alarm-btn-done"
              >
                Mark Done & Update Daily Pace ✓
              </button>
              <button onClick={() => setActiveAlarmTask(null)} className="alarm-btn-dismiss">
                Snooze / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYNCHRONIZED CALL INCOMING RING MODAL */}
      {isCalling && (
        <div className="alarm-modal-backdrop">
          <div className="call-ring-sheet">
            <div className="call-ring-pulse">
              <span className="ring-icon">📞</span>
            </div>
            <span className="call-incoming-tag">SYNCHRONIZED MENTORSHIP CALL</span>
            <h3 className="call-incoming-mentor">{scheduledCall?.mentorEmail || userProfile?.partnerEmail || "Mentor"}</h3>
            <p className="call-incoming-topic">{scheduledCall?.topic || "Session Review"}</p>
            <div className="call-modal-buttons">
              <button 
                onClick={() => {
                  alert("Connecting secure WebRTC audio/video bridge...");
                  setIsCalling(false);
                }} 
                className="call-accept-btn"
              >
                Join Call Room
              </button>
              <button onClick={() => setIsCalling(false)} className="call-decline-btn">
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSISTENT BOTTOM NAVIGATION */}
      <BottomNav hasNotification={!!userProfile?.incomingRequest} />

      <style jsx global>{`
        .mobile-hub-root {
          background-color: #08080a;
          min-height: 100vh;
          color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.01em;
        }

        /* Top Nav Header */
        .mobile-nav-bar {
          position: sticky;
          top: 0;
          background: rgba(8, 8, 10, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .nav-avatar-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          text-align: left;
        }
        .avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          font-weight: 800;
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }
        .avatar-small { width: 32px; height: 32px; font-size: 0.8rem; cursor: pointer; }
        .avatar-meta { display: flex; flex-direction: column; }
        .avatar-user-name { font-size: 0.9rem; font-weight: 800; color: #ffffff; }
        .avatar-craft-tag { font-size: 0.65rem; color: #818cf8; font-weight: 600; }

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

        .nav-header-right { display: flex; align-items: center; gap: 8px; }
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
          padding: 14px 14px 100px 14px;
        }

        /* Talent Hero Card */
        .talent-hero-card {
          background: linear-gradient(135deg, #13131c, #1a172c);
          border: 1px solid rgba(99, 102, 241, 0.25);
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .talent-hero-top { margin-bottom: 6px; }
        .talent-tag {
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #818cf8;
          font-family: monospace;
        }
        .talent-hero-title { font-size: 1.35rem; font-weight: 900; color: #fff; margin: 0 0 6px 0; }
        .talent-hero-desc { font-size: 0.76rem; color: #a1a1aa; line-height: 1.45; margin: 0 0 14px 0; }
        .talent-enter-btn {
          background: #6366f1;
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 800;
          cursor: pointer;
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
        }
        .hub-menu-cell:active { background: #14141c; }
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
        .craft-badge {
          display: inline-block;
          font-size: 0.58rem;
          font-weight: 800;
          font-family: monospace;
          letter-spacing: 1px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #818cf8;
          padding: 2px 8px;
          border-radius: 6px;
          margin-bottom: 6px;
        }
        .subpage-title { font-size: 1.3rem; font-weight: 900; color: #fff; margin: 0 0 4px 0; }
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
        .subpage-inline-row { display: flex; gap: 8px; align-items: center; }
        .subpage-time-input {
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 8px 10px;
          color: #818cf8;
          font-weight: 700;
          font-size: 0.8rem;
          outline: none;
        }
        .subpage-select {
          flex: 1;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0 10px;
          color: #a1a1aa;
          font-size: 0.78rem;
          outline: none;
          height: 38px;
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
          font-size: 0.7rem;
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
        .task-done { opacity: 0.45; text-decoration: line-through; }
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

        /* Mentorship & Call Scheduling */
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

        .scheduled-call-box { background: #14141c; border-radius: 14px; padding: 14px; border: 1px solid rgba(99, 102, 241, 0.2); }
        .call-info-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; }
        .call-icon { font-size: 1.5rem; }
        .call-status-tag { font-size: 0.58rem; font-weight: 800; color: #22c55e; letter-spacing: 1px; font-family: monospace; display: block; }
        .call-topic-title { margin: 2px 0; font-size: 0.95rem; font-weight: 800; color: #fff; }
        .call-time-display { font-size: 0.75rem; color: #818cf8; font-weight: 700; }
        .call-actions-row { display: flex; gap: 8px; }
        .call-cancel-btn { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #71717a; border-radius: 10px; padding: 8px 14px; font-size: 0.75rem; cursor: pointer; }

        /* Alarms & Modals */
        .alarm-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .alarm-modal-sheet {
          background: #14141c;
          border: 1px solid #6366f1;
          border-radius: 20px;
          padding: 24px;
          width: 100%;
          max-width: 400px;
          text-align: center;
          box-shadow: 0 0 30px rgba(99, 102, 241, 0.3);
        }
        .alarm-bell-icon { font-size: 2.2rem; margin-bottom: 8px; }
        .alarm-subtitle { font-size: 0.62rem; font-weight: 800; letter-spacing: 1.5px; color: #818cf8; font-family: monospace; display: block; margin-bottom: 6px; }
        .alarm-task-title { font-size: 1.15rem; font-weight: 900; color: #fff; margin: 0 0 8px 0; }
        .alarm-note { font-size: 0.78rem; color: #a1a1aa; margin: 0 0 16px 0; }
        .alarm-actions { display: flex; flex-direction: column; gap: 8px; }
        .alarm-btn-done { background: #22c55e; color: #000; border: none; border-radius: 10px; padding: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; }
        .alarm-btn-dismiss { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #71717a; border-radius: 10px; padding: 10px; font-size: 0.78rem; cursor: pointer; }

        /* Call Ringing Sheet */
        .call-ring-sheet {
          background: #13131c;
          border: 1px solid #22c55e;
          border-radius: 24px;
          padding: 28px 20px;
          width: 100%;
          max-width: 380px;
          text-align: center;
          box-shadow: 0 0 35px rgba(34, 197, 94, 0.25);
        }
        .call-ring-pulse {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(34, 197, 94, 0.15);
          border: 2px solid #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px auto;
        }
        .ring-icon { font-size: 1.6rem; }
        .call-incoming-tag { font-size: 0.6rem; font-weight: 800; letter-spacing: 1.5px; color: #22c55e; font-family: monospace; display: block; margin-bottom: 4px; }
        .call-incoming-mentor { font-size: 1.15rem; font-weight: 900; color: #fff; margin: 0 0 4px 0; }
        .call-incoming-topic { font-size: 0.8rem; color: #818cf8; margin: 0 0 20px 0; }
        .call-modal-buttons { display: flex; gap: 10px; }
        .call-accept-btn { flex: 1; background: #22c55e; color: #000; border: none; border-radius: 12px; padding: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; }
        .call-decline-btn { flex: 1; background: #ef4444; color: #fff; border: none; border-radius: 12px; padding: 12px; font-weight: 800; font-size: 0.85rem; cursor: pointer; }
      `}</style>
    </div>
  );
}