import { useState, useEffect } from 'react';
import { courseAPI, progressAPI } from '../../../services/student/api';
import { FiTrendingUp, FiBook, FiCheckCircle, FiAward, FiTarget } from 'react-icons/fi';

export default function ProgressPage() {
  const [courses, setCourses]   = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      const cr = await courseAPI.getAll().catch(() => ({ data: { courses: [] } }));
      const list = cr.data.courses || [];
      setCourses(list);
      const map = {};
      await Promise.all(list.map(async c => {
        try { const pr = await progressAPI.mine(c._id); map[c._id] = pr.data.progress; }
        catch { map[c._id] = null; }
      }));
      setProgress(map);
      setLoading(false);
    })();
  }, []);

  const enrolled = courses.filter(c => progress[c._id]);
  const overallAvg = enrolled.length
    ? Math.round(enrolled.reduce((s, c) => s + (progress[c._id]?.overallScore || 0), 0) / enrolled.length)
    : 0;

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:80 }}><div className="spinner spinner-md" /></div>;

  return (
    <div>
      <div className="anim-fade-up section-gap">
        <h2 style={{ fontSize:24, color:'#4c1d95', marginBottom:5 }}>Progress Tracker</h2>
        <p style={{ color:'#6b7280', fontSize:14 }}>Your learning journey at a glance</p>
      </div>

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        {[
          { icon:FiBook,        label:'Enrolled',    val: enrolled.length, color:'#8b5cf6' },
          { icon:FiCheckCircle, label:'Completed',   val: enrolled.filter(c => progress[c._id]?.completionStatus === 'completed').length, color:'#10b981' },
          { icon:FiAward,       label:'Avg Score',   val: `${overallAvg}%`, color:'#f59e0b' },
          { icon:FiTarget,      label:'In Progress', val: enrolled.filter(c => progress[c._id]?.completionStatus === 'in-progress').length, color:'#ec4899' },
        ].map(({ icon:Icon, label, val, color }, i) => (
          <div key={label} className="card anim-fade-up" style={{ padding:'18px 20px', animationDelay:`${i*.06}s` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:11, color:'#9ca3af', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{label}</p>
                <p style={{ fontSize:26, fontWeight:700, color:'#4c1d95', fontFamily:'Cormorant Garamond,serif' }}>{val}</p>
              </div>
              <div style={{ width:42, height:42, borderRadius:12, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={20} color={color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-course progress */}
      {enrolled.length === 0 ? (
        <div className="card" style={{ padding:50, textAlign:'center', color:'#9ca3af' }}>
          <FiTrendingUp size={40} style={{ marginBottom:12, opacity:.3 }} />
          <p>Enroll in courses to track your progress here.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {enrolled.map((c, i) => {
            const p = progress[c._id];
            const pct = Math.round(((p?.completedSessions?.length || 0) / (p?.totalSessions || 1)) * 100);
            const done = p?.completionStatus === 'completed';
            return (
              <div key={c._id} className="card anim-fade-up" style={{ padding:'20px 22px', animationDelay:`${i*.07}s` }}>
                <div className="progress-card-inner">
                  <div style={{ display:'flex', gap:12, alignItems:'center', flex:1, minWidth:0 }}>
                    <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#ede9fe,#c4b5fd)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <FiBook size={20} color="#7c3aed" />
                    </div>
                    <div style={{ minWidth:0 }}>
                      <h4 style={{ fontSize:14, fontWeight:700, color:'#1f2937', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</h4>
                      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontSize:12, color:'#9ca3af' }}>
                          {p?.completedSessions?.length || 0} / {p?.totalSessions || 0} sessions
                        </span>
                        <span className={`badge ${done ? 'badge-ok' : 'badge-warn'}`} style={{ fontSize:11 }}>
                          {done ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize:28, fontWeight:700, color: done ? '#059669' : '#7c3aed', fontFamily:'Cormorant Garamond,serif', lineHeight:1 }}>{pct}%</p>
                    {p?.overallScore > 0 && <p style={{ fontSize:11, color:'#9ca3af' }}>Score: {p.overallScore}%</p>}
                  </div>
                </div>
                <div className="progress-wrap">
                  <div className={`progress-fill${done ? ' ok' : ''}`} style={{ width:`${pct}%` }} />
                </div>
                {p?.testScores?.length > 0 && (
                  <div style={{ marginTop:12, display:'flex', gap:8, flexWrap:'wrap' }}>
                    {p.testScores.map((ts, ti) => (
                      <div key={ti} style={{ padding:'4px 10px', borderRadius:7, background:'#f5f3ff', border:'1px solid #ddd6fe' }}>
                        <span style={{ fontSize:11, color:'#6b7280' }}>{ts.sessionId?.sessionTitle || `Session ${ti+1}`}: </span>
                        <span style={{ fontSize:11, fontWeight:700, color:'#7c3aed' }}>{ts.score}%</span>
                      </div>
                    ))}
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
