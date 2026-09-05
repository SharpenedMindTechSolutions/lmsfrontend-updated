import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { enrollmentAPI, paymentAPI } from '../../services/student/api';
import { 
  FiLock, 
  FiArrowLeft, 
  FiKey, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiTag, 
  FiClock, 
  FiCopy, 
  FiCheck,
  FiSend
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function EnrollmentGate({ courseId, course, children }) {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentCodeParam = searchParams.get('code');

  const [status, setStatus] = useState('checking'); // 'checking' | 'granted' | 'required'
  const [code, setCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [utrNumber, setUtrNumber] = useState('');
  const [pendingPayment, setPendingPayment] = useState(null);
  const [rejectedPayment, setRejectedPayment] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const upiId = '322436613424215@cnrb'; // Default Merchant UPI ID

  // Check enrollment and payment status
  const checkEnrollment = useCallback(async () => {
    setStatus('checking');
    setError('');
    try {
      const { data } = await enrollmentAPI.check(courseId);
      if (data.verified) {
        setStatus('granted');
        return;
      }

      // Check if student has a submitted UPI payment
      try {
        const payRes = await paymentAPI.getStatus(courseId);
        const latestPay = payRes.data?.payment;
        if (latestPay) {
          if (latestPay.status === 'pending') {
            setPendingPayment(latestPay);
            setRejectedPayment(null);
          } else if (latestPay.status === 'rejected') {
            setRejectedPayment(latestPay);
            setPendingPayment(null);
          } else if (latestPay.status === 'approved' || latestPay.status === 'paid') {
            setStatus('granted');
            return;
          }
        }
      } catch (e) {
        console.error('Payment status check error:', e);
      }

      setStatus('required');
    } catch (err) {
      setStatus('required');
    }
  }, [courseId]);

  useEffect(() => { 
    checkEnrollment(); 
  }, [checkEnrollment]);

  // Handle Free Course Code Enrollment
  const handleCodeSubmit = async e => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Please enter the enrollment code.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await enrollmentAPI.verify(courseId, trimmed);
      setSuccess(true);
      toast.success(data.alreadyEnrolled ? 'Welcome back! Access granted.' : 'Enrollment verified! Welcome to the course.');
      setTimeout(() => setStatus('granted'), 1000);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Coupon Validation
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    setError('');
    setValidatingCoupon(true);
    try {
      const res = await paymentAPI.validateCoupon({
        courseId,
        couponCode: couponCode.trim().toUpperCase()
      });
      setAppliedCoupon(res.data);
      toast.success(`Coupon applied! ${res.data.discountPercentage}% discount added.`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired coupon code';
      toast.error(msg);
      setAppliedCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  // Calculate Payable Amount
  const originalPrice = course?.price || 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const payableAmount = Math.max(0, originalPrice - discountAmount);

  // Generate dynamic UPI Payment Link / QR data
  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=SharpenedMind%20LMS&am=${payableAmount}&cu=INR&tn=Course-${encodeURIComponent(course?.title ? course.title.slice(0, 15) : 'Payment')}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}&color=4c1d95&bgcolor=ffffff`;

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId).then(() => {
      setCopiedUpi(true);
      toast.success('UPI ID copied to clipboard!');
      setTimeout(() => setCopiedUpi(false), 2000);
    });
  };

  // Handle UPI Payment Proof (UTR) Submission
  const handleUpiSubmit = async (e) => {
    e.preventDefault();
    const cleanUtr = utrNumber.trim().toUpperCase();

    if (!cleanUtr) {
      setError('Please enter the 12-digit UTR / Reference number from your payment app.');
      return;
    }

    if (cleanUtr.length < 6 || cleanUtr.length > 30) {
      setError('Please enter a valid 12-digit UPI UTR / Reference number.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const payload = {
        courseId,
        utr: cleanUtr,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined
      };
      // Send enrollmentCode if this is a combo offer
      if (course?.isComboOffer && enrollmentCodeParam) {
        payload.enrollmentCode = enrollmentCodeParam;
      }

      const res = await paymentAPI.submitUpi(payload);

      toast.success('Payment submitted successfully! Waiting for admin verification.');
      setPendingPayment(res.data.payment);
      setRejectedPayment(null);
      setUtrNumber('');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit payment proof. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <div className="spinner spinner-md" />
        <p style={{ color: '#9ca3af', fontSize: 14 }}>Checking course access…</p>
      </div>
    );
  }

  if (status === 'granted') return children;

  const isPaid = course?.isPaid && course?.price > 0;

  // ENFORCE COMBOS REQUIRE VERIFICATION CODE TO EVEN SEE THE PAYMENT UI
  if (course?.isComboOffer && !enrollmentCodeParam) {
    return (
      <div style={{ maxWidth: 580, margin: '40px auto', padding: '20px 16px', textAlign: 'center' }}>
        <div className="card anim-scale-in" style={{ padding: '40px 20px', borderRadius: 16, border: '1px solid #fecaca', background: '#fef2f2' }}>
          <FiAlertCircle size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: 22, color: '#991b1b', marginBottom: 12, fontWeight: 700 }}>Verification Code Required</h2>
          <p style={{ color: '#b91c1c', fontSize: 15, marginBottom: 24, lineHeight: 1.5 }}>
            You cannot directly pay for a Combo Offer. Please go to the Courses page and verify your Student Enrollment Code first.
          </p>
          <button className="btn btn-primary" onClick={() => nav('/dashboard/courses')} style={{ background: '#dc2626', border: 'none' }}>
            Go to Courses Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto', padding: '20px 16px' }}>
      <button className="btn btn-ghost" onClick={() => nav('/dashboard/courses')} style={{ marginBottom: 24, padding: '6px 0', gap: 6 }}>
        <FiArrowLeft size={16} /> Back to Courses
      </button>

      <div className="card anim-scale-in" style={{ overflow: 'hidden', boxShadow: '0 10px 40px rgba(76, 29, 149, 0.12)' }}>
        {/* Header Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 45%, #7c3aed 100%)',
          padding: 'clamp(22px, 5vw, 36px) clamp(18px, 5vw, 32px)',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.07)' }} />
          <div style={{ position: 'absolute', bottom: -60, left: 30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,.15)',
              backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <FiLock size={26} color="white" />
            </div>
            <h1 style={{ color: '#fff', fontSize: 24, marginBottom: 8, fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 700 }}>
              Enrollment Required
            </h1>
            {course?.title && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', padding: '5px 14px', borderRadius: 99 }}>
                <span style={{ color: 'rgba(255,255,255,.95)', fontSize: 13, fontWeight: 500 }}>{course.title}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: 'clamp(20px, 4vw, 32px) clamp(16px, 4vw, 32px)' }}>
          {isPaid ? (
            <>
              {/* ── Pending Verification State ── */}
              {pendingPayment ? (
                <div style={{ textAlign: 'center', padding: '12px 4px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%', background: '#fef3c7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
                  }}>
                    <FiClock size={32} color="#d97706" />
                  </div>

                  <h3 style={{ fontSize: 20, color: '#92400e', marginBottom: 8, fontWeight: 700 }}>
                    Payment Pending Verification
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 20, maxWidth: 440, margin: '0 auto 20px' }}>
                    Your payment of <strong>₹{pendingPayment.amount}</strong> with UTR <strong style={{ letterSpacing: '0.05em', color: '#4c1d95' }}>{pendingPayment.utr}</strong> has been submitted. The admin is verifying your transaction.
                  </p>

                  <div style={{
                    background: '#faf5ff', border: '1.5px dashed #c4b5fd', borderRadius: 14,
                    padding: '16px 20px', marginBottom: 24, textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>Transaction Reference (UTR):</span>
                      <strong style={{ color: '#4c1d95', fontFamily: 'monospace', fontSize: 14 }}>{pendingPayment.utr}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>Submitted On:</span>
                      <span style={{ color: '#374151' }}>{new Date(pendingPayment.submittedAt || pendingPayment.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: '#6b7280' }}>Status:</span>
                      <span className="badge badge-warn" style={{ fontSize: 11 }}>Waiting for Admin Approval</span>
                    </div>
                  </div>

                  <button onClick={checkEnrollment} className="btn btn-primary btn-full" style={{ gap: 8 }}>
                    <FiRefreshCw size={15} /> Check Verification Status
                  </button>
                </div>
              ) : (
                /* ── UPI Payment Flow ── */
                <div>
                  {rejectedPayment && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20,
                      padding: '14px 16px', borderRadius: 12, background: '#fef2f2', border: '1.5px solid #fecaca'
                    }}>
                      <FiAlertCircle size={18} color="#dc2626" style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 13, color: '#991b1b', marginBottom: 2 }}>Previous Payment Rejected</p>
                        <p style={{ fontSize: 12, color: '#b91c1c', lineHeight: 1.4 }}>
                          Reason: {rejectedPayment.rejectionReason || 'Invalid UTR or payment not received.'} Please pay and enter the correct 12-digit UTR.
                        </p>
                      </div>
                    </div>
                  )}

                  <p style={{ color: '#6b7280', fontSize: 13.5, lineHeight: 1.6, marginBottom: 18 }}>
                    Scan the QR code below using any UPI app (Google Pay, PhonePe, Paytm, BHIM) to complete your payment, then enter the 12-digit UTR number.
                  </p>

                  {/* Price & Coupon Card */}
                  <div style={{
                    background: '#fbfbfe', padding: '16px 20px', borderRadius: '14px',
                    marginBottom: '20px', border: '1.5px solid #ede9fe'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: appliedCoupon ? 8 : 0 }}>
                      <span style={{ fontSize: 15, color: '#4b5563', fontWeight: 500 }}>Course Price</span>
                      <span style={{ fontSize: 18, color: appliedCoupon ? '#9ca3af' : '#1f2937', fontWeight: 700, textDecoration: appliedCoupon ? 'line-through' : 'none' }}>
                        ₹{originalPrice}
                      </span>
                    </div>

                    {appliedCoupon && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13 }}>
                          <span style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                            <FiTag size={12} /> Coupon ({appliedCoupon.code} - {appliedCoupon.discountPercentage}% OFF)
                          </span>
                          <span style={{ color: '#059669', fontWeight: 600 }}>-₹{discountAmount}</span>
                        </div>
                        <div style={{ borderTop: '1px dashed #c4b5fd', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 15, color: '#4c1d95', fontWeight: 700 }}>Final Payable Amount</span>
                          <span style={{ fontSize: 24, color: '#4c1d95', fontWeight: 800 }}>₹{payableAmount}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Coupon Code Input */}
                  {!appliedCoupon ? (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Have a Coupon Code?"
                        style={{ flex: 1, textTransform: 'uppercase', fontSize: 13, padding: '9px 14px' }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={validatingCoupon || !couponCode.trim()}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0 16px', borderRadius: 10 }}
                      >
                        {validatingCoupon ? 'Checking…' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '8px 14px', borderRadius: 10, marginBottom: 20 }}>
                      <span style={{ color: '#047857', fontSize: 12.5, fontWeight: 600 }}>Coupon applied: {appliedCoupon.code}</span>
                      <button type="button" onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                    </div>
                  )}

                  {/* QR Code Presentation */}
                  <div style={{
                    background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
                    border: '1.5px solid #e2e8f0', borderRadius: 18, padding: '22px 18px', textAlign: 'center', marginBottom: 22
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
                      Scan QR Code to Pay ₹{payableAmount}
                    </p>

                    <div style={{
                      display: 'inline-block', background: '#fff', padding: '12px',
                      borderRadius: 14, boxShadow: '0 4px 18px rgba(0,0,0,0.06)', marginBottom: 14
                    }}>
                      <img
                        src={qrCodeUrl}
                        alt="UPI QR Code"
                        style={{ width: 190, height: 190, display: 'block', borderRadius: 8 }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, color: '#475569' }}>UPI ID:</span>
                      <strong style={{ fontSize: 13.5, color: '#1e293b', fontFamily: 'monospace' }}>{upiId}</strong>
                      <button
                        type="button"
                        onClick={copyUpi}
                        className="btn btn-ghost btn-xs"
                        style={{ padding: '3px 8px', color: '#7c3aed', gap: 4 }}
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <><FiCheck size={12} color="#059669" /> Copied</> : <><FiCopy size={12} /> Copy</>}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 10, opacity: 0.85 }}>
                      <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Accepted Apps: GPay • PhonePe • Paytm • BHIM  By </span>
                    </div>
                  </div>

                  {/* UTR Input Form */}
                  <form onSubmit={handleUpiSubmit}>
                    <div className="form-group" style={{ marginBottom: 18 }}>
                      <label htmlFor="utrInput" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, color: '#1f2937' }}>
                        <FaRupeeSign size={13} color="#7c3aed" /> Enter 12-Digit UPI Reference / UTR Number *
                      </label>
                      <input
                        id="utrInput"
                        type="text"
                        value={utrNumber}
                        onChange={e => {
                          setUtrNumber(e.target.value.toUpperCase());
                          setError('');
                        }}
                        placeholder="e.g. 408212345678"
                        maxLength={30}
                        disabled={submitting}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 16,
                          letterSpacing: '0.08em',
                          fontWeight: 600,
                          textAlign: 'center',
                          padding: '12px 14px'
                        }}
                      />
                      <span style={{ fontSize: 11.5, color: '#9ca3af', display: 'block', marginTop: 4 }}>
                        You will receive this 12-digit reference number in your UPI App receipt after payment.
                      </span>
                    </div>

                    {error && (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, padding: '11px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                        <FiAlertCircle size={16} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                        <p style={{ fontSize: 12.5, color: '#991b1b', lineHeight: 1.45 }}>{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !utrNumber.trim()}
                      className="btn btn-primary btn-full btn-lg"
                      style={{ gap: 8, fontSize: 15 }}
                    >
                      {submitting ? (
                        <><span className="spinner spinner-xs" /> Submitting Payment Proof…</>
                      ) : (
                        <><FiSend size={15} /> Submit Payment for Verification</>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            /* ── Free Course Code Flow ── */
            <>
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                This course requires an enrollment code. Your tutor should have shared a unique code with you.
              </p>
              <form onSubmit={handleCodeSubmit} autoComplete="off">
                <div className="form-group">
                  <label htmlFor="enrollCode" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiKey size={13} color="#7c3aed" /> Enrollment Code
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="enrollCode" type="text" value={code} onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
                      placeholder="e.g. A3F7B2C1" maxLength={12} disabled={submitting || success}
                      style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center' }}
                    />
                  </div>
                  {error && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 10, padding: '10px 13px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca' }}>
                      <FiAlertCircle size={15} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: '#991b1b', lineHeight: 1.5 }}>{error}</p>
                    </div>
                  )}
                  {success && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 10, padding: '10px 13px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                      <FiCheckCircle size={15} color="#059669" style={{ flexShrink: 0 }} />
                      <p style={{ fontSize: 13, color: '#166534' }}>Code verified! Redirecting you…</p>
                    </div>
                  )}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={submitting || success || !code.trim()} style={{ marginTop: 6 }}>
                  {submitting ? <><span className="spinner spinner-xs" /> Verifying…</> : success ? <><FiCheckCircle size={16} /> Access Granted!</> : <><FiKey size={16} /> Unlock Course</>}
                </button>
              </form>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={checkEnrollment} style={{ color: '#7c3aed', gap: 6 }}>
              <FiRefreshCw size={13} /> Re-check my enrollment status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
