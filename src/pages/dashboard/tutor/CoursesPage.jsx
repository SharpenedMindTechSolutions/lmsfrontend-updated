import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseAPI } from '../../../services/tutor/api';
import { useAuth } from '../../../context/tutor/AuthContext';
import { FiPlus, FiEdit, FiTrash2, FiBook, FiList, FiLock } from 'react-icons/fi';
import toast from 'react-hot-toast';

const COLORS = ['#8b5cf6','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4'];

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tutor } = useAuth();

  const load = () => {
    courseAPI.getAll()
      .then(r => setCourses(r.data.courses || []))
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  /**
   * FIX: Only show Edit / Delete buttons for courses the logged-in tutor owns.
   * tutorId in the API response is populated as an object { _id, name, email }.
   * We compare _id against the logged-in tutor's id.
   */
  const isOwner = (course) => {
    const courseOwner = course.tutorId?._id || course.tutorId;
    return courseOwner?.toString() === tutor?._id?.toString() ||
           courseOwner?.toString() === tutor?.id?.toString();
  };

  const del = async (id, title) => {
    if (!confirm(`Delete "${title}"? This removes all sessions, tests, and enrollments.`)) return;
    try { await courseAPI.delete(id); toast.success('Course deleted'); load(); }
    catch (err) {
      const msg = err.response?.data?.message || 'Delete failed';
      toast.error(msg);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div className="anim-fade-up">
          <h2 style={{ fontSize: 26, color: '#4c1d95', marginBottom: 4 }}>Courses</h2>
          <p style={{ color: '#6b7280', fontSize: 14 }}>{courses.length} course{courses.length !== 1 ? 's' : ''} available</p>
        </div>
        <Link to="/tutor/dashboard/courses/new">
          <button className="btn btn-primary anim-fade-up" style={{ animationDelay: '.1s' }}><FiPlus size={16} /> New Course</button>
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-md" /></div>
      ) : courses.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
          <FiBook size={44} style={{ marginBottom: 14, opacity: .3 }} />
          <p style={{ marginBottom: 16, fontSize: 16 }}>No courses yet.</p>
          <Link to="/tutor/dashboard/courses/new"><button className="btn btn-primary"><FiPlus size={15} /> Create First Course</button></Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 20 }}>
          {courses.map((c, i) => {
            const owned = isOwner(c);
            return (
              <div key={c._id} className="card card-hover anim-fade-up" style={{ overflow: 'hidden', animationDelay: `${i * .06}s` }}>
                <div style={{ height: 7, background: COLORS[i % COLORS.length] }} />
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${COLORS[i % COLORS.length]}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FiBook size={21} color={COLORS[i % COLORS.length]} />
                    </div>

                    {/* Only the course owner sees Edit / Delete buttons */}
                    {owned ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/tutor/dashboard/courses/${c._id}/edit`}>
                          <button className="btn btn-outline btn-xs" title="Edit course"><FiEdit size={12} /></button>
                        </Link>
                        <button className="btn btn-danger btn-xs" title="Delete course" onClick={() => del(c._id, c.title)}>
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      /* Other tutors see a read-only lock badge */
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: '#f3f4f6', color: '#9ca3af', fontSize: 11, fontWeight: 600 }}>
                        <FiLock size={11} /> View Only
                      </div>
                    )}
                  </div>

                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1f2937', marginBottom: 7, fontFamily: 'Plus Jakarta Sans,sans-serif', lineHeight: 1.3 }}>{c.title}</h3>
                  <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55, marginBottom: 8 }}>{c.description?.slice(0, 90)}{c.description?.length > 90 ? '…' : ''}</p>

                  {/* Show tutor name for courses owned by others */}
                  {!owned && c.tutorId?.name && (
                    <p style={{ fontSize: 12, color: '#a78bfa', marginBottom: 8 }}>by {c.tutorId.name}</p>
                  )}

                  <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Created {new Date(c.createdAt).toLocaleDateString()}</p>

                  {/* Manage Sessions only available to the owner */}
                  {owned ? (
                    <Link to={`/tutor/dashboard/courses/${c._id}`}>
                      <button className="btn btn-primary btn-sm btn-full"><FiList size={14} /> Manage Sessions</button>
                    </Link>
                  ) : (
                    <button className="btn btn-outline btn-sm btn-full" disabled style={{ opacity: .5, cursor: 'not-allowed' }}>
                      <FiLock size={13} /> Not Your Course
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
