'use client';

import React, { useState } from 'react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function ResetPasswordModal({ isOpen, onClose, token }: ResetPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Aktualisieren des Passworts');
      }

      setSuccess('Passwort erfolgreich zurückgesetzt! Sie können sich nun anmelden.');
      setTimeout(() => {
        onClose();
      }, 2000);
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
        
        <div style={{ padding: '8px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>Neues Passwort vergeben</h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Geben Sie Ihr neues gewünschtes Passwort ein.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-alert alert-error">{error}</div>}
          {success && <div className="auth-alert alert-success">{success}</div>}

          <div className="form-group">
            <label htmlFor="new-password">Neues Passwort</label>
            <input 
              type="password" 
              id="new-password" 
              placeholder="Mindestens 6 Zeichen" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm-password">Passwort bestätigen</label>
            <input 
              type="password" 
              id="confirm-password" 
              placeholder="Neues Passwort wiederholen" 
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required 
              minLength={6}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span className="spinner-small"></span> : 'Passwort speichern'}
          </button>
        </form>
      </div>
    </div>
  );
}
