import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';

const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', approved: 'Approved', rejected: 'Rejected' };

export default function EmployeeDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/dashboard/employee/${id}`).then(res => setData(res.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>Loading...</div>;
  if (!data) return <div style={{ padding: 40 }}>Employee not found</div>;

  const { employee, summary, monthlyData, tasks } = data;
  const chartData = Object.entries(monthlyData).map(([month, v]) => ({ month, ...v }));

  const performanceLevel = summary.completionRate >= 80 ? { label: 'Excellent', color: 'var(--success)' }
    : summary.completionRate >= 60 ? { label: 'Good', color: 'var(--info)' }
    : summary.completionRate >= 40 ? { label: 'Average', color: 'var(--warning)' }
    : { label: 'Needs Improvement', color: 'var(--danger)' };

  return (
    <div style={{ padding: 32 }}>
      <Link to="/employees" style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: 14, marginBottom: 20, display: 'block' }}>
        ← Back to Team
      </Link>

      {/* Employee header */}
      <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28, flexShrink: 0 }}>
          {employee.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>{employee.name}</h1>
          <div style={{ color: 'var(--text2)', fontSize: 14, marginTop: 2 }}>{employee.email}</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>🏢 {employee.department || 'No department'}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px 20px', background: `${performanceLevel.color}15`, borderRadius: 10, border: `1px solid ${performanceLevel.color}30` }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: performanceLevel.color, fontFamily: 'JetBrains Mono' }}>{summary.completionRate}%</div>
          <div style={{ fontSize: 12, color: performanceLevel.color, fontWeight: 600, marginTop: 2 }}>{performanceLevel.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Completion Rate</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Tasks', val: summary.total, cls: 'info' },
          { label: 'Pending', val: summary.pending, cls: 'warning' },
          { label: 'In Progress', val: summary.inProgress, cls: 'accent' },
          { label: 'Approved', val: summary.approved, cls: 'success' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className="stat-value">{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Monthly chart */}
      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Monthly Performance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="assigned" fill="#e94560" radius={[4,4,0,0]} name="Assigned" />
              <Bar dataKey="approved" fill="#00d97e" radius={[4,4,0,0]} name="Approved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* All tasks */}
      <div className="card">
        <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 600 }}>All Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><h3>No tasks assigned</h3></div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Task', 'Status', 'Priority', 'Due Date', 'Created'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map(task => (
                  <tr key={task._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>
                      {task.title}
                      {task.category && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{task.category}</div>}
                    </td>
                    <td style={{ padding: '12px' }}><span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span></td>
                    <td style={{ padding: '12px' }}><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                    <td style={{ padding: '12px', fontSize: 13, color: 'var(--text2)' }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px', fontSize: 13, color: 'var(--text2)' }}>{new Date(task.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
