import { useEffect, useState, useRef } from 'react';
import { certificateAPI } from '../../services/student/api';
import { FiDownload, FiExternalLink, FiAward, FiCheckCircle } from 'react-icons/fi';

function CertificateGenerator({ courseId }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await certificateAPI.byCourse(courseId);
        if (res.data?.certificate) {
          setCert(res.data.certificate);
        }
      } catch (err) {
        // 404 means not generated yet
        console.log("Certificate not available yet", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [courseId]);

  if (loading) {
    return null;
  }

  if (!cert) {
    return null; // Don't show anything if cert doesn't exist
  }

  const verifyUrl = `${window.location.origin}/verify/${cert.certificateId}`;

  const handlePrint = () => {
    window.open(verifyUrl, '_blank');
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)',
      border: '1px solid rgba(16,185,129,0.3)',
      borderRadius: '16px',
      padding: '24px',
      marginTop: '32px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '12px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 20px rgba(16,185,129,0.3)'
        }}>
          <FiAward size={24} color="#fff" />
        </div>
        <div>
          <h3 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            Course Completed <FiCheckCircle color="#34d399" size={16} />
          </h3>
          <p style={{ color: '#a7f3d0', fontSize: '14px', margin: '4px 0 0' }}>
            You have successfully completed this course and earned a certificate.
          </p>
        </div>
      </div>

      <div style={{ 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '12px', 
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Certificate ID</p>
            <p style={{ color: '#fff', fontSize: '15px', fontWeight: 600, fontFamily: 'monospace', margin: '0 0 12px' }}>
              {cert.certificateId}
            </p>
            
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Issued On</p>
            <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, margin: 0 }}>
              {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handlePrint}
            style={{
              background: '#10b981', color: '#fff', border: 'none',
              padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#059669'}
            onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
          >
            <FiExternalLink /> Verify & View
          </button>
        </div>
      </div>
    </div>
  );
}

export default CertificateGenerator;
