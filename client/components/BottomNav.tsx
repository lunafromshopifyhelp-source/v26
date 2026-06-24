'use client';
import React from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function BottomNav({ hasNotification }: { hasNotification?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <footer className="native-app-bottom-bar">
      <button 
        onClick={() => router.push('/workspace')} 
        className={`nav-icon-tab ${pathname === '/workspace' ? 'tab-active' : ''}`}
      >
        <span style={{ fontSize: '1.2rem' }}>🏠</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Workspace</span>
      </button>

      <button 
        onClick={() => router.push('/signals')} 
        className={`nav-icon-tab ${pathname === '/signals' ? 'tab-active' : ''}`}
      >
        <span style={{ fontSize: '1.2rem', position: 'relative', display: 'inline-block' }}>
          🔔 {hasNotification && <span className="notification-ping-dot"></span>}
        </span>
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Signals</span>
      </button>

      <button 
        onClick={() => router.push('/discover')} 
        className={`nav-icon-tab ${pathname === '/discover' ? 'tab-active' : ''}`}
      >
        <span style={{ fontSize: '1.2rem' }}>🌍</span>
        <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>Discover</span>
      </button>

      <style jsx global>{`
        .native-app-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 65px;
          background: #111113;
          border-top: 1px solid #27272a;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          align-items: center;
          z-index: 100;
        }
        .nav-icon-tab {
          background: transparent;
          border: none;
          color: #71717a;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          height: 100%;
          justify-content: center;
        }
        .tab-active {
          color: #6366f1 !important;
        }
        .notification-ping-dot {
          position: absolute;
          top: -1px;
          right: -3px;
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
        }
      `}</style>
    </footer>
  );
}