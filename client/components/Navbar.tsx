'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [signalCount, setSignalCount] = useState(0);
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Safely capture localStorage on client mount to prevent dehydration mismatch errors
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

  const navItem = (label: string, href: string, isSignal = false) => {
    const isActive = pathname === href;
    return (
      <Link href={href} style={{ position: 'relative', textDecoration: 'none' }}>
        <span style={{ 
          color: isActive ? '#818cf8' : '#a1a1aa', 
          fontSize: '0.85rem', 
          fontWeight: 'bold',
          transition: '0.3s'
        }}>
          {label}
        </span>
        {isSignal && signalCount > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '-5px', 
            right: '-10px', 
            width: '8px', 
            height: '8px', 
            background: '#6366f1', 
            borderRadius: '50%',
            boxShadow: '0 0 10px #6366f1',
            animation: 'pulse 1.5s infinite' 
          }} />
        )}
      </Link>
    );
  };

  return (
    <nav className="nav-container">
      {/* Brand Logo */}
      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}>v26</div>
      
      {/* 🔒 ONLY show the private navigation tabs if a user is logged in */}
      {userEmail && (
        <div className="nav-links">
          {navItem('Workspace', '/workspace')}
          {navItem('Discover', '/fyp')}
          {navItem('Signals', '/inbox', true)} 
        </div>
      )}

      {/* Auth Status Banner */}
      <div style={{ fontSize: '0.75rem', color: '#71717a', textAlign: 'center' }}>
        {userEmail ? userEmail : (
          <div style={{ display: 'flex', gap: '15px' }}>
            <Link href="/login" style={{ color: '#a1a1aa', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>Login</Link>
            <Link href="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem' }}>Get Started</Link>
          </div>
        )}
      </div>

      {/* Pure CSS handling structural mobile rules without breakages */}
      <style jsx global>{`
        .nav-container {
          padding: 20px 40px; 
          background: rgba(9, 9, 11, 0.9); 
          backdrop-filter: blur(12px); 
          border-bottom: 1px solid #27272a;
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 100;
          gap: 20px;
        }

        .nav-links {
          display: flex; 
          gap: 30px;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }

        /* 📱 Mobile UI Media Queries - Prevents squishing and overlapping */
        @media (max-width: 600px) {
          .nav-container {
            flex-direction: column !important;
            padding: 15px 20px;
            gap: 12px;
          }
          .nav-links {
            gap: 20px;
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>
    </nav>
  );
}