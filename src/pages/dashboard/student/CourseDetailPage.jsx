import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../../services/student/api';
import { FiArrowLeft, FiPlay, FiBook, FiUser, FiList } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import EnrollmentGate from '../../../components/student/EnrollmentGate';
import CertificateGenerator from '../../../components/certificate/CertificateGenerator';

function CourseContent({ courseId, course }) {
  const nav = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New state for combo logic
  const [bundledCourses, setBundledCourses] = useState([]);
  const [bundledSessionsMap, setBundledSessionsMap] = useState({});
  const [bundledProgressMap, setBundledProgressMap] = useState({});

  useEffect(() => {
    import('../../../services/student/api').then(({ sessionAPI, courseAPI, progressAPI }) => {
      if (course.isComboOffer) {
        // Fetch all courses and filter for bundled ones
        courseAPI.getAll().then(async cr => {
          const all = cr.data.courses || [];
          const bundled = all.filter(c => (course.bundledCourses || []).includes(c._id));
          setBundledCourses(bundled);

          // Get session counts and progress for each bundled course
          const sMap = {};
          const pMap = {};
          await Promise.all(bundled.map(async b => {
            try {
              const res = await sessionAPI.byCourse(b._id);
              sMap[b._id] = res.data.sessions?.length || 0;
            } catch (e) {
              sMap[b._id] = 0;
            }
            try {
              const pr = await progressAPI.mine(b._id);
              pMap[b._id] = pr.data.progress;
            } catch (e) {
              pMap[b._id] = null;
            }
          }));
          setBundledSessionsMap(sMap);
          setBundledProgressMap(pMap);
        })
        .catch(() => toast.error('Failed to load bundled courses'))
        .finally(() => setLoading(false));
      } else {
        // Normal course logic: just fetch sessions
        sessionAPI.byCourse(courseId)
          .then(r => setSessions(r.data.sessions || []))
          .catch(() => toast.error('Failed to load sessions'))
          .finally(() => setLoading(false));
      }
    });
  }, [courseId, course]);

  return (
    <div>
      <button className="btn btn-ghost back-link" onClick={() => nav(-1)} style={{ marginBottom:18, padding:'6px 0', gap:6 }}>
        <FiArrowLeft size={16} /> Back to Courses
      </button>

      {/* Hero */}
      <div className="card anim-fade-up" style={{ marginBottom:20, background:'linear-gradient(135deg,#2e1065 0%,#4c1d95 40%,#7c3aed 100%)', border:'none', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,.06)' }} />
        <div style={{ position:'absolute', bottom:-50, right:40, width:130, height:130, borderRadius:'50%', background:'rgba(255,255,255,.04)' }} />
        <div className="course-hero-inner">
          <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.15)', padding:'4px 12px', borderRadius:99, marginBottom:14 }}>
            <FiBook size={11} color="white" />
            <span style={{ color:'white', fontSize:11, fontWeight:600 }}>{course.isComboOffer ? 'Combo Offer' : 'Course'}</span>
          </div>
          <h1 style={{ color:'#fff', fontSize:24, marginBottom:9, maxWidth:560 }}>{course.title}</h1>
          <p style={{ color:'rgba(255,255,255,.68)', fontSize:13, lineHeight:1.65, marginBottom:18, maxWidth:520 }}>{course.description}</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:16 }}>
            {[
              { icon:FiUser, val: course.tutorId?.name || 'Instructor', label:'Instructor' },
              { icon:FiList, val: course.isComboOffer ? `${bundledCourses.length} Courses` : `${sessions.length} Sessions`, label:'Content' },
            ].map(({ icon:Icon, val, label }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                <Icon size={13} color="rgba(255,255,255,.6)" />
                <span style={{ color:'rgba(255,255,255,.75)', fontSize:12 }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CertificateGenerator courseId={courseId} />

      {/* Content list */}
      <div className="card anim-fade-up" style={{ padding:'20px 22px', animationDelay:'.1s' }}>
        <h3 style={{ fontSize:18, color:'#4c1d95', marginBottom:16 }}>
          {course.isComboOffer ? (
            <>🎁 Courses Included in This Combo <span style={{ fontSize:13, color:'#9ca3af', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:400 }}>({bundledCourses.length})</span></>
          ) : (
            <>Sessions <span style={{ fontSize:13, color:'#9ca3af', fontFamily:'Plus Jakarta Sans,sans-serif', fontWeight:400 }}>({sessions.length})</span></>
          )}
        </h3>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding:36 }}><div className="spinner spinner-md" /></div>
        ) : course.isComboOffer ? (
          // RENDER BUNDLED COURSES
          bundledCourses.length === 0 ? (
            <div style={{ textAlign:'center', padding:'36px 16px', color:'#9ca3af' }}>
              <FiBook size={36} style={{ marginBottom:10, opacity:.3 }} />
              <p>No courses added to this combo yet.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {bundledCourses.map((c) => {
                const p = bundledProgressMap[c._id];
                const pct = p ? Math.round((p.completedSessions?.length / (p.totalSessions || 1)) * 100) : 0;
                const done = p?.completionStatus === 'completed';
                
                return (
                  <div key={c._id} className="card-hover" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px', border:'1.5px solid #ede9fe', borderRadius:12, background:'white', transition:'all .2s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{ width:42, height:42, borderRadius:10, background:'linear-gradient(135deg,#ede9fe,#c4b5fd)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <FiBook size={20} color="#7c3aed" />
                      </div>
                      <div>
                        <h4 style={{ fontSize:15, fontWeight:700, color:'#1f2937', marginBottom:4 }}>{c.title}</h4>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <p style={{ fontSize:12, color:'#6b7280' }}>Sessions: {bundledSessionsMap[c._id] || 0}</p>
                          <span style={{ fontSize: 10, color: '#d1d5db' }}>|</span>
                          {done ? (
                            <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>✓ Completed</span>
                          ) : (
                            <span style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>Progress: {pct}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link to={`/dashboard/courses/${c._id}`} style={{ textDecoration:'none' }}>
                      <button className="btn btn-primary btn-sm">Continue Learning</button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // RENDER NORMAL SESSIONS
          sessions.length === 0 ? (
            <div style={{ textAlign:'center', padding:'36px 16px', color:'#9ca3af' }}>
              <FiPlay size={36} style={{ marginBottom:10, opacity:.3 }} />
              <p>No sessions added yet.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {sessions.map((s, i) => (
                <Link key={s._id} to={`/dashboard/learn/${s._id}`} style={{ textDecoration:'none' }}>
                  <div className="card-hover" style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 14px', border:'1.5px solid #ede9fe', borderRadius:12, background:'white', transition:'all .2s', cursor:'pointer', flexWrap:'wrap' }}>
                    <div style={{ width:38, height:38, borderRadius:'50%', background:'linear-gradient(135deg,#8b5cf6,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700, color:'#fff', flexShrink:0 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontSize:13, fontWeight:600, color:'#1f2937', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.sessionTitle}</p>
                      <p style={{ fontSize:11, color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.videoTitle}</p>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      <span className="badge badge-lav" style={{ fontSize:11 }}>Session {i + 1}</span>
                      <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#8b5cf6,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <FiPlay size={13} color="white" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    courseAPI.getById(courseId)
      .then(r => setCourse(r.data.course))
      .catch(() => toast.error('Failed to load course'))
      .finally(() => setLoading(false));
  }, [courseId]);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:80 }}>
      <div className="spinner spinner-md" />
    </div>
  );

  if (!course) return null;

  return (
    <EnrollmentGate courseId={courseId} course={course}>
      <CourseContent courseId={courseId} course={course} />
    </EnrollmentGate>
  );
}
