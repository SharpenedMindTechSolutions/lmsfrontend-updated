import { useState, useEffect } from 'react';
import { paymentAPI } from '../../../services/student/api';
import { FiClock, FiCheckCircle, FiXCircle, FiCreditCard, FiAlertCircle, FiTag } from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

export default function PaymentHistory() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        paymentAPI.myPayments()
            .then(res => setPayments(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
            <div className="spinner spinner-md" />
        </div>
    );

    return (
        <div>
            {/* Header / Hero */}
            <div className="card anim-fade-up" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 40%, #7c3aed 100%)', border: 'none', overflow: 'hidden', position: 'relative', padding: '30px 32px' }}>
                <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
                <div style={{ position: 'absolute', bottom: -50, right: 40, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', padding: '5px 14px', borderRadius: 99, marginBottom: 14 }}>
                        <FiCreditCard size={13} color="white" />
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>Billing</span>
                    </div>
                    <h1 style={{ color: '#fff', fontSize: 26, marginBottom: 8, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}>Payment History</h1>
                    <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 14 }}>View all your past UPI transactions and course enrollment payments.</p>
                </div>
            </div>

            {/* Content Table */}
            <div className="card anim-fade-up" style={{ padding: '24px', animationDelay: '.1s' }}>
                {payments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <FaRupeeSign size={28} color="#9ca3af" />
                        </div>
                        <h3 style={{ fontSize: 18, color: '#374151', fontWeight: 600, marginBottom: 8 }}>No payments yet</h3>
                        <p style={{ color: '#6b7280', fontSize: 14 }}>You haven't submitted any course purchases so far.</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                                    <th style={{ padding: '16px 12px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                    <th style={{ padding: '16px 12px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course</th>
                                    <th style={{ padding: '16px 12px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                                    <th style={{ padding: '16px 12px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Method</th>
                                    <th style={{ padding: '16px 12px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                    <th style={{ padding: '16px 12px', color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>12-Digit UTR / Ref</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payments.map((payment, index) => {
                                    const isApproved = payment.status === 'approved' || payment.status === 'paid';
                                    const isPending = payment.status === 'pending';
                                    const isRejected = payment.status === 'rejected';

                                    return (
                                        <tr key={payment._id} style={{ borderBottom: index === payments.length - 1 ? 'none' : '1px solid #f3f4f6', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{ padding: '18px 12px', fontSize: 13.5, color: '#4b5563' }}>
                                                {new Date(payment.submittedAt || payment.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                            </td>
                                            <td style={{ padding: '18px 12px', fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                                                <div>{payment.courseId?.title || 'Unknown Course'}</div>
                                                {payment.metadata?.couponCode && (
                                                    <span style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '2px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4 }}>
                                                        <FiTag size={10} /> {payment.metadata.couponCode}
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ padding: '18px 12px', fontSize: 15, fontWeight: 700, color: isApproved ? '#059669' : '#1f2937' }}>
                                                ₹{payment.amount}
                                            </td>
                                            <td style={{ padding: '18px 12px', fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
                                                {payment.paymentMethod || 'UPI'}
                                            </td>
                                            <td style={{ padding: '18px 12px' }}>
                                                {isApproved && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', background: '#d1fae5', color: '#047857', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                                                        <FiCheckCircle size={13} /> Approved
                                                    </span>
                                                )}
                                                {isPending && (
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', background: '#fef3c7', color: '#b45309', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                                                        <FiClock size={13} /> Pending Verification
                                                    </span>
                                                )}
                                                {isRejected && (
                                                    <div>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px', background: '#fee2e2', color: '#b91c1c', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                                                            <FiXCircle size={13} /> Rejected
                                                        </span>
                                                        {payment.rejectionReason && (
                                                            <p style={{ fontSize: 11, color: '#dc2626', margin: '4px 0 0 0', maxWidth: 180, lineHeight: 1.3 }}>
                                                                {payment.rejectionReason}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ padding: '18px 12px', fontSize: 13, color: '#4c1d95', fontFamily: 'monospace', fontWeight: 600 }}>
                                                {payment.utr || payment.paymentId || payment.orderId || '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
