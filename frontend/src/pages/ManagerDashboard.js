import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function ManagerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/manager').then(res => setData(res.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, color: 'var(--text2)' }}>Loading dashboard...</div>;
  if (!data) return null;

  const { summary, employeeStats, monthlyData } = data;
  const chartData = Object.entries(monthlyData).map(([month, v]) => ({ month, ...v }));

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
        <p style={{ color: 'var(--text2)', marginTop: 4 }}>Here's your team's overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Employees', value: summary.totalEmployees, cls: 'info', icon: '👥' },
          { label: 'Awaiting Approval', value: summary.awaitingApproval, cls: 'warning', icon: '⏳' },
          { label: 'In Progress', value: summary.inProgress, cls: 'accent', icon: '🔄' },
          { label: 'Approved Tasks', value: summary.approved, cls: 'success', icon: '✅' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Chart */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 600 }}>Monthly Task Activity</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="assigned" fill="#e94560" radius={[4,4,0,0]} name="Assigned" />
                <Bar dataKey="approved" fill="#00d97e" radius={[4,4,0,0]} name="Approved" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: 'center', color: 'var(--text2)', padding: 40 }}>No task data yet</div>}
        </div>

        {/* Task status summary */}
        <div className="card">
          <h3 style={{ marginBottom: 20, fontSize: 15, fontWeight: 600 }}>Task Status</h3>
          {[
            { label: 'Pending', val: summary.pending, color: 'var(--warning)' },
            { label: 'In Progress', val: summary.inProgress, color: 'var(--info)' },
            { label: 'Awaiting Review', val: summary.completed, color: '#a855f7' },
            { label: 'Approved', val: summary.approved, color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</span>
              </div>
              <span style={{ fontWeight: 700, fontFamily: 'JetBrains Mono', color: s.color }}>{s.val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Employee performance table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Team Performance</h3>
          <Link to="/employees" className="btn btn-secondary btn-sm">View All →</Link>
        </div>
        {employeeStats.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <h3>No employees yet</h3>
            <p>Go to Team to add employees</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Employee', 'Total', 'Pending', 'In Progress', 'Approved', 'Rate'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employeeStats.map(stat => (
                  <tr key={stat.employee._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 500 }}>
                      <Link to={`/employees/${stat.employee._id}`} style={{ color: 'var(--text)', textDecoration: 'none' }}>
                        {stat.employee.name}
                        <div style={{ fontSize: 12, color: 'var(--text2)' }}>{stat.employee.department || 'No dept'}</div>
                      </Link>
                    </td>
                    <td style={{ padding: '12px', fontFamily: 'JetBrains Mono' }}>{stat.total}</td>
                    <td style={{ padding: '12px', color: 'var(--warning)', fontFamily: 'JetBrains Mono' }}>{stat.pending}</td>
                    <td style={{ padding: '12px', color: 'var(--info)', fontFamily: 'JetBrains Mono' }}>{stat.inProgress}</td>
                    <td style={{ padding: '12px', color: 'var(--success)', fontFamily: 'JetBrains Mono' }}>{stat.approved}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ height: '100%', background: stat.completionRate >= 70 ? 'var(--success)' : stat.completionRate >= 40 ? 'var(--warning)' : 'var(--danger)', width: `${stat.completionRate}%`, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 13, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{stat.completionRate}%</span>
                      </div>
                    </td>
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
