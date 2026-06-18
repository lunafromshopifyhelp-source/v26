'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [signalCount, setSignalCount] = useState(0);
  const pathname = usePathname();
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') : null;

  useEffect(() => {
    const checkSignals = async () => {
      if (!userEmail) return;
      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/${userEmail}`);
        const unread = res.data.filter((s: any) => !s.read).length;
        setSignalCount(unread);
      } catch (err) {
        console.error("Signal check failed");
      }
    };

    checkSignals();
    // Refresh signals every 30 seconds to keep the pulse live
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
    <nav style={{ 
      padding: '20px 40px', 
      background: 'rgba(9, 9, 11, 0.8)', 
      backdropFilter: 'blur(12px)', 
      borderBottom: '1px solid #27272a',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#fff', letterSpacing: '-1px' }}>v26</div>
      
      <div style={{ display: 'flex', gap: '30px' }}>
        {navItem('Workspace', '/workspace')}
        {navItem('Discover', '/fyp')}
        {navItem('Signals', '/inbox', true)} 
      </div>

      <div style={{ fontSize: '0.75rem', color: '#71717a' }}>{userEmail}</div>

      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </nav>
  );
}