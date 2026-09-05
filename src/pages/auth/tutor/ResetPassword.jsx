import logoFull from '../../../assets/logo-full.png';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/tutor/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [form, setForm] = useState({ newPassword:'', confirm:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const passwordStrength = pw => {
    if (!pw) return { label:'', color:'#e5e7eb', width:'0%' };
    if (pw.length < 6) return { label:'Weak', color:'#ef4444', width:'33%' };
    if (pw.length < 10 || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw)) return { label:'Fair', color:'#f59e0b', width:'66%' };
    return { label:'Strong', color:'#10b981', width:'100%' };
  };
  const strength = passwordStrength(form.newPassword);

  const submit = async e => {
    e.preventDefault();
    if (!form.newPassword || !form.confirm) { toast.error('Fill all fields'); return; }
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return; }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (!token || !email) { toast.error('Invalid reset link'); return; }

    setLoading(true);
    try {
      await api.post('/reset-password/tutor', { token, email, newPassword: form.newPassword });
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="auth-page">
        <div className="auth-card anim-fade-up">
          <div className="card" style={{ padding:32, textAlign:'center' }}>
            <p style={{ fontSize:32 }}>⚠️</p>
            <h3 style={{ color:'#991b1b' }}>Invalid Reset Link</h3>
            <p style={{ color:'#6b7280', marginBottom:20 }}>This link is invalid or has expired.</p>
            <Link to="/tutor/forgot-password" className="btn btn-primary">Request New Link</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-blob" style={{ width:360,height:360,top:-100,left:-100,background:'radial-gradient(circle,rgba(167,139,250,.18),transparent 70%)',animation:'floatUp 6s ease infinite' }} />

      <div className="auth-card anim-fade-up">
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ marginBottom:16 }}><img src={logoFull} alt="SharpenedMind" style={{ height:56, objectFit:'contain' }} /></div>
          <h2 style={{ fontSize:28, color:'#4c1d95', marginBottom:6 }}>Set New Password</h2>
          <p style={{ color:'#6b7280', fontSize:14 }}>Tutor account password reset</p>
        </div>

        <div className="card" style={{ padding:'32px 30px' }}>
          {done ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28 }}>✅</div>
              <h3 style={{ color:'#065f46', marginBottom:12 }}>Password Updated!</h3>
              <p style={{ color:'#6b7280', fontSize:14 }}>Your password has been reset successfully.</p>
              <button onClick={() => nav('/tutor/login')} className="btn btn-primary btn-full" style={{ marginTop:20 }}>
                Go to Login
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="form-group">
                <label>New Password</label>
                <div className="input-icon-wrap">
                  <FiLock className="icon" size={16} />
                  <input type={showPw ? 'text' : 'password'} className="has-right" placeholder="Min 6 characters" value={form.newPassword} onChange={set('newPassword')} autoFocus />
                  <button type="button" className="icon icon-right pw-toggle" onClick={() => setShowPw(p => !p)} tabIndex={-1}>
                    {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
                {form.newPassword && (
                  <div style={{ marginTop:8 }}>
                    <div style={{ height:4, background:'#e5e7eb', borderRadius:2, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:strength.width, background:strength.color, transition:'all .3s' }} />
                    </div>
                    <p style={{ fontSize:12, color:strength.color, marginTop:4 }}>{strength.label}</p>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-icon-wrap">
                  <FiLock className="icon" size={16} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={form.confirm} onChange={set('confirm')} />
                </div>
                {form.confirm && form.newPassword !== form.confirm && (
                  <p style={{ color:'#ef4444', fontSize:12, marginTop:4 }}>Passwords do not match</p>
                )}
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop:8 }} disabled={loading}>
                {loading ? <><span className="spinner spinner-xs" /> Updating...</> : 'Reset Password'}
              </button>
            </form>
          )}

          <p style={{ textAlign:'center', marginTop:20, color:'#6b7280', fontSize:14 }}>
            <Link to="/tutor/login" style={{ color:'#7c3aed', fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
              <FiArrowLeft size={14} /> Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
