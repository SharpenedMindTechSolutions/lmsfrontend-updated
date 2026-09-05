import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/admin/api';
import toast from 'react-hot-toast';
import { FiPackage, FiSave, FiPlus, FiCopy, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

export default function ComboOffers() {
  const [courses, setCourses] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    tutorId: '',
    enrollmentCode: '',
    bundledCourses: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        adminAPI.getCourses(),
        adminAPI.getTutors()
      ]);
      setCourses(cRes.data);
      setTutors(tRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const combos = courses.filter(c => c.isComboOffer);
  const normalCourses = courses.filter(c => !c.isComboOffer);

  const toggleCourse = (id) => {
    setForm(p => ({
      ...p,
      bundledCourses: p.bundledCourses.includes(id)
        ? p.bundledCourses.filter(cid => cid !== id)
        : [...p.bundledCourses, id]
    }));
  };

  const handleEdit = (combo) => {
    setEditId(combo._id);
    const tutorVal = typeof combo.tutorId === 'object' ? (combo.tutorId?._id || '') : (combo.tutorId || '');
    const bundled = (combo.bundledCourses || []).map(b => (typeof b === 'object' ? b._id : b));
    setForm({
      title: combo.title || '',
      description: combo.description || '',
      price: combo.price ?? '',
      tutorId: tutorVal,
      enrollmentCode: combo.enrollmentCode || '',
      bundledCourses: bundled
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ title: '', description: '', price: '', tutorId: '', enrollmentCode: '', bundledCourses: [] });
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete the combo "${title}"?`)) {
      return;
    }
    try {
      await adminAPI.deleteComboOffer(id);
      toast.success('Combo offer deleted successfully!');
      if (editId === id) {
        handleCancel();
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete combo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.tutorId || form.bundledCourses.length === 0) {
      toast.error('Please fill all required fields and select at least one course.');
      return;
    }
    if (form.title.trim().length < 3) {
      toast.error('Combo title must be at least 3 characters.');
      return;
    }
    if (form.description.trim().length < 10) {
      toast.error('Description must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      if (editId) {
        await adminAPI.updateComboOffer(editId, form);
        toast.success('Combo Offer updated successfully!');
      } else {
        await adminAPI.createComboOffer(form);
        toast.success('Combo Offer created successfully!');
      }
      handleCancel();
      fetchData(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save combo');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spinner spinner-md"/></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2><FiPackage /> Combo Offers Management</h2>
        <button className="btn btn-primary" onClick={() => { if (showForm) { handleCancel(); } else { setShowForm(true); } }}>
          {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Create New Combo</>}
        </button>
      </div>

      {showForm && (
        <div className="card anim-fade-up" style={{ padding: '24px', marginBottom: 30, border: '1px solid #c4b5fd' }}>
          <h3 style={{ marginBottom: 20, color: '#4c1d95' }}>{editId ? 'Edit Combo Bundle' : 'Create Combo Bundle'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Combo Title *</label>
              <input minLength={3} value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} placeholder="e.g. Master Developer Bundle" required />
            </div>
            
            <div className="form-group">
              <label>Description * <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 'normal' }}>(Minimum 10 characters)</span></label>
              <textarea minLength={10} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Bundle details (minimum 10 characters)..." required rows={3} />
            </div>

            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Price (₹) *</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({...p, price: e.target.value}))} placeholder="e.g. 1999" required min="0" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Assign to Tutor *</label>
                <select value={form.tutorId} onChange={e => setForm(p => ({...p, tutorId: e.target.value}))} required>
                  <option value="">-- Select Tutor --</option>
                  {tutors.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.email})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Enrollment Code <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 'normal' }}>(Optional - Leave empty to auto-generate)</span></label>
              <input 
                value={form.enrollmentCode} 
                onChange={e => setForm(p => ({...p, enrollmentCode: e.target.value}))} 
                placeholder="Enter enrollment code (e.g. COMBO2026-001)" 
              />
            </div>

            <div className="form-group">
              <label>Select Courses to Bundle *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10, background: '#f9fafb', padding: 16, borderRadius: 8 }}>
                {normalCourses.map(c => (
                  <label key={c._id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input 
                      type="checkbox" 
                      checked={form.bundledCourses.includes(c._id)}
                      onChange={() => toggleCourse(c._id)}
                      style={{ width: 16, height: 16, accentColor: '#7c3aed', cursor: 'pointer', WebkitAppearance: 'auto', appearance: 'auto' }}
                    />
                    <span style={{ fontSize: 13, color: '#374151' }}>{c.title} (₹{c.price})</span>
                  </label>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              {editId && (
                <button type="button" className="btn" onClick={handleCancel} style={{ background: '#f3f4f6', color: '#4b5563' }}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : <><FiSave /> {editId ? 'Update Combo Offer' : 'Save Combo Offer'}</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: 16 }}>Existing Combos</h3>
        {combos.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No combo offers created yet.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {combos.map(combo => (
              <div key={combo._id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 }}>
                    <h4 style={{ color: '#4c1d95', margin: 0, wordBreak: 'break-word' }}>{combo.title}</h4>
                    <span style={{ background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>₹{combo.price}</span>
                  </div>
                  {combo.enrollmentCode && (
                    <div style={{ background: '#f5f3ff', border: '1px dashed #c4b5fd', padding: '8px 12px', borderRadius: 8, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>Enrollment Code</div>
                        <span style={{ fontSize: 14, color: '#4c1d95', fontWeight: 700, letterSpacing: '1px' }}>{combo.enrollmentCode}</span>
                      </div>
                      <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(combo.enrollmentCode); toast.success('Code copied!'); }} style={{ padding: '4px 8px', fontSize: 11, background: '#fff', border: '1px solid #ddd' }}>
                        <FiCopy /> Copy
                      </button>
                    </div>
                  )}
                  <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 10 }}>{combo.description}</p>
                  <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 16 }}>
                    <strong>Bundled Courses ({combo.bundledCourses?.length || 0}):</strong>
                    <ul style={{ paddingLeft: 16, marginTop: 4 }}>
                      {combo.bundledCourses?.map(id => {
                        const cid = typeof id === 'object' ? id._id : id;
                        const c = courses.find(x => x._id === cid);
                        return <li key={cid}>{c ? c.title : 'Unknown Course'}</li>;
                      })}
                    </ul>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #f3f4f6', paddingTop: 12, marginTop: 'auto' }}>
                  <button 
                    className="btn btn-sm" 
                    onClick={() => handleEdit(combo)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe', fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <FiEdit2 size={13} /> Edit
                  </button>
                  <button 
                    className="btn btn-sm" 
                    onClick={() => handleDelete(combo._id, combo.title)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', fontWeight: 600, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}
                  >
                    <FiTrash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
