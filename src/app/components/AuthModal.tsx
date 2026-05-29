'use client';

import React, { useState, useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, refreshToken: string, user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isForgotPassword) {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'request', email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Es ist ein Fehler aufgetreten');
        }

        setSuccess('Ein Link zum Zurücksetzen des Passworts wurde an Ihre E-Mail gesendet.');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    const endpoint = isSignUp ? '/api/auth/signup' : '/api/auth/login';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Es ist ein Fehler aufgetreten');
      }

      if (isSignUp) {
        if (data.session) {
          // Auto logged in on signup
          localStorage.setItem('fb_session_token', data.session.access_token);
          localStorage.setItem('fb_refresh_token', data.session.refresh_token);
          localStorage.setItem('fb_user', JSON.stringify(data.user));
          onAuthSuccess(data.session.access_token, data.session.refresh_token || '', data.user);
          setSuccess('Registrierung erfolgreich! Sie wurden eingeloggt.');
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setSuccess('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.');
        }
      } else {
        localStorage.setItem('fb_session_token', data.session.access_token);
        localStorage.setItem('fb_refresh_token', data.session.refresh_token);
        localStorage.setItem('fb_user', JSON.stringify(data.user));
        onAuthSuccess(data.session.access_token, data.session.refresh_token || '', data.user);
        setSuccess('Erfolgreich eingeloggt!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card auth-modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        {isForgotPassword ? (
          <div style={{ padding: '8px 0', textAlign: 'center' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Kennwort vergessen?</h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Geben Sie Ihre E-Mail-Adresse ein, um einen Passwort-Reset-Link anzufordern.</p>
          </div>
        ) : (
          <div className="auth-tabs">
            <button 
              className={`auth-tab ${!isSignUp ? 'active' : ''}`} 
              onClick={() => { setIsSignUp(false); setIsForgotPassword(false); setError(''); setSuccess(''); }}
            >
              Einloggen
            </button>
            <button 
              className={`auth-tab ${isSignUp ? 'active' : ''}`} 
              onClick={() => { setIsSignUp(true); setIsForgotPassword(false); setError(''); setSuccess(''); }}
            >
              Registrieren
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-alert alert-error">{error}</div>}
          {success && <div className="auth-alert alert-success">{success}</div>}

          <div className="form-group">
            <label htmlFor="email">E-Mail Adresse</label>
            <input 
              type="email" 
              id="email" 
              placeholder="name@beispiel.at" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required 
            />
          </div>

          {!isForgotPassword && (
            <div className="form-group">
              <label htmlFor="password">Passwort</label>
              <input 
                type="password" 
                id="password" 
                placeholder="••••••••" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                required 
                minLength={6}
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner-small"></span>
            ) : isForgotPassword ? (
              'Link anfordern'
            ) : isSignUp ? (
              'Konto erstellen'
            ) : (
              'Anmelden'
            )}
          </button>
        </form>

        <p className="auth-note" style={{ textAlign: 'center' }}>
          {isForgotPassword ? (
            <button 
              type="button" 
              className="link-btn"
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }}
              style={{ color: 'var(--primary-color)', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            >
              Zurück zum Login
            </button>
          ) : isSignUp ? (
            'Mit der Registrierung stimmen Sie den Benachrichtigungseinstellungen zu. Sie können bis zu 10 Firmen favorisieren.'
          ) : (
            <>
              Melden Sie sich an, um Ihre Favoriten zu verwalten und E-Mail-Updates zu erhalten.
              <button 
                type="button" 
                className="link-btn"
                onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                style={{ 
                  display: 'block', 
                  margin: '8px auto 0 auto', 
                  color: 'var(--primary-color)', 
                  fontSize: '13px', 
                  fontWeight: 500, 
                  cursor: 'pointer' 
                }}
              >
                Kennwort vergessen?
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
