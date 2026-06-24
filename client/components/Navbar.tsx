'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [signalCount, setSignalCount] = useState(0);
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserEmail(localStorage.getItem('v26UserEmail'));
    }
  }, []);

  useEffect(() => {
    const checkSignals = async () => {
      if (!userEmail) return;
      try {
        const res = await axios.get(`https://v26.onrender.com/api/notifications/${userEmail}`);
        const unread = res.data.filter((s: any) => !s.read).length;
        setSignalCount(unread);
      } catch (err) {
        console.error("Signal check failed");
      }
    };

    checkSignals();
    const interval = setInterval(checkSignals, 30000);
    return () => clearInterval(interval);
  }, [userEmail]);

  // Hides desktop header inside dedicated workspace routes to clear space
  if (pathname?.startsWith('/workspace') || pathname?.startsWith('/discover') || pathname?.startsWith('/signals')) {
    return null;
  }

  const navItem = (label: string, href: string, isSignal = false) => {
    const isActive = pathname === href;
    return (
      <Link href={href} className="premium-nav-item">
        <span style={{ color: isActive ? '#fff' : '#71717a', fontWeight: isActive ? '700' : '500' }}>
          {label}
        </span>
        {isActive && <div className="nav-active-indicator" />}
        {isSignal && signalCount > 0 && <div className="nav-ping-badge" />}
      </Link>
    );
  };

  return (
    <nav className="nav-container">
      <div className="nav-brand">v26</div>
      
      {userEmail && (
        <div className="nav-links">
          {navItem('Workspace', '/workspace')}
          {navItem('Discover', '/discover')}
          {navItem('Signals', '/signals', true)} 
        </div>
      )}

      <div className="nav-auth-slot">
        {userEmail ? (
          <div className="user-email-badge">
            <span className="online-dot" />
            {userEmail.split('@')[0]}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link href="/login" className="auth-btn-secondary">Login</Link>
            <Link href="/register" className="auth-btn-primary">Get Started</Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        .nav-container {
          padding: 0 40px; 
          height: 70px;
          background: rgba(9, 9, 11, 0.75); 
          backdrop-filter: blur(20px); 
          border-bottom: 1px solid #18181b;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .nav-brand {
          font-size: 1.25rem;
          font-weight: 900;
          color: #fff;
          letter-spacing: -1px;
        }

        .nav-links {
          display: flex; 
          gap: 32px;
          height: 100%;
        }

        .premium-nav-item {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          text-decoration: none;
          font-size: 0.85rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
          padding: 0 4px;
        }

        .premium-nav-item:hover span {
          color: #e4e4e7 !important;
        }

        .nav-active-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: #6366f1;
          box-shadow: 0 -4px 12px rgba(99, 102, 241, 0.5);
        }

        .nav-ping-badge {
          position: absolute;
          top: 22px;
          right: -6px;
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 8px #ef4444;
        }

        .user-email-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #18181b;
          border: 1px solid #27272a;
          padding: 6px 14px;
          borderRadius: 20px;
          font-size: 0.8rem;
          color: #e4e4e7;
          font-weight: 500;
        }

        .online-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          box-shadow: 0 0 8px #22c55e;
        }

        .auth-btn-secondary {
          color: #a1a1aa;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: 0.2s;
        }
        .auth-btn-secondary:hover { color: #fff; }

        .auth-btn-primary {
          background: #fff;
          color: #000;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .auth-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.15);
        }
        .auth-btn-primary:active { transform: translateY(0); }

        @media (max-width: 768px) {
          .nav-container { display: none !important; } /* Hard drop on mobile */
        }
      `}</style>
    </nav>
  );
}