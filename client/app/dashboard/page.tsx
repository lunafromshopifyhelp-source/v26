'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import VaultDepositModal from '@/components/VaultDepositModal';export default function Dashboard() {
  const [userData, setUserData] = useState<any>(null);
  const [vaultCount, setVaultCount] = useState<number>(0);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const router = useRouter();
  const fetchDashboardData = async () => {
    const email = localStorage.getItem('v26UserEmail');
    const token = localStorage.getItem('v26Token');

    if (!token || !email) {
      router.push('/login');
      return;
    }

    try {
      // 1. Fetch user data profile
      const profileRes = await axios.get(`http://https://v26.onrender.com/api/auth/profile/${email}`);
      setUserData(profileRes.data);

      // 2. Fetch direct asset count for stats row
      const vaultRes = await axios.get(`http://https://v26.onrender.com/api/projects/vault/${email}`);
      if (Array.isArray(vaultRes.data)) {
        setVaultCount(vaultRes.data.length);
      }
    } catch (err) {
      console.error("Error synchronizing dashboard datasets:", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('v26Token');
    localStorage.removeItem('v26UserEmail');
    router.push('/login');
  };

  return (
    <div style={{ backgroundColor: '#09090b', color: '#fafafa', minHeight: '100vh', display: 'flex', fontFamily: '"Inter", sans-serif' }}>
      
      {/* UNIVERSAL SIDEBAR */}
      <aside style={{ width: '260px', borderRight: '1px solid #27272a', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#6366f1', marginBottom: '50px', letterSpacing: '-1px' }}>v26</h1>
        
        <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ color: '#6366f1', fontWeight: 'bold', padding: '10px', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px' }}>Home Base</div>
          <div style={{ color: '#a1a1aa', padding: '10px', cursor: 'pointer' }} onClick={() => router.push('/workspace')}>My Vision</div>
          <div style={{ color: '#a1a1aa', padding: '10px', cursor: 'pointer' }} onClick={() => router.push('/fyp')}>Discover Feed</div>
          <div style={{ color: '#a1a1aa', padding: '10px', cursor: 'pointer' }}>Settings</div>
        </nav>

        <button onClick={handleLogout} style={{ color: '#f87171', background: 'none', border: 'none', textAlign: 'left', padding: '10px', cursor: 'pointer', fontWeight: '600' }}>
          Log Out
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flexGrow: 1, padding: '60px' }}>
        <header style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontSize: '3rem', fontWeight: '900', letterSpacing: '-2px', marginBottom: '10px' }}>
                Welcome, <span style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {userData?.name || "Creator"}
                </span>
              </h2>
              <p style={{ color: '#71717a', fontSize: '1.1rem' }}>
                {userData?.vision ? "Your vision is active." : "Your workspace is prepared for today's mission."}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '1px' }}>System Status</div>
              <div style={{ color: '#22c55e', fontWeight: 'bold' }}>● Operational</div>
            </div>
          </div>
        </header>

        {/* UNIVERSAL STATS */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: '#18181b', padding: '20px', borderRadius: '12px', border: '1px solid #27272a' }}>
            <div style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '5px' }}>Vault Manifestations</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{vaultCount}</div>
          </div>
          <div style={{ background: '#18181b', padding: '20px', borderRadius: '12px', border: '1px solid #27272a' }}>
            <div style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '5px' }}>Collaborators</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>0</div>
          </div>
          <div style={{ background: '#18181b', padding: '20px', borderRadius: '12px', border: '1px solid #27272a' }}>
            <div style={{ color: '#71717a', fontSize: '0.9rem', marginBottom: '5px' }}>Vision Rank</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Level 1</div>
          </div>
        </section>

        {/* UNIVERSAL ACTION CARDS */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          
          {/* IDENTITY CARD */}
          <div style={{ background: 'linear-gradient(145deg, #1e1b4b, #18181b)', padding: '30px', borderRadius: '24px', border: '1px solid #312e81', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🆔</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '10px' }}>
                {userData?.talent || "Establish Identity"}
              </h3>
              <p style={{ color: '#a5b4fc', fontSize: '0.9rem', lineHeight: '1.6' }}>
                {userData?.vision || "Define your core talent—whether it's tech, art, business, or service."}
              </p>
            </div>
            <button 
              onClick={() => router.push('/onboarding')} 
              style={{ marginTop: '24px', width: '100%', padding: '12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)' }}
            >
              {userData?.talent ? "Edit Profile" : "Configure Profile"}
            </button>
          </div>

          {/* PROJECT CARD */}
          <div style={{ background: '#18181b', padding: '30px', borderRadius: '24px', border: '1px solid #27272a', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '15px' }}>🏗️</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '10px' }}>Project Hub</h3>
              <p style={{ color: '#71717a', fontSize: '0.9rem', lineHeight: '1.6' }}>Manage your current works in progress, track milestones, and invite updates.</p>
            </div>
            <button 
              onClick={() => router.push('/workspace')}
              style={{ marginTop: '24px', width: '100%', padding: '12px', backgroundColor: '#27272a', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Launch Workspace
            </button>
          </div>

          {/* NEW VAULT TRANSMISSION CARD */}
          <div style={{ background: '#141416', padding: '30px', borderRadius: '24px', border: '1px solid #22c55e', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '2rem', marginBottom: '15px' }}>⚡</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '10px' }}>Vault Transmit</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: '1.6' }}>Instantly secure up to 100MB of high-res video footage, audio tracking, or datasets straight into storage.</p>
            </div>
            <button 
              onClick={() => setIsDepositOpen(true)}
              style={{ marginTop: '24px', width: '100%', padding: '12px', backgroundColor: '#22c55e', color: 'black', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(34, 197, 94, 0.3)' }}
            >
              + Deposit Asset
            </button>
          </div>

        </section>
      </main>

      {/* DYNAMIC DRAG AND DROP PORTAL */}
      {isDepositOpen && (
        <VaultDepositModal 
          onClose={() => setIsDepositOpen(false)} 
          onSuccess={fetchDashboardData} 
        />
      )}
    </div>
  );
}