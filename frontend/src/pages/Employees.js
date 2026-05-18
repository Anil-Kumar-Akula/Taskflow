import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../utils/api';

function AddEmployeeModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/users', form);
      toast.success('Employee created & welcome email sent! 📧');
      onAdd(res.data); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Add Team Member</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group"><label>Full Name *</label><input required placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label>Work Email *</label><input type="email" required placeholder="john@company.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group"><label>Temporary Password *</label><input type="password" required minLength={8} placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div className="form-group"><label>Department</label><input placeholder="e.g. DevOps, Backend" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
          <div style={{ background: 'rgba(57,175,209,0.1)', border: '1px solid rgba(57,175,209,0.3)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: 'var(--info)' }}>
            📧 A welcome email with login credentials will be sent to the employee.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create & Notify'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    api.get('/users').then(res => setEmployees(res.data)).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (emp) => {
    try {
      const res = await api.put(`/users/${emp._id}`, { name: emp.name, department: emp.department, isActive: !emp.isActive });
      setEmployees(prev => prev.map(e => e._id === res.data._id ? res.data : e));
      toast.success(`${emp.name} ${!emp.isActive ? 'activated' : 'deactivated'}`);
    } catch { toast.error('Failed to update'); }
  };

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Team Members</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>{employees.length} employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Employee</button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text2)' }}>Loading...</div>
      ) : employees.length === 0 ? (
        <div className="empty-state">
          <div className="icon">👥</div>
          <h3>No team members yet</h3>
          <p>Add your first employee to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {employees.map(emp => (
            <div key={emp._id} className="card" style={{ opacity: emp.isActive ? 1 : 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600 }}>{emp.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>{emp.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
                <span>🏢 {emp.department || 'No department'}</span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: emp.isActive ? 'rgba(0,217,126,0.15)' : 'rgba(255,255,255,0.05)', color: emp.isActive ? 'var(--success)' : 'var(--text2)' }}>
                  {emp.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link to={`/employees/${emp._id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
                  View Profile
                </Link>
                <button className={`btn btn-sm ${emp.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleActive(emp)}>
                  {emp.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} onAdd={emp => setEmployees(prev => [emp, ...prev])} />}
    </div>
  );
}
