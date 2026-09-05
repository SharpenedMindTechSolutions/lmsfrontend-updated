import logoFull from '../../../assets/logo-full.png';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/tutor/AuthContext';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiEdit3 } from 'react-icons/fi';

export default function TutorRegister() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errs, setErrs] = useState({});

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())                           e.name     = 'Name required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.password || form.password.length < 6)  e.password = 'Min 6 characters';
    setErrs(e);
    return !Object.keys(e).length;
  };

  const submit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please sign in.');
      nav('/tutor/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob" style={{ width:400, height:400, top:-130, right:-100, background:'radial-gradient(circle,rgba(255,255,255,.1),transparent 70%)', animation:'floatUp 7s ease infinite' }} />
      <div className="auth-blob" style={{ width:280, height:280, bottom:-80, left:-60, background:'radial-gradient(circle,rgba(196,181,253,.15),transparent 70%)', animation:'floatUp 9s ease infinite 2s' }} />

      <div className="auth-card anim-fade-up">
        <div style={{ textAlign:'center', marginBottom:28 }}>
                    <div style={{ marginBottom:16 }}><img src={logoFull} alt="SharpenedMind" style={{ height:56, objectFit:"contain" }} /></div>
          
          <h2 style={{ fontSize:30, color:'#7c3aed', marginBottom:6 }}>Tutor Sign Up</h2>
          <p style={{ color:'#7c3aed', fontSize:14 }}>Create your instructor account</p>
        </div>

        <div className="card" style={{ padding:'32px 30px' }}>
          <form onSubmit={submit} noValidate>
            {[
              { key:'name',  label:'Full Name',  icon:FiUser, type:'text',  ph:'Your full name' },
              { key:'email', label:'Email',       icon:FiMail, type:'email', ph:'you@email.com' },
            ].map(({ key, label, icon:Icon, type, ph }) => (
              <div className="form-group" key={key}>
                <label>{label}</label>
                <div className="input-icon-wrap">
                  <Icon className="icon" size={15} />
                  <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} style={errs[key]?{borderColor:'var(--err)'}:{}} />
                </div>
                {errs[key] && <p className="field-error">{errs[key]}</p>}
              </div>
            ))}

            <div className="form-group">
              <label>Password</label>
              <div className="input-icon-wrap" style={{ position:'relative' }}>
                <FiLock className="icon" size={15} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  style={{ paddingLeft:40, paddingRight:40, ...(errs.password?{borderColor:'var(--err)'}:{}) }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#9ca3af', background:'none', border:'none', padding:0, display:'flex', alignItems:'center' }}>
                  {showPw ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errs.password && <p className="field-error">{errs.password}</p>}
            </div>

            <button type="submit" className="btn btn-primary btn-lg btn-full" style={{ marginTop:8 }} disabled={loading}>
              {loading ? <><span className="spinner spinner-xs" /> Creating…</> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign:'center', marginTop:18, color:'#6b7280', fontSize:14 }}>
            Already have an account?{' '}
            <Link to="/tutor/login" style={{ color:'#7c3aed', fontWeight:700, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
