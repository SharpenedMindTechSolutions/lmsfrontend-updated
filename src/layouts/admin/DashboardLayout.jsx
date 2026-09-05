import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/admin/AuthContext';
import {
  FiHome,
  FiLogOut,
  FiMenu,
  FiX,
  FiShield,
  FiChevronRight,
  FiPackage
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import logoFull from '../../assets/logo-full.png';
import logoIcon from '../../assets/logo-icon.png';

const NAV = [
  { to: '/admin/dashboard', icon: FiHome, label: 'Dashboard', end: true },
  { to: '/admin/dashboard/payments', icon: FaRupeeSign, label: 'UPI Payment Approvals' },
  { to: '/admin/dashboard/combos', icon: FiPackage, label: 'Combo Offers' },
];

export default function AdminDashboardLayout({ children }) {
  const { admin, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const doLogout = () => {
    logout();
    nav('/admin/login');
  };

  const initials = admin?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AD';

  return (
    <div className="dash-shell">
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 45, backdropFilter: 'blur(2px)' }}
        />
      )}

      <aside className={`dash-sidebar${open ? ' open' : ''}`}>
        <div style={{ padding: '18px 16px 14px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src={logoFull} alt="SharpenedMind" className="logo-full" style={{ height: 42, objectFit: 'contain', maxWidth: 175 }} />
          </div>
          <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.12)', color: '#e0e7ff', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, letterSpacing: '.04em' }}>
            <FiShield size={12} /> SUPER ADMIN
          </div>
        </div>

        {/* Admin Info */}
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 11, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="avatar" style={{ width: 38, height: 38, fontSize: 13, background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: '#fff', fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {admin?.name || 'Super Admin'}
            </p>
            <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 11.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {admin?.email || 'admin@lms.com'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', padding: '0 8px 8px' }}>
            ADMIN MENU
          </div>
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={17} style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              <FiChevronRight size={13} style={{ opacity: .4 }} />
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={doLogout} className="nav-item" style={{ color: '#fca5a5' }}>
            <FiLogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="dash-main">
        {/* Topbar */}
        <header className="dash-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setOpen(true)} style={{ padding: 6, display: 'none' }} id="admin-mob-menu">
              <FiMenu size={20} />
            </button>
            <h2 style={{ fontSize: 19, color: '#1f2937', fontWeight: 700, margin: 0 }}>
              Super Admin Portal
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              Logged in as <strong style={{ color: '#4c1d95' }}>{admin?.email || 'admin@lms.com'}</strong>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="dash-content">
          {children}
        </main>
      </div>
    </div>
  );
}
