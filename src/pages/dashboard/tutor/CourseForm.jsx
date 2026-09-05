import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { courseAPI } from '../../../services/tutor/api';
import { FiArrowLeft, FiBook, FiSave } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CourseForm() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const isEdit = !!courseId;
  const [form, setForm]       = useState({ title:'', description:'', isPaid:false, price:'' });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetch]  = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    courseAPI.getById(courseId)
      .then(r => { const c = r.data.course; setForm({ title:c.title, description:c.description, isPaid:c.isPaid||false, price:c.price||'' }); })
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setFetch(false));
  }, [courseId]);

  const submit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await courseAPI.update(courseId, form);
        toast.success('Course updated!');
        nav(`/tutor/dashboard/courses/${courseId}`);
      } else {
        const r = await courseAPI.create(form);
        toast.success('Course created!');
        nav(`/tutor/dashboard/courses/${r.data.course._id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  if (fetching) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner spinner-md"/></div>;

  return (
    <div>
      <button className="btn btn-ghost anim-fade-up" onClick={() => nav(-1)} style={{ marginBottom:20, padding:'6px 0', gap:6 }}>
        <FiArrowLeft size={16}/> Back
      </button>

      <div className="card anim-fade-up" style={{ maxWidth:640, padding:'32px 36px', animationDelay:'.07s' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:28, paddingBottom:20, borderBottom:'1px solid #f3f4f6' }}>
          <div style={{ width:48, height:48, borderRadius:13, background:'linear-gradient(135deg,#ede9fe,#c4b5fd)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FiBook size={23} color="#7c3aed"/>
          </div>
          <div>
            <h2 style={{ fontSize:22, color:'#4c1d95' }}>{isEdit ? 'Edit Course' : 'Create New Course'}</h2>
            <p style={{ color:'#9ca3af', fontSize:13 }}>{isEdit ? 'Update course information' : 'Fill in the details below'}</p>
          </div>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Course Title *</label>
            <input placeholder="e.g. Introduction to Python Programming" value={form.title} onChange={e => setForm(p => ({ ...p, title:e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Course Description *</label>
            <textarea rows={6} placeholder="Describe what students will learn, prerequisites, outcomes…" value={form.description} onChange={e => setForm(p => ({ ...p, description:e.target.value }))} />
          </div>
          <div className="form-group" style={{ display:'flex', alignItems:'center', gap:10, marginTop:10 }}>
            <input type="checkbox" checked={form.isPaid} onChange={e => setForm(p => ({ ...p, isPaid:e.target.checked }))} id="isPaid" style={{ width:18, height:18, accentColor: '#7c3aed', cursor: 'pointer', WebkitAppearance: 'auto', appearance: 'auto' }} />
            <label htmlFor="isPaid" style={{ margin:0, cursor:'pointer' }}>This is a paid course</label>
          </div>
          {form.isPaid && (
            <div className="form-group" style={{ marginTop:10 }}>
              <label>Price (₹) *</label>
              <input type="number" min="0" placeholder="e.g. 999" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value === '' ? '' : Number(e.target.value) }))} />
            </div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner spinner-xs"/> Saving…</> : <><FiSave size={14}/> {isEdit?'Update Course':'Create Course'}</>}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => nav(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
