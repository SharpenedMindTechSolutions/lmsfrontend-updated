import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseAPI, sessionAPI, testAPI, taskAPI } from '../../../services/tutor/api';
import { useAuth } from '../../../context/tutor/AuthContext';
import { FiArrowLeft, FiPlus, FiTrash2, FiEdit, FiPlay, FiHelpCircle, FiChevronDown, FiChevronUp, FiBook, FiX, FiLock, FiSave, FiCheck, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import DiscussionForum from '../../../components/discussion/DiscussionForum';
import SmartQuizGenerator from '../../../components/ai/SmartQuizGenerator';


// Responsive style for session/test forms
const _courseDetailStyle = `
  @media(max-width:600px) {
    .cd-form-2col { grid-template-columns: 1fr !important; }
    .cd-question-grid { grid-template-columns: 1fr !important; }
  }
`;

function SessionDiscussionToggle({ courseId, sessionId }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{ background: 'transparent', border: 'none', color: '#6d28d9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 0', fontSize: '13px' }}>
        <FiMessageSquare /> {open ? 'Hide Discussions' : 'View Discussions'} {open ? <FiChevronUp /> : <FiChevronDown />}
      </button>
      {open && (
        <div style={{ marginTop: '12px' }}>
          <DiscussionForum courseId={courseId} sessionId={sessionId} userRole="tutor" />
        </div>
      )}
    </div>
  );
}

