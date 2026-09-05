import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI, enrollmentAPI, progressAPI } from '../../../services/student/api';
import { FiBook, FiArrowRight, FiCheckCircle, FiClock, FiKey, FiX, FiRefreshCw, FiPackage } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function MyCoursesPage() {
  const [enrolled, setEnrolled]     = useState([]);
  const [myComboCourses, setMyComboCourses] = useState([]);
  const [myIndividualCourses, setMyIndividualCourses] = useState([]);
  const [progress, setProgress]     = useState({});
  const [loading, setLoading]       = useState(true);
  const [enrollModal, setEnrollModal] = useState(false);
  const [allCourses, setAllCourses] = useState([]);
  const [form, setForm]             = useState({ courseId:'', code:'' });
  const [enrolling, setEnrolling]   = useState(false);
  const [error, setError]           = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const cr = await courseAPI.getAll();
      const courses = cr.data.courses || [];
      setAllCourses(courses);

      // Check enrollment status for each course
      const enrolledList = [];
      const progressMap = {};

      await Promise.all(courses.map(async c => {
        try {
          const ec = await enrollmentAPI.check(c._id);
          if (ec.data?.verified) {
            enrolledList.push(c);
            // Get progress
            try {
              const pr = await progressAPI.mine(c._id);
              progressMap[c._id] = pr.data.progress;
            } catch { progressMap[c._id] = null; }
          }
        } catch { /* not enrolled */ }
      }));

      // Combo Course Logic
      const comboCourses = enrolledList.filter(c => c.isComboOffer === true);
      const myIndiv = enrolledList.filter(c => !c.isComboOffer);

      setEnrolled(enrolledList);
      setMyComboCourses(comboCourses);
      setMyIndividualCourses(myIndiv);
      setProgress(progressMap);
    } catch (e) {
      toast.error('Failed to load courses');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleEnroll = async e => {
    e.preventDefault();
    setError('');
    const code = form.code.trim().toUpperCase();
    if (!form.courseId) { setError('Please select a course.'); return; }
    if (!code) { setError('Please enter the enrollment code.'); return; }
    setEnrolling(true);
    try {
      const res = await enrollmentAPI.verify(form.courseId, code);
      toast.success(res.data.alreadyEnrolled ? 'Already enrolled — welcome back!' : 'Enrolled successfully! Welcome to the course.');
      setEnrollModal(false);
      setForm({ courseId:'', code:'' });
      load(); // refresh list immediately
    } catch (err) {
      const msg = err.response?.data?.message || 'Enrollment failed. Check your code and try again.';
      setError(msg);
      toast.error(msg);
    }
    setEnrolling(false);
  };

  const renderComboGrid = (coursesToRender) => {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap:20 }}>
        {coursesToRender.map((c, i) => (
          <div key={c._id} className="card card-hover anim-fade-up" style={{ overflow:'hidden', animationDelay:`${i*.07}s` }}>
            <div style={{ height:5, background:'linear-gradient(90deg,#8b5cf6,#6d28d9)' }} />
            <div style={{ padding:'22px 22px 20px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#ede9fe,#c4b5fd)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FiPackage size={21} color="#7c3aed" />
                </div>
                <div style={{ textAlign:'right' }}>
                  <span className="badge badge-lav" style={{ fontSize:11, padding:'4px 8px' }}>📦 Combo Package</span>
                </div>
              </div>

              <h4 style={{ fontSize:15, fontWeight:700, color:'#1f2937', marginBottom:6, lineHeight:1.3 }}>{c.title}</h4>
              <p style={{ fontSize:13, color:'#6b7280', marginBottom:14 }}>{c.description?.slice(0,70)}{c.description?.length > 70 ? '…' : ''}</p>

              <div style={{ display:'flex', gap:14, marginBottom:16, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <FiBook size={13} color="#8b5cf6" />
                  <span style={{ fontSize:12, color:'#6b7280' }}>{c.bundledCourses?.length || 0} Courses Included</span>
                </div>
              </div>

              <div style={{ display:'flex', gap:8 }}>
                <Link to={`/dashboard/courses/${c._id}`} style={{ flex:1, textDecoration:'none' }}>
                  <button className="btn btn-primary btn-sm btn-full">View Combo <FiArrowRight size={13} /></button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCourseGrid = (coursesToRender) => {
    return (
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap:20 }}>
        {coursesToRender.map((c, i) => {
          const p = progress[c._id];
          const pct = p
            ? Math.round((p.completedSessions?.length / (p.totalSessions || 1)) * 100)
            : 0;
          const done = p?.completionStatus === 'completed';
          return (
            <div key={c._id} className="card card-hover anim-fade-up" style={{ overflow:'hidden', animationDelay:`${i*.07}s` }}>
              <div style={{ height:5, background:'#f3f4f6' }}>
                <div style={{ height:'100%', width:`${pct}%`, background: done ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#8b5cf6,#6d28d9)', transition:'width .8s ease', borderRadius:99 }} />
              </div>
              <div style={{ padding:'22px 22px 20px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#ede9fe,#c4b5fd)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <FiBook size={21} color="#7c3aed" />
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:26, fontWeight:700, color: done ? '#059669' : '#7c3aed', fontFamily:'Cormorant Garamond,serif' }}>{pct}%</p>
                    <p style={{ fontSize:11, color:'#9ca3af' }}>Complete</p>
                  </div>
                </div>

                <h4 style={{ fontSize:15, fontWeight:700, color:'#1f2937', marginBottom:6, lineHeight:1.3 }}>{c.title}</h4>
                <p style={{ fontSize:13, color:'#6b7280', marginBottom:14 }}>{c.description?.slice(0,70)}{c.description?.length > 70 ? '…' : ''}</p>

                <div style={{ display:'flex', gap:14, marginBottom:16, flexWrap:'wrap' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <FiCheckCircle size={13} color="#8b5cf6" />
                    <span style={{ fontSize:12, color:'#6b7280' }}>{p?.completedSessions?.length || 0} completed</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <FiClock size={13} color="#8b5cf6" />
                    <span style={{ fontSize:12, color:'#6b7280' }}>{p?.totalSessions || 0} total sessions</span>
                  </div>
                </div>

                {p?.overallScore > 0 && (
                  <div style={{ padding:'8px 12px', background:'#f5f3ff', borderRadius:9, marginBottom:14, display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, color:'#6b7280' }}>Overall Score</span>
                    <span style={{ fontSize:13, fontWeight:700, color:'#7c3aed' }}>{p.overallScore}%</span>
                  </div>
                )}

                <div style={{ display:'flex', gap:8 }}>
                  {done
                    ? <span className="badge badge-ok" style={{ flex:1, justifyContent:'center', padding:'8px' }}><FiCheckCircle size={13} /> Completed!</span>
                    : <Link to={`/dashboard/courses/${c._id}`} style={{ flex:1, textDecoration:'none' }}>
                        <button className="btn btn-primary btn-sm btn-full">Continue <FiArrowRight size={13} /></button>
                      </Link>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <div className="spinner spinner-md" />
    </div>
  );

  return (
    <div>
      <div className="anim-fade-up" style={{ marginBottom:26, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
        <div>
          <h2 style={{ fontSize:26, color:'#4c1d95', marginBottom:6 }}>My Courses</h2>
          <p style={{ color:'#6b7280', fontSize:14 }}>
            {enrolled.length} enrolled course{enrolled.length !== 1 ? 's' : ''} — keep going!
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => { setEnrollModal(true); setError(''); setForm({ courseId:'', code:'' }); }} style={{ gap:6 }}>
          <FiKey size={14} /> Enroll in Course
        </button>
      </div>

      {enrolled.length === 0 ? (
        <div className="card" style={{ padding:60, textAlign:'center', color:'#9ca3af' }}>
          <FiBook size={44} style={{ marginBottom:14, opacity:.3 }} />
          <p style={{ fontSize:16, marginBottom:8 }}>No enrolled courses yet.</p>
          <p style={{ fontSize:13, marginBottom:20 }}>Use an enrollment code from your tutor to join a course.</p>
          <button className="btn btn-primary" onClick={() => { setEnrollModal(true); setError(''); setForm({ courseId:'', code:'' }); }} style={{ gap:6 }}>
            <FiKey size={15} /> Enter Enrollment Code
          </button>
        </div>
      ) : (
        <div>
          {/* Combo Courses Section */}
          {myComboCourses.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#4c1d95', marginBottom: 16 }}>
                🎁 My Combo Offers
              </h3>
              {renderComboGrid(myComboCourses)}
            </div>
          )}

          {/* Individual Courses Section */}
          {myIndividualCourses.length > 0 && (
            <div>
              {myComboCourses.length > 0 && (
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, color: '#4c1d95', marginBottom: 16 }}>
                   My Individual Courses
                </h3>
              )}
              {renderCourseGrid(myIndividualCourses)}
            </div>
          )}
        </div>
      )}

      {/* Enroll Modal */}
      {enrollModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="card anim-scale-in" style={{ width:'100%', maxWidth:460 }}>
            <div style={{ padding:'22px 26px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ fontSize:17, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
                <FiKey size={17} color="#7c3aed" /> Enroll in a Course
              </h3>
              <button className="btn btn-ghost" onClick={() => setEnrollModal(false)} style={{ padding:6 }}><FiX size={18} /></button>
            </div>
            <form onSubmit={handleEnroll} style={{ padding:'22px 26px' }}>
              <div className="form-group">
                <label>Select Course *</label>
                <select value={form.courseId} onChange={e => { setForm(p=>({...p, courseId:e.target.value})); setError(''); }}>
                  <option value="">— Select a course —</option>
                  {allCourses.filter(c => !c.isComboOffer).map(c => (
                    <option key={c._id} value={c._id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Enrollment Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => { setForm(p=>({...p, code:e.target.value.toUpperCase()})); setError(''); }}
                  placeholder="e.g. A3F7B2C1"
                  maxLength={12}
                  style={{ fontFamily:'monospace', fontSize:18, letterSpacing:'.1em', textTransform:'uppercase', textAlign:'center' }}
                />
              </div>
              {error && (
                <div style={{ display:'flex', gap:7, padding:'10px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:9, marginBottom:14 }}>
                  <FiRefreshCw size={14} color="#ef4444" style={{ marginTop:1, flexShrink:0 }} />
                  <p style={{ fontSize:13, color:'#991b1b' }}>{error}</p>
                </div>
              )}
              <div style={{ background:'#faf5ff', border:'1px solid #ede9fe', borderRadius:9, padding:'10px 13px', marginBottom:18, fontSize:12, color:'#5b21b6', lineHeight:1.6 }}>
                Ask your tutor for the enrollment code specific to the course you want to join.
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setEnrollModal(false)} style={{ flex:1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={enrolling} style={{ flex:2 }}>
                  {enrolling ? <><span className="spinner spinner-xs" /> Verifying…</> : <><FiKey size={15} /> Enroll</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
