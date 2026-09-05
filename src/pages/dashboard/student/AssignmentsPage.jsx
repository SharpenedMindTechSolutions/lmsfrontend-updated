import { useState, useEffect } from 'react';
import { courseAPI, assignmentAPI, enrollmentAPI } from '../../../services/student/api';
import { FiClipboard, FiCalendar, FiUpload, FiCheck, FiX, FiAlertCircle, FiEye, FiStar, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : null;
const isPast = d => d && new Date(d) < new Date();

function StatusBadge({ submission, dueDate }) {
  if (!submission) {
    if (isPast(dueDate)) return (
      <span style={{ background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
        <FiAlertCircle size={12} /> Overdue
      </span>
    );
    return (
      <span style={{ background:'#fffbeb', border:'1px solid #fde68a', color:'#92400e', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
        <FiClock size={12} /> Pending
      </span>
    );
  }
  if (submission.grade) return (
    <span style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
      <FiStar size={12} /> Graded: {submission.grade}
    </span>
  );
  return (
    <span style={{ background:'#f5f3ff', border:'1px solid #ddd6fe', color:'#5b21b6', borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
      <FiCheck size={12} /> Submitted
    </span>
  );
}

function ShareWarningModal({ assignment, onConfirm, onCancel }) {
  const [checked, setChecked] = useState(false);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div className="card anim-scale-in" style={{ width:'100%', maxWidth:500 }}>

        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <h3 style={{ fontSize:17, fontWeight:700, margin:0 }}>Before you submit</h3>
            <p style={{ fontSize:13, color:'#6b7280', marginTop:4, marginBottom:0 }}>{assignment.title}</p>
          </div>
          <button className="btn btn-ghost" onClick={onCancel} style={{ padding:6 }}><FiX size={18} /></button>
        </div>

        {/* Warning box */}
        <div style={{ margin:'20px 24px 0', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <FiAlertCircle size={16} color="#d97706" />
            <strong style={{ fontSize:13, color:'#78350f' }}>Make sure your file is publicly accessible</strong>
          </div>
          <p style={{ fontSize:13, color:'#92400e', lineHeight:1.6, margin:0 }}>
            Your tutor <strong>won't be able to open</strong> your file if it's private or restricted to only your account.
          </p>
          <ol style={{ fontSize:12, color:'#92400e', lineHeight:1.9, marginTop:10, marginBottom:0, paddingLeft:18 }}>
            <li>Open your file in <strong>Google Drive / Dropbox / OneDrive</strong></li>
            <li>Click <strong>Share</strong> → <strong>"Change to anyone with the link"</strong></li>
            <li>Set permission to <strong>Viewer</strong>, then copy the link</li>
            <li>Paste that link in the File URL field</li>
          </ol>
        </div>

        {/* Confirmation checkbox */}
        <div style={{ margin:'14px 24px 0', background:'#f9fafb', borderRadius:9, padding:'12px 14px', display:'flex', alignItems:'flex-start', gap:10 }}>
          <input
  type="checkbox"
  id="share-confirm"
  checked={checked}
  onChange={e => setChecked(e.target.checked)}
  style={{
    marginTop: 2,
    cursor: 'pointer',
    accentColor: '#7c3aed',
    width: 16,
    height: 16,
    minWidth: 16,
    flexShrink: 0,
    appearance: 'checkbox',
    WebkitAppearance: 'checkbox',
  }}
/>
          <label htmlFor="share-confirm" style={{ fontSize:13, color:'#374151', lineHeight:1.5, cursor:'pointer' }}>
            I've set the file sharing to <strong>"Anyone with the link"</strong> so my tutor can access it.
          </label>
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:10, padding:'20px 24px' }}>
          <button className="btn btn-ghost" onClick={onCancel} style={{ flex:1 }}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={!checked}
            style={{ flex:2, opacity: checked ? 1 : 0.45, cursor: checked ? 'pointer' : 'not-allowed' }}
          >
            <FiUpload size={14} /> Continue to Submit
          </button>
        </div>

      </div>
    </div>
  );
}

export default function AssignmentsPage() {
  const [items, setItems]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [warnModal, setWarnModal] = useState(null); // holds assignment while warning is shown
  const [modal, setModal]       = useState(null);   // holds assignment for file form
  const [subForm, setSubForm]   = useState({ fileUrl:'', fileName:'', fileType:'pdf' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const cr = await courseAPI.getAll();
      const courses = cr.data.courses || [];
      const built = [];
      await Promise.all(courses.map(async course => {
        try {
          const ec = await enrollmentAPI.check(course._id);
          if (!ec.data?.verified) return;
        } catch { return; }

        let assignment = null;
        try {
          const ar = await assignmentAPI.byCourse(course._id);
          assignment = ar.data.assignment;
        } catch { return; }

        if (!assignment) return;

        let submission = null;
        try {
          const sr = await assignmentAPI.mySubmission(assignment._id);
          submission = sr.data.submission;
        } catch { /* no submission yet */ }

        built.push({ course, assignment, submission });
      }));
      setItems(built);
    } catch (e) {
      toast.error('Failed to load assignments');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Step 1: open warning modal
  const openSubmit = (assignment) => {
    setWarnModal(assignment);
  };

  // Step 2: on warning confirmed, open file form
  const handleWarningConfirm = () => {
    setSubForm({ fileUrl:'', fileName:'', fileType:'pdf' });
    setModal(warnModal);
    setWarnModal(null);
  };

  const handleSubmit = async () => {
    const { fileUrl, fileName, fileType } = subForm;
    if (!fileUrl.trim() || !fileName.trim()) {
      toast.error('File URL and file name are required');
      return;
    }
    setSubmitting(true);
    try {
      await assignmentAPI.submit(modal._id, { fileUrl: fileUrl.trim(), fileName: fileName.trim(), fileType });
      toast.success('Assignment submitted successfully!');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Submission failed');
    }
    setSubmitting(false);
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
        <p style={{ color:'#6b7280', fontSize:14 }}>
          {items.length} assignment{items.length !== 1 ? 's' : ''} from your enrolled courses.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'#9ca3af' }}>
          <FiClipboard size={44} style={{ marginBottom:14, opacity:.3 }} />
          <p style={{ fontSize:16, marginBottom:6 }}>No assignments yet.</p>
          <p style={{ fontSize:13 }}>Assignments from your enrolled courses will appear here.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {items.map(({ course, assignment, submission }) => {
            const overdue = isPast(assignment.dueDate);
            return (
              <div key={assignment._id} className="card anim-fade-up" style={{ overflow:'hidden' }}>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap', padding:'14px 16px', borderBottom:'1px solid #f3f4f6', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                      <span style={{ background:'#ede9fe', color:'#7c3aed', borderRadius:7, padding:'3px 10px', fontSize:12, fontWeight:600 }}>
                        {course.title}
                      </span>
                      <StatusBadge submission={submission} dueDate={assignment.dueDate} />
                    </div>
                    <h4 style={{ fontSize:16, fontWeight:700, color:'#111827', marginBottom:4 }}>{assignment.title}</h4>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <FiCalendar size={14} color={overdue && !submission ? '#ef4444' : '#9ca3af'} />
                    <span style={{ fontSize:12, color: overdue && !submission ? '#ef4444' : '#6b7280', fontWeight: overdue && !submission ? 700 : 400 }}>
                      {assignment.dueDate ? (overdue ? `Overdue · ${fmt(assignment.dueDate)}` : `Due ${fmt(assignment.dueDate)}`) : 'No due date'}
                    </span>
                  </div>
                </div>

                <div style={{ padding:'14px 16px' }}>
                  <p style={{ fontSize:14, color:'#374151', lineHeight:1.7, marginBottom:16 }}>{assignment.description}</p>

                  {submission ? (
                    <div style={{ background:'#f9fafb', borderRadius:11, padding:'14px 16px' }}>
                      <p style={{ fontSize:13, fontWeight:600, color:'#374151', marginBottom:6 }}>Your Submission</p>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <FiEye size={14} color="#7c3aed" />
                          <span style={{ fontSize:13, color:'#374151' }}>{submission.fileName}</span>
                          <span style={{ fontSize:11, color:'#9ca3af', textTransform:'uppercase' }}>.{submission.fileType}</span>
                        </div>
                        <span style={{ fontSize:12, color:'#9ca3af' }}>
                          {new Date(submission.createdAt).toLocaleString('en-IN')}
                        </span>
                        {submission.fileUrl && (
                          <a href={submission.fileUrl} target="_blank" rel="noreferrer"
                            style={{ marginLeft:'auto', fontSize:12, color:'#7c3aed', textDecoration:'none', fontWeight:600 }}>
                            View File
                          </a>
                        )}
                      </div>
                      {submission.feedback && (
                        <div style={{ marginTop:10, padding:'10px 13px', background:'#faf5ff', borderRadius:9, fontSize:13, color:'#374151', lineHeight:1.6 }}>
                          <strong style={{ color:'#7c3aed' }}>Tutor Feedback: </strong>{submission.feedback}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => openSubmit(assignment)}
                      style={{ gap:6 }}
                    >
                      <FiUpload size={14} /> Submit Assignment
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step 1 — Share warning modal */}
      {warnModal && (
        <ShareWarningModal
          assignment={warnModal}
          onConfirm={handleWarningConfirm}
          onCancel={() => setWarnModal(null)}
        />
      )}

      {/* Step 2 — File submission modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card anim-scale-in" style={{ width:'100%', maxWidth:500 }}>
            <div style={{ padding:'22px 26px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <h3 style={{ fontSize:17, fontWeight:700 }}>Submit Assignment</h3>
                <p style={{ fontSize:13, color:'#6b7280', marginTop:2 }}>{modal.title}</p>
              </div>
              <button className="btn btn-ghost" onClick={() => setModal(null)} style={{ padding:6 }}><FiX size={18} /></button>
            </div>
            <div style={{ padding:'22px 26px' }}>
              <div style={{ background:'#faf5ff', border:'1px solid #ede9fe', borderRadius:10, padding:'12px 14px', marginBottom:20, fontSize:13, color:'#5b21b6', lineHeight:1.6 }}>
                <strong>Note:</strong> Upload your file to a cloud service (Google Drive, Dropbox, etc.) and paste the shareable link below. Allowed types: PDF, DOC, DOCX, ZIP.
              </div>

              <div className="form-group">
                <label>File URL *</label>
                <input
                  type="url"
                  value={subForm.fileUrl}
                  onChange={e => setSubForm(p=>({...p, fileUrl:e.target.value}))}
                  placeholder="https://drive.google.com/…"
                />
              </div>
              <div className="form-group">
                <label>File Name *</label>
                <input
                  type="text"
                  value={subForm.fileName}
                  onChange={e => setSubForm(p=>({...p, fileName:e.target.value}))}
                  placeholder="e.g. my-assignment.pdf"
                />
              </div>
              <div className="form-group">
                <label>File Type</label>
                <select value={subForm.fileType} onChange={e => setSubForm(p=>({...p, fileType:e.target.value}))}>
                  <option value="pdf">PDF</option>
                  <option value="doc">DOC</option>
                  <option value="docx">DOCX</option>
                  <option value="zip">ZIP</option>
                </select>
              </div>

              <div style={{ display:'flex', gap:10, marginTop:20 }}>
                <button className="btn btn-ghost" onClick={() => setModal(null)} style={{ flex:1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ flex:2 }}>
                  {submitting ? <><span className="spinner spinner-xs" /> Submitting…</> : <><FiUpload size={15} /> Submit</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}