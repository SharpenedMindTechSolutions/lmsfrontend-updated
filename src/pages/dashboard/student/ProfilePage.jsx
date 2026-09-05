import { useState } from 'react';
import { useAuth } from '../../../context/student/AuthContext';
import { studentAPI } from '../../../services/student/api';
import { FiUser, FiMail, FiPhone, FiEdit, FiSave, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { student } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:  student?.name  || '',
    email: student?.email || '',
    phone: student?.phone || '',
  });
  const [saving, setSaving] = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await studentAPI.update(student._id, form);
      const updated = { ...student, ...form };
      localStorage.setItem('s_user', JSON.stringify(updated));
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const initials = student?.name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || 'S';

  return (
    <div>
      <div className="anim-fade-up section-gap">
        <h2 style={{ fontSize:24, color:'#4c1d95', marginBottom:5 }}>My Profile</h2>
        <p style={{ color:'#6b7280', fontSize:14 }}>Manage your personal information</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'clamp(200px, 28%, 280px) 1fr', gap:20, alignItems:'start' }}>
        {/* Avatar card */}
        <div className="card anim-fade-up" style={{ padding:'28px 20px', textAlign:'center' }}>
          <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#8b5cf6,#4c1d95)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', fontSize:28, fontWeight:700, color:'#fff', boxShadow:'0 8px 24px rgba(109,40,217,.3)' }}>
            {initials}
          </div>
          <h3 style={{ fontSize:17, color:'#4c1d95', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{student?.name}</h3>
          <p style={{ fontSize:12, color:'#9ca3af', marginBottom:12, overflow:'hidden', textOverflow:'ellipsis' }}>{student?.email}</p>
          <span className="badge badge-lav">Student</span>
          <div style={{ marginTop:16, padding:'12px', background:'#f5f3ff', borderRadius:10 }}>
            <p style={{ fontSize:10, color:'#9ca3af', fontWeight:600, marginBottom:3, textTransform:'uppercase', letterSpacing:'.06em' }}>Member Since</p>
            <p style={{ fontSize:12, color:'#6b7280' }}>
              {student?.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className="card anim-fade-up" style={{ padding:'24px 26px', animationDelay:'.07s' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:16, borderBottom:'1px solid #f3f4f6', flexWrap:'wrap', gap:10 }}>
            <h3 style={{ fontSize:17, color:'#4c1d95' }}>Personal Information</h3>
            {!editing
              ? <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><FiEdit size={13} /> Edit</button>
              : <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><FiX size={13} /> Cancel</button>}
          </div>

          {[
            { key:'name',  label:'Full Name',     icon:FiUser,  type:'text',  ph:'Your name' },
            { key:'email', label:'Email Address', icon:FiMail,  type:'email', ph:'your@email.com' },
            { key:'phone', label:'Phone Number',  icon:FiPhone, type:'tel',   ph:'+91 9000000000' },
          ].map(({ key, label, icon:Icon, type, ph }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <div className="input-icon-wrap">
                <Icon className="icon" size={15} />
                <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} disabled={!editing} />
              </div>
            </div>
          ))}

          {editing && (
            <div className="flex-col-mobile" style={{ marginTop:8 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><span className="spinner spinner-xs" /> Saving…</> : <><FiSave size={14} /> Save Changes</>}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media(max-width:640px) {
          div[style*="clamp(200px, 28%, 280px) 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
