import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Reports() {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/reports/weekly-preview').then(res => setPreview(res.data)).finally(() => setLoading(false));
  }, []);

  const sendReport = async () => {
    setSending(true);
    try {
      await api.post('/reports/send-weekly');
      toast.success(`Weekly report sent to ${user.email}! 📧`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send report');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>Loading report...</div>;

  const weekRange = preview ? `${new Date(preview.weekStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })} – ${new Date(preview.weekEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}` : '';

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>Weekly Report</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4 }}>{weekRange}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={sendReport} disabled={sending}>
            {sending ? 'Sending...' : '📧 Send to My Email'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Reports also auto-send every Monday 8 AM</div>
        </div>
      </div>

      {/* Overview */}
      {preview && (
        <>
          <div className="grid-4" style={{ marginBottom: 24 }}>
            {[
              { label: 'Tasks Assigned', val: preview.weeklyOverall.total, cls: 'accent' },
              { label: 'Approved', val: preview.weeklyOverall.approved, cls: 'success' },
              { label: 'In Progress', val: preview.weeklyOverall.inProgress, cls: 'info' },
              { label: 'Pending', val: preview.weeklyOverall.pending, cls: 'warning' },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.cls}`}>
                <div className="stat-value">{s.val}</div>
                <div className="stat-label">{s.label} this week</div>
              </div>
            ))}
          </div>

          {/* Per-employee breakdown */}
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 600 }}>Employee Breakdown — This Week</h3>
            {preview.employeeReports.length === 0 ? (
              <div className="empty-state"><div className="icon">📊</div><h3>No data this week</h3><p>No tasks were assigned this week.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Employee', 'Dept', 'Assigned', 'Completed', 'Approved', 'All-time Rate'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.employeeReports.map(emp => (
                      <tr key={emp.email} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{emp.name}</td>
                        <td style={{ padding: '12px', color: 'var(--text2)', fontSize: 13 }}>{emp.department || '—'}</td>
                        <td style={{ padding: '12px', fontFamily: 'JetBrains Mono' }}>{emp.weeklyAssigned}</td>
                        <td style={{ padding: '12px', fontFamily: 'JetBrains Mono', color: 'var(--info)' }}>{emp.weeklyCompleted}</td>
                        <td style={{ padding: '12px', fontFamily: 'JetBrains Mono', color: 'var(--success)' }}>{emp.weeklyApproved}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                              <div style={{ height: '100%', background: emp.completionRate >= 70 ? 'var(--success)' : emp.completionRate >= 40 ? 'var(--warning)' : 'var(--danger)', width: `${emp.completionRate}%`, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono' }}>{emp.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Task details per employee */}
          {preview.employeeReports.filter(e => e.tasksSummary.length > 0).map(emp => (
            <div key={emp.email} className="card" style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 14, fontSize: 14, color: 'var(--text2)' }}>
                {emp.name}'s Tasks This Week
              </h4>
              {emp.tasksSummary.map((task, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>
                    {task.dueDate && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Due: {new Date(task.dueDate).toLocaleDateString()}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
