import { Link } from 'react-router-dom';
import { FiBookOpen, FiEdit3 } from 'react-icons/fi';
import logoFull from '../assets/logo-full.png';

export default function RoleSelector() {
  return (
    <div className="auth-page" style={{ background: 'linear-gradient(145deg,#2e1065 0%,#4c1d95 40%,#7c3aed 80%,#a78bfa 100%)' }}>
      <div className="auth-blob" style={{ width: 400, height: 400, top: -120, right: -80, background: 'radial-gradient(circle,rgba(255,255,255,.09),transparent 70%)', animation: 'floatUp 6s ease infinite' }} />
      <div className="auth-blob" style={{ width: 300, height: 300, bottom: -80, left: -60, background: 'radial-gradient(circle,rgba(196,181,253,.15),transparent 70%)', animation: 'floatUp 9s ease infinite 2s' }} />

      <div className="auth-card anim-fade-up" style={{ maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display:'flex', justifyContent:'center', marginBottom:18 }}>
            <img src={logoFull} alt="SharpenedMind" style={{ height:52, objectFit:'contain', maxWidth:'100%' }} />
          </div>
          <h1 style={{ fontSize: 18, color: '#fff', marginBottom: 6, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight:800, letterSpacing:'.04em', textTransform:'uppercase' }}>
            Learning Management System
          </h1>
          <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 14 }}>Choose how you'd like to continue</p>
        </div>

        <div className="role-grid">
          {/* Student card */}
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '28px 20px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ width: 56, height: 56, borderRadius: 15, background: 'linear-gradient(135deg,#8b5cf6,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(109,40,217,.3)' }}>
                <FiBookOpen size={26} color="white" />
              </div>
              <h3 style={{ fontSize: 17, color: '#4c1d95', marginBottom: 6 }}>Student</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>Learn courses and track your progress</p>
              <div style={{ marginTop: 16 }}>
                <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>Enter Portal</span>
              </div>
            </div>
          </Link>

          {/* Tutor card */}
          <Link to="/tutor/login" style={{ textDecoration: 'none' }}>
            <div className="card card-hover" style={{ padding: '28px 20px', textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ width: 56, height: 56, borderRadius: 15, background: 'linear-gradient(135deg,#ec4899,#be185d)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 6px 20px rgba(190,24,93,.3)' }}>
                <FiEdit3 size={26} color="white" />
              </div>
              <h3 style={{ fontSize: 17, color: '#4c1d95', marginBottom: 6 }}>Tutor</h3>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>Create courses and manage students</p>
              <div style={{ marginTop: 16 }}>
                <span className="btn btn-primary btn-sm" style={{ pointerEvents: 'none', background: 'linear-gradient(135deg,#ec4899,#be185d)', boxShadow: '0 4px 18px rgba(190,24,93,.28)' }}>Enter Portal</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
