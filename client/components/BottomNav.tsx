'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function BottomNav({ hasNotification = false }: { hasNotification?: boolean }) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Workspace',
      href: '/workspace',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      label: 'Signals',
      href: '/signals',
      badge: hasNotification,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      )
    },
    {
      label: 'Discover',
      href: '/discover',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      )
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  ];

  return (
    <footer className="native-bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={`nav-tab ${isActive ? 'tab-active' : ''}`}>
            <div className="tab-icon-box">
              <span className="tab-icon">{item.icon}</span>
              {item.badge && <span className="notification-dot" />}
            </div>
            <span className="tab-text">{item.label}</span>
          </Link>
        );
      })}

      <style jsx global>{`
        .native-bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 64px;
          background: rgba(9, 9, 11, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-top: 1px solid #18181b;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          align-items: center;
          z-index: 9999;
        }

        .nav-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-decoration: none;
          color: #71717a;
          height: 100%;
          transition: color 0.15s ease, transform 0.15s ease;
        }

        .nav-tab:active {
          transform: scale(0.92);
        }

        .tab-icon-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }

        .tab-text {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.3px;
        }

        .tab-active {
          color: #6366f1 !important;
        }

        .tab-active .tab-icon {
          transform: translateY(-1px);
        }

        .notification-dot {
          position: absolute;
          top: -2px;
          right: -4px;
          width: 6px;
          height: 6px;
          background: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.8);
        }
      `}</style>
    </footer>
  );
}