import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_MANAGER = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/tasks', icon: '✓', label: 'Tasks' },
  { to: '/employees', icon: '👥', label: 'Team' },
  { to: '/reports', icon: '📊', label: 'Reports' },
];

const NAV_EMPLOYEE = [
  { to: '/dashboard', icon: '⊞', label: 'Dashboard' },
  { to: '/tasks', icon: '✓', label: 'My Tasks' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nav = user?.role === 'manager' ? NAV_MANAGER : NAV_EMPLOYEE;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100, transform: sidebarOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s'
      }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent)', letterSpacing: -1 }}>TaskFlow</div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2, textTransform: 'uppercase', letterSpacing: 2 }}>
            {user?.role}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {nav.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 14px', borderRadius: 8, marginBottom: 4,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                background: isActive ? 'rgba(233,69,96,0.15)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text2)',
                border: isActive ? '1px solid rgba(233,69,96,0.3)' : '1px solid transparent',
                transition: 'all 0.2s'
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 13 }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, marginLeft: 240, minHeight: '100vh', background: 'var(--bg)' }}>
        <Outlet />
      </main>
    </div>
  );
}
