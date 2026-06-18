'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// 1. Re-mapped from Vault Files to true Bridge Broadcast structures
interface BroadcastPost {
  _id: string;
  authorEmail: string;
  authorName: string;
  text: string;
  media: string[] | null; // Multi-image support from Bridge posts
  visibility: 'private' | 'partner' | 'public';
  createdAt: string;
  inspirations?: string[]; // Upvote interactions on the post
  discussions?: {
    _id: string;
    user: string;
    userName: string;
    text: string;
    createdAt: string;
  }[];
}

export default function DiscoverFeed() {
  const [broadcasts, setBroadcasts] = useState<BroadcastPost[]>([]);
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const [activeDiscussionPostId, setActiveDiscussionPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchPublicFeed = async () => {
      try {
        // 2. Swapped to hit your Bridge's public-feed router endpoint instead of projects
        const res = await axios.get('http://localhost:5000/api/posts/public-feed');
        setBroadcasts(res.data);
      } catch (err) {
        console.error("Failed to transmit global public bridge feed data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPublicFeed();
    setIsMounted(true);
  }, []);

  const handleInspire = async (postId: string) => {
    try {
      const token = localStorage.getItem("v26Token"); 
      if (!token) {
        alert("Please sign in to leave an inspirational footprint!");
        return;
      }

      // Hits your interaction engine configured for bridge posts
      const res = await axios.post(
        `http://localhost:5000/api/posts/${postId}/inspire`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBroadcasts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            let updatedInspirations = post.inspirations ? [...post.inspirations] : [];
            if (res.data.hasInspired) {
              updatedInspirations.push("client-auth-holder");
            } else {
              updatedInspirations.pop();
            }
            return { ...post, inspirations: updatedInspirations };
          }
          return post;
        })
      );
    } catch (err: any) {
      console.error("Interaction transmission failed:", err.response?.data?.message || err.message);
    }
  };

  const handleDiscussSubmit = async (postId: string) => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const token = localStorage.getItem("v26Token");
      if (!token) {
        alert("Please sign in to contribute to the discussion thread!");
        setSubmittingComment(false);
        return;
      }

      const response = await axios.post(
        `http://localhost:5000/api/posts/${postId}/discuss`,
        { text: commentText, userName: localStorage.getItem('v26UserEmail')?.split('@')[0] || "Creator" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBroadcasts((prev) =>
        prev.map((post) => {
          if (post._id === postId) {
            return { ...post, discussions: response.data.discussions };
          }
          return post;
        })
      );
      setCommentText('');
    } catch (err: any) {
      console.error("Discussion submission error:", err.response?.data?.message || err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShareLink = (postId: string) => {
    const assetUrl = `${window.location.origin}/fyp#${postId}`;
    navigator.clipboard.writeText(assetUrl)
      .then(() => alert("Broadcast connection link copied to clipboard!"))
      .catch((err) => console.error("Clipboard copy failed:", err));
  };

  // Realigned dropdown filters to look out for corresponding profile spheres if needed
  const talentCategories = [
    { id: 'All', label: '🌐 Global Feed' },
    { id: 'Art', label: '🎨 Visual Arts & Design' },
    { id: 'Music', label: '🎵 Music & Sound Architecture' },
    { id: 'Development', label: '💻 Software & Systems' },
    { id: 'Chemistry', label: '🧪 Scientific Research' },
    { id: 'Business', label: '💼 Enterprise & Strategy' },
    { id: 'Spiritual', label: '✨ Spiritual Leadership' },
    { id: 'Agri', label: '🌱 Agriculture & Eco' },
    { id: 'Athletics', label: '⚡ Physical Talent & Sport' },
    { id: 'Other', label: '🔮 Other Divine Gifts' }
  ];

  // Filters posts by author profile type or categories if assigned on creation
  const filteredBroadcasts = activeFilter === 'All' 
    ? broadcasts 
    : broadcasts; // Add specific filter loops here when categories are attached to bridge posts

  return (
    <div style={{ background: '#09090b', minHeight: '100vh', color: '#fff', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
        
        {/* LEFT HUB: FILTERS */}
        <aside style={{ position: 'sticky', top: '40px', height: 'fit-content' }}>
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px', background: 'linear-gradient(to right, #fff, #a1a1aa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Discover</h2>
            <p style={{ color: '#71717a', fontSize: '0.85rem', lineHeight: '1.4' }}>Perceive and interact with the public progress updates shared across the network.</p>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#141416', padding: '16px', borderRadius: '20px', border: '1px solid #27272a' }}>
            <span style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: '12px', marginBottom: '8px' }}>Talent Spheres</span>
            {talentCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: '10px',
                  fontSize: '0.85rem', fontWeight: activeFilter === cat.id ? '600' : '400',
                  background: activeFilter === cat.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  color: activeFilter === cat.id ? '#818cf8' : '#a1a1aa',
                  border: activeFilter === cat.id ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </aside>

        {/* RIGHT HUB: BRIDGE TRANSMISSIONS FEED */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {loading ? (
            <div style={{ color: '#71717a', fontSize: '0.9rem', textAlign: 'center', padding: '40px' }}>Synchronizing bridge feed emissions...</div>
          ) : filteredBroadcasts.length === 0 ? (
            <div style={{ background: '#141416', borderRadius: '20px', border: '1px solid #27272a', padding: '60px', textAlign: 'center', color: '#71717a' }}>
              <p style={{ fontSize: '0.95rem', marginBottom: '4px' }}>No public bridge transmissions found.</p>
              <p style={{ fontSize: '0.8rem' }}>Broadcast a progress log to public status from your dashboard to start the spark.</p>
            </div>
          ) : (
            filteredBroadcasts.map((post) => (
              <article 
                key={post._id} 
                id={post._id}
                style={{ 
                  background: '#141416', borderRadius: '24px', border: '1px solid #27272a',
                  padding: '28px', position: 'relative', overflow: 'hidden'
                }}
              >
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, #4f46e5, #c084fc)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1rem', color: '#fff' }}>
                      {(post.authorEmail || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#fff' }}>{post.authorName || post.authorEmail.split('@')[0]}</h4>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          📡 Broadcast
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#52525b' }}>
                        {isMounted ? new Date(post.createdAt).toLocaleDateString() : 'Syncing time...'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* TEXT AREA WIN POST CONTENT */}
                <div style={{ marginBottom: '24px' }}>
                  <p style={{ fontSize: '1.05rem', color: '#e4e4e7', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{post.text}</p>
                </div>

                {/* DYNAMIC MULTI-IMAGE GALLERY INTERCEPTOR */}
                {post.media && post.media.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: post.media.length > 1 ? '1fr 1fr' : '1fr', gap: '12px', marginBottom: '24px', borderRadius: '16px', overflow: 'hidden' }}>
                    {post.media.map((imgUrl, i) => (
                      <img 
                        key={i} 
                        src={imgUrl.startsWith('http') ? imgUrl : `http://localhost:5000${imgUrl}`} 
                        alt="broadcast capture" 
                        style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #27272a' }} 
                      />
                    ))}
                  </div>
                )}

                {/* INTERACTION HUB */}
                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid #27272a', paddingTop: '20px', marginBottom: activeDiscussionPostId === post._id ? '20px' : '0px' }}>
                  <button 
                    onClick={() => handleInspire(post._id)}
                    style={{ background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    ⚡ <span>{post.inspirations ? post.inspirations.length : 0} Inspire</span>
                  </button>
                  
                  <button 
                    onClick={() => setActiveDiscussionPostId(activeDiscussionPostId === post._id ? null : post._id)}
                    style={{ background: 'transparent', border: 'none', color: activeDiscussionPostId === post._id ? '#818cf8' : '#a1a1aa', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500' }}
                  >
                    💬 <span>{post.discussions ? post.discussions.length : 0} Discuss</span>
                  </button>
                  
                  <button 
                    onClick={() => handleShareLink(post._id)}
                    style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginLeft: 'auto' }}
                  >
                    🔗 Share Link
                  </button>
                </div>

                {/* DRAWER PANEL */}
                {activeDiscussionPostId === post._id && (
                  <div style={{ borderTop: '1px solid #27272a', paddingTop: '20px', background: '#09090b', borderRadius: '16px', padding: '16px', marginTop: '16px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Discussion Thread</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                      {post.discussions && post.discussions.length > 0 ? (
                        post.discussions.map((disc) => (
                          <div key={disc._id} style={{ background: '#141416', padding: '12px', borderRadius: '12px', border: '1px solid #27272a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#a5b4fc' }}>{disc.userName}</span>
                              <span style={{ fontSize: '0.7rem', color: '#52525b' }}>{new Date(disc.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ fontSize: '0.85rem', color: '#e4e4e7', lineHeight: '1.4' }}>{disc.text}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: '0.8rem', color: '#52525b', padding: '10px 0' }}>Silence implies observation. Drop a perspective below.</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                      <input 
                        type="text" 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Contribute your insight..." 
                        style={{ flex: 1, background: '#141416', border: '1px solid #27272a', borderRadius: '10px', padding: '10px 14px', fontSize: '0.85rem', color: '#fff', outline: 'none' }}
                      />
                      <button 
                        onClick={() => handleDiscussSubmit(post._id)}
                        disabled={submittingComment}
                        style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '10px', padding: '0 18px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                      >
                        {submittingComment ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}

              </article>
            ))
          )}
        </main>

      </div>
    </div>
  );
}