import logoFull from '../../../assets/logo-full.png';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/student/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiBookOpen } from 'react-icons/fi';

const fields = [
  { key: 'name',     label: 'Full Name',   icon: FiUser,   type: 'text',     ph: 'Your full name' },
  { key: 'email',    label: 'Email',       icon: FiMail,   type: 'email',    ph: 'you@email.com' },
  { key: 'phone',    label: 'Phone',       icon: FiPhone,  type: 'tel',      ph: '+91 9000000000' },
];

function validate(f) {
  const e = {};
  if (!f.name.trim())                           e.name     = 'Name is required';
  if (!f.email || !/\S+@\S+\.\S+/.test(f.email)) e.email  = 'Valid email required';
  if (!f.phone.trim())                          e.phone    = 'Phone is required';
  if (!f.password || f.password.length < 6)    e.password = 'Min 6 characters';
  return e;
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const [errs, setErrs] = useState({});
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    const v = validate(form);
    setErrs(v);
    if (Object.keys(v).length) return;
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please sign in.');
      nav('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Animated blobs */}
      <div className="auth-blob" style={{ width:380, height:380, top:-120, right:-80, background:'radial-gradient(circle,rgba(167,139,250,.18),transparent 70%)', animation:'floatUp 6s ease infinite' }} />
      <div className="auth-blob" style={{ width:300, height:300, bottom:-80, left:-60, background:'radial-gradient(circle,rgba(139,92,246,.13),transparent 70%)', animation:'floatUp 8s ease infinite reverse' }} />
      <div className="auth-blob" style={{ width:200, height:200, top:'40%', left:'5%', background:'radial-gradient(circle,rgba(196,181,253,.14),transparent 70%)', animation:'floatUp 7s ease infinite 2s' }} />

      <div className="auth-card anim-fade-up">
        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ marginBottom:16 }}><img src={logoFull} alt="SharpenedMind" style={{ height:56, objectFit:"contain" }} /></div>
          <h2 style={{ fontSize:30, color:'#4c1d95', marginBottom:6 }}>Join Learning Management System</h2>
          <p style={{ color:'#6b7280', fontSize:14 }}>Create your student account to start learning</p>
        </div>

        <div className="card" style={{ padding:'32px 30px' }}>
          <form onSubmit={submit} noValidate>
            {fields.map(({ key, label, icon: Icon, type, ph }) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <div className="input-icon-wrap">
                  <Icon className="icon" size={16} />
                  <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} style={errs[key]?{borderColor:'var(--err)'}:{}} />
                </div>
                {errs[key] && <p className="field-error">{errs[key]}</p>}
              </div>
            ))}

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap">
                <FiLock className="icon" size={16} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  className="has-right"
                  value={form.password}
                  onChange={set('password')}
                  style={errs.password ? { borderColor:'var(--err)' } : {}}
                />
                <button
                  type="button"
                  className="icon icon-right pw-toggle"
                  onClick={() => setShowPw(p => !p)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errs.password && <p className="field-error">{errs.password}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop:8 }} disabled={loading}>
              {loading ? <><span className="spinner spinner-xs" /> Creating account...</> : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:20, color:'#6b7280', fontSize:14 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#7c3aed', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
