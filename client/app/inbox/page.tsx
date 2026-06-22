'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Signal {
  _id: string;
  senderName: string;
  type: 'like' | 'comment' | 'bridge_request';
  content: string;
  read: boolean;
  createdAt: string;
}

export default function Inbox() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      const email = localStorage.getItem('v26UserEmail');
      try {
        const res = await axios.get(`https://v26.onrender.com/api/notifications/${email}`);
        setSignals(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchSignals();
  }, []);

  return (
    <div style={{ backgroundColor: '#09090b', color: '#fff', minHeight: '100vh', padding: '60px 20px' }}>
      <header style={{ maxWidth: '600px', margin: '0 auto 40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '900', color: '#818cf8' }}>Signal Center</h1>
        <p style={{ color: '#71717a', fontSize: '0.9rem' }}>INTERACTIONS WITHIN YOUR CREATIVE RADIUS</p>
      </header>

      <main style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: '#6366f1' }}>Scanning frequencies...</p>
        ) : signals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', border: '1px dashed #27272a', borderRadius: '20px' }}>
            <p style={{ color: '#52525b' }}>No signals detected yet.</p>
          </div>
        ) : (
          signals.map((s) => (
            <div key={s._id} style={{ 
              background: s.read ? '#111113' : 'rgba(99, 102, 241, 0.05)', 
              padding: '20px', 
              borderRadius: '20px', 
              border: '1px solid', 
              borderColor: s.read ? '#27272a' : '#6366f1',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ fontSize: '1.5rem' }}>
                {s.type === 'like' ? '⚡' : s.type === 'comment' ? '💬' : '🤝'}
              </div>
              <div style={{ flexGrow: 1 }}>
                <p style={{ fontSize: '0.95rem', margin: 0 }}>
                  <span style={{ fontWeight: 'bold', color: '#818cf8' }}>{s.senderName}</span> {s.content}
                </p>
                <span style={{ fontSize: '0.7rem', color: '#52525b' }}>{new Date(s.createdAt).toLocaleString()}</span>
              </div>
              {!s.read && <div style={{ width: '8px', height: '8px', background: '#6366f1', borderRadius: '50%' }}></div>}
            </div>
          ))
        )}
      </main>
    </div>
  );
}