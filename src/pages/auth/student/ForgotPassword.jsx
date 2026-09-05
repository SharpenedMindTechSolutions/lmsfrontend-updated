import logoFull from '../../../assets/logo-full.png';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../../services/student/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async e => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/forgot-password/student', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob" style={{ width:360,height:360,top:-100,left:-100,background:'radial-gradient(circle,rgba(167,139,250,.18),transparent 70%)',animation:'floatUp 6s ease infinite' }} />
      <div className="auth-blob" style={{ width:280,height:280,bottom:-60,right:-60,background:'radial-gradient(circle,rgba(109,40,217,.12),transparent 70%)',animation:'floatUp 7s ease infinite 1s' }} />

      <div className="auth-card anim-fade-up">
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ marginBottom:16 }}><img src={logoFull} alt="SharpenedMind" style={{ height:56, objectFit:'contain' }} /></div>
          <h2 style={{ fontSize:28, color:'#4c1d95', marginBottom:6 }}>Forgot Password?</h2>
          <p style={{ color:'#6b7280', fontSize:14 }}>Enter your email and we'll send a reset link</p>
        </div>

        <div className="card" style={{ padding:'32px 30px' }}>
          {sent ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#4c1d95)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:28 }}>✉️</div>
              <h3 style={{ color:'#4c1d95', marginBottom:12 }}>Check Your Email</h3>
              <p style={{ color:'#6b7280', fontSize:14, lineHeight:1.7 }}>
                If an account with <strong>{email}</strong> exists, a password reset link has been sent.<br/>
                The link expires in <strong>15 minutes</strong>.
              </p>
              <p style={{ color:'#9ca3af', fontSize:13, marginTop:16 }}>Didn't get it? Check spam or try again.</p>
              <button onClick={() => setSent(false)} className="btn btn-primary btn-full" style={{ marginTop:20 }}>
                Try Another Email
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="form-group">
                <label>Email Address</label>
                <div className="input-icon-wrap">
                  <FiMail className="icon" size={16} />
                  <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop:8 }} disabled={loading}>
                {loading ? <><span className="spinner spinner-xs" /> Sending...</> : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p style={{ textAlign:'center', marginTop:20, color:'#6b7280', fontSize:14 }}>
            <Link to="/login" style={{ color:'#7c3aed', fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:4 }}>
              <FiArrowLeft size={14} /> Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
