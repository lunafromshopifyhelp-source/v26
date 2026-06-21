'use client';

import React, { useState, useRef } from 'react';
import axios from 'axios';

interface UploadFeedback {
  type: 'idle' | 'transmitting' | 'secured' | 'failed';
  message: string;
}

export default function VaultDepositModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Chemistry'); 
  const [status, setStatus] = useState('active'); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState<UploadFeedback>({ type: 'idle', message: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const talentCategories = [
    'Chemistry', 'Music', 'Development', 'Design', 
    'Art', 'Writing', 'Film', 'Science', 'Dev', 
    'Business', 'Spiritual', 'Agri', 'Athletics', 'Other'
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) validateFile(e.dataTransfer.files[0]);
  };

  const validateFile = (file: File) => {
    if (file.size > 1024 * 1024 * 100) { 
      setFeedback({ type: 'failed', message: 'Asset exceeds 100MB system limit.' });
      return;
    }
    setSelectedFile(file);
    setFeedback({ type: 'idle', message: '' });
  };

  const executeTransmission = async () => {
    if (!title || !selectedFile) {
      setFeedback({ type: 'failed', message: 'Manifestation title and media asset required.' });
      return;
    }

    setFeedback({ type: 'transmitting', message: 'Securing asset in the Vault pipeline...' });
    setProgress(0);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('status', status);
    formData.append('file', selectedFile);
    formData.append('creatorEmail', localStorage.getItem('v26UserEmail') || 'system-fallback@v26.io'); 

    try {
      const response = await axios.post('http://https://v26.onrender.com/api/projects/deposit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      setFeedback({ type: 'secured', message: response.data.message });
      onSuccess(); 
      setTimeout(onClose, 2000); 
    } catch (err: any) {
      console.error('Vault Transmission Failed:', err.response?.data?.message || err.message);
      setFeedback({ type: 'failed', message: 'Vault connection interrupted: ' + (err.response?.data?.message || err.message) });
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={onClose}>
      <div style={{ width: '560px', background: '#09090b', borderRadius: '30px', border: '1px solid #1c1c1f', padding: '40px', position: 'relative', overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>Deposit Manifestation</h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a' }}>Secure your work-in-progress or finished talent assets in the Vault.</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#3f3f46', fontSize: '1.4rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <div 
          onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ 
            width: '100%', height: '160px', borderRadius: '20px', border: '2px dashed #1c1c1f', 
            borderColor: dragActive ? '#6366f1' : selectedFile ? '#27272a' : '#1c1c1f',
            background: dragActive ? 'rgba(99,102,241,0.05)' : selectedFile ? '#141416' : '#0c0c0e',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
            marginBottom: '24px', cursor: 'pointer'
          }}
        >
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && validateFile(e.target.files[0])} />
          
          {selectedFile ? (
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <p style={{ fontSize: '1.5rem', marginBottom: '6px' }}>📦</p>
              <p style={{ fontSize: '0.8rem', color: '#e4e4e7', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
              <p style={{ fontSize: '0.7rem', color: '#52525b' }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '1.8rem', opacity: 0.4 }}>📦</div>
              <p style={{ fontSize: '0.85rem', color: '#71717a', textAlign: 'center' }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>Drop dynamic project media</span> or click<br/>
                <span style={{ fontSize: '0.7rem' }}>(Max 100MB • Video, Images, Audio, Documents)</span>
              </p>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
          <input type="text" placeholder="Title of Manifestation" value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', background: '#141416', border: '1px solid #1c1c1f', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem', color: '#fff', outline: 'none' }} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Talent Sphere</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', background: '#141416', border: '1px solid #1c1c1f', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem', color: '#fff', outline: 'none', cursor: 'pointer' }}>
                {talentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div>
              <label style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '6px', display: 'block' }}>Transmission State</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: '100%', background: '#141416', border: '1px solid #1c1c1f', borderRadius: '12px', padding: '12px 16px', fontSize: '0.85rem', color: '#fff', outline: 'none', cursor: 'pointer' }}>
                <option value="active">📡 Active (WIP)</option>
                <option value="manifested">💎 Manifested (Finished)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          {feedback.type !== 'idle' && (
            <div style={{ fontSize: '0.75rem', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', color: '#fff', background: feedback.type === 'transmitting' ? '#141416' : feedback.type === 'secured' ? '#064e3b' : '#7f1d1d', border: `1px solid ${feedback.type === 'transmitting' ? '#1c1c1f' : feedback.type === 'secured' ? '#10b981' : '#ef4444'}` }}>
              {feedback.type === 'transmitting' && (
                <div style={{ width: '100%', height: '3px', background: '#27272a', borderRadius: '10px', overflow: 'hidden', marginBottom: '6px' }}>
                  <div style={{ width: `${progress}%`, height: '100%', background: '#6366f1', transition: 'width 0.1s' }} />
                </div>
              )}
              {feedback.message}
            </div>
          )}
          
          <button 
            onClick={executeTransmission}
            disabled={feedback.type === 'transmitting' || feedback.type === 'secured'}
            style={{ width: '100%', padding: '14px', background: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' }}
          >
            {feedback.type === 'transmitting' ? `Manifesting [ ${progress}% ]...` : 'Transmit to Vault'}
          </button>
        </div>

      </div>
    </div>
  );
}