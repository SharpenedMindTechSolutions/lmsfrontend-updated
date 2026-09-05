import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/tutor/AuthContext';
import { FiHome, FiBook, FiList, FiUsers, FiBarChart2, FiUser, FiLogOut, FiMenu, FiX, FiBell, FiChevronRight, FiClipboard, FiTrendingUp } from 'react-icons/fi';
import logoFull from '../../assets/logo-full.png';
import logoIcon from '../../assets/logo-icon.png';
import { notificationAPI } from '../../services/tutor/api';

const NAV = [
  { to:'/tutor/dashboard',              icon:FiHome,      label:'Dashboard',   end:true },
  { to:'/tutor/dashboard/courses',      icon:FiBook,      label:'Courses' },
  { to:'/tutor/dashboard/sessions',     icon:FiList,      label:'Sessions' },
  { to:'/tutor/dashboard/students',     icon:FiUsers,     label:'Students' },
  { to:'/tutor/dashboard/student-progress', icon:FiTrendingUp, label:'Progress' },
  { to:'/tutor/dashboard/enrollments',  icon:FiBarChart2, label:'Enrollments' },
  { to:'/tutor/dashboard/assignments',  icon:FiClipboard, label:'Assignments' },
  { to:'/tutor/dashboard/profile',      icon:FiUser,      label:'Profile' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function DashboardLayout({ children }) {
  const { tutor, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  // Notification state
  const [notifications, setNotifications]   = useState([]);
  const [notifOpen,     setNotifOpen]        = useState(false);
  const [readIds,       setReadIds]          = useState(() => {
    try { return JSON.parse(localStorage.getItem('t_notif_read') || '[]'); } catch { return []; }
  });
  const notifRef = useRef(null);

  // Fetch notifications on mount and every 60s
  useEffect(() => {
    let active = true;
    const fetch = async () => {
      try {
        const { data } = await notificationAPI.getAll();
        if (active) setNotifications(data.notifications || []);
      } catch {}
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => { active = false; clearInterval(id); };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = e => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unreadCount = notifications.filter(n => !readIds.includes(String(n._id))).length;

  const openNotif = () => {
    setNotifOpen(v => !v);
    // Mark all as read
    const ids = notifications.map(n => String(n._id));
    const merged = [...new Set([...readIds, ...ids])];
    setReadIds(merged);
    localStorage.setItem('t_notif_read', JSON.stringify(merged));
  };

  const doLogout = () => { logout(); nav('/tutor/login'); };
  const initials = tutor?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'T';

  return (
    <div className="dash-shell">
      {open && <div onClick={() => setOpen(false)} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:45, backdropFilter:'blur(2px)' }} />}

      <aside className={`dash-sidebar${open?' open':''}`}>
        <div style={{ padding:'18px 16px 14px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <img src={logoFull} alt="SharpenedMind" className="logo-full" style={{ height:42, objectFit:'contain', maxWidth:175 }} />
            <img src={logoIcon} alt="SM" className="logo-icon" style={{ height:36, objectFit:'contain' }} />
            <button className="btn btn-ghost close-sb-btn" onClick={() => setOpen(false)} style={{ color:'rgba(255,255,255,.6)', padding:6 }}>
              <FiX size={18} />
            </button>
          </div>
          <p style={{ color:'rgba(255,255,255,.45)', fontSize:10, marginTop:6, fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase' }}>Tutor Portal</p>
        </div>

        <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.1)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div className="avatar" style={{ width:38, height:38, fontSize:14 }}>{initials}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ color:'#fff', fontWeight:600, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tutor?.name}</p>
              <p style={{ color:'rgba(255,255,255,.45)', fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{tutor?.email}</p>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'12px 10px', overflowY:'auto' }}>
          <p style={{ color:'rgba(255,255,255,.35)', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', padding:'0 10px', marginBottom:8 }}>Navigation</p>
          {NAV.map(({ to, icon:Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)}
              className={({ isActive }) => `nav-item${isActive?' active':''}`}>
              <Icon size={17} /><span>{label}</span>
              <FiChevronRight size={13} style={{ marginLeft:'auto', opacity:.38 }} />
            </NavLink>
          ))}
        </nav>

        <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,.1)' }}>
          <button onClick={doLogout} className="nav-item" style={{ color:'rgba(255,255,255,.72)' }}>
            <FiLogOut size={17} /><span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button className="btn btn-ghost open-sb-btn" style={{ padding:8 }} onClick={() => setOpen(true)}><FiMenu size={21} /></button>
            <img src={logoIcon} alt="SM" className="topbar-mobile-logo" style={{ height:30, objectFit:'contain' }} />
            <h3 className="topbar-title" style={{ fontSize:13, color:'#4c1d95', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase' }}>
              Learning Management System
            </h3>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Notification Bell */}
            <div ref={notifRef} style={{ position:'relative' }}>
              <button className="btn btn-ghost" style={{ padding:8, position:'relative' }} onClick={openNotif}>
                <FiBell size={19} />
                {unreadCount > 0 && (
                  <span style={{
                    position:'absolute', top:4, right:4,
                    background:'#ef4444', color:'#fff',
                    borderRadius:'50%', width:16, height:16,
                    fontSize:9, fontWeight:700,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    lineHeight:1
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div style={{
                  position:'absolute', top:'calc(100% + 8px)', right:0,
                  width:320, background:'#fff', borderRadius:14,
                  boxShadow:'0 8px 32px rgba(76,29,149,.18)',
                  border:'1px solid #ede9fe', zIndex:200,
                  overflow:'hidden'
                }}>
                  <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <p style={{ fontWeight:700, fontSize:14, color:'#4c1d95' }}>Notifications</p>
                    {notifications.length > 0 && (
                      <span style={{ fontSize:11, color:'#8b5cf6' }}>{notifications.length} total</span>
                    )}
                  </div>
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding:'24px 16px', textAlign:'center', color:'#9ca3af', fontSize:13 }}>
                        No notifications yet
                      </div>
                    ) : notifications.map(n => (
                      <div key={n._id} style={{
                        padding:'12px 16px',
                        borderBottom:'1px solid #f9f9f9',
                        background:'#faf5ff'
                      }}>
                        <p style={{ fontSize:13, color:'#374151', marginBottom:3, lineHeight:1.4 }}>{n.message}</p>
                        <p style={{ fontSize:11, color:'#9ca3af' }}>{timeAgo(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
        @media(max-width:768px) {
          .logo-full { display:none; }
          .logo-icon { display:block; }
          .topbar-mobile-logo { display:block; }
          .topbar-title { display:none; }
          .close-sb-btn { display:flex !important; }
        }
        @media(min-width:769px) {
          .open-sb-btn { display:none !important; }
        }
      `}</style>
    </div>
  );
}
