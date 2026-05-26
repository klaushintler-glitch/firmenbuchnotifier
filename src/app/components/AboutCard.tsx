import React from 'react';

interface AboutCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutCard({ isOpen, onClose }: AboutCardProps) {
  return (
    <>
      {/* Drawer Overlay */}
      <div 
        className={`drawer-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />

      {/* Slide-in About Drawer */}
      <div className={`about-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="drawer-close" onClick={onClose} title="Schließen">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Über das Projekt</h2>
        </div>

        <div className="drawer-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          <p className="about-text">
            Dieses Projekt ermöglicht eine einfache Suche im österreichischen Firmenbuch (Daten zur Verfügung gestellt von findfirma.at). 
            Favorisieren Sie bis zu <strong>10 Unternehmen</strong>, um sofort per E-Mail benachrichtigt zu werden, sobald ein neues Dokument (z.B. Jahresabschluss, Beschlüsse) eingereicht wird.
          </p>

          <p className="about-text text-highlight">
            Die Nutzung der Webseite ist gratis. 
          </p>

          <div className="about-divider"></div>

          <div className="kofi-section" style={{ alignItems: 'center' }}>
            <p className="kofi-text">Gefällt Ihnen das Projekt? Unterstützen Sie meine Arbeit mit einem Kaffee!</p>
            <a href='https://ko-fi.com/V3V7202COK' target='_blank' rel='noopener noreferrer'>
              <img height='36' style={{ border: '0px', height: '36px' }} src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' alt='Buy Me a Coffee at ko-fi.com' />
            </a>
          </div>
        </div>

        <div className="about-footer" style={{ padding: '24px', borderTop: '1px solid var(--border-color)', marginTop: 'auto' }}>
          <span>Version 1.0.0 • Offene HVD-Daten</span>
        </div>
      </div>
    </>
  );
}