/* ─── Add Session Form ─── */
function AddSession({ courseId, onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ sessionTitle: '', videoTitle: '', videoDriveLink: '', order: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.sessionTitle || !form.videoTitle || !form.videoDriveLink) {
      toast.error('Fill all required fields'); return;
    }
    setLoading(true);
    try {
      await sessionAPI.add(courseId, { ...form, order: Number(form.order) || 0 });
      toast.success('Session added!');
      setForm({ sessionTitle: '', videoTitle: '', videoDriveLink: '', order: '' });
      setOpen(false); onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ border: '2px dashed #c4b5fd', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '14px 20px', background: open ? '#f5f3ff' : 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700, color: '#7c3aed', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <FiPlus size={18} /> Add New Session {open ? <FiChevronUp style={{ marginLeft: 'auto' }} /> : <FiChevronDown style={{ marginLeft: 'auto' }} />}
      </button>
      {open && (
        <div style={{ padding: '20px 22px', borderTop: '1px solid #ede9fe', background: '#fdfcff' }}>
          <form onSubmit={submit}>
            <div className='cd-form-2col' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Session Title *</label>
                <input placeholder="e.g. Intro to Variables" value={form.sessionTitle} onChange={set('sessionTitle')} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Video Title *</label>
                <input placeholder="e.g. Python Variables Explained" value={form.videoTitle} onChange={set('videoTitle')} />
              </div>
            </div>
            <div className="form-group">
              <label>Google Drive / Video Link *</label>
              <input placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing" value={form.videoDriveLink} onChange={set('videoDriveLink')} />
              <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Paste a Google Drive shareable link — it will auto-convert to preview embed for students.</p>
            </div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Order (optional)</label>
              <input type="number" placeholder="1" value={form.order} onChange={set('order')} style={{ maxWidth: 100 }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner spinner-xs" /> Adding…</> : <><FiPlus size={13} /> Add Session</>}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── Add Test Form ─── */
function AddTest({ sessionId, onDone }) {
  const [open, setOpen]           = useState(false);
  const [loading, setLoading]     = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);

  const addQ    = () => setQuestions(p => [...p, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  const removeQ = i => setQuestions(p => p.filter((_, j) => j !== i));
  const setQ    = (i, field, val) => setQuestions(p => p.map((q, j) => j === i ? { ...q, [field]: val } : q));
  const setOpt  = (qi, oi, val) => setQuestions(p => p.map((q, j) => {
    if (j !== qi) return q;
    const opts = [...q.options]; opts[oi] = val;
    return { ...q, options: opts };
  }));

  const submit = async e => {
    e.preventDefault();
    for (const q of questions) {
      if (!q.questionText || !q.correctAnswer) { toast.error('Fill all question fields'); return; }
      const validOpts = q.options.filter(o => o.trim());
      if (validOpts.length < 2) { toast.error('Each question needs at least 2 options'); return; }
      if (!validOpts.includes(q.correctAnswer)) { toast.error('Correct answer must match one of the options exactly'); return; }
    }
    const payload = {
      questions: questions.map(q => ({
        questionText: q.questionText,
        options: q.options.filter(o => o.trim()),
        correctAnswer: q.correctAnswer,
      }))
    };
    setLoading(true);
    try {
      await testAPI.create(sessionId, payload);
      toast.success('Test created!');
      setOpen(false);
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
      onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create test'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ border: '1.5px dashed #c4b5fd', borderRadius: 11, overflow: 'hidden', marginTop: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '10px 16px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#8b5cf6', fontFamily: 'Plus Jakarta Sans,sans-serif' }}>
        <FiHelpCircle size={15} /> {open ? 'Cancel' : 'Add Test for this Session'} {open ? <FiChevronUp style={{ marginLeft: 'auto' }} /> : <FiChevronDown style={{ marginLeft: 'auto' }} />}
      </button>
      {open && (
        <div style={{ padding: '16px 18px', borderTop: '1px solid #ede9fe', background: '#fdfcff' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAiGen(true)} style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#16a34a' }}>
              ✨ Auto-Generate with AI
            </button>
          </div>
          {showAiGen && (
            <SmartQuizGenerator 
              onClose={() => setShowAiGen(false)} 
              onGenerate={(genQuestions) => {
                setQuestions(genQuestions);
                setShowAiGen(false);
              }} 
            />
          )}
          <form onSubmit={submit}>
            {questions.map((q, qi) => (
              <div key={qi} style={{ padding: '14px 16px', border: '1.5px solid #ede9fe', borderRadius: 12, marginBottom: 14, background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Question {qi + 1}</p>
                  {questions.length > 1 && <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeQ(qi)}><FiX size={13} /></button>}
                </div>
                <div className="form-group">
                  <label>Question Text</label>
                  <input placeholder="Enter your question…" value={q.questionText} onChange={e => setQ(qi, 'questionText', e.target.value)} />
                </div>
                <label style={{ marginBottom: 8 }}>Answer Options (enter text, then set correct below)</label>
                <div className='cd-question-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {q.options.map((opt, oi) => (
                    <input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={e => setOpt(qi, oi, e.target.value)} />
                  ))}
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Correct Answer (must exactly match one option)</label>
                  <select value={q.correctAnswer} onChange={e => setQ(qi, 'correctAnswer', e.target.value)}>
                    <option value="">-- Select correct answer --</option>
                    {q.options.filter(o => o.trim()).map((o, i) => <option key={i} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="button" className="btn btn-outline btn-sm" onClick={addQ}><FiPlus size={13} /> Add Question</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? <><span className="spinner spinner-xs" /> Saving…</> : 'Save Test'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ─── Edit Session Modal ─── */
function EditSession({ session, onDone, onClose }) {
  const [form, setForm] = useState({
    sessionTitle: session.sessionTitle || '',
    videoTitle:   session.videoTitle   || '',
    videoDriveLink: session.videoDriveLink || '',
    order: session.order ?? '',
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.sessionTitle || !form.videoTitle || !form.videoDriveLink) {
      toast.error('Fill all required fields'); return;
    }
    setLoading(true);
    try {
      await sessionAPI.update(session._id, { ...form, order: Number(form.order) || 0 });
      toast.success('Session updated!');
      onDone(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update session'); }
    finally { setLoading(false); }
  };

  return (
    <>
    <div className="modal-overlay">
      <div className="card modal-box" style={{ maxWidth: 540, padding: '28px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 8 }}><FiEdit size={16} /> Edit Session</h3>
          <button className="btn btn-ghost" style={{ padding: 7 }} onClick={onClose}><FiX size={18} /></button>
        </div>
        <form onSubmit={submit}>
          <div className='cd-form-2col' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Session Title *</label>
              <input value={form.sessionTitle} onChange={set('sessionTitle')} placeholder="e.g. Intro to Variables" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Video Title *</label>
              <input value={form.videoTitle} onChange={set('videoTitle')} placeholder="e.g. Python Variables Explained" />
            </div>
          </div>
          <div className="form-group">
            <label>Google Drive / Video Link *</label>
            <input value={form.videoDriveLink} onChange={set('videoDriveLink')} placeholder="https://drive.google.com/file/d/FILE_ID/view?usp=sharing" />
          </div>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label>Order (optional)</label>
            <input type="number" value={form.order} onChange={set('order')} placeholder="1" style={{ maxWidth: 100 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <><span className="spinner spinner-xs" /> Saving…</> : <><FiSave size={13} /> Save Changes</>}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
    <style>{`
      @media(max-width:600px){
        .cd-form-2col,.cd-question-grid{grid-template-columns:1fr!important;}
      }
    `}</style>
    </>
  );
}

/* ─── Edit Test Modal ─── */
function EditTest({ test, onDone, onClose }) {
  const [loading, setLoading] = useState(false);
  const [showAiGen, setShowAiGen] = useState(false);
  const [questions, setQuestions] = useState(
    test.questions?.map(q => ({
      questionText: q.questionText || '',
      options: q.options?.length >= 4 ? q.options : [...(q.options || []), '', '', '', ''].slice(0, 4),
      correctAnswer: q.correctAnswer || '',
    })) || [{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]
  );

  const addQ    = () => setQuestions(p => [...p, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  const removeQ = i => setQuestions(p => p.filter((_, j) => j !== i));
  const setQ    = (i, field, val) => setQuestions(p => p.map((q, j) => j === i ? { ...q, [field]: val } : q));
  const setOpt  = (qi, oi, val) => setQuestions(p => p.map((q, j) => {
    if (j !== qi) return q;
    const opts = [...q.options]; opts[oi] = val;
    return { ...q, options: opts };
  }));

  const submit = async e => {
    e.preventDefault();
    for (const q of questions) {
      if (!q.questionText || !q.correctAnswer) { toast.error('Fill all question fields'); return; }
      const validOpts = q.options.filter(o => o.trim());
      if (validOpts.length < 2) { toast.error('Each question needs at least 2 options'); return; }
      if (!validOpts.includes(q.correctAnswer)) { toast.error('Correct answer must match one of the options exactly'); return; }
    }
    const payload = {
      questions: questions.map(q => ({
        questionText: q.questionText,
        options: q.options.filter(o => o.trim()),
        correctAnswer: q.correctAnswer,
      }))
    };
    setLoading(true);
    try {
      await testAPI.update(test._id, payload);
      toast.success('Test updated!');
      onDone(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update test'); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="card modal-box" style={{ maxWidth: 580, padding: '28px 28px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 8 }}><FiEdit size={16} /> Edit Test</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowAiGen(true)} style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#16a34a' }}>
              ✨ Auto-Generate with AI
            </button>
            <button className="btn btn-ghost" style={{ padding: 7 }} onClick={onClose}><FiX size={18} /></button>
          </div>
        </div>
        {showAiGen && (
          <SmartQuizGenerator 
            onClose={() => setShowAiGen(false)} 
            onGenerate={(genQuestions) => {
              setQuestions(prev => [...prev, ...genQuestions]); // append to existing
              setShowAiGen(false);
            }} 
          />
        )}
        <form onSubmit={submit}>
          {questions.map((q, qi) => (
            <div key={qi} style={{ padding: '14px 16px', border: '1.5px solid #ede9fe', borderRadius: 12, marginBottom: 14, background: 'white' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed' }}>Question {qi + 1}</p>
                {questions.length > 1 && <button type="button" className="btn btn-ghost btn-xs" onClick={() => removeQ(qi)}><FiX size={13} /></button>}
              </div>
              <div className="form-group">
                <label>Question Text</label>
                <input placeholder="Enter your question…" value={q.questionText} onChange={e => setQ(qi, 'questionText', e.target.value)} />
              </div>
              <label style={{ marginBottom: 8, fontSize: 13, color: '#374151', fontWeight: 600 }}>Answer Options</label>
              <div className='cd-question-grid' style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                {q.options.map((opt, oi) => (
                  <input key={oi} placeholder={`Option ${oi + 1}`} value={opt} onChange={e => setOpt(qi, oi, e.target.value)} />
                ))}
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Correct Answer (must exactly match one option)</label>
                <select value={q.correctAnswer} onChange={e => setQ(qi, 'correctAnswer', e.target.value)}>
                  <option value="">-- Select correct answer --</option>
                  {q.options.filter(o => o.trim()).map((o, i) => <option key={i} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={addQ}><FiPlus size={13} /> Add Question</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <><span className="spinner spinner-xs" /> Saving…</> : <><FiSave size={13} /> Save Test</>}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Add Task Form ─── */
function AddTask({ sessionId, courseId, onDone }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', instructions: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error('Title and Description are required'); return;
    }
    setLoading(true);
    try {
      await taskAPI.create(sessionId, { ...form, courseId });
      toast.success('Task created!');
      setForm({ title: '', description: '', instructions: '' });
      setOpen(false); onDone();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create task'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: 'transparent', border: 'none', color: '#7c3aed', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '4px 0', fontSize: 12 }}
      >
        <FiPlus size={13} /> {open ? 'Cancel' : 'Add Code Task'}
      </button>
      {open && (
        <form onSubmit={submit} style={{ marginTop: 10, padding: '14px 16px', background: '#fdfcff', border: '1px solid #ede9fe', borderRadius: 10 }}>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12 }}>Task Title *</label>
            <input placeholder="e.g. Build a REST API" value={form.title} onChange={set('title')} />
          </div>
          <div className="form-group" style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 12 }}>Description *</label>
            <input placeholder="Brief description of the task" value={form.description} onChange={set('description')} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12 }}>Instructions</label>
            <textarea placeholder="Detailed instructions for students…" value={form.instructions} onChange={set('instructions')} rows={3} style={{ resize: 'vertical', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary btn-xs" disabled={loading}>
              {loading ? <><span className="spinner spinner-xs" /> Saving…</> : <><FiPlus size={11} /> Create Task</>}
            </button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ─── Task Submissions Modal ─── */
function TaskSubmissions({ task, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const handleSelectCode = (idx) => {
    setSelectedCode(idx);
    if (idx !== null && submissions[idx]) {
      setFeedbackText(submissions[idx].feedback || '');
    } else {
      setFeedbackText('');
    }
  };

  const handleFeedbackSubmit = async () => {
    const sub = submissions[selectedCode];
    if (!sub) return;
    setSubmittingFeedback(true);
    try {
      const res = await taskAPI.addFeedback(sub._id, { feedback: feedbackText });
      toast.success('Feedback sent to student!');
      
      // Update local state to reflect the change
      setSubmissions(prev => {
        const arr = [...prev];
        arr[selectedCode] = res.data.submission;
        return arr;
      });
    } catch (err) {
      toast.error('Failed to save feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    taskAPI.submissions(task._id)
      .then(r => setSubmissions(r.data.submissions || []))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [task._id]);

  return (
    <div className="modal-overlay">
      <div className="card modal-box" style={{ maxWidth: 700, padding: '28px 28px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 8 }}>📋 Submissions: {task.title}</h3>
          <button className="btn btn-ghost" style={{ padding: 7 }} onClick={onClose}><FiX size={18} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner spinner-md" /></div>
        ) : submissions.length === 0 ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: 20 }}>No submissions yet.</p>
        ) : selectedCode !== null ? (
          /* Show selected student's code */
          <div>
            <button onClick={() => handleSelectCode(null)} className="btn btn-outline btn-sm" style={{ marginBottom: 14, gap: 6 }}>
              ← Back to list
            </button>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1f2937', marginBottom: 4 }}>
                {submissions[selectedCode].studentId?.name || 'Student'}
              </p>
              <p style={{ fontSize: 11, color: '#6b7280' }}>
                Submitted: {new Date(submissions[selectedCode].submittedAt).toLocaleString()}
              </p>
            </div>
            <pre style={{
              background: '#0f172a', color: '#e2e8f0', borderRadius: 12, padding: '18px 20px',
              fontSize: 13, fontFamily: 'monospace', lineHeight: 1.7, overflowX: 'auto',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 400
            }}>
              {submissions[selectedCode].submittedCode}
            </pre>
            <div style={{ marginTop: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Tutor Feedback</label>
              <textarea
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                placeholder="Write your feedback for this student..."
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 8,
                  border: '1px solid #d1d5db', marginTop: 8, fontSize: 13,
                  resize: 'vertical'
                }}
              />
              <button
                onClick={handleFeedbackSubmit}
                disabled={submittingFeedback}
                className="btn btn-primary btn-sm"
                style={{ marginTop: 10 }}
              >
                {submittingFeedback ? <><span className="spinner spinner-xs" /> Saving...</> : 'Send Feedback'}
              </button>
            </div>
          </div>
        ) : (
          /* Submissions table */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {submissions.map((sub, idx) => (
              <div
                key={sub._id}
                onClick={() => handleSelectCode(idx)}
                style={{
                  padding: '12px 16px', border: '1px solid #ede9fe', borderRadius: 10,
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', background: '#faf9ff',
                  transition: 'all 0.15s'
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#1f2937', marginBottom: 2 }}>{sub.studentId?.name || 'Unknown'}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af' }}>{sub.studentId?.email}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="badge badge-ok" style={{ fontSize: 10 }}>{sub.status}</span>
                  <p style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>{new Date(sub.submittedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Course Detail Page ─── */
export default function CourseDetail() {
  const { courseId } = useParams();
  const nav = useNavigate();
  const { tutor } = useAuth();
  const [course,   setCourse]   = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tests,    setTests]    = useState({});
  const [tasks,    setTasks]    = useState({});
  const [loading,  setLoading]  = useState(true);
  const [editSession, setEditSession] = useState(null); // session object being edited
  const [editTest,    setEditTest]    = useState(null); // test object being edited
  const [viewSubmissions, setViewSubmissions] = useState(null); // task object for viewing submissions

  /**
   * FIX: Check ownership on the frontend using the logged-in tutor's id.
   * tutorId in the populated course object is { _id, name, email }.
   */
  const isOwner = (c) => {
    if (!c || !tutor) return false;
    const ownerId = c.tutorId?._id || c.tutorId;
    return ownerId?.toString() === tutor?._id?.toString() ||
           ownerId?.toString() === tutor?.id?.toString();
  };

  const loadSessions = useCallback(async () => {
    const sr = await sessionAPI.byCourse(courseId);
    const list = sr.data.sessions || [];
    setSessions(list);
    const tMap = {};
    const tkMap = {};
    await Promise.all(list.map(async s => {
      try { const tr = await testAPI.bySession(s._id); tMap[s._id] = tr.data.test || tr.data; }
      catch { tMap[s._id] = null; }
      try { const tkr = await taskAPI.bySession(s._id); tkMap[s._id] = tkr.data.task || null; }
      catch { tkMap[s._id] = null; }
    }));
    setTests(tMap);
    setTasks(tkMap);
  }, [courseId]);

  useEffect(() => {
    (async () => {
      try {
        const cr = await courseAPI.getById(courseId);
        setCourse(cr.data.course);
        await loadSessions();
      } catch { toast.error('Failed to load course'); }
      finally { setLoading(false); }
    })();
  }, [courseId]);

  const delSession = async id => {
    if (!confirm('Delete this session and its test?')) return;
    try { await sessionAPI.delete(id); toast.success('Session deleted'); loadSessions(); }
    catch { toast.error('Failed'); }
  };

  const delTask = async taskId => {
    if (!confirm('Delete this task and all its submissions?')) return;
    try { await taskAPI.delete(taskId); toast.success('Task deleted'); loadSessions(); }
    catch { toast.error('Failed'); }
  };

  const delTest = async testId => {
    if (!confirm('Delete this test?')) return;
    try { await testAPI.delete(testId); toast.success('Test deleted'); loadSessions(); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-md" /></div>;
  if (!course) return null;

  const owned = isOwner(course);

  return (
    <div>
      {/* Edit modals */}
      {editSession && (
        <EditSession
          session={editSession}
          onDone={loadSessions}
          onClose={() => setEditSession(null)}
        />
      )}
      {editTest && (
        <EditTest
          test={editTest}
          onDone={loadSessions}
          onClose={() => setEditTest(null)}
        />
      )}
      {viewSubmissions && (
        <TaskSubmissions
          task={viewSubmissions}
          onClose={() => setViewSubmissions(null)}
        />
      )}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22 }}>
        <button className="btn btn-ghost" onClick={() => nav('/tutor/dashboard/courses')} style={{ padding: '6px 0', gap: 6 }}>
          <FiArrowLeft size={16} /> Courses
        </button>
        {!owned && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 99, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600 }}>
            <FiLock size={12} /> View Only — This course belongs to another tutor
          </div>
        )}
      </div>

      {/* Course header */}
      <div className="card anim-fade-up" style={{ marginBottom: 22, background: 'linear-gradient(135deg,#2e1065,#4c1d95 45%,#7c3aed 100%)', border: 'none', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,.05)' }} />
        <div style={{ padding: '28px 32px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', padding: '4px 12px', borderRadius: 99, marginBottom: 12 }}>
                <FiBook size={12} color="white" /><span style={{ color: 'white', fontSize: 12, fontWeight: 600 }}>Course</span>
              </div>
              <h2 style={{ color: '#fff', fontSize: 24, marginBottom: 8 }}>{course.title}</h2>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 14, lineHeight: 1.6, maxWidth: 520 }}>{course.description}</p>
            </div>
            {/* Edit button only for the owner */}
            {owned && (
              <Link to={`/tutor/dashboard/courses/${courseId}/edit`}>
                <button className="btn" style={{ background: 'rgba(255,255,255,.15)', color: 'white', border: '1px solid rgba(255,255,255,.25)' }}>
                  <FiEdit size={14} /> Edit
                </button>
              </Link>
            )}
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 28 }}>
            {[
              { label: 'Sessions', val: sessions.length },
              { label: 'Tests',    val: Object.values(tests).filter(Boolean).length },
              { label: 'Tasks',    val: Object.values(tasks).filter(Boolean).length },
            ].map(({ label, val }) => (
              <div key={label}>
                <p style={{ color: 'white', fontSize: 22, fontWeight: 700, fontFamily: 'Cormorant Garamond,serif', lineHeight: 1 }}>{val}</p>
                <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 12 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="card anim-fade-up" style={{ padding: '24px 28px', animationDelay: '.08s' }}>
        <h3 style={{ fontSize: 20, color: '#4c1d95', marginBottom: 20 }}>Sessions & Tests</h3>

        {/* Only the owner can add sessions */}
        {owned && <AddSession courseId={courseId} onDone={loadSessions} />}

        {sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: '#9ca3af' }}>
            <FiPlay size={38} style={{ marginBottom: 12, opacity: .3 }} />
            <p>{owned ? 'No sessions yet. Add one above.' : 'No sessions added yet.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sessions.map((s, i) => {
              const t = tests[s._id];
              const tk = tasks[s._id];
              return (
                <div key={s._id} style={{ border: '1.5px solid #ede9fe', borderRadius: 14, overflow: 'hidden' }}>
                  {/* Session row */}
                  <div style={{ padding: '15px 20px', display: 'flex', alignItems: 'center', gap: 14, background: '#faf9ff' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#1f2937', fontSize: 14, marginBottom: 2 }}>{s.sessionTitle}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>{s.videoTitle}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                      {t ? <span className="badge badge-ok" style={{ fontSize: 11 }}>Test Added</span>
                         : <span className="badge badge-warn" style={{ fontSize: 11 }}>No Test</span>}
                      {tk ? <span className="badge badge-ok" style={{ fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>Task Added</span>
                          : <span className="badge badge-warn" style={{ fontSize: 11, background: 'rgba(245,158,11,0.1)', color: '#d97706', border: '1px solid rgba(245,158,11,0.2)' }}>No Task</span>}
                      {/* Edit & Delete only for owner */}
                      {owned && (
                        <>
                          <button className="btn btn-outline btn-xs" onClick={() => setEditSession(s)} title="Edit session">
                            <FiEdit size={12} />
                          </button>
                          <button className="btn btn-danger btn-xs" onClick={() => delSession(s._id)}><FiTrash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Video link */}
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #f3f4f6', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <FiPlay size={13} color="#a78bfa" />
                      <a href={s.videoDriveLink} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#7c3aed', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.videoDriveLink}</a>
                    </div>
                  </div>

                  {/* Test info */}
                  {t && (
                    <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', background: '#fdfcff', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FiHelpCircle size={14} color="#a78bfa" />
                      <span style={{ fontSize: 13, color: '#374151', flex: 1 }}>{t.questions?.length || 0} question{t.questions?.length !== 1 ? 's' : ''}</span>
                      {owned && (
                        <>
                          <button className="btn btn-outline btn-xs" onClick={() => setEditTest(t)} title="Edit test">
                            <FiEdit size={12} />
                          </button>
                          <button className="btn btn-danger btn-xs" onClick={() => delTest(t._id)}><FiTrash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Add test — only for owner */}
                  {!t && owned && (
                    <div style={{ padding: '10px 20px', borderTop: '1px solid #f3f4f6' }}>
                      <AddTest sessionId={s._id} onDone={loadSessions} />
                    </div>
                  )}

                  {/* Task info */}
                  {tk && (
                    <div style={{ padding: '12px 20px', borderTop: '1px solid #f3f4f6', background: '#fdfcff', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FiBook size={14} color="#10b981" />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Task: {tk.title}</span>
                        <span style={{ fontSize: 11, color: '#6b7280' }}>{tk.description}</span>
                      </div>
                      {owned && (
                        <>
                          <button className="btn btn-outline btn-xs" onClick={() => setViewSubmissions(tk)} title="View submissions" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#16a34a' }}>
                            View Submissions
                          </button>
                          <button className="btn btn-danger btn-xs" onClick={() => delTask(tk._id)}><FiTrash2 size={12} /></button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Add task — only for owner */}
                  {!tk && owned && (
                    <div style={{ padding: '10px 20px', borderTop: '1px solid #f3f4f6' }}>
                      <AddTask sessionId={s._id} courseId={courseId} onDone={loadSessions} />
                    </div>
                  )}

                  {/* Discussion Forum Toggle */}
                  <div style={{ padding: '10px 20px', borderTop: '1px solid #f3f4f6', background: '#faf9ff' }}>
                    <SessionDiscussionToggle courseId={courseId} sessionId={s._id} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
