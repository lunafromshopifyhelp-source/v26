'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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

export default function StandaloneDiscoverFeedPage() {
  const router = useRouter();
  const [broadcasts, setBroadcasts] = useState<BroadcastPost[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(false);
  
  const [activeDiscussionPostId, setActiveDiscussionPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchPublicFeed = async () => {
    try {
      const email = localStorage.getItem('v26UserEmail');
      if (email) {
        const profileRes = await axios.get(`https://v26.onrender.com/api/auth/profile/${email}`);
        if (profileRes.data.incomingRequest) setIncomingAlert(true);
      }
      const res = await axios.get('https://v26.onrender.com/api/posts/public-feed');
      setBroadcasts(res.data);
    } catch (err) {
      console.error("Failed to fetch global public feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicFeed();
    setIsMounted(true);
  }, []);

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
      if (!token) return alert("Please sign in to contribute to the discussion thread!");

      const response = await axios.post(`https://v26.onrender.com/api/posts/${postId}/discuss`, { 
        text: commentText, 
        userName: localStorage.getItem('v26UserEmail')?.split('@')[0] || "Creator" 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBroadcasts(prev => prev.map(post => post._id === postId ? { ...post, discussions: response.data.discussions } : post));
      setCommentText('');
    } catch (err) { 
      console.error(err); 
    } finally { setSubmittingComment(false); }
  };

  const handleShareLink = (postId: string) => {
    const assetUrl = `${window.location.origin}/discover#${postId}`;
    navigator.clipboard.writeText(assetUrl).then(() => alert("Broadcast connection link copied!"));
  };

  const talentCategories = [
    { id: 'All', label: '🌐 Global Feed' },
    { id: 'Art', label: '🎨 Visual Arts & Design' },
    { id: 'Music', label: '🎵 Music Architecture' },
    { id: 'Development', label: '💻 Systems & Software' },
    { id: 'Chemistry', label: '🧪 Scientific Research' },
    { id: 'Business', label: '💼 Strategy & Enterprise' },
    { id: 'Spiritual', label: '✨ Spiritual Leadership' },
    { id: 'Agri', label: '🌱 Agriculture & Eco' },
    { id: 'Athletics', label: '⚡ Physical Sport' },
    { id: 'Other', label: '🔮 Other Divine Gifts' }
  ];

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#fff', padding: '40px 20px', paddingBottom: '95px', fontFamily: 'system-ui, sans-serif' }}>
      <div className="discover-split-layout">
        
        {/* LEFT COMPONENT: STICKY FILTERS */}
        <aside className="discover-sidebar">
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discover</h2>
            <p style={{ color: '#71717a', fontSize: '0.85rem', lineHeight: '1.4' }}>Perceive and interact with the public progress updates shared across the network.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#141416', padding: '16px', borderRadius: '20px', border: '1px solid #27272a' }}>
            <span style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', paddingLeft: '8px' }}>Talent Spheres</span>
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

        {/* RIGHT COMPOSER HUB: FEEDS AND CONNECTIONS ENGINE */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
            <div style={{ color: '#71717a', fontSize: '0.9rem', textAlign: 'center', padding: '40px' }}>Synchronizing bridge feed emissions...</div>
          ) : broadcasts.length === 0 ? (
            <div style={{ background: '#141416', borderRadius: '20px', border: '1px solid #27272a', padding: '60px', textAlign: 'center', color: '#71717a' }}>
              <p style={{ fontSize: '0.95rem' }}>No public bridge transmissions found.</p>
            </div>
          ) : (
            broadcasts.map((post) => (
              <article key={post._id} id={post._id} style={{ background: '#141416', borderRadius: '24px', border: '1px solid #27272a', padding: '28px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
                    {(post.authorEmail || 'C')[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', margin: 0 }}>{post.authorName || post.authorEmail.split('@')[0]}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{isMounted ? new Date(post.createdAt).toLocaleDateString() : '...'}</span>
                  </div>
                </div>

                <p style={{ fontSize: '1.05rem', color: '#e4e4e7', lineHeight: '1.6', whiteSpace: 'pre-wrap', marginBottom: '20px' }}>{post.text}</p>

                {post.media && post.media.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: post.media.length > 1 ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '20px', borderRadius: '16px', overflow: 'hidden' }}>
                    {post.media.map((imgUrl, i) => (
                      <img key={i} src={imgUrl.startsWith('http') ? imgUrl : `https://v26.onrender.com${imgUrl}`} alt="capture" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #27272a' }} />
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #27272a', paddingTop: '16px' }}>
                  <button onClick={() => handleInspire(post._id)} style={{ background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>⚡ <span>{post.inspirations ? post.inspirations.length : 0} Inspire</span></button>
                  <button onClick={() => setActiveDiscussionPostId(activeDiscussionPostId === post._id ? null : post._id)} style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>💬 <span>{post.discussions ? post.discussions.length : 0} Discuss</span></button>
                  <button onClick={() => handleShareLink(post._id)} style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '0.85rem', cursor: 'pointer', marginLeft: 'auto' }}>🔗 Share Link</button>
                </div>

                {activeDiscussionPostId === post._id && (
                  <div style={{ background: '#09090b', borderRadius: '16px', padding: '16px', marginTop: '16px', border: '1px solid #27272a' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '180px', overflowY: 'auto' }}>
                      {post.discussions && post.discussions.length > 0 ? post.discussions.map(disc => (
                        <div key={disc._id} style={{ background: '#141416', padding: '10px', borderRadius: '12px', border: '1px solid #27272a' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#a5b4fc', display: 'block', marginBottom: '2px' }}>{disc.userName}</span>
                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#e4e4e7' }}>{disc.text}</p>
                        </div>
                      )) : <p style={{ fontSize: '0.8rem', color: '#52525b', margin: 0 }}>Silence implies observation. Drop a perspective below.</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                      <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Contribute insight..." style={{ flex: 1, background: '#141416', border: '1px solid #27272a', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '0.85rem', outline: 'none' }} />
                      <button onClick={() => handleDiscussSubmit(post._id)} disabled={submittingComment} style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '0 16px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>Send</button>
                    </div>
                  </div>
                )}
              </article>
            ))
          )}
        </main>
      </div>

      {/* 📱 NATIVE FIXED APP BAR NAVIGATION BAR */}
      <footer className="native-app-bottom-bar">
        <button onClick={() => router.push('/workspace')} className="nav-icon-tab">
          <span className="tab-emoji">制造</span><span className="tab-label-text">Workspace</span>
        </button>
        <button onClick={() => router.push('/signals')} className="nav-icon-tab">
          <span className="tab-emoji" style={{ position: 'relative' }}>连 {incomingAlert && <span className="notification-ping-dot"></span>}</span>
          <span className="tab-label-text">Signals</span>
        </button>
        <button onClick={() => router.push('/discover')} className="nav-icon-tab tab-active">
          <span className="tab-emoji">界</span><span className="tab-label-text">Discover</span>
        </button>
      </footer>

      <style jsx global>{`
        .discover-split-layout { max-width: 1100px; margin: 0 auto; display: flex; flex-direction: row; gap: 40px; }
        .discover-sidebar { width: 280px; position: sticky; top: 40px; height: fit-content; }
        
        .filter-link-btn {
          width: 100%;
          text-align: left;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          background: transparent;
          color: #a1a1aa;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-link-btn:hover { color: #fff; background: #141416; }
        .fl-active {
          background: rgba(99, 102, 241, 0.08) !important;
          color: #818cf8 !important;
          font-weight: 700 !important;
        }

        .native-app-bottom-bar { position: fixed; bottom: 0; left: 0; width: 100%; height: 65px; background: rgba(17, 17, 19, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border-top: 1px solid #18181b; display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; z-index: 1000; }
        .nav-icon-tab { background: transparent; border: none; color: #52525b; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; height: 100%; justify-content: center; }
        .tab-emoji { font-size: 0.95rem; font-weight: 800; }
        .tab-label-text { font-size: 0.55rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .tab-active { color: #fff !important; }
        .notification-ping-dot { position: absolute; top: 1px; right: -5px; width: 5px; height: 5px; background: #6366f1; border-radius: 50%; box-shadow: 0 0 6px #6366f1; }
        
        @media (max-width: 850px) {
          .discover-split-layout { flex-direction: column !important; gap: 20px; }
          .discover-sidebar { width: 100% !important; position: relative !important; top: 0 !important; }
        }
      `}</style>
    </div>
  );
}