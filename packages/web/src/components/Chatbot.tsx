import { useState } from 'react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Chat Button */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
        <img src="/amazon-quick-logo.png" alt="Quick" onClick={() => setIsOpen(!isOpen)}
          style={{ width: '56px', height: '56px', borderRadius: '12px', cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'transform 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')} />
      </div>

      {/* Chat Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '100px', right: '24px',
          width: '450px', height: '700px', backgroundColor: 'white',
          borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 999, overflow: 'hidden', border: '1px solid #ddd',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px', background: 'linear-gradient(135deg, #0972D3, #0653A8)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
              }}>🤖</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>XPC Assistant</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Always available</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{
              background: 'none', border: 'none', color: 'white',
              fontSize: '24px', cursor: 'pointer', padding: '4px', lineHeight: 1,
            }}>×</button>
          </div>

          {/* QuickSuite Agent iframe */}
          <iframe
            style={{ flex: 1, border: 'none' }}
            width="100%"
            allow={`clipboard-read ${import.meta.env.VITE_QUICKSIGHT_URL}; clipboard-write ${import.meta.env.VITE_QUICKSIGHT_URL}`}
            src={import.meta.env.VITE_QUICKSIGHT_EMBED_URL}
          />
        </div>
      )}
    </>
  );
}
