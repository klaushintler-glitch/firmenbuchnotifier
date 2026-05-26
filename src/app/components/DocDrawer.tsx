'use client';

import React, { useEffect, useState } from 'react';
import { Company, DocumentInfo } from '@/services/firmenbuchService';

interface DocDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  highlightDocKey?: string | null;
}

export default function DocDrawer({ isOpen, onClose, company, highlightDocKey }: DocDrawerProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && company) {
      fetchDocuments();
    } else {
      setDocuments([]);
      setError('');
    }
  }, [isOpen, company]);

  const fetchDocuments = async () => {
    if (!company) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/documents?fnr=${encodeURIComponent(company.fnr)}`);
      if (!response.ok) {
        throw new Error('Dokumente konnten nicht geladen werden.');
      }
      const data = await response.json();
      setDocuments(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (key: string) => {
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = `/api/download?key=${encodeURIComponent(key)}`;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFilingDelayText = (doc: DocumentInfo) => {
    if (!doc.dokumentart || !doc.dokumentart.toLowerCase().includes('jahresabschluss')) return null;
    if (!doc.stichtag || !doc.eingereicht) return null;

    try {
      const parseDate = (dStr: string) => {
        const parts = dStr.split('-');
        if (parts.length >= 2) {
          return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
        }
        const d = new Date(dStr);
        if (!isNaN(d.getTime())) {
          return { year: d.getFullYear(), month: d.getMonth() + 1 };
        }
        return null;
      };

      const s = parseDate(doc.stichtag);
      const e = parseDate(doc.eingereicht);
      if (!s || !e) return null;

      const diffMonths = (e.year - s.year) * 12 + (e.month - s.month);
      if (diffMonths <= 0) return null;

      return `Eingereicht nach ${diffMonths} ${diffMonths === 1 ? 'Monat' : 'Monaten'}`;
    } catch (e) {
      console.error("Error calculating filing delay:", e);
      return null;
    }
  };

  return (
    <>
      {/* Drawer Overlay */}
      <div 
        className={`drawer-overlay ${isOpen ? 'active' : ''}`} 
        onClick={onClose}
      />

      {/* Slide-in Drawer */}
      <div className={`doc-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <button className="drawer-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
          
          {company && (
            <div className="drawer-title-section">
              <span className="drawer-badge">{company.rechtsform.code}</span>
              <div className="drawer-company-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <h2 className="drawer-company-name" style={{ margin: 0 }}>{company.name}</h2>
                {company.status && (
                  <span className={`status-badge ${company.status.toLowerCase()}`} style={{ marginLeft: 0 }}>
                    {company.status.toLowerCase() === 'aktiv' ? 'Aktiv' : company.status.toLowerCase() === 'gelöscht' ? 'Gelöscht' : company.status}
                  </span>
                )}
              </div>
              <div className="drawer-meta-grid">
                <div>
                  <strong>FNR:</strong> {company.fnr}
                </div>
                <div>
                  <strong>Sitz:</strong> {company.sitz}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-body">
          <h3 className="section-title">Dokumente & Urkunden</h3>

          {loading && (
            <div className="drawer-loader">
              <span className="spinner-large"></span>
              <p>Lade Dokumente aus dem Firmenbuch...</p>
            </div>
          )}

          {error && (
            <div className="drawer-error">
              <p>{error}</p>
              <button onClick={fetchDocuments} className="retry-btn">Erneut versuchen</button>
            </div>
          )}

          {!loading && !error && documents.length === 0 && (
            <div className="drawer-empty">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ opacity: 0.3 }}>
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
              </svg>
              <p>Für diese Firma wurden keine Dokumente im offenen Datensatz gefunden.</p>
            </div>
          )}

          {!loading && !error && documents.length > 0 && (
            <div className="doc-list">
              {documents.map((doc) => (
                <div 
                  key={doc.key} 
                  className={`doc-card ${highlightDocKey === doc.key ? 'highlighted' : ''}`}
                >
                  <div className="doc-card-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                    </svg>
                  </div>
                  <div className="doc-card-info">
                    <h4 className="doc-card-title">{doc.dokumentart}</h4>
                    <div className="doc-card-meta">
                      <span><strong>AZ:</strong> {doc.az}</span>
                      <span>•</span>
                      <span>{doc.eingereicht}</span>
                      <span>•</span>
                      <span className="doc-size-badge">{formatSize(doc.groesse)}</span>
                      {getFilingDelayText(doc) && (
                        <>
                          <span>•</span>
                          <span className="filing-delay-badge">{getFilingDelayText(doc)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDownload(doc.key)} 
                    className="doc-download-btn"
                    title="Dokument herunterladen"
                  >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
