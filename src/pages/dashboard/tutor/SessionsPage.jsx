import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseAPI, sessionAPI, testAPI } from '../../../services/tutor/api';
import { FiList, FiPlay, FiArrowRight, FiBook, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SessionsPage() {
  const [courses,    setCourses]    = useState([]);
  const [sessionMap, setSessionMap] = useState({});
  const [testMap,    setTestMap]    = useState({});
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cr = await courseAPI.getAll();
        const list = cr.data.courses || [];
        setCourses(list);

        const sMap = {}, tMap = {};
        await Promise.all(list.map(async c => {
          try {
            const sr = await sessionAPI.byCourse(c._id);
            const sessions = sr.data.sessions || [];
            sMap[c._id] = sessions;
            await Promise.all(sessions.map(async s => {
              try { const tr = await testAPI.bySession(s._id); tMap[s._id] = tr.data.test || tr.data; }
              catch { tMap[s._id] = null; }
            }));
          } catch { sMap[c._id] = []; }
        }));
        setSessionMap(sMap);
        setTestMap(tMap);
      } catch { toast.error('Failed to load sessions'); }
      finally { setLoading(false); }
    })();
  }, []);

  const totalSessions = Object.values(sessionMap).flat().length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-md" /></div>;

  return (
    <div>
      <div className="anim-fade-up" style={{ marginBottom: 26 }}>
        <h2 style={{ fontSize: 26, color: '#4c1d95', marginBottom: 4 }}>All Sessions</h2>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          {totalSessions} session{totalSessions !== 1 ? 's' : ''} across {courses.length} course{courses.length !== 1 ? 's' : ''}
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <FiList size={44} style={{ marginBottom: 14, opacity: .3 }} />
          <p>No courses or sessions yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {courses.map((c, ci) => {
            const sessions = sessionMap[c._id] || [];
            return (
              <div key={c._id} className="card anim-fade-up" style={{ padding: '22px 26px', animationDelay: `${ci * .07}s` }}>
                {/* Course header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#ede9fe,#c4b5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FiBook size={21} color="#7c3aed" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1f2937', marginBottom: 3 }}>{c.title}</h3>
                      <p style={{ fontSize: 12, color: '#9ca3af' }}>{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Link to={`/tutor/dashboard/courses/${c._id}`}>
                    <button className="btn btn-outline btn-sm">Manage <FiArrowRight size={13} /></button>
                  </Link>
                </div>

                {/* Sessions list */}
                {sessions.length === 0 ? (
                  <div style={{ padding: '18px', textAlign: 'center', color: '#9ca3af', background: '#faf9ff', borderRadius: 11, border: '1.5px dashed #e5e7eb' }}>
                    <p style={{ fontSize: 13 }}>No sessions yet.{' '}
                      <Link to={`/tutor/dashboard/courses/${c._id}`} style={{ color: '#7c3aed', fontWeight: 600, textDecoration: 'none' }}>Add sessions →</Link>
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {sessions.map((s, si) => {
                      const hasTest = !!testMap[s._id];
                      return (
                        <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#faf9ff', borderRadius: 11, border: '1px solid #f3f4f6', transition: 'border-color .2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = '#c4b5fd'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = '#f3f4f6'}>
                          {/* Session number badge */}
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {si + 1}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{s.sessionTitle}</p>
                            <p style={{ fontSize: 12, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.videoTitle}</p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            {hasTest
                              ? <span className="badge badge-ok" style={{ fontSize: 11 }}><FiHelpCircle size={11} /> Test ✓</span>
                              : <span className="badge badge-warn" style={{ fontSize: 11 }}>No Test</span>}
                            <a href={s.videoDriveLink} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#7c3aed', textDecoration: 'none', fontWeight: 600 }}>
                              <FiPlay size={13} /> Video
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
