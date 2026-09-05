import { useState, useEffect } from 'react';
import { enrollmentAPI, courseAPI, studentAPI } from '../../../services/tutor/api';
import { FiPlus, FiTrash2, FiCopy, FiBarChart2, FiX, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

/* ── Create Enrollment Modal ── */
function CreateModal({ onClose, onCreated }) {
  const [courses,  setCourses]  = useState([]);
  const [students, setStudents] = useState([]);
  const [form,     setForm]     = useState({ studentId: '', courseId: '' });
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    Promise.all([
      courseAPI.getAll().then(r => setCourses(r.data.courses || [])),
      studentAPI.getAll().then(r => setStudents(r.data.students || r.data || [])),
    ]).catch(() => toast.error('Failed to load data'));
  }, []);

  const submit = async e => {
    e.preventDefault();
    if (!form.studentId || !form.courseId) { toast.error('Select both student and course'); return; }
    const student = students.find(s => s._id === form.studentId);
    const payload = { studentId: form.studentId, studentName: student?.name || '', courseId: form.courseId };
    setLoading(true);
    try {
      const res = await enrollmentAPI.createCode(payload);
      setResult(res.data);
      onCreated();
      toast.success('Enrollment code created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create enrollment');
    } finally { setLoading(false); }
  };

  const copy = code => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="modal-overlay">
      <div className="card modal-box" style={{ maxWidth: 520, padding: '32px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, color: '#4c1d95' }}>Create Enrollment Code</h3>
          <button className="btn btn-ghost" style={{ padding: 7 }} onClick={onClose}><FiX size={18} /></button>
        </div>

        {result ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <FiCheck size={34} color="#059669" />
            </div>
            <h4 style={{ fontSize: 18, color: '#4c1d95', marginBottom: 6 }}>Code Generated!</h4>
            <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
              Share this code with <strong>{result.studentName}</strong> to enroll in <strong>{result.courseName || 'the course'}</strong>.
            </p>

            {/* Code display */}
            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', border: '2px solid #c4b5fd', borderRadius: 16, padding: '24px 20px', marginBottom: 22 }}>
              <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Enrollment Code</p>
              <p style={{ fontSize: 36, fontWeight: 800, color: '#4c1d95', letterSpacing: '.18em', fontFamily: 'monospace' }}>
                {result.enrollmentCode}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => copy(result.enrollmentCode)}>
                {copied ? <><FiCheck size={14} /> Copied!</> : <><FiCopy size={14} /> Copy Code</>}
              </button>
              <button className="btn btn-outline" onClick={() => { setResult(null); setForm({ studentId: '', courseId: '' }); }}>
                Create Another
              </button>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Select Student *</label>
              <select value={form.studentId} onChange={e => setForm(p => ({ ...p, studentId: e.target.value }))}>
                <option value="">-- Choose a student --</option>
                {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.email})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Select Course *</label>
              <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))}>
                <option value="">-- Choose a course --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
              </select>
            </div>
            <div style={{ padding: '12px 14px', background: '#f5f3ff', borderRadius: 10, marginBottom: 18 }}>
              <p style={{ fontSize: 13, color: '#6b7280' }}>
                An 8-character alphanumeric enrollment code will be automatically generated and can be shared with the student.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><span className="spinner spinner-xs" /> Generating…</> : <><FiPlus size={14} /> Generate Code</>}
              </button>
              <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [copiedId,    setCopiedId]    = useState(null);

  const load = () => {
    enrollmentAPI.getAll()
      .then(r => setEnrollments(r.data.enrollments || []))
      .catch(() => toast.error('Failed to load enrollments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const del = async id => {
    if (!confirm('Remove this enrollment?')) return;
    try { await enrollmentAPI.delete(id); toast.success('Enrollment removed'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const copy = (id, code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      toast.success('Code copied!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div>
      {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={load} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div className="anim-fade-up">
          <h2 style={{ fontSize: 26, color: '#4c1d95', marginBottom: 4 }}>Enrollments</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Generate and share enrollment codes with students</p>
        </div>
        <button className="btn btn-primary anim-fade-up" style={{ animationDelay: '.08s' }} onClick={() => setShowModal(true)}>
          <FiPlus size={16} /> New Enrollment Code
        </button>
      </div>

      <div className="card anim-fade-up" style={{ padding: 0, overflow: 'hidden', animationDelay: '.12s' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-md" /></div>
        ) : enrollments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9ca3af' }}>
            <FiBarChart2 size={44} style={{ marginBottom: 14, opacity: .3 }} />
            <p style={{ fontSize: 16, marginBottom: 16 }}>No enrollments yet.</p>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}><FiPlus size={14} /> Create First Enrollment</button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hide-mob" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Code</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Activated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr key={e._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar" style={{ width: 32, height: 32, fontSize: 12, flexShrink: 0 }}>
                            {(e.studentId?.name || e.studentName)?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, fontSize: 13, color: '#1f2937' }}>{e.studentId?.name || e.studentName}</p>
                            <p style={{ fontSize: 11, color: '#9ca3af' }}>{e.studentId?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: '#374151' }}>{e.courseId?.title || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#7c3aed', fontSize: 17, letterSpacing: '.12em', background: '#f5f3ff', padding: '4px 11px', borderRadius: 8 }}>
                            {e.enrollmentCode}
                          </span>
                          <button className="btn btn-ghost btn-xs" style={{ padding: '5px 8px' }} onClick={() => copy(e._id, e.enrollmentCode)}>
                            {copiedId === e._id ? <FiCheck size={13} color="#059669" /> : <FiCopy size={13} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${e.isVerified ? 'badge-ok' : 'badge-warn'}`}>
                          {e.isVerified ? 'Active' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: '#9ca3af' }}>{new Date(e.createdAt).toLocaleDateString()}</td>
                      <td style={{ fontSize: 13, color: e.isVerified ? '#059669' : '#9ca3af' }}>
                        {e.isVerified && e.verifiedAt ? new Date(e.verifiedAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <button className="btn btn-danger btn-xs" onClick={() => del(e._id)}>
                          <FiTrash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div style={{ padding: '12px' }} className="show-mob">
              {enrollments.map(e => (
                <div key={e._id} style={{ border: '1px solid #ede9fe', borderRadius: 14, padding: '16px', marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <p style={{ fontWeight: 700, color: '#1f2937', fontSize: 14 }}>{e.studentId?.name || e.studentName}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>{e.courseId?.title || '—'}</p>
                    </div>
                    <span className={`badge ${e.isVerified ? 'badge-ok' : 'badge-warn'}`} style={{ fontSize: 11 }}>
                      {e.isVerified ? 'Active' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f5f3ff', borderRadius: 10 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#4c1d95', fontSize: 20, letterSpacing: '.15em', flex: 1 }}>{e.enrollmentCode}</span>
                    <button className="btn btn-ghost btn-xs" onClick={() => copy(e._id, e.enrollmentCode)}>
                      {copiedId === e._id ? <FiCheck size={14} color="#059669" /> : <FiCopy size={14} />}
                    </button>
                    <button className="btn btn-danger btn-xs" onClick={() => del(e._id)}><FiTrash2 size={13} /></button>
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
