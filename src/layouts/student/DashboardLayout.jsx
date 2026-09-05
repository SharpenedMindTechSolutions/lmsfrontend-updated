import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/student/AuthContext';
import { gamificationAPI } from '../../services/student/api';
import useActiveTimeTracker from '../../hooks/useActiveTimeTracker';
import StreakFlameWidget from '../../components/gamification/StreakFlameWidget';
import {
  FiHome, FiBook, FiCheckSquare, FiTrendingUp, FiUser,
  FiLogOut, FiMenu, FiX, FiBell, FiChevronRight, FiClipboard, FiCode
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import logoFull from '../../assets/logo-full.png';
import logoIcon from '../../assets/logo-icon.png';

const NAV = [
  { to:'/dashboard',             icon:FiHome,        label:'Dashboard',   end:true },
  { to:'/dashboard/daily-game',  icon:FiCode,        label:'Daily Code Game' },
  { to:'/dashboard/courses',     icon:FiBook,        label:'Courses' },
  { to:'/dashboard/my-courses',  icon:FiCheckSquare, label:'My Courses' },
  { to:'/dashboard/assignments', icon:FiClipboard,   label:'Assignments' },
  { to:'/dashboard/progress',    icon:FiTrendingUp,  label:'Progress' },
  { to:'/dashboard/payments',    icon:FaRupeeSign,  label:'Payment History' },
  { to:'/dashboard/profile',     icon:FiUser,        label:'Profile' },
];

export default function DashboardLayout({ children }) {
  const { student, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [streakStats, setStreakStats] = useState(null);

  // Global active time tracker for student portal
  useActiveTimeTracker({ activityType: 'browse' });

  // Load streak status on layout mount
  useEffect(() => {
    gamificationAPI.myStats()
      .then(r => setStreakStats(r.data))
      .catch(() => {});
  }, []);

  const doLogout = async () => { await logout(); nav('/login'); };
  const initials = student?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'S';

  return (
    <div className="dash-shell">
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.4)', zIndex:45, backdropFilter:'blur(2px)' }}
        />
      )}

      <aside className={`dash-sidebar${open ? ' open' : ''}`}>
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <img src={logoFull} alt="SharpenedMind" className="logo-full" style={{ height:42, objectFit:'contain', maxWidth:175 }} />
            <img src={logoIcon} alt="SM" className="logo-icon" style={{ height:36, objectFit:'contain' }} />
            <button className="btn btn-ghost close-sb-btn" onClick={() => setOpen(false)} style={{ color:'rgba(255,255,255,.6)', padding:6 }}>
              <FiX size={18} />
            </button>
          </div>
          <p style={{ color:'rgba(255,255,255,.45)', fontSize:10, marginTop:6, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' }}>Student Portal</p>
        </div>

        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="avatar" style={{ width:38, height:38, fontSize:14 }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#fff', fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{student?.name}</p>
              <p style={{ color:'rgba(255,255,255,.45)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{student?.email}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
          <p style={{ color:'rgba(255,255,255,.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', padding:'0 10px', marginBottom:8 }}>Menu</p>
          {NAV.map(({ to, icon:Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <Icon size={17} /><span>{label}</span>
              <FiChevronRight size={14} style={{ marginLeft:'auto', opacity:.4 }} />
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,.1)' }}>
          <button onClick={doLogout} className="nav-item" style={{ color:'rgba(255,255,255,.7)' }}>
            <FiLogOut size={17} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="btn btn-ghost open-sb-btn" style={{ padding:8 }} onClick={() => setOpen(true)}>
              <FiMenu size={21} />
            </button>
            <img src={logoIcon} alt="SM" className="topbar-mobile-logo" style={{ height:30, objectFit:'contain' }} />
            <h3 className="topbar-title" style={{ fontSize:13, color:'#4c1d95', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase' }}>
              Learning Management System
            </h3>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {streakStats && (
              <StreakFlameWidget
                streak={streakStats.currentStreak}
                longestStreak={streakStats.longestStreak}
                isTodayActive={streakStats.isTodayActive}
                totalXP={streakStats.totalXP}
                level={streakStats.level}
              />
            )}
            <button className="btn btn-ghost" style={{ padding:8 }}><FiBell size={19} /></button>
            <div className="avatar" style={{ width:36, height:36, fontSize:13, cursor:'pointer' }}>{initials}</div>
          </div>
        </header>
        <main className="dash-content">{children}</main>
      </div>

      <style>{`
        .logo-full { display:block; }
        .logo-icon { display:none; }
        .topbar-mobile-logo { display:none; }
        .topbar-title { display:block; }
        .close-sb-btn { display:none !important; }
        @media (max-width:768px) {
          .logo-full { display:none; }
          .logo-icon { display:block; }
          .topbar-mobile-logo { display:block; }
          .topbar-title { display:none; }
          .close-sb-btn { display:flex !important; }
        }
        @media (min-width:769px) {
          .open-sb-btn { display:none !important; }
        }
      `}</style>
    </div>
  );
}
