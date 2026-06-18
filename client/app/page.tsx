'use client'; 

import React from 'react';
import { useRouter } from 'next/navigation'; // Fixed the import

export default function Home() {
  const router = useRouter(); // Initialize the router for navigation

  return (
    <div style={{ backgroundColor: '#121212', color: '#FFFFFF', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Navigation */}
      <nav style={{ padding: '20px 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 
          style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#6366f1', cursor: 'pointer' }}
          onClick={() => router.push('/')}
        >
          v26
        </h1>
        <div>
          <button 
            onClick={() => router.push('/login')} // Navigate to Login
            style={{ background: 'none', color: '#FFFFFF', border: 'none', marginRight: '20px', cursor: 'pointer' }}
          >
            Login
          </button>
          <button 
            onClick={() => router.push('/register')} // Navigate to Register
            style={{ backgroundColor: '#6366f1', color: '#FFFFFF', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ textAlign: 'center', marginTop: '120px', padding: '0 20px' }}>
        <h2 style={{ fontSize: '4rem', marginBottom: '24px', fontWeight: '800' }}>
          Turn talent into <span style={{ color: '#EAB308' }}>purpose.</span>
        </h2>
        <p style={{ fontSize: '1.3rem', color: '#A1A1AA', maxWidth: '700px', margin: '0 auto 48px', lineHeight: '1.6' }}>
          v26 — A global ecosystem where every God-given talent is nurtured, 
          connected, and transformed into a powerful mission.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <button 
            onClick={() => router.push('/register')} // Navigate to Register
            style={{ backgroundColor: '#6366f1', padding: '18px 36px', borderRadius: '12px', fontSize: '1.2rem', border: 'none', color: '#FFF', cursor: 'pointer', fontWeight: '600' }}
          >
            Start Creating
          </button>
          <button 
            style={{ border: '2px solid #3F3F46', padding: '18px 36px', borderRadius: '12px', fontSize: '1.2rem', background: 'none', color: '#FFF', cursor: 'pointer', fontWeight: '600' }}
          >
            Explore Feed
          </button>
        </div>
      </header>
    </div>
  );
}