'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

interface CommentItem {
  _id?: string;
  userEmail?: string;
  userName?: string;
  user?: string;
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
  inspirations?: string[];
  comments?: CommentItem[];
  discussions?: CommentItem[];
}

export default function AdvancedMultimediaDiscoverPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<BroadcastPost[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(false);
  
  // Discussion / Echo Drawer State
  const [activeDiscussionPostId, setActiveDiscussionPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPublicFeed = async () => {
    try {
      const email = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;
      if (email) {
        try {
          const profileRes = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
          if (profileRes.data?.incomingRequest) setIncomingAlert(true);
        } catch (e) {
          // Continue even if profile check fails
        }
      }
      // Fetches public posts (supports both /public and /public-feed endpoints)
      const res = await axios.get('https://v26.onrender.com/api/posts/public');
      setBroadcasts(res.data);
    } catch (err) {
      try {
        const fallbackRes = await axios.get('https://v26.onrender.com/api/posts/public-feed');
        setBroadcasts(fallbackRes.data);
      } catch (fallbackErr) {
        console.error("Failed to fetch public feed arrays:", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicFeed();
    setIsMounted(true);
  }, []);

  const handleInspire = async (postId: string) => {
    const email = localStorage.getItem("v26UserEmail"); 
    if (!email) return alert("Please sign in to interact!");

    // Optimistic UI update
    setBroadcasts(prev => prev.map(post => {
      if (post._id !== postId) return post;
      const currentLikes = post.likes || post.inspirations || [];
      const alreadyLiked = currentLikes.includes(email);
      const updatedLikes = alreadyLiked 
        ? currentLikes.filter(e => e !== email)
        : [...currentLikes, email];
      return { ...post, likes: updatedLikes, inspirations: updatedLikes };
    }));

    try {
      await axios.post(`https://v26.onrender.com/api/posts/inspire/${postId}`, { email });
    } catch (err) {
      // Revert silently if request fails
      fetchPublicFeed();
    }
  };

  const handleDiscussSubmit = async (postId: string) => {
    if (!commentText.trim()) return;
    const email = localStorage.getItem('v26UserEmail');
    if (!email) return alert("Please sign in to contribute!");

    setSubmittingComment(true);
    const userName = email.split('@')[0] || "Creator";

    try {
      const response = await axios.post(`https://v26.onrender.com/api/posts/echo/${postId}`, { 
        userEmail: email,
        userName: userName,
        text: commentText.trim()
      });

      const updatedComments = response.data.comments || response.data.discussions;

      setBroadcasts(prev => prev.map(post => {
        if (post._id === postId) {
          return { ...post, comments: updatedComments, discussions: updatedComments };
        }
        return post;
      }));
      setCommentText('');
    } catch (err) {
      // Fallback to /discuss if legacy endpoint is being used
      try {
        const token = localStorage.getItem("v26Token");
        const fallbackRes = await axios.post(`https://v26.onrender.com/api/posts/${postId}/discuss`, {
          text: commentText,
          userName: userName
        }, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const updated = fallbackRes.data.discussions || fallbackRes.data.comments;
        setBroadcasts(prev => prev.map(post => post._id === postId ? { ...post, discussions: updated, comments: updated } : post));
        setCommentText('');
      } catch (e) {
        console.error(e);
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShareLink = (postId: string) => {
    const assetUrl = `${window.location.origin}/discover#${postId}`;
    navigator.clipboard.writeText(assetUrl).then(() => alert("Broadcast connection link copied!"));
  };

  // 🎥 MULTIMEDIA ASSET ENGINE (100% UNTOUCHED)
  const renderMultimediaAsset = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `https://v26.onrender.com${url}`;
    const extension = url.split('.').pop()?.toLowerCase();

    // 🎥 REELS / VIDEO INJECTION PIPELINE
    if (['mp4', 'webm', 'mov', 'quicktime'].includes(extension || '')) {
      return (
        <div className="media-reel-wrapper">
          <video 
            src={fullUrl} 
            controls 
            loop 
            playsInline 
            className="premium-native-video"
            preload="metadata"
          />
        </div>
      );
    }

    // 🎵 AUDIO ARCHITECTURE PIPELINE
    if (['mp3', 'wav', 'ogg', 'aac'].includes(extension || '')) {
      return (
        <div className="media-audio-wrapper">
          <div className="audio-wave-icon">🎵 Audio Broadcast Track</div>
          <audio src={fullUrl} controls className="premium-native-audio" />
        </div>
      );
    }

    // 🎨 PICTURE PIPELINE
    return (
      <div className="media-picture-wrapper">
        <img src={fullUrl} alt="V26 Broadcast Component" className="premium-native-img" loading="lazy" />
      </div>
    );
  };

  const talentCategories = [
    { id: 'All', label: '🌐 Global Feed' },
    { id: 'Art', label: '🎨 Visual Arts & Design' },
    { id: 'Music', label: '🎵 Music Architecture' },
    { id: 'Development', label: '💻 Systems & Software' },
    { id: 'Chemistry', label: '🧪 Scientific Research' },
    { id: 'Business', label: '💼 Strategy & Enterprise' },
    { id: 'Spiritual', label: '✨ Spiritual Leadership' },
    { id: 'Athletics', label: '⚡ Physical Sport' }
  ];

  const currentEmail = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;

  return (
    <div className="discover-root-layer">
      <div className="discover-split-layout">
        
        {/* LEFT FILTERS */}
        <aside className="discover-sidebar">
          <div style={{ marginBottom: '24px' }}>
            <h2 className="discover-heading-title">Discover</h2>
            <p className="discover-heading-sub">Perceive stream modules, cinematic reels, and project updates running along the bridge network.</p>
          </div>
          
          <div className="filter-card-stack">
            <span className="stack-mini-header">Talent Spheres</span>
            {talentCategories.map((cat) => (
              <button 
                key={cat.id} 
                onClick={() => setActiveFilter(cat.id)} 
                className={`filter-link-btn ${activeFilter === cat.id ? 'fl-active' : ''}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT STREAM TIMELINE */}
        <main className="discover-feed-stream">
          {loading ? (
            <div className="loading-shimmer-message">Synchronizing media bridge emissions...</div>
          ) : broadcasts.length === 0 ? (
            <div className="empty-feed-card">
              <p style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: '700' }}>No creative content uploaded.</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#52525b' }}>Publish reels or snapshots from your home console to launch the grid stream.</p>
            </div>
          ) : (
            broadcasts.map((post) => {
              const likesList = post.likes || post.inspirations || [];
              const commentsList = post.comments || post.discussions || [];
              const isLiked = currentEmail ? likesList.includes(currentEmail) : false;

              return (
                <article key={post._id} id={post._id} className="timeline-broadcast-card">
                  
                  {/* ACCOUNT PROFILE HEADER */}
                  <div className="post-header">
                    <div 
                      className="post-avatar" 
                      onClick={() => router.push(`/profile?user=${encodeURIComponent(post.authorEmail)}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {(post.authorName || post.authorEmail || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 
                        className="post-author-name"
                        onClick={() => router.push(`/profile?user=${encodeURIComponent(post.authorEmail)}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {post.authorName || post.authorEmail.split('@')[0]}
                      </h4>
                      <span className="post-timestamp">{isMounted ? new Date(post.createdAt).toLocaleDateString() : '...'}</span>
                    </div>
                    <span className="visibility-badge">{post.visibility}</span>
                  </div>

                  {/* TEXT AREA POST CONTENT */}
                  {post.text && <p className="post-main-text">{post.text}</p>}

                  {/* MULTIMEDIA DISPLAY ENGINE LAYER */}
                  {post.media && post.media.length > 0 && (
                    <div className={`multimedia-grid-layout ${post.media.length > 1 ? 'grid-split' : 'grid-solo'}`}>
                      {post.media.map((assetUrl, index) => (
                        <div key={index} className="multimedia-container-slot">
                          {renderMultimediaAsset(assetUrl)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* INTERACTION ROW TOOLBAR */}
                  <div className="post-action-toolbar">
                    <button 
                      onClick={() => handleInspire(post._id)} 
                      className={`toolbar-btn inspire-clr ${isLiked ? 'active-like' : ''}`}
                    >
                      ⚡ <span>{likesList.length > 0 ? likesList.length : 0} Inspire</span>
                    </button>
                    <button 
                      onClick={() => setActiveDiscussionPostId(activeDiscussionPostId === post._id ? null : post._id)} 
                      className={`toolbar-btn discuss-clr ${activeDiscussionPostId === post._id ? 'tb-open' : ''}`}
                    >
                      💬 <span>{commentsList.length > 0 ? commentsList.length : 0} Echoes</span>
                    </button>
                    <button onClick={() => handleShareLink(post._id)} className="toolbar-btn share-clr" style={{ marginLeft: 'auto' }}>
                      🔗 Share Link
                    </button>
                  </div>

                  {/* DYNAMIC DISCUSSION / ECHO BOARD DRAWER */}
                  {activeDiscussionPostId === post._id && (
                    <div className="discussion-drawer-panel">
                      <div className="discussion-messages-scroller">
                        {commentsList.length > 0 ? commentsList.map((disc, idx) => (
                          <div key={disc._id || idx} className="comment-bubble">
                            <span className="comment-author">{disc.userName || disc.user || 'Creator'}</span>
                            <p style={{ margin: 0, color: '#e4e4e7' }}>{disc.text}</p>
                          </div>
                        )) : <p style={{ fontSize: '0.8rem', color: '#52525b', margin: 0 }}>Silence implies observation. Drop a perspective below.</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <input 
                          value={commentText} 
                          onChange={(e) => setCommentText(e.target.value)} 
                          placeholder="Contribute depth..." 
                          className="comment-input-field" 
                          onKeyDown={(e) => e.key === 'Enter' && handleDiscussSubmit(post._id)}
                        />
                        <button onClick={() => handleDiscussSubmit(post._id)} disabled={submittingComment} className="comment-submit-btn">
                          {submittingComment ? '...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>
      </div>

      {/* 📱 UNIFIED 4-TAB BOTTOM NAVIGATION */}
      <BottomNav hasNotification={incomingAlert} />

      <style jsx global>{`
        /* --- CORE PAGE STYLES --- */
        .discover-root-layer { background-color: #09090b; min-height: 100vh; color: #fff; padding-bottom: 80px; }
        .discover-split-layout { max-width: 1040px; margin: 0 auto; display: flex; flex-direction: row; gap: 40px; padding: 40px 20px; }
        .discover-sidebar { width: 260px; position: sticky; top: 40px; height: fit-content; }
        .discover-feed-stream { flex: 1; display: flex; flex-direction: column; gap: 24px; }

        .discover-heading-title { font-size: 1.6rem; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.5px; background: linear-gradient(to right, #fff, #a1a1aa); -webkit-background-clip: text; -webkit-text-fillColor: transparent; }
        .discover-heading-sub { color: #71717a; font-size: 0.8rem; line-height: 1.4; margin: 0; }

        /* --- SIDEBAR CLUSTER --- */
        .filter-card-stack { display: flex; flex-direction: column; gap: 4px; background: #0e0e11; padding: 14px; border-radius: 20px; border: 1px solid #18181b; }
        .stack-mini-header { font-size: 0.6rem; color: #52525b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; padding-left: 8px; }
        
        .filter-link-btn { width: 100%; text-align: left; padding: 10px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 500; background: transparent; color: #a1a1aa; border: none; cursor: pointer; transition: 0.2s; }
        .filter-link-btn:hover { color: #fff; background: #141416; }
        .fl-active { background: rgba(99, 102, 241, 0.08) !important; color: #818cf8 !important; font-weight: 700 !important; }

        /* --- BROADCAST TIMELINE CARDS --- */
        .timeline-broadcast-card { background: #0e0e11; border: 1px solid #18181b; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; }
        .post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; position: relative; }
        .post-avatar { width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #1c1c21, #27272a); border: 1px solid #27272a; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.85rem; color: #fff; transition: transform 0.15s ease; }
        .post-avatar:hover { transform: scale(1.05); }
        .post-author-name { font-size: 0.9rem; font-weight: 700; margin: 0 0 2px 0; color: #fafafa; }
        .post-author-name:hover { text-decoration: underline; }
        .post-timestamp { font-size: 0.75rem; color: #52525b; display: block; }
        .visibility-badge { position: absolute; right: 0; top: 6px; font-size: 0.6rem; font-weight: 800; text-transform: uppercase; background: #141416; border: 1px solid #18181b; padding: 3px 8px; border-radius: 6px; color: #71717a; }
        .post-main-text { font-size: 0.95rem; color: #e4e4e7; line-height: 1.55; margin: 0 0 16px 0; white-space: pre-wrap; }

        /* --- 🎥 SYSTEM MULTIMEDIA GRID ENGINE SYSTEM --- */
        .multimedia-grid-layout { display: grid; gap: 12px; margin-bottom: 16px; border-radius: 16px; overflow: hidden; width: 100%; }
        .grid-solo { grid-template-columns: 1fr; }
        .grid-split { grid-template-columns: 1fr 1fr; }
        .multimedia-container-slot { width: 100%; background: #09090b; border: 1px solid #18181b; border-radius: 14px; overflow: hidden; display: flex; justify-content: center; align-items: center; position: relative; }

        /* Video / Reel Aspect Lock */
        .media-reel-wrapper { width: 100%; aspect-ratio: 9 / 16; max-height: 480px; background: #000; display: flex; }
        .premium-native-video { width: 100%; height: 100%; object-fit: cover; background: #000; outline: none; }

        /* Picture Aspect Lock */
        .media-picture-wrapper { width: 100%; aspect-ratio: 4 / 3; display: flex; }
        .premium-native-img { width: 100%; height: 100%; object-fit: cover; }

        /* Audio Track Slot */
        .media-audio-wrapper { width: 100%; padding: 20px; background: #141416; display: flex; flex-direction: column; gap: 12px; box-sizing: border-box; }
        .audio-wave-icon { font-size: 0.8rem; font-weight: 700; color: #a1a1aa; display: flex; align-items: center; gap: 6px; }
        .premium-native-audio { width: 100%; height: 40px; outline: none; }

        /* --- ACTIONS ENGINE ROW --- */
        .post-action-toolbar { display: flex; gap: 20px; border-top: 1px solid #18181b; padding-top: 14px; }
        .toolbar-btn { background: transparent; border: none; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .toolbar-btn:hover { opacity: 0.7; }
        .inspire-clr { color: #71717a; }
        .inspire-clr.active-like { color: #eab308 !important; font-weight: 800; }
        .discuss-clr { color: #71717a; }
        .tb-open { color: #6366f1 !important; font-weight: 800; }
        .share-clr { color: #52525b; }

        /* --- DISCUSSIONS ENGINE LAYERS --- */
        .discussion-drawer-panel { background: #09090b; border-radius: 16px; padding: 14px; margin-top: 14px; border: 1px solid #18181b; }
        .discussion-messages-scroller { display: flex; flex-direction: column; gap: 8px; max-height: 180px; overflow-y: auto; }
        .comment-bubble { background: #0e0e11; padding: 10px 12px; border-radius: 12px; font-size: 0.85rem; border: 1px solid #18181b; }
        .comment-author { font-size: 0.75rem; font-weight: 700; color: #818cf8; display: block; margin-bottom: 2px; }
        .comment-input-field { flex: 1; background: #0e0e11; border: 1px solid #18181b; border-radius: 8px; padding: 10px; font-size: 0.8rem; color: #fff; outline: none; }
        .comment-submit-btn { background: #fff; color: #000; font-weight: 700; border: none; border-radius: 8px; padding: 0 14px; font-size: 0.8rem; cursor: pointer; }

        /* --- UTILITIES --- */
        .loading-shimmer-message { color: #52525b; font-size: 0.85rem; text-align: center; padding: 40px; font-weight: 600; }
        .empty-feed-card { background: #0e0e11; border: 1px solid #18181b; border-radius: 24px; padding: 40px; text-align: center; color: #71717a; }

        /* --- ADAPTIVE MOBILE LAYOUT --- */
        @media (max-width: 850px) {
          .discover-split-layout { flex-direction: column !important; gap: 24px; padding: 20px; }
          .discover-sidebar { width: 100% !important; position: relative !important; top: 0 !important; }
          .filter-card-stack { display: grid !important; grid-template-columns: 1fr 1fr; gap: 6px; }
        }
      `}</style>
    </div>
  );
}