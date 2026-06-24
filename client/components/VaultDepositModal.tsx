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
      const response = await axios.post('https://v26.onrender.com/api/projects/deposit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) setProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        },
      });

      setFeedback({ type: 'secured', message: response.data.message });
      onSuccess(); 
      setTimeout(onClose, 1500); 
    } catch (err: any) {
      setFeedback({ type: 'failed', message: err.response?.data?.message || 'Vault connection interrupted.' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Deposit Manifestation</h2>
            <p style={{ fontSize: '0.8rem', color: '#71717a', margin: 0 }}>Secure your talent assets in the protected v26 vault systems.</p>
          </div>
          <button onClick={onClose} className="close-x-btn">&times;</button>
        </div>

        <div 
          onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`dropzone-box ${dragActive ? 'dz-active' : ''} ${selectedFile ? 'dz-filled' : ''}`}
        >
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={(e) => e.target.files && validateFile(e.target.files[0])} />
          
          {selectedFile ? (
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <p style={{ fontSize: '1.3rem', margin: '0 0 8px 0' }}>📦</p>
              <p style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '600', margin: '0 0 2px 0', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</p>
              <p style={{ fontSize: '0.7rem', color: '#71717a', margin: 0 }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '8px', opacity: 0.6 }}>📂</div>
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: 0, lineHeight: '1.4' }}>
                <span style={{ color: '#fff', fontWeight: '600' }}>Drop file asset here</span> or click to browse<br/>
                <span style={{ fontSize: '0.65rem', color: '#52525b' }}>Maximum asset load limit: 100MB</span>
              </p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
          <input type="text" placeholder="Title of Manifestation" value={title} onChange={(e) => setTitle(e.target.value)} className="modal-input-field" />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label className="input-mini-label">Talent Sphere</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="modal-select-menu">
                {talentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            
            <div>
              <label className="input-mini-label">Transmission State</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="modal-select-menu">
                <option value="active">Active (WIP)</option>
                <option value="manifested">Manifested (Complete)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          {feedback.type !== 'idle' && (
            <div className={`feedback-banner fb-${feedback.type}`}>
              {feedback.type === 'transmitting' && (
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
              )}
              {feedback.message}
            </div>
          )}
          
          <button 
            onClick={executeTransmission}
            disabled={feedback.type === 'transmitting' || feedback.type === 'secured'}
            className="modal-submit-btn"
          >
            {feedback.type === 'transmitting' ? `Uploading [ ${progress}% ]` : 'Transmit to Vault'}
          </button>
        </div>

      </div>

      <style jsx global>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(4, 4, 5, 0.8);
          backdrop-filter: blur(16px);
          zIndex: 99999;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .modal-window {
          width: 100%;
          max-width: 480px;
          background: #09090b;
          border: 1px solid #18181b;
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.7);
        }

        .close-x-btn {
          background: transparent;
          border: none;
          color: #52525b;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
          transition: color 0.2s;
        }
        .close-x-btn:hover { color: #fff; }

        .dropzone-box {
          width: 100%;
          height: 140px;
          border-radius: 16px;
          border: 1px dashed #27272a;
          background: #09090b;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dropzone-box:hover {
          border-color: #52525b;
          background: #141416;
        }
        .dz-active {
          border-color: #6366f1 !important;
          background: rgba(99, 102, 241, 0.02) !important;
        }
        .dz-filled {
          border-style: solid;
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.01);
        }

        .modal-input-field {
          width: 100%;
          background: #141416;
          border: 1px solid #18181b;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.85rem;
          color: #fff;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .modal-input-field:focus { border-color: #27272a; }

        .input-mini-label {
          font-size: 0.6rem;
          color: #71717a;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
          display: block;
        }

        .modal-select-menu {
          width: 100%;
          background: #141416;
          border: 1px solid #18181b;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.85rem;
          color: #fff;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
        }

        .feedback-banner {
          font-size: 0.75rem;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 16px;
          color: #fff;
        }
        .fb-transmitting { background: #141416; border: 1px solid #18181b; }
        .fb-secured { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.2); color: #4ade80; }
        .fb-failed { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #f87171; }

        .progress-bar-track { width: 100%; height: 2px; background: #27272a; border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
        .progress-bar-fill { height: 100%; background: #6366f1; transition: width 0.1s linear; }

        .modal-submit-btn {
          width: 100%;
          padding: 14px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }
        .modal-submit-btn:hover {
          background: #e4e4e7;
          transform: scale(0.99);
        }
        .modal-submit-btn:disabled {
          background: #18181b;
          color: #52525b;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
}