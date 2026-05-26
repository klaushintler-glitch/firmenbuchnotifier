'use client';

import React, { useState, useEffect } from 'react';
import AboutCard from './components/AboutCard';
import AuthModal from './components/AuthModal';
import DocDrawer from './components/DocDrawer';
import InfoModal from './components/InfoModal';
import { Company } from '@/services/firmenbuchService';

interface Favorite {
  id: string;
  user_id: string;
  fnr: string;
  company_name: string;
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

  const openInfoModal = (type: 'impressum' | 'privacy') => {
    setInfoModalType(type);
    setIsInfoModalOpen(true);
  };

  // Check for direct-link URL parameters on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const params = new URLSearchParams(window.location.search);
    const fnrParam = params.get('fnr');
    const docParam = params.get('doc');

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
              const matchedCompany = data.find((c: Company) => c.fnr === fnrParam) || data[0];
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
    const token = localStorage.getItem('fb_session_token');
    const userData = localStorage.getItem('fb_user');
    
    if (token && userData) {
      setSessionToken(token);
      setUser(JSON.parse(userData));
      fetchFavorites(token);
    } else {
      // Load initial mock companies for display
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

  const handleAuthSuccess = (token: string, userData: any) => {
    setSessionToken(token);
    setUser(userData);
    fetchFavorites(token);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('fb_session_token');
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
            company_name: company.name
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
          sitz: 'Österreich',
          rechtsform: {
            code: 'Firma',
            text: 'Favorisiertes Unternehmen'
          }
        };
      })
    : results;

  return (
    <div>
      {/* App Header */}
      <header className="app-header">
        <div className="logo-section">
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
              onChange={e => setQuery(e.target.value)}
              disabled={showFavoritesOnly}
              style={{ opacity: showFavoritesOnly ? 0.6 : 1 }}
            />
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="action-btn btn-secondary"
            onClick={() => setIsAboutOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ℹ️ About
          </button>
          {sessionToken && (
            <button 
              className={`action-btn btn-favorites-toggle ${showFavoritesOnly ? 'active' : ''}`}
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
              }}
            >
              ❤️ Favoriten ({favorites.length}/10)
            </button>
          )}

          {sessionToken ? (
            <div className="user-badge">
              <span style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
              <button onClick={handleLogout} className="action-btn btn-secondary">
                Abmelden
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="action-btn btn-primary">
              Einloggen/Registrieren
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="app-container">
        {/* Grid Content */}
        <main className="main-content">
          <h2 className="content-title">
            {showFavoritesOnly 
              ? 'Meine favorisierten Firmen' 
              : 'Österreichische Firmenbucheinträge suchen und sich bei Änderungen benachrichtigen lassen'}
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
                {showFavoritesOnly 
                  ? 'Sie haben noch keine Firmen favorisiert oder die Suche lieferte keine Treffer unter Ihren Favoriten.' 
                  : 'Keine passenden Einträge gefunden. Versuchen Sie es mit einem anderen Begriff.'}
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

                    <h3 className="company-card-name">{company.name}</h3>

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

                    <div className="card-action-bar">
                      <span className="card-action-btn">
                        Dokumente anzeigen
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                          <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
                        </svg>
                      </span>
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
      />
    </div>
  );
}
