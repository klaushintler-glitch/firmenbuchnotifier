import React from 'react';

export default function AboutCard() {
  return (
    <div className="about-card">
      <div className="avatar-container">
        <div className="avatar-fallback">FN</div>
      </div>
      <h2 className="about-title">Firmenbuch Notifier</h2>
      <p className="about-subtitle">Über das Projekt</p>
      
      <div className="about-divider"></div>
      
      <p className="about-text">
        Dieses Projekt ermöglicht eine einfache Suche im österreichischen Firmenbuch (Daten zur Verfügung gestellt von findfirma.at). 
        Favorisieren Sie bis zu <strong>10 Unternehmen</strong>, um sofort per E-Mail benachrichtigt zu werden, sobald ein neues Dokument (z.B. Jahresabschluss, Beschlüsse) eingereicht wird.
      </p>

      <p className="about-text text-highlight">
        Die Nutzung der Webseite gratis. 
      </p>

      <div className="about-divider"></div>

      <div className="kofi-section">
        <p className="kofi-text">Gefällt Ihnen das Projekt? Unterstützen Sie meine Arbeit mit einem Kaffee!</p>
        <a 
          href="https://ko-fi.com/klaus_fb_notifier" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="kofi-btn"
        >
          <svg className="kofi-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.881 8.948c-.773-4.085-4.859-4.593-4.859-4.593H.723c-.604 0-.679.798-.679.798s-.082 7.324-.022 11.822c.164 12.424 10.508 12.772 10.508 12.772 10.025.253 10.457-12.73 10.457-12.73s3.655-.41 3.655-3.411c-.001-1.397-.089-3.235-.783-4.658zm-5.61 5.09s-.041.223-.081.564c-.388 3.284-3.29 9.352-9.729 9.352-4.379 0-7.396-3.324-7.627-8.593-.058-1.313-.016-10.422-.016-10.422h17.478c.008 1.416.035 7.426-.025 9.1zM23.16 11.38c-.062 1.349-.853 1.539-1.415 1.624v-4.82c.633.033 1.454.12 1.482 1.656-.008.318-.016.92-.067 1.54z"/>
          </svg>
          Buy me a Ko-fi
        </a>
      </div>
      
      <div className="about-footer">
        <span>Version 1.0.0 • Offene HVD-Daten</span>
      </div>
    </div>
  );
}
