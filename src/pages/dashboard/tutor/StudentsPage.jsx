import { useState, useEffect } from 'react';
import { studentAPI, enrollmentAPI } from '../../../services/tutor/api';
import { FiSearch, FiEdit, FiTrash2, FiUsers, FiX, FiSave, FiMail, FiUser, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';

/* ── Edit Modal ── */
function EditModal({ student, onClose, onSaved }) {
  const [form, setForm] = useState({ name: student.name || '', email: student.email || '', phone: student.phone || '' });
  const [saving, setSaving] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await studentAPI.update(student._id, form);
      toast.success('Student updated!');
      onSaved(); onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="card modal-box" style={{ maxWidth: 480, padding: '32px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, color: '#4c1d95' }}>Edit Student</h3>
          <button className="btn btn-ghost" style={{ padding: 7 }} onClick={onClose}><FiX size={18} /></button>
        </div>

        {[
          { key: 'name',  label: 'Full Name',  icon: FiUser,  type: 'text',  ph: 'Student name' },
          { key: 'email', label: 'Email',       icon: FiMail,  type: 'email', ph: 'student@email.com' },
          { key: 'phone', label: 'Phone',       icon: FiPhone, type: 'tel',   ph: '+91 9000000000' },
        ].map(({ key, label, icon: Icon, type, ph }) => (
          <div className="form-group" key={key}>
            <label>{label}</label>
            <div className="input-icon-wrap">
              <Icon className="icon" size={15} />
              <input type={type} placeholder={ph} value={form[key]} onChange={set(key)} />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <><span className="spinner spinner-xs" /> Saving…</> : <><FiSave size={14} /> Save Changes</>}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [q,        setQ]        = useState('');
  const [editing,  setEditing]  = useState(null);

  const load = async () => {
    try {
      const res = await studentAPI.getAll();
      const list = res.data?.students || res.data || [];
      setStudents(list);
    } catch {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) return;
    try {
      await studentAPI.delete(id);
      toast.success('Student deleted successfully');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(q.toLowerCase()) ||
    s.email?.toLowerCase().includes(q.toLowerCase()) ||
    s.phone?.includes(q)
  );

  return (
    <div>
      {editing && <EditModal student={editing} onClose={() => setEditing(null)} onSaved={load} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div className="anim-fade-up">
          <h2 style={{ fontSize: 26, color: '#4c1d95', marginBottom: 4 }}>Students</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="anim-fade-up" style={{ position: 'relative', maxWidth: 420, marginBottom: 22, animationDelay: '.06s' }}>
        <FiSearch style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', pointerEvents: 'none' }} size={16} />
        <input style={{ paddingLeft: 42 }} placeholder="Search by name, email or phone…" value={q} onChange={e => setQ(e.target.value)} />
        {q && (
          <span onClick={() => setQ('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af' }}>
            <FiX size={15} />
          </span>
        )}
      </div>

      <div className="card anim-fade-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '.1s' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-md" /></div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <FiUsers size={44} style={{ marginBottom: 14, opacity: .3 }} />
            <p style={{ fontSize: 16, marginBottom: 6 }}>{q ? 'No students match your search.' : 'No students registered yet.'}</p>
            {q && <p style={{ fontSize: 13 }}>Try a different name or email.</p>}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hide-mob" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s._id}>
                      <td style={{ color: '#9ca3af', fontSize: 13 }}>{i + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0 }}>
                            {s.name?.[0]?.toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: '#1f2937' }}>{s.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#6b7280' }}>{s.email}</td>
                      <td style={{ color: '#6b7280' }}>{s.phone || '—'}</td>
                      <td style={{ color: '#9ca3af', fontSize: 13 }}>
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 7 }}>
                          <button className="btn btn-outline btn-xs" onClick={() => setEditing(s)}>
                            <FiEdit size={12} /> Edit
                          </button>
                          <button className="btn btn-danger btn-xs" onClick={() => del(s._id, s.name)}>
                            <FiTrash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div style={{ padding: '12px' }} className="show-mob">
              {filtered.map(s => (
                <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 12px', border: '1px solid #ede9fe', borderRadius: 12, marginBottom: 10 }}>
                  <div className="avatar" style={{ width: 44, height: 44, fontSize: 16, flexShrink: 0 }}>
                    {s.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#1f2937', fontSize: 14, marginBottom: 2 }}>{s.name}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</p>
                    {s.phone && <p style={{ fontSize: 12, color: '#9ca3af' }}>{s.phone}</p>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-outline btn-xs" style={{ padding: '6px 9px' }} onClick={() => setEditing(s)}><FiEdit size={13} /></button>
                    <button className="btn btn-danger btn-xs" style={{ padding: '6px 9px' }} onClick={() => del(s._id, s.name)}><FiTrash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (min-width: 769px) { .show-mob { display: none !important; } }
        @media (max-width: 768px) { .hide-mob { display: none !important; } }
      `}</style>
    </div>
  );
}
