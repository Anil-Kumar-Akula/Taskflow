import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed', approved: 'Approved', rejected: 'Rejected' };

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/employee').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>Loading...</div>;
  if (!data) return null;

  const { summary, weeklyData, recentTasks } = data;

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Your task performance overview</p>
      </div>

      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Pending Tasks', value: summary.pending, cls: 'warning', icon: '📋' },
          { label: 'In Progress', value: summary.inProgress, cls: 'info', icon: '🔄' },
          { label: 'Awaiting Approval', value: summary.completed, cls: 'purple', icon: '⏳' },
          { label: 'Approved', value: summary.approved, cls: 'success', icon: '✅' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Completion rate */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 36, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 16 }}>
            <svg viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--border)" strokeWidth="3" />
              <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                stroke={summary.completionRate >= 70 ? 'var(--success)' : summary.completionRate >= 40 ? 'var(--warning)' : 'var(--danger)'}
                strokeWidth="3" strokeDasharray={`${summary.completionRate}, 100`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono' }}>
              {summary.completionRate}%
            </div>
          </div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Completion Rate</div>
          <div style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{summary.approved} of {summary.total} tasks approved</div>
        </div>

        {/* Weekly chart */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="week" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Bar dataKey="assigned" fill="#e94560" radius={[4,4,0,0]} name="Assigned" />
              <Bar dataKey="approved" fill="#00d97e" radius={[4,4,0,0]} name="Approved" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 600 }}>Recent Tasks</h3>
        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No tasks yet</h3>
            <p>Your manager hasn't assigned any tasks yet.</p>
          </div>
        ) : (
          recentTasks.map(task => (
            <div key={task._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>{task.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  Assigned by {task.assignedBy?.name} · {new Date(task.createdAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
