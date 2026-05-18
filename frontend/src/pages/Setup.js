import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

export default function Setup() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/setup', form);
      toast.success('Manager account created! Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--accent)', letterSpacing: -2 }}>TaskFlow</div>
          <div style={{ color: 'var(--text2)', marginTop: 6 }}>Initial Setup — Create Manager Account</div>
        </div>
        <div className="card" style={{ padding: 32 }}>
          <div style={{ background: 'rgba(246,201,14,0.1)', border: '1px solid rgba(246,201,14,0.3)', borderRadius: 8, padding: 12, marginBottom: 24, fontSize: 13, color: 'var(--warning)' }}>
            ⚠️ This page is only accessible once — when no users exist.
          </div>
          <h2 style={{ marginBottom: 24, fontSize: 20 }}>Create Manager Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Work Email</label>
              <input type="email" required placeholder="manager@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required minLength={8} placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
              {loading ? 'Creating...' : 'Create Account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
