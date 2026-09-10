'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import BottomNav from '@/components/BottomNav';

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

export default function FacebookStyleDiscoverPage() {
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
      alert("Failed to publish post.");
    } finally {
      setPublishing(false);
    }
  };

  const handleInspire = async (postId: string) => {
    if (!currentUserEmail) return alert("Please log in to react.");

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
    { id: 'All', label: '🌐 All Feed' },
    { id: 'Art', label: '🎨 Art & Design' },
    { id: 'Music', label: '🎵 Music' },
    { id: 'Development', label: '💻 Software' },
    { id: 'Chemistry', label: '🧪 Science' },
    { id: 'Business', label: '💼 Strategy' }
  ];

  return (
    <div className="fb-feed-root">
      
      {/* 1. TOP HEADER BAR */}
      <header className="fb-top-bar">
        <h1 className="fb-logo">v26</h1>
        <div className="fb-header-actions">
          <button className="fb-circle-btn" onClick={() => setShowPostModal(true)}>＋</button>
          <button className="fb-circle-btn" onClick={() => router.push('/signals')}>🔔</button>
        </div>
      </header>

      <div className="fb-main-scrollable">

        {/* 2. "WHAT'S ON YOUR MIND?" QUICK COMPOSER BAR */}
        <div className="fb-composer-card">
          <div className="fb-composer-row">
            <div className="fb-user-avatar">
              {(currentUserEmail || 'V')[0].toUpperCase()}
            </div>
            <button className="fb-fake-input" onClick={() => setShowPostModal(true)}>
              What's on your mind?
            </button>
            <button className="fb-photo-icon-btn" onClick={() => setShowPostModal(true)}>
              🖼️
            </button>
          </div>
        </div>

        {/* 3. STORIES / REELS HORIZONTAL SCROLLER */}
        <div className="fb-stories-scroller">
          
          {/* Create Story Tile */}
          <div className="fb-story-card fb-create-story" onClick={() => setShowPostModal(true)}>
            <div className="fb-create-story-top">
              <div className="fb-story-avatar-preview">
                {(currentUserEmail || 'V')[0].toUpperCase()}
              </div>
            </div>
            <div className="fb-create-story-bottom">
              <div className="fb-plus-badge">＋</div>
              <span>Create story</span>
            </div>
          </div>

          {/* Active Stories from recent broadcasts with media */}
          {broadcasts.filter(b => b.media && b.media.length > 0).slice(0, 8).map((story, i) => (
            <div 
              key={story._id || i} 
              className="fb-story-card" 
              onClick={() => {
                const el = document.getElementById(story._id);
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <img 
                src={story.media![0].startsWith('http') ? story.media![0] : `https://v26.onrender.com${story.media![0]}`} 
                alt="Story" 
                className="fb-story-media" 
              />
              <div className="fb-story-author-ring">
                {(story.authorName || story.authorEmail)[0].toUpperCase()}
              </div>
              <span className="fb-story-author-name">{story.authorName || story.authorEmail.split('@')[0]}</span>
            </div>
          ))}
        </div>

        {/* 4. SLIM HORIZONTAL CATEGORY PILLS */}
        <div className="fb-pills-row">
          {talentCategories.map(cat => (
            <button 
              key={cat.id} 
              onClick={() => setActiveFilter(cat.id)}
              className={`fb-pill ${activeFilter === cat.id ? 'fb-pill-active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* 5. FEED POSTS STREAM */}
        <main className="fb-posts-stream">
          {loading ? (
            <div className="fb-empty-state">Synchronizing public feed...</div>
          ) : broadcasts.length === 0 ? (
            <div className="fb-empty-state">
              <p style={{ margin: 0, fontWeight: 700 }}>No vision posts available.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#71717a' }}>Be the first to share an insight or reel!</p>
            </div>
          ) : (
            broadcasts.map(post => {
              const likes = post.likes || [];
              const comments = post.comments || [];
              const isLiked = currentUserEmail ? likes.includes(currentUserEmail) : false;

              return (
                <article key={post._id} id={post._id} className="fb-post-card">
                  
                  {/* Post Author Header */}
                  <div className="fb-post-header">
                    <div 
                      className="fb-author-avatar" 
                      onClick={() => router.push(`/profile?user=${encodeURIComponent(post.authorEmail)}`)}
                    >
                      {(post.authorName || post.authorEmail)[0].toUpperCase()}
                    </div>
                    <div className="fb-post-meta">
                      <div className="fb-author-name-row">
                        <span 
                          className="fb-author-name"
                          onClick={() => router.push(`/profile?user=${encodeURIComponent(post.authorEmail)}`)}
                        >
                          {post.authorName || post.authorEmail.split('@')[0]}
                        </span>
                        <span className="fb-verified-badge">✓</span>
                      </div>
                      <span className="fb-post-date">{new Date(post.createdAt).toLocaleDateString()} • 🌐</span>
                    </div>
                    <button className="fb-post-menu-btn">•••</button>
                  </div>

                  {/* Post Text Body */}
                  {post.text && <p className="fb-post-text">{post.text}</p>}

                  {/* Media Reel / Full-Width Container */}
                  {post.media && post.media.length > 0 && (
                    <div className="fb-media-container">
                      {post.media[0].endsWith('.mp4') || post.media[0].endsWith('.webm') ? (
                        <video 
                          src={post.media[0].startsWith('http') ? post.media[0] : `https://v26.onrender.com${post.media[0]}`} 
                          controls 
                          playsInline 
                          className="fb-post-media" 
                        />
                      ) : (
                        <img 
                          src={post.media[0].startsWith('http') ? post.media[0] : `https://v26.onrender.com${post.media[0]}`} 
                          alt="Post attachment" 
                          className="fb-post-media" 
                          loading="lazy" 
                        />
                      )}
                    </div>
                  )}

                  {/* Social Counters Row */}
                  <div className="fb-counters-row">
                    <div className="fb-likes-count">
                      <span className="fb-reaction-icon">⚡</span>
                      <span>{likes.length}</span>
                    </div>
                    <div className="fb-comments-count" onClick={() => setActiveDiscussionPost(post)}>
                      <span>{comments.length} comments</span>
                    </div>
                  </div>

                  {/* Social Action Bar (Like, Comment, Share) */}
                  <div className="fb-actions-bar">
                    <button 
                      onClick={() => handleInspire(post._id)} 
                      className={`fb-action-btn ${isLiked ? 'fb-liked' : ''}`}
                    >
                      <span>⚡</span> <span>{isLiked ? 'Inspired' : 'Inspire'}</span>
                    </button>
                    <button 
                      onClick={() => setActiveDiscussionPost(post)} 
                      className="fb-action-btn"
                    >
                      <span>💬</span> <span>Comment</span>
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/discover#${post._id}`);
                        alert("Post link copied!");
                      }} 
                      className="fb-action-btn"
                    >
                      <span>🔗</span> <span>Share</span>
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </main>

      </div>

      {/* CREATE POST MODAL POPUP */}
      {showPostModal && (
        <div className="fb-modal-backdrop" onClick={() => setShowPostModal(false)}>
          <div className="fb-modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="fb-modal-top">
              <h3>Create Post</h3>
              <button className="fb-modal-close" onClick={() => setShowPostModal(false)}>✕</button>
            </div>
            
            <div className="fb-modal-user-row">
              <div className="fb-author-avatar">{(currentUserEmail || 'V')[0].toUpperCase()}</div>
              <div>
                <span className="fb-author-name">{currentUserEmail?.split('@')[0] || 'Creator'}</span>
                <span className="fb-privacy-pill">🌐 Public</span>
              </div>
            </div>

            <textarea 
              value={quickText} 
              onChange={e => setQuickText(e.target.value)} 
              placeholder="What's on your mind?" 
              className="fb-modal-textarea" 
              autoFocus 
            />

            <div className="fb-modal-media-slot">
              <label className="fb-modal-attach-label">
                <input 
                  type="file" 
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={e => setSelectedFiles([...selectedFiles, ...Array.from(e.target.files || [])])} 
                />
                🖼️ <span>{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) selected` : 'Add Photos / Videos to post'}</span>
              </label>
            </div>

            <button 
              onClick={handleCreatePost} 
              disabled={publishing || (!quickText.trim() && selectedFiles.length === 0)} 
              className="fb-modal-submit-btn"
            >
              {publishing ? 'Publishing...' : 'Post'}
            </button>
          </div>
        </div>
      )}

      {/* DISCUSSIONS / COMMENTS DRAWER */}
      {activeDiscussionPost && (
        <div className="fb-modal-backdrop" onClick={() => setActiveDiscussionPost(null)}>
          <div className="fb-comments-drawer" onClick={e => e.stopPropagation()}>
            <div className="fb-modal-top">
              <h3>Comments</h3>
              <button className="fb-modal-close" onClick={() => setActiveDiscussionPost(null)}>✕</button>
            </div>

            <div className="fb-drawer-comments-scroll">
              {(activeDiscussionPost.comments || []).length === 0 ? (
                <div className="fb-empty-comments">Be the first to comment on this vision!</div>
              ) : (
                activeDiscussionPost.comments!.map((c, idx) => (
                  <div key={c._id || idx} className="fb-comment-bubble-row">
                    <div className="fb-comment-avatar">{(c.userName || 'C')[0].toUpperCase()}</div>
                    <div className="fb-comment-bubble">
                      <span className="fb-comment-user">{c.userName}</span>
                      <p className="fb-comment-text">{c.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="fb-comment-input-row">
              <input 
                value={commentText} 
                onChange={e => setCommentText(e.target.value)} 
                placeholder="Write a comment..." 
                className="fb-comment-input" 
                onKeyDown={e => e.key === 'Enter' && handleSendComment(activeDiscussionPost._id)} 
              />
              <button 
                onClick={() => handleSendComment(activeDiscussionPost._id)} 
                disabled={submittingComment} 
                className="fb-comment-send"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📱 4-TAB BOTTOM NAVIGATION */}
      <BottomNav />

      <style jsx global>{`
        .fb-feed-root { background-color: #000000; min-height: 100vh; color: #e4e6eb; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        
        /* Top Facebook-Style Bar */
        .fb-top-bar { position: sticky; top: 0; background: #000; z-index: 100; display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #18191a; }
        .fb-logo { font-size: 1.5rem; font-weight: 900; color: #2e89ff; margin: 0; letter-spacing: -1px; }
        .fb-header-actions { display: flex; gap: 8px; }
        .fb-circle-btn { width: 36px; height: 36px; border-radius: 50%; background: #242526; border: none; color: #e4e6eb; display: flex; align-items: center; justify-content: center; font-size: 1rem; cursor: pointer; }

        .fb-main-scrollable { max-width: 580px; margin: 0 auto; padding-bottom: 85px; }

        /* Quick Composer Card */
        .fb-composer-card { background: #0e0e11; padding: 12px 16px; border-bottom: 1px solid #18181b; }
        .fb-composer-row { display: flex; align-items: center; gap: 12px; }
        .fb-user-avatar { width: 40px; height: 40px; border-radius: 50%; background: #242526; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; flex-shrink: 0; }
        .fb-fake-input { flex: 1; background: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 10px 16px; color: #71717a; text-align: left; font-size: 0.85rem; cursor: pointer; }
        .fb-photo-icon-btn { background: transparent; border: none; font-size: 1.3rem; cursor: pointer; }

        /* Stories Scroller */
        .fb-stories-scroller { display: flex; gap: 8px; padding: 12px 16px; overflow-x: auto; scrollbar-width: none; background: #000; border-bottom: 1px solid #18181b; }
        .fb-stories-scroller::-webkit-scrollbar { display: none; }
        .fb-story-card { width: 105px; height: 175px; border-radius: 12px; overflow: hidden; position: relative; flex-shrink: 0; background: #18181b; cursor: pointer; }
        .fb-story-media { width: 100%; height: 100%; object-fit: cover; }
        .fb-story-author-ring { position: absolute; top: 8px; left: 8px; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #2e89ff; background: #000; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; color: #fff; }
        .fb-story-author-name { position: absolute; bottom: 8px; left: 8px; right: 8px; font-size: 0.7rem; font-weight: 700; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        /* Create Story Specific */
        .fb-create-story { display: flex; flex-direction: column; }
        .fb-create-story-top { flex: 1; background: #1c1c1f; display: flex; align-items: center; justify-content: center; }
        .fb-story-avatar-preview { width: 44px; height: 44px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; font-weight: 800; }
        .fb-create-story-bottom { height: 50px; background: #242526; position: relative; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 8px; font-size: 0.7rem; font-weight: 700; color: #fff; }
        .fb-plus-badge { position: absolute; top: -16px; left: 50%; transform: translateX(-50%); width: 30px; height: 30px; border-radius: 50%; background: #2e89ff; border: 3px solid #242526; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 900; }

        /* Slim Horizontal Category Pills */
        .fb-pills-row { display: flex; gap: 8px; padding: 10px 16px; overflow-x: auto; background: #0e0e11; border-bottom: 1px solid #18181b; scrollbar-width: none; }
        .fb-pills-row::-webkit-scrollbar { display: none; }
        .fb-pill { background: #1c1c1f; border: 1px solid #27272a; border-radius: 18px; padding: 6px 14px; font-size: 0.75rem; font-weight: 600; color: #a1a1aa; white-space: nowrap; cursor: pointer; }
        .fb-pill-active { background: #2e89ff !important; color: #fff !important; border-color: #2e89ff !important; }

        /* Post Cards */
        .fb-posts-stream { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .fb-post-card { background: #0e0e11; border-top: 1px solid #18181b; border-bottom: 1px solid #18181b; padding-top: 12px; }
        .fb-post-header { display: flex; align-items: center; gap: 10px; padding: 0 16px 8px 16px; }
        .fb-author-avatar { width: 40px; height: 40px; border-radius: 50%; background: #242526; display: flex; align-items: center; justify-content: center; font-weight: 800; cursor: pointer; }
        .fb-post-meta { flex: 1; display: flex; flex-direction: column; }
        .fb-author-name-row { display: flex; align-items: center; gap: 4px; }
        .fb-author-name { font-size: 0.9rem; font-weight: 700; color: #fff; cursor: pointer; }
        .fb-author-name:hover { text-decoration: underline; }
        .fb-verified-badge { font-size: 0.65rem; background: #2e89ff; color: #fff; border-radius: 50%; width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; }
        .fb-post-date { font-size: 0.7rem; color: #71717a; }
        .fb-post-menu-btn { background: transparent; border: none; color: #71717a; font-size: 1rem; cursor: pointer; }

        .fb-post-text { font-size: 0.95rem; line-height: 1.45; color: #e4e6eb; padding: 0 16px; margin: 0 0 10px 0; white-space: pre-wrap; }
        
        .fb-media-container { width: 100%; background: #000; }
        .fb-post-media { width: 100%; max-height: 480px; object-fit: cover; display: block; }

        .fb-counters-row { display: flex; justify-content: space-between; padding: 10px 16px; font-size: 0.75rem; color: #71717a; border-bottom: 1px solid #18181b; }
        .fb-likes-count { display: flex; align-items: center; gap: 4px; }
        .fb-reaction-icon { background: #eab308; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; color: #000; }
        .fb-comments-count { cursor: pointer; }

        .fb-actions-bar { display: grid; grid-template-columns: repeat(3, 1fr); padding: 4px 8px; }
        .fb-action-btn { background: transparent; border: none; padding: 8px 0; color: #a1a1aa; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border-radius: 6px; }
        .fb-action-btn:hover { background: #18181b; color: #fff; }
        .fb-liked { color: #facc15 !important; font-weight: 700; }

        /* Modals & Drawers */
        .fb-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: flex-end; justify-content: center; }
        .fb-modal-sheet { width: 100%; max-width: 500px; background: #1c1c1f; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 20px; box-sizing: border-box; }
        .fb-modal-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #27272a; padding-bottom: 10px; }
        .fb-modal-top h3 { margin: 0; font-size: 1.1rem; }
        .fb-modal-close { background: transparent; border: none; color: #a1a1aa; font-size: 1.2rem; cursor: pointer; }
        .fb-modal-user-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .fb-privacy-pill { font-size: 0.65rem; background: #27272a; padding: 2px 6px; border-radius: 4px; color: #a1a1aa; display: block; margin-top: 2px; }
        .fb-modal-textarea { width: 100%; height: 120px; background: transparent; border: none; color: #fff; font-size: 1rem; resize: none; outline: none; box-sizing: border-box; }
        .fb-modal-media-slot { border: 1px dashed #27272a; border-radius: 10px; padding: 12px; text-align: center; margin-bottom: 16px; }
        .fb-modal-attach-label { cursor: pointer; font-size: 0.8rem; color: #a1a1aa; }
        .fb-modal-submit-btn { width: 100%; padding: 12px; background: #2e89ff; border: none; border-radius: 10px; color: #fff; font-weight: 700; font-size: 0.9rem; cursor: pointer; }
        .fb-modal-submit-btn:disabled { background: #27272a; color: #52525b; cursor: not-allowed; }

        /* Comments Drawer */
        .fb-comments-drawer { width: 100%; max-width: 500px; height: 75vh; background: #1c1c1f; border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 16px; display: flex; flex-direction: column; box-sizing: border-box; }
        .fb-drawer-comments-scroll { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .fb-comment-bubble-row { display: flex; gap: 8px; }
        .fb-comment-avatar { width: 32px; height: 32px; border-radius: 50%; background: #27272a; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; flex-shrink: 0; }
        .fb-comment-bubble { background: #242526; border-radius: 14px; padding: 8px 12px; max-width: 85%; }
        .fb-comment-user { font-size: 0.75rem; font-weight: 700; color: #fff; display: block; margin-bottom: 2px; }
        .fb-comment-text { font-size: 0.85rem; color: #e4e6eb; margin: 0; }
        .fb-empty-comments { text-align: center; color: #71717a; font-size: 0.85rem; padding: 40px 0; }
        .fb-comment-input-row { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid #27272a; }
        .fb-comment-input { flex: 1; background: #242526; border: none; border-radius: 20px; padding: 10px 14px; color: #fff; font-size: 0.8rem; outline: none; }
        .fb-comment-send { background: #2e89ff; border: none; border-radius: 20px; padding: 0 16px; color: #fff; font-weight: 700; font-size: 0.8rem; cursor: pointer; }
      `}</style>
    </div>
  );
}