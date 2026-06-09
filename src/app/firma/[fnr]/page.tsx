import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getCompanyDocuments, Company, DocumentInfo } from "@/services/firmenbuchService";
import { supabaseAdmin } from "@/services/supabaseClient";
import { searchCompany } from "@/services/firmenbuchService";

interface PageProps {
  params: Promise<{ fnr: string }>;
}

async function getCompanyDetails(fnr: string): Promise<Company> {
  const cleanFnr = fnr.replace(/\s+/g, '');
  
  // 1. Try to get details from favorites database
  try {
    const { data } = await supabaseAdmin
      .from('favorites')
      .select('company_name, status, gericht')
      .eq('company_fn', cleanFnr)
      .limit(1)
      .maybeSingle();
      
    if (data) {
      return {
        fnr: cleanFnr,
        name: data.company_name,
        sitz: data.gericht || 'Österreich',
        rechtsform: { code: 'Firma', text: 'Unternehmen' },
        status: data.status || 'aktiv',
        gericht: data.gericht || ''
      };
    }
  } catch (e) {
    console.warn("DB details fetch failed:", e);
  }
  
  // 2. Fall back to searchCompany (especially for mock FNRs)
  try {
    const results = await searchCompany(cleanFnr);
    if (results.length > 0) {
      const match = results.find(r => r.fnr.replace(/\s+/g, '').toLowerCase() === cleanFnr.toLowerCase());
      if (match) return match;
    }
  } catch (e) {
    console.warn("Search company details failed:", e);
  }
  
  return {
    fnr: cleanFnr,
    name: `Firma (${cleanFnr})`,
    sitz: 'Österreich',
    rechtsform: { code: 'Firma', text: 'Firmenbuch-Eintrag' },
    status: 'aktiv',
    gericht: ''
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { fnr } = await params;
  const cleanFnr = fnr.replace(/\s+/g, '');
  const company = await getCompanyDetails(cleanFnr);

  return {
    title: `${company.name} - Firmenbuchsuche Österreich (FNR ${company.fnr})`,
    description: `Offizielle Firmenbuchdaten und historische Urkunden für ${company.name} (Firmenbuchnummer ${company.fnr}) kostenlos abrufen. Registrierungsgericht: ${company.gericht || 'Österreich'}.`,
  };
}

export default async function CompanyProfilePage({ params }: PageProps) {
  const { fnr } = await params;
  const cleanFnr = fnr.replace(/\s+/g, '');
  
  const company = await getCompanyDetails(cleanFnr);
  
  let documents: DocumentInfo[] = [];
  let error = '';
  try {
    documents = await getCompanyDocuments(cleanFnr);
  } catch (err: any) {
    const errorMsg = err.message || '';
    if (errorMsg.includes('429')) {
      error = 'Zu viele Anfragen an das Firmenbuch (Rate-Limit überschritten). Bitte versuchen Sie es in einigen Minuten erneut.';
    } else {
      error = err.message || 'Dokumente konnten nicht geladen werden.';
    }
  }
  
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFilingDelayText = (doc: any) => {
    if (!doc.dokumentart || !doc.dokumentart.toLowerCase().includes('jahresabschluss')) return null;
    if (!doc.stichtag || !doc.eingereicht) return null;

    try {
      const parseDate = (dStr: string) => {
        const parts = dStr.split('-');
        if (parts.length >= 2) {
          return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
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
      return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-color)]">
      {/* App Header */}
      <header className="app-header">
        <Link href="/" className="logo-section" style={{ textDecoration: 'none' }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ 
              height: '40px', 
              width: 'auto', 
              maxHeight: '44px',
              objectFit: 'contain' 
            }} 
          />
          <span className="logo-text">firmenbuchnotify.at</span>
        </Link>
        <div className="header-actions">
          <Link href={`/?fnr=${cleanFnr}`} className="action-btn btn-primary" style={{ textDecoration: 'none' }}>
            In Suche öffnen & Überwachen
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="app-container" style={{ paddingTop: '100px', flex: 1 }}>
        <main className="main-content" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <div className="company-card" style={{ cursor: 'default', padding: '24px', marginBottom: '24px' }}>
            <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{company.name}</h1>
              {company.status && (
                <span className={`status-badge ${company.status.toLowerCase()}`} style={{ marginLeft: 0 }}>
                  {company.status.toLowerCase() === 'aktiv' ? 'Aktiv' : company.status.toLowerCase() === 'gelöscht' ? 'Gelöscht' : company.status}
                </span>
              )}
            </div>

            <div className="card-meta-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <span className="card-meta-label" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Firmenbuchnummer (FNR)</span>
                <strong style={{ color: 'var(--text-main)' }}>{company.fnr}</strong>
              </div>
              {company.gericht && (
                <div>
                  <span className="card-meta-label" style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>Zuständiges Gericht</span>
                  <strong style={{ color: 'var(--text-main)' }}>{company.gericht}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="company-card" style={{ cursor: 'default', padding: '24px' }}>
            <h3 className="section-title" style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: 'var(--text-main)' }}>Dokumente & Urkunden</h3>
            
            {error && (
              <div style={{ color: '#ef4444', padding: '16px', textAlign: 'center' }}>
                <p>{error}</p>
              </div>
            )}

            {documents.length === 0 && !error && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                <p>Für diese Firma wurden keine Dokumente im offenen Datensatz gefunden.</p>
              </div>
            )}

            {documents.length > 0 && (
              <div className="doc-list">
                {documents.map((doc: any) => (
                  <div key={doc.key} className="doc-card">
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
                    <a 
                      href={`/api/download?key=${encodeURIComponent(doc.key)}`} 
                      download 
                      className="doc-download-btn"
                      title="Dokument herunterladen"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/>
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
