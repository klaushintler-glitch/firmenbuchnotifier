'use client';

import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'impressum' | 'privacy';
}

export default function InfoModal({ isOpen, onClose, type }: InfoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card info-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '80vh', overflowY: 'auto' }}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        {type === 'impressum' ? (
          <div className="info-modal-content">
            <h2 className="info-title" style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Impressum & Haftungsausschluss</h2>
            
            <div className="info-section" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '8px' }}>1. Betreiber der Website</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                <strong>Name:</strong> Klaus Hintler<br />
                1140 Wien<br />
                Österreich<br />
                <strong>E-Mail:</strong> <a href="mailto:firmenbuch@proton.me" style={{ color: 'var(--primary-color)' }}>firmenbuch@proton.me</a>
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '8px' }}>2. Inhalt der Website</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Diese Website bietet eine Suchfunktion für Dokumente aus dem österreichischen Firmenbuch (Unternehmensregister). Die Nutzung erfolgt kostenlos und ohne Anmeldung.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '8px' }}>3. Datenschutz</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Die Verarbeitung personenbezogener Daten erfolgt in Übereinstimmung mit der Datenschutz-Grundverordnung (DSGVO) und dem österreichischen Datenschutzgesetz (DSG).
              </p>
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '20px 0' }} />
            
            <h2 className="info-title" style={{ marginBottom: '20px', color: 'var(--text-main)', fontSize: '20px' }}>Haftungsausschluss</h2>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>1. Keine Haftung für Firmenbuchdaten</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Die auf dieser Website bereitgestellten Daten aus dem Firmenbuch werden ohne Gewähr angeboten. Der Betreiber übernimmt keine Verantwortung für die Richtigkeit, Vollständigkeit, Aktualität oder Genauigkeit dieser Informationen. Das Firmenbuch wird vom österreichischen Bundesjustizamt geführt. Für verbindliche und aktuelle Informationen besuchen Sie direkt die offizielle Website des Firmenbuchs unter <a href="https://www.firmenbuch.at" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>www.firmenbuch.at</a>.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>2. Keine Garantie für Verfügbarkeit</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Der Betreiber bemüht sich, die Website zeitlich unbegrenzt verfügbar zu halten, übernimmt jedoch keine Garantie für störungsfreien Betrieb. Die Website kann jederzeit ganz oder teilweise ohne Ankündigung offline gehen. Der Betreiber haftet nicht für Schäden, die durch Ausfallzeiten oder Fehlfunktionen entstehen.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>3. Keine Haftung für externe Links</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Diese Website kann Links zu anderen Websites enthalten. Der Betreiber ist nicht verantwortlich for den Inhalt dieser Websites und haftet nicht für Schäden, die durch den Zugriff oder die Nutzung dieser Websites entstehen.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>4. Beschränkung der Haftung</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                In keinem Fall haften Sie oder der Betreiber für direkte, indirekte, zufällige, spezielle oder Folgeschäden, die sich aus der Nutzung dieser Website ergeben, einschließlich, aber nicht beschränkt auf Datenverlust, Gewinnverlust oder Geschäftsunterbrechung.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>5. Eigenverantwortung bei der Nutzung</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Sie nutzen diese Website auf eigenes Risiko. Alle Informationen werden so bereitgestellt, wie sie verfügbar sind.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>6. Änderungen des Haftungsausschlusses</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Der Betreiber behält sich das Recht vor, diesen Haftungsausschluss jederzeit zu ändern oder zu ergänzen.
              </p>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '30px' }}>
              Stand: 26.05.2026<br />
              Letzte Änderung: 26.05.2026
            </p>
          </div>
        ) : (
          <div className="info-modal-content">
            <h2 className="info-title" style={{ marginBottom: '20px', color: 'var(--text-main)' }}>Datenschutzerklärung</h2>
            
            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>1. Verantwortlicher für die Datenverarbeitung</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Name: Klaus Hintler<br />
                1140 Wien, Österreich<br />
                E-Mail: <a href="mailto:firmenbuch@proton.me" style={{ color: 'var(--primary-color)' }}>firmenbuch@proton.me</a>
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>2. Datenschutzbeauftragter</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Es wurde kein separater Datenschutzbeauftragter bestellt.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>3. Allgemeines zur Datenverarbeitung</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Wir verarbeiten personenbezogene Daten nur im erforderlichen Umfang und nur zu den in dieser Erklärung beschriebenen Zwecken. Wir beachten dabei die Datenschutz-Grundverordnung (DSGVO) und das österreichische Datenschutzgesetz (DSG).
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>4. Automatisch erfasste Daten (Server-Logs)</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).<br />
                Beim Zugriff auf unsere Website werden folgende Informationen automatisch erfasst und gespeichert:
              </p>
              <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px', marginLeft: '20px', marginTop: '6px' }}>
                <li>IP-Adresse</li>
                <li>Zeitstempel des Zugriffs</li>
                <li>Browser und Betriebssystem</li>
                <li>Referrer (von welcher Seite Sie zu uns gekommen sind)</li>
                <li>HTTP-Statuscode</li>
              </ul>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px', marginTop: '6px' }}>
                Diese Daten werden für die Sicherheit, Optimierung und Fehlerdiagnose erfasst. Die Speicherdauer beträgt in der Regel 30 Tage. Nach Ablauf dieser Frist werden die Daten gelöscht.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>5. Cookies</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Diese Website verwendet keine Cookies. Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>6. Externe Dienste und Tracking</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Diese Website verwendet keine externen Analyse- oder Tracking-Tools.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>7. Kontakt</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Kontakt zum Webseitenbetreiber ausschließlich über <a href="mailto:firmenbuch@proton.me" style={{ color: 'var(--primary-color)' }}>firmenbuch@proton.me</a>.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>8. Firmenbuchdaten</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Die auf dieser Website bereitgestellten Firmenbuchdaten stammen aus öffentlich zugänglichen Quellen des Bundesministeriums für Justiz. Diese Daten sind bereits öffentlich und unterliegen nicht dem Datenschutz des Betreibers.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>9. Speicherdauer</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Personenbezogene Daten werden nicht länger als notwendig gespeichert. Die Speicherdauer für Server-Logs beträgt in der Regel 30 Tage.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>10. Weitergabe an Dritte</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Ihre personenbezogenen Daten werden nicht an Dritte weitergegeben, es sei denn, dies ist gesetzlich erforderlich oder Sie haben ausdrücklich zugestimmt.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>11. Sicherheit</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Diese Website verwendet SSL/TLS-Verschlüsselung (HTTPS) zum Schutz von Daten während der Übertragung.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>12. Betroffenenrechte</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Sie haben Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenportabilität und Widerspruch. Wenden Sie sich hierzu an uns per E-Mail.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>13. Beschwerde bei der Aufsichtsbehörde</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Sie haben das Recht, sich bei der österreichischen Datenschutzbehörde (Wickenburggasse 8, 1080 Wien, <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary-color)' }}>www.dsb.gv.at</a>) zu beschweren.
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>14. Hosting</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Diese Website wird gehostet bei: vercel.com. Der Hosting-Provider verarbeitet Daten gemäß Auftragsverarbeitungsvertrag (AVV).
              </p>
            </div>

            <div className="info-section" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--primary-color)', marginBottom: '6px' }}>15. Änderungen dieser Datenschutzerklärung</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
                Wir behalten uns das Recht vor, diese Datenschutzerklärung jederzeit anzupassen oder zu aktualisieren.
              </p>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '30px' }}>
              Stand: 26.05.2026<br />
              Letzte Änderung: 26.05.2026
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
