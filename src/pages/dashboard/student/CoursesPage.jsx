import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentAPI } from '../../../services/student/api';
import { FiKey, FiCheckCircle, FiBook, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function CoursesPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [verifiedCombo, setVerifiedCombo] = useState(null);
  const [form, setForm] = useState({
    name: '',
    rollNumber: '',
    department: '',
    collegeName: '',
    collegeCode: '',
    year: '',
    enrollmentCode: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.rollNumber || !form.department || !form.collegeName || !form.collegeCode || !form.year || !form.enrollmentCode) {
      toast.error('Please fill all fields.');
      return;
    }

    // NOTE: Combo enrollment codes are randomly generated (e.g. COMBO-F638A9) and do
    // NOT encode a roll-number prefix. There used to be a frontend pre-check here
    // that compared the roll number against that random code and returned early
    // with toast.error('Incorrect') when it didn't match — which meant the API call
    // never even fired, and every student saw "Incorrect" regardless of whether the
    // enrollment code itself was valid. Removed; the backend is the single source
    // of truth for whether a code is valid.

    setSubmitting(true);
    try {
      const res = await enrollmentAPI.verifyCombo(form);
      toast.success('Verification successful! Proceed to payment.');
      setVerifiedCombo(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Incorrect');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedToPayment = () => {
    navigate(`/dashboard/courses/${verifiedCombo.comboOfferId}?code=${form.enrollmentCode}`);
  };

  if (verifiedCombo) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px', minHeight: 'calc(100vh - 100px)' }}>
        <div className="card anim-scale-in" style={{ width: '100%', maxWidth: 500, padding: '40px', borderRadius: 16, boxShadow: '0 10px 40px rgba(76, 29, 149, 0.12)', background: '#fff', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FiCheckCircle size={32} color="#059669" />
          </div>
          <h2 style={{ fontSize: 24, color: '#1f2937', marginBottom: 8, fontWeight: 700 }}>Student Verified ✓</h2>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>You have successfully verified your code and are eligible for the following Combo Offer:</p>
          
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 24, marginBottom: 24, textAlign: 'left' }}>
             <h3 style={{ fontSize: 18, fontWeight: 700, color: '#4c1d95', marginBottom: 6 }}>🎁 {verifiedCombo.comboOffer.title}</h3>
             <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{verifiedCombo.comboOffer.description}</p>
             <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, fontSize: 13, color: '#475569', fontWeight: 600 }}>
                <FiBook size={14} color="#7c3aed" /> Includes {verifiedCombo.comboOffer.bundledCoursesCount} Courses
             </div>
             <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>Total Price</span>
                <span style={{ fontSize: 22, color: '#1f2937', fontWeight: 800 }}>₹{verifiedCombo.comboOffer.price}</span>
             </div>
          </div>

          <button onClick={handleProceedToPayment} className="btn btn-primary btn-full btn-lg" style={{ fontSize: 15, padding: '14px', borderRadius: 10 }}>
            Proceed to Payment <FiArrowRight size={16} />
          </button>
          
          <button onClick={() => setVerifiedCombo(null)} className="btn btn-ghost btn-sm" style={{ marginTop: 16, color: '#9ca3af' }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px', minHeight: 'calc(100vh - 100px)' }}>
      <div className="card anim-fade-up" style={{ width: '100%', maxWidth: 700, padding: '40px', borderRadius: 16, boxShadow: '0 10px 30px rgba(76, 29, 149, 0.08)', background: '#fff' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #ede9fe, #c4b5fd)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FiKey size={32} color="#7c3aed" />
          </div>
          <h2 style={{ fontSize: 28, color: '#4c1d95', marginBottom: 10, fontWeight: 700 }}>Student Course Enrollment</h2>
          <p style={{ color: '#6b7280', fontSize: 15 }}>Enter your details and the Combo Offer code provided by your institution.</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 6, display: 'block' }}>Name *</label>
              <input style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 14 }} value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Enter your full name" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 6, display: 'block' }}>Roll Number *</label>
              <input style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 14 }} value={form.rollNumber} onChange={e => setForm({...form, rollNumber: e.target.value})} placeholder="Enter your roll number" required />
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 6, display: 'block' }}>Department *</label>
              <input style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 14 }} value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Computer Science" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 6, display: 'block' }}>College Name *</label>
              <input style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 14 }} value={form.collegeName} onChange={e => setForm({...form, collegeName: e.target.value})} placeholder="Enter your college name" required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 6, display: 'block' }}>College Code *</label>
              <input style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', fontSize: 14 }} value={form.collegeCode} onChange={e => setForm({...form, collegeCode: e.target.value})} placeholder="Enter college code" required />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 6, display: 'block' }}>Year *</label>
              <select style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#f9fafb', height: '46px', fontSize: 14 }} value={form.year} onChange={e => setForm({...form, year: e.target.value})} required>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#4b5563', marginBottom: 6, display: 'block' }}>Enrollment Code *</label>
            <input style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px dashed #7c3aed', background: '#f5f3ff', fontFamily: 'monospace', letterSpacing: '2px', textTransform: 'uppercase', color: '#4c1d95', fontWeight: 700, fontSize: 16 }} value={form.enrollmentCode} onChange={e => setForm({...form, enrollmentCode: e.target.value.toUpperCase()})} placeholder="e.g. COMBO-8F4K2P" required />
          </div>

          <div style={{ marginTop: 16 }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 16, fontWeight: 600, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', border: 'none', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)', color: '#fff', cursor: 'pointer' }} disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify & Continue'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
}