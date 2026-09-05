import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/admin/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield, FiArrowRight } from 'react-icons/fi';
import logoFull from '../../../assets/logo-full.png';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      toast.success('Admin login successful! Welcome 🛡️');
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@lms.com');
    setPassword('admin123');
    toast.success('Default Admin credentials filled!');
  };

  return (
    <div className="auth-page">
      <div className="auth-blob" style={{ width: 360, height: 360, top: -100, left: -100, background: 'radial-gradient(circle,rgba(167,139,250,.18),transparent 70%)', animation: 'floatUp 6s ease infinite' }} />
      <div className="auth-blob" style={{ width: 280, height: 280, bottom: -60, right: -60, background: 'radial-gradient(circle,rgba(109,40,217,.12),transparent 70%)', animation: 'floatUp 7s ease infinite 1s' }} />

      <div className="auth-card anim-fade-up" style={{ maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <img src={logoFull} alt="SharpenedMind" style={{ height: 52, objectFit: 'contain' }} />
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ede9fe', color: '#6d28d9', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
            <FiShield size={14} /> Super Admin Portal
          </div>
          <h2 style={{ fontSize: 26, color: '#4c1d95', marginBottom: 4 }}>Admin Sign In</h2>
          <p style={{ color: '#6b7280', fontSize: 13.5 }}>Manage courses, tutors, students, and payment approvals</p>
        </div>

        <div className="card" style={{ padding: '30px 26px', boxShadow: '0 8px 30px rgba(109,40,217,0.08)' }}>
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label>Admin Email</label>
              <div className="input-icon-wrap">
                <FiMail className="icon" size={16} />
                <input
                  type="email"
                  placeholder="admin@lms.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap">
                <FiLock className="icon" size={16} />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="has-right"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="icon icon-right pw-toggle"
                  onClick={() => setShowPw(p => !p)}
                  tabIndex={-1}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-full"
              style={{ marginTop: 10 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <><span className="spinner spinner-xs" /> Authenticating...</>
              ) : (
                <>Sign In as Admin <FiArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Quick Credential Hint / Auto-Fill */}
          <div style={{
            marginTop: 22,
            padding: '12px 14px',
            borderRadius: 12,
            background: '#faf5ff',
            border: '1px dashed #c4b5fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8
          }}>
            <div style={{ fontSize: 12, color: '#6d28d9' }}>
              <div><strong>Default Super Admin:</strong></div>
              <span style={{ fontFamily: 'monospace', color: '#4c1d95' }}>admin@lms.com</span> | <span style={{ fontFamily: 'monospace', color: '#4c1d95' }}>admin123</span>
            </div>
            <button
              type="button"
              onClick={handleQuickFill}
              className="btn btn-outline btn-xs"
              style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8 }}
            >
              Auto-Fill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
