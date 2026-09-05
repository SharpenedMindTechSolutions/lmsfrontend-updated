import { useState, useEffect } from 'react';
import { courseAPI, assignmentAPI } from '../../../services/tutor/api';
import { FiClipboard, FiPlus, FiEdit2, FiTrash2, FiEye, FiUsers, FiX, FiCheck, FiAlertCircle, FiCalendar, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'No due date';
const isPast = d => d && new Date(d) < new Date();

export default function AssignmentsPage() {
  const [courses, setCourses]         = useState([]);
  const [assignments, setAssignments] = useState({});   // courseId -> assignment | null
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState(null); // 'create'|'edit'|'submissions'
  const [selected, setSelected]       = useState(null); // { courseId, assignment? }
  const [submissions, setSubmissions] = useState([]);
  const [subLoading, setSubLoading]   = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm]   = useState({ grade:'', feedback:'' });
  const [form, setForm]               = useState({ title:'', description:'', dueDate:'' });
  const [saving, setSaving]           = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const cr = await courseAPI.getAll();
      const list = cr.data.courses || [];
      setCourses(list);
      const map = {};
      await Promise.all(list.map(async c => {
        try {
          const res = await assignmentAPI.byCourse(c._id);
          map[c._id] = res.data.assignment;
        } catch { map[c._id] = null; }
      }));
      setAssignments(map);
    } catch { toast.error('Failed to load courses'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = (courseId) => {
    setSelected({ courseId });
    setForm({ title:'', description:'', dueDate:'' });
    setModal('create');
  };

  const openEdit = (courseId, assignment) => {
    setSelected({ courseId, assignment });
    setForm({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate ? assignment.dueDate.slice(0,10) : '',
    });
    setModal('edit');
  };

  const openSubmissions = async (assignment) => {
    setSelected({ assignment });
    setModal('submissions');
    setSubLoading(true);
    try {
      const res = await assignmentAPI.submissions(assignment._id);
      setSubmissions(res.data.submissions || []);
    } catch { toast.error('Failed to load submissions'); }
    setSubLoading(false);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description, dueDate: form.dueDate || undefined };
      if (modal === 'create') {
        await assignmentAPI.create(selected.courseId, payload);
        toast.success('Assignment created!');
      } else {
        await assignmentAPI.update(selected.assignment._id, payload);
        toast.success('Assignment updated!');
      }
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (assignment) => {
    if (!confirm(`Delete assignment "${assignment.title}"? This will also delete all submissions.`)) return;
    try {
      await assignmentAPI.delete(assignment._id);
      toast.success('Assignment deleted');
      load();
    } catch { toast.error('Failed to delete'); }
  };

  const handleReview = async () => {
    if (!reviewForm.grade && !reviewForm.feedback) { toast.error('Enter grade or feedback'); return; }
    try {
      await assignmentAPI.reviewSubmission(reviewModal._id, reviewForm);
      toast.success('Review saved!');
      setReviewModal(null);
      setReviewForm({ grade:'', feedback:'' });
      openSubmissions(selected.assignment);
    } catch { toast.error('Failed to save review'); }
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <div className="spinner spinner-md" />
    </div>
  );

  return (
    <div>
      <div className="anim-fade-up" style={{ marginBottom:26 }}>
        <h2 style={{ fontSize:26, color:'#4c1d95', marginBottom:6 }}>Assignments</h2>
        <p style={{ color:'#6b7280', fontSize:14 }}>Manage assignments for each course. One assignment per course.</p>
      </div>

      {courses.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'#9ca3af' }}>
          <FiClipboard size={44} style={{ marginBottom:14, opacity:.3 }} />
          <p>No courses yet. Create a course first.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap:20 }}>
          {courses.map(course => {
            const asmt = assignments[course._id];
            const overdue = asmt && isPast(asmt.dueDate);
            return (
              <div key={course._id} className="card card-hover anim-fade-up" style={{ overflow:'hidden' }}>
                <div style={{ padding:'20px 22px', borderBottom:'1px solid #f3f4f6' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
                    <div style={{ flex:1 }}>
                      <h4 style={{ fontSize:15, fontWeight:700, color:'#1f2937', marginBottom:4 }}>{course.title}</h4>
                      <p style={{ fontSize:12, color:'#9ca3af' }}>{course.description?.slice(0,60)}…</p>
                    </div>
                    <div style={{ width:38, height:38, borderRadius:10, background:'linear-gradient(135deg,#ede9fe,#c4b5fd)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FiClipboard size={18} color="#7c3aed" />
                    </div>
                  </div>
                </div>

                <div style={{ padding:'16px 22px' }}>
                  {asmt ? (
                    <>
                      <div style={{ marginBottom:14 }}>
                        <p style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:4 }}>{asmt.title}</p>
                        <p style={{ fontSize:13, color:'#6b7280', lineHeight:1.5, marginBottom:10 }}>{asmt.description?.slice(0,100)}{asmt.description?.length > 100 ? '…' : ''}</p>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <FiCalendar size={13} color={overdue ? '#ef4444' : '#7c3aed'} />
                          <span style={{ fontSize:12, color: overdue ? '#ef4444' : '#6b7280', fontWeight: overdue ? 700 : 400 }}>
                            {overdue ? 'Overdue — ' : ''}{fmt(asmt.dueDate)}
                          </span>
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openSubmissions(asmt)} style={{ gap:5, fontSize:12 }}>
                          <FiUsers size={13} /> Submissions
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(course._id, asmt)} style={{ gap:5, fontSize:12 }}>
                          <FiEdit2 size={13} /> Edit
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(asmt)} style={{ gap:5, fontSize:12, color:'#ef4444' }}>
                          <FiTrash2 size={13} /> Delete
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign:'center', padding:'12px 0' }}>
                      <p style={{ fontSize:13, color:'#9ca3af', marginBottom:14 }}>No assignment yet</p>
                      <button className="btn btn-primary btn-sm" onClick={() => openCreate(course._id)} style={{ gap:6 }}>
                        <FiPlus size={14} /> Create Assignment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card anim-scale-in" style={{ width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ padding:'24px 28px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontSize:18, fontWeight:700, color:'#111827' }}>
                {modal === 'create' ? 'Create Assignment' : 'Edit Assignment'}
              </h3>
              <button className="btn btn-ghost" onClick={() => setModal(null)} style={{ padding:6 }}><FiX size={18} /></button>
            </div>
            <div style={{ padding:'24px 28px' }}>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p=>({...p, title:e.target.value}))} placeholder="Assignment title" />
              </div>
              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p=>({...p, description:e.target.value}))}
                  placeholder="Describe the assignment requirements…"
                  rows={5}
                  style={{ resize:'vertical' }}
                />
              </div>
              <div className="form-group">
                <label>Due Date (optional)</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(p=>({...p, dueDate:e.target.value}))} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)} style={{ flex:1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex:2 }}>
                  {saving ? <><span className="spinner spinner-xs" /> Saving…</> : <><FiCheck size={15} /> {modal === 'create' ? 'Create' : 'Update'}</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Modal */}
      {modal === 'submissions' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card anim-scale-in" style={{ width:'100%', maxWidth:680, maxHeight:'90vh', display:'flex', flexDirection:'column' }}>
            <div style={{ padding:'22px 26px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
              <div>
                <h3 style={{ fontSize:17, fontWeight:700, color:'#111827' }}>Submissions</h3>
                <p style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>{selected?.assignment?.title}</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setModal(null)} style={{ padding:6 }}><FiX size={18} /></button>
            </div>
            <div style={{ overflowY:'auto', flex:1, padding:'16px 26px' }}>
              {subLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:40 }}><div className="spinner spinner-md" /></div>
              ) : submissions.length === 0 ? (
                <div style={{ textAlign:'center', padding:40, color:'#9ca3af' }}>
                  <FiUsers size={36} style={{ marginBottom:12, opacity:.3 }} />
                  <p>No submissions yet.</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {submissions.map(s => (
                    <div key={s._id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:'16px 18px' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                        <div>
                          <p style={{ fontWeight:600, fontSize:14, color:'#111827' }}>{s.studentName || s.studentId?.name}</p>
                          <p style={{ fontSize:12, color:'#6b7280' }}>{s.studentId?.email}</p>
                          <p style={{ fontSize:12, color:'#9ca3af', marginTop:4 }}>
                            Submitted: {new Date(s.createdAt).toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'center' }}>
                          {s.grade && (
                            <span style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', borderRadius:8, padding:'3px 10px', fontSize:12, fontWeight:700 }}>
                              <FiStar size={11} style={{ marginRight:4 }} />{s.grade}
                            </span>
                          )}
                          <button className="btn btn-ghost btn-sm" onClick={() => { setReviewModal(s); setReviewForm({ grade: s.grade||'', feedback: s.feedback||'' }); }} style={{ fontSize:12 }}>
                            Review
                          </button>
                        </div>
                      </div>
                      <div style={{ marginTop:10, padding:'8px 12px', background:'#f9fafb', borderRadius:8, display:'flex', gap:12, alignItems:'center' }}>
                        <FiEye size={14} color="#7c3aed" />
                        <span style={{ fontSize:13, color:'#374151' }}>{s.fileName}</span>
                        <span style={{ fontSize:11, color:'#9ca3af', textTransform:'uppercase' }}>.{s.fileType}</span>
                        {s.fileUrl && (
                          <a href={s.fileUrl} target="_blank" rel="noreferrer" style={{ marginLeft:'auto', fontSize:12, color:'#7c3aed', textDecoration:'none', fontWeight:600 }}>
                            Download
                          </a>
                        )}
                      </div>
                      {s.feedback && (
                        <div style={{ marginTop:8, padding:'8px 12px', background:'#faf5ff', borderRadius:8, fontSize:13, color:'#6b7280' }}>
                          <strong style={{ color:'#7c3aed' }}>Feedback:</strong> {s.feedback}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card anim-scale-in" style={{ width:'100%', maxWidth:440 }}>
            <div style={{ padding:'22px 26px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontSize:17, fontWeight:700 }}>Review Submission</h3>
              <button className="btn btn-ghost" onClick={() => setReviewModal(null)} style={{ padding:6 }}><FiX size={18} /></button>
            </div>
            <div style={{ padding:'22px 26px' }}>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:20 }}>Student: <strong>{reviewModal.studentName}</strong></p>
              <div className="form-group">
                <label>Grade (e.g. A, B+, 85/100)</label>
                <input type="text" value={reviewForm.grade} onChange={e => setReviewForm(p=>({...p, grade:e.target.value}))} placeholder="Grade" />
              </div>
              <div className="form-group">
                <label>Feedback</label>
                <textarea value={reviewForm.feedback} onChange={e => setReviewForm(p=>({...p, feedback:e.target.value}))} rows={4} placeholder="Write feedback…" style={{ resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button className="btn btn-ghost" onClick={() => setReviewModal(null)} style={{ flex:1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleReview} style={{ flex:2 }}><FiCheck size={15} /> Save Review</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
