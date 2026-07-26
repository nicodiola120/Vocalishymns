import React, { useEffect, useRef, useState } from 'react';
import { WiFiShare, PeerDevice } from '../lib/wiFiShare';

interface Props {
  isOpen: boolean;
  hymnName: string;
  filePath: string;
  onClose: () => void;
  onSent: () => void;
}

const platformIcons: Record<string, string> = {
  android: 'M17.523 16.417l-3.723-6.168 3.718-6.157c.312-.516.14-1.167-.382-1.477l-.009-.005a1.067 1.067 0 00-1.466.385l-3.718 6.157h-5.24a.804.804 0 00-.802.79v.002c0 .441.366.799.802.799h5.24l-3.719 6.159a1.065 1.065 0 00.383 1.476 1.07 1.07 0 001.468-.377l3.722-6.161 3.723 6.158a1.07 1.07 0 001.469.383c.515-.314.69-.964.38-1.478l-.006-.008zM3.5 12a2.5 2.5 0 000 5 2.5 2.5 0 000-5z',
};

export default function ShareSheet({ isOpen, hymnName, filePath, onClose, onSent }: Props) {
  const [isListening, setIsListening] = useState(false);
  const [peers, setPeers] = useState<PeerDevice[]>([]);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [sendingTo, setSendingTo] = useState('');
  const listenerRef = useRef<string | null>(null);
  const peerLostRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (listenerRef.current) {
        WiFiShare.removeListener('peerFound', listenerRef.current);
        listenerRef.current = null;
      }
      if (peerLostRef.current) {
        WiFiShare.removeListener('peerLost', peerLostRef.current);
        peerLostRef.current = null;
      }
      WiFiShare.stopListening().catch(() => {});
      setPeers([]);
      setIsListening(false);
      setError('');
      setSent(false);
      setSendingTo('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isListening) return;
    listenerRef.current = WiFiShare.onPeerFound((peer) => {
      setPeers(prev => prev.find(p => p.id === peer.id) ? prev : [...prev, peer]);
    });
    peerLostRef.current = WiFiShare.onPeerLost((peerId) => {
      setPeers(prev => prev.filter(p => p.id !== peerId));
    });
    return () => {
      if (listenerRef.current) {
        WiFiShare.removeListener('peerFound', listenerRef.current);
        listenerRef.current = null;
      }
      if (peerLostRef.current) {
        WiFiShare.removeListener('peerLost', peerLostRef.current);
        peerLostRef.current = null;
      }
    };
  }, [isListening]);

  async function handleStartListening() {
    setError('');
    setPeers([]);
    setIsListening(true);
    try {
      const result = await WiFiShare.startListening('Choralis');
      console.log('WiFi sharing started:', result);
    } catch (e: any) {
      setError('Failed to start: ' + (e.message || 'Unknown'));
      setIsListening(false);
    }
  }

  async function handleSend(peer: PeerDevice) {
    setSendingTo(peer.name);
    setError('');
    try {
      await WiFiShare.sendFile(peer, filePath, hymnName);
      setSent(true);
      setSendingTo('');
    } catch (e: any) {
      setError('Failed to send: ' + (e.message || 'Unknown'));
      setSendingTo('');
    }
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#fff', borderRadius: 16, padding: 24, maxWidth: 360,
        width: '90%', maxHeight: '80vh', overflowY: 'auto',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#333', fontSize: 18 }}>Share Hymn</h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: 22, cursor: 'pointer',
            color: '#666', padding: '4px 8px', lineHeight: 1,
          }} aria-label="Close">&times;</button>
        </div>

        <p style={{ color: '#555', fontSize: 14, marginBottom: 12 }}>Sharing: <strong>{hymnName}</strong></p>

        {sent ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <svg viewBox="0 0 24 24" width="48" height="48" fill="#4CAF50">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            <p style={{ color: '#333', marginTop: 12 }}>Hymn sent successfully!</p>
            <button onClick={onSent} style={{
              marginTop: 16, padding: '10px 24px', backgroundColor: '#4CAF50',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer',
            }}>Done</button>
          </div>
        ) : (
          <>
            {!isListening ? (
              <button onClick={handleStartListening} style={{
                width: '100%', padding: 12, backgroundColor: '#2196F3',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 15,
                cursor: 'pointer', marginBottom: 12,
              }}>
                Start Listening
              </button>
            ) : (
              <div style={{
                padding: 12, backgroundColor: '#E3F2FD', borderRadius: 8,
                marginBottom: 12, textAlign: 'center', color: '#1565C0', fontSize: 14,
              }}>
                <div style={{ marginBottom: 8 }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#1565C0" style={{ animation: 'spin 1.5s linear infinite' }}>
                    <path d="M12 21c-1.65 0-3.06-.59-4.24-1.76L6.34 17.8c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-1.41 1.41C2.78 16.26 2 14.23 2 12s.78-4.26 2.34-5.66L5.76 7.8c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L5.76 4.93C7.15 3.34 9.17 2.55 11 2.05v2.02c-1.55.5-2.92 1.4-4.02 2.64C5.89 7.96 5.25 9.44 5.1 11h13.8c-.15-1.56-.79-3.04-1.88-4.29-1.1-1.24-2.47-2.14-4.02-2.64V2.05c1.83.5 3.85 1.29 5.24 2.88l-1.41 1.41c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.41-1.41C21.22 7.74 22 9.77 22 12s-.78 4.26-2.34 5.66l-1.41-1.41c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l1.41 1.41C15.06 20.41 13.65 21 12 21z"/>
                  </svg>
                </div>
                Searching for nearby devices...
              </div>
            )}

            {error && (
              <div style={{
                padding: 8, backgroundColor: '#FFEBEE', borderRadius: 6,
                marginBottom: 8, color: '#C62828', fontSize: 13, textAlign: 'center',
              }}>{error}</div>
            )}

            {peers.length > 0 && (
              <div>
                <p style={{ color: '#666', fontSize: 13, marginBottom: 8 }}>Nearby devices:</p>
                {peers.map(peer => (
                  <div key={peer.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', backgroundColor: '#F5F5F5', borderRadius: 8,
                    marginBottom: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="#666">
                        <path d={platformIcons.android}/>
                      </svg>
                      <span style={{ color: '#333', fontSize: 14 }}>{peer.name}</span>
                    </div>
                    <button onClick={() => handleSend(peer)} disabled={!!sendingTo} style={{
                      padding: '6px 14px', backgroundColor: sendingTo ? '#BDBDBD' : '#4CAF50',
                      color: '#fff', border: 'none', borderRadius: 6, fontSize: 13,
                      cursor: sendingTo ? 'not-allowed' : 'pointer',
                    }}>
                      {sendingTo === peer.name ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {isListening && peers.length === 0 && !error && (
              <p style={{ color: '#999', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                No devices found yet. Make sure the other device is also listening.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}