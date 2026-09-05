import logoFull from '../../../assets/logo-full.png';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/student/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ email:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back! 🎓');
      nav('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob" style={{ width:360,height:360,top:-100,left:-100,background:'radial-gradient(circle,rgba(167,139,250,.18),transparent 70%)',animation:'floatUp 6s ease infinite' }} />
      <div className="auth-blob" style={{ width:280,height:280,bottom:-60,right:-60,background:'radial-gradient(circle,rgba(109,40,217,.12),transparent 70%)',animation:'floatUp 7s ease infinite 1s' }} />

      <div className="auth-card anim-fade-up">
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ marginBottom:16 }}><img src={logoFull} alt="SharpenedMind" style={{ height:56, objectFit:'contain' }} /></div>
          <h2 style={{ fontSize:30, color:'#4c1d95', marginBottom:6 }}>Welcome Back</h2>
          <p style={{ color:'#6b7280', fontSize:14 }}>Sign in to continue your learning journey</p>
        </div>

        <div className="card" style={{ padding:'32px 30px' }}>
          <form onSubmit={submit} noValidate>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-icon-wrap">
                <FiMail className="icon" size={16} />
                <input type="email" placeholder="you@email.com" value={form.email} onChange={set('email')} />
              </div>
            </div>
            <div className="form-group">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <label style={{ margin:0 }}>Password</label>
                <Link to="/forgot-password" style={{ fontSize:13, color:'#7c3aed', fontWeight:600, textDecoration:'none' }}>
                  Forgot Password?
                </Link>
              </div>
              <div className="input-icon-wrap">
                <FiLock className="icon" size={16} />
                <input
                  type={showPw ? 'text' : 'password'}
                  className="has-right"
                  placeholder="Your password"
                  value={form.password}
                  onChange={set('password')}
                />
                <button type="button" className="icon icon-right pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}>
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop:8 }} disabled={loading}>
              {loading ? <><span className="spinner spinner-xs" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:20, color:'#6b7280', fontSize:14 }}>
            New student?{' '}
            <Link to="/register" style={{ color:'#7c3aed', fontWeight:700, textDecoration:'none' }}>Create account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
