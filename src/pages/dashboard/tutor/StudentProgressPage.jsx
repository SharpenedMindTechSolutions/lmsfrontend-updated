import { useState, useEffect } from 'react';
import { courseAPI, progressAPI, timeTrackingAPI } from '../../../services/tutor/api';
import {
  FiUsers, FiBook, FiBarChart2, FiCheckCircle, FiClock,
  FiAward, FiChevronDown, FiChevronUp, FiSearch, FiX,
  FiTrendingUp, FiTarget, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div style={{ background: bg || '#fff', border: '1px solid #ede9fe', borderRadius: 14, padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={20} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 22, fontWeight: 800, color: '#1a0e35', margin: 0, lineHeight: 1.1 }}>{value}</p>
        <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Score badge ── */
function ScoreBadge({ score }) {
  if (score == null) return <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const bg    = score >= 80 ? '#f0fdf4' : score >= 60 ? '#fffbeb' : '#fef2f2';
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}30`, borderRadius: 20, padding: '3px 10px', fontSize: 13, fontWeight: 700 }}>
      {score}%
    </span>
  );
}

/* ── Progress bar ── */
function ProgressBar({ value, total, color = '#7c3aed' }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap', minWidth: 40, textAlign: 'right' }}>
        {value}/{total}
      </span>
    </div>
  );
}

/* ── Student row with expandable test scores ── */
function StudentRow({ student, totalSessions, timeSpent, index }) {
  const [expanded, setExpanded] = useState(false);

  const completionPct = totalSessions > 0
    ? Math.round((student.completedSessions / totalSessions) * 100)
    : 0;

  const statusColor = student.completionStatus === 'completed' ? '#10b981' : '#f59e0b';
  const statusBg    = student.completionStatus === 'completed' ? '#f0fdf4' : '#fffbeb';

  return (
    <>
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{ cursor: 'pointer', background: expanded ? '#faf5ff' : 'transparent', transition: 'background .15s' }}
      >
        <td style={{ color: '#9ca3af', fontSize: 13 }}>{index + 1}</td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 14
            }}>
              {student.student?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: '#1f2937', margin: 0, fontSize: 14 }}>{student.student?.name || 'Unknown'}</p>
              <p style={{ color: '#9ca3af', margin: 0, fontSize: 12 }}>{student.student?.email || ''}</p>
            </div>
          </div>
        </td>
        <td>
          <ProgressBar value={student.completedSessions} total={totalSessions} color={completionPct === 100 ? '#10b981' : '#7c3aed'} />
        </td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#0284c7', fontSize: 13, fontWeight: 700 }}>
            <FiClock size={14} />
            <span>{timeSpent || '0m'}</span>
          </div>
        </td>
        <td><ScoreBadge score={student.overallScore || null} /></td>
        <td>
          <span style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}30`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
            {student.completionStatus === 'completed' ? '✅ Completed' : '🔄 In Progress'}
          </span>
        </td>
        <td style={{ textAlign: 'center' }}>
          <span style={{ color: '#7c3aed', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
            {student.testScores?.length || 0} test{student.testScores?.length !== 1 ? 's' : ''}
            {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </span>
        </td>
      </tr>

      {/* Expandable test scores */}
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0 }}>
            <div style={{ background: '#faf5ff', borderTop: '1px solid #ede9fe', padding: '14px 20px 14px 68px' }}>
              {student.testScores?.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 10 }}>
                  {student.testScores.map((ts, i) => (
                    <div key={i} style={{ background: '#fff', border: '1px solid #ede9fe', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: '#4b5563', fontWeight: 500 }}>
                        📝 {ts.sessionId?.sessionTitle || `Session ${i + 1}`}
                      </span>
                      <ScoreBadge score={ts.score} />
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#9ca3af', margin: 0, fontSize: 13 }}>No tests taken yet.</p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ── Mobile student card ── */
function StudentCard({ student, totalSessions, timeSpent, index }) {
  const [expanded, setExpanded] = useState(false);
  const completionPct = totalSessions > 0
    ? Math.round((student.completedSessions / totalSessions) * 100)
    : 0;

  return (
    <div style={{ border: '1px solid #ede9fe', borderRadius: 14, marginBottom: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: '14px 16px', cursor: 'pointer', background: expanded ? '#faf5ff' : '#fff' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
            {student.student?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, color: '#1f2937', fontSize: 14, margin: 0 }}>{student.student?.name || 'Unknown'}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.student?.email}</p>
          </div>
          <ScoreBadge score={student.overallScore || null} />
        </div>

        <ProgressBar value={student.completedSessions} total={totalSessions} color={completionPct === 100 ? '#10b981' : '#7c3aed'} />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          <span>{completionPct}% complete · ⏱️ {timeSpent || '0m'}</span>
          <span style={{ color: '#7c3aed', fontWeight: 600 }}>
            {student.testScores?.length || 0} tests {expanded ? <FiChevronUp size={11} style={{ verticalAlign: 'middle' }} /> : <FiChevronDown size={11} style={{ verticalAlign: 'middle' }} />}
          </span>
        </div>
      </div>

      {expanded && student.testScores?.length > 0 && (
        <div style={{ borderTop: '1px solid #ede9fe', padding: '12px 14px', background: '#faf5ff' }}>
          {student.testScores.map((ts, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < student.testScores.length - 1 ? '1px solid #f3e8ff' : 'none' }}>
              <span style={{ fontSize: 12, color: '#4b5563' }}>📝 {ts.sessionId?.sessionTitle || `Session ${i + 1}`}</span>
              <ScoreBadge score={ts.score} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ── */
export default function StudentProgressPage() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [progressData, setProgressData] = useState(null);
  const [timeData, setTimeData] = useState({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name'); // name | score | progress

  // Load tutor's courses on mount
  useEffect(() => {
    courseAPI.getAll()
      .then(r => {
        const all = r.data.courses || [];
        setCourses(all);
        if (all.length > 0) setSelectedCourse(all[0]._id);
      })
      .catch(() => toast.error('Failed to load courses'))
      .finally(() => setLoadingCourses(false));
  }, []);

  // Load progress & time when course changes
  useEffect(() => {
    if (!selectedCourse) return;
    setLoadingProgress(true);
    setProgressData(null);
    setTimeData({});

    Promise.all([
      progressAPI.courseStudents(selectedCourse).catch(() => ({ data: null })),
      timeTrackingAPI.courseTime(selectedCourse).catch(() => ({ data: null }))
    ])
      .then(([progRes, timeRes]) => {
        if (progRes.data) setProgressData(progRes.data);
        if (timeRes.data?.studentTimes) {
          const map = {};
          timeRes.data.studentTimes.forEach(st => {
            map[st.studentId] = st.formattedTime;
          });
          setTimeData(map);
        }
      })
      .catch(() => toast.error('Failed to load student progress'))
      .finally(() => setLoadingProgress(false));
  }, [selectedCourse]);

  const students = progressData?.students || [];
  const totalSessions = students[0]?.totalSessions ?? 0;

  // Filter + sort
  const filtered = students
    .filter(s =>
      s.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.student?.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return (b.overallScore || 0) - (a.overallScore || 0);
      if (sortBy === 'progress') return (b.completedSessions || 0) - (a.completedSessions || 0);
      return (a.student?.name || '').localeCompare(b.student?.name || '');
    });

  // Aggregate stats
  const completedCount = students.filter(s => s.completionStatus === 'completed').length;
  const avgScore = students.length
    ? Math.round(students.reduce((s, x) => s + (x.overallScore || 0), 0) / students.length)
    : 0;
  const avgProgress = students.length && totalSessions > 0
    ? Math.round(students.reduce((s, x) => s + (x.completedSessions || 0), 0) / students.length / totalSessions * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div className="anim-fade-up">
          <h2 style={{ fontSize: 26, color: '#4c1d95', marginBottom: 4 }}>Student Progress & Analytics</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>Track learning progress, video completions, active study time, and test scores for each student.</p>
        </div>
      </div>

      {/* Course selector */}
      <div className="card anim-fade-up" style={{ padding: '16px 20px', marginBottom: 20, animationDelay: '.04s' }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#4c1d95', marginBottom: 8, display: 'block' }}>
          <FiBook size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Select Course
        </label>
        {loadingCourses ? (
          <div className="spinner spinner-sm" />
        ) : courses.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No courses found. Create a course first.</p>
        ) : (
          <select
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            style={{ maxWidth: 480 }}
          >
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.title || c.courseName}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stats overview */}
      {progressData && (
        <div className="anim-fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 14, marginBottom: 22, animationDelay: '.08s' }}>
          <StatCard icon={FiUsers} label="Enrolled Students" value={progressData.totalEnrolled || 0} color="#7c3aed" />
          <StatCard icon={FiCheckCircle} label="Fully Completed" value={completedCount} color="#10b981" />
          <StatCard icon={FiTarget} label="Avg. Test Score" value={`${avgScore}%`} color="#f59e0b" />
          <StatCard icon={FiTrendingUp} label="Avg. Progress" value={`${avgProgress}%`} color="#3b82f6" />
        </div>
      )}

      {/* Search + sort */}
      {progressData && students.length > 0 && (
        <div className="anim-fade-up" style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', animationDelay: '.12s' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 380 }}>
            <FiSearch style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#a78bfa', pointerEvents: 'none' }} size={15} />
            <input
              style={{ paddingLeft: 38 }}
              placeholder="Search by name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <span onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9ca3af' }}>
                <FiX size={14} />
              </span>
            )}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ minWidth: 160 }}>
            <option value="name">Sort: Name</option>
            <option value="score">Sort: Top Score</option>
            <option value="progress">Sort: Most Progress</option>
          </select>
        </div>
      )}

      {/* Main content */}
      {loadingProgress ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner spinner-md" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#6b7280' }}>Loading student progress…</p>
        </div>
      ) : !progressData ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FiBarChart2 size={44} style={{ marginBottom: 14, opacity: .3, color: '#7c3aed' }} />
          <p style={{ color: '#9ca3af', fontSize: 16 }}>Select a course to view progress.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <FiUsers size={44} style={{ marginBottom: 14, opacity: .3, color: '#7c3aed' }} />
          <p style={{ fontSize: 16, color: '#6b7280', marginBottom: 6 }}>No students enrolled yet.</p>
          <p style={{ fontSize: 13, color: '#9ca3af' }}>Share enrollment codes with your students to get started.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <FiAlertCircle size={32} style={{ marginBottom: 10, opacity: .4, color: '#7c3aed' }} />
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No students match your search.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card anim-fade-up hide-mob" style={{ padding: 0, overflow: 'hidden', animationDelay: '.14s' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Student</th>
                    <th style={{ minWidth: 160 }}>Video Progress</th>
                    <th>Time Spent</th>
                    <th>Avg. Score</th>
                    <th>Status</th>
                    <th>Tests</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <StudentRow
                      key={s.student?._id || i}
                      student={s}
                      totalSessions={totalSessions}
                      timeSpent={timeData[s.student?._id]}
                      index={i}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 20px', borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#9ca3af' }}>
              Showing {filtered.length} of {students.length} students · {totalSessions} total session{totalSessions !== 1 ? 's' : ''} · Click a row to expand test scores
            </div>
          </div>

          {/* Mobile cards */}
          <div className="show-mob anim-fade-up" style={{ animationDelay: '.14s' }}>
            {filtered.map((s, i) => (
              <StudentCard
                key={s.student?._id || i}
                student={s}
                totalSessions={totalSessions}
                timeSpent={timeData[s.student?._id]}
                index={i}
              />
            ))}
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
              {filtered.length} student{filtered.length !== 1 ? 's' : ''} · {totalSessions} session{totalSessions !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}

      <style>{`
        @media (min-width: 769px) { .show-mob { display: none !important; } }
        @media (max-width: 768px) { .hide-mob { display: none !important; } }
      `}</style>
    </div>
  );
}
