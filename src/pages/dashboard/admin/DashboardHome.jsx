import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../../services/admin/api';
import { FiUsers, FiBook, FiActivity, FiArrowRight, FiClock, FiCheckCircle } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getMetrics()
      .then(res => setMetrics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 14 }}>
        <div className="spinner spinner-md" />
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading analytics & metrics...</p>
      </div>
    );
  }

  const cards = [
    { title: 'Total Revenue', value: `₹${metrics?.totalRevenue || 0}`, icon: FaRupeeSign, color: '#10b981', bg: '#ecfdf5' },
    { title: "Today's Revenue", value: `₹${metrics?.todaysRevenue || 0}`, icon: FaRupeeSign, color: '#06b6d4', bg: '#ecfeff' },
    { title: 'Pending Verifications', value: metrics?.pendingPaymentsCount || 0, icon: FiClock, color: '#f59e0b', bg: '#fffbeb' },
    { title: 'Total Enrollments', value: metrics?.totalEnrollments || 0, icon: FiCheckCircle, color: '#8b5cf6', bg: '#f5f3ff' },
    { title: 'Total Students', value: metrics?.totalStudents || 0, icon: FiUsers, color: '#3b82f6', bg: '#eff6ff' },
    { title: 'Total Tutors', value: metrics?.totalTutors || 0, icon: FiUsers, color: '#ec4899', bg: '#fdf2f8' },
    { title: 'Total Courses', value: metrics?.totalCourses || 0, icon: FiBook, color: '#f97316', bg: '#fff7ed' },
    { title: 'Successful Payments', value: metrics?.successfulPaymentsCount || 0, icon: FiActivity, color: '#6366f1', bg: '#eef2ff' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div className="card hero-card" style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)',
        color: '#fff',
        padding: '28px 32px',
        borderRadius: 20,
        boxShadow: '0 8px 30px rgba(109,40,217,0.22)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <span style={{ background: 'rgba(255,255,255,0.18)', padding: '3px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, letterSpacing: '.04em' }}>
            SUPER ADMIN DASHBOARD
          </span>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginTop: 8, marginBottom: 4, color: '#fff' }}>
            Platform Overview & Approvals
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
            Monitor student enrollments, course payments, and approve UPI transactions in real-time.
          </p>
        </div>

        <Link
          to="/admin/dashboard/payments"
          className="btn"
          style={{ background: '#fff', color: '#6d28d9', fontWeight: 700, padding: '12px 22px', borderRadius: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.1)' }}
        >
          Manage UPI Payments <FiArrowRight size={16} />
        </Link>
      </div>

      {/* Metrics Grid */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1f2937', marginBottom: 14 }}>
          Key Metrics
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 16
        }}>
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="card card-hover"
                style={{
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  borderRadius: 16
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: card.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color,
                  flexShrink: 0
                }}>
                  <Icon size={24} />
                </div>
                <div>
                  <p style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600, marginBottom: 2 }}>{card.title}</p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: '#111827' }}>{card.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
