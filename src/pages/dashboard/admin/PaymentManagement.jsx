import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/admin/api';
import { 
  FiCheckCircle, 
  FiXCircle, 
  FiClock, 
  FiCopy, 
  FiCheck, 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiUser, 
  FiBook 
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPayments();
      setPayments(res.data || []);
    } catch (err) {
      console.error('Fetch payments error:', err);
      toast.error('Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleApprove = async (payment) => {
    if (!window.confirm(`Approve payment of ₹${payment.amount} (UTR: ${payment.utr}) for ${payment.studentId?.name || 'Student'}? This will immediately activate the student's course enrollment.`)) {
      return;
    }

    setProcessingAction(true);
    try {
      const res = await adminAPI.approvePayment(payment._id);
      toast.success(res.data?.message || 'Payment approved and student enrolled!');
      fetchPayments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to approve payment.';
      toast.error(msg);
    } finally {
      setProcessingAction(false);
    }
  };

  const openRejectModal = (payment) => {
    setSelectedPayment(payment);
    setRejectionReason('Payment not received in bank account / Invalid UTR reference.');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;

    setProcessingAction(true);
    try {
      const res = await adminAPI.rejectPayment(selectedPayment._id, rejectionReason.trim());
      toast.success(res.data?.message || 'Payment rejected.');
      setRejectModalOpen(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to reject payment.';
      toast.error(msg);
    } finally {
      setProcessingAction(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      toast.success('UTR copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // Metrics Calculations
  const pendingCount = payments.filter(p => p.status === 'pending').length;
  const approvedCount = payments.filter(p => p.status === 'approved' || p.status === 'paid').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;
  const totalRevenue = payments
    .filter(p => p.status === 'approved' || p.status === 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Filter & Search Logic
  const filteredPayments = payments.filter(p => {
    const matchesTab = 
      activeTab === 'all' ? true :
      activeTab === 'pending' ? p.status === 'pending' :
      activeTab === 'approved' ? (p.status === 'approved' || p.status === 'paid') :
      activeTab === 'rejected' ? p.status === 'rejected' : true;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (p.utr && p.utr.toLowerCase().includes(q)) ||
      (p.studentId?.name && p.studentId.name.toLowerCase().includes(q)) ||
      (p.studentId?.email && p.studentId.email.toLowerCase().includes(q)) ||
      (p.courseId?.title && p.courseId.title.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Payment Verification & Management</h1>
          <p style={{ color: '#6b7280', fontSize: 13.5 }}>Review direct UPI transactions, verify 12-digit UTR numbers, and activate student course access.</p>
        </div>
        <button 
          onClick={fetchPayments} 
          disabled={loading || processingAction} 
          className="btn btn-outline btn-sm"
          style={{ gap: 6 }}
        >
          <FiRefreshCw size={13} className={loading ? 'spinner' : ''} /> Refresh List
        </button>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiClock size={22} color="#d97706" />
          </div>
          <div>
            <p style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Pending Verification</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{pendingCount}</p>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiCheckCircle size={22} color="#15803d" />
          </div>
          <div>
            <p style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Approved Payments</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#15803d' }}>{approvedCount}</p>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiXCircle size={22} color="#b91c1c" />
          </div>
          <div>
            <p style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Rejected</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#b91c1c' }}>{rejectedCount}</p>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '18px 20px', borderRadius: 14, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaRupeeSign size={20} color="#7c3aed" />
          </div>
          <div>
            <p style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Total Revenue</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#6d28d9' }}>₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 14, border: '1px solid #e5e7eb', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Payments', count: payments.length },
            { id: 'pending', label: 'Pending Approval', count: pendingCount },
            { id: 'approved', label: 'Approved', count: approvedCount },
            { id: 'rejected', label: 'Rejected', count: rejectedCount },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeTab === tab.id ? '#4f46e5' : '#f3f4f6',
                color: activeTab === tab.id ? '#fff' : '#4b5563',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              {tab.label}
              <span style={{
                fontSize: 11,
                padding: '2px 6px',
                borderRadius: 99,
                background: activeTab === tab.id ? 'rgba(255,255,255,0.25)' : '#e5e7eb',
                color: activeTab === tab.id ? '#fff' : '#374151'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260 }}>
          <FiSearch size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by UTR, student, course…"
            style={{
              paddingLeft: 34,
              fontSize: 13,
              borderRadius: 9,
              border: '1px solid #d1d5db',
              width: '100%',
              paddingTop: 8,
              paddingBottom: 8
            }}
          />
        </div>
      </div>

      {/* Payments Table */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div className="spinner spinner-md" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#9ca3af' }}>
            <FaRupeeSign size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>No payments found.</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>There are no payments matching your current filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5, whiteSpace: 'nowrap' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid #e5e7eb', color: '#4b5563', fontSize: 12, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Student</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Course</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>12-Digit UTR</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Submitted Date</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(p => {
                  const isPending = p.status === 'pending';
                  const isApproved = p.status === 'approved' || p.status === 'paid';
                  const isRejected = p.status === 'rejected';

                  return (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}>
                      {/* Student info */}
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ede9fe', color: '#6d28d9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                            {p.studentId?.name ? p.studentId.name[0].toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{p.studentId?.name || 'Unknown Student'}</p>
                            <p style={{ fontSize: 11.5, color: '#6b7280', margin: 0 }}>{p.studentId?.email || '—'}</p>
                          </div>
                        </div>
                      </td>

                      {/* Course */}
                      <td style={{ padding: '14px 8px' }}>
                        <p style={{ fontWeight: 600, color: '#374151', margin: 0 }}>{p.courseId?.title || '—'}</p>
                        {p.metadata?.couponCode && (
                          <span style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 2 }}>
                            Coupon: {p.metadata.couponCode}
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 8px' }}>
                        <span style={{ fontWeight: 700, color: '#111827', fontSize: 14.5 }}>₹{p.amount}</span>
                      </td>

                      {/* UTR */}
                      <td style={{ padding: '14px 8px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f5f3ff', padding: '4px 10px', borderRadius: 8, border: '1px solid #ddd6fe' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#4c1d95', fontSize: 13, letterSpacing: '0.04em' }}>
                            {p.utr}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.utr, p._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c3aed', padding: 2, display: 'flex' }}
                            title="Copy UTR"
                          >
                            {copiedId === p._id ? <FiCheck size={13} color="#059669" /> : <FiCopy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Submitted Date */}
                      <td style={{ padding: '14px 8px', color: '#6b7280', fontSize: 12.5 }}>
                        {new Date(p.submittedAt || p.createdAt).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 8px' }}>
                        {isPending && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600 }}>
                            <FiClock size={12} /> Pending Approval
                          </span>
                        )}
                        {isApproved && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 600 }}>
                            <FiCheckCircle size={12} /> Approved
                          </span>
                        )}
                        {isRejected && (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 99, background: '#fee2e2', color: '#b91c1c', fontSize: 12, fontWeight: 600 }}>
                              <FiXCircle size={12} /> Rejected
                            </span>
                            {p.rejectionReason && (
                              <p style={{ fontSize: 11, color: '#dc2626', margin: '3px 0 0 0', maxWidth: 160, lineHeight: 1.3 }}>
                                {p.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              onClick={() => handleApprove(p)}
                              disabled={processingAction}
                              className="btn btn-sm"
                              style={{
                                background: '#10b981',
                                color: '#fff',
                                padding: '6px 12px',
                                fontSize: 12,
                                borderRadius: 8,
                                gap: 4
                              }}
                              title="Approve and Activate Course Enrollment"
                            >
                              <FiCheck size={13} /> Approve
                            </button>
                            <button
                              onClick={() => openRejectModal(p)}
                              disabled={processingAction}
                              className="btn btn-sm btn-danger"
                              style={{
                                padding: '6px 12px',
                                fontSize: 12,
                                borderRadius: 8,
                                gap: 4
                              }}
                              title="Reject Payment"
                            >
                              <FiX size={13} /> Reject
                            </button>
                          </div>
                        ) : isApproved ? (
                          <span style={{ fontSize: 11.5, color: '#10b981', fontWeight: 500 }}>
                            Enrolled ({p.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString() : 'Active'})
                          </span>
                        ) : (
                          <span style={{ fontSize: 11.5, color: '#9ca3af' }}>No action needed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && selectedPayment && (
        <div className="modal-overlay">
          <div className="card modal-box" style={{ maxWidth: 480, padding: '28px 26px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiAlertCircle size={20} color="#dc2626" />
                <h3 style={{ fontSize: 18, color: '#991b1b', margin: 0, fontWeight: 700 }}>Reject Payment</h3>
              </div>
              <button 
                className="btn btn-ghost" 
                style={{ padding: 4 }} 
                onClick={() => setRejectModalOpen(false)}
              >
                <FiX size={18} />
              </button>
            </div>

            <p style={{ color: '#4b5563', fontSize: 13.5, marginBottom: 16, lineHeight: 1.5 }}>
              Rejecting payment for <strong>{selectedPayment.studentId?.name || 'Student'}</strong> (₹{selectedPayment.amount} - UTR: <span style={{ fontFamily: 'monospace' }}>{selectedPayment.utr}</span>). Please specify a reason for the student.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="form-group" style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR number not found in our bank records. Please provide a valid transaction ID."
                  required
                  style={{ width: '100%', fontSize: 13, padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setRejectModalOpen(false)}
                  disabled={processingAction}
                  style={{ padding: '7px 16px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction || !rejectionReason.trim()}
                  className="btn btn-danger"
                  style={{ padding: '7px 18px', fontSize: 13, gap: 6 }}
                >
                  {processingAction ? 'Rejecting…' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
