import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/tutor/AuthContext';
import { tutorAPI } from '../../../services/tutor/api';
import { FiUser, FiMail, FiEdit, FiSave, FiX, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function TutorProfile() {
  const { tutor } = useAuth();
  const [editing,    setEditing]    = useState(false);
  const [form,       setForm]       = useState({ name: tutor?.name || '', email: tutor?.email || '' });
  const [saving,     setSaving]     = useState(false);
  const [freshTutor, setFreshTutor] = useState(tutor);

  // Fetch fresh tutor data so createdAt is always accurate
  useEffect(() => {
    if (!tutor?._id) return;
    tutorAPI.getById(tutor._id)
      .then(({ data }) => {
        const t = data.tutor || data;
        setFreshTutor(t);
        setForm({ name: t.name || '', email: t.email || '' });
      })
      .catch(() => {});
  }, [tutor?._id]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    if (!form.name.trim() || !form.email.trim()) { toast.error('Name and email required'); return; }
    setSaving(true);
    try {
      await tutorAPI.update(tutor._id, form);
      const updated = { ...tutor, ...form };
      localStorage.setItem('t_user', JSON.stringify(updated));
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const initials = freshTutor?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'T';

  return (
    <div>
      <div className="anim-fade-up" style={{ marginBottom: 26 }}>
        <h2 style={{ fontSize: 26, color: '#4c1d95', marginBottom: 4 }}>My Profile</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Manage your tutor account information</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'clamp(200px, 28%, 280px) 1fr', gap: 22, alignItems: 'start' }}>
        {/* Avatar card */}
        <div className="card anim-fade-up" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#4c1d95)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 34, fontWeight: 700, color: '#fff', boxShadow: '0 10px 28px rgba(109,40,217,.32)' }}>
            {initials}
          </div>
          <h3 style={{ fontSize: 19, color: '#4c1d95', marginBottom: 5 }}>{freshTutor?.name}</h3>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 16 }}>{freshTutor?.email}</p>
          <span className="badge badge-lav" style={{ justifyContent: 'center' }}>
            <FiShield size={12} /> Tutor
          </span>

          <div style={{ marginTop: 22, padding: '14px', background: '#f5f3ff', borderRadius: 12 }}>
            <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 5 }}>Member Since</p>
            <p style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              {freshTutor?.createdAt
                ? new Date(freshTutor.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <div className="card anim-fade-up" style={{ padding: '28px 32px', animationDelay: '.07s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 18, borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: 19, color: '#4c1d95' }}>Personal Information</h3>
            {!editing
              ? <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}><FiEdit size={14} /> Edit</button>
              : <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><FiX size={14} /> Cancel</button>}
          </div>

          {[
            { key: 'name',  label: 'Full Name',     icon: FiUser, type: 'text',  ph: 'Your full name' },
            { key: 'email', label: 'Email Address',  icon: FiMail, type: 'email', ph: 'you@email.com' },
          ].map(({ key, label, icon: Icon, type, ph }) => (
            <div className="form-group" key={key}>
              <label>{label}</label>
              <div className="input-icon-wrap">
                <Icon className="icon" size={15} />
                <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} disabled={!editing} />
              </div>
            </div>
          ))}

          {editing && (
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <><span className="spinner spinner-xs" /> Saving…</> : <><FiSave size={14} /> Save Changes</>}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:700px){div[style*="gridTemplateColumns: 'clamp(200px, 28%, 280px) 1fr'"]{grid-template-columns:1fr!important;}}`}</style>
    </div>
  );
}
