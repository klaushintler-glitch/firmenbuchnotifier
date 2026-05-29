'use client';

import React, { useState, useEffect } from 'react';
import AboutCard from './components/AboutCard';
import AuthModal from './components/AuthModal';
import DocDrawer from './components/DocDrawer';
import InfoModal from './components/InfoModal';
import ResetPasswordModal from './components/ResetPasswordModal';
import { Company } from '@/services/firmenbuchService';

interface Favorite {
  id: string;
  user_id: string;
  fnr: string;
  company_name: string;
  email_notifications?: boolean;
  status?: string;
  gericht?: string;
  tracked_documents?: { document_name: string }[];
  created_at: string;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Company[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Auth state
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Drawer state
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [highlightedDocKey, setHighlightedDocKey] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

  // Info Modal state (Impressum / Privacy)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoModalType, setInfoModalType] = useState<'impressum' | 'privacy'>('impressum');

  // Reset password state
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(null);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  const openInfoModal = (type: 'impressum' | 'privacy') => {
    setInfoModalType(type);
    setIsInfoModalOpen(true);
  };

  const handleGoHome = () => {
    setQuery('');
    setShowFavoritesOnly(false);
    setIsDrawerOpen(false);
    setSelectedCompany(null);
    setHighlightedDocKey(null);
    performSearch('');
  };

  // Check for direct-link URL parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const fnrParam = params.get('fnr');
    const docParam = params.get('doc');
    const resetTokenParam = params.get('reset_token');

    if (resetTokenParam) {
      setResetPasswordToken(resetTokenParam);
      setIsResetPasswordModalOpen(true);
      // Clean URL parameters for a cleaner experience
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (fnrParam) {
      setQuery(fnrParam);
      if (docParam) {
        setHighlightedDocKey(docParam);
      }
      
      const fetchDirectCompany = async () => {
        try {
          const response = await fetch(`/api/search?query=${encodeURIComponent(fnrParam)}`);
          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              const matchedCompany = data.find((c: Company) => c.fnr.toLowerCase().replace(/\s+/g, '') === fnrParam.toLowerCase().replace(/\s+/g, '')) || data[0];
              setSelectedCompany(matchedCompany);
              setIsDrawerOpen(true);
            }
          }
        } catch (err) {
          console.error("Error loading direct link company:", err);
        }
      };

      fetchDirectCompany();
    }
  }, []);

  // Load auth state and favorites on mount
  useEffect(() => {
    const refreshToken = localStorage.getItem('fb_refresh_token');
    const userData = localStorage.getItem('fb_user');
    
    if (refreshToken && userData) {
      refreshSession(refreshToken);
    } else {
      // Clear any incomplete session state and load initial mock
      localStorage.removeItem('fb_session_token');
      localStorage.removeItem('fb_refresh_token');
      localStorage.removeItem('fb_user');
      performSearch('');
    }
  }, []);

  // Real-time search debounce
  useEffect(() => {
    if (showFavoritesOnly) return;

    const delayDebounce = setTimeout(() => {
      performSearch(query);
    }, 450);

    return () => clearTimeout(delayDebounce);
  }, [query, showFavoritesOnly]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error('Fehler bei der Suche im Firmenbuch.');
      }
      const data = await response.json();
      setResults(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async (token: string) => {
    try {
      const response = await fetch('/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFavorites(data || []);
      }
    } catch (err) {
      console.error("Failed to load favorites:", err);
    }
  };

  const refreshSession = async (rToken: string) => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session) {
          localStorage.setItem('fb_session_token', data.session.access_token);
          localStorage.setItem('fb_refresh_token', data.session.refresh_token);
          localStorage.setItem('fb_user', JSON.stringify(data.user));
          setSessionToken(data.session.access_token);
          setUser(data.user);
          fetchFavorites(data.session.access_token);
          return;
        }
      }
    } catch (err) {
      console.error("Session refresh failed:", err);
    }
    
    // If refresh fails, log out the user
    handleLogout();
  };

  const handleAuthSuccess = (token: string, refreshToken: string, userData: any) => {
    setSessionToken(token);
    setUser(userData);
    fetchFavorites(token);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('fb_session_token');
    localStorage.removeItem('fb_refresh_token');
    localStorage.removeItem('fb_user');
    setSessionToken(null);
    setUser(null);
    setFavorites([]);
    setShowFavoritesOnly(false);
    performSearch(query); // Reload search results
  };

  const isFavorited = (fnr: string) => {
    return favorites.some(fav => fav.fnr === fnr);
  };

  const isEmailNotificationsOn = (fnr: string) => {
    const fav = favorites.find(f => f.fnr === fnr);
    return fav ? fav.email_notifications !== false : false;
  };

  const renderDocStats = (companyFnr: string) => {
    const fav = favorites.find(f => f.fnr === companyFnr);
    if (!fav || !fav.tracked_documents || fav.tracked_documents.length === 0) {
      return null;
    }

    const total = fav.tracked_documents.length;
    const annualReports = fav.tracked_documents.filter(d => 
      d.document_name.toLowerCase().includes('jahresabschluss')
    ).length;
    const contracts = fav.tracked_documents.filter(d => 
      d.document_name.toLowerCase().includes('vertrag')
    ).length;

    const parts: string[] = [];
    if (annualReports > 0) {
      parts.push(`${annualReports} ${annualReports === 1 ? 'Jahresabschluss' : 'Jahresabschlüsse'}`);
    }
    if (contracts > 0) {
      parts.push(`${contracts} ${contracts === 1 ? 'Vertrag' : 'Verträge'}`);
    }
    const otherCount = total - annualReports - contracts;
    if (otherCount > 0) {
      parts.push(`${otherCount} sonstige${otherCount === 1 ? 's' : ''}`);
    }

    const statsDetail = parts.length > 0 ? ` (${parts.join(', ')})` : '';

    return (
      <div className="card-doc-stats">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '6px', flexShrink: 0, opacity: 0.8 }}>
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
        </svg>
        <span>
          <strong>{total}</strong> {total === 1 ? 'Dokument' : 'Dokumente'}{statsDetail}
        </span>
      </div>
    );
  };

  const handleToggleEmailNotifications = async (e: React.SyntheticEvent, company: Company) => {
    e.stopPropagation(); // Avoid opening the document drawer
    
    if (!sessionToken) {
      setIsAuthModalOpen(true);
      return;
    }

    const alreadyFav = isFavorited(company.fnr);

    if (!alreadyFav) {
      if (favorites.length >= 10) {
        alert('Sie haben das Limit von 10 favorisierten Firmen erreicht. Bitte entfernen Sie eine Firma, um eine neue hinzufügen zu können.');
        return;
      }

      try {
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            fnr: company.fnr,
            company_name: company.name,
            status: company.status,
            gericht: company.gericht
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            fetchFavorites(sessionToken);
          }
        } else {
          const errData = await response.json();
          alert(errData.error || 'Fehler beim Favorisieren der Firma');
        }
      } catch (err: any) {
        alert(err.message);
      }
      return;
    }

    const currentStatus = isEmailNotificationsOn(company.fnr);
    const newStatus = !currentStatus;

    try {
      const response = await fetch('/api/favorites', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          fnr: company.fnr,
          email_notifications: newStatus
        })
      });

      if (response.ok) {
        setFavorites(favorites.map(fav => 
          fav.fnr === company.fnr ? { ...fav, email_notifications: newStatus } : fav
        ));
      } else {
        const errData = await response.json();
        alert(errData.error || 'Fehler beim Ändern der E-Mail-Einstellungen');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, company: Company) => {
    e.stopPropagation(); // Avoid opening the document drawer
    
    if (!sessionToken) {
      setIsAuthModalOpen(true);
      return;
    }

    const alreadyFav = isFavorited(company.fnr);

    try {
      if (alreadyFav) {
        // DELETE favorite
        const response = await fetch(`/api/favorites?fnr=${encodeURIComponent(company.fnr)}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${sessionToken}` }
        });
        
        if (response.ok) {
          setFavorites(favorites.filter(fav => fav.fnr !== company.fnr));
        } else {
          const errData = await response.json();
          alert(errData.error || 'Fehler beim Entfernen aus den Favoriten');
        }
      } else {
        // POST favorite
        if (favorites.length >= 10) {
          alert('Sie haben das Limit von 10 favorisierten Firmen erreicht. Bitte entfernen Sie eine Firma, um eine neue hinzufügen zu können.');
          return;
        }

        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            fnr: company.fnr,
            company_name: company.name,
            status: company.status,
            gericht: company.gericht
          })
        });

        const data = await response.json();

        if (response.ok) {
          if (data.success) {
            fetchFavorites(sessionToken);
          }
        } else {
          alert(data.error || 'Fehler beim Hinzufügen zu den Favoriten');
        }
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      alert('Netzwerkfehler beim Aktualisieren der Favoriten');
    }
  };

  const openDrawer = (company: Company) => {
    setSelectedCompany(company);
    setIsDrawerOpen(true);
  };

  // Companies to display (either filtered by search results or by favorites)
  const companiesToDisplay = showFavoritesOnly 
    ? favorites.map(fav => {
        const fullCompany = results.find(r => r.fnr === fav.fnr);
        return fullCompany || {
          fnr: fav.fnr,
          name: fav.company_name,
          sitz: fav.gericht || 'Österreich',
          rechtsform: {
            code: 'Firma',
            text: 'Favorisiertes Unternehmen'
          },
          status: fav.status || 'aktiv',
          gericht: fav.gericht || ''
        };
      })
    : results;

  return (
    <div>
      {/* App Header */}
      <header className="app-header">
        <div className="logo-section" onClick={handleGoHome}>
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
          <h1 className="logo-text">FirmenbuchNotifier</h1>
        </div>

        <div className="search-container">
          <div className="search-input-wrapper">
            <svg 
              className="search-input-icon" 
              viewBox="0 0 24 24" 
              width="20" 
              height="20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Suchen nach Firmennamen, Ort oder FNR..." 
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                if (showFavoritesOnly) {
                  setShowFavoritesOnly(false);
                }
              }}
            />
          </div>
        </div>

        <div className="header-actions">
          {sessionToken && (
            <button 
              className={`action-btn btn-favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
            >
              <svg 
                viewBox="0 0 24 24" 
                width="16" 
                height="16" 
                fill="currentColor" 
                style={{ 
                  color: showFavoritesOnly ? '#fff' : 'var(--primary-color)',
                  marginRight: '6px',
                  transition: 'color var(--transition-speed) ease'
                }}
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Favoriten ({favorites.length}/10)
            </button>
          )}

          {sessionToken ? (
            <div className="user-badge">
              <span className="user-email-text" style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
              <button onClick={handleLogout} className="action-btn btn-secondary">
                Abmelden
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="action-btn btn-primary">
              Einloggen/Registrieren
            </button>
          )}

          <button 
            className="action-btn btn-secondary"
            onClick={() => setIsAboutOpen(true)}
          >
            Über
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-container">
        {/* Grid Content */}
        <main className="main-content">
          <h2 className="content-title">
            {showFavoritesOnly 
              ? 'Meine favorisierten Firmen' 
              : 'Österreichische Firmendaten recherchieren und Firmenbuchänderungen automatisch überwachen'}
          </h2>

          {loading && (
            <div className="grid-loader">
              <span className="spinner-large"></span>
              <p>Durchsuche Firmenbuch...</p>
            </div>
          )}

          {error && (
            <div className="grid-empty" style={{ color: '#ef4444' }}>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && companiesToDisplay.length === 0 && (
            <div className="grid-empty">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor" style={{ opacity: 0.3 }}>
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <p>
                {showFavoritesOnly ? (
                  'Sie haben noch keine Firmen favorisiert oder die Suche lieferte keine Treffer unter Ihren Favoriten.'
                ) : query.trim() === '' ? (
                  'Bitte Suche im Suchfeld starten'
                ) : (
                  'Keine passenden Einträge gefunden. Versuchen Sie es mit einem anderen Begriff.'
                )}
              </p>
            </div>
          )}

          {!loading && !error && companiesToDisplay.length > 0 && (
            <div className="masonry-grid">
              {companiesToDisplay.map((company) => (
                <div 
                  key={company.fnr} 
                  className="masonry-item" 
                  onClick={() => openDrawer(company)}
                >
                  <div className="company-card">
                    <div className="card-top">
                      <span className="card-badge">{company.rechtsform.code}</span>
                      <button 
                        className={`card-favorite-btn ${isFavorited(company.fnr) ? 'favorited' : ''}`}
                        onClick={(e) => handleToggleFavorite(e, company)}
                        title={isFavorited(company.fnr) ? "Von Favoriten entfernen" : "Zu Favoriten hinzufügen"}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                      </button>
                    </div>

                     <div className="card-title-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <h3 className="company-card-name" style={{ margin: 0 }}>{company.name}</h3>
                      {company.status && (
                        <span className={`status-badge ${company.status.toLowerCase()}`} style={{ marginLeft: 0 }}>
                          {company.status.toLowerCase() === 'aktiv' ? 'Aktiv' : company.status.toLowerCase() === 'gelöscht' ? 'Gelöscht' : company.status}
                        </span>
                      )}
                    </div>

                    <div className="card-meta-row">
                      <div className="card-meta-item">
                        <span className="card-meta-label">FNR:</span>
                        <span>{company.fnr}</span>
                      </div>
                      <div className="card-meta-item">
                        <span className="card-meta-label">Sitz:</span>
                        <span>{company.sitz}</span>
                      </div>
                      <div className="card-meta-item">
                        <span className="card-meta-label">Rechtsform:</span>
                        <span>{company.rechtsform.text}</span>
                      </div>
                    </div>

                    {isFavorited(company.fnr) && renderDocStats(company.fnr)}

                    <div className="card-action-bar" onClick={(e) => e.stopPropagation()}>
                      <div className="email-toggle-row">
                        <span className="email-toggle-text">E-Mail-Benachrichtigung</span>
                        <label className="switch">
                          <input 
                            type="checkbox" 
                            checked={isEmailNotificationsOn(company.fnr)}
                            onChange={(e) => handleToggleEmailNotifications(e, company)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Slide-in Document Drawer */}
      <DocDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setHighlightedDocKey(null);
        }}
        company={selectedCompany}
        highlightDocKey={highlightedDocKey}
      />

      {/* About Drawer */}
      <AboutCard 
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* Auth Modal Overlay */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span>&copy; {new Date().getFullYear()} FirmenbuchNotifier</span>
          <span className="footer-links">
            <button onClick={() => openInfoModal('impressum')} className="footer-link-btn">Impressum</button>
            <span className="footer-separator">&bull;</span>
            <button onClick={() => openInfoModal('privacy')} className="footer-link-btn">Datenschutzerklärung</button>
          </span>
        </div>
      </footer>

      {/* Info Modal (Impressum / Datenschutzerklärung) */}
      <InfoModal 
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        type={infoModalType}
        onSwitchType={setInfoModalType}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal 
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        token={resetPasswordToken || ''}
      />
    </div>
  );
}
