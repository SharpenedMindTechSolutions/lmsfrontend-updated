import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/tutor/AuthContext';
import { courseAPI, enrollmentAPI, studentAPI } from '../../../services/tutor/api';
import { FiBook, FiUsers, FiBarChart2, FiPlus, FiArrowRight, FiActivity } from 'react-icons/fi';

function Stat({ icon:Icon, label, value, color, delay }) {
  return (
    <div className="card anim-fade-up" style={{ padding:'18px 20px', animationDelay:delay }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ minWidth:0 }}>
          <p style={{ fontSize:11, color:'#9ca3af', fontWeight:700, textTransform:'uppercase', letterSpacing:'.07em', marginBottom:6 }}>{label}</p>
          <h2 style={{ fontSize:30, color:'#4c1d95', lineHeight:1 }}>{value}</h2>
        </div>
        <div style={{ width:46, height:46, borderRadius:13, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function TutorDashboard() {
  const { tutor } = useAuth();
  const [courses,     setCourses]     = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students,    setStudents]    = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      courseAPI.getAll().then(r => setCourses(r.data.courses || [])).catch(() => {}),
      enrollmentAPI.getAll().then(r => setEnrollments(r.data.enrollments || [])).catch(() => {}),
      studentAPI.getAll().then(r => setStudents(r.data.students || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const activeEnrollments = enrollments.filter(e => e.isVerified);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Hero */}
      <div className="card anim-fade-up hero-card" style={{ marginBottom:22, background:'linear-gradient(135deg,#2e1065,#4c1d95 40%,#7c3aed 80%,#a78bfa 100%)', border:'none', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:-40, right:-30, width:160, height:160, borderRadius:'50%', background:'rgba(255,255,255,.06)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, right:80, width:120, height:120, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
        <div style={{ position:'relative' }}>
          <p style={{ color:'rgba(255,255,255,.65)', fontSize:13, marginBottom:5 }}>{greet}, {tutor?.name?.split(' ')[0]} 👋</p>
          <h1 style={{ color:'#fff', fontSize:24, marginBottom:7 }}>Your Teaching Hub</h1>
          <p style={{ color:'rgba(255,255,255,.62)', fontSize:13 }}>
            {courses.length} course{courses.length!==1?'s':''} · {students.length} student{students.length!==1?'s':''} · {enrollments.length} enrollment{enrollments.length!==1?'s':''}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:22 }}>
        <Stat icon={FiBook}      label="Courses"     value={loading?'—':courses.length}             color="#8b5cf6" delay=".04s" />
        <Stat icon={FiUsers}     label="Students"    value={loading?'—':students.length}            color="#ec4899" delay=".08s" />
        <Stat icon={FiBarChart2} label="Enrollments" value={loading?'—':enrollments.length}         color="#10b981" delay=".12s" />
        <Stat icon={FiActivity}  label="Active"      value={loading?'—':activeEnrollments.length}   color="#f59e0b" delay=".16s" />
      </div>

      {/* Two-col responsive layout */}
      <div className="tutor-dash-grid">
        {/* Courses list */}
        <div className="card" style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <h3 style={{ fontSize:18, color:'#4c1d95' }}>My Courses</h3>
            <div style={{ display:'flex', gap:10, alignItems:'center' }}>
              <Link to="/tutor/dashboard/courses/new"><button className="btn btn-primary btn-sm"><FiPlus size={13}/> New</button></Link>
              <Link to="/tutor/dashboard/courses" style={{ display:'flex', alignItems:'center', gap:4, color:'#7c3aed', fontSize:13, fontWeight:700, textDecoration:'none' }}>All <FiArrowRight size={13}/></Link>
            </div>
          </div>

          {loading ? <div style={{ display:'flex', justifyContent:'center', padding:36 }}><div className="spinner spinner-md"/></div>
          : courses.length === 0 ? (
            <div style={{ textAlign:'center', padding:'32px 16px', color:'#9ca3af' }}>
              <FiBook size={36} style={{ marginBottom:10, opacity:.3 }} />
              <p style={{ marginBottom:12 }}>No courses yet.</p>
              <Link to="/tutor/dashboard/courses/new"><button className="btn btn-primary btn-sm"><FiPlus size={13}/> Create First</button></Link>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {courses.slice(0,6).map((c, i) => (
                <div key={c._id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', border:'1.5px solid #f3f4f6', borderRadius:11, transition:'border-color .2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#c4b5fd'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#f3f4f6'}>
                  <div style={{ width:38, height:38, borderRadius:10, background:`hsl(${i*54},60%,90%)`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <FiBook size={16} color={`hsl(${i*54},55%,45%)`} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.title}</p>
                    <p style={{ fontSize:11, color:'#9ca3af' }}>{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link to={`/tutor/dashboard/courses/${c._id}`}><button className="btn btn-outline btn-xs">Manage</button></Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent students */}
        <div className="card" style={{ padding:'20px 22px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ fontSize:18, color:'#4c1d95' }}>Students</h3>
            <Link to="/tutor/dashboard/students" style={{ color:'#7c3aed', fontSize:13, fontWeight:700, textDecoration:'none' }}>View All</Link>
          </div>
          {loading ? <div style={{ display:'flex', justifyContent:'center', padding:28 }}><div className="spinner spinner-sm"/></div>
          : students.length === 0 ? (
            <p style={{ fontSize:13, color:'#9ca3af', padding:'14px 0' }}>No registered students yet.</p>
          ) : (
            students.slice(0, 8).map(s => {
              const name  = s?.name  || 'Student';
              const email = s?.email || '';
              return (
                <div key={s._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #f3f4f6' }}>
                  <div className="avatar" style={{ width:34, height:34, fontSize:12, flexShrink:0 }}>
                    {name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:13, fontWeight:600, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</p>
                    {email && <p style={{ fontSize:11, color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{email}</p>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
