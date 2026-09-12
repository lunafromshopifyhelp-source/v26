'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import BottomNav from '../../components/BottomNav';

interface CommentItem {
  _id?: string;
  userEmail?: string;
  userName?: string;
  text: string;
  createdAt?: string;
}

interface BroadcastPost {
  _id: string;
  authorEmail: string;
  authorName: string;
  text?: string;
  media: string[] | null;
  tags?: string[];
  visibility: 'private' | 'partner' | 'public';
  createdAt: string;
  likes?: string[];
  comments?: CommentItem[];
}

export default function V26SignatureDiscoverPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<BroadcastPost[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  
  // Quick Post Modal State
  const [quickText, setQuickText] = useState('');
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);

  // Discussion Drawer State
  const [activeDiscussionPost, setActiveDiscussionPost] = useState<BroadcastPost | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;

  const fetchFeed = async () => {
    try {
      const res = await axios.get('https://v26.onrender.com/api/posts/public');
      setBroadcasts(res.data);
    } catch (err) {
      try {
        const fallback = await axios.get('https://v26.onrender.com/api/posts/public-feed');
        setBroadcasts(fallback.data);
      } catch (e) {
        console.error("Feed sync error:", e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleCreatePost = async () => {
    if (!quickText.trim() && selectedFiles.length === 0) return;
    setPublishing(true);
    try {
      const postData = {
        authorEmail: currentUserEmail,
        authorName: currentUserEmail ? currentUserEmail.split('@')[0] : "Creator",
        text: quickText.trim(),
        media: selectedFiles.length > 0 ? selectedFiles.map(f => URL.createObjectURL(f)) : null,
        visibility: 'public'
      };
      const res = await axios.post('https://v26.onrender.com/api/posts/create', postData);
      setBroadcasts([res.data, ...broadcasts]);
      setQuickText('');
      setSelectedFiles([]);
      setShowPostModal(false);
    } catch (err) {
      alert("Failed to publish vision transmission.");
    } finally {
      setPublishing(false);
    }
  };

  const handleInspire = async (postId: string) => {
    if (!currentUserEmail) return alert("Sign in to transmit inspiration footprints.");

    setBroadcasts(prev => prev.map(post => {
      if (post._id !== postId) return post;
      const currentLikes = post.likes || [];
      const alreadyLiked = currentLikes.includes(currentUserEmail);
      const updated = alreadyLiked 
        ? currentLikes.filter(e => e !== currentUserEmail)
        : [...currentLikes, currentUserEmail];
      return { ...post, likes: updated };
    }));

    try {
      await axios.post(`https://v26.onrender.com/api/posts/inspire/${postId}`, { email: currentUserEmail });
    } catch {
      fetchFeed();
    }
  };

  const handleSendComment = async (postId: string) => {
    if (!commentText.trim() || !currentUserEmail) return;
    setSubmittingComment(true);
    const userName = currentUserEmail.split('@')[0];

    try {
      const res = await axios.post(`https://v26.onrender.com/api/posts/echo/${postId}`, {
        userEmail: currentUserEmail,
        userName,
        text: commentText.trim()
      });
      const updated = res.data.comments;
      setBroadcasts(prev => prev.map(p => p._id === postId ? { ...p, comments: updated } : p));
      if (activeDiscussionPost?._id === postId) {
        setActiveDiscussionPost(prev => prev ? { ...prev, comments: updated } : null);
      }
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const talentCategories = [
    { id: 'All', label: '✦ All Streams' },
    { id: 'Art', label: '🎨 Art & Architecture' },
    { id: 'Music', label: '🎵 Soundwaves' },
    { id: 'Development', label: '💻 Core Systems' },
    { id: 'Chemistry', label: '🧪 Science Labs' },
    { id: 'Business', label: '💼 Enterprise' }
  ];

  return (
    <div className="v26-stream-root">
      
      {/* 1. SIGNATURE HEADER */}
      <header className="v26-top-matrix-bar">
        <div className="v26-brand-badge">
          <span className="v26-brand-title">v26</span>
          <span className="v26-brand-tagline">DISCOVER // FEED</span>
        </div>
        <div className="v26-matrix-actions">
          <button className="v26-glass-btn" onClick={() => setShowPostModal(true)}>
            <span>＋</span>
          </button>
          <button className="v26-glass-btn" onClick={() => router.push('/signals')}>
            <span>📡</span>
          </button>
        </div>
      </header>

      <div className="v26-stream-container">

        {/* 2. TRANSMIT VISION QUICK BAR */}
        <div className="v26-transmit-box">
          <div className="v26-transmit-row">
            <div className="v26-creator-hex">
              {(currentUserEmail || 'V')[0].toUpperCase()}
            </div>
            <button className="v26-transmit-prompt" onClick={() => setShowPostModal(true)}>
              <span>Transmit vision or drop media onto stream...</span>
            </button>
            <button className="v26-media-shortcut" onClick={() => setShowPostModal(true)}>
              ✦
            </button>
          </div>
        </div>

        {/* 3. CREATIVE BURSTS / VISION SPARKS CAROUSEL */}
        <div className="v26-bursts-section">
          <div className="v26-section-label">
            <span>ACTIVE BURSTS</span>
            <span className="v26-pulse-indicator" />
          </div>
          <div className="v26-bursts-scroller">
            
            {/* Create Spark Tile */}
            <div className="v26-spark-card v26-spark-create" onClick={() => setShowPostModal(true)}>
              <div className="v26-spark-create-icon">＋</div>
              <span className="v26-spark-create-text">Drop Spark</span>
            </div>

            {/* Active Sparks */}
            {broadcasts.filter(b => b.media && b.media.length > 0).slice(0, 8).map((story, i) => (
              <div 
                key={story._id || i} 
                className="v26-spark-card" 
                onClick={() => {
                  const el = document.getElementById(story._id);
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <img 
                  src={story.media![0].startsWith('http') ? story.media![0] : `https://v26.onrender.com${story.media![0]}`} 
                  alt="Spark" 
                  className="v26-spark-asset" 
                  onError={(e) => { (e.target as HTMLElement).style.opacity = '0.3'; }}
                />
                <div className="v26-spark-overlay">
                  <div className="v26-spark-pip">
                    {(story.authorName || story.authorEmail)[0].toUpperCase()}
                  </div>
                  <span className="v26-spark-name">{story.authorName || story.authorEmail.split('@')[0]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. KINETIC CATEGORY PILL STRIP */}
        <div className="v26-spheres-strip">
          {talentCategories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setActiveFilter(cat.id)}
              className={`v26-sphere-pill ${activeFilter === cat.id ? 'v26-sphere-active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 5. STREAM TRANSMISSIONS TIMELINE */}
        <main className="v26-broadcast-stream">
          {loading ? (
            <div className="v26-stream-status">Synchronizing frequency feed...</div>
          ) : broadcasts.length === 0 ? (
            <div className="v26-empty-matrix">
              <span style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }}>📡</span>
              <p style={{ margin: 0, fontWeight: 700, color: '#fafafa' }}>Zero active broadcasts detected.</p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: '#71717a' }}>Initialize a transmission above to launch this channel.</p>
            </div>
          ) : (
            broadcasts.map(post => {
              const likes = post.likes || [];
              const comments = post.comments || [];
              const isLiked = currentUserEmail ? likes.includes(currentUserEmail) : false;

              return (
                <article key={post._id} id={post._id} className="v26-post-matrix-card">
                  
                  {/* Transmission Identity Bar */}
                  <div className="v26-card-identity">
                    <div 
                      className="v26-author-crest"
                      onClick={() => router.push(`/profile?user=${encodeURIComponent(post.authorEmail)}`)}
                    >
                      {(post.authorName || post.authorEmail)[0].toUpperCase()}
                    </div>
                    <div className="v26-meta-details">
                      <div className="v26-author-line">
                        <span 
                          className="v26-author-alias"
                          onClick={() => router.push(`/profile?user=${encodeURIComponent(post.authorEmail)}`)}
                        >
                          {post.authorName || post.authorEmail.split('@')[0]}
                        </span>
                        <span className="v26-active-dot" />
                      </div>
                      <span className="v26-transmission-time">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • Transmission
                      </span>
                    </div>
                    <span className="v26-visibility-pill">{post.visibility}</span>
                  </div>

                  {/* Body Content */}
                  {post.text && <p className="v26-card-text">{post.text}</p>}

                  {/* Media Frame */}
                  {post.media && post.media.length > 0 && (
                    <div className="v26-media-frame">
                      {post.media[0].endsWith('.mp4') || post.media[0].endsWith('.webm') ? (
                        <video 
                          src={post.media[0].startsWith('http') ? post.media[0] : `https://v26.onrender.com${post.media[0]}`} 
                          controls 
                          playsInline 
                          className="v26-frame-asset" 
                        />
                      ) : (
                        <img 
                          src={
                            post.media[0].startsWith('http') || post.media[0].startsWith('data:') || post.media[0].startsWith('blob:')
                              ? post.media[0]
                              : `https://v26.onrender.com/${post.media[0].replace(/^\/+/, '')}`
                          } 
                          alt="" 
                          className="v26-frame-asset" 
                          loading="lazy" 
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      )}
                    </div>
                  )}

                  {/* Telemetry Counter Strip */}
                  <div className="v26-telemetry-row">
                    <div className="v26-sparks-count">
                      <span>⚡</span>
                      <span>{likes.length} Sparks</span>
                    </div>
                    <div className="v26-echoes-count" onClick={() => setActiveDiscussionPost(post)}>
                      <span>{comments.length} Echoes</span>
                    </div>
                  </div>

                  {/* Interactive Trigger Row */}
                  <div className="v26-triggers-row">
                    <button 
                      onClick={() => handleInspire(post._id)} 
                      className={`v26-trigger-btn ${isLiked ? 'v26-inspired' : ''}`}
                    >
                      <span>⚡</span> <span>{isLiked ? 'Inspired' : 'Inspire'}</span>
                    </button>
                    <button 
                      onClick={() => setActiveDiscussionPost(post)} 
                      className="v26-trigger-btn"
                    >
                      <span>💬</span> <span>Echo</span>
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/discover#${post._id}`);
                        alert("Transmission frequency link copied.");
                      }} 
                      className="v26-trigger-btn"
                    >
                      <span>🔗</span> <span>Link</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </main>

      </div>

      {/* CREATE MODAL */}
      {showPostModal && (
        <div className="v26-modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="v26-modal-panel" onClick={e => e.stopPropagation()}>
            <div className="v26-modal-header">
              <span className="v26-modal-title">NEW STREAM TRANSMISSION</span>
              <button className="v26-modal-close" onClick={() => setShowPostModal(false)}>✕</button>
            </div>
            
            <textarea 
              value={quickText} 
              onChange={e => setQuickText(e.target.value)} 
              placeholder="What vision or technical breakthrough are you broadcasting?" 
              className="v26-modal-textarea" 
              autoFocus 
            />

            <div className="v26-modal-media-field">
              <label className="v26-attach-cta">
                <input 
                  type="file" 
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={e => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} 
                />
                ✦ <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) attached` : 'Attach Media, Reel, or Audio Track'}</span>
              </label>
            </div>

            <button 
              onClick={handleCreatePost} 
              disabled={publishing || (!quickText.trim() && selectedFiles.length === 0)} 
              className="v26-modal-launch-btn"
            >
              {publishing ? 'Broadcasting...' : 'Broadcast Transmission'}
            </button>
          </div>
        </div>
      )}

      {/* ECHOES DISCUSSION DRAWER */}
      {activeDiscussionPost && (
        <div className="v26-modal-backdrop" onClick={() => setActiveDiscussionPost(null)}>
          <div className="v26-echoes-drawer" onClick={e => e.stopPropagation()}>
            <div className="v26-modal-header">
              <span className="v26-modal-title">DISCUSSION ECHOES</span>
              <button className="v26-modal-close" onClick={() => setActiveDiscussionPost(null)}>✕</button>
            </div>

            <div className="v26-echoes-feed">
              {(activeDiscussionPost.comments || []).length === 0 ? (
                <div className="v26-empty-echoes">No echoes transmitted yet. Send the first perspective.</div>
              ) : (
                activeDiscussionPost.comments!.map((c, idx) => (
                  <div key={c._id || idx} className="v26-echo-unit">
                    <div className="v26-echo-crest">{(c.userName || 'C')[0].toUpperCase()}</div>
                    <div className="v26-echo-body">
                      <span className="v26-echo-user">{c.userName}</span>
                      <p className="v26-echo-text">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="v26-echo-composer">
              <input 
                value={commentText} 
                onChange={e => setCommentText(e.target.value)} 
                placeholder="Echo a thought or feedback..." 
                className="v26-echo-input" 
                onKeyDown={e => e.key === 'Enter' && handleSendComment(activeDiscussionPost._id)} 
              />
              <button 
                onClick={() => handleSendComment(activeDiscussionPost._id)} 
                disabled={submittingComment} 
                className="v26-echo-submit"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />

      <style jsx global>{`
        /* Root & Canvas */
        .v26-stream-root {
          background-color: #08080a;
          min-height: 100vh;
          color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          letter-spacing: -0.01em;
        }

        /* Matrix Header */
        .v26-top-matrix-bar {
          position: sticky;
          top: 0;
          background: rgba(8, 8, 10, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .v26-brand-badge { display: flex; flex-direction: column; }
        .v26-brand-title {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -1px;
          background: linear-gradient(135deg, #ffffff 40%, #818cf8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .v26-brand-tagline {
          font-size: 0.55rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          color: #52525b;
          font-family: monospace;
        }
        .v26-matrix-actions { display: flex; gap: 8px; }
        .v26-glass-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #121216;
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .v26-glass-btn:hover { border-color: #6366f1; }

        .v26-stream-container {
          max-width: 540px;
          margin: 0 auto;
          padding-bottom: 95px;
        }

        /* Transmit Vision Bar */
        .v26-transmit-box {
          margin: 12px 14px;
          background: #0e0e12;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 10px 14px;
        }
        .v26-transmit-row { display: flex; align-items: center; gap: 12px; }
        .v26-creator-hex {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #1c1c24, #272733);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          color: #818cf8;
          flex-shrink: 0;
        }
        .v26-transmit-prompt {
          flex: 1;
          background: transparent;
          border: none;
          color: #52525b;
          text-align: left;
          font-size: 0.82rem;
          cursor: pointer;
          padding: 4px 0;
        }
        .v26-media-shortcut {
          background: rgba(99, 102, 241, 0.1);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          color: #818cf8;
          font-size: 0.85rem;
          padding: 6px 10px;
          cursor: pointer;
        }

        /* Bursts / Sparks Section */
        .v26-bursts-section { padding: 8px 0 12px 0; }
        .v26-section-label {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px 8px 16px;
          font-size: 0.6rem;
          font-weight: 800;
          letter-spacing: 1.2px;
          color: #71717a;
          font-family: monospace;
        }
        .v26-pulse-indicator {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }
        .v26-bursts-scroller {
          display: flex;
          gap: 10px;
          padding: 0 14px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .v26-bursts-scroller::-webkit-scrollbar { display: none; }

        .v26-spark-card {
          width: 96px;
          height: 140px;
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          background: #121217;
          border: 1px solid rgba(255, 255, 255, 0.06);
          flex-shrink: 0;
          cursor: pointer;
        }
        .v26-spark-asset {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .v26-spark-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(8, 8, 10, 0.95) 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 8px;
        }
        .v26-spark-pip {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          background: #08080a;
          border: 1px solid #6366f1;
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 800;
          margin-bottom: 4px;
        }
        .v26-spark-name {
          font-size: 0.65rem;
          font-weight: 700;
          color: #fafafa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .v26-spark-create {
          background: #0e0e13;
          border: 1px dashed rgba(99, 102, 241, 0.3);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .v26-spark-create-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #6366f1;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 0.9rem;
        }
        .v26-spark-create-text {
          font-size: 0.65rem;
          font-weight: 700;
          color: #818cf8;
        }

        /* Spheres Strip */
        .v26-spheres-strip {
          display: flex;
          gap: 6px;
          padding: 6px 14px 14px 14px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .v26-spheres-strip::-webkit-scrollbar { display: none; }
        .v26-sphere-pill {
          background: #111116;
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #71717a;
          white-space: nowrap;
          cursor: pointer;
        }
        .v26-sphere-active {
          background: #181822 !important;
          color: #818cf8 !important;
          border-color: rgba(99, 102, 241, 0.4) !important;
          font-weight: 700;
        }

        /* Post Matrix Cards */
        .v26-broadcast-stream { display: flex; flex-direction: column; gap: 12px; padding: 0 14px; }
        .v26-post-matrix-card {
          background: #0e0e13;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          padding: 16px;
        }
        .v26-card-identity { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .v26-author-crest {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: #181820;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #e4e4e7;
          cursor: pointer;
        }
        .v26-meta-details { flex: 1; display: flex; flex-direction: column; }
        .v26-author-line { display: flex; align-items: center; gap: 6px; }
        .v26-author-alias {
          font-size: 0.88rem;
          font-weight: 700;
          color: #fafafa;
          cursor: pointer;
        }
        .v26-active-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #6366f1;
        }
        .v26-transmission-time { font-size: 0.68rem; color: #52525b; font-family: monospace; }
        .v26-visibility-pill {
          font-size: 0.58rem;
          font-weight: 800;
          text-transform: uppercase;
          background: #14141c;
          border: 1px solid rgba(255, 255, 255, 0.06);
          padding: 3px 6px;
          border-radius: 6px;
          color: #71717a;
        }

        .v26-card-text {
          font-size: 0.9rem;
          line-height: 1.5;
          color: #d4d4d8;
          margin: 0 0 12px 0;
          white-space: pre-wrap;
        }

        .v26-media-frame {
          border-radius: 14px;
          overflow: hidden;
          background: #050507;
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 12px;
        }
        .v26-frame-asset {
          width: 100%;
          max-height: 420px;
          object-fit: cover;
          display: block;
        }

        /* Telemetry & Trigger Rows */
        .v26-telemetry-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.72rem;
          color: #52525b;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          margin-bottom: 4px;
          font-family: monospace;
        }
        .v26-echoes-count { cursor: pointer; }
        .v26-echoes-count:hover { color: #818cf8; }

        .v26-triggers-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
        .v26-trigger-btn {
          background: transparent;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          color: #71717a;
          font-size: 0.76rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .v26-trigger-btn:hover { background: #14141c; color: #f4f4f5; }
        .v26-inspired { color: #eab308 !important; font-weight: 800; }

        /* Modal & Drawer Elements */
        .v26-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(4, 4, 6, 0.85);
          backdrop-filter: blur(12px);
          z-index: 10000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .v26-modal-panel {
          width: 100%;
          max-width: 500px;
          background: #0f0f15;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: none;
          padding: 20px;
          box-sizing: border-box;
        }
        .v26-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 10px;
        }
        .v26-modal-title { font-size: 0.72rem; font-weight: 800; letter-spacing: 1.5px; color: #818cf8; font-family: monospace; }
        .v26-modal-close { background: transparent; border: none; color: #71717a; font-size: 1.1rem; cursor: pointer; }
        .v26-modal-textarea {
          width: 100%;
          height: 110px;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 0.95rem;
          resize: none;
          outline: none;
          box-sizing: border-box;
        }
        .v26-modal-media-field {
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          text-align: center;
          margin-bottom: 16px;
        }
        .v26-attach-cta { cursor: pointer; font-size: 0.78rem; color: #818cf8; }
        .v26-modal-launch-btn {
          width: 100%;
          padding: 12px;
          background: #6366f1;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
        }
        .v26-modal-launch-btn:disabled { background: #1c1c24; color: #52525b; cursor: not-allowed; }

        .v26-echoes-drawer {
          width: 100%;
          max-width: 500px;
          height: 72vh;
          background: #0f0f15;
          border-top-left-radius: 20px;
          border-top-right-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: none;
          padding: 18px;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }
        .v26-echoes-feed { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
        .v26-echo-unit { display: flex; gap: 10px; }
        .v26-echo-crest {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: #181822;
          color: #818cf8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 800;
          flex-shrink: 0;
        }
        .v26-echo-body { background: #15151e; border-radius: 12px; padding: 8px 12px; max-width: 85%; }
        .v26-echo-user { font-size: 0.7rem; font-weight: 700; color: #818cf8; display: block; margin-bottom: 2px; }
        .v26-echo-text { font-size: 0.82rem; color: #d4d4d8; margin: 0; }
        .v26-empty-echoes { text-align: center; color: #52525b; font-size: 0.8rem; padding: 40px 0; }

        .v26-echo-composer { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.05); }
        .v26-echo-input {
          flex: 1;
          background: #15151e;
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 10px 14px;
          color: #fff;
          font-size: 0.8rem;
          outline: none;
        }
        .v26-echo-submit {
          background: #6366f1;
          border: none;
          border-radius: 12px;
          padding: 0 16px;
          color: #fff;
          font-weight: 700;
          font-size: 0.78rem;
          cursor: pointer;
        }

        .v26-stream-status, .v26-empty-matrix {
          text-align: center;
          padding: 45px 20px;
          color: #52525b;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}