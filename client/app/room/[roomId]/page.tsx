'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';

// Public STUN servers for network discovery
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function InAppMeetingRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params?.roomId as string;

  const [meeting, setMeeting] = useState<any>(null);
  const [peerConnected, setPeerConnected] = useState(false);
  const [peerEmail, setPeerEmail] = useState('');
  const [micActive, setMicActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const currentUserEmail = typeof window !== 'undefined' ? localStorage.getItem('v26UserEmail') || 'creator@v26.io' : 'creator@v26.io';

  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Fetch meeting info
      try {
        const res = await axios.get(`https://v26.onrender.com/api/meetings/room/${roomId}`);
        if (res.data?.success && isMounted) {
          setMeeting(res.data.data);
        }
      } catch (e) {
        console.warn("Direct room connect:", e);
      }

      // 2. Open camera & mic
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert("Camera and Microphone access are needed for the call.");
        return;
      }

      // 3. Connect to Render signaling server
      const socket = io('https://v26.onrender.com', {
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socket;

      socket.emit('join-room', { roomId, userEmail: currentUserEmail });

      const createPC = (targetSocketId: string) => {
        const pc = new RTCPeerConnection(RTC_CONFIG);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setPeerConnected(true);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('ice-candidate', { candidate: event.candidate, to: targetSocketId });
          }
        };

        return pc;
      };

      // When another person joins
      socket.on('user-connected', async ({ socketId, userEmail }: { socketId: string; userEmail: string }) => {
        setPeerEmail(userEmail);
        const pc = createPC(socketId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { sdp: offer, to: socketId });
      });

      // When offer received
      socket.on('offer', async ({ sdp, from }: { sdp: RTCSessionDescriptionInit; from: string }) => {
        const pc = createPC(from);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { sdp: answer, to: from });
      });

      // When answer received
      socket.on('answer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
          setPeerConnected(true);
        }
      });

      // When ICE candidate received
      socket.on('ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
        if (peerConnectionRef.current && candidate) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("ICE error", e);
          }
        }
      });

      socket.on('user-disconnected', () => {
        setPeerConnected(false);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
      });
    }

    init();

    return () => {
      isMounted = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [roomId, currentUserEmail]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !micActive));
      setMicActive(!micActive);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !videoActive));
      setVideoActive(!videoActive);
    }
  };

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (socketRef.current) socketRef.current.disconnect();
    router.push('/workspace');
  };

  return (
    <div className="room-viewport">
      <header className="room-header-bar">
        <div className="room-identity">
          <div className="live-dot-pulse" />
          <div>
            <span className="room-kicker">V26 // ENCRYPTED SESSION</span>
            <h1 className="room-title">{meeting?.topic || "Mentorship Review"}</h1>
          </div>
        </div>
        <button onClick={handleEndCall} className="room-exit-btn">Leave Call</button>
      </header>

      <div className="room-stage">
        <div className="remote-view-box">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className={`remote-video-el ${peerConnected ? 'video-live' : 'video-hidden'}`} 
          />

          {!peerConnected && (
            <div className="awaiting-peer-pane">
              <div className="peer-avatar-glow">
                {(peerEmail || meeting?.mentorEmail || 'M')[0].toUpperCase()}
              </div>
              <span className="awaiting-label">
                Waiting for {peerEmail || meeting?.mentorEmail || 'collaborator'} to connect...
              </span>
              <span className="security-tag">Peer-to-Peer Encrypted WebRTC Bridge</span>
            </div>
          )}
        </div>

        <div className="local-pip-box">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`local-video-el ${videoActive ? '' : 'video-off'}`} 
          />
          {!videoActive && <div className="video-muted-fallback">📷 Off</div>}
          <div className="pip-label">
            <span>You</span>
            {!micActive && <span>🔇</span>}
          </div>
        </div>
      </div>

      <footer className="room-controls-dock">
        <button onClick={toggleMic} className={`dock-btn ${!micActive ? 'dock-btn-alert' : ''}`}>
          <span>{micActive ? '🎙️' : '🔇'}</span>
          <span className="dock-btn-text">{micActive ? 'Mute' : 'Unmuted'}</span>
        </button>
        <button onClick={toggleVideo} className={`dock-btn ${!videoActive ? 'dock-btn-alert' : ''}`}>
          <span>{videoActive ? '📹' : '📷'}</span>
          <span className="dock-btn-text">{videoActive ? 'Stop Cam' : 'Start Cam'}</span>
        </button>
        <button onClick={handleEndCall} className="dock-btn end-call-btn">
          <span>📞</span>
          <span className="dock-btn-text">End</span>
        </button>
      </footer>

      <style jsx global>{`
        .room-viewport {
          background-color: #050508;
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          color: #f4f4f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          position: fixed;
          inset: 0;
          overflow: hidden;
        }
        .room-header-bar {
          padding: 12px 18px;
          background: rgba(10, 10, 15, 0.9);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 50;
        }
        .room-identity { display: flex; align-items: center; gap: 10px; }
        .live-dot-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px #22c55e;
        }
        .room-kicker { font-size: 0.55rem; font-weight: 800; color: #818cf8; font-family: monospace; }
        .room-title { font-size: 1rem; font-weight: 800; margin: 0; color: #fff; }
        .room-exit-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #d4d4d8;
          padding: 6px 14px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
        }
        .room-stage { flex: 1; position: relative; background: #000; }
        .remote-view-box { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .remote-video-el { width: 100%; height: 100%; object-fit: cover; }
        .video-hidden { display: none; }
        .video-live { display: block; }
        .awaiting-peer-pane { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .peer-avatar-glow {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.8rem;
          font-weight: 900;
          color: #fff;
          margin-bottom: 12px;
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
        }
        .awaiting-label { font-size: 0.9rem; font-weight: 700; color: #f4f4f5; margin-bottom: 4px; }
        .security-tag { font-size: 0.65rem; color: #71717a; font-family: monospace; }
        .local-pip-box {
          position: absolute;
          bottom: 90px;
          right: 16px;
          width: 105px;
          height: 150px;
          background: #14141c;
          border-radius: 14px;
          overflow: hidden;
          border: 2px solid rgba(99, 102, 241, 0.4);
          z-index: 30;
        }
        .local-video-el { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
        .video-off { opacity: 0; }
        .video-muted-fallback { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; color: #71717a; }
        .pip-label {
          position: absolute;
          bottom: 4px;
          left: 4px;
          right: 4px;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 6px;
          padding: 2px 6px;
          display: flex;
          justify-content: space-between;
          font-size: 0.6rem;
          font-weight: 700;
          color: #fff;
        }
        .room-controls-dock {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(18, 18, 24, 0.92);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 8px 14px;
          display: flex;
          gap: 12px;
          z-index: 50;
        }
        .dock-btn {
          background: #1e1e28;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 8px 14px;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
        }
        .dock-btn-text { font-size: 0.58rem; font-weight: 700; color: #a1a1aa; margin-top: 2px; }
        .dock-btn-alert { background: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; }
        .end-call-btn { background: #ef4444 !important; }
        .end-call-btn .dock-btn-text { color: #fff; }
      `}</style>
    </div>
  );
}