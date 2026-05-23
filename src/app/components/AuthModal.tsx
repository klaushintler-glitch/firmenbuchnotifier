'use client';

import React, { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

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
          localStorage.setItem('fb_user', JSON.stringify(data.user));
          onAuthSuccess(data.session.access_token, data.user);
          setSuccess('Registrierung erfolgreich! Sie wurden eingeloggt.');
          setTimeout(() => {
            onClose();
          }, 1500);
        } else {
          setSuccess('Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.');
        }
      } else {
        localStorage.setItem('fb_session_token', data.session.access_token);
        localStorage.setItem('fb_user', JSON.stringify(data.user));
        onAuthSuccess(data.session.access_token, data.user);
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card auth-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>&times;</button>
        
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${!isSignUp ? 'active' : ''}`} 
            onClick={() => { setIsSignUp(false); setError(''); setSuccess(''); }}
          >
            Einloggen
          </button>
          <button 
            className={`auth-tab ${isSignUp ? 'active' : ''}`} 
            onClick={() => { setIsSignUp(true); setError(''); setSuccess(''); }}
          >
            Registrieren
          </button>
        </div>

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

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="spinner-small"></span> : (isSignUp ? 'Konto erstellen' : 'Anmelden')}
          </button>
        </form>

        <p className="auth-note">
          {isSignUp 
            ? 'Mit der Registrierung stimmen Sie den Benachrichtigungseinstellungen zu. Sie können bis zu 10 Firmen favorisieren.' 
            : 'Melden Sie sich an, um Ihre Favoriten zu verwalten und E-Mail-Updates zu erhalten.'}
        </p>
      </div>
    </div>
  );
}
