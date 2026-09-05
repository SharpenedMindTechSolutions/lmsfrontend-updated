import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/student/AuthContext';
import { courseAPI, enrollmentAPI, progressAPI, sessionAPI, gamificationAPI, timeTrackingAPI } from '../../../services/student/api';
import StreakFlameWidget from '../../../components/gamification/StreakFlameWidget';
import XPProgressCard from '../../../components/gamification/XPProgressCard';
import ActivityCalendar from '../../../components/gamification/ActivityCalendar';
import TimeSpentCard from '../../../components/timeTracker/TimeSpentCard';
import { FiBook, FiPlay, FiTrendingUp, FiAward, FiArrowRight, FiZap, FiCode, FiClock } from 'react-icons/fi';

function StatCard({ icon: Icon, label, value, color, delay, sub }) {
  return (
    <div className="card anim-fade-up" style={{ padding: '18px 20px', animationDelay: delay }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>{label}</p>
          <h2 style={{ fontSize: 26, color: '#4c1d95', lineHeight: 1 }}>{value}</h2>
          {sub && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 5 }}>{sub}</p>}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color="white" />
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, index }) {
  const colors = [
    'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    'linear-gradient(135deg,#ec4899,#be185d)',
    'linear-gradient(135deg,#10b981,#047857)',
    'linear-gradient(135deg,#f59e0b,#b45309)',
    'linear-gradient(135deg,#3b82f6,#1d4ed8)',
    'linear-gradient(135deg,#ef4444,#b91c1c)',
  ];
  const bg = colors[index % colors.length];
  return (
    <Link to={`/dashboard/courses/${course._id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover anim-fade-up" style={{ overflow: 'hidden', animationDelay: `${index * 0.07}s`, height: '100%' }}>
        <div style={{ height: 80, background: bg, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', bottom: -18, right: -10, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
          <div style={{ position: 'absolute', top: -12, left: -10, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.08)' }} />
        </div>
        <div style={{ padding: '16px 18px' }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1f2937', marginBottom: 6, fontFamily: 'Plus Jakarta Sans,sans-serif', lineHeight: 1.3 }}>{course.title}</h4>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.55, marginBottom: 12 }}>{course.description?.slice(0, 75)}{course.description?.length > 75 ? '…' : ''}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>by {course.tutorId?.name || 'Instructor'}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#7c3aed', fontWeight: 600 }}>
              View <FiArrowRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardHome() {
  const { student } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrolledCount, setEnrolledCount] = useState(null);
  const [sessionCount, setSessionCount] = useState(null);
  const [avgScore, setAvgScore] = useState(null);
  const [gameStats, setGameStats] = useState(null);
  const [timeStats, setTimeStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    (async () => {
      try {
        const [cr, gameRes, timeRes] = await Promise.all([
          courseAPI.getAll().catch(() => ({ data: { courses: [] } })),
          gamificationAPI.myStats().catch(() => ({ data: null })),
          timeTrackingAPI.myTime().catch(() => ({ data: null }))
        ]);

        const allCourses = cr.data.courses || [];
        setCourses(allCourses);
        if (gameRes.data) setGameStats(gameRes.data);
        if (timeRes.data) setTimeStats(timeRes.data);

        const enrolledCourses = [];
        await Promise.all(allCourses.map(async c => {
          try {
            const ec = await enrollmentAPI.check(c._id);
            if (ec.data?.verified) enrolledCourses.push(c);
          } catch { /* not enrolled */ }
        }));
        setEnrolledCount(enrolledCourses.length);

        let totalSessions = 0;
        const scores = [];
        await Promise.all(enrolledCourses.map(async c => {
          try { const sr = await sessionAPI.byCourse(c._id); totalSessions += (sr.data.sessions || []).length; } catch {}
          try { const pr = await progressAPI.mine(c._id); const p = pr.data.progress; if (p?.overallScore > 0) scores.push(p.overallScore); } catch {}
        }));
        setSessionCount(totalSessions);
        setAvgScore(scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      {/* Hero Greeting & Daily Game Callout */}
      <div
        className="card anim-fade-up hero-card"
        style={{
          marginBottom: 22,
          background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #7c3aed 80%, #a78bfa 100%)',
          border: 'none',
          overflow: 'hidden',
          position: 'relative',
          padding: '24px 28px'
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.07)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -40, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,.7)', fontSize: 13, marginBottom: 4 }}>{greet} 👋</p>
            <h1 style={{ color: '#fff', fontSize: 24, marginBottom: 6 }}>{student?.name?.split(' ')[0]}, ready to level up?</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <p style={{ color: 'rgba(255,255,255,.65)', fontSize: 13, margin: 0, maxWidth: 480 }}>
                {gameStats?.currentStreak > 0 ? `🔥 You're on a ${gameStats.currentStreak}-day streak!` : 'Start your daily learning streak today with the coding arena!'}
              </p>
            </div>
          </div>

          <Link to="/dashboard/daily-game" style={{ textDecoration: 'none' }}>
            <button
              className="btn"
              style={{
                background: '#ffffff',
                color: '#4c1d95',
                fontWeight: 800,
                padding: '10px 18px',
                borderRadius: 12,
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
            >
              <FiCode size={16} /> Play Daily Code Game <FiArrowRight size={14} />
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard
          icon={FiZap}
          label="Streak"
          value={loading || !gameStats ? '—' : `🔥 ${gameStats.currentStreak}`}
          color="#f97316"
          delay=".04s"
          sub={gameStats?.isTodayActive ? 'Active today ✅' : 'Play to extend'}
        />
        <StatCard
          icon={FiAward}
          label="Total XP"
          value={loading || !gameStats ? '—' : `${gameStats.totalXP} XP`}
          color="#8b5cf6"
          delay=".08s"
          sub={gameStats ? `Level ${gameStats.level}` : ''}
        />
        <StatCard
          icon={FiClock}
          label="Today's Time"
          value={loading || !timeStats ? '—' : timeStats.formattedToday || '0m'}
          color="#0284c7"
          delay=".12s"
          sub="Active study"
        />
        <StatCard
          icon={FiBook}
          label="Courses"
          value={loading ? '—' : courses.length}
          color="#10b981"
          delay=".16s"
          sub={enrolledCount ? `${enrolledCount} enrolled` : 'Available'}
        />
      </div>

      {/* Interactive 2-Column Gamification & Time Tracking Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <XPProgressCard
            totalXP={gameStats?.totalXP || 0}
            level={gameStats?.level || 1}
            levelProgressXP={gameStats?.levelProgressXP || 0}
          />
          <ActivityCalendar heatmap={gameStats?.calendarHeatmap || {}} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <TimeSpentCard
            todaySeconds={timeStats?.todaySeconds || 0}
            allTimeSeconds={timeStats?.allTimeSeconds || 0}
            weeklySummary={timeStats?.weeklySummary || []}
          />

          {/* Daily Challenge Banner Card */}
          <div className="card anim-fade-up" style={{ padding: '20px 22px', background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', border: '1.5px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 24 }}>🎯</span>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Daily Code Challenge</h4>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Solve today's question for +25 XP</p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#475569', marginBottom: 14 }}>
              Fill in the blanks, spot bugs, and solve code puzzles in Python, JavaScript, HTML, and SQL!
            </p>
            <Link to="/dashboard/daily-game" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                <FiPlay size={13} /> Start Challenge Now
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="section-gap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 20, color: '#4c1d95' }}>Available Courses</h3>
          <Link to="/dashboard/courses" style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#7c3aed', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            View all <FiArrowRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><div className="spinner spinner-md" /></div>
        ) : courses.length === 0 ? (
          <div className="card" style={{ padding: 50, textAlign: 'center', color: '#9ca3af' }}>
            <FiBook size={40} style={{ marginBottom: 12, opacity: .3 }} />
            <p>No courses available yet.</p>
          </div>
        ) : (
          <div className="courses-grid">
            {courses.slice(0, 6).map((c, i) => <CourseCard key={c._id} course={c} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
